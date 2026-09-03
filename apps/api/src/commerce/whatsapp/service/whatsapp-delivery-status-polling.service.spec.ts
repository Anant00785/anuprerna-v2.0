/**
 * apps/api/src/commerce/whatsapp/service/whatsapp-delivery-status-polling.service.spec.ts
 *
 * Port-fidelity tests against Loom's WhatsappDeliveryStatusPollingService:
 * one Freshchat GET per request_id, rows matched by recipient phone number,
 * status only ever moves forward, a missing row yields an all-zero summary,
 * and a 429 ends the run early with rateLimited=true.
 */
import { describe, it, expect, vi } from "vitest";
import { WhatsappDeliveryStatusPollingService } from "./whatsapp-delivery-status-polling.service.js";
import type { WhatsappRepository, WhatsappNotificationHistoryRow } from "../repository/whatsapp.repository.js";
import type { TransmissionService } from "../../transmission/service/transmission.service.js";
import { TransmissionException } from "../../transmission/types/transmission.types.js";
import type { ConfigService } from "@nestjs/config";
import type { EnvironmentVariables } from "../../../common/config/env.schema.js";

function row(overrides: Partial<WhatsappNotificationHistoryRow>): WhatsappNotificationHistoryRow {
  return {
    id: 1n,
    requestId: "req-1",
    recipientMobile: "+911111111111",
    status: "SENT",
    pollAttemptCount: 0,
    sentAt: Date.now(),
    ...overrides,
  } as WhatsappNotificationHistoryRow;
}

function make(fetchImpl: (url: string, q?: Record<string, string>) => Promise<unknown>) {
  const repository = {
    findPollableDeliveryStatusWithinWindow: vi.fn(async () => [] as WhatsappNotificationHistoryRow[]),
    findPollableDeliveryStatusBeforeWindow: vi.fn(async () => [] as WhatsappNotificationHistoryRow[]),
    getHistoryEntityById: vi.fn(async () => null as WhatsappNotificationHistoryRow | null),
    markDeliveryStatusPolled: vi.fn(async () => undefined),
    recordDeliveryStatus: vi.fn(async () => undefined),
  };
  const transmission = { executeBasicGET: vi.fn(fetchImpl) };
  const config = { get: (key: string) => ({ WHATSAPP_API_URL: "https://fc.example/v2", WHATSAPP_API_TOKEN: "t" })[key] };
  const service = new WhatsappDeliveryStatusPollingService(
    repository as unknown as WhatsappRepository,
    transmission as unknown as TransmissionService,
    config as unknown as ConfigService<EnvironmentVariables, true>,
  );
  // No real waiting in tests.
  service.interRequestDelayMs = 0;
  service.rateLimitBackoffMs = 0;
  return { service, repository, transmission };
}

const ZERO_SUMMARY = {
  candidatesScanned: 0,
  requestBatchesQueried: 0,
  rowsTransitioned: 0,
  rowsUnchanged: 0,
  failedBatches: 0,
  rateLimited: false,
};

describe("WhatsappDeliveryStatusPollingService", () => {
  it("pollSingle of a missing row returns the all-zero summary and queries nothing", async () => {
    const { service, transmission } = make(async () => ({ outbound_messages: [] }));

    expect(await service.pollSingle(999n)).toEqual(ZERO_SUMMARY);
    expect(transmission.executeBasicGET).not.toHaveBeenCalled();
  });

  it("advances a row when Freshchat reports a forward transition, writing only non-blank fields", async () => {
    const { service, repository, transmission } = make(async () => ({
      outbound_messages: [
        { message_id: "m-1", to: { phone_number: "+911111111111" }, status: "delivered" },
      ],
    }));
    repository.getHistoryEntityById.mockResolvedValue(row({ status: "SENT" }));

    const summary = await service.pollSingle(1n);

    expect(summary).toEqual({ ...ZERO_SUMMARY, candidatesScanned: 1, requestBatchesQueried: 1, rowsTransitioned: 1 });
    expect(transmission.executeBasicGET).toHaveBeenCalledWith(
      "https://fc.example/v2/outbound-messages",
      { request_id: "req-1" },
      { Authorization: "Bearer t" },
    );
    expect(repository.recordDeliveryStatus).toHaveBeenCalledWith(
      1n, "DELIVERED", "m-1", "", "", expect.any(Number), expect.any(Number), 1,
    );
    expect(repository.markDeliveryStatusPolled).not.toHaveBeenCalled();
  });

  it("never downgrades: a READ row reported as SENT only gets poll bookkeeping", async () => {
    const { service, repository } = make(async () => ({
      outbound_messages: [{ to: { phone_number: "+911111111111" }, status: "SENT" }],
    }));
    repository.getHistoryEntityById.mockResolvedValue(row({ status: "READ" }));

    const summary = await service.pollSingle(1n);

    expect(summary.rowsUnchanged).toBe(1);
    expect(summary.rowsTransitioned).toBe(0);
    expect(repository.recordDeliveryStatus).not.toHaveBeenCalled();
    expect(repository.markDeliveryStatusPolled).toHaveBeenCalledWith(1n, expect.any(Number), 1);
  });

  it("groups by request_id (one GET per send) and matches rows by recipient", async () => {
    const { service, repository, transmission } = make(async () => ({
      outbound_messages: [{ to: { phone_number: "+911111111111" }, status: "READ" }],
    }));
    repository.findPollableDeliveryStatusWithinWindow.mockResolvedValue([
      row({ id: 1n, requestId: "req-1", recipientMobile: "+911111111111", status: "DELIVERED" }),
      row({ id: 2n, requestId: "req-1", recipientMobile: "+922222222222", status: "SENT" }),
    ]);

    const summary = await service.pollWithinWindow();

    expect(transmission.executeBasicGET).toHaveBeenCalledTimes(1);
    // Row 1 advanced DELIVERED→READ; row 2's recipient has no record, so bookkeeping only.
    expect(summary).toEqual({ ...ZERO_SUMMARY, candidatesScanned: 2, requestBatchesQueried: 1, rowsTransitioned: 1, rowsUnchanged: 1 });
  });

  it("a 429 ends the run early with rateLimited=true; other failures are isolated", async () => {
    const { service, repository, transmission } = make(async () => {
      throw new TransmissionException(429, "rate limited");
    });
    repository.findPollableDeliveryStatusBeforeWindow.mockResolvedValue([
      row({ id: 1n, requestId: "req-1" }),
      row({ id: 2n, requestId: "req-2" }),
    ]);

    const summary = await service.pollStaleBacklog();

    expect(summary.rateLimited).toBe(true);
    expect(summary.failedBatches).toBe(1);
    // Early exit: the second request_id was never queried.
    expect(transmission.executeBasicGET).toHaveBeenCalledTimes(1);
  });
});
