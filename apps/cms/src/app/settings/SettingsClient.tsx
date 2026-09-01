"use client";

/**
 * SettingsClient — key/value store settings, read-only table + edit UI.
 *
 * Generic edit (2026-07-06, Phase 4): the drawer now saves for real — Save
 * POSTs PATCH /update/settings via /api/crud (sandbox Postgres only; the
 * backend server-bumps `version` itself, so the client never sends it).
 *
 * IMPACT_ASSUMPTIONS gets a SPECIALIZED editor (matching live's dedicated
 * impact-assumptions.component): 4 labeled numeric fields (CO2 saved/meter,
 * water saved/meter, women-artisan-work %, women-stitching-work %), the
 * current assumption version, and a "Publish version v{n+1}" button. The
 * backend (config-tail.service.ts updateSettings) validates non-negative
 * factors + 0..1 percentages and server-bumps assumptionVersion itself
 * (client value is ignored), so the client only ever sends the 4 raw fields.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, ExternalLink } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { Badge, Button, FormField, TextInput, Textarea, Toggle } from "@/components/ui";
import type { SettingRow } from "@/lib/admin-api";

function prettyName(name: string): string {
  return name
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function typeBadge(t: string) {
  const v =
    t === "NUMBER" ? "blue" : t === "BOOLEAN" ? "purple" : t === "OBJECT" ? "amber" : "stone";
  return <Badge variant={v as "blue" | "purple" | "amber" | "stone"}>{t}</Badge>;
}

function renderValue(s: SettingRow): React.ReactNode {
  if (s.attributeType === "BOOLEAN") {
    return (
      <Badge variant={s.attributeValue ? "green" : "stone"}>
        {s.attributeValue ? "Enabled" : "Disabled"}
      </Badge>
    );
  }
  if (s.attributeType === "OBJECT") {
    return (
      <span className="text-xs font-mono" style={{ color: "#847D77" }}>
        {`{ ${Object.keys((s.attributeValue ?? {}) as Record<string, unknown>).length} keys }`}
      </span>
    );
  }
  return (
    <span className="text-sm" style={{ color: "#1A1714" }}>
      {String(s.attributeValue ?? "—")}
    </span>
  );
}

interface ImpactAssumptions {
  assumptionVersion?: number;
  carbonDioxideSavedKgPerMeter?: number;
  waterSavedLitersPerMeter?: number;
  womenArtisanWorkPercentage?: number;
  womenStitchingWorkPercentage?: number;
  [k: string]: unknown;
}

interface DrawerState {
  setting: SettingRow;
  value: string;
  boolValue: boolean;
  link: string;
  impact: ImpactAssumptions;
}

interface SettingsClientProps {
  settings: SettingRow[];
}

async function crudWrite(path: string, method: string, body: unknown): Promise<{ success: boolean; message?: string }> {
  const res = await fetch("/api/crud", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, method, body }),
  });
  const j = await res.json().catch(() => ({}));
  const ok = res.ok && j?.success !== false;
  if (!ok) throw new Error(j?.message || `Save failed (${res.status})`);
  return j;
}

function isPercentage(v: unknown): boolean {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
}
function isNonNegative(v: unknown): boolean {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

export function SettingsClient({ settings }: SettingsClientProps) {
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();

  const isImpactAssumptions = (s: SettingRow) => s.attributeName === "IMPACT_ASSUMPTIONS";

  const openEdit = (s: SettingRow) => {
    const raw = (s.attributeValue ?? {}) as Record<string, unknown>;
    setDrawer({
      setting: s,
      value:
        s.attributeType === "OBJECT"
          ? JSON.stringify(s.attributeValue ?? {}, null, 2)
          : String(s.attributeValue ?? ""),
      boolValue: Boolean(s.attributeValue),
      link: s.attributeLink ?? "",
      impact: {
        assumptionVersion: Number(raw.assumptionVersion ?? 0),
        carbonDioxideSavedKgPerMeter: Number(raw.carbonDioxideSavedKgPerMeter ?? 0),
        waterSavedLitersPerMeter: Number(raw.waterSavedLitersPerMeter ?? 0),
        womenArtisanWorkPercentage: Number(raw.womenArtisanWorkPercentage ?? 0),
        womenStitchingWorkPercentage: Number(raw.womenStitchingWorkPercentage ?? 0),
      },
    });
    setSaveError(null);
  };

  const closeDrawer = () => {
    setDrawer(null);
    setSaveError(null);
  };

  const impactValid = (d: DrawerState) =>
    isNonNegative(d.impact.carbonDioxideSavedKgPerMeter) &&
    isNonNegative(d.impact.waterSavedLitersPerMeter) &&
    isPercentage(d.impact.womenArtisanWorkPercentage) &&
    isPercentage(d.impact.womenStitchingWorkPercentage);

  const doSave = async () => {
    if (!drawer) return;
    const s = drawer.setting;
    setSaving(true);
    setSaveError(null);
    try {
      if (isImpactAssumptions(s)) {
        if (!impactValid(drawer)) {
          throw new Error("CO2/water must be ≥ 0 and both percentages must be between 0 and 1.");
        }
        await crudWrite("update/settings", "PATCH", {
          id: s.id,
          attributeValue: {
            carbonDioxideSavedKgPerMeter: Number(drawer.impact.carbonDioxideSavedKgPerMeter),
            waterSavedLitersPerMeter: Number(drawer.impact.waterSavedLitersPerMeter),
            womenArtisanWorkPercentage: Number(drawer.impact.womenArtisanWorkPercentage),
            womenStitchingWorkPercentage: Number(drawer.impact.womenStitchingWorkPercentage),
          },
        });
      } else {
        let value: unknown;
        if (s.attributeType === "BOOLEAN") value = drawer.boolValue;
        else if (s.attributeType === "NUMBER") value = Number(drawer.value);
        else if (s.attributeType === "OBJECT") {
          try { value = JSON.parse(drawer.value); } catch { value = drawer.value; }
        } else value = drawer.value;

        await crudWrite("update/settings", "PATCH", {
          id: s.id,
          attributeValue: value,
          attributeLink: drawer.link,
        });
      }
      closeDrawer();
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
      <span>Operations</span>
      <span>/</span>
      <span className="font-medium" style={{ color: "#1A1714" }}>Settings</span>
    </div>
  );

  return (
    <WeaveShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-6 max-w-4xl">
        <div>
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
            Store Settings
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
            Global storefront configuration. Edits save to the sandbox test DB only (never live).
          </p>
        </div>

        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#E8E4DE" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #F3F1ED", background: "#FAF9F7" }}>
                {["Setting", "Type", "Value", "Link", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: "#847D77" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {settings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center text-sm" style={{ color: "#AAA39E" }}>
                    No settings found.
                  </td>
                </tr>
              ) : (
                settings.map((s, i) => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: i < settings.length - 1 ? "1px solid #F3F1ED" : undefined }}
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-medium" style={{ color: "#1A1714" }}>
                        {prettyName(s.attributeName)}
                      </span>
                      <div className="text-[11px] font-mono" style={{ color: "#AAA39E" }}>
                        {s.attributeName}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">{typeBadge(s.attributeType)}</td>
                    <td className="px-4 py-3.5 max-w-[280px] truncate">{renderValue(s)}</td>
                    <td className="px-4 py-3.5">
                      {s.attributeLink ? (
                        <a
                          href={s.attributeLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs hover:underline"
                          style={{ color: "#A86120" }}
                        >
                          Link <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs" style={{ color: "#D1CCC6" }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        title="Edit"
                        className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-stone-50"
                        style={{ borderColor: "#E8E4DE", color: "#635D58" }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Edit drawer */}
        {drawer && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <div className="absolute inset-0 bg-black/20" onClick={closeDrawer} />
            <div
              className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl border-l"
              style={{ borderColor: "#E8E4DE" }}
            >
              <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "#E8E4DE" }}>
                <h3 className="font-serif text-base font-semibold" style={{ color: "#1A1714" }}>
                  {isImpactAssumptions(drawer.setting)
                    ? `Impact Assumptions — v${drawer.impact.assumptionVersion}`
                    : `Edit ${prettyName(drawer.setting.attributeName)}`}
                </h3>
                <button onClick={closeDrawer} className="text-xl leading-none" style={{ color: "#847D77" }}>×</button>
              </div>

              <div className="px-5 pt-4">
                <div
                  className="rounded-lg border px-3 py-2 text-xs"
                  style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}
                >
                  Saves to the sandbox test DB only (never live).
                </div>
              </div>

              <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-4">
                {isImpactAssumptions(drawer.setting) ? (
                  <>
                    <p className="text-xs" style={{ color: "#847D77" }}>
                      Current version <strong>v{drawer.impact.assumptionVersion}</strong>. Publishing
                      increments the version automatically (server-controlled).
                    </p>
                    <FormField label="CO2 saved per meter (kg)" hint="Must be ≥ 0" required>
                      <TextInput
                        type="number" step="0.01" min={0}
                        value={drawer.impact.carbonDioxideSavedKgPerMeter}
                        onChange={(e) => setDrawer((d) => d && { ...d, impact: { ...d.impact, carbonDioxideSavedKgPerMeter: Number(e.target.value) } })}
                      />
                    </FormField>
                    <FormField label="Water saved per meter (L)" hint="Must be ≥ 0" required>
                      <TextInput
                        type="number" step="0.01" min={0}
                        value={drawer.impact.waterSavedLitersPerMeter}
                        onChange={(e) => setDrawer((d) => d && { ...d, impact: { ...d.impact, waterSavedLitersPerMeter: Number(e.target.value) } })}
                      />
                    </FormField>
                    <FormField label="Women artisan work %" hint="0 to 1 (e.g. 0.4 = 40%)" required>
                      <TextInput
                        type="number" step="0.01" min={0} max={1}
                        value={drawer.impact.womenArtisanWorkPercentage}
                        onChange={(e) => setDrawer((d) => d && { ...d, impact: { ...d.impact, womenArtisanWorkPercentage: Number(e.target.value) } })}
                      />
                    </FormField>
                    <FormField label="Women stitching work %" hint="0 to 1 (e.g. 0.4 = 40%)" required>
                      <TextInput
                        type="number" step="0.01" min={0} max={1}
                        value={drawer.impact.womenStitchingWorkPercentage}
                        onChange={(e) => setDrawer((d) => d && { ...d, impact: { ...d.impact, womenStitchingWorkPercentage: Number(e.target.value) } })}
                      />
                    </FormField>
                  </>
                ) : drawer.setting.attributeType === "BOOLEAN" ? (
                  <FormField label="Value">
                    <Toggle
                      checked={drawer.boolValue}
                      onChange={(v) => setDrawer((d) => (d ? { ...d, boolValue: v } : null))}
                      label={drawer.boolValue ? "Enabled" : "Disabled"}
                    />
                  </FormField>
                ) : drawer.setting.attributeType === "NUMBER" ? (
                  <FormField label="Value" hint="Numeric value">
                    <TextInput
                      type="number"
                      value={drawer.value}
                      onChange={(e) => setDrawer((d) => (d ? { ...d, value: e.target.value } : null))}
                      autoFocus
                    />
                  </FormField>
                ) : drawer.setting.attributeType === "OBJECT" ? (
                  <FormField label="Value (JSON)" hint="Edit the raw JSON object">
                    <Textarea
                      value={drawer.value}
                      onChange={(e) => setDrawer((d) => (d ? { ...d, value: e.target.value } : null))}
                      rows={10}
                      className="font-mono text-xs"
                    />
                  </FormField>
                ) : (
                  <FormField label="Value">
                    <Textarea
                      value={drawer.value}
                      onChange={(e) => setDrawer((d) => (d ? { ...d, value: e.target.value } : null))}
                      rows={3}
                      autoFocus
                    />
                  </FormField>
                )}

                {!isImpactAssumptions(drawer.setting) && (
                  <FormField label="Link" hint="Optional URL associated with this setting">
                    <TextInput
                      value={drawer.link}
                      onChange={(e) => setDrawer((d) => (d ? { ...d, link: e.target.value } : null))}
                      placeholder="https://anuprerna.com/…"
                    />
                  </FormField>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t px-5 py-3" style={{ borderColor: "#E8E4DE" }}>
                <Button variant="secondary" onClick={closeDrawer} size="sm">Cancel</Button>
                {saveError && <span className="text-xs mr-2" style={{ color: "#B91C1C" }}>{saveError}</span>}
                <Button variant="primary" onClick={doSave} size="sm" disabled={saving}>
                  {saving
                    ? "Saving…"
                    : isImpactAssumptions(drawer.setting)
                      ? `Publish version v${drawer.impact.assumptionVersion! + 1}`
                      : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WeaveShell>
  );
}
