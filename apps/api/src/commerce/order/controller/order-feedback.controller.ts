// @ts-nocheck
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
/**
 * migrated/order/controller/order-feedback.controller.ts
 */
import { Controller, Get, Post, Patch, Param, Body, UseGuards } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";

@ApiBearerAuth()
@ApiTags("Order")
@Controller()
@UseGuards(RolesGuard)
export class OrderFeedbackController {

  @Post("/add/order/feedback")
  @RequireGate(GateCode.CODE_CU)
  async addFeedback(@Body() body: any) {
    return simpleResponse(true, "Feedback submitted");
  }

  @Patch("/update/order/feedback/q1")
  @RequireGate(GateCode.CODE_CU)
  async updateFeedbackQ1(@Body() body: any) {
    return simpleResponse(true, "Feedback updated");
  }

  @Patch("/update/order/feedback/q2")
  @RequireGate(GateCode.CODE_CU)
  async updateFeedbackQ2(@Body() body: any) {
    return simpleResponse(true, "Feedback updated");
  }

  @Patch("/update/order/feedback/q3")
  @RequireGate(GateCode.CODE_CU)
  async updateFeedbackQ3(@Body() body: any) {
    return simpleResponse(true, "Feedback updated");
  }

  @Get("/get/order/feedback/:orderId")
  async getFeedbackByOrder(@Param("orderId") orderId: string) {
    return keyedResponse("feedback", null);
  }

  @Get("/get/super-user/order/feedback/:feedbackId")
  @RequireGate(GateCode.CODE_SU)
  async getFeedbackById(@Param("feedbackId") feedbackId: string) {
    return keyedResponse("feedback", null);
  }

  @Get("/get/order/feedback-list")
  async getFeedbackList() {
    return keyedResponse("feedbackList", []);
  }
}
