import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LoyaltyprogramRepository } from '../repository/loyaltyprogram.repository.js';
import {
  CustomerLoyaltyProgramMembershipInfo,
  LoyaltyProgramConfigAuditLogData,
  LoyaltyProgramConfigData,
  LoyaltyProgramConfigInput,
} from '../types/loyaltyprogram.types.js';

/** Ports LoyaltyProgramConfigDAOController + LoyaltyInfoService. */
@Injectable()
export class LoyaltyprogramService {
  /** Java: `endDate = startDate + tenure * 30L * 24 * 60 * 60 * 1000`. */
  private static readonly MONTH_MS = 30 * 24 * 60 * 60 * 1000;

  constructor(private readonly repo: LoyaltyprogramRepository) {}

  /**
   * Ports enableLoyaltyProgram: an id resolving to an existing config updates it,
   * otherwise a new program is onboarded for the named customer.
   *
   * There is deliberately NO "fall back to the newest config in the table"
   * branch. The previous implementation had one, so a super-user PATCH carrying
   * neither an id nor a customerId silently rewrote some arbitrary customer's
   * discount terms.
   */
  async enableLoyaltyProgram(input: LoyaltyProgramConfigInput): Promise<LoyaltyProgramConfigData> {
    if (!(await this.repo.customerExists(input.customerId))) {
      // Java: `if (customer == null) return ActionCode.INCORRECT_INFORMATION`.
      throw new BadRequestException(`Unknown customer ${input.customerId}`);
    }

    const now = Date.now();
    const startDate = now;
    const endDate = startDate + input.tenure * LoyaltyprogramService.MONTH_MS;

    const existing = input.id === null ? null : await this.repo.getConfigById(input.id);

    if (!existing) {
      return this.repo.insertConfig(input, startDate, endDate, now);
    }

    // The config is unique per customer; refuse to repoint an existing row at a
    // different customer, which would move one customer's terms onto another.
    if (existing.customerId !== input.customerId) {
      throw new BadRequestException(
        `Loyalty config ${existing.id} belongs to customer ${existing.customerId}`,
      );
    }

    const updated = await this.repo.updateConfig(
      input.id as bigint,
      existing.version,
      input,
      startDate,
      endDate,
      now,
    );

    if (!updated) {
      // Version-pinned update matched nothing: someone else changed the config
      // between the read and the write. Fail loudly rather than replay.
      throw new BadRequestException(
        `Loyalty config ${existing.id} was modified concurrently; re-read and retry`,
      );
    }
    return updated;
  }

  /**
   * Ports getCustomerLoyaltyProgramMembershipInfo. Loom resolves the customer
   * from the authorization token; this takes the tenant RolesGuard attached to
   * the request and never a caller-supplied id, so tenant A cannot read tenant
   * B's terms.
   */
  async getCustomerInfo(tenantId: number): Promise<CustomerLoyaltyProgramMembershipInfo> {
    const customerId = await this.repo.getCustomerIdForTenant(tenantId);
    if (customerId === null) throw new ForbiddenException('No customer record for this tenant');
    const info = await this.repo.getMembershipInfo(customerId);
    if (!info) throw new NotFoundException('No loyalty program for this customer');
    return info;
  }

  /** Reads the loyalty config of one named customer (CODE_SU). */
  async getConfigForCustomer(customerId: number): Promise<LoyaltyProgramConfigData> {
    const config = await this.repo.getConfigByCustomerId(customerId);
    if (!config) throw new NotFoundException(`No loyalty program for customer ${customerId}`);
    return config;
  }

  /**
   * Reads one config by id for the table explorer (CODE_SU only — Loom gates
   * this handler on CODE_SU and does not scope it further).
   */
  async exploreConfigById(id: bigint): Promise<LoyaltyProgramConfigData> {
    const config = await this.repo.getConfigById(id);
    if (!config) throw new NotFoundException(`No loyalty program config ${id}`);
    return config;
  }

  async exploreConfig(page: number, size: number): Promise<LoyaltyProgramConfigData[]> {
    return this.repo.getConfigPage(page, size);
  }

  async exploreAuditLogById(id: bigint): Promise<LoyaltyProgramConfigAuditLogData> {
    const log = await this.repo.getAuditLogById(id);
    if (!log) throw new NotFoundException(`No loyalty program config audit log ${id}`);
    return log;
  }

  async exploreAuditLog(page: number, size: number): Promise<LoyaltyProgramConfigAuditLogData[]> {
    return this.repo.getAuditLogPage(page, size);
  }

  /**
   * LoyaltyInfoService#getCustomerLoyaltyProgramOrders — "returns both normal
   * and custom loyalty orders".
   *
   * Loom runs the two queries on separate CompletableFutures and flatMaps them
   * in the order (regular, custom) with NO combined re-sort, so each half stays
   * sorted created_at DESC but the concatenated list is not globally sorted.
   * That ordering is reproduced exactly rather than "fixed": the storefront
   * renders the list as given, and a global sort would silently change it.
   */
  async getCustomerLoyaltyProgramOrders(tenantId: bigint) {
    const [orders, customOrders] = await Promise.all([
      this.repo.findCustomerLoyaltyProgramOrders(tenantId),
      this.repo.findCustomerLoyaltyProgramCustomOrders(tenantId),
    ]);
    return [...orders, ...customOrders];
  }
}
