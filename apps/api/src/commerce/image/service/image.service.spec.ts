/**
 * S3 must fail closed with no configuration: no client is constructed, so no
 * request can reach AWS from a test or an unconfigured environment, and every
 * call throws instead of silently falling back to the default credential chain.
 */
import { describe, it, expect } from "vitest";
import { ServiceUnavailableException } from "@nestjs/common";
import { ImageService } from "./image.service.js";

function serviceWith(env: Record<string, string> = {}) {
  const config = { get: (key: string) => env[key] } as unknown as ConstructorParameters<
    typeof ImageService
  >[0];
  return new ImageService(config);
}

const FULL_ENV = {
  AWS_S3_BUCKET: "test-bucket",
  AWS_S3_REGION: "ap-south-1",
  AWS_S3_ACCESS_KEY: "test-key",
  AWS_S3_SECRET_KEY: "test-secret",
};

describe("ImageService — fails closed without configuration", () => {
  it("is not configured when the environment is empty", () => {
    expect(serviceWith().isConfigured).toBe(false);
  });

  it.each([
    ["bucket", "AWS_S3_BUCKET"],
    ["region", "AWS_S3_REGION"],
    ["access key", "AWS_S3_ACCESS_KEY"],
    ["secret key", "AWS_S3_SECRET_KEY"],
  ])("is not configured with the %s missing", (_label, missing) => {
    const env = { ...FULL_ENV };
    delete (env as Record<string, string>)[missing];
    expect(serviceWith(env).isConfigured).toBe(false);
  });

  it("treats a whitespace-only credential as absent", () => {
    expect(serviceWith({ ...FULL_ENV, AWS_S3_SECRET_KEY: "   " }).isConfigured).toBe(false);
  });

  it("throws rather than attempting an upload when unconfigured", async () => {
    await expect(
      serviceWith().uploadImage(Buffer.from("x"), "a.png", "image/png"),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("throws rather than attempting a PDF upload when unconfigured", async () => {
    await expect(
      serviceWith().uploadPdf(Buffer.from("x"), "key.pdf", "a.pdf"),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("reports a delete failure rather than throwing out of the fire-and-forget path", async () => {
    await expect(serviceWith().deleteImageSynchronously("https://x/y.png")).resolves.toBe(false);
  });

  it("treats an empty url as nothing to delete, without touching S3", async () => {
    await expect(serviceWith().deleteImageSynchronously("")).resolves.toBe(true);
  });

  it("is configured once every value is present", () => {
    expect(serviceWith(FULL_ENV).isConfigured).toBe(true);
  });

  it("accepts the legacy AWS_* names as well", () => {
    expect(
      serviceWith({
        AWS_BUCKET: "b",
        AWS_REGION: "r",
        AWS_ACCESS_KEY_ID: "k",
        AWS_SECRET_ACCESS_KEY: "s",
      }).isConfigured,
    ).toBe(true);
  });
});
