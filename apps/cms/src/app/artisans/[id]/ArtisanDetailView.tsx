"use client";

/**
 * ArtisanDetailView — read-only artisan profile.
 *
 * Faithful port of the live Angular artisan-detail card grid: Basic Information,
 * Personal & Demographic, Location Details, Craft Details, Skills, Bank & Finance,
 * and the relational card (Workers for a master / Master for a worker).
 *
 * Read-only: the live "Edit Artisan" button is replaced by a disabled Read-only
 * badge. Bank fields (bank name / account holder / IFSC) are shown in FULL —
 * matching the live component, which never renders the raw account number at all
 * (no masking is required because the account number is never displayed).
 */

import React from "react";
import Link from "next/link";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { Card, CardHeader, CardTitle, Badge } from "@/components/ui";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import type { ArtisanRow, Gender } from "@/types/artisan";
import type { ArtisanDetail } from "@/lib/artisans-api";
import type { Result } from "@/lib/result";
import {
  User,
  UserRound,
  MapPin,
  Hammer,
  Landmark,
  Users,
  UserCog,
  BookOpen,
} from "lucide-react";

// Mutations are unavailable in the sandbox — this replaces the live "Edit
// Artisan" control. Copied locally per the read-only contract.
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

// ── helpers ──────────────────────────────────────────────────────────────────

// Mirrors the live `formatDate` (en-US long date + time); dob/0 -> "Not
// specified". Asia/Kolkata is pinned for deterministic SSR output.
function formatDateTime(ts: number): string {
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

// Live getGenderLabel: MALE/FEMALE/OTHER -> label; anything else -> "Not specified".
function genderLabel(g: Gender): string {
  switch (g) {
    case "MALE": return "Male";
    case "FEMALE": return "Female";
    case "OTHER": return "Other";
    default: return "Not specified";
  }
}

function roleLabel(role: string): string {
  return role === "MASTER" ? "Master Artisan" : "Worker Artisan";
}

// ── layout atoms ─────────────────────────────────────────────────────────────

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <span style={{ color: "#A86120" }}>{icon}</span>
            {title}
          </span>
        </CardTitle>
      </CardHeader>
      {children}
    </Card>
  );
}

// Live "label ... value" two-column row.
function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-2.5 border-b last:border-b-0"
      style={{ borderColor: "#F3F1ED" }}
    >
      <span
        className="text-[13px] font-semibold min-w-[130px]"
        style={{ color: "#847D77" }}
      >
        {label}
      </span>
      <span className="text-sm text-right flex-1" style={{ color: "#1A1714" }}>
        {value ?? "Not specified"}
      </span>
    </div>
  );
}

// ── main ─────────────────────────────────────────────────────────────────────

interface ArtisanDetailViewProps {
  artisan: ArtisanDetail;
  workers?: Result<ArtisanRow[]>;
  master?: Result<ArtisanDetail | null>;
}

