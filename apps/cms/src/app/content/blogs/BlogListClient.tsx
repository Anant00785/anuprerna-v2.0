"use client";

/**
 * BlogListClient — list + create/edit drawer for Blog articles.
 *
 * Drawer uses controlled tab switching (Basic Info | Banner | Sections | SEO)
 * matching AnchorTabs visual style.
 *
 * Write-safety: real sandbox writes via /api/crud (never live Loom/Zoho).
 * Blog save cascade (create or edit):
 *   1. POST add/blog-content (create) or PATCH update/blog-content/{id}
 *      (edit) with the blog fields — sections are NOT part of this body,
 *      they live in a separate table.
 *   2. Create returns the new id in `message` (string); parse it, then for
 *      each section in the local draft list: if it has no real backend id
 *      yet, POST add/blog-content-section with { ...fields, blogContentId };
 *      if it already has a real id, PATCH update/blog-content-section/{id}.
 *   3. Section "Remove" fires immediately (independent of the parent Save)
 *      via DELETE delete/blog-content-section/{id} when the section has a
 *      real backend id; a still-unsaved local section is just spliced out.
 *   4. Blog delete (row trash icon / drawer footer) -> DELETE
 *      delete/blog-content/{id}.
 * The first failure anywhere in the cascade is surfaced verbatim — already-
 * committed writes are not rolled back (sandbox tool, not transactional).
 */

import React, { useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WeaveShell } from "@/components/weave/WeaveShell";
import {
  DataList,
  DataListColumn,
  FormField,
  TextInput,
  Textarea,
  Select,
  Button,
  Badge,
  ConfirmDialog,
} from "@/components/ui";
import { Trash2 } from "lucide-react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import type { BlogPreviewItem, BlogCategoryItem, ContentSectionDraft } from "@/types/content";
import type { ContentSectionData } from "@/lib/content-api";

// ── Tab types ─────────────────────────────────────────────────────────────

type BlogTab = "basic" | "banner" | "sections" | "seo";

const TABS: { id: BlogTab; label: string }[] = [
  { id: "basic", label: "Basic Info" },
  { id: "banner", label: "Banner" },
  { id: "sections", label: "Sections" },
  { id: "seo", label: "SEO" },
];

// ── Section constants ─────────────────────────────────────────────────────

const TEMPLATE_TYPE_OPTS = [
  { value: 1, label: "1 — Left Image, Right Text" },
  { value: 2, label: "2 — Left Text, Right Image" },
  { value: 3, label: "3 — Left Video, Right Text" },
  { value: 4, label: "4 — Left Text, Right Video" },
  { value: 5, label: "5 — Left Text, Right Text" },
  { value: 6, label: "6 — Left Image, Right Image" },
  { value: 7, label: "7 — Left Video, Right Video" },
  { value: 8, label: "8 — Center Text Only" },
  { value: 9, label: "9 — Center Image Only" },
  { value: 10, label: "10 — Center Video Only" },
];

const TEMPLATE_TYPE_LABELS: Record<number, string> = {
  1: "Left Image, Right Text",
  2: "Left Text, Right Image",
  3: "Left Video, Right Text",
  4: "Left Text, Right Video",
  5: "Left Text, Right Text",
  6: "Left Image, Right Image",
  7: "Left Video, Right Video",
  8: "Center Text Only",
  9: "Center Image Only",
  10: "Center Video Only",
};

const EMPTY_SECTION: ContentSectionDraft = {
  sortOrder: 1,
  templateType: 1,
  heading: "",
  title1: "",
  title2: "",
  paragraph1: "",
  paragraph2: "",
  image1: "",
  image1Alt: "",
  image1Link: "",
  caption1: "",
  image2: "",
  image2Alt: "",
  image2Link: "",
  caption2: "",
  video1: "",
  video1Alt: "",
  video2: "",
  video2Alt: "",
  ctaButtonName1: "",
  ctaButtonName2: "",
  ctaLink1: "",
  ctaLink2: "",
};

// ── Form shape ────────────────────────────────────────────────────────────

interface BlogForm {
  title: string;
  description: string;
  blogContentCategoryId: number;
  slug: string;
  previousBlogId: string;
  nextBlogId: string;
  bannerImageDesktop: string;
  bannerImageDesktopAlt: string;
  bannerImageMobile: string;
  bannerImageMobileAlt: string;
  parallaxText: string;
  bannerImageParallax: string;
  bannerImageParallaxAlt: string;
  metaTitle: string;
  metaDescription: string;
  backwardCompatibleLink: string;
}

interface DrawerState {
  mode: "create" | "edit";
  id?: number;
  form: BlogForm;
}

