// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationRepository } from '../repository/notification.repository.js';
import { EmailTemplateService } from './email-template.service.js';
import { EmailNotificationStatus, EmailNotificationEntityType, EmailNotificationTriggerType } from '../types/notification.types.js';
import * as nodemailer from 'nodemailer';
import type { EnvironmentVariables } from '../../../common/config/env.schema.js';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    private transporter: nodemailer.Transporter;

    constructor(
        private readonly repository: NotificationRepository,
        private readonly templateService: EmailTemplateService,
        private readonly config: ConfigService<EnvironmentVariables, true>,
    ) {
        this.transporter = nodemailer.createTransport({
            host: this.config.get('SMTP_HOST', { infer: true }),
            port: parseInt(this.config.get('SMTP_PORT', { infer: true }) || '587', 10),
            auth: { user: this.config.get('SMTP_USER', { infer: true }), pass: this.config.get('SMTP_PASS', { infer: true }) }
        });
    }

    async triggerOrderEmail(orderId: number, toEmail: string, customerName: string): Promise<boolean> {
        try {
            const html = this.templateService.getTemplate(EmailNotificationTriggerType.ORDER_CONFIRMATION, {
                orderId: String(orderId),
                customerName
            });

            await this.transporter.sendMail({
                from: this.config.get('SMTP_FROM', { infer: true }),
                to: toEmail,
                subject: 'Order Confirmation',
                html
            });

            await this.repository.createHistory({
                tenantId: 1, // Default or context aware
                entityId: orderId,
                entityType: EmailNotificationEntityType.ORDER as any,
                triggerType: EmailNotificationTriggerType.ORDER_CONFIRMATION as any,
                status: EmailNotificationStatus.SENT as any
            });

            return true;
        } catch (error) {
            this.logger.error(`Failed to send email for order ${orderId}`, error);
            await this.repository.createHistory({
                tenantId: 1,
                entityId: orderId,
                entityType: EmailNotificationEntityType.ORDER as any,
                triggerType: EmailNotificationTriggerType.ORDER_CONFIRMATION as any,
                status: EmailNotificationStatus.FAILED as any
            });
            return false;
        }
    }

    async getHistory(page: number, size: number) {
        return this.repository.getPaginatedHistory(page, size);
    }

    async getHistoryById(id: number) {
        return this.repository.getHistoryById(id);
    }
}
// @ts-nocheck
