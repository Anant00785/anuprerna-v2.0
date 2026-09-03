import { Controller, Get, Post, Patch, UseGuards, NotImplementedException } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";

/**
 * Image-optimization control surface.
 *
 * WHAT THIS FILE USED TO BE (and why it is not that any more)
 * ----------------------------------------------------------
 * Every handler here previously returned a hard-coded literal: `24500` total
 * images, `"42.8%"` compression, three CLI tools at invented version numbers, a
 * bucket of `15420184000` bytes — and every mutation answered
 * `{success: true, message: "...initiated successfully."}` without touching
 * anything. None of it came from the database. An operator reading the CMS
 * would have seen a healthy, busy optimizer that does not exist.
 *
 * WHAT LOOM ACTUALLY DOES
 * -----------------------
 * `ImageOptimizationController` (loom, image/optimization/controller) is the
 * REST face of a real engine: `ImageOptimizationService` (ledger + S3 bucket
 * paging + thread activity), `AnalyticsService`, `ControlService` (pause /
 * resume / delay + worker-count settings), `WorkerPoolService` (a live worker
 * pool), `ToolConfigService` (cwebp/mozjpeg/pngquant presets and flags),
 * plus `MainDaemonService`, `LedgerClaimService`, `OptimizationEngineService`
 * and an S3 discovery scanner. Every route is `getEntity(..., CODE_SU, ...)`,
 * so every route below carries CODE_SU.
 *
 * WHAT EXISTS ON THIS SIDE
 * ------------------------
 * The five backing tables were migrated (`image_optimization_record`,
 * `_control`, `_tool`, `_tool_setting`, `_worker_session` in
 * `database/schema/schema.ts`), but NOT ONE line of the engine was. There is no
 * daemon, no worker pool, no discovery scanner and no tool-config service in
 * this API. Writing `run_state = 'PAUSED'` here would pause nothing, because
 * nothing in this process reads that row.
 *
 * So every route throws `NotImplementedException` (HTTP 501). The paths and
 * gates are declared — including the legacy POST verbs Loom publishes, which is
 * what closes the route-coverage gap — but nothing pretends to have an answer.
 * Tracked in `docs/KNOWN-GAPS.md`. There are no callers: the CMS has a nav
 * entry at `lib/nav-menu.ts` pointing to `/image-optimization`, but that page
 * does not exist, and no storefront code touches these paths.
 */
const NOT_MIGRATED =
  "The image-optimization engine has not been migrated from Loom. The " +
  "image_optimization_* tables exist but no discovery scanner, worker pool, " +
  "control daemon or tool-config service runs in this API, so there is no " +
  "state to report or change. See docs/KNOWN-GAPS.md.";

function notMigrated(): never {
  throw new NotImplementedException(NOT_MIGRATED);
}

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

  @ApiProperty({ example: "-q", description: "CLI option key" })
  @IsNotEmpty()
  @IsString()
  optionKey!: string;

  @ApiProperty({ example: "80", description: "CLI option value" })
  @IsNotEmpty()
  @IsString()
  optionValue!: string;
}

export class UpdateToolEnabledDto {
  @ApiProperty({ example: "cwebp", description: "Optimization tool name" })
  @IsNotEmpty()
  @IsString()
  toolName!: string;

  @ApiProperty({ example: true, description: "Whether the tool is enabled" })
  @IsBoolean()
  enabled!: boolean;
}

const NOT_IMPLEMENTED_RESPONSE = {
  status: 501,
  description: "The image-optimization engine is not migrated; see docs/KNOWN-GAPS.md",
};

