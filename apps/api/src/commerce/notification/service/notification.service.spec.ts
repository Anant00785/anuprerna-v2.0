/**
 * Outbound email must FAIL CLOSED with no configuration and must never attempt
 * a live send from a test. nodemailer.createTransport is spied on, so a call to
 * it with a real host would be visible here.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationService } from "./notification.service.js";
import { EmailTemplateService } from "./email-template.service.js";
import type { NotificationRepository } from "../repository/notification.repository.js";
import {
  EmailNotificationStatus,
  EmailNotificationTriggerType,
} from "../types/notification.types.js";

// nodemailer is mocked wholesale: if the service ever built a transporter in a
// test, createTransportSpy would record it, and sendMail below can never reach a
// real mail server.
const createTransportSpy = vi.fn(() => ({ sendMail: sendMailSpy }));
const sendMailSpy = vi.fn(async () => ({ messageId: "test" }));
vi.mock("nodemailer", () => ({
  createTransport: (...args: unknown[]) => createTransportSpy(...(args as [])),
  default: { createTransport: (...args: unknown[]) => createTransportSpy(...(args as [])) },
}));

function configOf(values: Record<string, string>) {
  return { get: (key: string) => values[key] } as unknown as ConstructorParameters<
    typeof NotificationService
  >[2];
}

function make(env: Record<string, string> = {}, repoOverrides: Record<string, unknown> = {}) {
  const created: Record<string, unknown>[] = [];
  const updates: Record<string, unknown>[] = [];

  const repo = {
    createHistory: vi.fn(async (v: Record<string, unknown>) => {
      created.push(v);
      return { ...v, id: 7n };
    }),
    recordSendOutcome: vi.fn(async (id: bigint, o: Record<string, unknown>) => {
      updates.push({ id, ...o });
      return null;
    }),
    getOrderEmailTarget: vi.fn(async () => ({
      orderId: 42n,
      tenantId: 3,
      email: "buyer@example.test",
      userName: "Buyer",
      deleted: false,
    })),
    getHistoryById: vi.fn(async () => null),
    getPaginatedHistory: vi.fn(async () => []),
    ...repoOverrides,
  };

  const service = new NotificationService(
    repo as unknown as NotificationRepository,
    new EmailTemplateService(),
    configOf(env),
  );
  return { service, repo, created, updates };
}

beforeEach(() => {
  createTransportSpy.mockClear();
  sendMailSpy.mockClear();
});

describe("NotificationService — fails closed without configuration", () => {
  it("builds no transporter when SMTP_HOST and SMTP_FROM are absent", () => {
    const { service } = make({});
    expect(service.isConfigured).toBe(false);
    expect(createTransportSpy).not.toHaveBeenCalled();
  });

  it("builds no transporter when only the host is set", () => {
    const { service } = make({ SMTP_HOST: "localhost" });
    expect(service.isConfigured).toBe(false);
    expect(createTransportSpy).not.toHaveBeenCalled();
  });

  it("attempts no send and audits POST_ERROR when unconfigured", async () => {
    const { service, created, updates } = make({});
    const sent = await service.triggerOrderEmail(42n, EmailNotificationTriggerType.ORDER_CONFIRMATION);

    expect(sent).toBe(false);
    expect(createTransportSpy).not.toHaveBeenCalled();
    expect(created[0].status).toBe(EmailNotificationStatus.PENDING_SEND);
    expect(updates[0].status).toBe(EmailNotificationStatus.POST_ERROR);
    expect(updates[0].errorMessage).toBe("SMTP is not configured");
  });
});

describe("NotificationService — audit row completeness", () => {
  it("supplies every NOT NULL column the email_notification_history table requires", async () => {
    const { service, created } = make({});
    await service.triggerOrderEmail(42n, EmailNotificationTriggerType.ORDER_CONFIRMATION);

    // templateId and createdAt are NOT NULL with no database default; the
    // previous implementation omitted both, so every insert was a null
    // violation at runtime.
    for (const column of [
      "triggerType",
      "entityType",
      "entityId",
      "tenantId",
      "tenantName",
      "toEmails",
      "templateId",
      "status",
      "attemptCount",
      "retriggeredFromId",
      "createdAt",
    ]) {
      expect(created[0][column], `${column} must be supplied`).not.toBeUndefined();
      expect(created[0][column], `${column} must not be null`).not.toBeNull();
    }
  });

  it("uses only enum values the database enum accepts", async () => {
    const { service, created } = make({});
    await service.triggerOrderEmail(42n, EmailNotificationTriggerType.ORDER_CONFIRMATION);
    expect(created[0].status).toBe("PENDING_SEND");
    expect(created[0].triggerType).toBe("ORDER_CONFIRMATION");
    expect(created[0].entityType).toBe("ORDER");
  });

  it("takes the recipient from the order, not from the caller", async () => {
    const { service, created, repo } = make({});
    await service.triggerOrderEmail(42n, EmailNotificationTriggerType.ORDER_CONFIRMATION);
    expect(repo.getOrderEmailTarget).toHaveBeenCalledWith(42n);
    expect(created[0].toEmails).toEqual(["buyer@example.test"]);
  });

  it("returns false and writes nothing when the order does not exist", async () => {
    const { service, created } = make({}, { getOrderEmailTarget: vi.fn(async () => null) });
    await expect(
      service.triggerOrderEmail(42n, EmailNotificationTriggerType.ORDER_CONFIRMATION),
    ).resolves.toBe(false);
    expect(created).toHaveLength(0);
  });

  it("does not send to an address that is not a plain address", async () => {
    const { service, created } = make(
      {},
      {
        getOrderEmailTarget: vi.fn(async () => ({
          orderId: 42n,
          tenantId: 3,
          email: "AAECAwQFBg==",
          userName: "Buyer",
          deleted: false,
        })),
      },
    );
    await expect(
      service.triggerOrderEmail(42n, EmailNotificationTriggerType.ORDER_CONFIRMATION),
    ).resolves.toBe(false);
    expect(created).toHaveLength(0);
  });
});

describe("NotificationService — a configured transport never sends in tests", () => {
  it("builds a transporter from env only, and no live host is reachable", async () => {
    const { service, updates } = make({
      SMTP_HOST: "smtp.invalid.test",
      SMTP_FROM: "noreply@invalid.test",
      SMTP_PORT: "2525",
    });
    expect(service.isConfigured).toBe(true);
    expect(createTransportSpy).toHaveBeenCalledWith(
      expect.objectContaining({ host: "smtp.invalid.test", port: 2525, secure: false }),
    );

    await service.triggerOrderEmail(42n, EmailNotificationTriggerType.ORDER_CONFIRMATION);
    // The transport is the mock above, so nothing left the process.
    expect(sendMailSpy).toHaveBeenCalledOnce();
    expect(updates[0].status).toBe(EmailNotificationStatus.POST_SUCCESS);
  });

  it("keeps an explicit port 0 rather than silently substituting 587", () => {
    make({ SMTP_HOST: "smtp.invalid.test", SMTP_FROM: "a@b.test", SMTP_PORT: "0" });
    expect(createTransportSpy).toHaveBeenCalledWith(expect.objectContaining({ port: 0 }));
  });

  it("audits POST_ERROR when the send throws", async () => {
    sendMailSpy.mockRejectedValueOnce(new Error("connection refused"));
    const { service, updates } = make({ SMTP_HOST: "smtp.invalid.test", SMTP_FROM: "a@b.test" });
    const sent = await service.triggerOrderEmail(42n, EmailNotificationTriggerType.ORDER_CONFIRMATION);
    expect(sent).toBe(false);
    expect(updates[0].status).toBe(EmailNotificationStatus.POST_ERROR);
    expect(updates[0].errorMessage).toBe("connection refused");
  });
});

describe("NotificationService.retrigger", () => {
  it("returns null for a missing source row", async () => {
    const { service } = make({});
    await expect(service.retrigger(1n)).resolves.toBeNull();
  });

  it("replays the stored row with attemptCount + 1 and retriggeredFromId set", async () => {
    const original = {
      id: 5n,
      triggerType: "ORDER_CONFIRMATION",
      entityType: "ORDER",
      entityId: 42,
      tenantId: 3,
      tenantName: "Buyer",
      toEmails: ["buyer@example.test"],
      ccEmails: [],
      bccEmails: [],
      templateId: "ORDER_CONFIRMATION",
      attemptCount: 2,
      requestPayload: {},
    };
    const { service, created } = make({}, { getHistoryById: vi.fn(async () => original) });

    await service.retrigger(5n);

    expect(created[0].attemptCount).toBe(3);
    expect(created[0].retriggeredFromId).toBe(5);
    expect(created[0].toEmails).toEqual(["buyer@example.test"]);
  });
});
