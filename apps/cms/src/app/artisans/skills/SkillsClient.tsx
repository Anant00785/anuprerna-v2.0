"use client";

/**
 * SkillsClient — list + create/edit drawer for the Skills library.
 *
 * Skills are the craft competencies linked to artisans (Khadi, Jamdani,
 * Batik Print, …). Simple CRUD: name (required) + description.
 *
 * Save -> POST /api/crud add/skill (create) or PATCH update/skill (edit, id
 * travels in the body); Delete -> DELETE /api/crud delete/skill/{id} (soft
 * delete server-side — deleted=true, filtered out of the list client-side).
 * Every target endpoint writes ONLY to the sandbox pg copy (never live Loom).
 */

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Trash2 } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import {
  DataList,
  DataListColumn,
  KpiStrip,
  FormField,
  TextInput,
  Textarea,
  Button,
  ConfirmDialog,
} from "@/components/ui";
import { formatCount, formatEpoch } from "@/lib/utils";
import type { SkillRow } from "@/types/artisan";

interface SkillForm {
  name: string;
  description: string;
}

interface DrawerState {
  mode: "create" | "edit";
  id?: number;
  form: SkillForm;
}

const EMPTY_FORM: SkillForm = { name: "", description: "" };
const PAGE_SIZE = 25;

interface SkillsClientProps {
  skills: SkillRow[];
}

