// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransmissionService } from '../../transmission/transmission.service.js';
import { WhatsappRepository } from '../repository/whatsapp.repository.js';
import { WhatsappOutboundMessage, WhatsappTransferResponse, WhatsappNotificationStatus, WhatsappNotificationEntityType, WhatsappNotificationTriggerType, WhatsappNotificationTenantType } from '../types/whatsapp.types.js';
import * as schema from '../../../database/schema/schema.js';
import type { EnvironmentVariables } from '../../../common/config/env.schema.js';

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);

    constructor(
        private readonly transmissionService: TransmissionService,
        private readonly repository: WhatsappRepository,
        private readonly config: ConfigService<EnvironmentVariables, true>,
    ) {}

    async optIn(mobile: string): Promise<boolean> {
        // Opt-in logic implementation
        this.logger.log(`User with mobile ${mobile} opted in for WhatsApp notifications.`);
        return true;
    }

    async optOut(mobile: string): Promise<boolean> {
        // Opt-out logic implementation
        this.logger.log(`User with mobile ${mobile} opted out of WhatsApp notifications.`);
        return true;
    }

    async dismiss(mobile: string): Promise<boolean> {
        this.logger.log(`User with mobile ${mobile} dismissed WhatsApp notifications.`);
        return true;
    }

    async sendTemplateMessage(to: string, templateName: string, entityId: number, tenantId: number): Promise<void> {
        const url = `${this.config.get('WHATSAPP_API_URL', { infer: true })}/${this.config.get('WHATSAPP_PHONE_NUMBER_ID', { infer: true })}/messages`;
        const payload: WhatsappOutboundMessage = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'template',
            template: { name: templateName, language: { code: 'en' } }
        };

        const headers = { Authorization: `Bearer ${this.config.get('WHATSAPP_API_TOKEN', { infer: true })}` };

        try {
            const response = await this.transmissionService.executePOSTPayload<WhatsappOutboundMessage, WhatsappTransferResponse>(url, undefined, headers, payload);
            if (response && response.messages && response.messages.length > 0) {
                await this.repository.createHistory({
                    tenantId,
                    entityId,
                    entityType: WhatsappNotificationEntityType.CUSTOMER as any,
                    triggerType: WhatsappNotificationTriggerType.ALERT as any,
                    tenantType: WhatsappNotificationTenantType.SYSTEM as any,
                    status: WhatsappNotificationStatus.SENT as any
                });
            }
        } catch (error) {
            this.logger.error('Failed to send WhatsApp message', error);
            await this.repository.createHistory({
                tenantId,
                entityId,
                entityType: WhatsappNotificationEntityType.CUSTOMER as any,
                triggerType: WhatsappNotificationTriggerType.ALERT as any,
                tenantType: WhatsappNotificationTenantType.SYSTEM as any,
                status: WhatsappNotificationStatus.FAILED as any
            });
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
