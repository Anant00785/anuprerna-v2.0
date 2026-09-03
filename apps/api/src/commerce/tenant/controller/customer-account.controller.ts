import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  BadRequestException,
  NotImplementedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantService } from '../service/tenant.service.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import { CurrentTenant } from '../../../common/auth/current-tenant.decorator.js';
import { simpleResponse } from '../../../common/response/rain-response.js';

/**
 * Endpoints the rebuilt storefront invented — they do not exist in legacy Loom.
 * Contracts are taken from the callers:
 *   apps/storefront/src/app/api/customer/buyer-type/route.ts
 *   apps/storefront/src/app/api/customer/buyer-type/prompt/route.ts
 *   apps/storefront/src/app/api/customer/signup-details/route.ts
 *   apps/storefront/src/lib/api/repositories/profile.repository.ts (selected-forex)
 *
 * THE BUYER-TYPE HOLE. There is nowhere in the schema to record a declared
 * buyer type. `loom_tenant` has no buyer_type/company/gst column, `customer`
 * has only wishlist + default_currency + whatsapp_* , and `user_role_enum` is
 * ('ROLE_GOD_MODE','ROLE_SUPER_USER','ROLE_ADMIN','ROLE_CUSTOMER','ROLE_ARTISAN')
 * — there is no ROLE_WHOLESALE to grant even if granting it were allowed, and
 * it is not: b2c-b2b.contract.md says login defaults to B2C and bulk data
 * unlocks only on an upgrade, so an unverified self-declaration must never
 * escalate a role. Adding a column is DDL, which is out of scope here.
 *
 * So the three buyer-type writes answer 501 naming exactly what is missing,
 * rather than returning success for a value that went nowhere. Callers already
 * render the message.
 */
@ApiTags('Customer Account')
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class CustomerAccountController {
  /** The one place the missing-persistence answer is spelled out. */
  private static readonly NO_BUYER_TYPE_COLUMN =
    'Buyer type cannot be recorded yet: there is no buyer_type column on loom_tenant, ' +
    'no preferences row to hold it, and no ROLE_WHOLESALE in user_role_enum. ' +
    'Nothing was stored.';

  private static readonly CHOICES = ['myself', 'business', 'skip'];
  private static readonly SOURCING = ['fabric', 'finished', 'both'];
  private static readonly PROMPT_ACTIONS = ['shown', 'dismissed'];
  /** The currencies the storefront store supports (SupportedCurrency). */
  private static readonly CURRENCIES = ['inr', 'usd', 'gbp', 'eur'];

  constructor(private readonly tenantService: TenantService) {}

  /** The caller's own record. A tenant id in the body is never honoured. */
  private tenantId(tenant: any): number {
    return Number(tenant?.tenantId ?? tenant?.id);
  }

  private static text(value: unknown): string {
    return String(value ?? '').trim().toLowerCase();
  }

  @Post('customer/buyer-type')
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: 'Declare who the buyer buys for (myself | business | skip).' })
  async declareBuyerType(@CurrentTenant() tenant: any, @Body() body: any) {
    this.tenantId(tenant);
    const choice = CustomerAccountController.text(body?.choice);
    if (!CustomerAccountController.CHOICES.includes(choice)) {
      throw new BadRequestException('Tell us who you buy for.');
    }
    throw new NotImplementedException(CustomerAccountController.NO_BUYER_TYPE_COLUMN);
  }

  /**
   * Advisory only — nothing here may change the account.
   *
   * The answer is a flat "no offer", and that is the correct answer, not a
   * stub: accepting the offer goes through POST /customer/buyer-type, which
   * cannot store the acceptance, and a dismissal cannot be recorded either
   * (the caller requires it to stick across sessions and devices). Offering an
   * upgrade that cannot be taken or dismissed is worse than not offering it.
   * Compute the real thresholds here once a buyer-type column exists.
   */
  @Get('customer/buyer-type/prompt')
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: 'Should this retail buyer be offered a business account?' })
  async getBuyerTypePrompt(@CurrentTenant() tenant: any) {
    this.tenantId(tenant);
    return { success: true, message: '', shouldPrompt: false, reason: null };
  }

  @Post('customer/buyer-type/prompt')
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: 'Record what happened to the business-account offer.' })
  async recordBuyerTypePrompt(@CurrentTenant() tenant: any, @Body() body: any) {
    this.tenantId(tenant);
    const action = CustomerAccountController.text(body?.action);
    if (!CustomerAccountController.PROMPT_ACTIONS.includes(action)) {
      throw new BadRequestException('Unknown action.');
    }
    throw new NotImplementedException(
      'The business-account offer cannot be recorded yet: there is no column for a ' +
        'buyer-type prompt shown/dismissed state. Nothing was stored.',
    );
  }

  /**
   * Everything the signup screen collects, in one write. Every field optional.
   * `name` has a real home (`loom_tenant.user_name`); `choice` and `sourcing`
   * do not. The name is saved first — it is valid data on its own and losing
   * it is the bug this repo already shipped once — and then the unstorable
   * fields are reported instead of dropped.
   */
  @Post('customer/signup-details')
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: 'Save the signup screen: name, buyer-type choice, sourcing hint.' })
  async saveSignupDetails(@CurrentTenant() tenant: any, @Body() body: any) {
    const tenantId = this.tenantId(tenant);
    const name = String(body?.name ?? '').trim().replace(/\s+/g, ' ').slice(0, 120);
    const choice = CustomerAccountController.text(body?.choice);
    const sourcing = CustomerAccountController.text(body?.sourcing);

    if (choice && !CustomerAccountController.CHOICES.includes(choice)) {
      throw new BadRequestException('Tell us who you buy for.');
    }
    if (sourcing && !CustomerAccountController.SOURCING.includes(sourcing)) {
      throw new BadRequestException('Unknown sourcing option.');
    }

    if (name) {
      await this.tenantService.updateCustomerProfile(tenantId, { name });
    }

    if (choice || sourcing) {
      const unstorable = [choice && 'buyer type', sourcing && 'sourcing preference'].filter(Boolean).join(' and ');
      throw new NotImplementedException(
        `${name ? 'Your name was saved, but t' : 'T'}he ${unstorable} could not be: ` +
          CustomerAccountController.NO_BUYER_TYPE_COLUMN,
      );
    }

    return simpleResponse(true, name ? 'Saved.' : 'Nothing to save.');
  }

  /** Display-currency preference -> customer.default_currency (upsert). */
  @Post('customer/update/selected-forex')
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: 'Update the customer display currency.' })
  async updateSelectedForex(@CurrentTenant() tenant: any, @Body() body: any) {
    const tenantId = this.tenantId(tenant);
    const currency = CustomerAccountController.text(body?.currency);
    if (!CustomerAccountController.CURRENCIES.includes(currency)) {
      throw new BadRequestException('Unsupported currency.');
    }
    await this.tenantService.setSelectedCurrency(tenantId, currency.toUpperCase());
    return simpleResponse(true, 'Currency preference saved.');
  }
}
