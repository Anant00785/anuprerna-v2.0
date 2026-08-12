// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransmissionService } from '../../transmission/service/transmission.service.js';
import { Msg91ActionCode, Msg91OtpResponse } from '../types/msg91.types.js';
import type { EnvironmentVariables } from '../../../common/config/env.schema.js';

@Injectable()
export class Msg91Service {
    private readonly logger = new Logger(Msg91Service.name);

    constructor(
        private readonly transmissionService: TransmissionService,
        private readonly config: ConfigService<EnvironmentVariables, true>,
    ) {}

    private get fakeMode(): boolean {
        return this.config.get('MSG91_FAKE_MODE', { infer: true }) === 'true';
    }

    async sendOtp(mobile: string): Promise<{ success: boolean }> {
        if (this.fakeMode) return { success: true };
        try {
            const url = this.config.get('MSG91_SEND_OTP_URL', { infer: true }) || '';
            const params = { authkey: this.config.get('MSG91_AUTH_KEY', { infer: true }) || '', mobile, template_id: this.config.get('MSG91_TEMPLATE_ID', { infer: true }) || '' };
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
            const url = this.config.get('MSG91_VERIFY_OTP_URL', { infer: true }) || '';
            const params = { authkey: this.config.get('MSG91_AUTH_KEY', { infer: true }) || '', mobile, otp };
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
            const url = this.config.get('MSG91_RESEND_OTP_URL', { infer: true }) || '';
            const params = { authkey: this.config.get('MSG91_AUTH_KEY', { infer: true }) || '', mobile };
            const response = await this.transmissionService.executeBasicGET<Msg91OtpResponse>(url, params);
            return { success: response && response.type === 'success' };
        } catch (error) {
            this.logger.error(`Error resending OTP to ${mobile}`, error);
            return { success: false };
        }
    }
}
// @ts-nocheck
