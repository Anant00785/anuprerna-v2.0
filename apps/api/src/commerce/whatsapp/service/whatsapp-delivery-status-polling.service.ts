import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransmissionService } from '../../transmission/service/transmission.service.js';
import { TransmissionException } from '../../transmission/types/transmission.types.js';
import { WhatsappRepository, type WhatsappNotificationHistoryRow } from '../repository/whatsapp.repository.js';
import type {
  FreshchatDeliveryRecord,
  WhatsappDeliveryStatusPollSummary,
  WhatsappDeliveryStatusResponse,
  WhatsappNotificationStatus,
} from '../types/whatsapp.types.js';
import type { EnvironmentVariables } from '../../../common/config/env.schema.js';

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Reconciles WhatsApp audit rows against Freshchat's delivery-status API.
 * Port of Loom's WhatsappDeliveryStatusPollingService: sending a message and
 * learning whether it was delivered are two separate Freshchat calls — the
 * POST returns a `request_id`, and the SENT → DELIVERED → READ (or FAILED)
 * state settles later. Candidates are grouped by `request_id` (one Freshchat
 * GET per send), matched back to their audit row by recipient phone number,
 * and a row's status only ever moves forward. Per-batch failures are logged
 * and isolated; a 429 ends the run early. Exceptions never propagate.
 */
@Injectable()
export class WhatsappDeliveryStatusPollingService {
  private readonly logger = new Logger(WhatsappDeliveryStatusPollingService.name);

  // Loom defaults (loom.config.whatsapp.delivery-status.*).
  // ponytail: fixed values; lift into env config if ops ever needs to tune them.
  maxAgeDays = 7;
  interRequestDelayMs = 200;
  rateLimitBackoffMs = 5000;

