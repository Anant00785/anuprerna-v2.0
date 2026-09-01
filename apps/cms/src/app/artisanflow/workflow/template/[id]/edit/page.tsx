/**
 * /artisanflow/workflow/template/[id]/edit — progressive template BUILDER.
 *
 * Loads the template's current steps as starting recipe cards, then hands off to
 * the client builder. Save writes for real (PATCH /update/workflow-template via
 * /api/crud, sandbox pg only) -- the edited steps persist and re-render here on
 * reopen.
 */

import Link from "next/link";
import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import { getWorkflowTemplate, getWorkflowTemplateList, BackendFetchError } from "@/lib/artisanflow-api";
import { ArtisanFlowShell } from "@/components/artisanflow/ArtisanFlowShell";
import { TemplateBuilder } from "@/components/artisanflow/TemplateBuilder";
import { deriveStage, type RawStep } from "@/components/artisanflow/stages";
import { Button } from "@/components/ui";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

export const dynamic = "force-dynamic";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

interface PageProps { params: Promise<{ id: string }>; }

export default async function TemplateEditPage({ params }: PageProps) {
  const { id } = await params;
  const numericId = Number(id);
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? (await getServiceToken());

  let tpl: Awaited<ReturnType<typeof getWorkflowTemplate>> = null;
  let list: Awaited<ReturnType<typeof getWorkflowTemplateList>> = [];
  let fetchError: BackendFetchError | null = null;
  try {
    [tpl, list] = await Promise.all([
      Number.isInteger(numericId) ? getWorkflowTemplate(numericId, token) : Promise.resolve(null),
      getWorkflowTemplateList(token),
    ]);
  } catch (e) {
    if (e instanceof BackendFetchError) fetchError = e;
    else throw e;
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

  const stages = (tpl.steps || []).filter((s) => !s.deleted).map((s, i) => deriveStage(s as RawStep, i));
  const templates = list.map((t) => ({ id: t.id, name: t.name }));

  return (
    <ArtisanFlowShell parentCrumb={{ label: "Job Templates", href: "/artisanflow/workflow" }} crumb={`Edit · ${tpl.name}`}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Edit template</h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>Add and shape stages one at a time. Saves to the sandbox for real.</p>
          </div>
          <Link href={`/artisanflow/workflow/template/${tpl.id}`} className="flex-shrink-0">
            <Button variant="secondary" size="sm">← View</Button>
          </Link>
        </div>
        <TemplateBuilder
          initialName={tpl.name}
          initialDescription={tpl.description || ""}
          initialStages={stages}
          templates={templates}
          templateId={tpl.id}
        />
      </div>
    </ArtisanFlowShell>
  );
}
