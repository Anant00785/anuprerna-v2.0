import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export interface WhatsAppPreference {
  id: string;
  type?: string;
  title?: string;
  description?: string;
  enabled: boolean;
}

export interface CustomerWhatsAppStatus {
  tenantId?: number;
  customerId: number;
  userName: string;
  email: string;
  whatsappNumber: string;
  whatsappOptInStatus: 'OPTED_IN' | 'OPTED_OUT' | string;
  whatsappConsentExpiresAt?: number;
  whatsappDismissCount?: number;
  whatsappPreferences?: string;
  [key: string]: any;
}

export interface ConsentEntry {
  id: number;
  name: string;
  email: string;
  phone: string;
  orderUpdates: boolean;
  productionUpdates: boolean;
  marketing: boolean;
  status: 'active' | 'opted-out' | 'pending';
  consentExpiry: number;
}

export interface ConsentStats {
  totalOptedIn: number;
  totalOptedOut: number;
  marketingConsented: number;
  pending: number;
}

export interface WhatsappNotificationHistoryData {
  id: number;
  version?: number;
  tenantType?: string;
  tenantId?: number;
  tenantName: string;
  recipientMobile: string;
  fromMobile: string;
  triggerType: string;
  entityType?: string | null;
  entityId?: number | null;
  templateName: string;
  languageCode?: string;
  namespace?: string;
  headerType?: string | null;
  headerMediaUrl?: string | null;
  bodyParams?: string;
  buttonSubType?: string | null;
  buttonParams?: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'POST_FAILED' | 'POST_ERROR' | 'FAILED_DELIVERY' | string;
  httpStatus?: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  latencyMs?: number;
  pollAttemptCount?: number;
  lastPolledAt?: number;
  requestId?: string;
  createdAt: number;
  sentAt?: number;
  statusUpdatedAt?: number;
  requestPayload?: string;
  responsePayload?: string;
  metadata?: string;
  [key: string]: any;
}

export interface AuditLogEntry {
  id: number;
  requestId: string;
  to: string;
  from: string;
  template: string;
  triggerType: string;
  entityType?: string | null;
  entityId?: number | null;
  tenantName: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'POST_FAILED' | 'POST_ERROR' | 'FAILED_DELIVERY' | string;
  httpStatus?: number;
  latencyMs?: number;
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  lastPolledAt?: string;
  pollAttemptCount?: number;
  triggeredBy: string;
  headerType?: string;
  headerMediaUrl?: string;
  buttonSubType?: string;
  buttonUrl?: string;
  bodyParameters?: Array<{ key: string; value: string }>;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: string;
  requestPayload?: string;
  responsePayload?: string;
}

export interface WhatsappDeliveryStatusPollSummary {
  candidatesScanned: number;
  requestBatchesQueried: number;
  rowsTransitioned: number;
  rowsUnchanged: number;
  failedBatches: number;
  rateLimited: boolean;
}

export class WhatsappService {
  public static async getCustomerWhatsAppStatusList(): Promise<ConsentEntry[]> {
    const response = await apiClient.get('/get/customers/whatsapp-status');
    const rawList = unwrapResponseData<CustomerWhatsAppStatus[]>(response.data, 'customerWhatsAppStatusList');
    if (!Array.isArray(rawList)) return [];

    return rawList.map(item => {
      let preferences: WhatsAppPreference[] = [];
      try {
        if (item.whatsappPreferences) {
          preferences = JSON.parse(item.whatsappPreferences);
        }
      } catch (err) {
        preferences = [];
      }

      const getPreference = (prefId: string): boolean =>
        preferences.find(p => p.id === prefId)?.enabled ?? false;

      return {
        id: item.customerId,
        name: item.userName || 'Unnamed Customer',
        email: item.email || '',
        phone: item.whatsappNumber || '',
        orderUpdates: getPreference('order-confirmations'),
        productionUpdates: getPreference('production-updates'),
        marketing: getPreference('collections-offers'),
        status: item.whatsappOptInStatus === 'OPTED_IN' ? 'active' : 'opted-out',
        consentExpiry: item.whatsappConsentExpiresAt ?? -1,
      };
    });
  }

