import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import { getStoryList, getBlogList, getFaqList } from "@/lib/content-api";
import { loadOrBanner } from "@/lib/load-or-banner";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function ContentPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = await getBackendCallToken(cookieToken);

  return loadOrBanner(
    () =>
      Promise.all([getStoryList(token), getBlogList(token), getFaqList(token)]),
    ([stories, blogs, faqs]) => (
    <WeaveShell
      breadcrumb={
        <div
          className="flex items-center gap-2 text-sm"
          style={{ color: "#847D77" }}
        >
          <span className="font-medium" style={{ color: "#1A1714" }}>
            Content
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1
            className="font-serif text-2xl font-semibold"
            style={{ color: "#1A1714" }}
          >
            Content
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
            Manage stories, blog articles, and FAQs published on the storefront.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
          {/* Stories card */}
          <Link
            href="/content/stories"
            className="flex flex-col gap-3 rounded-xl border bg-white p-5 transition-shadow hover:shadow-md"
            style={{
              borderColor: "#E8E4DE",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="font-serif text-2xl font-bold"
                style={{ color: "#A86120" }}
              >
                {stories.length}
              </span>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: "#FEF3E2", color: "#A86120" }}
              >
                Stories
              </span>
            </div>
            <div>
              <h2
                className="font-serif text-lg font-semibold"
                style={{ color: "#1A1714" }}
              >
                Stories
              </h2>
              <p className="mt-0.5 text-sm" style={{ color: "#847D77" }}>
                Manage story articles and categories
              </p>
            </div>
            <span className="text-sm font-medium" style={{ color: "#A86120" }}>
              Manage →
            </span>
          </Link>

          {/* Blogs card */}
          <Link
            href="/content/blogs"
            className="flex flex-col gap-3 rounded-xl border bg-white p-5 transition-shadow hover:shadow-md"
            style={{
              borderColor: "#E8E4DE",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="font-serif text-2xl font-bold"
                style={{ color: "#0369A1" }}
              >
                {blogs.length}
              </span>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: "#F0F9FF", color: "#0369A1" }}
              >
                Blogs
              </span>
            </div>
            <div>
              <h2
                className="font-serif text-lg font-semibold"
                style={{ color: "#1A1714" }}
              >
                Blogs
              </h2>
              <p className="mt-0.5 text-sm" style={{ color: "#847D77" }}>
                Manage blog articles, types, and categories
              </p>
            </div>
            <span className="text-sm font-medium" style={{ color: "#0369A1" }}>
              Manage →
            </span>
          </Link>

          {/* FAQs card (read-only) */}
          <Link
            href="/content/faqs"
            className="flex flex-col gap-3 rounded-xl border bg-white p-5 transition-shadow hover:shadow-md"
            style={{
              borderColor: "#E8E4DE",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="font-serif text-2xl font-bold"
                style={{ color: "#047857" }}
              >
                {faqs.length}
              </span>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: "#ECFDF5", color: "#047857" }}
              >
                FAQs
              </span>
            </div>
            <div>
              <h2
                className="font-serif text-lg font-semibold"
                style={{ color: "#1A1714" }}
              >
                FAQs
              </h2>
              <p className="mt-0.5 text-sm" style={{ color: "#847D77" }}>
                Browse FAQ sets and questions (read-only)
              </p>
            </div>
            <span className="text-sm font-medium" style={{ color: "#047857" }}>
              View →
            </span>
          </Link>
        </div>

      </div>
    </WeaveShell>
    ),
  );
}
