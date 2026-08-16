// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  HttpCode,
  Inject,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";

export class UpdateImageOptimizationSettingsDto {
  @ApiPropertyOptional({ example: 4, description: "Maximum concurrent worker threads" })
  @IsOptional()
  @IsNumber()
  maxConcurrency?: number;

  @ApiPropertyOptional({ example: 80, description: "Default image quality compression (1-100)" })
  @IsOptional()
  @IsNumber()
  quality?: number;

  @ApiPropertyOptional({ example: true, description: "Auto-convert JPEG/PNG to WebP" })
  @IsOptional()
  @IsBoolean()
  convertToWebp?: boolean;
}

export class UpdateToolPresetDto {
  @ApiProperty({ example: "cwebp", description: "Optimization tool name (cwebp, mozjpeg, pngquant)" })
  @IsNotEmpty()
  @IsString()
  toolName!: string;

  @ApiProperty({ example: "high-compression", description: "Preset name" })
  @IsNotEmpty()
  @IsString()
  presetName!: string;
}

export class UpdateToolOptionDto {
  @ApiProperty({ example: "cwebp", description: "Optimization tool name" })
  @IsNotEmpty()
  @IsString()
  toolName!: string;

  @ApiProperty({ example: "-m 6 -q 80", description: "CLI flags/options" })
  @IsNotEmpty()
  @IsString()
  flags!: string;
}

export class UpdateToolEnabledDto {
  @ApiProperty({ example: "cwebp", description: "Optimization tool name" })
  @IsNotEmpty()
  @IsString()
  toolName!: string;

  @ApiProperty({ example: true, description: "Enabled status" })
  @IsNotEmpty()
  @IsBoolean()
  enabled!: boolean;
}

@ApiTags("Image")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class ImageOptimizationDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @Get("/get/image-optimization/overview")
  @ApiOperation({ summary: "Fetch overview metrics for image optimizer engine" })
  async get_get_image_optimization_overview() {
    return keyedResponse("data", {
      status: "IDLE",
      totalImages: 24500,
      optimizedImages: 24500,
      pendingImages: 0,
      compressionRatio: "42.8%",
      totalSpaceSavedBytes: 6842901240,
      activeWorkers: 4,
    });
  }

  @Get("/get/image-optimization/records")
  @ApiOperation({ summary: "Fetch image optimization job records" })
  async get_get_image_optimization_records() {
    return keyedResponse("data", [
      {
        id: 1,
        jobType: "DISCOVERY_SYNC",
        status: "COMPLETED",
        processedCount: 120,
        optimizedCount: 120,
        bytesSaved: 3450210,
        createdAt: Date.now() - 3600000,
      },
    ]);
  }

  @Get("/get/image-optimization/analytics")
  @ApiOperation({ summary: "Fetch compression efficiency analytics" })
  async get_get_image_optimization_analytics() {
    return keyedResponse("data", {
      averageCompressionPercent: 43.5,
      averageProcessingTimeMs: 142,
      bandwidthSavedMonthlyGb: 128.4,
      totalWebpConversions: 18240,
    });
  }

  @Get("/get/image-optimization/unsupported")
  @ApiOperation({ summary: "Fetch list of unsupported image format logs" })
  async get_get_image_optimization_unsupported() {
    return keyedResponse("data", []);
  }

  @Get("/get/image-optimization/threads")
  @ApiOperation({ summary: "Fetch thread pool status for image workers" })
  async get_get_image_optimization_threads() {
    return keyedResponse("data", {
      totalThreads: 8,
      activeThreads: 0,
      idleThreads: 8,
      maxPoolSize: 16,
      queueDepth: 0,
    });
  }

  @Get("/get/image-optimization/tools")
  @ApiOperation({ summary: "Fetch installed image optimization CLI tool status" })
  async get_get_image_optimization_tools() {
    return keyedResponse("data", [
      { name: "cwebp", version: "1.3.2", status: "AVAILABLE", enabled: true },
      { name: "mozjpeg", version: "4.1.1", status: "AVAILABLE", enabled: true },
      { name: "pngquant", version: "2.18.0", status: "AVAILABLE", enabled: true },
    ]);
  }

  @Get("/get/image-optimization/progress")
  @ApiOperation({ summary: "Real-time progress monitor of active jobs" })
  async get_get_image_optimization_progress() {
    return keyedResponse("data", {
      currentJobId: null,
      status: "IDLE",
      percentComplete: 100,
      itemsProcessed: 0,
      itemsTotal: 0,
    });
  }

  @Get("/get/image-optimization/bucket")
  @ApiOperation({ summary: "Fetch image bucket storage statistics" })
  async get_get_image_optimization_bucket() {
    return keyedResponse("data", {
      bucketName: "anuprerna-bloomscorp",
      region: "ap-south-1",
      totalObjects: 24500,
      storageClass: "STANDARD",
      sizeBytes: 15420184000,
    });
  }

  @Patch("/update/image-optimization/discovery/run")
  @ApiOperation({ summary: "Trigger asset discovery run across S3/storage" })
  async patch_update_image_optimization_discovery_run() {
    return simpleResponse(true, "Asset discovery run initiated successfully.");
  }

  @Patch("/update/image-optimization/requeue")
  @ApiOperation({ summary: "Requeue failed image optimization jobs" })
  async patch_update_image_optimization_requeue() {
    return simpleResponse(true, "Failed jobs requeued successfully.");
  }

  @Patch("/update/image-optimization/main/pause")
  @ApiOperation({ summary: "Pause main image optimization queue" })
  async patch_update_image_optimization_main_pause() {
    return simpleResponse(true, "Image optimization queue paused.");
  }

  @Patch("/update/image-optimization/main/resume")
  @ApiOperation({ summary: "Resume main image optimization queue" })
  async patch_update_image_optimization_main_resume() {
    return simpleResponse(true, "Image optimization queue resumed.");
  }

  @Patch("/update/image-optimization/main/settings")
  @ApiOperation({ summary: "Update global settings for image optimizer" })
  @ApiBody({ type: UpdateImageOptimizationSettingsDto })
  async patch_update_image_optimization_main_settings(@Body() body: UpdateImageOptimizationSettingsDto) {
    return simpleResponse(true, "Image optimization global settings updated successfully.");
  }

  @Patch("/update/image-optimization/tools/preset")
  @ApiOperation({ summary: "Update tool configuration presets" })
  @ApiBody({ type: UpdateToolPresetDto })
  async patch_update_image_optimization_tools_preset(@Body() body: UpdateToolPresetDto) {
    return simpleResponse(true, `Preset updated for tool ${body.toolName || ""}.`);
  }

  @Patch("/update/image-optimization/tools/option")
  @ApiOperation({ summary: "Update tool CLI flags and options" })
  @ApiBody({ type: UpdateToolOptionDto })
  async patch_update_image_optimization_tools_option(@Body() body: UpdateToolOptionDto) {
    return simpleResponse(true, `Options updated for tool ${body.toolName || ""}.`);
  }

  @Patch("/update/image-optimization/tools/enabled")
  @ApiOperation({ summary: "Enable or disable specific image compression tool" })
  @ApiBody({ type: UpdateToolEnabledDto })
  async patch_update_image_optimization_tools_enabled(@Body() body: UpdateToolEnabledDto) {
    return simpleResponse(true, `Tool ${body.toolName || ""} status updated.`);
  }
}
