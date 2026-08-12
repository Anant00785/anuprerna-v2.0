// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { NotificationRepository } from '../repository/notification.repository.js';
import { EmailTemplateService } from './email-template.service.js';
import { EmailNotificationStatus, EmailNotificationEntityType, EmailNotificationTriggerType } from '../types/notification.types.js';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    private transporter: nodemailer.Transporter;

    constructor(
        private readonly repository: NotificationRepository,
        private readonly templateService: EmailTemplateService
    ) {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
    }

    async triggerOrderEmail(orderId: number, toEmail: string, customerName: string): Promise<boolean> {
        try {
            const html = this.templateService.getTemplate(EmailNotificationTriggerType.ORDER_CONFIRMATION, {
                orderId: String(orderId),
                customerName
            });

            await this.transporter.sendMail({
                from: process.env.SMTP_FROM,
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
