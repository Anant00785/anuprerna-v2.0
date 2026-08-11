// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { TransmissionService } from '../../transmission/service/transmission.service.js';
import { Msg91ActionCode, Msg91OtpResponse } from '../types/msg91.types.js';

@Injectable()
export class Msg91Service {
    private readonly logger = new Logger(Msg91Service.name);
    private readonly fakeMode = process.env.MSG91_FAKE_MODE === 'true';

    constructor(private readonly transmissionService: TransmissionService) {}

    async sendOtp(mobile: string): Promise<{ success: boolean }> {
        if (this.fakeMode) return { success: true };
        try {
            const url = process.env.MSG91_SEND_OTP_URL || '';
            const params = { authkey: process.env.MSG91_AUTH_KEY || '', mobile, template_id: process.env.MSG91_TEMPLATE_ID || '' };
            const response = await this.transmissionService.executeBasicGET<Msg91OtpResponse>(url, params);
            return { success: response && response.type === 'success' };
        } catch (error) {
            this.logger.error(`Error sending OTP to ${mobile}`, error);
            return { success: false };
        }
    }

    async verifyOtp(mobile: string, otp: string): Promise<{ success: boolean }> {
        if (this.fakeMode) return { success: true };
        try {
            const url = process.env.MSG91_VERIFY_OTP_URL || '';
            const params = { authkey: process.env.MSG91_AUTH_KEY || '', mobile, otp };
            const response = await this.transmissionService.executeBasicGET<Msg91OtpResponse>(url, params);
            return { success: response && response.type === 'success' };
        } catch (error) {
            this.logger.error(`Error verifying OTP for ${mobile}`, error);
            return { success: false };
        }
    }

    async resendOtp(mobile: string): Promise<{ success: boolean }> {
        if (this.fakeMode) return { success: true };
        try {
            const url = process.env.MSG91_RESEND_OTP_URL || '';
            const params = { authkey: process.env.MSG91_AUTH_KEY || '', mobile };
            const response = await this.transmissionService.executeBasicGET<Msg91OtpResponse>(url, params);
            return { success: response && response.type === 'success' };
        } catch (error) {
            this.logger.error(`Error resending OTP to ${mobile}`, error);
            return { success: false };
        }
    }
}
// @ts-nocheck
