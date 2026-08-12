// @ts-nocheck
import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { FaqService } from "../service/faq.service.js";
import { parseFaqInput } from "../dto/faq.dto.js";
import { validateFaq } from "../validators/faq.validator.js";
import { sanitizeFaq } from "../validators/faq.sanitizer.js";
import { FAQ_MESSAGES } from "../types/faq.types.js";

@Controller()
@ApiTags("FAQ")
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class FaqController {
    constructor(private readonly faqService: FaqService) {}

    @Get("/get/faqs")
    @RequireGate(GateCode.CODE_SU)
    async getFaqList() {
        const list = await this.faqService.retrieveFaqList();
        return keyedResponse("faqList", list);
    }

    @Get("/get/faq/:faqId")
    @RequireGate(GateCode.CODE_SU)
    async getFaq(@Param("faqId") faqId: string) {
        const id = BigInt(faqId);
        const entity = await this.faqService.retrieveFaqById(id);
        if (!entity) return simpleResponse(false, "FAQ not found");
        return keyedResponse("faq", entity);
    }

    @Post("/add/faq")
    @RequireGate(GateCode.CODE_SUCU)
    async createFaq(@Body() rawBody: unknown) {
        const input = parseFaqInput(rawBody);
        const sanitized = sanitizeFaq(input);
        
        const validationError = validateFaq(sanitized);
        if (validationError) {
            return simpleResponse(false, validationError);
        }

        const success = await this.faqService.createNewFaq(sanitized);
        return simpleResponse(success, success ? FAQ_MESSAGES.NEW_FAQ_CREATED : "Failed to create FAQ");
    }

    @Patch("/update/faq")
    @RequireGate(GateCode.CODE_SUCU)
    async updateFaq(@Body() rawBody: unknown) {
        const input = parseFaqInput(rawBody);
        const sanitized = sanitizeFaq(input);
        
        const validationError = validateFaq(sanitized);
        if (validationError) {
            return simpleResponse(false, validationError);
        }

        const success = await this.faqService.updateExistingFaq(sanitized);
        return simpleResponse(success, success ? FAQ_MESSAGES.FAQ_UPDATED : "Failed to update FAQ");
    }

    @Get("/get/table-explorer/data/faq")
    @RequireGate(GateCode.CODE_SU)
    async getFaqData(
        @Query("page") pageStr: string,
        @Query("size") sizeStr: string
    ) {
        const page = parseInt(pageStr, 10) || 0;
        const size = parseInt(sizeStr, 10) || 10;
        const data = await this.faqService.retrieveFaqData(page, size);
        return keyedResponse("faqDataList", data);
    }

    @Get("/get/table-explorer/data/faq/:id")
    @RequireGate(GateCode.CODE_SU)
    async getFaqById(@Param("id") idStr: string) {
        const id = BigInt(idStr);
        const data = await this.faqService.retrieveFaqDataById(id);
        if (!data) return simpleResponse(false, "FAQ Data not found");
        return keyedResponse("faqData", data);
    }

    @Get("/get/table-explorer/data/faq-question")
    @RequireGate(GateCode.CODE_SU)
    async getFaqQuestionData(
        @Query("page") pageStr: string,
        @Query("size") sizeStr: string
    ) {
        const page = parseInt(pageStr, 10) || 0;
        const size = parseInt(sizeStr, 10) || 10;
        const data = await this.faqService.retrieveFaqQuestionData(page, size);
        return keyedResponse("faqQuestionDataList", data);
    }

    @Get("/get/table-explorer/data/faq-question/:id")
    @RequireGate(GateCode.CODE_SU)
    async getFaqQuestionById(@Param("id") idStr: string) {
        const id = BigInt(idStr);
        const data = await this.faqService.retrieveFaqQuestionDataById(id);
        if (!data) return simpleResponse(false, "FAQ Question Data not found");
        return keyedResponse("faqQuestionData", data);
    }
}
// @ts-nocheck