export function SkillsClient({ skills }: SkillsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const documented = useMemo(
    () => skills.filter((s) => s.description.trim().length > 0).length,
    [skills],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return skills;
    const q = search.toLowerCase();
    return skills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    );
  }, [skills, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = useCallback(() => {
    setDrawer({ mode: "create", form: { ...EMPTY_FORM } });
    setSaveError(null);
  }, []);

  const openEdit = useCallback((s: SkillRow) => {
    setDrawer({ mode: "edit", id: s.id, form: { name: s.name, description: s.description } });
    setSaveError(null);
  }, []);

  const closeDrawer = () => {
    setDrawer(null);
    setSaveError(null);
  };

  const updateForm = (patch: Partial<SkillForm>) =>
    setDrawer((d) => (d ? { ...d, form: { ...d.form, ...patch } } : null));

  const buildBody = () => {
    if (!drawer) return {};
    return drawer.mode === "create"
      ? { name: drawer.form.name, description: drawer.form.description }
      : { id: drawer.id, name: drawer.form.name, description: drawer.form.description };
  };

  // Real sandbox save. create -> POST add/skill; edit -> PATCH update/skill
  // (id travels in the body — no :id path param on this endpoint). Writes
  // ONLY to sandbox pg via /api/crud.
  const doSave = useCallback(async () => {
    if (!drawer || !drawer.form.name.trim()) return;
    const isEdit = drawer.mode === "edit";
    const path = isEdit ? "update/skill" : "add/skill";
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, method: isEdit ? "PATCH" : "POST", body: buildBody() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success === false) throw new Error(j?.message || `Save failed (${res.status})`);
      closeDrawer();
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [drawer, router]);

  const doDelete = useCallback(async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: `delete/skill/${confirmDelete.id}`, method: "DELETE" }),
      });
      const j = await res.json().catch(() => ({}));
      const ok = res.ok && j?.success !== false;
      if (!ok) throw new Error(j?.message || `Delete failed (${res.status})`);
      setConfirmDelete(null);
      closeDrawer();
      router.refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }, [confirmDelete, router]);

  const columns = useMemo<DataListColumn<SkillRow>[]>(
    () => [
      {
        key: "id",
        label: "ID",
        headerClassName: "w-24",
        render: (s) => (
          <span className="font-mono text-xs tabular-nums" style={{ color: "#AAA39E" }}>
            #{s.id}
          </span>
        ),
      },
      {
        key: "name",
        label: "Skill",
        render: (s) => (
          <button
            type="button"
            className="font-medium text-sm text-left hover:underline"
            style={{ color: "#1A1714" }}
            onClick={() => openEdit(s)}
          >
            {s.name}
          </button>
        ),
      },
      {
        key: "description",
        label: "Description",
        render: (s) =>
          s.description ? (
            <span className="text-sm line-clamp-2 max-w-xl" style={{ color: "#635D58" }}>
              {s.description}
            </span>
          ) : (
            <span className="text-xs" style={{ color: "#D1CCC6" }}>
              No description
            </span>
          ),
      },
      {
        key: "updated",
        label: "Updated",
        headerClassName: "w-28",
        render: (s) => (
          <span className="text-xs" style={{ color: "#847D77" }}>
            {formatEpoch(s.lastUpdateTime || s.timeOfCreation)}
          </span>
        ),
      },
      {
        key: "actions",
        label: "",
        headerClassName: "w-12",
        cellClassName: "text-right",
        render: (s) => (
          <button
            type="button"
            className="rounded-md p-1.5 hover:bg-red-50 transition-colors"
            style={{ color: "#AAA39E" }}
            title="Delete skill"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete({ id: s.id, name: s.name });
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
        <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
          <Link href="/artisans" style={{ color: "#847D77" }}>
            Artisans
          </Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>
            Skills
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
              Skills
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              The craft competency library — every skill an artisan can be tagged
              with (Khadi, Jamdani, Batik Print, …).
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={openCreate}>
            + New Skill
          </Button>
        </div>

        <KpiStrip
          items={[
            { label: "Total Skills", value: formatCount(skills.length), icon: <BookOpen className="h-4 w-4" /> },
            { label: "With Description", value: formatCount(documented) },
          ]}
        />

        <DataList
          data={paged}
          columns={columns}
          getId={(s) => String(s.id)}
          total={filtered.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onSearch={(q) => {
            setSearch(q);
            setPage(1);
          }}
          searchPlaceholder="Search skills by name or description…"
          emptyMessage={search ? `No skills match "${search}"` : "No skills found."}
        />

        {drawer && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <div className="absolute inset-0 bg-black/20" onClick={closeDrawer} />
            <div
              className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl border-l"
              style={{ borderColor: "#E8E4DE" }}
            >
              <div
                className="flex items-center justify-between border-b px-5 py-3"
                style={{ borderColor: "#E8E4DE" }}
              >
                <h3 className="font-serif text-base font-semibold" style={{ color: "#1A1714" }}>
                  {drawer.mode === "create" ? "New Skill" : `Edit Skill #${drawer.id}`}
                </h3>
                <button onClick={closeDrawer} className="text-xl leading-none" style={{ color: "#847D77" }}>
                  ×
                </button>
              </div>

              <div className="px-5 pt-4">
                <div
                  className="rounded-lg border px-3 py-2 text-xs"
                  style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}
                >
                  Preview — you can edit; saves to the sandbox test DB only (never live).
                </div>
              </div>

              <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-4">
                <FormField label="Skill Name" required>
                  <TextInput
                    value={drawer.form.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                    placeholder="e.g. Handloom Jacquard"
                    autoFocus
                  />
                </FormField>
                <FormField label="Description" hint="Shown on the storefront artisan/craft pages.">
                  <Textarea
                    value={drawer.form.description}
                    onChange={(e) => updateForm({ description: e.target.value })}
                    placeholder="Describe the craft skill…"
                    rows={6}
                  />
                </FormField>
              </div>

              <div
                className="flex items-center justify-between gap-3 border-t px-5 py-3"
                style={{ borderColor: "#E8E4DE" }}
              >
                {drawer.mode === "edit" && drawer.id != null ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmDelete({ id: drawer.id as number, name: drawer.form.name })}
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
                    disabled={saving || !drawer.form.name.trim()}
                  >
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        <ConfirmDialog
          open={!!confirmDelete}
          title="Delete skill?"
          message={
            confirmDelete ? (
              <>
                &ldquo;{confirmDelete.name}&rdquo; will be permanently removed from the sandbox
                database. This cannot be undone.
              </>
            ) : null
          }
          confirmLabel="Delete"
          danger
          loading={deleting}
          error={deleteError}
          onConfirm={doDelete}
          onCancel={() => {
            setConfirmDelete(null);
            setDeleteError(null);
          }}
        />
      </div>
    </WeaveShell>
  );
}
