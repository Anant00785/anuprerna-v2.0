// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { EmailNotificationTriggerType } from '../types/notification.types.js';

@Injectable()
export class EmailTemplateService {
    getTemplate(triggerType: EmailNotificationTriggerType, payload: Record<string, string>): string {
        let template = '';
        if (triggerType === EmailNotificationTriggerType.ORDER_CONFIRMATION) {
            template = `<h1>Order Confirmation</h1><p>Dear {{customerName}}, your order {{orderId}} is confirmed.</p>`;
        } else if (triggerType === EmailNotificationTriggerType.ORDER_DISPATCH) {
            template = `<h1>Order Dispatched</h1><p>Dear {{customerName}}, your order {{orderId}} has been dispatched.</p>`;
        } else {
            template = `<p>Notification from Anuprerna.</p>`;
        }
        
        for (const key of Object.keys(payload)) {
            const regex = new RegExp(`\{\{${key}\}\}`, 'g');
            template = template.replace(regex, payload[key]);
        }
        return template;
    }
}
// @ts-nocheck
