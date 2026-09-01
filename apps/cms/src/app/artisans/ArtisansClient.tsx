"use client";

/**
 * ArtisansClient — list + stats + create/edit drawer for Artisans.
 *
 * Fields mirror the Angular create-artisan form:
 *   identity (name, contactNumber, role, master), skills, demographics
 *   (gender, dob, whatsapp), location (state/district/village/postal),
 *   craft (expertise, experience), bank (hasBankAccount/bankName/holder/ifsc).
 *
 * Write-safety: "Validate →" assembles the exact Loom write-payload (the
 * tenant-aware shape Loom expects) and shows it in CatalogPayloadDrawer.
 * Nothing is sent to Loom — saving goes live at launch.
 */

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Paintbrush, Crown, User, BookOpen } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import {
  DataList,
  DataListColumn,
  KpiStrip,
  FormField,
  TextInput,
  Select,
  MultiSelect,
  Toggle,
  Button,
  Badge,
} from "@/components/ui";
import { CatalogPayloadDrawer } from "@/components/catalog/CatalogPayloadDrawer";
import { formatCount } from "@/lib/utils";
import type { ArtisanRow, SkillRow, ArtisanRole, Gender } from "@/types/artisan";

interface ArtisanForm {
  name: string;
  contactNumber: string;
  artisanRole: ArtisanRole;
  masterArtisanId: string; // "" = none
  skillIds: number[];
  gender: Gender | "";
  dob: string; // yyyy-mm-dd
  hasWhatsapp: boolean;
  state: string;
  district: string;
  villageTown: string;
  postalCode: string;
  expertise: string;
  experience: string;
  hasBankAccount: boolean;
  bankName: string;
  accountHolderName: string;
  ifscCode: string;
  active: boolean;
}

interface DrawerState {
  mode: "create" | "edit";
  id?: number;
  form: ArtisanForm;
}

const EMPTY_FORM: ArtisanForm = {
  name: "",
  contactNumber: "",
  artisanRole: "WORKER",
  masterArtisanId: "",
  skillIds: [],
  gender: "",
  dob: "",
  hasWhatsapp: false,
  state: "",
  district: "",
  villageTown: "",
  postalCode: "",
  expertise: "",
  experience: "0",
  hasBankAccount: false,
  bankName: "",
  accountHolderName: "",
  ifscCode: "",
  active: true,
};

const PAGE_SIZE = 25;

/** yyyy-mm-dd -> epoch ms (UTC midnight). 0 when empty/invalid. */
function dobToEpoch(s: string): number {
  if (!s) return 0;
  const ms = Date.parse(s + "T00:00:00Z");
  return Number.isFinite(ms) ? ms : 0;
}
/** epoch ms -> yyyy-mm-dd for the date input (UTC). */
function epochToDob(ms: number): string {
  if (!ms || ms <= 0) return "";
  return new Date(ms).toISOString().slice(0, 10);
}

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const ROLE_OPTIONS = [
  { value: "MASTER", label: "Master Artisan" },
  { value: "WORKER", label: "Worker Artisan" },
];

interface ArtisansClientProps {
  artisans: ArtisanRow[];
  skills: SkillRow[];
}

