import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Headers,
  BadRequestException,
  type RawBodyRequest,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import type { EnvironmentVariables } from "../../../common/config/env.schema.js";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { RazorpayPaymentService } from "../service/razorpay-payment.service.js";
import { StripePaymentService } from "../service/stripe-payment.service.js";
import {
  CreateRazorpayPaymentSessionDto,
  CreateStripePaymentSessionDto,
  UpdatePaymentSuccessDto,
  UpdatePaymentFailureDto,
  UpdatePaymentTransactionDto,
  parseRazorpayPaymentInput,
  parseRazorpayPaymentSuccessInput,
  parseRazorpayPaymentFailureInput,
  parseRazorpayPaymentUpdateInput,
  parseStripePaymentOrderInput,
} from "../dto/payment.dto.js";
import {
  validateRazorpayPaymentInput,
  validateRazorpayPaymentSuccessInput,
  validateRazorpayPaymentFailureInput,
  validateRazorpayPaymentUpdateInput,
  validateStripePaymentOrderInput,
} from "../validators/payment.validator.js";
import {
  sanitizeRazorpayPaymentInput,
  sanitizeRazorpayPaymentSuccessInput,
  sanitizeRazorpayPaymentFailureInput,
  sanitizeRazorpayPaymentUpdateInput,
  sanitizeStripePaymentOrderInput,
} from "../validators/payment.sanitizer.js";

/** Stripe's own default replay window. */
const STRIPE_SIGNATURE_TOLERANCE_SECONDS = 300;

@ApiBearerAuth()
@ApiTags("Payment")
@Controller()
@UseGuards(RolesGuard)
export class PaymentController {
  constructor(
    private readonly razorpayService: RazorpayPaymentService,
    private readonly stripeService: StripePaymentService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Post("/create/payment-session")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Create Razorpay payment session for an order" })
  @ApiBody({ type: CreateRazorpayPaymentSessionDto })
  @ApiResponse({ status: 201, description: "Payment session created" })
  async createPaymentSession(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Body() body: CreateRazorpayPaymentSessionDto,
  ) {
    let input = parseRazorpayPaymentInput(body);
    input = sanitizeRazorpayPaymentInput(input);
    const error = validateRazorpayPaymentInput(input);
    if (error) return simpleResponse(false, error);

    try {
      const session = await this.razorpayService.createSession(tenant, input);
      return keyedResponse("entity", session);
    } catch (e: any) {
      return simpleResponse(false, e.message);
    }
  }

  @Post("/create/stripe/payment-session")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Create Stripe payment session for an order" })
  @ApiBody({ type: CreateStripePaymentSessionDto })
  @ApiResponse({ status: 201, description: "Stripe payment session created" })
  async createStripePaymentSession(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Body() body: CreateStripePaymentSessionDto,
  ) {
    let input = parseStripePaymentOrderInput(body);
    input = sanitizeStripePaymentOrderInput(input);
    const error = validateStripePaymentOrderInput(input);
    if (error) return simpleResponse(false, error);

    try {
      const session = await this.stripeService.createSession(tenant, input);
      return keyedResponse("entity", session);
    } catch (e: any) {
      return simpleResponse(false, e.message);
    }
  }

  private async handleUpdateSuccess(tenant: any, body: UpdatePaymentSuccessDto) {
    let input = parseRazorpayPaymentSuccessInput(body);
    input = sanitizeRazorpayPaymentSuccessInput(input);
    const error = validateRazorpayPaymentSuccessInput(input);
    if (error) return simpleResponse(false, error);

    try {
      const opCode = await this.razorpayService.updateTransactionSuccess(tenant, input);
      return simpleResponse(opCode > 0, opCode > 0 ? "Transaction updated successfully." : "Failed to update transaction.");
    } catch (e: any) {
      return simpleResponse(false, e.message);
    }
  }

  @Post("/update/payment/success")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Handle successful payment callback (POST)" })
  @ApiBody({ type: UpdatePaymentSuccessDto })
  @ApiResponse({ status: 200, description: "Payment status updated to success" })
  async postTransactionSuccess(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Body() body: UpdatePaymentSuccessDto,
  ) {
    return this.handleUpdateSuccess(tenant, body);
  }

  @Patch("/update/payment/success")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Handle successful payment callback (PATCH)" })
  @ApiBody({ type: UpdatePaymentSuccessDto })
  @ApiResponse({ status: 200, description: "Payment status updated to success" })
  async patchTransactionSuccess(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Body() body: UpdatePaymentSuccessDto,
  ) {
    return this.handleUpdateSuccess(tenant, body);
  }

  private async handleUpdateFailure(body: UpdatePaymentFailureDto) {
    let input = parseRazorpayPaymentFailureInput(body);
    input = sanitizeRazorpayPaymentFailureInput(input);
    const error = validateRazorpayPaymentFailureInput(input);
    if (error) return simpleResponse(false, error);

    try {
      const opCode = await this.razorpayService.updateTransactionFailure(input);
      return simpleResponse(opCode > 0, opCode > 0 ? "Transaction marked as failed." : "Failed to update transaction.");
    } catch (e: any) {
      return simpleResponse(false, e.message);
    }
  }

  @Post("/update/payment/failure")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Handle failed payment callback (POST)" })
  @ApiBody({ type: UpdatePaymentFailureDto })
  @ApiResponse({ status: 200, description: "Payment status updated to failed" })
  async postTransactionFailure(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Body() body: UpdatePaymentFailureDto,
  ) {
    return this.handleUpdateFailure(body);
  }

  @Patch("/update/payment/failure")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Handle failed payment callback (PATCH)" })
  @ApiBody({ type: UpdatePaymentFailureDto })
  @ApiResponse({ status: 200, description: "Payment status updated to failed" })
  async patchTransactionFailure(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Body() body: UpdatePaymentFailureDto,
  ) {
    return this.handleUpdateFailure(body);
  }

  private async handleUpdateTransaction(body: UpdatePaymentTransactionDto) {
    let input = parseRazorpayPaymentUpdateInput(body);
    input = sanitizeRazorpayPaymentUpdateInput(input);
    const error = validateRazorpayPaymentUpdateInput(input);
    if (error) return simpleResponse(false, error);

    try {
      const opCode = await this.razorpayService.updateTransaction(input);
      return simpleResponse(opCode > 0, opCode > 0 ? "Transaction updated successfully." : "Failed to update transaction.");
    } catch (e: any) {
      return simpleResponse(false, e.message);
    }
  }

  @Post("/update/payment/transaction")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update general payment transaction status (POST)" })
  @ApiBody({ type: UpdatePaymentTransactionDto })
  @ApiResponse({ status: 200, description: "Payment transaction updated" })
  async postPaymentTransaction(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Body() body: UpdatePaymentTransactionDto,
  ) {
    return this.handleUpdateTransaction(body);
  }

  @Patch("/update/payment/transaction")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update general payment transaction status (PATCH)" })
  @ApiBody({ type: UpdatePaymentTransactionDto })
  @ApiResponse({ status: 200, description: "Payment transaction updated" })
  async patchPaymentTransaction(
    @CurrentTenant() tenant: AuthenticatedTenant,
    @Body() body: UpdatePaymentTransactionDto,
  ) {
    return this.handleUpdateTransaction(body);
  }

  @Get("/get/table-explorer/data/razorpay-transaction")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for Razorpay transactions" })
  async getRazorpayTransactionData(
    @Query("page") page: string = "0",
    @Query("size") size: string = "10",
  ) {
    const data = await this.razorpayService.getTransactionData(parseInt(page, 10), parseInt(size, 10));
    return keyedResponse("entityList", data);
  }

  @Get("/get/table-explorer/data/razorpay-transaction/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Get Razorpay transaction by ID" })
  @ApiParam({ name: "id", example: 1, type: Number })
  async getRazorpayTransactionById(@Param("id") id: string) {
    const data = await this.razorpayService.getTransactionById(BigInt(id));
    return keyedResponse("entity", data);
  }

