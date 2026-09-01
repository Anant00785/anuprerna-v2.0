"use client";

/**
 * Page-Feedback widget for Weave (mirrors the assistance-app FeedbackWidget,
 * adapted to Weave's design tokens + the NestJS sandbox REST feedback API).
 *
 * - Floating launcher -> right slide-out panel titled "Page Feedback".
 * - Textarea + paste/drop image zone (max 2, downscaled base64 data-URLs).
 * - Below: this route's pending feedback, newest first, with thumbnails
 *   (lightbox), relative timestamps, and status.
 * - Owner (amit@anuprerna.com) / submitter can mark-done / confirm / edit /
 *   delete; other users can only edit/delete their OWN items.
 * - Logged-in only: renders nothing until /api/auth/me returns authenticated.
 *
 * All backend traffic goes through same-origin Next proxy routes
 * (/api/feedback, /api/feedback/:id) which inject identity server-side —
 * this matches Weave's existing "client calls /api/* routes" pattern.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X } from "lucide-react";
import { displayName } from "@/lib/feedback-classify";

type Status = "pending" | "claude_done" | "resolved";

interface FeedbackRow {
  id: string;
  route: string;
  pageLabel?: string;
  text: string;
  images: string[];
  submitterName: string | null;
  submitterEmail: string | null;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

interface Me {
  authenticated: boolean;
  email: string;
  name: string;
  isOwner: boolean;
}

function relTime(iso: string): string {
  const ts = new Date(iso).getTime();
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.floor(h / 24);
  if (d < 30) return d + "d ago";
  return new Date(ts).toLocaleDateString();
}

/** Status color config — drives per-card badge and FAB badge */
function statusConfig(status: Status): { dot: string; label: string; badge: string } {
  if (status === "pending") {
    return {
      dot: "bg-red-500",
      label: "Pending",
      badge: "text-red-600 bg-red-100 border border-red-300",
    };
  }
  if (status === "claude_done") {
    return {
      dot: "bg-amber-500",
      label: "Fixed — confirm",
      badge: "text-amber-600 bg-amber-100 border border-amber-300",
    };
  }
  return {
    dot: "bg-emerald-500",
    label: "Resolved",
    badge: "text-emerald-600 bg-emerald-100 border border-emerald-300",
  };
}

// Read a File, downscale (longest side <= 1200px) and re-encode as a small
// JPEG data-URL so the base64 stays well under the sandbox row budget.
async function fileToDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  return await new Promise<string>((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        const s = Math.min(MAX / width, MAX / height);
        width = Math.round(width * s);
        height = Math.round(height * s);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(raw);
      ctx.drawImage(img, 0, 0, width, height);
      try {
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      } catch {
        resolve(raw);
      }
    };
    img.onerror = () => resolve(raw);
    img.src = raw;
  });
}

