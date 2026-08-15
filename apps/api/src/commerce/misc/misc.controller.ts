import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional, IsString } from "class-validator";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { MiscService } from "./misc.service.js";

export class ContactUsDto {
  @ApiProperty({ description: "Customer name", example: "John Doe" })
  @IsString()
  name!: string;

  @ApiProperty({ description: "Customer email", example: "john@example.com" })
  @IsString()
  email!: string;

  @ApiPropertyOptional({ description: "Customer phone number", example: "+919876543210" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: "Customer country", example: "India" })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: "Company name" })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ description: "Company website URL" })
  @IsOptional()
  @IsString()
  companyWebsite?: string;

  @ApiPropertyOptional({ description: "Product type inquiry" })
  @IsOptional()
  @IsString()
  productType?: string;

  @ApiPropertyOptional({ description: "Product description" })
  @IsOptional()
  @IsString()
  productDescription?: string;

  @ApiPropertyOptional({ description: "Order quantity requested" })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ description: "Target delivery date epoch timestamp" })
  @IsOptional()
  @IsNumber()
  deliveryDate?: number;

  @ApiPropertyOptional({ description: "Attachment file URLs", type: [String] })
  @IsOptional()
  @IsArray()
  attachments?: string[];
}

@ApiTags("Misc")
@Controller()
export class MiscController {
  constructor(private readonly service: MiscService) {}

  @Get("get/misc")
  @ApiOperation({ summary: "Get all misc records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("send/contact-us")
  @HttpCode(200)
  @ApiOperation({ summary: "Customer contact form submission (send)" })
  @ApiBody({ type: ContactUsDto })
  async sendContactUs(@Body() body: ContactUsDto) {
    if (!body || !body.name || !body.email) {
      return { success: false, response: "Fill up all necessary fields!" };
    }
    return { success: true, response: "Form submitted successfully!" };
  }

  @Post("submit/contact-us")
  @HttpCode(200)
  @ApiOperation({ summary: "Customer contact form submission (submit)" })
  @ApiBody({ type: ContactUsDto })
  async submitContactUs(@Body() body: ContactUsDto) {
    if (!body || !body.name || !body.email) {
      return { success: false, response: "Fill up all necessary fields!" };
    }
    return { success: true, response: "Form submitted successfully!" };
  }

  @Post("create/misc")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a misc record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}