  @Get("/get/table-explorer/data/stripe-transaction")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for Stripe transactions" })
  async getStripeTransactionData(
    @Query("page") page: string = "0",
    @Query("size") size: string = "10",
  ) {
    const data = await this.stripeService.getTransactionData(parseInt(page, 10), parseInt(size, 10));
    return keyedResponse("entityList", data);
  }

  @Get("/get/table-explorer/data/stripe-transaction/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Get Stripe transaction by ID" })
  @ApiParam({ name: "id", example: 1, type: Number })
  async getStripeTransactionById(@Param("id") id: string) {
    const data = await this.stripeService.getTransactionById(BigInt(id));
    return keyedResponse("entity", data);
  }

  /**
   * Verifies a Stripe webhook signature the way Stripe's own SDK does
   * (`Webhook.constructEvent` in Loom's StripeWebhookController): HMAC-SHA256 of
   * `<timestamp>.<raw body>` keyed with the endpoint secret, compared in constant
   * time against the `v1` scheme in the header, within a 5-minute tolerance.
   *
   * Implemented with node:crypto because the `stripe` package is not a dependency
   * of this API and this is the whole of what it would be used for.
   */
  private constructStripeEvent(rawBody: Buffer | undefined, signatureHeader: string): any {
    const secret = this.config.get("STRIPE_WEBHOOK_SECRET", { infer: true });
    // Fail closed: an unconfigured endpoint secret means no webhook can be trusted.
    if (!secret) throw new BadRequestException("Stripe webhook secret is not configured");
    if (!signatureHeader) throw new BadRequestException("Missing Stripe signature");
    if (!rawBody) throw new BadRequestException("Missing raw request body for signature verification");

    const parts = new Map(
      signatureHeader
        .split(",")
        .map((part) => part.split("=", 2))
        .filter((pair): pair is [string, string] => pair.length === 2)
        .map(([key, value]) => [key.trim(), value.trim()] as [string, string]),
    );

    const timestamp = parts.get("t");
    const provided = parts.get("v1");
    if (!timestamp || !provided) throw new BadRequestException("Malformed Stripe signature header");

    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > STRIPE_SIGNATURE_TOLERANCE_SECONDS) {
      throw new BadRequestException("Stripe signature timestamp outside tolerance");
    }

    const expected = Buffer.from(
      createHmac("sha256", secret).update(`${timestamp}.${rawBody.toString("utf8")}`).digest("hex"),
      "utf8",
    );
    const received = Buffer.from(provided, "utf8");

    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      throw new BadRequestException("Stripe signature verification failed");
    }

    return JSON.parse(rawBody.toString("utf8"));
  }

  @Post("/checkout/stripe/webhook")
  @ApiOperation({ summary: "Stripe webhook handler" })
  async checkoutStripeWebhook(
    @Headers("stripe-signature") signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    // Verification happens before anything else and outside the try/catch below,
    // so a failure can never be reported as a processed event.
    const event = this.constructStripeEvent(request?.rawBody, signature);

    try {
      const session = event?.data?.object;

      if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        await this.stripeService.handlePaymentSuccess(session, event);
      } else if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
        await this.stripeService.handlePaymentFailure(session, event);
      }

      return { status: "Success" };
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