export function ArtisanDetailView({ artisan, workers, master }: ArtisanDetailViewProps) {
  const isMaster = artisan.artisanRole === "MASTER";
  const isWorker = artisan.artisanRole === "WORKER";
  const workerCount = workers?.ok ? workers.data.length : 0;

  return (
    <WeaveShell
      breadcrumb={
        <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
          <span>Relationships</span>
          <span>/</span>
          <Link href="/artisans" style={{ color: "#847D77" }}>Artisans</Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>
            {artisan.name || `#${artisan.id}`}
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1
              className="flex items-center gap-3 font-serif text-2xl font-semibold"
              style={{ color: "#1A1714" }}
            >
              <User className="h-6 w-6" style={{ color: "#A86120" }} />
              {artisan.name || `Artisan #${artisan.id}`}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={isMaster ? "purple" : "blue"}>
                {roleLabel(artisan.artisanRole)}
              </Badge>
              <Badge variant={artisan.active ? "green" : "stone"}>
                {artisan.active ? "Active" : "Inactive"}
              </Badge>
              <span className="text-xs" style={{ color: "#AAA39E" }}>#{artisan.id}</span>
            </div>
          </div>
          <ReadOnlyBadge />
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <InfoCard icon={<User className="h-4 w-4" />} title="Basic Information">
            <div className="flex flex-col">
              <Row label="Name" value={artisan.name || "Not specified"} />
              <Row label="Contact Number" value={artisan.contactNumber || "Not specified"} />
              <Row label="Role" value={roleLabel(artisan.artisanRole)} />
              <Row label="Status" value={artisan.active ? "Active" : "Inactive"} />
              <Row label="Created" value={formatDateTime(artisan.timeOfCreation)} />
              <Row label="Last Updated" value={formatDateTime(artisan.lastUpdateTime)} />
            </div>
          </InfoCard>

          {/* Personal & Demographic */}
          <InfoCard icon={<UserRound className="h-4 w-4" />} title="Personal & Demographic">
            <div className="flex flex-col">
              <Row label="Gender" value={genderLabel(artisan.gender)} />
              <Row label="Date of Birth" value={formatDateTime(artisan.dob)} />
              <Row label="Has WhatsApp" value={artisan.hasWhatsapp ? "Yes" : "No"} />
            </div>
          </InfoCard>

          {/* Location Details */}
          <InfoCard icon={<MapPin className="h-4 w-4" />} title="Location Details">
            <div className="flex flex-col">
              <Row label="State" value={artisan.state || "Not specified"} />
              <Row label="District" value={artisan.district || "Not specified"} />
              <Row label="Village / Town" value={artisan.villageTown || "Not specified"} />
              <Row label="Postal Code" value={artisan.postalCode || "Not specified"} />
            </div>
          </InfoCard>

          {/* Craft Details */}
          <InfoCard icon={<Hammer className="h-4 w-4" />} title="Craft Details">
            <div className="flex flex-col">
              <Row label="Craft Expertise" value={artisan.expertise || "Not specified"} />
              <Row label="Years of Experience" value={`${artisan.experience || 0} years`} />
              <Row label="Catalogs" value={artisan.catalogCount} />
              {isMaster && <Row label="Artisans Managed" value={workerCount} />}
            </div>
          </InfoCard>

          {/* Skills */}
          <InfoCard icon={<BookOpen className="h-4 w-4" />} title="Skills">
            {artisan.skills.length ? (
              <div className="flex flex-wrap gap-1.5">
                {artisan.skills.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ background: "#FFF8F0", color: "#8A4C19" }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "#AAA39E" }}>No skills linked.</p>
            )}
          </InfoCard>

          {/* Bank & Finance — full values, no account number (matches live) */}
          <InfoCard icon={<Landmark className="h-4 w-4" />} title="Bank & Finance">
            <div className="flex flex-col">
              <Row label="Has Bank Account" value={artisan.hasBankAccount ? "Yes" : "No"} />
              {artisan.hasBankAccount && (
                <>
                  <Row label="Bank Name" value={artisan.bankName || "Not specified"} />
                  <Row label="Account Holder" value={artisan.accountHolderName || "Not specified"} />
                  <Row label="IFSC Code" value={artisan.ifscCode || "Not specified"} />
                </>
              )}
            </div>
          </InfoCard>

          {/* Master Artisan (for workers) */}
          {isWorker && (
            <InfoCard icon={<UserCog className="h-4 w-4" />} title="Master Artisan">
              {master && !master.ok ? (
                <ErrorBanner message={master.error} />
              ) : master?.data ? (
                <div className="flex flex-col">
                  <Row
                    label="Name"
                    value={
                      <Link
                        href={`/artisans/${master.data.id}`}
                        className="hover:underline"
                        style={{ color: "#A86120" }}
                      >
                        {master.data.name || "Not specified"}
                      </Link>
                    }
                  />
                  <Row label="Contact Number" value={master.data.contactNumber || "Not specified"} />
                  <Row label="Status" value={master.data.active ? "Active" : "Inactive"} />
                </div>
              ) : (
                <p className="text-sm" style={{ color: "#AAA39E" }}>
                  No master artisan assigned.
                </p>
              )}
            </InfoCard>
          )}

          {/* Workers (for masters) */}
          {isMaster && (
            <InfoCard
              icon={<Users className="h-4 w-4" />}
              title={`Workers (${workerCount})`}
            >
              {workers && !workers.ok ? (
                <ErrorBanner message={workers.error} />
              ) : workerCount > 0 ? (
                <div className="flex flex-col">
                  {workers!.data.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between gap-4 py-2.5 border-b last:border-b-0"
                      style={{ borderColor: "#F3F1ED" }}
                    >
                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/artisans/${w.id}`}
                          className="text-sm font-medium hover:underline truncate"
                          style={{ color: "#1A1714" }}
                        >
                          {w.name || `Artisan #${w.id}`}
                        </Link>
                        <span className="text-xs" style={{ color: "#847D77" }}>
                          {w.contactNumber || "no contact"}
                        </span>
                      </div>
                      <Badge variant={w.active ? "green" : "stone"}>
                        {w.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                  <Users className="h-8 w-8" style={{ color: "#D1CCC6" }} />
                  <p className="text-sm" style={{ color: "#AAA39E" }}>
                    No workers assigned to this master artisan.
                  </p>
                </div>
              )}
            </InfoCard>
          )}
        </div>

        {/* Write actions deferred */}
        <div
          className="rounded-xl border px-5 py-4 text-sm"
          style={{ background: "#FAF9F7", borderColor: "#E8E4DE", color: "#635D58" }}
        >
          <strong style={{ color: "#302C28" }}>Actions deferred to cutover</strong> — Editing an
          artisan, managing skills, and recording payments will be enabled when Weave goes live.
          They are intentionally disabled in this sandbox.
        </div>
      </div>
    </WeaveShell>
  );
}