const EMPTY_FORM: BlogForm = {
  title: "",
  description: "",
  blogContentCategoryId: 0,
  slug: "",
  previousBlogId: "",
  nextBlogId: "",
  bannerImageDesktop: "",
  bannerImageDesktopAlt: "",
  bannerImageMobile: "",
  bannerImageMobileAlt: "",
  parallaxText: "",
  bannerImageParallax: "",
  bannerImageParallaxAlt: "",
  metaTitle: "",
  metaDescription: "",
  backwardCompatibleLink: "",
};

const PAGE_SIZE = 50;

// ── Component ─────────────────────────────────────────────────────────────

interface BlogListClientProps {
  blogs: BlogPreviewItem[];
  categories: BlogCategoryItem[];
}

export function BlogListClient({ blogs, categories }: BlogListClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [activeTab, setActiveTab] = useState<BlogTab>("basic");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sections, setSections] = useState<ContentSectionDraft[]>([]);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [sectionDraft, setSectionDraft] = useState<ContentSectionDraft>({ ...EMPTY_SECTION });
  // null = adding a new section; a number = editing the section at that index in place
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const fetchingIdRef = useRef<number | null>(null);

  // Blog row delete
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Section delete (independent of the parent Save — fires immediately)
  const [confirmSectionDelete, setConfirmSectionDelete] = useState<{ index: number; id: number; label: string } | null>(null);
  const [sectionDeleting, setSectionDeleting] = useState(false);
  const [sectionDeleteError, setSectionDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return blogs;
    const q = search.toLowerCase();
    return blogs.filter((b) => b.title.toLowerCase().includes(q));
  }, [blogs, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const categoryOpts = categories.map((c) => ({ value: c.id, label: c.name }));

  const openCreate = useCallback(() => {
    setDrawer({ mode: "create", form: { ...EMPTY_FORM } });
    setActiveTab("basic");
    setSaveError(null);
    setSections([]);
    setShowSectionForm(false);
    setSectionDraft({ ...EMPTY_SECTION });
    setEditingIndex(null);
  }, []);

  const openEdit = useCallback(async (item: BlogPreviewItem) => {
    // Seed from preview data immediately so the drawer opens without delay
    setDrawer({
      mode: "edit",
      id: item.id,
      form: {
        title: item.title ?? "",
        description: item.description ?? "",
        blogContentCategoryId: item.blogContentCategoryId ?? 0,
        slug: item.slug ?? "",
        previousBlogId: "",
        nextBlogId: "",
        bannerImageDesktop: item.bannerImageDesktop ?? "",
        bannerImageDesktopAlt: "",
        bannerImageMobile: item.bannerImageMobile ?? "",
        bannerImageMobileAlt: "",
        parallaxText: "",
        bannerImageParallax: "",
        bannerImageParallaxAlt: "",
        metaTitle: "",
        metaDescription: "",
        backwardCompatibleLink: "",
      },
    });
    setActiveTab("basic");
    setSaveError(null);
    setSections([]);
    setShowSectionForm(false);
    setSectionDraft({ ...EMPTY_SECTION });
    setEditingIndex(null);
    setDetailLoading(true);
    fetchingIdRef.current = item.id;

    // Fetch full detail to fill in the fields the list preview omits
    try {
      const res = await fetch(`/api/content/blog/${item.id}`);
      if (res.ok && fetchingIdRef.current === item.id) {
        const detail = await res.json() as {
          previousBlogId: number | null;
          nextBlogId: number | null;
          bannerImageDesktopAlt: string;
          bannerImageMobileAlt: string;
          parallaxText: string;
          bannerImageParallax: string;
          bannerImageParallaxAlt: string;
          metaTitle: string;
          metaDescription: string;
          backwardCompatibleLink: string;
          sections: ContentSectionData[];
        };
        setDrawer((d) =>
          d && d.id === item.id
            ? {
                ...d,
                form: {
                  ...d.form,
                  previousBlogId: detail.previousBlogId != null ? String(detail.previousBlogId) : "",
                  nextBlogId: detail.nextBlogId != null ? String(detail.nextBlogId) : "",
                  bannerImageDesktopAlt: detail.bannerImageDesktopAlt ?? "",
                  bannerImageMobileAlt: detail.bannerImageMobileAlt ?? "",
                  parallaxText: detail.parallaxText ?? "",
                  bannerImageParallax: detail.bannerImageParallax ?? "",
                  bannerImageParallaxAlt: detail.bannerImageParallaxAlt ?? "",
                  metaTitle: detail.metaTitle ?? "",
                  metaDescription: detail.metaDescription ?? "",
                  backwardCompatibleLink: detail.backwardCompatibleLink ?? "",
                },
              }
            : d,
        );
        if (detail.sections?.length) {
          setSections(
            detail.sections.map((s) => ({
              id: s.id,
              sortOrder: s.sortOrder,
              templateType: s.templateType,
              heading: s.heading,
              title1: s.title1, title2: s.title2,
              paragraph1: s.paragraph1, paragraph2: s.paragraph2,
              image1: s.image1, image1Alt: s.image1Alt, image1Link: s.image1Link, caption1: s.caption1,
              image2: s.image2, image2Alt: s.image2Alt, image2Link: s.image2Link, caption2: s.caption2,
              video1: s.video1, video1Alt: s.video1Alt,
              video2: s.video2, video2Alt: s.video2Alt,
              ctaButtonName1: s.ctaButtonName1, ctaButtonName2: s.ctaButtonName2,
              ctaLink1: s.ctaLink1, ctaLink2: s.ctaLink2,
            })),
          );
        }
      }
    } catch {
      // Detail fetch failed — drawer stays usable with preview seed
    } finally {
      if (fetchingIdRef.current === item.id) {
        setDetailLoading(false);
        fetchingIdRef.current = null;
      }
    }
  }, []);

  const closeDrawer = () => {
    setDrawer(null);
    setSaveError(null);
    setSections([]);
    setShowSectionForm(false);
    setSectionDraft({ ...EMPTY_SECTION });
    setEditingIndex(null);
  };

  const updateForm = (patch: Partial<BlogForm>) => {
    setDrawer((d) => (d ? { ...d, form: { ...d.form, ...patch } } : null));
  };

  const buildBlogBody = (f: BlogForm, id?: number) => ({
    ...(id != null ? { id } : {}),
    title: f.title,
    description: f.description,
    blogContentCategoryId: f.blogContentCategoryId,
    slug: f.slug,
    previousBlogId: f.previousBlogId ? Number(f.previousBlogId) : null,
    nextBlogId: f.nextBlogId ? Number(f.nextBlogId) : null,
    bannerImageDesktop: f.bannerImageDesktop,
    bannerImageDesktopAlt: f.bannerImageDesktopAlt,
    bannerImageMobile: f.bannerImageMobile,
    bannerImageMobileAlt: f.bannerImageMobileAlt,
    parallaxText: f.parallaxText,
    bannerImageParallax: f.bannerImageParallax,
    bannerImageParallaxAlt: f.bannerImageParallaxAlt,
    metaTitle: f.metaTitle,
    metaDescription: f.metaDescription,
    backwardCompatibleLink: f.backwardCompatibleLink,
  });

  async function crud(path: string, method: string, body?: unknown) {
    const res = await fetch("/api/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, method, body }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || j?.success === false) {
      throw new Error(j?.message || `Request failed (${res.status})`);
    }
    return j as { success: boolean; message?: string; id?: number };
  }

  // Real sandbox save cascade: blog first, then its sections (create or
  // update each, depending on whether it already carries a real backend
  // id). Writes ONLY to sandbox pg via /api/crud — see file header.
  const doSave = useCallback(async () => {
    if (!drawer || !drawer.form.title.trim() || drawer.form.title.length < 10) return;
    setSaving(true);
    setSaveError(null);
    try {
      let blogId: number;
      if (drawer.mode === "create") {
        const j = await crud("add/blog-content", "POST", buildBlogBody(drawer.form));
        blogId = Number(j.message);
        if (!Number.isFinite(blogId) || blogId <= 0) {
          throw new Error("Blog was saved but no id was returned — sections were not saved.");
        }
      } else {
        blogId = drawer.id as number;
        await crud(`update/blog-content/${blogId}`, "PATCH", buildBlogBody(drawer.form, blogId));
      }

      for (let i = 0; i < sections.length; i++) {
        const { id: sectionId, ...fields } = sections[i];
        try {
          if (!sectionId) {
            await crud("add/blog-content-section", "POST", { ...fields, blogContentId: blogId });
          } else {
            await crud(`update/blog-content-section/${sectionId}`, "PATCH", fields);
          }
        } catch (e) {
          const base = drawer.mode === "create" ? "Blog saved, but" : "Blog updated, but";
          throw new Error(`${base} section ${i + 1} failed: ${e instanceof Error ? e.message : "unknown error"}`);
        }
      }

      closeDrawer();
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [drawer, sections, router]);

  const doDeleteBlog = useCallback(async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await crud(`delete/blog-content/${confirmDelete.id}`, "DELETE");
      setConfirmDelete(null);
      closeDrawer();
      router.refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }, [confirmDelete, router]);

  // Section "Remove" — immediate, independent of the parent blog Save. A
  // section that has never been persisted (no real id) is just spliced out
  // of local state; a saved one is deleted from the sandbox right away.
  const requestRemoveSection = (idx: number) => {
    const sec = sections[idx];
    if (!sec.id) {
      setSections((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    setConfirmSectionDelete({
      index: idx,
      id: sec.id,
      label: `#${sec.sortOrder} — ${TEMPLATE_TYPE_LABELS[sec.templateType] ?? `Template ${sec.templateType}`}`,
    });
  };

  const doRemoveSection = useCallback(async () => {
    if (!confirmSectionDelete) return;
    setSectionDeleting(true);
    setSectionDeleteError(null);
    try {
      await crud(`delete/blog-content-section/${confirmSectionDelete.id}`, "DELETE");
      setSections((prev) => prev.filter((_, i) => i !== confirmSectionDelete.index));
      setConfirmSectionDelete(null);
    } catch (e) {
      setSectionDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSectionDeleting(false);
    }
  }, [confirmSectionDelete]);

  const columns = useMemo<DataListColumn<BlogPreviewItem>[]>(
    () => [
      {
        key: "title",
        label: "Title",
        render: (row) => (
          <button
            type="button"
            className="font-medium text-sm text-left hover:underline max-w-xs truncate block"
            style={{ color: "#1A1714" }}
            onClick={() => openEdit(row)}
          >
            {row.title}
          </button>
        ),
      },
      {
        key: "category",
        label: "Category",
        render: (row) =>
          row.blogContentCategory ? (
            <Badge variant="stone">{row.blogContentCategory.name}</Badge>
          ) : (
            <span className="text-xs" style={{ color: "#D1CCC6" }}>
              No category
            </span>
          ),
      },
      {
        key: "readingTime",
        label: "Reading Time",
        render: (row) => (
          <span className="text-sm" style={{ color: "#635D58" }}>
            {row.readingTime} min{row.readingTime !== 1 ? "s" : ""}
          </span>
        ),
      },
      {
        key: "created",
        label: "Created",
        render: (row) => (
          <span className="text-sm" style={{ color: "#847D77" }}>
            {new Date(row.timeOfCreation).toLocaleDateString("en-IN", {
              timeZone: "Asia/Kolkata",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        key: "actions",
        label: "",
        headerClassName: "w-12",
        cellClassName: "text-right",
        render: (row) => (
          <button
            type="button"
            className="rounded-md p-1.5 hover:bg-red-50 transition-colors"
            style={{ color: "#AAA39E" }}
            title="Delete blog"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete({ id: row.id, title: row.title });
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ),
      },
    ],
    [openEdit],
  );

  return (
    <WeaveShell
      breadcrumb={
        <div
          className="flex items-center gap-2 text-sm"
          style={{ color: "#847D77" }}
        >
          <Link href="/content" style={{ color: "#847D77" }}>
            Content
          </Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>
            Blogs
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="font-serif text-2xl font-semibold"
              style={{ color: "#1A1714" }}
            >
              Blogs
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              Blog articles published on the storefront.{" "}
              <Link
                href="/content/blogs/types"
                className="underline"
                style={{ color: "#0369A1" }}
              >
                Types
              </Link>
              {" · "}
              <Link
                href="/content/blogs/categories"
                className="underline"
                style={{ color: "#0369A1" }}
              >
                Categories →
              </Link>
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={openCreate}>
            + New Blog
          </Button>
        </div>

        {/* List */}
        <DataList
          data={paged}
          columns={columns}
          getId={(r) => String(r.id)}
          total={filtered.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onSearch={(q) => {
            setSearch(q);
            setPage(1);
          }}
          searchPlaceholder="Search blogs by title…"
          emptyMessage={
            search ? `No blogs match "${search}"` : "No blogs found."
          }
        />

        {/* Create / edit drawer */}
        {drawer && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <div
              className="absolute inset-0 bg-black/20"
              onClick={closeDrawer}
            />
            <div
              className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-xl border-l"
              style={{ borderColor: "#E8E4DE" }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between border-b px-5 py-3 shrink-0"
                style={{ borderColor: "#E8E4DE" }}
              >
                <h3
                  className="font-serif text-base font-semibold"
                  style={{ color: "#1A1714" }}
                >
                  {drawer.mode === "create"
                    ? "New Blog"
                    : `Edit Blog #${drawer.id}`}
                </h3>
                <button
                  onClick={closeDrawer}
                  className="text-xl leading-none"
                  style={{ color: "#847D77" }}
                >
                  ×
                </button>
              </div>

              {/* Warning banner */}
              <div className="px-5 pt-3 shrink-0">
                <div
                  className="rounded-lg border px-3 py-2 text-xs"
                  style={{
                    background: "#FFF8F0",
                    borderColor: "#FDE9C5",
                    color: "#8A4C19",
                  }}
                >
                  Preview — you can edit; saves to the sandbox test DB only (never live).
                </div>
              </div>

              {/* Detail loading indicator */}
              {detailLoading && drawer.mode === "edit" && (
                <div className="px-5 pt-2 shrink-0 flex items-center gap-2">
                  <div
                    className="h-3 w-3 animate-spin rounded-full border border-t-transparent shrink-0"
                    style={{ borderColor: "#E8E4DE", borderTopColor: "#A86120" }}
                  />
                  <span className="text-xs" style={{ color: "#847D77" }}>
                    Loading full record…
                  </span>
                </div>
              )}

              {/* Tab bar */}
              <div className="px-5 pt-3 shrink-0">
                <nav className="flex flex-wrap gap-1" role="tablist">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === t.id}
                      onClick={() => setActiveTab(t.id)}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                      style={
                        activeTab === t.id
                          ? { background: "#A86120", color: "white" }
                          : { background: "transparent", color: "#635D58" }
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Scrollable form content */}
              <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-4">
                {/* ── Basic Info ── */}
                {activeTab === "basic" && (
                  <>
                    <FormField label="Title" required>
                      <TextInput
                        value={drawer.form.title}
                        onChange={(e) => updateForm({ title: e.target.value })}
                        placeholder="Blog title (min 10 chars)"
                        autoFocus
                      />
                    </FormField>
                    <FormField label="Description" required>
                      <Textarea
                        value={drawer.form.description}
                        onChange={(e) =>
                          updateForm({ description: e.target.value })
                        }
                        placeholder="Short description (min 10 chars)"
                        rows={3}
                      />
                    </FormField>
                    <FormField label="Category" required>
                      <Select
                        options={categoryOpts}
                        placeholder="Select category"
                        value={drawer.form.blogContentCategoryId || ""}
                        onChange={(e) =>
                          updateForm({
                            blogContentCategoryId: Number(e.target.value),
                          })
                        }
                      />
                    </FormField>
                    <FormField label="Slug" hint="URL-friendly identifier">
                      <TextInput
                        value={drawer.form.slug}
                        onChange={(e) => updateForm({ slug: e.target.value })}
                        placeholder="e.g. handloom-weaving-guide"
                      />
                    </FormField>
                    <FormField
                      label="Previous Blog ID"
                      hint="ID of the preceding blog in sequence"
                    >
                      <TextInput
                        type="number"
                        value={drawer.form.previousBlogId}
                        onChange={(e) =>
                          updateForm({ previousBlogId: e.target.value })
                        }
                        placeholder="e.g. 12"
                      />
                    </FormField>
                    <FormField
                      label="Next Blog ID"
                      hint="ID of the following blog in sequence"
                    >
                      <TextInput
                        type="number"
                        value={drawer.form.nextBlogId}
                        onChange={(e) =>
                          updateForm({ nextBlogId: e.target.value })
                        }
                        placeholder="e.g. 14"
                      />
                    </FormField>
                  </>
                )}

                {/* ── Banner ── */}
                {activeTab === "banner" && (
                  <>
                    <FormField label="Banner Desktop URL">
                      <TextInput
                        value={drawer.form.bannerImageDesktop}
                        onChange={(e) =>
                          updateForm({ bannerImageDesktop: e.target.value })
                        }
                        placeholder="https://cdn.anuprerna.com/…"
                      />
                    </FormField>
                    <FormField label="Banner Desktop Alt Text">
                      <TextInput
                        value={drawer.form.bannerImageDesktopAlt}
                        onChange={(e) =>
                          updateForm({ bannerImageDesktopAlt: e.target.value })
                        }
                        placeholder="Descriptive alt text"
                      />
                    </FormField>
                    <FormField label="Banner Mobile URL">
                      <TextInput
                        value={drawer.form.bannerImageMobile}
                        onChange={(e) =>
                          updateForm({ bannerImageMobile: e.target.value })
                        }
                        placeholder="https://cdn.anuprerna.com/…"
                      />
                    </FormField>
                    <FormField label="Banner Mobile Alt Text">
                      <TextInput
                        value={drawer.form.bannerImageMobileAlt}
                        onChange={(e) =>
                          updateForm({ bannerImageMobileAlt: e.target.value })
                        }
                        placeholder="Descriptive alt text"
                      />
                    </FormField>
                    <FormField label="Parallax Text">
                      <TextInput
                        value={drawer.form.parallaxText}
                        onChange={(e) =>
                          updateForm({ parallaxText: e.target.value })
                        }
                        placeholder="Overlay text on the parallax banner"
                      />
                    </FormField>
                    <FormField label="Parallax Banner URL">
                      <TextInput
                        value={drawer.form.bannerImageParallax}
                        onChange={(e) =>
                          updateForm({ bannerImageParallax: e.target.value })
                        }
                        placeholder="https://cdn.anuprerna.com/…"
                      />
                    </FormField>
                    <FormField label="Parallax Banner Alt Text">
                      <TextInput
                        value={drawer.form.bannerImageParallaxAlt}
                        onChange={(e) =>
                          updateForm({
                            bannerImageParallaxAlt: e.target.value,
                          })
                        }
                        placeholder="Descriptive alt text"
                      />
                    </FormField>
                  </>
                )}

                {/* ── Sections ── */}
                {activeTab === "sections" && (
                  <div className="flex flex-col gap-3">
                    {/* Section list */}
                    {sections.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {sections.map((sec, idx) => (
                          <div
                            key={sec.id ?? `draft-${idx}`}
                            className="flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                            style={{ background: "#FAF9F7", borderColor: "#E8E4DE" }}
                          >
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="font-medium text-xs" style={{ color: "#1A1714" }}>
                                #{sec.sortOrder} — {TEMPLATE_TYPE_LABELS[sec.templateType] ?? `Template ${sec.templateType}`}
                              </span>
                              {sec.heading && (
                                <span className="text-xs truncate" style={{ color: "#635D58" }}>
                                  {sec.heading.slice(0, 40)}{sec.heading.length > 40 ? "…" : ""}
                                </span>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <button
                                type="button"
                                className="text-xs px-2 py-1 rounded border transition-colors"
                                style={
                                  editingIndex === idx
                                    ? { color: "white", borderColor: "#A86120", background: "#A86120" }
                                    : { color: "#0369A1", borderColor: "#CCE3F0", background: "#F0F7FB" }
                                }
                                onClick={() => {
                                  setSectionDraft({ ...sec });
                                  setEditingIndex(idx);
                                  setShowSectionForm(true);
                                }}
                              >
                                {editingIndex === idx ? "Editing…" : "Edit"}
                              </button>
                              <button
                                type="button"
                                className="text-xs px-2 py-1 rounded border transition-colors"
                                style={{ color: "#B45309", borderColor: "#FDE9C5", background: "#FFF8F0" }}
                                onClick={() => requestRemoveSection(idx)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Section button */}
                    {!showSectionForm && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSectionDraft({ ...EMPTY_SECTION });
                          setEditingIndex(null);
                          setShowSectionForm(true);
                        }}
                      >
                        + Add Section
                      </Button>
                    )}

                    {/* Inline section form */}
                    {showSectionForm && (
                      <div
                        className="flex flex-col gap-3 rounded-lg border px-4 py-4"
                        style={{ background: "#FAF9F7", borderColor: "#E8E4DE" }}
                      >
                        <p className="text-xs font-medium" style={{ color: "#4A4540" }}>
                          {editingIndex !== null ? `Edit Section #${sectionDraft.sortOrder}` : "New Section"}
                        </p>

                        <FormField label="Sort Order" required>
                          <TextInput
                            type="number"
                            value={String(sectionDraft.sortOrder)}
                            onChange={(e) =>
                              setSectionDraft((d) => ({ ...d, sortOrder: Number(e.target.value) }))
                            }
                            placeholder="e.g. 1"
                          />
                        </FormField>

                        <FormField label="Template Type" required>
                          <Select
                            options={TEMPLATE_TYPE_OPTS}
                            value={sectionDraft.templateType}
                            onChange={(e) =>
                              setSectionDraft((d) => ({ ...d, templateType: Number(e.target.value) }))
                            }
                          />
                        </FormField>

                        {/* heading — templates 1–8 */}
                        {sectionDraft.templateType >= 1 && sectionDraft.templateType <= 8 && (
                          <FormField label="Heading">
                            <TextInput
                              value={sectionDraft.heading}
                              onChange={(e) =>
                                setSectionDraft((d) => ({ ...d, heading: e.target.value }))
                              }
                              placeholder="Section heading"
                            />
                          </FormField>
                        )}

                        {/* title1 — templates 1–8 */}
                        {sectionDraft.templateType >= 1 && sectionDraft.templateType <= 8 && (
                          <FormField label="Title 1">
                            <TextInput
                              value={sectionDraft.title1}
                              onChange={(e) =>
                                setSectionDraft((d) => ({ ...d, title1: e.target.value }))
                              }
                              placeholder="Primary title"
                            />
                          </FormField>
                        )}

                        {/* paragraph1 — templates 1, 2, 3, 4, 5, 8 */}
                        {[1, 2, 3, 4, 5, 8].includes(sectionDraft.templateType) && (
                          <FormField label="Paragraph 1">
                            <RichTextEditor
                              value={sectionDraft.paragraph1}
                              onChange={(v) =>
                                setSectionDraft((d) => ({ ...d, paragraph1: v }))
                              }
                              placeholder="Rich text content…"
                            />
                          </FormField>
                        )}

                        {/* image1, image1Alt, caption1 — templates 1, 2, 6, 9 */}
                        {[1, 2, 6, 9].includes(sectionDraft.templateType) && (
                          <>
                            <FormField label="Image 1 URL">
                              <TextInput
                                value={sectionDraft.image1}
                                onChange={(e) =>
                                  setSectionDraft((d) => ({ ...d, image1: e.target.value }))
                                }
                                placeholder="https://cdn.anuprerna.com/…"
                              />
                            </FormField>
                            <FormField label="Image 1 Alt Text">
                              <TextInput
                                value={sectionDraft.image1Alt}
                                onChange={(e) =>
                                  setSectionDraft((d) => ({ ...d, image1Alt: e.target.value }))
                                }
                                placeholder="Descriptive alt text"
                              />
                            </FormField>
                            <FormField label="Caption 1">
                              <TextInput
                                value={sectionDraft.caption1}
                                onChange={(e) =>
                                  setSectionDraft((d) => ({ ...d, caption1: e.target.value }))
                                }
                                placeholder="Image caption"
                              />
                            </FormField>
                          </>
                        )}

                        {/* title2 — template 5 only */}
                        {sectionDraft.templateType === 5 && (
                          <FormField label="Title 2">
                            <TextInput
                              value={sectionDraft.title2}
                              onChange={(e) =>
                                setSectionDraft((d) => ({ ...d, title2: e.target.value }))
                              }
                              placeholder="Secondary title"
                            />
                          </FormField>
                        )}

                        {/* paragraph2 — templates 2, 4, 5 */}
                        {[2, 4, 5].includes(sectionDraft.templateType) && (
                          <FormField label="Paragraph 2">
                            <RichTextEditor
                              value={sectionDraft.paragraph2}
                              onChange={(v) =>
                                setSectionDraft((d) => ({ ...d, paragraph2: v }))
                              }
                              placeholder="Rich text content…"
                            />
                          </FormField>
                        )}

                        {/* image2, image2Alt, caption2 — template 6 */}
                        {sectionDraft.templateType === 6 && (
                          <>
                            <FormField label="Image 2 URL">
                              <TextInput
                                value={sectionDraft.image2}
                                onChange={(e) =>
                                  setSectionDraft((d) => ({ ...d, image2: e.target.value }))
                                }
                                placeholder="https://cdn.anuprerna.com/…"
                              />
                            </FormField>
                            <FormField label="Image 2 Alt Text">
                              <TextInput
                                value={sectionDraft.image2Alt}
                                onChange={(e) =>
                                  setSectionDraft((d) => ({ ...d, image2Alt: e.target.value }))
                                }
                                placeholder="Descriptive alt text"
                              />
                            </FormField>
                            <FormField label="Caption 2">
                              <TextInput
                                value={sectionDraft.caption2}
                                onChange={(e) =>
                                  setSectionDraft((d) => ({ ...d, caption2: e.target.value }))
                                }
                                placeholder="Image caption"
                              />
                            </FormField>
                          </>
                        )}

                        {/* video1 — templates 3, 4, 7, 10 */}
                        {[3, 4, 7, 10].includes(sectionDraft.templateType) && (
                          <FormField label="Video 1 URL">
                            <TextInput
                              value={sectionDraft.video1}
                              onChange={(e) =>
                                setSectionDraft((d) => ({ ...d, video1: e.target.value }))
                              }
                              placeholder="https://cdn.anuprerna.com/…"
                            />
                          </FormField>
                        )}

                        {/* video2 — template 7 */}
                        {sectionDraft.templateType === 7 && (
                          <FormField label="Video 2 URL">
                            <TextInput
                              value={sectionDraft.video2}
                              onChange={(e) =>
                                setSectionDraft((d) => ({ ...d, video2: e.target.value }))
                              }
                              placeholder="https://cdn.anuprerna.com/…"
                            />
                          </FormField>
                        )}

                        {/* ctaButtonName1, ctaLink1 — templates 1, 2, 3, 4, 5, 8 */}
                        {[1, 2, 3, 4, 5, 8].includes(sectionDraft.templateType) && (
                          <>
                            <FormField label="CTA Button Name 1">
                              <TextInput
                                value={sectionDraft.ctaButtonName1}
                                onChange={(e) =>
                                  setSectionDraft((d) => ({ ...d, ctaButtonName1: e.target.value }))
                                }
                                placeholder="e.g. Shop Now"
                              />
                            </FormField>
                            <FormField label="CTA Link 1">
                              <TextInput
                                value={sectionDraft.ctaLink1}
                                onChange={(e) =>
                                  setSectionDraft((d) => ({ ...d, ctaLink1: e.target.value }))
                                }
                                placeholder="/collections/…"
                              />
                            </FormField>
                          </>
                        )}

                        {/* ctaButtonName2, ctaLink2 — template 5 only */}
                        {sectionDraft.templateType === 5 && (
                          <>
                            <FormField label="CTA Button Name 2">
                              <TextInput
                                value={sectionDraft.ctaButtonName2}
                                onChange={(e) =>
                                  setSectionDraft((d) => ({ ...d, ctaButtonName2: e.target.value }))
                                }
                                placeholder="e.g. Learn More"
                              />
                            </FormField>
                            <FormField label="CTA Link 2">
                              <TextInput
                                value={sectionDraft.ctaLink2}
                                onChange={(e) =>
                                  setSectionDraft((d) => ({ ...d, ctaLink2: e.target.value }))
                                }
                                placeholder="/blogs/…"
                              />
                            </FormField>
                          </>
                        )}

                        {/* Form actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSections((prev) =>
                                editingIndex !== null
                                  ? prev.map((s, i) => (i === editingIndex ? { ...sectionDraft } : s))
                                  : [...prev, { ...sectionDraft }],
                              );
                              setSectionDraft({ ...EMPTY_SECTION });
                              setShowSectionForm(false);
                              setEditingIndex(null);
                            }}
                            disabled={sectionDraft.sortOrder < 1}
                          >
                            {editingIndex !== null ? "Save Changes" : "Add to List"}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setShowSectionForm(false);
                              setSectionDraft({ ...EMPTY_SECTION });
                              setEditingIndex(null);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── SEO ── */}
                {activeTab === "seo" && (
                  <>
                    <FormField label="Meta Title">
                      <TextInput
                        value={drawer.form.metaTitle}
                        onChange={(e) =>
                          updateForm({ metaTitle: e.target.value })
                        }
                        placeholder="e.g. Handloom Weaving Guide — Anuprerna"
                      />
                    </FormField>
                    <FormField label="Meta Description">
                      <Textarea
                        value={drawer.form.metaDescription}
                        onChange={(e) =>
                          updateForm({ metaDescription: e.target.value })
                        }
                        placeholder="160-character SEO description…"
                        rows={3}
                      />
                    </FormField>
                    <FormField
                      label="Backward Compatible Link"
                      hint="Legacy URL for redirects"
                    >
                      <TextInput
                        value={drawer.form.backwardCompatibleLink}
                        onChange={(e) =>
                          updateForm({
                            backwardCompatibleLink: e.target.value,
                          })
                        }
                        placeholder="/blogs/old-slug"
                      />
                    </FormField>
                  </>
                )}
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between gap-3 border-t px-5 py-3 shrink-0"
                style={{ borderColor: "#E8E4DE" }}
              >
                {drawer.mode === "edit" && drawer.id != null ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmDelete({ id: drawer.id as number, title: drawer.form.title })}
                  >
                    Delete
                  </Button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-3">
                  <Button variant="secondary" onClick={closeDrawer} size="sm">
                    Cancel
                  </Button>
                  {saveError && (
                    <span className="text-xs mr-2" style={{ color: "#B91C1C" }}>{saveError}</span>
                  )}
                  <Button
                    variant="primary"
                    onClick={doSave}
                    size="sm"
                    disabled={
                      saving ||
                      !drawer.form.title.trim() ||
                      drawer.form.title.length < 10
                    }
                  >
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Blog delete confirm */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete blog?"
        message={
          confirmDelete ? (
            <>
              &ldquo;{confirmDelete.title}&rdquo; will be permanently removed from the sandbox
              database. This cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete"
        danger
        loading={deleting}
        error={deleteError}
        onConfirm={doDeleteBlog}
        onCancel={() => {
          setConfirmDelete(null);
          setDeleteError(null);
        }}
      />

      {/* Section delete confirm */}
      <ConfirmDialog
        open={!!confirmSectionDelete}
        title="Remove section?"
        message={
          confirmSectionDelete ? (
            <>
              Section &ldquo;{confirmSectionDelete.label}&rdquo; will be permanently deleted from the
              sandbox database. This cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Remove"
        danger
        loading={sectionDeleting}
        error={sectionDeleteError}
        onConfirm={doRemoveSection}
        onCancel={() => {
          setConfirmSectionDelete(null);
          setSectionDeleteError(null);
        }}
      />
    </WeaveShell>
  );
}