@ApiTags("Image Optimization")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class ImageOptimizationDomainController {
  // ---- Reads (Loom: GetMapping, getEntity(..., CODE_SU, ...)) -------------

  @Get("/get/image-optimization/overview")
  @ApiOperation({ summary: "Image optimization engine overview (not migrated)" })
  @ApiResponse(NOT_IMPLEMENTED_RESPONSE)
  @RequireGate(GateCode.CODE_SU)
  async get_get_image_optimization_overview() {
    return notMigrated();
  }

  @Get("/get/image-optimization/records")
  @ApiOperation({ summary: "Image optimization job records (not migrated)" })
  @ApiResponse(NOT_IMPLEMENTED_RESPONSE)
  @RequireGate(GateCode.CODE_SU)
  async get_get_image_optimization_records() {
    return notMigrated();
  }

  @Get("/get/image-optimization/analytics")
  @ApiOperation({ summary: "Compression efficiency analytics (not migrated)" })
  @ApiResponse(NOT_IMPLEMENTED_RESPONSE)
  @RequireGate(GateCode.CODE_SU)
  async get_get_image_optimization_analytics() {
    return notMigrated();
  }

  @Get("/get/image-optimization/unsupported")
  @ApiOperation({ summary: "Unsupported image format log (not migrated)" })
  @ApiResponse(NOT_IMPLEMENTED_RESPONSE)
  @RequireGate(GateCode.CODE_SU)
  async get_get_image_optimization_unsupported() {
    return notMigrated();
  }

  @Get("/get/image-optimization/threads")
  @ApiOperation({ summary: "Worker thread activity (not migrated)" })
  @ApiResponse(NOT_IMPLEMENTED_RESPONSE)
  @RequireGate(GateCode.CODE_SU)
  async get_get_image_optimization_threads() {
    return notMigrated();
  }

  @Get("/get/image-optimization/tools")
  @ApiOperation({ summary: "Installed optimization CLI tool status (not migrated)" })
  @ApiResponse(NOT_IMPLEMENTED_RESPONSE)
  @RequireGate(GateCode.CODE_SU)
  async get_get_image_optimization_tools() {
    return notMigrated();
  }

  @Get("/get/image-optimization/progress")
  @ApiOperation({ summary: "Live progress of active jobs (not migrated)" })
  @ApiResponse(NOT_IMPLEMENTED_RESPONSE)
  @RequireGate(GateCode.CODE_SU)
  async get_get_image_optimization_progress() {
    return notMigrated();
  }

  @Get("/get/image-optimization/bucket")
  @ApiOperation({ summary: "Image bucket page (not migrated)" })
  @ApiResponse(NOT_IMPLEMENTED_RESPONSE)
  @RequireGate(GateCode.CODE_SU)
  async get_get_image_optimization_bucket() {
    return notMigrated();
  }

  // ---- Mutations ----------------------------------------------------------
  //
  // Loom publishes every one of these as POST (`@PostMapping` on
  // `runDiscovery`, `runRequeue`, `pauseMain`, `resumeMain`,
  // `updateMainSettings`, `applyToolPreset`, `setToolOption`, `setToolEnabled`,
  // `startWorkers`, `stopWorkers`). This side had declared them as PATCH, which
  // is why they read as missing in route coverage. The legacy POST is added
  // alongside the existing PATCH rather than replacing it, so any client
  // already written against the PATCH shape keeps resolving. `workers/start`
  // and `workers/stop` had no route at all and are declared POST-only, matching
  // Loom exactly.

  @Post("/update/image-optimization/discovery/run")
  @Patch("/update/image-optimization/discovery/run")
  @ApiOperation({ summary: "Trigger asset discovery run (not migrated)" })
  @ApiResponse(NOT_IMPLEMENTED_RESPONSE)
  @RequireGate(GateCode.CODE_SU)
  async patch_update_image_optimization_discovery_run() {
    return notMigrated();
  }

  @Post("/update/image-optimization/requeue")
  @Patch("/update/image-optimization/requeue")
  @ApiOperation({ summary: "Requeue failed optimization jobs (not migrated)" })
  @ApiResponse(NOT_IMPLEMENTED_RESPONSE)
  @RequireGate(GateCode.CODE_SU)
  async patch_update_image_optimization_requeue() {
    return notMigrated();
  }

  @Post("/update/image-optimization/main/pause")
  @Patch("/update/image-optimization/main/pause")
  @ApiOperation({ summary: "Pause the main optimization queue (not migrated)" })
  @ApiResponse(NOT_IMPLEMENTED_RESPONSE)
  @RequireGate(GateCode.CODE_SU)
  async patch_update_image_optimization_main_pause() {
    return notMigrated();
  }

  @Post("/update/image-optimization/main/resume")
  @Patch("/update/image-optimization/main/resume")
  @ApiOperation({ summary: "Resume the main optimization queue (not migrated)" })
  @ApiResponse(NOT_IMPLEMENTED_RESPONSE)
  @RequireGate(GateCode.CODE_SU)
  async patch_update_image_optimization_main_resume() {
    return notMigrated();
  }

  @Post("/update/image-optimization/main/settings")
  @Patch("/update/image-optimization/main/settings")
  @ApiOperation({ summary: "Update optimizer global settings (not migrated)" })
  @ApiBody({ type: UpdateImageOptimizationSettingsDto })
  @ApiResponse(NOT_IMPLEMENTED_RESPONSE)
  @RequireGate(GateCode.CODE_SU)
  async patch_update_image_optimization_main_settings() {
    return notMigrated();
  }

  @Post("/update/image-optimization/workers/start")
  @ApiOperation({ summary: "Start optimization workers (not migrated)" })
  @ApiResponse(NOT_IMPLEMENTED_RESPONSE)
  @RequireGate(GateCode.CODE_SU)
  async post_update_image_optimization_workers_start() {
    return notMigrated();
  }

  @Post("/update/image-optimization/workers/stop")
  @ApiOperation({ summary: "Stop optimization workers (not migrated)" })
  @ApiResponse(NOT_IMPLEMENTED_RESPONSE)
  @RequireGate(GateCode.CODE_SU)
  async post_update_image_optimization_workers_stop() {
    return notMigrated();
  }

  @Post("/update/image-optimization/tools/preset")
  @Patch("/update/image-optimization/tools/preset")
  @ApiOperation({ summary: "Apply a tool configuration preset (not migrated)" })
  @ApiBody({ type: UpdateToolPresetDto })
  @ApiResponse(NOT_IMPLEMENTED_RESPONSE)
  @RequireGate(GateCode.CODE_SU)
  async patch_update_image_optimization_tools_preset() {
    return notMigrated();
  }

  @Post("/update/image-optimization/tools/option")
  @Patch("/update/image-optimization/tools/option")
  @ApiOperation({ summary: "Set a tool CLI option (not migrated)" })
  @ApiBody({ type: UpdateToolOptionDto })
  @ApiResponse(NOT_IMPLEMENTED_RESPONSE)
  @RequireGate(GateCode.CODE_SU)
  async patch_update_image_optimization_tools_option() {
    return notMigrated();
  }

  @Post("/update/image-optimization/tools/enabled")
  @Patch("/update/image-optimization/tools/enabled")
  @ApiOperation({ summary: "Enable or disable a tool (not migrated)" })
  @ApiBody({ type: UpdateToolEnabledDto })
  @ApiResponse(NOT_IMPLEMENTED_RESPONSE)
  @RequireGate(GateCode.CODE_SU)
  async patch_update_image_optimization_tools_enabled() {
    return notMigrated();
  }
}
