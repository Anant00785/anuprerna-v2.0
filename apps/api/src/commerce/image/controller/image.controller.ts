// @ts-nocheck
/**
 * migrated/image/controller/image.controller.ts
 *
 * Ports Java's ImageController.
 *
 * Endpoints:
 *   POST   /upload/image   - multipart/form-data; field "imageFile"
 *   DELETE /delete/image   - JSON body { imgUrl: string }
 *
 * Java auth: /upload/image is CODE_SU, /delete/image is CODE_SU
 */
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
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { simpleResponse, keyedResponse } from "../../../common/response/rain-response.js";
import { ImageService } from "../service/image.service.js";
import { validateImageFile } from "../validators/image.validator.js";

@Controller()
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
  @UseInterceptors(FileInterceptor("imageFile"))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
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
  async deleteImage(@Body() body: { imgUrl?: string }) {
    const imgUrl = body?.imgUrl ?? "";
    this.imageService.initiateDeleteImageTask(imgUrl);
    return simpleResponse(true, "Delete initiated");
  }
}
// @ts-nocheck
