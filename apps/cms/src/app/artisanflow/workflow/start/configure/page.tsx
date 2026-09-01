/**
 * /artisanflow/workflow/start/configure — review & create a job.
 *
 * Reached from the per-order-ITEM "Start production" trigger (the only way in
 * since the standalone order picker was removed) after template/name/date are
 * picked. Loads the chosen template's steps as
 * starting stage cards (same shape a template edit sees) and hands off to
 * TemplateBuilder in job mode — day counts/steps are editable for this run
 * only; "Create job" POSTs /add/workflow and the template itself is untouched.
 */

import Link from "next/link";
import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import { getWorkflowTemplate, BackendFetchError } from "@/lib/artisanflow-api";
import { ArtisanFlowShell } from "@/components/artisanflow/ArtisanFlowShell";
import { TemplateBuilder } from "@/components/artisanflow/TemplateBuilder";
import { deriveStage, type RawStep } from "@/components/artisanflow/stages";
import { Button } from "@/components/ui";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

export const dynamic = "force-dynamic";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function ConfigureJobPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const templateId = Number(one(sp.templateId));
  const name = one(sp.name);
  const productId = one(sp.productId) ? Number(one(sp.productId)) : undefined;
  const productName = one(sp.productName);
  const orderId = one(sp.orderId) ? Number(one(sp.orderId)) : undefined;
  const orderLabel = one(sp.orderLabel);
  const description = one(sp.description);
  const estimatedStartDate = one(sp.estimatedStartDate);
  const orderKind = one(sp.orderKind) === "order" || one(sp.orderKind) === "custom-order" ? (one(sp.orderKind) as "order" | "custom-order") : undefined;
  const orderItemId = one(sp.orderItemId) ? Number(one(sp.orderItemId)) : undefined;
  // Quantity is CONTEXT, not payload: POST /add/workflow has no quantity field
  // (the amount lives on the order item the job references, and duplicating it
  // onto the job would create a second number that can silently disagree). It
  // is shown here so the operator reviewing the stages can see how big this run
  // is before creating it.
  const quantityRaw = one(sp.quantity);
  const quantity = quantityRaw && Number.isFinite(Number(quantityRaw)) ? Number(quantityRaw) : undefined;
  const unit = one(sp.unit);

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? (await getServiceToken());

  let tpl: Awaited<ReturnType<typeof getWorkflowTemplate>> = null;
  let fetchError: BackendFetchError | null = null;
  try {
    tpl = Number.isInteger(templateId) ? await getWorkflowTemplate(templateId, token) : null;
  } catch (e) {
    if (e instanceof BackendFetchError) fetchError = e;
    else throw e;
  }

  if (fetchError) {
    return (
      <ArtisanFlowShell parentCrumb={{ label: "Job Templates", href: "/artisanflow/workflow" }} crumb="Review Job">
        <div className="flex max-w-xl flex-col gap-4">
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Can&apos;t load template</h1>
          <ErrorBanner message={fetchError.message} />
          <Link href="/artisanflow/workflow"><Button variant="secondary" size="sm">← Back to Job Templates</Button></Link>
        </div>
      </ArtisanFlowShell>
    );
  }
  if (!tpl || !name) {
    return (
      <ArtisanFlowShell parentCrumb={{ label: "Job Templates", href: "/artisanflow/workflow" }} crumb="Review Job">
        <div className="flex max-w-xl flex-col gap-4">
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Missing job details</h1>
          <p className="text-sm" style={{ color: "#847D77" }}>
            Start again — the template and job name are both required.
          </p>
          <Link href="/artisanflow/workflow"><Button variant="secondary" size="sm">← Back to Job Templates</Button></Link>
        </div>
      </ArtisanFlowShell>
    );
  }

  const stages = (tpl.steps || []).filter((s) => !s.deleted).map((s, i) => deriveStage(s as RawStep, i));

  return (
    <ArtisanFlowShell parentCrumb={{ label: "Job Templates", href: "/artisanflow/workflow" }} crumb="Review Job">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Review Job</h1>
          <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
            Review stages inherited from the template, adjust anything for this run, then create it.
          </p>
          {(orderItemId != null || quantity != null) && (
            <p className="mt-1 text-sm" style={{ color: "#635D58" }}>
              For{" "}
              {orderLabel ? <strong style={{ color: "#1A1714" }}>{orderLabel}</strong> : <strong style={{ color: "#1A1714" }}>this order</strong>}
              {orderItemId != null && <> · line #{orderItemId}</>}
              {quantity != null && (
                <> · <strong style={{ color: "#1A1714" }}>{quantity}{unit ? ` ${unit}` : ""}</strong> ordered</>
              )}
            </p>
          )}
        </div>
        <TemplateBuilder
          initialName={name}
          initialDescription={description}
          initialEstimatedStartDate={estimatedStartDate || undefined}
          initialStages={stages}
          templates={[]}
          jobMeta={{
            workflowTemplateId: tpl.id,
            workflowTemplateName: tpl.name,
            productId,
            productName: productName || (productId ? `product #${productId}` : "this item"),
            orderId,
            orderLabel: orderLabel || undefined,
            orderKind,
            orderItemId,
          }}
        />
      </div>
    </ArtisanFlowShell>
  );
}