  public static async getAuditLog(page: number = 1, size: number = 20): Promise<AuditLogEntry[]> {
    const response = await apiClient.get(`/get/whatsapp/audit-log?page=${page}&size=${size}`);
    const rawList = unwrapResponseData<WhatsappNotificationHistoryData[]>(
      response.data,
      'whatsappNotificationHistoryList'
    );
    if (!Array.isArray(rawList)) return [];

    return rawList.map(raw => this.mapToAuditLogEntry(raw));
  }

  private static formatEpoch(epoch?: number): string {
    if (!epoch || epoch <= 0) return '';
    return new Date(epoch).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  private static parseButtonParam(raw?: string): string {
    if (!raw || raw === '{}') return '';
    return raw.slice(1, -1).trim().replace(/^"(.*)"$/, '$1');
  }

  private static parseBodyParams(raw?: string): Array<{ key: string; value: string }> {
    if (!raw || raw === '{}') return [];
    const inner = raw.slice(1, -1);
    if (!inner.trim()) return [];
    return inner.split(',').map((val, idx) => ({
      key: `param_${idx + 1}`,
      value: val.trim().replace(/^"(.*)"$/, '$1'),
    }));
  }

  private static mapToAuditLogEntry(raw: WhatsappNotificationHistoryData): AuditLogEntry {
    return {
      id: raw.id,
      requestId: raw.requestId ?? '',
      to: raw.recipientMobile,
      from: raw.fromMobile,
      template: raw.templateName,
      triggerType: raw.triggerType,
      entityType: raw.entityType ?? null,
      entityId: raw.entityId ?? null,
      tenantName: raw.tenantName,
      status: raw.status,
      httpStatus: raw.httpStatus,
      latencyMs: raw.latencyMs,
      createdAt: this.formatEpoch(raw.createdAt),
      sentAt: raw.sentAt && raw.sentAt > 0 ? this.formatEpoch(raw.sentAt) : undefined,
      deliveredAt:
        (raw.status === 'DELIVERED' || raw.status === 'READ') && (raw.statusUpdatedAt ?? 0) > 0
          ? this.formatEpoch(raw.statusUpdatedAt)
          : undefined,
      readAt:
        raw.status === 'READ' && (raw.statusUpdatedAt ?? 0) > 0 ? this.formatEpoch(raw.statusUpdatedAt) : undefined,
      lastPolledAt: raw.lastPolledAt && raw.lastPolledAt > 0 ? this.formatEpoch(raw.lastPolledAt) : undefined,
      pollAttemptCount: raw.pollAttemptCount,
      triggeredBy: raw.triggerType,
      headerType: raw.headerType ?? '',
      headerMediaUrl: raw.headerMediaUrl ?? '',
      buttonSubType: raw.buttonSubType ?? '',
      buttonUrl: this.parseButtonParam(raw.buttonParams),
      bodyParameters: this.parseBodyParams(raw.bodyParams),
      errorCode: raw.errorCode,
      errorMessage: raw.errorMessage,
      metadata: raw.metadata,
      requestPayload: raw.requestPayload,
      responsePayload: raw.responsePayload,
    };
  }

  public static async pollDeliveryStatusWithinWindow(): Promise<WhatsappDeliveryStatusPollSummary> {
    const response = await apiClient.post('/poll/whatsapp/delivery-status', {});
    return unwrapResponseData<WhatsappDeliveryStatusPollSummary>(response.data, 'pollSummary');
  }

  public static async pollDeliveryStatusStaleBacklog(): Promise<WhatsappDeliveryStatusPollSummary> {
    const response = await apiClient.post('/poll/whatsapp/delivery-status/stale', {});
    return unwrapResponseData<WhatsappDeliveryStatusPollSummary>(response.data, 'pollSummary');
  }

  public static async pollDeliveryStatusById(id: number): Promise<WhatsappDeliveryStatusPollSummary> {
    const response = await apiClient.post(`/poll/whatsapp/delivery-status/${id}`, {});
    return unwrapResponseData<WhatsappDeliveryStatusPollSummary>(response.data, 'pollSummary');
  }
}
