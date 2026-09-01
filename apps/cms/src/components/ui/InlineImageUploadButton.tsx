"use client";

/**
 * InlineImageUploadButton — compact file-upload affordance for URL-text image
 * fields (category / segment / sub-category icon, social, featured images).
 *
 * Added 2026-07-06: the regrade found these were still stale hand-typed URL
 * fields even though a real MinIO-backed upload pipeline (ImageController,
 * upload/image) now exists — proven end-to-end on the Hero/Preview product
 * images via /api/product/upload-image + components/ui/ImageUpload. This is
 * the same bridge, packaged as a small button that sits next to an existing
 * TextInput bound to an image-URL field, so it doesn't disturb their layout.
 *
 * Uploads through /api/product/upload-image (server attaches the session
 * cookie = SANDBOX_ADMIN_TOKEN; NOT product-specific despite the route
 * folder name — it is a generic sandbox-image uploader) and hands the
 * returned servable :8090 URL to onUploaded, which the caller wires into its
 * existing onChange(url) handler for that field.
 */
import React, { useRef, useState } from "react";

const ACCEPT = "image/jpeg,image/png,image/webp";
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

interface InlineImageUploadButtonProps {
  onUploaded: (url: string) => void;
  label?: string;
}

export function InlineImageUploadButton({ onUploaded, label = "Upload" }: InlineImageUploadButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

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
        onUploaded(data.url);
      } else {
        setError(data.message || "Upload failed.");
      }
    } catch (err) {
      setError((err as Error).message || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          onChange={handleFile}
          aria-label={label}
          data-testid="image-file-input"
          className="sr-only"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-stone-50 disabled:opacity-50"
          style={{ borderColor: "#E8E4DE", color: "#A86120" }}
        >
          {uploading ? "Uploading…" : label}
        </button>
        <span className="text-[11px]" style={{ color: "#AAA39E" }}>JPG / PNG / WebP, max 5 MB</span>
      </div>
      {error && <span className="text-[11px]" style={{ color: "#B91C1C" }}>{error}</span>}
    </div>
  );
}
