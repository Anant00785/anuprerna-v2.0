"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import {
  Button,
  Badge,
  FormField,
  TextInput,
  Select,
  Toggle,
  MultiSelect,
  RichTextEditor,
  ImageUpload,
  AnchorTabs,
} from "@/components/ui";
import type { AnchorTab } from "@/components/ui";
import type {
  ProductEnvelope,
  ReferenceData,
  RefOption,
  SubCategory,
  SubCategoryProfile,
  ProductSizeProfile,
  ZohoRelation,
  WriteProductItem,
  WritePayload,
} from "@/types/product";
import { ClusterCraftSection } from "./ClusterCraftSection";
import type { StoryMappingDetail, StoryOption } from "@/lib/api";

// ── helpers ─────────────────────────────────────────────────────────────

function csvToIds(csv?: string): number[] {
  return csv ? csv.split(",").map((s) => s.trim()).filter(Boolean).map(Number) : [];
}

function mergeOption(list: RefOption[], current?: RefOption): RefOption[] {
  if (!current || !current.id) return list;
  return list.some((o) => o.id === current.id) ? list : [current, ...list];
}

function mergeOptions(list: RefOption[], currents?: RefOption[]): RefOption[] {
  if (!currents?.length) return list;
  const out = [...list];
  for (const c of currents) {
    if (c?.id && !out.some((o) => o.id === c.id)) out.push(c);
  }
  return out;
}

interface ValidationRow {
  field: string;
  label: string;
  ok: boolean;
  message?: string;
}

// ── component ─────────────────────────────────────────────────────────────

interface ProductEditFormProps {
  envelope: ProductEnvelope;
  reference: ReferenceData;
  previewId: number;
  storyMapping?: StoryMappingDetail | null;
  craftOptions?: StoryOption[];
  clusterOptions?: StoryOption[];
  /** "create" seeds an empty product and POSTs /api/product/create; default "edit". */
  mode?: "create" | "edit";
}

