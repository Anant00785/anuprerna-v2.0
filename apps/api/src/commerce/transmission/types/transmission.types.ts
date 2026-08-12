// @ts-nocheck
export interface TransmissionRequest<T = any> { url: string; queryParams?: Record<string, string>; headers?: Record<string, string>; payload?: T; }
export interface TransmissionResponse<T = any> { statusCode: number; body: T; }
export class TransmissionException extends Error { constructor(public statusCode: number, message: string) { super(message); } }
