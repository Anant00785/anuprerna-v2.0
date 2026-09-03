import {
  Controller,
  Post,
  Delete,
  UploadedFile,
  Body,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiProperty, ApiTags } from "@nestjs/swagger";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { ImageService } from "../service/image.service.js";
import { validateImageFile } from "../validators/image.validator.js";

import { IsNotEmpty, IsString } from "class-validator";
import type { UploadedFile as MultipartFile } from "../../product/category/types/category.types.js";

export class DeleteImageDto {
  @ApiProperty({ example: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/sample.jpg", description: "S3 Image URL to delete" })
  @IsNotEmpty()
  @IsString()
  imgUrl!: string;
}

@Controller()
@ApiTags("Image")
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  /**
   * POST /upload/image
   * Accepts a multipart/form-data file field named "imageFile".
   * Returns the public S3 URL.
   */
  @Post("/upload/image")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Upload an image file to S3 storage." })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["imageFile"],
      properties: {
        imageFile: {
          type: "string",
          format: "binary",
          description: "Image file to upload (JPEG, PNG, WEBP, etc.)",
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor("imageFile"))
  async uploadImage(@UploadedFile() file: MultipartFile) {
    const error = validateImageFile(file?.mimetype, file?.size);
    if (error) throw new BadRequestException(error);

    const url = await this.imageService.uploadImage(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    return keyedResponse("url", url);
  }

  /**
   * DELETE /delete/image
   * Accepts JSON body { imgUrl: string }.
   * Initiates an async delete from S3 (fire-and-forget, matches Java behaviour).
   */
  @Delete("/delete/image")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Initiate deletion of an S3 image." })
  @ApiBody({ type: DeleteImageDto })
  async deleteImage(@Body() body: DeleteImageDto) {
    const imgUrl = body?.imgUrl ?? "";
    this.imageService.initiateDeleteImageTask(imgUrl);
    return simpleResponse(true, "Delete initiated");
  }
}