export function ArtisansClient({ artisans, skills }: ArtisansClientProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [showPayload, setShowPayload] = useState(false);

  const masterCount = useMemo(
    () => artisans.filter((a) => a.artisanRole === "MASTER").length,
    [artisans],
  );
  const workerCount = useMemo(
    () => artisans.filter((a) => a.artisanRole === "WORKER").length,
    [artisans],
  );
  const activeCount = useMemo(
    () => artisans.filter((a) => a.active).length,
    [artisans],
  );

  const masterOptions = useMemo(
    () =>
      artisans
        .filter((a) => a.artisanRole === "MASTER" && a.active)
        .map((a) => ({ value: a.id, label: `${a.name} (#${a.id})` })),
    [artisans],
  );

  const skillOptions = useMemo(
    () => skills.map((s) => ({ id: s.id, name: s.name })),
    [skills],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return artisans;
    const q = search.toLowerCase();
    return artisans.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.contactNumber.toLowerCase().includes(q) ||
        a.state.toLowerCase().includes(q) ||
        a.skills.some((s) => s.name.toLowerCase().includes(q)),
    );
  }, [artisans, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = useCallback(() => {
    setDrawer({ mode: "create", form: { ...EMPTY_FORM } });
    setShowPayload(false);
  }, []);

  const openEdit = useCallback((a: ArtisanRow) => {
    setDrawer({
      mode: "edit",
      id: a.id,
      form: {
        name: a.name,
        contactNumber: a.contactNumber,
        artisanRole: a.artisanRole,
        masterArtisanId: a.masterArtisanId != null ? String(a.masterArtisanId) : "",
        skillIds: a.skillIds,
        gender: a.gender === "UNDEFINED" ? "" : a.gender,
        dob: epochToDob(a.dob),
        hasWhatsapp: a.hasWhatsapp,
        state: a.state,
        district: a.district,
        villageTown: a.villageTown,
        postalCode: a.postalCode,
        expertise: a.expertise,
        experience: String(a.experience ?? 0),
        hasBankAccount: a.hasBankAccount,
        bankName: a.bankName,
        accountHolderName: a.accountHolderName,
        ifscCode: a.ifscCode,
        active: a.active,
      },
    });
    setShowPayload(false);
  }, []);

  const closeDrawer = () => {
    setDrawer(null);
    setShowPayload(false);
  };

  const updateForm = (patch: Partial<ArtisanForm>) =>
    setDrawer((d) => (d ? { ...d, form: { ...d.form, ...patch } } : null));

  const buildPayload = () => {
    if (!drawer) return {};
    const f = drawer.form;
    const isWorker = f.artisanRole === "WORKER";
    const tenant = {
      name: f.name,
      contactNumber: f.contactNumber,
      gender: f.gender || "UNDEFINED",
      dob: dobToEpoch(f.dob),
      active: f.active,
    };
    const common = {
      artisanRole: f.artisanRole,
      masterArtisanId: isWorker
        ? f.masterArtisanId
          ? Number(f.masterArtisanId)
          : null
        : null,
      skillIds: f.skillIds,
      hasWhatsapp: f.hasWhatsapp,
      state: f.state || null,
      district: f.district || null,
      villageTown: f.villageTown || null,
      postalCode: f.postalCode || null,
      expertise: f.expertise || null,
      experience: Number(f.experience) || 0,
      hasBankAccount: f.hasBankAccount,
      bankName: f.bankName || null,
      accountHolderName: f.accountHolderName || null,
      ifscCode: f.ifscCode || null,
    };
    if (drawer.mode === "create") {
      return {
        endpoint: "/add/artisan",
        method: "POST",
        body: { ...common, tenant },
      };
    }
    return {
      endpoint: "/update/artisan",
      method: "PATCH",
      body: { id: drawer.id, ...common, tenant },
    };
  };

  const columns = useMemo<DataListColumn<ArtisanRow>[]>(
    () => [
      {
        key: "name",
        label: "Artisan",
        render: (a) => (
          <div className="flex flex-col">
            <button
              type="button"
              className="font-medium text-sm text-left hover:underline"
              style={{ color: "#1A1714" }}
              onClick={() => openEdit(a)}
            >
              {a.name || "—"}
            </button>
            <Link
              href={`/artisans/${a.id}`}
              className="mt-0.5 text-[11px] font-medium hover:underline"
              style={{ color: "#A86120" }}
            >
              View profile →
            </Link>
            <span className="text-xs" style={{ color: "#AAA39E" }}>
              {a.contactNumber || "no contact"}
              {a.hasWhatsapp && " · WhatsApp"}
            </span>
          </div>
        ),
      },
      {
        key: "role",
        label: "Role",
        render: (a) => (
          <div className="flex flex-col gap-0.5">
            <Badge variant={a.artisanRole === "MASTER" ? "purple" : "blue"}>
              {a.artisanRole === "MASTER" ? "Master" : "Worker"}
            </Badge>
            {a.artisanRole === "WORKER" && a.masterArtisanName && (
              <span className="text-[11px]" style={{ color: "#AAA39E" }}>
                under {a.masterArtisanName}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "skills",
        label: "Skills",
        render: (a) =>
          a.skills.length ? (
            <div className="flex flex-wrap gap-1 max-w-xs">
              {a.skills.slice(0, 3).map((s) => (
                <span
                  key={s.id}
                  className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ background: "#FFF8F0", color: "#8A4C19" }}
                >
                  {s.name}
                </span>
              ))}
              {a.skills.length > 3 && (
                <span className="text-[11px]" style={{ color: "#AAA39E" }}>
                  +{a.skills.length - 3}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs" style={{ color: "#D1CCC6" }}>
              None
            </span>
          ),
      },
      {
        key: "location",
        label: "Location",
        render: (a) => (
          <span className="text-sm" style={{ color: "#635D58" }}>
            {[a.villageTown, a.district, a.state].filter(Boolean).join(", ") || "—"}
          </span>
        ),
      },
      {
        key: "experience",
        label: "Exp.",
        headerClassName: "w-16",
        render: (a) => (
          <span className="text-sm tabular-nums" style={{ color: "#635D58" }}>
            {a.experience ? `${a.experience}y` : "—"}
          </span>
        ),
      },
      {
        key: "catalog",
        label: "Catalogs",
        headerClassName: "w-20",
        render: (a) => (
          <span className="text-sm tabular-nums" style={{ color: "#635D58" }}>
            {formatCount(a.catalogCount)}
          </span>
        ),
      },
      {
        key: "active",
        label: "Status",
        headerClassName: "w-20",
        render: (a) => (
          <Badge variant={a.active ? "green" : "stone"}>
            {a.active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
    ],
    [openEdit],
  );

  const f = drawer?.form;
  const isWorker = f?.artisanRole === "WORKER";

  return (
    <WeaveShell
      breadcrumb={
        <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
          <span>Relationships</span>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>
            Artisans
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
              Artisans
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              The weavers and makers behind every Anuprerna product — master
              artisans and the workers in their clusters.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/artisans/skills">
              <Button variant="secondary" size="sm">
                <BookOpen className="h-3.5 w-3.5" /> Skills
              </Button>
            </Link>
            <Button variant="primary" size="sm" onClick={openCreate}>
              + New Artisan
            </Button>
          </div>
        </div>

        {/* Stats */}
        <KpiStrip
          items={[
            { label: "Total Artisans", value: formatCount(artisans.length), icon: <Paintbrush className="h-4 w-4" /> },
            { label: "Masters", value: formatCount(masterCount), icon: <Crown className="h-4 w-4" /> },
            { label: "Workers", value: formatCount(workerCount), icon: <User className="h-4 w-4" /> },
            { label: "Active", value: formatCount(activeCount) },
          ]}
        />

        {/* List */}
        <DataList
          data={paged}
          columns={columns}
          getId={(a) => String(a.id)}
          total={filtered.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onSearch={(q) => {
            setSearch(q);
            setPage(1);
          }}
          searchPlaceholder="Search by name, contact, state or skill…"
          emptyMessage={
            search ? `No artisans match "${search}"` : "No artisans found."
          }
        />

        {/* Create / edit drawer */}
        {drawer && f && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <div className="absolute inset-0 bg-black/20" onClick={closeDrawer} />
            <div
              className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-xl border-l"
              style={{ borderColor: "#E8E4DE" }}
            >
              <div
                className="flex items-center justify-between border-b px-5 py-3"
                style={{ borderColor: "#E8E4DE" }}
              >
                <h3 className="font-serif text-base font-semibold" style={{ color: "#1A1714" }}>
                  {drawer.mode === "create" ? "New Artisan" : `Edit Artisan #${drawer.id}`}
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
                  Preview — you can edit; saving goes live at launch. &quot;Validate&quot; previews the payload.
                </div>
              </div>

              <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-5">
                {/* Identity */}
                <Section title="Identity">
                  <FormField label="Full Name" required>
                    <TextInput
                      value={f.name}
                      onChange={(e) => updateForm({ name: e.target.value })}
                      placeholder="e.g. Akshoy Kumar Dey"
                      autoFocus
                    />
                  </FormField>
                  <FormField label="Contact Number" required>
                    <TextInput
                      value={f.contactNumber}
                      onChange={(e) => updateForm({ contactNumber: e.target.value })}
                      placeholder="10-digit mobile"
                    />
                  </FormField>
                  <FormField label="Role" required>
                    <Select
                      options={ROLE_OPTIONS}
                      value={f.artisanRole}
                      onChange={(e) => updateForm({ artisanRole: e.target.value as ArtisanRole })}
                    />
                  </FormField>
                  {isWorker && (
                    <FormField label="Master Artisan" hint="Worker artisans belong to a master's cluster.">
                      <Select
                        options={masterOptions}
                        placeholder="Select master…"
                        value={f.masterArtisanId}
                        onChange={(e) => updateForm({ masterArtisanId: e.target.value })}
                      />
                    </FormField>
                  )}
                </Section>

                {/* Skills */}
                <Section title="Skills">
                  <FormField label="Craft Skills" hint="Linked from the Skills library.">
                    <MultiSelect
                      options={skillOptions}
                      value={f.skillIds}
                      onChange={(v) => updateForm({ skillIds: v.map(Number) })}
                      placeholder="Select skills…"
                    />
                  </FormField>
                  <FormField label="Expertise">
                    <TextInput
                      value={f.expertise}
                      onChange={(e) => updateForm({ expertise: e.target.value })}
                      placeholder="e.g. Jamdani fine-count weaving"
                    />
                  </FormField>
                  <FormField label="Experience (years)">
                    <TextInput
                      type="number"
                      min={0}
                      value={f.experience}
                      onChange={(e) => updateForm({ experience: e.target.value })}
                    />
                  </FormField>
                </Section>

                {/* Demographics */}
                <Section title="Personal & Demographic">
                  <FormField label="Gender">
                    <Select
                      options={GENDER_OPTIONS}
                      placeholder="Select…"
                      value={f.gender}
                      onChange={(e) => updateForm({ gender: e.target.value as Gender })}
                    />
                  </FormField>
                  <FormField label="Date of Birth">
                    <TextInput
                      type="date"
                      value={f.dob}
                      onChange={(e) => updateForm({ dob: e.target.value })}
                    />
                  </FormField>
                  <div className="flex items-center gap-6 pt-1">
                    <Toggle
                      checked={f.hasWhatsapp}
                      onChange={(v) => updateForm({ hasWhatsapp: v })}
                      label="Has WhatsApp"
                    />
                    <Toggle
                      checked={f.active}
                      onChange={(v) => updateForm({ active: v })}
                      label="Active"
                    />
                  </div>
                </Section>

                {/* Location */}
                <Section title="Location">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="State">
                      <TextInput value={f.state} onChange={(e) => updateForm({ state: e.target.value })} placeholder="West Bengal" />
                    </FormField>
                    <FormField label="District">
                      <TextInput value={f.district} onChange={(e) => updateForm({ district: e.target.value })} />
                    </FormField>
                    <FormField label="Village / Town">
                      <TextInput value={f.villageTown} onChange={(e) => updateForm({ villageTown: e.target.value })} />
                    </FormField>
                    <FormField label="Postal Code">
                      <TextInput value={f.postalCode} onChange={(e) => updateForm({ postalCode: e.target.value })} />
                    </FormField>
                  </div>
                </Section>

                {/* Bank */}
                <Section title="Bank & Finance">
                  <Toggle
                    checked={f.hasBankAccount}
                    onChange={(v) => updateForm({ hasBankAccount: v })}
                    label="Has bank account"
                  />
                  {f.hasBankAccount && (
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Bank Name">
                        <TextInput value={f.bankName} onChange={(e) => updateForm({ bankName: e.target.value })} />
                      </FormField>
                      <FormField label="Account Holder">
                        <TextInput value={f.accountHolderName} onChange={(e) => updateForm({ accountHolderName: e.target.value })} />
                      </FormField>
                      <FormField label="IFSC Code" className="col-span-2">
                        <TextInput value={f.ifscCode} onChange={(e) => updateForm({ ifscCode: e.target.value })} placeholder="SBIN0001234" />
                      </FormField>
                    </div>
                  )}
                </Section>
              </div>

              <div
                className="flex items-center justify-end gap-3 border-t px-5 py-3"
                style={{ borderColor: "#E8E4DE" }}
              >
                <Button variant="secondary" onClick={closeDrawer} size="sm">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setShowPayload(true)}
                  size="sm"
                  disabled={!f.name.trim() || !f.contactNumber.trim() || (isWorker && !f.masterArtisanId)}
                >
                  Validate →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Payload preview */}
        {showPayload && drawer && (
          <CatalogPayloadDrawer
            payload={buildPayload()}
            onClose={() => setShowPayload(false)}
            entityName="Artisan"
          />
        )}
      </div>
    </WeaveShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#A86120" }}>
        {title}
      </p>
      {children}
    </div>
  );
}
