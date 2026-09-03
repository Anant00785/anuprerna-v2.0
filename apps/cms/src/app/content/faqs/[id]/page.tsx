import React from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Badge } from "@/components/ui";
import { getFaqById } from "@/lib/content-api";
import { BackendFetchError } from "@/lib/backend-fetch-error";
import { getServiceToken } from "@/lib/loom-service-token";
import { FaqDetailActions } from "./FaqDetailActions";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

function formatDate(epochMs: number): string {
  if (!epochMs) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(epochMs));
}

export default async function FAQDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!id || isNaN(numId) || numId <= 0) notFound();

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? (await getServiceToken());

  // getFaqById now throws on a backend refusal/outage instead of returning
  // null, so the two cases stay distinct: null still means "no such FAQ"
  // (404), a throw means "we could not ask" (banner naming the reason).
  let faq: Awaited<ReturnType<typeof getFaqById>>;
  try {
    faq = await getFaqById(numId, token);
  } catch (e) {
    if (!(e instanceof BackendFetchError)) throw e;
    return (
      <WeaveShell>
        <ErrorBanner message={e.message} />
      </WeaveShell>
    );
  }
  if (!faq) notFound();

  return (
    <WeaveShell
      breadcrumb={
        <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
          <Link href="/content" className="hover:underline">Content</Link>
          <span>/</span>
          <Link href="/content/faqs" className="hover:underline">FAQs</Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>
            #{faq.id}
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
              {faq.heading || "(no heading)"}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm" style={{ color: "#847D77" }}>
              <span>ID: {faq.id}</span>
              <span>Created: {formatDate(faq.timeOfCreation)}</span>
              {faq.storyContentId && (
                <Badge variant="blue">Story #{faq.storyContentId}</Badge>
              )}
              {faq.blogContentId && (
                <Badge variant="purple">Blog #{faq.blogContentId}</Badge>
              )}
            </div>
          </div>
          <FaqDetailActions faq={faq} />
        </div>

        {/* Questions */}
        <div>
          <div
            className="mb-3 flex items-center justify-between"
          >
            <h2 className="font-serif text-lg font-semibold" style={{ color: "#1A1714" }}>
              Questions
              <Badge variant="stone" className="ml-2">{faq.faqQuestionList.length}</Badge>
            </h2>
          </div>

          {faq.faqQuestionList.length === 0 ? (
            <ErrorBanner message="This FAQ group has no questions." />
          ) : (
            <div className="flex flex-col gap-3">
              {faq.faqQuestionList.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-xl border bg-white p-5"
                  style={{
                    borderColor: "#E8E4DE",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                      style={{ background: "#FEF3E2", color: "#A86120" }}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex flex-col gap-2 flex-1">
                      <p className="text-sm font-semibold" style={{ color: "#1A1714" }}>
                        {q.question}
                      </p>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: "#635D58" }}>
                        {q.answer}
                      </p>
                      <p className="text-xs" style={{ color: "#AAA39E" }}>
                        ID: {q.id} &middot; Created: {formatDate(q.timeOfCreation)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back link */}
        <div>
          <Link
            href="/content/faqs"
            className="text-sm font-medium"
            style={{ color: "#A86120" }}
          >
            &larr; Back to FAQs
          </Link>
        </div>
      </div>
    </WeaveShell>
  );
}