export function ProductEditForm({ envelope, reference, previewId, storyMapping = null, craftOptions = [], clusterOptions = [], mode = "edit" }: ProductEditFormProps) {
  const p = envelope.product;
  const isFabric = envelope.type === "fabric";
  const isCreate = mode === "create";
  const subCategory: SubCategory | undefined = p.subCategory;

  // ── seed state from the loaded product ──────────────────────────────────
  const [form, setForm] = useState(() => ({
    categoryId: p.category?.id ?? 0,
    segmentId: p.segment?.id ?? 0,
    subCategoryId: p.subCategory?.id ?? 0,
    skuGroupId: p.skuGroup?.id ?? 0,
    specialStatusId: p.specialStatus?.id ?? 0,
    name: p.name ?? "",
    sku: p.sku ?? "",
    price: p.price ?? 0,
    quantity: p.quantity ?? 0,
    unit: p.unit ?? "",
    metaTitle: p.metaTitle ?? "",
    metaDescription: p.metaDescription ?? "",
    mainProductCheck: p.mainProductCheck ?? false,
    mainProductId: p.mainProductId ?? 0,
    productVideo: p.productVideo ?? "",
    productVideoAlt: p.productVideoAlt ?? "",
    backwardCompatibleLink: p.backwardCompatibleLink ?? "",
    materials: csvToIds(p.materialId) .length ? csvToIds(p.materialId) : (p.materials ?? []).map((m) => m.id),
    colors: csvToIds(p.colorId).length ? csvToIds(p.colorId) : (p.colors ?? []).map((m) => m.id),
    patterns: csvToIds(p.patternId).length ? csvToIds(p.patternId) : (p.patterns ?? []).map((m) => m.id),
    tags: csvToIds(p.tagId).length ? csvToIds(p.tagId) : (p.tags ?? []).map((m) => m.id),
    sale: p.sale ?? false,
    discount: p.discount ?? 0,
    productOverview: p.productOverview ?? "",
    productCare: p.productCare ?? "",
    heroImage: p.heroImage ?? "",
    heroImageAlt: p.heroImageAlt ?? "",
    hoverImage: p.hoverImage ?? "",
    hoverImageAlt: p.hoverImageAlt ?? "",
    // profile toggles
    badgeProfileEnabled: p.badgeProfileEnabled ?? false,
    volumeDiscountProfileEnabled: p.volumeDiscountProfileEnabled ?? false,
    fabricProfileEnabled: p.fabricProfileEnabled ?? false,
    customSizeProfileEnabled: p.customSizeProfileEnabled ?? false,
    finishProfileEnabled: p.finishProfileEnabled ?? false,
    finishProfileItems: csvToIds(p.finishProfileItemId),
    madeToOrderProfileEnabled: p.madeToOrderProfileEnabled ?? false,
    madeToOrderFabricId: p.madeToOrderFabric?.product_id ?? p.madeToOrderFabric?.id ?? 0,
    sizeProfileEnabled: p.sizeProfileEnabled ?? false,
    productSpecificSizeProfileEnabled: p.productSpecificSizeProfileEnabled ?? false,
    // fabric-only
    gsm: isFabric ? (envelope.gsm ?? 0) : 0,
    width: isFabric ? (envelope.width ?? "") : "",
    addToSwatch: isFabric ? (envelope.addToSwatch ?? false) : false,
    // zoho header (seeded from first relation)
    hsnCode: p.productZohoRelationList?.[0]?.hsnCode ?? "",
    purchasePrice: p.productZohoRelationList?.[0]?.purchasePrice ?? 0.01,
    tax: p.productZohoRelationList?.[0]?.tax ?? (p.productGroup === "fabric" ? 5 : 12),
  }));

  const [sizeRows, setSizeRows] = useState<ProductSizeProfile[]>(
    () => (p.productSizeProfileList ?? []).map((r) => ({ ...r })),
  );
  const [zohoRows, setZohoRows] = useState<ZohoRelation[]>(
    () => (p.productZohoRelationList ?? []).map((r) => ({ ...r })),
  );

  // Fixed 2026-07-06: galleryItems used to be a frozen useMemo(p) with no way
  // to mutate the image URLs themselves (only alt text was stateful) — the
  // Images section shipped read-only with a stale "upload is a permanent
  // kill-switch" banner. The real MinIO-backed ImageController now serves
  // /upload/image (same bridge already wired for Hero/Preview above), so the
  // image URLs are now state too and each gallery slot gets a real uploader.
  const initialGalleryItems = useMemo(() => {
    if (p.imageGallerySEOList?.length) {
      return p.imageGallerySEOList.map((g) => ({ image: g.image, altText: g.altText ?? "" }));
    }
    return (p.galleryImages ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((image) => ({ image, altText: "" }));
  }, [p.imageGallerySEOList, p.galleryImages]);

  const [galleryImages, setGalleryImages] = useState<string[]>(
    () => initialGalleryItems.map((g) => g.image),
  );
  const [galleryAlts, setGalleryAlts] = useState<string[]>(
    () => initialGalleryItems.map((g) => g.altText),
  );

  const [showPayload, setShowPayload] = useState(false);
  const [saveStatus, setSaveStatus] = useState<null | "saving" | "saved" | "error">(null);
  const [saveError, setSaveError] = useState<string>("");
  const router = useRouter();
  const [keywords, setKeywords] = useState<string>(
    () => (p.tags ?? []).map((t: { id: number; name: string }) => t.name).join(", "),
  );
  const [keywordsLoading, setKeywordsLoading] = useState(false);

  // ── disable/enable toggle (sandbox-only) ─────────────────────────────────
  const [disabled, setDisabled] = useState<boolean>(p.disabled ?? false);
  const [disableBusy, setDisableBusy] = useState(false);
  const [disableError, setDisableError] = useState<string>("");
  const handleToggleDisabled = useCallback(async () => {
    if (isCreate) return;
    setDisableBusy(true);
    setDisableError("");
    const path = isFabric ? "disable/fabric-product" : "disable/finished-product";
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, method: "PATCH", body: { productId: envelope.id, disable: !disabled } }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success === false) throw new Error(j?.message || "Toggle failed");
      setDisabled((d) => !d);
      router.refresh();
    } catch (e) {
      setDisableError(e instanceof Error ? e.message : "Toggle failed");
    } finally {
      setDisableBusy(false);
    }
  }, [isCreate, isFabric, envelope.id, disabled, router]);

  // ── Zoho workflow (re)trigger (sandbox-only; kill-switched — see zoho.controller.ts) ──
  const [zohoTriggerStatus, setZohoTriggerStatus] = useState<null | "sending" | "sent">(null);
  const [zohoTriggerMessage, setZohoTriggerMessage] = useState<string>("");
  const handleTriggerZoho = useCallback(async () => {
    if (isCreate) return;
    setZohoTriggerStatus("sending");
    setZohoTriggerMessage("");
    const path = isFabric ? "trigger/fabric-product/zoho-workflow" : "trigger/finished-product/zoho-workflow";
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          method: "POST",
          body: { productId: envelope.id, productZohoRelationList: zohoRows },
        }),
      });
      const j = await res.json().catch(() => ({}));
      setZohoTriggerMessage(j?.message || (j?.success ? "Triggered" : "Trigger failed"));
    } catch (e) {
      setZohoTriggerMessage(e instanceof Error ? e.message : "Trigger failed");
    } finally {
      setZohoTriggerStatus("sent");
    }
  }, [isCreate, isFabric, envelope.id, zohoRows]);

  // ── Unique name/SKU checks (sandbox-only; GET /check/unique-product/*) ───
  const [nameUnique, setNameUnique] = useState<{ checked: string; ok: boolean; message: string } | null>(null);
  const [skuUnique, setSkuUnique] = useState<{ checked: string; ok: boolean; message: string } | null>(null);
  const checkUniqueName = useCallback(async (value: string) => {
    const v = value.trim();
    if (!v || v === p.name) { setNameUnique(null); return; }
    try {
      const res = await fetch(`/api/product/check-unique?field=name&value=${encodeURIComponent(v)}`);
      const j = await res.json();
      setNameUnique({ checked: v, ok: !!j.success, message: j.message ?? "" });
    } catch {
      setNameUnique(null);
    }
  }, [p.name]);
  const checkUniqueSku = useCallback(async (value: string) => {
    const v = value.trim();
    if (!v || v === p.sku) { setSkuUnique(null); return; }
    try {
      const res = await fetch(`/api/product/check-unique?field=sku&value=${encodeURIComponent(v)}`);
      const j = await res.json();
      setSkuUnique({ checked: v, ok: !!j.success, message: j.message ?? "" });
    } catch {
      setSkuUnique(null);
    }
  }, [p.sku]);
  const update = useCallback(
    (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch })),
    [],
  );

  // ── option lists (fetched ∪ product's embedded values) ──────────────────
  const categoryOpts = mergeOption(reference.categories, p.category);
  const segmentOpts = mergeOption(reference.segments, p.segment);
  const subCategoryOpts = mergeOption(reference.subCategories, p.subCategory);
  const skuGroupOpts = mergeOption(reference.skuGroups, p.skuGroup);
  const specialStatusOpts = mergeOption(reference.specialStatuses, p.specialStatus);
  const materialOpts = mergeOptions(reference.materials, p.materials);
  const colorOpts = mergeOptions(reference.colors, p.colors);
  const patternOpts = mergeOptions(reference.patterns, p.patterns);

  const handleRegenerateKeywords = useCallback(async () => {
    setKeywordsLoading(true);
    try {
      const materialNames = form.materials
        .map((id: number) => materialOpts.find((m) => m.id === id)?.name ?? "")
        .filter(Boolean)
        .join(", ");
      const subCatName = subCategoryOpts.find((s) => s.id === form.subCategoryId)?.name ?? "";
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: form.name,
          subCategory: subCatName,
          materials: materialNames,
        }),
      });
      const data = await res.json() as { keywords?: string; error?: string };
      if (data.keywords) {
        setKeywords(data.keywords);
      } else {
        console.error("Keywords generation error:", data.error);
      }
    } catch (err) {
      console.error("Keywords fetch failed:", err);
    } finally {
      setKeywordsLoading(false);
    }
  }, [form.materials, form.name, form.subCategoryId, materialOpts, subCategoryOpts]);

  const productOpts = useMemo(() => {
    const base = reference.products.map((pr) => ({ id: pr.id, name: pr.sku }));
    // The reference catalog is the *current* preview list; a product's linked
    // mainProductId / madeToOrderFabricId can point at an id outside that list
    // (different envelope/version). Unshift a synthetic option so the select
    // still shows the real linked item as selected instead of silently
    // falling back to "Select …" even though a fabric/product IS linked.
    const ensure = (id: number, fallbackName: string) => {
      if (id && !base.some((o) => o.id === id)) {
        base.unshift({ id, name: fallbackName });
      }
    };
    ensure(form.mainProductId, `Product #${form.mainProductId}`);
    ensure(form.madeToOrderFabricId, p.madeToOrderFabric?.name || `Fabric #${form.madeToOrderFabricId}`);
    return base;
  }, [reference.products, form.mainProductId, form.madeToOrderFabricId, p.madeToOrderFabric]);

  const finishItemOpts = useMemo<RefOption[]>(
    () => (subCategory?.finishProfile?.finishProfileItemList ?? []).map((i) => ({
      id: i.id,
      name: i.price != null ? `${i.label} (Rs. ${i.price})` : i.label,
    })),
    [subCategory],
  );

  // ── tabs ────────────────────────────────────────────────────────────────
  const tabs: AnchorTab[] = useMemo(() => {
    const t: AnchorTab[] = [{ id: "content", label: "Content" }];
    if (isFabric) t.push({ id: "fabric", label: "Fabric" });
    if (storyMapping) t.push({ id: "cluster-craft", label: "Cluster & Craft" });
    t.push(
      { id: "profiles", label: "Profiles" },
      { id: "groups", label: "Groups & Filters" },
      { id: "images", label: "Images" },
      { id: "zoho", label: "Zoho" },
    );
    return t;
  }, [isFabric, storyMapping]);

  // ── payload assembly (mirrors legacy transmission prep) ─────────────────
  const buildProduct = useCallback((): WriteProductItem => {
    const pid = (x?: SubCategoryProfile) => x?.id ?? 0;
    return {
      id: p.id ?? 0,
      categoryId: Number(form.categoryId),
      segmentId: Number(form.segmentId),
      subCategoryId: Number(form.subCategoryId),
      skuGroupId: Number(form.skuGroupId),
      specialStatusId: Number(form.specialStatusId),
      name: form.name,
      sku: form.sku,
      price: Number(form.price),
      quantity: Number(form.quantity),
      unit: form.unit,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      mainProductCheck: form.mainProductCheck,
      mainProductId: form.mainProductCheck ? 0 : Number(form.mainProductId),
      materialId: form.materials.join(","),
      colorId: form.colors.join(","),
      patternId: form.patterns.join(","),
      tagId: form.tags.join(","),
      badgeProfileId: form.badgeProfileEnabled ? pid(subCategory?.badgeProfile) : 0,
      badgeProfileEnabled: form.badgeProfileEnabled,
      volumeDiscountProfileId: form.volumeDiscountProfileEnabled ? pid(subCategory?.volumeDiscountProfile) : 0,
      volumeDiscountProfileEnabled: form.volumeDiscountProfileEnabled,
      fabricProfileId: form.fabricProfileEnabled ? pid(subCategory?.fabricProfile) : 0,
      fabricProfileEnabled: form.fabricProfileEnabled,
      customSizeProfileId: form.customSizeProfileEnabled ? pid(subCategory?.customSizeProfile) : 0,
      customSizeProfileEnabled: form.customSizeProfileEnabled,
      finishProfileId: form.finishProfileEnabled ? pid(subCategory?.finishProfile) : 0,
      finishProfileEnabled: form.finishProfileEnabled,
      finishProfileItemId: form.finishProfileItems.join(","),
      madeToOrderProfileId: form.madeToOrderProfileEnabled ? pid(subCategory?.madeToOrderProfile) : 0,
      madeToOrderProfileEnabled: form.madeToOrderProfileEnabled,
      madeToOrderFabricId: Number(form.madeToOrderFabricId),
      sizeProfileId: form.sizeProfileEnabled ? pid(subCategory?.sizeProfile) : 0,
      sizeProfileEnabled: form.sizeProfileEnabled,
      productSpecificSizeProfileEnabled: form.productSpecificSizeProfileEnabled,
      productOverview: form.productOverview,
      productCare: form.productCare,
      sale: form.sale,
      discount: Number(form.discount),
      heroImage: form.heroImage,
      hoverImage: form.hoverImage,
      galleryImages: galleryImages.join(","),
      heroImageAlt: form.heroImageAlt,
      hoverImageAlt: form.hoverImageAlt,
      productVideo: form.productVideo,
      productVideoAlt: form.productVideoAlt,
      backwardCompatibleLink: form.backwardCompatibleLink.trim(),
      productGroup: p.productGroup ?? "",
      // transmission prep strips the transient label field before send
      productSizeProfileList: sizeRows.map((r) => {
        const copy = { ...r };
        delete copy.label;
        return copy;
      }),
      productZohoRelationList: zohoRows.map((r) => ({
        ...r,
        hsnCode: form.hsnCode,
        purchasePrice: Number(form.purchasePrice),
        tax: Number(form.tax),
        zohoItemId: (r.zohoItemId ?? "").trim(),
        sku: r.sku || form.sku,
        quantity: r.quantity ?? 0,
        disabled: r.disabled ?? false,
      })),
      imageGallerySEOList: galleryImages.map((image, i) => ({
        image,
        altText: galleryAlts[i] ?? "",
      })),
      disabled: p.disabled ?? false,
    };
  }, [form, p, subCategory, sizeRows, zohoRows, galleryImages, galleryAlts]);

  const buildPayload = useCallback((): WritePayload => {
    const product = buildProduct();
    if (isFabric) {
      return {
        id: envelope.id,
        product,
        gsm: Number(form.gsm),
        addToSwatch: form.addToSwatch,
        width: form.width,
      };
    }
    return { id: envelope.id, product };
  }, [buildProduct, isFabric, envelope.id, form.gsm, form.addToSwatch, form.width]);

  // Save to sandbox -- calls wrapper which writes to our Postgres, NEVER live Loom
  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    setSaveError("");
    const payload = buildPayload();
    const type = isFabric ? "fabric" : "finished";
    try {
      const res = await fetch(isCreate ? "/api/product/create" : "/api/product/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload }),
      });
      const data = await res.json() as { success: boolean; message?: string; id?: number };
      if (data.success) {
        setSaveStatus("saved");
        if (isCreate && data.id) {
          // Land on the freshly-created product's edit page (also confirms the write).
          router.push(`/listings/${data.id}?type=${type}`);
        } else {
          router.refresh();
        }
      } else {
        setSaveStatus("error");
        setSaveError(data.message ?? (isCreate ? "Create failed" : "Save failed"));
      }
    } catch (err) {
      setSaveStatus("error");
      setSaveError((err as Error).message);
    }
  }, [buildPayload, isFabric, isCreate, router]);

  // ── shape validation (ports legacy *-validation.service.ts) ─────────────
  const validation = useMemo<ValidationRow[]>(() => {
    const product = buildProduct();
    const rows: ValidationRow[] = [];
    const req = (field: string, label: string, ok: boolean, message?: string) =>
      rows.push({ field, label, ok, message });

    req("name", "Product name", !!product.name.trim() && product.name.length <= 255,
      !product.name.trim() ? "required" : product.name.length > 255 ? "max 255" : undefined);
    req("sku", "SKU", !!product.sku.trim(), !product.sku.trim() ? "required" : undefined);
    req("categoryId", "Category", product.categoryId > 0, product.categoryId > 0 ? undefined : "required");
    req("segmentId", "Segment", product.segmentId > 0, product.segmentId > 0 ? undefined : "required");
    req("subCategoryId", "Sub category", product.subCategoryId > 0, product.subCategoryId > 0 ? undefined : "required");
    req("skuGroupId", "SKU group", product.skuGroupId > 0, product.skuGroupId > 0 ? undefined : "required");
    req("unit", "Unit", !!product.unit.trim(), product.unit ? undefined : "required");
    req("price", "Price", product.price > 0, product.price > 0 ? undefined : "must be > 0");
    if (isFabric) {
      req("gsm", "GSM", Number(form.gsm) > 0, Number(form.gsm) > 0 ? undefined : "must be > 0");
      req("width", "Width", !!form.width.trim(), form.width.trim() ? undefined : "required");
    }
    req("productOverview", "Product overview", !!product.productOverview.trim(), product.productOverview.trim() ? undefined : "required");
    req("materialId", "Materials", !!product.materialId, product.materialId ? undefined : "≥1 required");
    req("colorId", "Colors", !!product.colorId, product.colorId ? undefined : "≥1 required");
    req("heroImage", "Hero image", !!product.heroImage.trim(), product.heroImage.trim() ? undefined : "required");
    req("heroImageAlt", "Hero image alt text", !!form.heroImageAlt.trim(), form.heroImageAlt.trim() ? undefined : "required");
    req("hoverImage", "Preview image", !!product.hoverImage.trim(), product.hoverImage.trim() ? undefined : "required");
    req("hoverImageAlt", "Preview image alt text", !!form.hoverImageAlt.trim(), form.hoverImageAlt.trim() ? undefined : "required");
    // No image row -- hero, preview, or gallery -- can be saved without alt text.
    const galleryAltMissing = galleryImages.filter((img, i) => img.trim() && !(galleryAlts[i] ?? "").trim()).length;
    req("galleryAlt", "Gallery image alt text", galleryAltMissing === 0,
      galleryAltMissing > 0 ? `${galleryAltMissing} image${galleryAltMissing === 1 ? "" : "s"} missing alt text` : undefined);
    req("metaTitle", "Meta title", !!product.metaTitle?.trim() && form.metaTitle.length <= 70,
      !form.metaTitle.trim() ? "required" : form.metaTitle.length > 70 ? "max 70" : undefined);
    req("metaDescription", "Meta description", !!form.metaDescription.trim() && form.metaDescription.length <= 165,
      !form.metaDescription.trim() ? "required" : form.metaDescription.length > 165 ? "max 165" : undefined);
    const zohoOk = product.productZohoRelationList.length > 0 && !!form.hsnCode.trim();
    req("zoho", "Zoho relation (HSN)", zohoOk, !product.productZohoRelationList.length ? "≥1 row required" : !form.hsnCode.trim() ? "HSN required" : undefined);
    const badZoho = product.productZohoRelationList.find(
      (r) => r.zohoItemId && !/^\d{18}$/.test(r.zohoItemId),
    );
    req("zohoItemId", "Zoho Item IDs", !badZoho, badZoho ? "must be 18 digits" : undefined);
    return rows;
  }, [buildProduct, isFabric, form, galleryImages, galleryAlts]);

  const allValid = validation.every((r) => r.ok);

  // ── render ────────────────────────────────────────────────────────────
  const sectionClass = "scroll-mt-32";
  const cardStyle = { borderColor: "#E8E4DE" };

  return (
    <WeaveShell
      breadcrumb={
        <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
          <Link href="/listings" style={{ color: "#847D77" }}>Listings</Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>
            {isCreate ? `New ${envelope.type} product` : (p.name || `#${previewId}`)}
          </span>
        </div>
      }
    >
      {/* Sticky header bar */}
      <div
        className="sticky top-0 z-20 -mx-6 mb-6 border-b px-6 py-3 backdrop-blur"
        style={{ background: "rgba(250,249,247,0.92)", borderColor: "#E8E4DE" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 max-w-6xl">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-serif text-xl font-semibold truncate" style={{ color: "#1A1714" }}>
              {isCreate ? `New ${envelope.type} product` : (p.name || `Product #${previewId}`)}
            </h1>
            <Badge variant={isFabric ? "blue" : "purple"}>{envelope.type}</Badge>
            {!isCreate && (
              <Badge variant={disabled ? "stone" : "green"}>{disabled ? "Disabled" : "Active"}</Badge>
            )}
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: "#FEF3C7", color: "#92400E" }}
            >
              Sandbox — saves to our Postgres copy, not live Loom
            </span>
          </div>
          <div className="flex items-center gap-2">
            {disableError && (
              <span className="text-xs font-medium max-w-xs truncate" style={{ color: "#B91C1C" }}>{disableError}</span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs font-medium" style={{ color: "#047857" }}>{isCreate ? "Created in sandbox" : "Saved to sandbox"}</span>
            )}
            {saveStatus === "error" && (
              <span className="text-xs font-medium max-w-xs truncate" style={{ color: "#B91C1C" }}>{saveError}</span>
            )}
            {!isCreate && (
              <Button variant="secondary" size="md" onClick={handleToggleDisabled} disabled={disableBusy} loading={disableBusy}>
                {disableBusy ? "Working…" : disabled ? "Enable" : "Disable"}
              </Button>
            )}
            <Button variant="secondary" size="md" onClick={() => setShowPayload(true)}>
              View payload
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!allValid || saveStatus === "saving"}
              onClick={handleSave}
            >
              {saveStatus === "saving" ? (isCreate ? "Creating..." : "Saving...") : (isCreate ? "Create product" : "Save to Sandbox")}
            </Button>
          </div>
        </div>
        <div className="mt-2 max-w-6xl">
          <AnchorTabs tabs={tabs} />
        </div>
      </div>

      <div className="flex flex-col gap-8 max-w-6xl pb-24">
        {/* ── Content ── */}
        <section id="content" className={sectionClass}>
          <SectionTitle>Content</SectionTitle>
          <div className="grid grid-cols-1 gap-4 rounded-xl border bg-white p-5 md:grid-cols-2" style={cardStyle}>
            <FormField dataField="category" label="Category" required>
              <Select
                options={categoryOpts.map((o) => ({ value: o.id, label: o.name }))}
                placeholder="Select Category"
                value={form.categoryId || ""}
                error={form.categoryId === 0}
                onChange={(e) => update({ categoryId: Number(e.target.value), segmentId: 0, subCategoryId: 0 })}
              />
            </FormField>
            <FormField dataField="segment" label="Segment" required>
              <Select
                options={segmentOpts.map((o) => ({ value: o.id, label: o.name }))}
                placeholder="Select Segment"
                value={form.segmentId || ""}
                error={form.segmentId === 0}
                onChange={(e) => update({ segmentId: Number(e.target.value), subCategoryId: 0 })}
              />
            </FormField>
            <FormField dataField="subCategory" label="Sub Category" required>
              <Select
                options={subCategoryOpts.map((o) => ({ value: o.id, label: o.name }))}
                placeholder="Select Sub Category"
                value={form.subCategoryId || ""}
                error={form.subCategoryId === 0}
                onChange={(e) => update({ subCategoryId: Number(e.target.value) })}
              />
            </FormField>
            <FormField
              dataField="name"
              label="Product Name"
              required
              hint={nameUnique && nameUnique.checked === form.name.trim() ? nameUnique.message : undefined}
              error={nameUnique && !nameUnique.ok && nameUnique.checked === form.name.trim() ? "name already exists" : undefined}
            >
              <TextInput
                value={form.name}
                error={!form.name || (!!nameUnique && !nameUnique.ok && nameUnique.checked === form.name.trim())}
                onChange={(e) => update({ name: e.target.value })}
                onBlur={(e) => checkUniqueName(e.target.value)}
              />
            </FormField>
            <FormField dataField="skuGroup" label="SKU Group" required>
              <Select
                options={skuGroupOpts.map((o) => ({ value: o.id, label: o.name }))}
                placeholder="Select SKU Group"
                value={form.skuGroupId || ""}
                onChange={(e) => update({ skuGroupId: Number(e.target.value) })}
              />
            </FormField>
            <FormField
              dataField="sku"
              label="Product SKU"
              required
              hint={
                skuUnique && skuUnique.checked === form.sku.trim()
                  ? skuUnique.message
                  : isCreate ? "Choose a unique SKU" : "SKU is locked in edit mode"
              }
              error={skuUnique && !skuUnique.ok && skuUnique.checked === form.sku.trim() ? "SKU already exists" : undefined}
            >
              <TextInput
                value={form.sku}
                disabled={!isCreate}
                error={!!skuUnique && !skuUnique.ok && skuUnique.checked === form.sku.trim()}
                onChange={isCreate ? (e) => update({ sku: e.target.value }) : undefined}
                onBlur={isCreate ? (e) => checkUniqueSku(e.target.value) : undefined}
              />
            </FormField>
            <FormField dataField="price" label="Price" required>
              <TextInput type="number" value={form.price} error={Number(form.price) <= 0} onChange={(e) => update({ price: Number(e.target.value) })} />
            </FormField>
            <FormField dataField="quantity" label="Quantity" required>
              <TextInput type="number" value={form.quantity} onChange={(e) => update({ quantity: Number(e.target.value) })} />
            </FormField>
            <FormField
              dataField="metaTitle"
              label="Meta Title"
              required
              adornment={`${form.metaTitle.length}/70`}
            >
              <TextInput maxLength={70} value={form.metaTitle} onChange={(e) => update({ metaTitle: e.target.value })} />
            </FormField>
            <FormField
              dataField="metaDescription"
              label="Meta Description"
              required
              adornment={`${form.metaDescription.length}/165`}
            >
              <TextInput maxLength={165} value={form.metaDescription} onChange={(e) => update({ metaDescription: e.target.value })} />
            </FormField>
            <FormField dataField="unit" label="Unit" required>
              <Select
                options={[{ value: "METER", label: "METER" }, { value: "UNIT", label: "UNIT" }]}
                placeholder="Select Unit"
                value={form.unit}
                error={!form.unit}
                onChange={(e) => update({ unit: e.target.value })}
              />
            </FormField>
            <FormField dataField="mainProductCheck" label="Is Main Product">
              <Toggle checked={form.mainProductCheck} onChange={(v) => update({ mainProductCheck: v })} />
            </FormField>
            {!form.mainProductCheck && (
              <FormField dataField="mainProductId" label="Select Main Product"
                hint={reference.products.length ? undefined : "Sign in to search the full catalog"}>
                <Select
                  options={productOpts.map((o) => ({ value: o.id, label: o.name }))}
                  placeholder="Select Main Product"
                  value={form.mainProductId || ""}
                  onChange={(e) => update({ mainProductId: Number(e.target.value) })}
                />
              </FormField>
            )}
            <FormField dataField="productVideo" label="Video URL">
              <TextInput value={form.productVideo} onChange={(e) => update({ productVideo: e.target.value })} />
            </FormField>
            <FormField dataField="productVideoAlt" label="Video Alt Text">
              <TextInput value={form.productVideoAlt} onChange={(e) => update({ productVideoAlt: e.target.value })} />
            </FormField>
            <FormField dataField="backwardCompatibleLink" label="Backward Compatible Link" className="md:col-span-2">
              <TextInput value={form.backwardCompatibleLink} onChange={(e) => update({ backwardCompatibleLink: e.target.value })} />
            </FormField>
          </div>
        </section>

        {/* ── Fabric ── */}
        {isFabric && (
          <section id="fabric" className={sectionClass}>
            <SectionTitle>Fabric Content</SectionTitle>
            <div className="grid grid-cols-1 gap-4 rounded-xl border bg-white p-5 md:grid-cols-3" style={cardStyle}>
              <FormField dataField="gsm" label="GSM" required>
                <TextInput type="number" value={form.gsm} error={Number(form.gsm) <= 0} onChange={(e) => update({ gsm: Number(e.target.value) })} />
              </FormField>
              <FormField dataField="width" label="Width" required>
                <TextInput value={form.width} error={!form.width} onChange={(e) => update({ width: e.target.value })} />
              </FormField>
              <FormField dataField="addToSwatch" label="Add to Swatch">
                <Toggle checked={form.addToSwatch} onChange={(v) => update({ addToSwatch: v })} />
              </FormField>
            </div>
          </section>
        )}

        {/* ── Cluster & Craft ── */}
        {storyMapping && (
          <section id="cluster-craft" className={sectionClass}>
            <SectionTitle>Cluster &amp; Craft</SectionTitle>
            <ClusterCraftSection
              productId={previewId}
              initial={storyMapping}
              craftOptions={craftOptions}
              clusterOptions={clusterOptions}
            />
          </section>
        )}

        {/* ── Profiles ── */}
        <section id="profiles" className={sectionClass}>
          <SectionTitle>Profiles</SectionTitle>
          <p className="mb-3 text-xs" style={{ color: "#847D77" }}>
            A profile can be enabled only when this product&apos;s sub-category defines it.
          </p>
          <div className="flex flex-col gap-3 rounded-xl border bg-white p-5" style={cardStyle}>
            <ProfileToggle dataField="profile-badge" label="Badge Profile"
              name={subCategory?.badgeProfile?.profileName} available={!!subCategory?.badgeProfile}
              checked={form.badgeProfileEnabled} onChange={(v) => update({ badgeProfileEnabled: v })} />
            <ProfileToggle dataField="profile-volume-discount" label="Volume Discount Profile"
              name={subCategory?.volumeDiscountProfile?.profileName} available={!!subCategory?.volumeDiscountProfile}
              checked={form.volumeDiscountProfileEnabled} onChange={(v) => update({ volumeDiscountProfileEnabled: v })} />
            <ProfileToggle dataField="profile-fabric" label="Fabric Profile"
              name={subCategory?.fabricProfile?.profileName} available={!!subCategory?.fabricProfile}
              checked={form.fabricProfileEnabled} onChange={(v) => update({ fabricProfileEnabled: v })} />
            <ProfileToggle dataField="profile-custom-size" label="Custom Size Profile"
              name={subCategory?.customSizeProfile?.profileName} available={!!subCategory?.customSizeProfile}
              checked={form.customSizeProfileEnabled} onChange={(v) => update({ customSizeProfileEnabled: v })} />
            <ProfileToggle dataField="profile-finish" label="Finish Profile"
              name={subCategory?.finishProfile?.profileName} available={!!subCategory?.finishProfile}
              checked={form.finishProfileEnabled} onChange={(v) => update({ finishProfileEnabled: v })} />
            {subCategory?.finishProfile && form.finishProfileEnabled && (
              <FormField dataField="finishProfileItems" label="Select Finish" className="ml-4">
                <MultiSelect
                  options={finishItemOpts}
                  value={form.finishProfileItems}
                  onChange={(v) => update({ finishProfileItems: v.map(Number) })}
                  placeholder="Select finishes"
                />
              </FormField>
            )}
            <ProfileToggle dataField="profile-made-to-order" label="Made To Order Profile"
              name={subCategory?.madeToOrderProfile?.profileName} available={!!subCategory?.madeToOrderProfile}
              checked={form.madeToOrderProfileEnabled} onChange={(v) => update({ madeToOrderProfileEnabled: v })} />
            {subCategory?.madeToOrderProfile && form.madeToOrderProfileEnabled && (
              <FormField dataField="madeToOrderFabricId" label="Select Made To Order Fabric" className="ml-4">
                <Select
                  options={productOpts.map((o) => ({ value: o.id, label: o.name }))}
                  placeholder="Select fabric"
                  value={form.madeToOrderFabricId || ""}
                  onChange={(e) => update({ madeToOrderFabricId: Number(e.target.value) })}
                />
              </FormField>
            )}
            <ProfileToggle dataField="profile-size" label="Size Profile"
              name={subCategory?.sizeProfile?.profileName} available={!!subCategory?.sizeProfile}
              checked={form.sizeProfileEnabled} onChange={(v) => update({ sizeProfileEnabled: v })} />
            {subCategory?.sizeProfile && form.sizeProfileEnabled && (
              <div className="ml-4 flex flex-col gap-3">
                <FormField dataField="productSpecificSizeProfile" label="Override Size Configuration">
                  <Toggle checked={form.productSpecificSizeProfileEnabled}
                    onChange={(v) => update({ productSpecificSizeProfileEnabled: v })} />
                </FormField>
                {sizeRows.length > 0 && (
                  <div data-field="sizeWiseStock" className="overflow-hidden rounded-lg border" style={cardStyle}>
                    <div className="grid grid-cols-3 gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider"
                      style={{ background: "#FAF9F7", color: "#847D77" }}>
                      <span>Size</span><span>Stock</span><span>Consumed Fabric</span>
                    </div>
                    {sizeRows.map((r, i) => (
                      <div key={r.id ?? i} className="grid grid-cols-3 items-center gap-2 border-t px-3 py-2" style={cardStyle}>
                        <span className="text-sm" style={{ color: "#1A1714" }}>{r.label || r.sizeProfileOptionSku || `#${r.sizeProfileOptionId}`}</span>
                        <TextInput type="number" value={r.quantity}
                          onChange={(e) => setSizeRows((rows) => rows.map((x, xi) => xi === i ? { ...x, quantity: Number(e.target.value) } : x))} />
                        <TextInput type="number" value={r.consumedFabric ?? 0}
                          onChange={(e) => setSizeRows((rows) => rows.map((x, xi) => xi === i ? { ...x, consumedFabric: Number(e.target.value) } : x))} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Groups & Filters ── */}
        <section id="groups" className={sectionClass}>
          <SectionTitle>Groups &amp; Filters</SectionTitle>
          <div className="grid grid-cols-1 gap-4 rounded-xl border bg-white p-5 md:grid-cols-2" style={cardStyle}>
            <FormField dataField="specialStatus" label="Special Status">
              <Select
                options={specialStatusOpts.map((o) => ({ value: o.id, label: o.name }))}
                placeholder="Select Special Status"
                value={form.specialStatusId || ""}
                onChange={(e) => update({ specialStatusId: Number(e.target.value) })}
              />
            </FormField>
            <div className="hidden md:block" />
            <FormField dataField="materials" label="Materials" required>
              <MultiSelect options={materialOpts} value={form.materials} error={!form.materials.length}
                onChange={(v) => update({ materials: v.map(Number) })} placeholder="Select Materials" />
            </FormField>
            <FormField dataField="colors" label="Colors" required>
              <MultiSelect options={colorOpts} value={form.colors} error={!form.colors.length}
                onChange={(v) => update({ colors: v.map(Number) })} placeholder="Select Colors" />
            </FormField>
            <FormField dataField="patterns" label="Patterns">
              <MultiSelect options={patternOpts} value={form.patterns}
                onChange={(v) => update({ patterns: v.map(Number) })} placeholder="Select Patterns" />
            </FormField>
            <FormField dataField="keywords" label="Keywords" className="md:col-span-2">
              <div className="flex flex-col gap-2">
                <textarea
                  className="w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-stone-400"
                  style={{ borderColor: "#E8E4DE", color: "#302C28", background: "#FAFAF9", minHeight: "72px" }}
                  placeholder="AI-generated keywords will appear here — click Regenerate to populate"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={keywordsLoading}
                    onClick={handleRegenerateKeywords}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                    style={{ background: "#FEF3E2", color: "#A86120", border: "1px solid #FDE9C5" }}
                  >
                    {keywordsLoading ? "Generating…" : "✨ Regenerate keywords"}
                  </button>
                  {keywords && (
                    <span className="text-xs" style={{ color: "#AAA39E" }}>
                      {keywords.split(",").filter(Boolean).length} keywords
                    </span>
                  )}
                </div>
              </div>
            </FormField>
            <FormField dataField="sale" label="Sale">
              <Toggle checked={form.sale} onChange={(v) => update({ sale: v })} />
            </FormField>
            {form.sale && (
              <FormField dataField="discount" label="Discount (%)">
                <TextInput type="number" value={form.discount} onChange={(e) => update({ discount: Number(e.target.value) })} />
              </FormField>
            )}
            <FormField dataField="productOverview" label="Product Overview" required className="md:col-span-2">
              <RichTextEditor value={form.productOverview} onChange={(v) => update({ productOverview: v })} placeholder="Overview…" />
            </FormField>
            <FormField dataField="productCare" label="Product Care" className="md:col-span-2">
              <RichTextEditor value={form.productCare} onChange={(v) => update({ productCare: v })} placeholder="Care instructions…" />
            </FormField>
          </div>
        </section>

        {/* ── Images ── */}
        <section id="images" className={sectionClass}>
          <SectionTitle>Images</SectionTitle>
          <div className="flex flex-col gap-5 rounded-xl border bg-white p-5" style={cardStyle}>
            <div data-field="heroImage">
              <ImageUpload label="Hero Image" required imageUrl={form.heroImage}
                alt={form.heroImageAlt} onAltChange={(v) => update({ heroImageAlt: v })}
                onImageChange={(v) => update({ heroImage: v })} />
            </div>
            <div data-field="hoverImage">
              <ImageUpload label="Preview Image" required imageUrl={form.hoverImage}
                alt={form.hoverImageAlt} onAltChange={(v) => update({ hoverImageAlt: v })}
                onImageChange={(v) => update({ hoverImage: v })} />
            </div>
            <div data-field="gallery">
              <span className="text-sm font-medium" style={{ color: "#4A4540" }}>Gallery Images</span>
              <div
                className="mt-1 mb-3 rounded-md border px-2.5 py-1 text-[11px]"
                style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}
              >
                Replaces an existing slot&apos;s image via upload — saves to the sandbox test DB only, never live.
                (Adding new gallery slots isn&apos;t wired yet; only the existing ones shown below.)
              </div>
              {galleryImages.length === 0 ? (
                <p className="text-sm" style={{ color: "#847D77" }}>No gallery images.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {galleryImages.map((img, i) => (
                    <ImageUpload key={i} label={`Image ${i + 1}`} imageUrl={img}
                      alt={galleryAlts[i]} onAltChange={(v) => setGalleryAlts((a) => a.map((x, xi) => xi === i ? v : x))}
                      onImageChange={(v) => setGalleryImages((arr) => arr.map((x, xi) => xi === i ? v : x))} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Zoho ── */}
        <section id="zoho" className={sectionClass}>
          <SectionTitle>Zoho</SectionTitle>
          <div className="flex flex-col gap-4 rounded-xl border bg-white p-5" style={cardStyle}>
            {!isCreate && (
              <div className="flex items-center justify-between rounded-lg border px-3 py-2.5" style={{ borderColor: "#E8E4DE", background: "#FAF9F7" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#1A1714" }}>(Re)initiate Zoho workflow</p>
                  <p className="text-xs" style={{ color: "#847D77" }}>
                    Sandbox Zoho sync is kill-switched off — this calls the real endpoint, which returns a clean
                    &ldquo;disabled&rdquo; response and never reaches live Zoho.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {zohoTriggerMessage && (
                    <span className="text-xs max-w-xs truncate" style={{ color: "#847D77" }}>{zohoTriggerMessage}</span>
                  )}
                  <Button variant="secondary" size="sm" onClick={handleTriggerZoho} disabled={zohoTriggerStatus === "sending"} loading={zohoTriggerStatus === "sending"}>
                    {zohoTriggerStatus === "sending" ? "Triggering…" : "Trigger Zoho workflow"}
                  </Button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField dataField="hsnCode" label="HSN Code" required>
                <TextInput value={form.hsnCode} error={!form.hsnCode} onChange={(e) => update({ hsnCode: e.target.value })} />
              </FormField>
              <FormField dataField="purchasePrice" label="Purchase Price" required>
                <TextInput type="number" value={form.purchasePrice} onChange={(e) => update({ purchasePrice: Number(e.target.value) })} />
              </FormField>
              <FormField dataField="tax" label="Tax">
                <Select
                  options={[{ value: 5, label: "5%" }, { value: 12, label: "12%" }]}
                  value={form.tax}
                  onChange={(e) => update({ tax: Number(e.target.value) })}
                />
              </FormField>
            </div>
            <div data-field="zohoItemId">
              <span className="text-sm font-medium" style={{ color: "#4A4540" }}>Per-SKU Zoho Item Id</span>
              {zohoRows.length === 0 && (
                <p className="mt-1 text-sm" style={{ color: "#847D77" }}>No SKU variants mapped yet — add a row to save this product.</p>
              )}
              {zohoRows.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  {zohoRows.map((r, i) => {
                    const isNewRow = r.id == null;
                    return (
                      <div key={i} className="grid grid-cols-1 items-center gap-2 md:grid-cols-[1fr_1fr_auto]">
                        {isNewRow ? (
                          <TextInput
                            placeholder={form.sku || "SKU"}
                            value={r.sku ?? ""}
                            onChange={(e) => setZohoRows((rows) => rows.map((x, xi) => xi === i ? { ...x, sku: e.target.value } : x))}
                          />
                        ) : (
                          <TextInput value={`${r.sku}${r.disabled ? " (disabled)" : ""}`} disabled />
                        )}
                        <TextInput
                          placeholder="Ex. 460517000001121041"
                          value={r.zohoItemId ?? ""}
                          error={!!r.zohoItemId && !/^\d{18}$/.test(r.zohoItemId.trim())}
                          onChange={(e) => setZohoRows((rows) => rows.map((x, xi) => xi === i ? { ...x, zohoItemId: e.target.value } : x))}
                        />
                        {isNewRow ? (
                          <button
                            type="button"
                            onClick={() => setZohoRows((rows) => rows.filter((_, xi) => xi !== i))}
                            className="rounded p-1.5 hover:bg-red-50"
                            style={{ color: "#C0564A" }}
                            aria-label="Remove row"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={() =>
                  setZohoRows((rows) => [
                    ...rows,
                    {
                      sku: form.sku || "",
                      quantity: 0,
                      zohoItemId: "",
                      hsnCode: form.hsnCode,
                      purchasePrice: Number(form.purchasePrice) || 0,
                      tax: Number(form.tax) || 0,
                      disabled: false,
                    },
                  ])
                }
                className="mt-2 inline-flex items-center gap-1.5 self-start rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-stone-50"
                style={{ borderColor: "#E8E4DE", color: "#A86120" }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add row
              </button>
            </div>
          </div>
        </section>
      </div>

      {showPayload && (
        <PayloadDrawer
          payload={buildPayload()}
          validation={validation}
          allValid={allValid}
          authenticated={reference.authenticated}
          onClose={() => setShowPayload(false)}
        />
      )}
    </WeaveShell>
  );
}

// ── sub-components ──────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 font-serif text-lg font-semibold" style={{ color: "#1A1714" }}>
      {children}
    </h2>
  );
}

function ProfileToggle({
  dataField, label, name, available, checked, onChange,
}: {
  dataField: string; label: string; name?: string; available: boolean;
  checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div
      data-field={dataField}
      className="flex items-center justify-between rounded-lg border px-3 py-2"
      style={{ borderColor: "#E8E4DE", opacity: available ? 1 : 0.6 }}
    >
      <div className="flex flex-col">
        <span className="text-sm font-medium" style={{ color: "#1A1714" }}>{label}</span>
        <span className="text-xs" style={{ color: "#847D77" }}>
          {available ? (name || "Configured on sub-category") : "Not configured on this sub-category"}
        </span>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={!available} />
    </div>
  );
}

function PayloadDrawer({
  payload, validation, allValid, authenticated, onClose,
}: {
  payload: WritePayload;
  validation: ValidationRow[];
  allValid: boolean;
  authenticated: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "#E8E4DE" }}>
          <h3 className="font-serif text-lg font-semibold" style={{ color: "#1A1714" }}>
            Save &amp; Validate
          </h3>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: "#847D77" }}>×</button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <div
            className="mb-4 rounded-lg border px-4 py-3 text-sm"
            style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}
          >
            <strong>Sandbox save — writes to our Postgres copy, NOT live Loom.</strong>
            <p className="mt-1">
              This is the exact envelope sent to PATCH /update/fabric-product or /update/finished-product on our wrapper.{!authenticated && " Reference lists were not loaded (no auth); selects seeded from the product itself."}
            </p>
          </div>

          <h4 className="mb-2 text-sm font-semibold" style={{ color: "#1A1714" }}>
            Shape validation {allValid ? "✓ all required fields valid" : "— issues found"}
          </h4>
          <div className="mb-5 overflow-hidden rounded-lg border" style={{ borderColor: "#E8E4DE" }}>
            {validation.map((r) => (
              <div key={r.field} className="flex items-center justify-between border-b px-3 py-1.5 text-sm last:border-b-0" style={{ borderColor: "#F0EDE8" }}>
                <span style={{ color: "#1A1714" }}>{r.label}</span>
                <span style={{ color: r.ok ? "#047857" : "#B91C1C" }}>
                  {r.ok ? "✓ ok" : `✗ ${r.message ?? "invalid"}`}
                </span>
              </div>
            ))}
          </div>

          <h4 className="mb-2 text-sm font-semibold" style={{ color: "#1A1714" }}>Payload preview</h4>
          <pre
            className="overflow-auto rounded-lg border p-3 text-[11px] leading-relaxed"
            style={{ background: "#FAF9F7", borderColor: "#E8E4DE", color: "#3A352F" }}
          >
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>

        <div className="flex justify-end gap-3 border-t px-5 py-3" style={{ borderColor: "#E8E4DE" }}>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
