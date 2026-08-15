// @ts-nocheck
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Post, Param, Query, Body, UseGuards, Req, Headers, BadRequestException } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { RazorpayPaymentService } from "../service/razorpay-payment.service.js";
import { StripePaymentService } from "../service/stripe-payment.service.js";
import { 
    parseRazorpayPaymentInput, 
    parseRazorpayPaymentSuccessInput, 
    parseRazorpayPaymentFailureInput, 
    parseRazorpayPaymentUpdateInput,
    parseStripePaymentOrderInput 
} from "../dto/payment.dto.js";
import { 
    validateRazorpayPaymentInput, 
    validateRazorpayPaymentSuccessInput, 
    validateRazorpayPaymentFailureInput, 
    validateRazorpayPaymentUpdateInput,
    validateStripePaymentOrderInput 
} from "../validators/payment.validator.js";
import { 
    sanitizeRazorpayPaymentInput, 
    sanitizeRazorpayPaymentSuccessInput, 
    sanitizeRazorpayPaymentFailureInput, 
    sanitizeRazorpayPaymentUpdateInput,
    sanitizeStripePaymentOrderInput 
} from "../validators/payment.sanitizer.js";

@ApiBearerAuth()
@ApiTags("Payment")
@Controller()
@UseGuards(RolesGuard)
export class PaymentController {
    constructor(
        private readonly razorpayService: RazorpayPaymentService,
        private readonly stripeService: StripePaymentService
    ) {}

    @Post("/create/payment-session")
    @RequireGate(GateCode.CODE_CU)
    async createPaymentSession(
        @CurrentTenant() tenant: AuthenticatedTenant,
        @Body() body: unknown
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
    async createStripePaymentSession(
        @CurrentTenant() tenant: AuthenticatedTenant,
        @Body() body: unknown
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

    @Post("/update/payment/success")
    @RequireGate(GateCode.CODE_CU)
    async updateTransactionSuccess(
        @CurrentTenant() tenant: AuthenticatedTenant,
        @Body() body: unknown
    ) {
        let input = parseRazorpayPaymentSuccessInput(body);
        input = sanitizeRazorpayPaymentSuccessInput(input);
        const error = validateRazorpayPaymentSuccessInput(input);
        if (error) return simpleResponse(false, error);

        try {
            const opCode = await this.razorpayService.updateTransactionSuccess(tenant, input);
            return simpleResponse(opCode > 0, opCode > 0 ? "Transaction updated." : "Failed to update transaction.");
        } catch (e: any) {
            return simpleResponse(false, e.message);
        }
    }

    @Post("/update/payment/failure")
    @RequireGate(GateCode.CODE_CU)
    async updateTransactionFailure(
        @CurrentTenant() tenant: AuthenticatedTenant,
        @Body() body: unknown
    ) {
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

    @Post("/update/payment/transaction")
    @RequireGate(GateCode.CODE_SU)
    async updatePaymentTransaction(
        @CurrentTenant() tenant: AuthenticatedTenant,
        @Body() body: unknown
    ) {
        let input = parseRazorpayPaymentUpdateInput(body);
        input = sanitizeRazorpayPaymentUpdateInput(input);
        const error = validateRazorpayPaymentUpdateInput(input);
        if (error) return simpleResponse(false, error);

        try {
            const opCode = await this.razorpayService.updateTransaction(input);
            return simpleResponse(opCode > 0, opCode > 0 ? "Transaction updated." : "Failed to update transaction.");
        } catch (e: any) {
            return simpleResponse(false, e.message);
        }
    }

    @Get("/get/table-explorer/data/razorpay-transaction")
  @RequireGate(GateCode.CODE_SU)
    async getRazorpayTransactionData(
        @Query("page") page: string = "0",
        @Query("size") size: string = "10"
    ) {
        const data = await this.razorpayService.getTransactionData(parseInt(page, 10), parseInt(size, 10));
        return keyedResponse("entityList", data);
    }

    @Get("/get/table-explorer/data/razorpay-transaction/:id")
  @RequireGate(GateCode.CODE_SU)
    async getRazorpayTransactionById(@Param("id") id: string) {
        const data = await this.razorpayService.getTransactionById(BigInt(id));
        return keyedResponse("entity", data);
    }

    @Get("/get/table-explorer/data/stripe-transaction")
  @RequireGate(GateCode.CODE_SU)
    async getStripeTransactionData(
        @Query("page") page: string = "0",
        @Query("size") size: string = "10"
    ) {
        const data = await this.stripeService.getTransactionData(parseInt(page, 10), parseInt(size, 10));
        return keyedResponse("entityList", data);
    }

    @Get("/get/table-explorer/data/stripe-transaction/:id")
  @RequireGate(GateCode.CODE_SU)
    async getStripeTransactionById(@Param("id") id: string) {
        const data = await this.stripeService.getTransactionById(BigInt(id));
        return keyedResponse("entity", data);
    }

    @Post("/checkout/stripe/webhook")
    async checkoutStripeWebhook(
        @Headers("Stripe-Signature") signature: string,
        @Body() payload: any
    ) {
        if (!signature) {
            throw new BadRequestException("Missing signature");
        }
        
        try {
            const event = payload; // In a real scenario, this would be constructed using the Stripe SDK to verify the signature.
            const session = event.data?.object;

            if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
                await this.stripeService.handlePaymentSuccess(session, event);
            } else if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
                await this.stripeService.handlePaymentFailure(session, event);
            }
            // Other events can be handled similarly

            return { status: "Success" };
        } catch (e: any) {
            throw new BadRequestException(e.message);
        }
    }
}
