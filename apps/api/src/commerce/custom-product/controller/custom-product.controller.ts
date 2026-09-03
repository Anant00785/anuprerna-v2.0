/**
 * Loom: product/controller/CustomProductController.java
 *
 *   GET   /get/custom-product/{productId}  CODE_SU  key `customProduct`
 *   GET   /get/custom-product              CODE_SU  key `customProductList`
 *   POST  /add/custom-product              CODE_SU  RainTreeResponse
 *   PATCH /update/custom-product           CODE_SU  RainTreeResponse
 *
 * The CMS reads these keys verbatim — apps/cms/src/lib/custom-products-api.ts.
 */
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { BadRequestException, Body, Controller, Get, HttpCode, NotFoundException, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { keyedResponse, simpleResponse } from "../../../common/response/rain-response.js";
import { CustomProductService } from "../service/custom-product.service.js";
import {
  CreateCustomProductDto,
  UpdateCustomProductDto,
  parseCustomProductInput,
  validateCustomProduct,
} from "../dto/custom-product.dto.js";

@ApiBearerAuth()
@ApiTags("Custom Product")
@Controller()
@UseGuards(RolesGuard)
export class CustomProductController {
  constructor(private readonly service: CustomProductService) {}

  @Get("/get/custom-product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "All custom products." })
  @ApiResponse({ status: 200, description: "Custom product list." })
  async getCustomProducts() {
    return keyedResponse("customProductList", await this.service.getCustomProducts());
  }

  @Get("/get/custom-product/:productId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "One custom product by id." })
  @ApiParam({ name: "productId", type: Number, example: 1 })
  @ApiResponse({ status: 200, description: "Custom product." })
  @ApiResponse({ status: 404, description: "No custom product with that id." })
  async getCustomProduct(@Param("productId") productId: string) {
    const product = await this.service.getCustomProduct(idOf(productId, "productId"));
    // 404, not a 200 carrying null: the CMS detail page cannot tell an absent
    // record from a broken read otherwise. Paired with the 404 -> null catch in
    // apps/cms/src/lib/custom-products-api.ts#getCustomProductById; do not flip
    // one without the other.
    if (!product) throw new NotFoundException("No custom product matched this id.");
    return keyedResponse("customProduct", product);
  }

  @Post("/add/custom-product")
  @HttpCode(200)
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create a custom product." })
  @ApiBody({ type: CreateCustomProductDto })
  @ApiResponse({ status: 200, description: "Creation result." })
  async addCustomProduct(@Body() body: CreateCustomProductDto) {
    const input = parseCustomProductInput(body);
    const error = validateCustomProduct(input);
    if (error) return simpleResponse(false, error);

    const created = await this.service.addCustomProduct(input);
    return simpleResponse(created, created ? "New custom product created." : "Failed to create custom product.");
  }

  @Patch("/update/custom-product")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update a custom product." })
  @ApiBody({ type: UpdateCustomProductDto })
  @ApiResponse({ status: 200, description: "Update result." })
  async updateCustomProduct(@Body() body: UpdateCustomProductDto) {
    const input = parseCustomProductInput(body);
    const error = validateCustomProduct(input);
    if (error) return simpleResponse(false, error);
    if (!input.id) return simpleResponse(false, "Custom product id is required.");

    const updated = await this.service.updateCustomProduct(input.id, input);
    return simpleResponse(updated, updated ? "Custom product updated." : "Failed to update custom product.");
  }
}

function idOf(raw: string, field: string): number {
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n <= 0) throw new BadRequestException(`${field} must be a positive integer.`);
  return n;
}
