/**
 * apps/api/src/commerce/domain/notifications.controller.poll.spec.ts
 *
 * POST /poll/whatsapp/delivery-status[/stale|/:id] — Loom publishes these as
 * POST manual-trigger reconciliations returning a RainEntity-wrapped
 * WhatsappDeliveryStatusPollSummary (envelope key `entity`). The previous
 * @Get versions read history rows and fabricated a record on miss; these
 * specs pin the ported semantics.
 */
import { describe, it, expect, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { NotificationsDomainController } from "./notifications.controller.js";
import type { Database } from "../../database/database.module.js";
import type { WhatsappDeliveryStatusPollingService } from "../whatsapp/service/whatsapp-delivery-status-polling.service.js";
import type { WhatsappDeliveryStatusPollSummary } from "../whatsapp/types/whatsapp.types.js";

const summary = (overrides: Partial<WhatsappDeliveryStatusPollSummary> = {}): WhatsappDeliveryStatusPollSummary => ({
  candidatesScanned: 0,
  requestBatchesQueried: 0,
  rowsTransitioned: 0,
  rowsUnchanged: 0,
  failedBatches: 0,
  rateLimited: false,
  ...overrides,
});

function make() {
  const polling = {
    pollWithinWindow: vi.fn(async () => summary({ candidatesScanned: 3, requestBatchesQueried: 1, rowsTransitioned: 2, rowsUnchanged: 1 })),
    pollStaleBacklog: vi.fn(async () => summary({ candidatesScanned: 5, rateLimited: true, failedBatches: 1 })),
    pollSingle: vi.fn(async () => summary()),
  };
  const controller = new NotificationsDomainController(
    {} as Database,
    polling as unknown as WhatsappDeliveryStatusPollingService,
  );
  return { controller, polling };
}

describe("POST /poll/whatsapp/delivery-status", () => {
  it("triggers the recent-window poll and wraps the summary under `entity`", async () => {
    const { controller, polling } = make();

    const res = await controller.post_poll_whatsapp_delivery_status();

    expect(polling.pollWithinWindow).toHaveBeenCalledTimes(1);
    expect(res).toEqual({
      success: true,
      message: "",
      entity: summary({ candidatesScanned: 3, requestBatchesQueried: 1, rowsTransitioned: 2, rowsUnchanged: 1 }),
    });
  });
});

describe("POST /poll/whatsapp/delivery-status/stale", () => {
  it("triggers the stale-backlog poll and wraps the summary under `entity`", async () => {
    const { controller, polling } = make();

    const res = await controller.post_poll_whatsapp_delivery_status_stale();

    expect(polling.pollStaleBacklog).toHaveBeenCalledTimes(1);
    expect(res).toEqual({
      success: true,
      message: "",
      entity: summary({ candidatesScanned: 5, rateLimited: true, failedBatches: 1 }),
    });
  });
});

describe("POST /poll/whatsapp/delivery-status/:id", () => {
  it("polls the single row and returns the all-zero summary when the row does not exist", async () => {
    const { controller, polling } = make();

    const res = await controller.post_poll_whatsapp_delivery_status_id("137360033");

    expect(polling.pollSingle).toHaveBeenCalledWith(137360033n);
    expect(res).toEqual({ success: true, message: "", entity: summary() });
  });

  it("rejects a non-numeric id with 400 rather than polling", async () => {
    const { controller, polling } = make();

    await expect(controller.post_poll_whatsapp_delivery_status_id("stale-ish")).rejects.toBeInstanceOf(BadRequestException);
    expect(polling.pollSingle).not.toHaveBeenCalled();
  });
});
