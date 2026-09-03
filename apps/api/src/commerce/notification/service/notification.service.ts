import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NotificationRepository } from '../repository/notification.repository.js';
import { EmailTemplateService } from './email-template.service.js';
import {
    EmailNotificationStatus,
    EmailNotificationEntityType,
    EmailNotificationTriggerType,
} from '../types/notification.types.js';
import type { EnvironmentVariables } from '../../../common/config/env.schema.js';

/**
 * Ports com.bloomscorp.loom.notifire.service.EmailNotificationDispatchService and
 * OrderEmailTriggerService.
 *
 * Loom posts to Bloomsight over HTTP; here the transport is SMTP, but the audit
 * lifecycle is the Java one: a PENDING_SEND row is written first, the send is
 * attempted once, and the row is then transitioned to POST_SUCCESS /
 * POST_FAILED / POST_ERROR with the measured latency.
 *
 * The transport is env-driven and FAILS CLOSED: with no SMTP_HOST/SMTP_FROM
 * configured no transporter is built, nothing is sent, and the attempt is
 * audited as POST_ERROR. There is no default host, so a test or an unconfigured
 * environment can never reach a real mail server.
 */
@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    private readonly transporter: nodemailer.Transporter | null;
    private readonly from: string;

    constructor(
        private readonly repository: NotificationRepository,
        private readonly templateService: EmailTemplateService,
        private readonly config: ConfigService<EnvironmentVariables, true>,
    ) {
        const host = (this.config.get('SMTP_HOST', { infer: true }) ?? '').trim();
        const user = (this.config.get('SMTP_USER', { infer: true }) ?? '').trim();
        const pass = (this.config.get('SMTP_PASS', { infer: true }) ?? '').trim();
        this.from = (this.config.get('SMTP_FROM', { infer: true }) ?? '').trim();

        // parseInt(...) || 587 would also swallow an explicit 0; Number.isFinite
        // keeps the fallback to the documented default port only for absent or
        // unparseable input.
        const rawPort = (this.config.get('SMTP_PORT', { infer: true }) ?? '').trim();
        const parsedPort = Number.parseInt(rawPort, 10);
        const port = Number.isFinite(parsedPort) ? parsedPort : 587;

        this.transporter = host && this.from
            ? nodemailer.createTransport({
                  host,
                  port,
                  secure: port === 465,
                  ...(user && pass ? { auth: { user, pass } } : {}),
              })
            : null;

        if (!this.transporter) {
            this.logger.warn(
                'SMTP is not configured (SMTP_HOST / SMTP_FROM); outbound email is disabled and every attempt is audited as POST_ERROR.',
            );
        }
    }

    /** True when the environment supplies a usable SMTP configuration. */
    get isConfigured(): boolean {
        return this.transporter !== null;
    }

    /**
     * Ports OrderEmailTriggerService.trigger: reloads the order (and therefore
     * the recipient and tenant) from current database state, then dispatches
     * with the full audit-row lifecycle.
     *
     * @returns false when the order does not exist or has no usable recipient —
     *          Java returns false for a missing order rather than sending.
     */
    async triggerOrderEmail(
        orderId: bigint,
        triggerType: EmailNotificationTriggerType,
    ): Promise<boolean> {
        const target = await this.repository.getOrderEmailTarget(orderId);
        if (!target) return false;

        // sendOrderCancellationEmail: the stored address is used directly only
        // when it actually looks like an address; Loom otherwise runs it through
        // its email encoder, which this service does not have. Rather than send
        // to a ciphertext, skip.
        const recipient = target.email.trim();
        if (!recipient.includes('@')) {
            this.logger.warn(`Order ${orderId} tenant address is not a plain address; not sending.`);
            return false;
        }

        const html = this.templateService.getTemplate(triggerType, {
            orderId: String(orderId),
            customerName: target.userName,
        });

        // Step 1 — PENDING_SEND audit row, before the send (Java's pre-write).
        const now = Date.now();
        let auditId: bigint | null = null;
        try {
            const row = await this.repository.createHistory({
                triggerType,
                entityType: EmailNotificationEntityType.ORDER,
                entityId: Number(orderId),
                tenantId: target.tenantId,
                tenantName: target.userName,
                toEmails: [recipient],
                ccEmails: [],
                bccEmails: [],
                templateId: triggerType,
                status: EmailNotificationStatus.PENDING_SEND,
                attemptCount: 1,
                retriggeredFromId: 0,
                createdAt: now,
                requestPayload: { orderId: String(orderId), to: [recipient], templateId: triggerType },
            });
            auditId = row?.id ?? null;
        } catch (error) {
            // Java: "Delivery takes priority over auditing" — a failed pre-write
            // is logged, never swallowed silently, and does not abort the send.
            this.logger.error(
                `Audit pre-write failed for order ${orderId}; sending without an audit row`,
                error instanceof Error ? error.stack : String(error),
            );
        }

        return this.sendAndRecord(auditId, recipient, html, triggerType);
    }

    /**
     * Ports EmailNotificationDispatchService.retrigger: replays a stored audit
     * row's send as a fresh attempt whose retriggeredFromId points at the
     * original and whose attemptCount is one greater.
     *
     * @returns the new audit row id, or null when the source row is missing.
     */
    async retrigger(auditLogId: bigint): Promise<bigint | null> {
        const original = await this.repository.getHistoryById(auditLogId);
        if (!original) return null;

        const recipient = original.toEmails[0] ?? '';
        if (!recipient.includes('@')) return null;

        const html = this.templateService.getTemplate(
            original.triggerType as EmailNotificationTriggerType,
            { orderId: String(original.entityId ?? ''), customerName: original.tenantName },
        );

        let auditId: bigint | null = null;
        try {
            const row = await this.repository.createHistory({
                triggerType: original.triggerType,
                entityType: original.entityType,
                entityId: original.entityId,
                tenantId: original.tenantId,
                tenantName: original.tenantName,
                toEmails: original.toEmails,
                ccEmails: original.ccEmails,
                bccEmails: original.bccEmails,
                templateId: original.templateId,
                status: EmailNotificationStatus.PENDING_SEND,
                attemptCount: original.attemptCount + 1,
                retriggeredFromId: Number(original.id),
                createdAt: Date.now(),
                requestPayload: original.requestPayload,
            });
            auditId = row?.id ?? null;
        } catch (error) {
            this.logger.error(
                `Audit pre-write failed for retrigger of ${auditLogId}`,
                error instanceof Error ? error.stack : String(error),
            );
        }

        await this.sendAndRecord(
            auditId,
            recipient,
            html,
            original.triggerType as EmailNotificationTriggerType,
        );
        return auditId;
    }

    /** Ports EmailNotificationDispatchService.sendAndRecord. */
    private async sendAndRecord(
        auditId: bigint | null,
        recipient: string,
        html: string,
        triggerType: EmailNotificationTriggerType,
    ): Promise<boolean> {
        const startedAt = Date.now();
        let status = EmailNotificationStatus.POST_SUCCESS;
        let httpStatus = 200;
        let errorMessage = '';

        if (!this.transporter) {
            status = EmailNotificationStatus.POST_ERROR;
            httpStatus = 0;
            errorMessage = 'SMTP is not configured';
        } else {
            try {
                await this.transporter.sendMail({
                    from: this.from,
                    to: recipient,
                    subject: triggerType,
                    html,
                });
            } catch (error) {
                status = EmailNotificationStatus.POST_ERROR;
                httpStatus = 0;
                errorMessage = error instanceof Error ? error.message : String(error);
            }
        }

        if (auditId !== null) {
            try {
                await this.repository.recordSendOutcome(auditId, {
                    status,
                    httpStatus,
                    errorMessage,
                    sentAt: Date.now(),
                    latencyMs: Date.now() - startedAt,
                });
            } catch (error) {
                this.logger.error(
                    `Audit post-write failed for id ${auditId}`,
                    error instanceof Error ? error.stack : String(error),
                );
            }
        }

        if (status !== EmailNotificationStatus.POST_SUCCESS) {
            this.logger.error(`Email dispatch failed (${triggerType}): ${errorMessage}`);
        }
        return status === EmailNotificationStatus.POST_SUCCESS;
    }

    async getHistory(page: number, size: number) {
        return this.repository.getPaginatedHistory(page, size);
    }

    async getHistoryById(id: bigint) {
        return this.repository.getHistoryById(id);
    }
}
