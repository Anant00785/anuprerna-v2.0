import { Injectable, Logger } from '@nestjs/common';
import { TransmissionException, TransmissionResponse } from '../types/transmission.types.js';

@Injectable()
export class TransmissionService {
    private readonly logger = new Logger(TransmissionService.name);

    private buildUrlWithQueryParams(url: string, queryParams?: Record<string, string>): string {
        if (!queryParams || Object.keys(queryParams).length === 0) return url;
        const searchParams = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null) searchParams.append(key, value);
        });
        return `${url}?${searchParams.toString()}`;
    }

    private buildHeaders(headers?: Record<string, string>): Headers {
        const fetchHeaders = new Headers();
        if (headers) {
            Object.entries(headers).forEach(([key, value]) => fetchHeaders.append(key, value));
        }
        return fetchHeaders;
    }

    private async handleResponseWithStatus<T>(response: Response): Promise<TransmissionResponse<T>> {
        const statusCode = response.status;
        let body: any = null;
        const text = await response.text();
        if (text) {
            try { body = JSON.parse(text); } catch (e) { body = text as any; }
        }
        if (!response.ok) throw new TransmissionException(statusCode, `HTTP request failed: ${statusCode} - ${text}`);
        return { statusCode, body };
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        const res = await this.handleResponseWithStatus<T>(response);
        return res.body;
    }

    async executeBasicGET<T>(url: string, queryParams?: Record<string, string>, headers?: Record<string, string>): Promise<T> {
        const fullUrl = this.buildUrlWithQueryParams(url, queryParams);
        const fetchHeaders = this.buildHeaders(headers);
        const response = await fetch(fullUrl, { method: 'GET', headers: fetchHeaders });
        return this.handleResponse<T>(response);
    }

    async executePOSTPayload<T, R>(url: string, queryParams: Record<string, string> | undefined, headers: Record<string, string> | undefined, payload: T): Promise<R> {
        const response = await this.executePOSTPayloadWithStatus<T, R>(url, queryParams, headers, payload);
        return response.body;
    }

    async executePOSTPayloadWithStatus<T, R>(url: string, queryParams: Record<string, string> | undefined, headers: Record<string, string> | undefined, payload: T): Promise<TransmissionResponse<R>> {
        const fullUrl = this.buildUrlWithQueryParams(url, queryParams);
        const fetchHeaders = this.buildHeaders(headers);
        if (!fetchHeaders.has('Content-Type')) fetchHeaders.append('Content-Type', 'application/json');
        
        const response = await fetch(fullUrl, { method: 'POST', headers: fetchHeaders, body: JSON.stringify(payload) });
        return this.handleResponseWithStatus<R>(response);
    }

    async executePUTPayload<T, R>(url: string, queryParams: Record<string, string> | undefined, headers: Record<string, string> | undefined, payload: T): Promise<R> {
        const fullUrl = this.buildUrlWithQueryParams(url, queryParams);
        const fetchHeaders = this.buildHeaders(headers);
        if (!fetchHeaders.has('Content-Type')) fetchHeaders.append('Content-Type', 'application/json');
        
        const response = await fetch(fullUrl, { method: 'PUT', headers: fetchHeaders, body: JSON.stringify(payload) });
        return this.handleResponse<R>(response);
    }
}
// @ts-nocheck