export default function PageFeedbackWidget() {
  const pathname = usePathname() || "/";
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FeedbackRow[] | null>(null);
  const [text, setText] = useState("");
  const [imgs, setImgs] = useState<string[]>([]); // pending new images (data-URLs)
  const [editKeep, setEditKeep] = useState<string[]>([]); // existing images kept while editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [openCount, setOpenCount] = useState(0);
  const [pendingOpenCount, setPendingOpenCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const email = (me?.email || "").toLowerCase();
  const isOwner = !!me?.isOwner;

  const pageLabel = useMemo(() => {
    if (typeof document !== "undefined" && document.title) return document.title;
    return pathname;
  }, [pathname]);

  const fetchCount = useCallback(async () => {
    try {
      const r = await fetch(`/api/feedback?route=${encodeURIComponent(pathname)}`, {
        cache: "no-store",
      });
      const d = (await r.json()) as { feedback: FeedbackRow[] };
      const allItems = d.feedback ?? [];
      setOpenCount(allItems.filter((it) => it.status !== "resolved").length);
      setPendingOpenCount(allItems.filter((it) => it.status === "pending").length);
    } catch {
      /* ignore */
    }
  }, [pathname]);

  // Identity gate — only render for logged-in users.
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: Me) => {
        if (alive) setMe(d);
      })
      .catch(() => {
        if (alive) setMe({ authenticated: false, email: "", name: "", isOwner: false });
      });
    return () => {
      alive = false;
    };
  }, [pathname]);

  const load = useCallback(async () => {
    setItems(null);
    try {
      const r = await fetch(`/api/feedback?route=${encodeURIComponent(pathname)}`, {
        cache: "no-store",
      });
      const d = (await r.json()) as { feedback: FeedbackRow[]; me: Me };
      if (d.me) setMe(d.me);
      const feedbackItems = d.feedback ?? [];
      setItems(feedbackItems);
      setOpenCount(feedbackItems.filter((it) => it.status !== "resolved").length);
      setPendingOpenCount(feedbackItems.filter((it) => it.status === "pending").length);
    } catch {
      setItems([]);
    }
  }, [pathname]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // Fetch open count on mount and route change (drives the launcher badge).
  useEffect(() => {
    if (!me?.authenticated) return;
    void fetchCount();
  }, [me?.authenticated, fetchCount]);

  // Escape closes the lightbox.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  async function addFiles(files: File[] | FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const room = Math.max(0, 2 - (imgs.length + editKeep.length));
    const picked = incoming.slice(0, room);
    const urls = await Promise.all(picked.map(fileToDataUrl));
    setImgs((cur) => [...cur, ...urls].slice(0, 2));
  }

  function removePending(idx: number) {
    setImgs((cur) => cur.filter((_, i) => i !== idx));
  }

  function resetForm() {
    setImgs([]);
    setText("");
    setEditingId(null);
    setEditKeep([]);
  }

  async function submit() {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const images = [...editKeep, ...imgs].slice(0, 2);
      if (editingId) {
        const r = await fetch(`/api/feedback/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim(), images }),
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed");
      } else {
        const r = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ route: pathname, pageLabel, text: text.trim(), images }),
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed");
      }
      resetForm();
      await load();
    } catch (e) {
      alert("Could not save feedback: " + (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function patchStatus(id: string, status: Status) {
    try {
      const r = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed");
      await load();
    } catch (e) {
      alert("Could not update: " + (e as Error).message);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this feedback?")) return;
    try {
      const r = await fetch(`/api/feedback/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed");
      await load();
    } catch (e) {
      alert("Could not delete: " + (e as Error).message);
    }
  }

  function startEdit(it: FeedbackRow) {
    resetForm();
    setEditingId(it.id);
    setText(it.text);
    setEditKeep(it.images ?? []);
  }

  function handlePaste(e: React.ClipboardEvent) {
    const clip = e.clipboardData?.items;
    if (!clip) return;
    const files: File[] = [];
    for (let i = 0; i < clip.length; i++) {
      const it = clip[i];
      if (it.type.startsWith("image/")) {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      addFiles(files);
    }
  }

  // Never render for logged-out users or the login screen.
  if (!me?.authenticated || pathname === "/login") return null;

  const visible = (items ?? []).filter((it) => it.status !== "resolved");
  const pendingCount = (items ?? []).filter((it) => it.status === "pending").length;
  const slots = imgs.length + editKeep.length;

  // FAB badge color: red if any pending, amber if only claude_done remain, hidden if none
  const fabBadgeClass =
    pendingOpenCount > 0
      ? "bg-red-600 text-white"
      : "bg-amber-500 text-white";

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Page feedback"
          title="Page feedback"
          className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg transition-shadow hover:shadow-xl"
          style={{ background: "#FEF3E2", color: "#A86120", border: "1px solid #F5D6A0" }}
        >
          <MessageSquare className="h-4 w-4" />
          Feedback
          {openCount > 0 && (
            <span className={`inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 rounded-full text-[10px] font-semibold leading-none ${fabBadgeClass}`}>
              {openCount}
            </span>
          )}
        </button>
      )}

      {/* Slide-over panel */}
      {open && (
        <div className="fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl"
            style={{ borderLeft: "1px solid #E8E4DE" }}
            onPaste={handlePaste}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "#E8E4DE" }}>
              <div className="min-w-0">
                <h2 className="font-serif text-base font-semibold" style={{ color: "#1A1714" }}>
                  Page Feedback
                </h2>
                <p className="max-w-[18rem] truncate font-mono text-xs" style={{ color: "#AAA39E" }}>
                  {pathname}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-md p-2 hover:bg-stone-100"
                style={{ color: "#847D77" }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Compose */}
            <div className="space-y-3 border-b px-5 py-4" style={{ borderColor: "#E8E4DE" }}>
              {editingId && (
                <div className="flex items-center justify-between rounded border px-2 py-1 text-xs" style={{ background: "#FEF3E2", borderColor: "#F5D6A0", color: "#A86120" }}>
                  <span>Editing your feedback…</span>
                  <button onClick={resetForm} className="underline">cancel</button>
                </div>
              )}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What should change on this page?"
                rows={3}
                className="w-full resize-none rounded-lg border p-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "#E8E4DE", color: "#1A1714" }}
              />
              {/* Image dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                className="flex flex-wrap items-center gap-2"
              >
                {editKeep.map((u, i) => (
                  <div key={"keep-" + i} className="relative h-14 w-14">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="h-14 w-14 rounded border object-cover" style={{ borderColor: "#E8E4DE" }} />
                    <button onClick={() => setEditKeep((p) => p.filter((_, j) => j !== i))} className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[10px] leading-none text-white">x</button>
                  </div>
                ))}
                {imgs.map((u, i) => (
                  <div key={i} className="relative h-14 w-14">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="h-14 w-14 rounded border object-cover" style={{ borderColor: "#E8E4DE" }} />
                    <button onClick={() => removePending(i)} className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[10px] leading-none text-white">x</button>
                  </div>
                ))}
                {slots < 2 && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded border border-dashed hover:border-stone-400"
                    style={{ borderColor: "#D8D3CC", color: "#AAA39E" }}
                    title="Add image (max 2)"
                  >
                    <span className="text-xl leading-none">+</span>
                    <span className="px-0.5 text-center text-[8px] leading-tight">paste / drop</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              </div>
              <button
                onClick={submit}
                disabled={!text.trim() || submitting}
                className="w-full rounded-lg py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40"
                style={{ background: "#A86120" }}
              >
                {submitting ? "Saving…" : editingId ? "Update feedback" : "Submit feedback"}
              </button>
            </div>

            {/* List */}
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#AAA39E" }}>
                {items === null ? "Loading…" : pendingCount + " pending"}
              </div>

              {visible.map((it) => {
                const mine = !!email && (it.submitterEmail || "").toLowerCase() === email;
                const canControl = mine || isOwner;
                const sc = statusConfig(it.status);
                return (
                  <div key={it.id} className="space-y-2 rounded-lg border p-3" style={{ borderColor: "#E8E4DE" }}>
                    {/* Status badge */}
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${sc.dot}`} />
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${sc.badge}`}>
                        {sc.label}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm" style={{ color: "#1A1714" }}>{it.text}</p>
                    {it.images?.length > 0 && (
                      <div className="flex gap-2">
                        {it.images.map((u, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={u} alt="" onClick={() => setLightbox(u)} className="h-16 w-16 cursor-zoom-in rounded border object-cover" style={{ borderColor: "#E8E4DE" }} />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px]" style={{ color: "#AAA39E" }}>
                      <span>{displayName(it.submitterName)} · {relTime(it.createdAt)}</span>
                      <span className="flex items-center gap-2">
                        {canControl && it.status === "claude_done" && (
                          <button onClick={() => patchStatus(it.id, "resolved")} className="font-medium" style={{ color: "#047857" }}>Confirm</button>
                        )}
                        {canControl && it.status === "pending" && (
                          <button onClick={() => patchStatus(it.id, "resolved")} className="hover:underline" style={{ color: "#847D77" }}>Mark done</button>
                        )}
                        {canControl && (
                          <button onClick={() => startEdit(it)} className="hover:underline" style={{ color: "#847D77" }}>Edit</button>
                        )}
                        {canControl && (
                          <button onClick={() => onDelete(it.id)} className="hover:underline" style={{ color: "#B91C1C" }}>Delete</button>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}

              {items !== null && visible.length === 0 && (
                <p className="text-sm" style={{ color: "#AAA39E" }}>No feedback for this page yet.</p>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-6" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded" />
        </div>
      )}
    </>
  );
}
