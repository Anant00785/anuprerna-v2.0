"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  label: string;
  imageUrl?: string;
  alt?: string;
  onAltChange?: (alt: string) => void;
  /**
   * When provided, this control becomes a REAL uploader: picking a file uploads
   * it to the sandbox MinIO bucket (via /api/product/upload-image) and calls
   * this with the returned servable URL. When omitted, the control stays a
   * read-only display (used for the gallery thumbnails).
   */
  onImageChange?: (url: string) => void;
  required?: boolean;
  className?: string;
}

const ACCEPT = "image/jpeg,image/png,image/webp";
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

/** Read a File as a base64 data URL. */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

/**
 * Product image control. Uploader when onImageChange is set (Hero / Preview),
 * read-only thumbnail otherwise (gallery).
 */
export function ImageUpload({
  label,
  imageUrl,
  alt,
  onAltChange,
  onImageChange,
  required,
  className,
}: ImageUploadProps) {
  const isUploader = typeof onImageChange === "function";
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED.has(file.type)) {
      setError("Unsupported type — use JPG, PNG or WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image too large (max 5 MB).");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const res = await fetch("/api/product/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, dataBase64: dataUrl }),
      });
      const data = (await res.json()) as { success: boolean; url?: string; message?: string };
      if (data.success && data.url) {
        onImageChange?.(data.url);
      } else {
        setError(data.message || "Upload failed.");
      }
    } catch (err) {
      setError((err as Error).message || "Upload failed.");
    } finally {
      setUploading(false);
      // allow re-picking the same file
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-sm font-medium" style={{ color: "#4A4540" }}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      <div className="flex items-start gap-4">
        <div
          className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border"
          style={{ background: "#F3F1ED", borderColor: "#E8E4DE" }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={alt || label}
              width={112}
              height={112}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-xs" style={{ color: "#AAA39E" }}>No image</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          {(() => {
            // No image row -- hero/preview (always required) or gallery (once
            // a slot has an image) -- can be saved without alt text.
            const altRequired = !!imageUrl?.trim();
            const altMissing = altRequired && !(alt ?? "").trim();
            return (
              <>
                <span className="text-xs" style={{ color: altMissing ? "#B91C1C" : "#847D77" }}>
                  Alt text{altRequired && <span className="ml-0.5 text-red-500">*</span>}
                </span>
                <input
                  type="text"
                  value={alt ?? ""}
                  onChange={(e) => onAltChange?.(e.target.value)}
                  placeholder={`${label} alt text`}
                  className="form-input"
                  style={altMissing ? { borderColor: "#FCA5A5" } : undefined}
                />
                {altMissing && (
                  <span className="text-[11px]" style={{ color: "#B91C1C" }}>Alt text is required</span>
                )}
              </>
            );
          })()}
          {isUploader ? (
            <div className="flex flex-col gap-1.5">
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT}
                onChange={handleFile}
                aria-label={`Upload ${label}`}
                data-testid="image-file-input"
                className="sr-only"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-stone-50 disabled:opacity-50"
                  style={{ borderColor: "#E8E4DE", color: "#A86120" }}
                >
                  {uploading ? "Uploading…" : imageUrl ? "Replace image" : "Upload image"}
                </button>
                <span className="text-[11px]" style={{ color: "#AAA39E" }}>JPG / PNG / WebP, max 5 MB</span>
              </div>
              {error && (
                <span className="text-[11px]" style={{ color: "#B91C1C" }}>{error}</span>
              )}
            </div>
          ) : (
            <div
              className="rounded-md border px-2.5 py-1 text-[11px]"
              style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}
            >
              Upload disabled in Preview — existing image shown read-only.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
