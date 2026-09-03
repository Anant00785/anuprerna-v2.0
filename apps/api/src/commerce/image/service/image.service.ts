/**
 * migrated/image/service/image.service.ts
 *
 * Ports Java's S3StorageManagerService and StorageManagerService.
 * Handles S3 upload and async delete.
 *
 * In NestJS, we use @aws-sdk/client-s3 (v3) — same SDK the Java code imports.
 * The AWS credentials/region are loaded from environment variables:
 *   AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 */
import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ObjectCannedACL,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import * as crypto from "crypto";
import * as path from "path";
import type { EnvironmentVariables } from "../../../common/config/env.schema.js";

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly bucket: string;
  private readonly region: string;
  private readonly s3: S3Client | null;

  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {
    this.bucket = (this.config.get("AWS_S3_BUCKET", { infer: true }) ?? this.config.get("AWS_BUCKET", { infer: true }) ?? "").trim();
    this.region = (this.config.get("AWS_S3_REGION", { infer: true }) ?? this.config.get("AWS_REGION", { infer: true }) ?? "").trim();
    const accessKeyId = (this.config.get("AWS_S3_ACCESS_KEY", { infer: true }) ?? this.config.get("AWS_ACCESS_KEY_ID", { infer: true }) ?? "").trim();
    const secretAccessKey = (this.config.get("AWS_S3_SECRET_KEY", { infer: true }) ?? this.config.get("AWS_SECRET_ACCESS_KEY", { infer: true }) ?? "").trim();

    // Fails closed: with no bucket/region/credentials in the environment the
    // client is never constructed and every call throws instead of silently
    // talking to a default-credential-chain account.
    this.s3 = this.bucket && this.region && accessKeyId && secretAccessKey
      ? new S3Client({ region: this.region, credentials: { accessKeyId, secretAccessKey } })
      : null;
  }

  /** Throws unless S3 is fully configured from the environment. */
  private client(): S3Client {
    if (!this.s3) {
      throw new ServiceUnavailableException(
        "S3 storage is not configured (AWS_S3_BUCKET, AWS_S3_REGION, AWS_S3_ACCESS_KEY, AWS_S3_SECRET_KEY)",
      );
    }
    return this.s3;
  }

  /** True when the environment supplies a complete S3 configuration. */
  get isConfigured(): boolean {
    return this.s3 !== null;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  private buildImageFileName(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const uuid = crypto.randomUUID().replace(/-/g, "");
    return `${uuid}${ext}`;
  }

  private extractObjectKeyFromUrl(fileUrl: string): string {
    try {
      const url = new URL(fileUrl);
      const raw = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
      if (raw) return raw;
    } catch {
      // fall through
    }
    return fileUrl.split("/").pop() ?? fileUrl;
  }

  private async doesObjectExist(key: string): Promise<boolean> {
    try {
      await this.client().send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch (e: unknown) {
      // The v3 client surfaces a missing key on HeadObject as NotFound / 404;
      // @aws-sdk/client-s3 exports no NoSuchKeyError class to instanceof against.
      if (e instanceof S3ServiceException) {
        if (e.name === "NotFound" || e.$metadata?.httpStatusCode === 404) return false;
      }
      throw e;
    }
  }

  private buildPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  // ─── Public API ────────────────────────────────────────────────────────

  /**
   * Upload an image file to S3 and return its public URL.
   * Mirrors Java's S3StorageManagerService.uploadImage(MultipartFile).
   */
  async uploadImage(
    buffer: Buffer,
    originalName: string,
    mimetype: string,
  ): Promise<string> {
    const key = this.buildImageFileName(originalName);
    await this.client().send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
        ACL: ObjectCannedACL.public_read,
      }),
    );
    return this.buildPublicUrl(key);
  }

  /**
   * Upload a PDF bytes buffer to S3.
   * Mirrors Java's S3StorageManagerService.uploadPdf().
   */
  async uploadPdf(
    pdfBytes: Buffer,
    objectKey: string,
    fileName: string,
  ): Promise<string> {
    if (!pdfBytes.length) throw new Error("PDF bytes are required");
    await this.client().send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: pdfBytes,
        ContentType: "application/pdf",
        ContentDisposition: `attachment; filename="${fileName}"`,
        ACL: ObjectCannedACL.public_read,
      }),
    );
    const exists = await this.doesObjectExist(objectKey);
    if (!exists) throw new Error("PDF upload to S3 failed");
    return this.buildPublicUrl(objectKey);
  }

  /**
   * Synchronously delete an image.
   * Returns true if the object no longer exists after the delete attempt.
   */
  async deleteImageSynchronously(fileUrl: string): Promise<boolean> {
    if (!fileUrl?.trim()) return true;
    const key = this.extractObjectKeyFromUrl(fileUrl);
    if (!key) return false;
    try {
      await this.client().send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      return !(await this.doesObjectExist(key));
    } catch {
      return false;
    }
  }

  /**
   * Fire-and-forget delete — mirrors Java's initiateDeleteImageTask(String).
   * Does not block the HTTP response.
   */
  initiateDeleteImageTask(fileUrl: string): void {
    if (!fileUrl?.trim()) return;
    this.deleteImageSynchronously(fileUrl).catch((err) =>
      this.logger.warn(`Background delete failed for ${fileUrl}: ${err}`),
    );
  }

  initiateDeleteImageTaskBatch(fileUrls: string[]): void {
    fileUrls.forEach((u) => this.initiateDeleteImageTask(u));
  }
}
