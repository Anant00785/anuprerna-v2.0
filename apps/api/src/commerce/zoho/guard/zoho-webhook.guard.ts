/**
 * apps/api/src/commerce/zoho/guard/zoho-webhook.guard.ts
 *
 * NestJS equivalent of the annotation Loom puts on the whole webhook
 * controller (ZohoStockSyncWebhookController.java:31-41):
 *
 *   @NVerseDomainValidated(
 *       headerKeys   = {"User-Agent", "Zoho-Request-Ip"},
 *       headerValues = {"ZohoBooks-Agent", "103.89.74.49"})
 *
 * i.e. a required-header + source-address allowlist, NOT an HMAC. Zoho Books
 * webhooks are not signed, so there is no shared secret to verify — this is
 * the control the legacy system actually has, reproduced.
 *
 * KNOWN CEILING, inherited from the original: `Zoho-Request-Ip` is a request
 * HEADER Zoho sets, so a caller who knows the two values can forge both. The
 * guard therefore ALSO checks the transport-level peer address when
 * ZOHO_WEBHOOK_ENFORCE_PEER_IP is on, which the Java has no equivalent of.
 * See the note on `peerAddresses` about proxies before enabling it.
 *
 * Values are env-driven with the Loom constants as defaults, because a
 * hardcoded vendor IP rots the day Zoho renumbers.
 */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EnvironmentVariables } from "../../../common/config/env.schema.js";

/** ZohoStockSyncWebhookController.java:35 — headerValues[0]. */
export const DEFAULT_ZOHO_USER_AGENT = "ZohoBooks-Agent";
/** ZohoStockSyncWebhookController.java:37 — headerValues[1]. */
export const DEFAULT_ZOHO_ALLOWED_IPS = "103.89.74.49";

const splitList = (raw: string | undefined): string[] =>
  (raw ?? "").split(",").map((v) => v.trim()).filter(Boolean);

@Injectable()
export class ZohoWebhookGuard implements CanActivate {
  private readonly logger = new Logger(ZohoWebhookGuard.name);

  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headers: Record<string, string | string[] | undefined> = request?.headers ?? {};

    const expectedAgent = (this.config.get("ZOHO_WEBHOOK_USER_AGENT", { infer: true }) ?? "").trim();
    const allowedIps = splitList(this.config.get("ZOHO_WEBHOOK_ALLOWED_IPS", { infer: true }));

    // FAIL CLOSED. An empty allowlist or a blank expected agent means the
    // config is missing/typo'd, and an allowlist that matches nothing must
    // never degrade into an allowlist that matches everything.
    if (!expectedAgent || allowedIps.length === 0) {
      this.reject(request, "ZOHO_WEBHOOK_USER_AGENT / ZOHO_WEBHOOK_ALLOWED_IPS not configured");
    }

    const userAgent = this.header(headers, "user-agent");
    if (userAgent !== expectedAgent) {
      this.reject(request, `unexpected User-Agent ${JSON.stringify(userAgent ?? null)}`);
    }

    const declaredIp = this.header(headers, "zoho-request-ip");
    if (!declaredIp || !allowedIps.includes(declaredIp)) {
      this.reject(request, `Zoho-Request-Ip ${JSON.stringify(declaredIp ?? null)} not in allowlist`);
    }

    if (this.config.get("ZOHO_WEBHOOK_ENFORCE_PEER_IP", { infer: true }) === true) {
      const peers = this.peerAddresses(request);
      if (!peers.some((ip) => allowedIps.includes(ip))) {
        this.reject(request, `peer address ${JSON.stringify(peers)} not in allowlist`);
      }
    }

    return true;
  }

  private header(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
    const raw = headers[name];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return typeof value === "string" ? value.trim() : undefined;
  }

  /**
   * Candidate transport-level source addresses.
   *
   * Behind AWS App Runner every request arrives from the platform proxy, so
   * `req.ip`/`socket.remoteAddress` is the proxy, not Zoho — the real client is
   * the LEFT-MOST entry of X-Forwarded-For. Express only populates `req.ips`
   * (and makes `req.ip` the client) when `app.set('trust proxy', ...)` is
   * configured, which is a main.ts concern this change does not own. Until
   * that is set, X-Forwarded-For is read directly here; note that an
   * unvalidated XFF is itself caller-controlled, which is exactly why
   * ZOHO_WEBHOOK_ENFORCE_PEER_IP defaults to false and this stays an extra
   * check layered on the Loom-parity header check rather than a replacement
   * for it.
   */
  private peerAddresses(request: {
    ip?: string;
    ips?: string[];
    headers?: Record<string, string | string[] | undefined>;
    socket?: { remoteAddress?: string };
  }): string[] {
    const forwarded = this.header(request.headers ?? {}, "x-forwarded-for");
    const normalize = (ip: string) => ip.trim().replace(/^::ffff:/, "");
    return [
      ...(forwarded ? forwarded.split(",").map(normalize) : []),
      ...(request.ips ?? []).map(normalize),
      ...(request.ip ? [normalize(request.ip)] : []),
      ...(request.socket?.remoteAddress ? [normalize(request.socket.remoteAddress)] : []),
    ].filter(Boolean);
  }

  private reject(request: { url?: string }, reason: string): never {
    this.logger.warn(`Rejected Zoho webhook call to ${request?.url ?? "?"}: ${reason}`);
    throw new ForbiddenException("Webhook caller not recognised.");
  }
}
