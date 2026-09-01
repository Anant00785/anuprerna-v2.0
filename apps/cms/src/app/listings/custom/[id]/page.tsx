/**
 * /listings/custom/[id] — Custom Product detail (Server Component, read-only).
 *
 * Faithful read of the live update-custom-product form fields (name, sku,
 * price, productGroup, unit, remarks, hero + additional images, additional
 * docs) rendered as a labelled card grid + media galleries. The live "Save"
 * control is replaced by a DISABLED Read-only badge — no mutations. A bogus id
 * resolves to a not-found card; a backend outage resolves to an error banner.
 */

import React from "react";
import Link from "next/link";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { Card, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import {
  getCustomProductById,
  groupLabel,
  splitMedia,
  type CustomProduct,
} from "@/lib/custom-products-api";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function ReadOnlyBadge() {
  return (
    <span
      title="Read-only in sandbox — mutations are not available"
      className="rounded px-2 py-1 text-xs font-medium cursor-not-allowed opacity-50 select-none"
      style={{ background: "#F3F1ED", color: "#847D77", border: "1px solid #E8E4DE" }}
    >
      Read-only
    </span>
  );
}

function usd(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price || 0);
}

function formatDateTime(ts?: number): string {
  if (!ts || ts <= 0) return "Not specified";
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-2.5 border-b last:border-b-0"
      style={{ borderColor: "#F3F1ED" }}
    >
      <span className="text-[13px] font-semibold min-w-[130px]" style={{ color: "#847D77" }}>
        {label}
      </span>
      <span className="text-sm text-right flex-1" style={{ color: "#1A1714" }}>
        {value ?? "Not specified"}
      </span>
    </div>
  );
}

function Breadcrumb({ tail }: { tail: string }) {
  return (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
      <span>Catalog</span>
      <span>/</span>
      <Link href="/listings/custom" style={{ color: "#847D77" }}>Custom Products</Link>
      <span>/</span>
      <span className="font-medium" style={{ color: "#1A1714" }}>{tail}</span>
    </div>
  );
}

export default async function CustomProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return <NotFound id={id} reason="Invalid custom-product id." />;
  }

  let product: CustomProduct | null;
  try {
    product = await getCustomProductById(numericId);
  } catch (err) {
    return (
      <WeaveShell breadcrumb={<Breadcrumb tail={`#${id}`} />}>
        <div className="max-w-2xl">
          <ErrorBanner message={err instanceof Error ? err.message : "Unknown error"} />
        </div>
      </WeaveShell>
    );
  }

  if (!product) return <NotFound id={id} reason="No custom product matched this id." />;

  const images = splitMedia(product.additionalImages);
  const docs = splitMedia(product.additionalDocs);

  return (
    <WeaveShell breadcrumb={<Breadcrumb tail={product.name || `#${product.id}`} />}>
      <div className="flex flex-col gap-6 max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
              {product.name || `Custom product #${product.id}`}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={product.productGroup === "fabric" ? "blue" : "purple"}>
                {groupLabel(product.productGroup)}
              </Badge>
              <span className="text-sm" style={{ color: "#847D77" }}>{product.sku}</span>
            </div>
          </div>
          <ReadOnlyBadge />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <div className="px-5 pb-4">
              <Row label="Name" value={product.name || "—"} />
              <Row label="SKU" value={product.sku || "—"} />
              <Row label="Price (USD)" value={usd(product.price)} />
              <Row label="Product Group" value={groupLabel(product.productGroup)} />
              <Row label="Unit" value={product.unit || "—"} />
              <Row label="Remarks" value={product.remarks || "—"} />
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Record</CardTitle></CardHeader>
            <div className="px-5 pb-4">
              <Row label="Product ID" value={String(product.id)} />
              <Row label="Version" value={product.version != null ? String(product.version) : "—"} />
              <Row label="Created" value={formatDateTime(product.createdAt)} />
              <Row label="Updated" value={formatDateTime(product.updatedAt)} />
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Hero Image</CardTitle></CardHeader>
          <div className="px-5 pb-5">
            {product.heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.heroImage}
                alt={product.name}
                className="h-48 w-48 rounded-lg object-cover border"
                style={{ borderColor: "#E8E4DE" }}
              />
            ) : (
              <p className="text-sm" style={{ color: "#847D77" }}>No hero image.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Additional Images ({images.length})</CardTitle></CardHeader>
          <div className="px-5 pb-5">
            {images.length ? (
              <div className="flex flex-wrap gap-3">
                {images.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`${product.name} ${i + 1}`}
                    className="h-28 w-28 rounded-lg object-cover border"
                    style={{ borderColor: "#E8E4DE" }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "#847D77" }}>No additional images.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Additional Documents ({docs.length})</CardTitle></CardHeader>
          <div className="px-5 pb-5">
            {docs.length ? (
              <ul className="flex flex-col gap-2">
                {docs.map((url, i) => (
                  <li key={i}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline"
                      style={{ color: "#A86120" }}
                    >
                      Document {i + 1}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm" style={{ color: "#847D77" }}>No documents attached.</p>
            )}
          </div>
        </Card>

        <div>
          <Link href="/listings/custom">
            <Button variant="secondary" size="sm">← Back to Custom Products</Button>
          </Link>
        </div>
      </div>
    </WeaveShell>
  );
}

function NotFound({ id, reason }: { id: string; reason: string }) {
  return (
    <WeaveShell breadcrumb={<Breadcrumb tail={`#${id}`} />}>
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
          Custom product not found
        </h1>
        <div
          className="rounded-xl border px-5 py-4 text-sm"
          style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}
        >
          {reason}
        </div>
        <Link href="/listings/custom">
          <Button variant="secondary" size="sm">← Back to Custom Products</Button>
        </Link>
      </div>
    </WeaveShell>
  );
}
