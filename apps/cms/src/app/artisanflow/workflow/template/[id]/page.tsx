/**
 * /artisanflow/workflow/template/[id] -- workflow TEMPLATE, stage view.
 *
 * Read-only render of the reusable production flow as a vertical stack of STAGE
 * cards (one per stage). Links to the progressive builder at ./edit.
 */

import Link from "next/link";
import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import { getWorkflowTemplate, BackendFetchError } from "@/lib/artisanflow-api";
import { ArtisanFlowShell } from "@/components/artisanflow/ArtisanFlowShell";
import { StageCard } from "@/components/artisanflow/StageCard";
import { TemplateDeleteButton } from "@/components/artisanflow/TemplateDeleteButton";
import { deriveStage, totalDays, type RawStep } from "@/components/artisanflow/stages";
import { Button, Card, KpiStrip } from "@/components/ui";
import type { KpiItem } from "@/components/ui";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Layers, Pencil, Clock, ListChecks, Package } from "lucide-react";

export const dynamic = "force-dynamic";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

interface PageProps { params: Promise<{ id: string }>; }

export default async function TemplateDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = Number(id);
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? (await getServiceToken());
  let tpl: Awaited<ReturnType<typeof getWorkflowTemplate>> = null;
  let fetchError: BackendFetchError | null = null;
  if (Number.isInteger(numericId)) {
    try {
      tpl = await getWorkflowTemplate(numericId, token);
    } catch (e) {
      if (e instanceof BackendFetchError) fetchError = e;
      else throw e;
    }
  }

  if (fetchError) {
    return (
      <ArtisanFlowShell parentCrumb={{ label: "Job Templates", href: "/artisanflow/workflow" }} crumb={`Template #${id}`}>
        <div className="flex flex-col gap-4 max-w-xl">
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Can&apos;t load template</h1>
          <ErrorBanner message={fetchError.message} />
          <Link href="/artisanflow/workflow"><Button variant="secondary" size="sm">← Back to Job Templates</Button></Link>
        </div>
      </ArtisanFlowShell>
    );
  }
  if (!tpl) {
    return (
      <ArtisanFlowShell parentCrumb={{ label: "Job Templates", href: "/artisanflow/workflow" }} crumb={`Template #${id}`}>
        <div className="flex flex-col gap-4 max-w-xl">
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Template not found</h1>
          <Link href="/artisanflow/workflow"><Button variant="secondary" size="sm">← Back to Job Templates</Button></Link>
        </div>
      </ArtisanFlowShell>
    );
  }

  const rawSteps = (tpl.steps || []).filter((s) => !s.deleted);
  const stages = rawSteps.map((s, i) => deriveStage(s as RawStep, i));
  const days = totalDays(stages);

  const kpis: KpiItem[] = [
    { label: "Stages", value: stages.length, icon: <ListChecks className="h-4 w-4" /> },
    { label: "Total time", value: `${days} days`, icon: <Clock className="h-4 w-4" /> },
    { label: "Type", value: tpl.productAssociated ? "Product-linked" : "Generic", icon: <Package className="h-4 w-4" /> },
  ];

  return (
    <ArtisanFlowShell parentCrumb={{ label: "Job Templates", href: "/artisanflow/workflow" }} crumb={tpl.name}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "#FEF3E2", color: "#A86120" }}>
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>{tpl.name}</h1>
              {tpl.description && <p className="mt-1 text-sm" style={{ color: "#847D77" }}>{tpl.description}</p>}
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {/* No env flag: the button guards itself on the sandbox floor and
                /api/crud enforces the same band server-side. Loom-derived
                (sub-floor) templates render it disabled with the refusal reason. */}
            <TemplateDeleteButton templateId={tpl.id} templateName={tpl.name} />
            <Link href={`/artisanflow/workflow/template/${tpl.id}/edit`}>
              <Button variant="primary" size="md"><Pencil className="h-4 w-4" /> Edit template</Button>
            </Link>
          </div>
        </div>

        <KpiStrip items={kpis} />

        {/* Stage stack */}
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#847D77" }}>
            Stages — top to bottom
          </p>
          {stages.length === 0 ? (
            <Card padding="md">
              <p className="py-8 text-center text-sm" style={{ color: "#AAA39E" }}>No stages defined for this template.</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {stages.map((s, i) => (
                <StageCard key={s.id} stage={s} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ArtisanFlowShell>
  );
}