  constructor(
    private readonly repository: WhatsappRepository,
    private readonly transmission: TransmissionService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  private windowCutoff(): number {
    return Date.now() - this.maxAgeDays * MILLIS_PER_DAY;
  }

  private sleep(ms: number): Promise<void> {
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** POST_SUCCESS < SENT < DELIVERED < READ; FAILED_DELIVERY terminal (Loom statusRank). */
  private statusRank(status: WhatsappNotificationStatus | null): number {
    switch (status) {
      case 'SENT':
        return 2;
      case 'DELIVERED':
        return 3;
      case 'READ':
      case 'FAILED_DELIVERY':
        return 4;
      case 'POST_SUCCESS':
        return 1;
      case null:
        return -1;
      default:
        return 0;
    }
  }

  private mapFreshchatStatus(freshchatStatus: string | undefined): WhatsappNotificationStatus | null {
    if (!freshchatStatus) return null;
    switch (freshchatStatus.trim().toUpperCase()) {
      case 'SENT':
        return 'SENT';
      case 'DELIVERED':
        return 'DELIVERED';
      case 'READ':
        return 'READ';
      case 'FAILED':
      case 'FAILED_DELIVERY':
        return 'FAILED_DELIVERY';
      default:
        return null;
    }
  }

  private advances(current: WhatsappNotificationStatus, next: WhatsappNotificationStatus): boolean {
    return this.statusRank(next) > this.statusRank(current);
  }

  private indexByRecipient(response: WhatsappDeliveryStatusResponse): Map<string, FreshchatDeliveryRecord> {
    const indexed = new Map<string, FreshchatDeliveryRecord>();
    for (const record of response.outbound_messages ?? []) {
      const recipient = record?.to?.phone_number ?? '';
      if (recipient === '') continue;
      indexed.set(recipient, record);
    }
    return indexed;
  }

  /** Loom WhatsappTransmissionService.fetchDeliveryStatus — one GET per request_id. */
  private fetchDeliveryStatus(requestId: string): Promise<WhatsappDeliveryStatusResponse> {
    // WHATSAPP_API_URL is the Freshchat v2 base (see env.schema.ts "WhatsApp (Freshchat)").
    const base = this.config.get('WHATSAPP_API_URL', { infer: true }) ?? '';
    return this.transmission.executeBasicGET<WhatsappDeliveryStatusResponse>(
      `${base}/outbound-messages`,
      { request_id: requestId },
      { Authorization: `Bearer ${this.config.get('WHATSAPP_API_TOKEN', { infer: true }) ?? ''}` },
    );
  }

  private async pollCandidates(
    candidates: WhatsappNotificationHistoryRow[],
    methodName: string,
  ): Promise<WhatsappDeliveryStatusPollSummary> {
    const summary: WhatsappDeliveryStatusPollSummary = {
      candidatesScanned: candidates.length,
      requestBatchesQueried: 0,
      rowsTransitioned: 0,
      rowsUnchanged: 0,
      failedBatches: 0,
      rateLimited: false,
    };

    const rowsByRequestId = new Map<string, WhatsappNotificationHistoryRow[]>();
    for (const row of candidates) {
      const requestId = row.requestId ?? '';
      if (requestId.trim() === '') continue;
      const bucket = rowsByRequestId.get(requestId);
      if (bucket) bucket.push(row);
      else rowsByRequestId.set(requestId, [row]);
    }

    let firstBatch = true;
    for (const [requestId, rows] of rowsByRequestId) {
      if (!firstBatch) await this.sleep(this.interRequestDelayMs);
      firstBatch = false;

      let response: WhatsappDeliveryStatusResponse;
      try {
        response = await this.fetchDeliveryStatus(requestId);
        summary.requestBatchesQueried++;
      } catch (error) {
        summary.failedBatches++;
        this.logger.error(`${methodName}: Freshchat status fetch failed for request_id ${requestId}`, error);
        if (error instanceof TransmissionException && error.statusCode === 429) {
          summary.rateLimited = true;
          await this.sleep(this.rateLimitBackoffMs);
          break;
        }
        continue;
      }

      const recordsByRecipient = this.indexByRecipient(response);
      const now = Date.now();

      for (const row of rows) {
        const nextAttempt = (row.pollAttemptCount ?? 0) + 1;
        const record = recordsByRecipient.get(row.recipientMobile ?? '');

        if (!record) {
          await this.repository.markDeliveryStatusPolled(row.id, now, nextAttempt);
          summary.rowsUnchanged++;
          continue;
        }

        const nextStatus = this.mapFreshchatStatus(record.status);
        if (nextStatus === null || !this.advances(row.status, nextStatus)) {
          await this.repository.markDeliveryStatusPolled(row.id, now, nextAttempt);
          summary.rowsUnchanged++;
          continue;
        }

        await this.repository.recordDeliveryStatus(
          row.id,
          nextStatus,
          record.message_id ?? '',
          record.failure_code ?? '',
          record.failure_reason ?? '',
          now,
          now,
          nextAttempt,
        );
        summary.rowsTransitioned++;
      }
    }

    return summary;
  }

  /** Recent-window reconciliation — what the Loom cron runs, on demand. */
  async pollWithinWindow(): Promise<WhatsappDeliveryStatusPollSummary> {
    return this.pollCandidates(
      await this.repository.findPollableDeliveryStatusWithinWindow(this.windowCutoff()),
      'pollWithinWindow',
    );
  }

  /** Stale (>window) backlog the cron skips — explicit admin trigger only. */
  async pollStaleBacklog(): Promise<WhatsappDeliveryStatusPollSummary> {
    return this.pollCandidates(
      await this.repository.findPollableDeliveryStatusBeforeWindow(this.windowCutoff()),
      'pollStaleBacklog',
    );
  }

  /** Single row by id, any age. All-zero summary when the row does not exist. */
  async pollSingle(id: bigint): Promise<WhatsappDeliveryStatusPollSummary> {
    const row = await this.repository.getHistoryEntityById(id);
    if (row === null) {
      return {
        candidatesScanned: 0,
        requestBatchesQueried: 0,
        rowsTransitioned: 0,
        rowsUnchanged: 0,
        failedBatches: 0,
        rateLimited: false,
      };
    }
    return this.pollCandidates([row], 'pollSingle');
  }
}
