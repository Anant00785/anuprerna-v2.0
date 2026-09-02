"use client";

import { useCallback, useEffect, useMemo, useRef, useState, FormEvent } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Star, CheckCircle, Image as ImageIcon } from "lucide-react";

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

const CATEGORIES = [
  { id: "admin", label: "CMS Feature", icon: "Settings" },
  { id: "products", label: "Catalog / Inventory", icon: "Package" },
  { id: "orders", label: "Orders / Workflow", icon: "Truck" },
  { id: "ui", label: "UI / Experience", icon: "Layout" },
  { id: "bug", label: "Issue / Bug", icon: "AlertTriangle" },
];

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

export default function PageFeedbackWidget() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"compose" | "list">("compose");
  const [items, setItems] = useState<FeedbackRow[] | null>(null);

  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("admin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadFeedbacks = useCallback(async () => {
    try {
      const r = await fetch(`/api/feedback?route=${encodeURIComponent(pathname)}`, {
        cache: "no-store",
      });
      const d = (await r.json()) as { feedback: FeedbackRow[] };
      setItems(d.feedback ?? []);
    } catch {
      setItems([]);
    }
  }, [pathname]);

  useEffect(() => {
    if (open) {
      loadFeedbacks();
    }
  }, [open, loadFeedbacks]);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Image file must be under 10MB");
      return;
    }
    setError("");
    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", name.trim() || "CMS Admin");
      formData.append("email", email.trim() || "admin@anuprerna.com");
      formData.append("rating", String(rating));
      formData.append("category", category);
      formData.append("message", message.trim());
      formData.append("pageUrl", pathname);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      setSubmitted(true);
      setMessage("");
      removeImage();
      await loadFeedbacks();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id: string) => {
    setItems((prev) =>
      prev === null ? prev : prev.map((it) => (it.id === id ? { ...it, status: "resolved" } : it))
    );
    try {
      await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      await loadFeedbacks();
    } catch {
      /* ignore */
    }
  };

  if (pathname.startsWith("/auth")) return null;

  const visibleItems = (items ?? []).filter((it) => it.status !== "resolved");
  const pendingCount = visibleItems.length;

  return (
    <>
      {/* Floating launcher matching user screenshot */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Feedback"
          title="Give Feedback"
          className="fixed bottom-6 right-6 z-[95] inline-flex items-center gap-2 rounded-full border border-[#E8DFD1] bg-[#FAF7F2] hover:bg-[#F3EDE2] px-4 py-2 text-xs sm:text-sm font-medium text-[#7D5B20] shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-[#7D5B20]" />
          <span className="font-normal text-[#5C4217]">Feedback</span>
          {pendingCount > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[1rem] h-[1rem] px-1 rounded-full bg-[#7D5B20] text-white text-[9px] font-semibold leading-none"
              aria-label={`${pendingCount} open feedback items`}
            >
              {pendingCount}
            </span>
          )}
        </button>
      )}

      {/* Slide-over panel */}
      {open && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity" onClick={() => setOpen(false)} />

          <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#EFEEE9] bg-[#FAF7F2] px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-[#7D5B20] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Page Feedback
                </h2>
                <p className="max-w-[18rem] truncate text-xs text-black/50 font-mono mt-0.5">{pathname}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-1.5 text-black/50 hover:bg-black/5 hover:text-black transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#EFEEE9] bg-gray-50/70 text-xs font-medium">
              <button
                type="button"
                onClick={() => { setActiveTab("compose"); setSubmitted(false); }}
                className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
                  activeTab === "compose"
                    ? "border-[#7D5B20] text-[#7D5B20] font-semibold bg-white"
                    : "border-transparent text-black/60 hover:text-black"
                }`}
              >
                Give Feedback
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className={`flex-1 py-2.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                  activeTab === "list"
                    ? "border-[#7D5B20] text-[#7D5B20] font-semibold bg-white"
                    : "border-transparent text-black/60 hover:text-black"
                }`}
              >
                Recent Notes ({items?.length ?? 0})
              </button>
            </div>

            {/* Tab 1: Compose Form */}
            {activeTab === "compose" && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {submitted ? (
                  <div className="p-6 text-center space-y-3 bg-[#FAF7F2] rounded-xl border border-[#E9E1D2]">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-semibold text-black">Thank You for Your Feedback!</h3>
                    <p className="text-xs text-black/60 leading-relaxed">
                      Your review and attached photos have been safely saved to our Neon cloud dashboard.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="mt-2 px-4 py-2 rounded-lg bg-[#7D5B20] text-white text-xs font-medium hover:bg-[#684b1a] transition"
                    >
                      Write Another Note
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Star Rating */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-black/60 mb-1">
                        Experience Rating
                      </label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const active = (hoverRating || rating) >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setRating(star)}
                              className="p-0.5 transition-transform hover:scale-125 focus:outline-none"
                            >
                              <Star
                                className={`w-6 h-6 transition-colors ${
                                  active ? "text-amber-400 fill-amber-400" : "text-gray-300"
                                }`}
                              />
                            </button>
                          );
                        })}
                        <span className="ml-2 text-xs font-medium text-black/50">
                          {rating === 5 && "Outstanding"}
                          {rating === 4 && "Good"}
                          {rating === 3 && "Average"}
                          {rating === 2 && "Needs Work"}
                          {rating === 1 && "Poor"}
                        </span>
                      </div>
                    </div>

                    {/* Category Selector */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-black/60 mb-1.5">
                        Topic
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {CATEGORIES.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setCategory(c.id)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all flex items-center gap-1 ${
                              category === c.id
                                ? "bg-[#7D5B20] text-white border-[#7D5B20]"
                                : "bg-white text-black/70 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Feedback Message */}
                    <div>
                      <label htmlFor="cms-fb-message" className="block text-xs font-semibold uppercase tracking-wider text-black/60 mb-1">
                        Message / Suggestion <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="cms-fb-message"
                        rows={3}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us what you liked or how we can improve this page..."
                        className="w-full rounded-lg border border-gray-300 p-2.5 text-xs sm:text-sm outline-none focus:border-[#7D5B20] focus:ring-1 focus:ring-[#7D5B20] transition placeholder:text-black/35"
                      />
                    </div>

                    {/* Image Upload Box */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-black/60 mb-1">
                        Attach Screenshot / Photo
                      </label>

                      {imagePreview ? (
                        <div className="relative inline-block border border-gray-200 rounded-lg p-1.5 bg-gray-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imagePreview}
                            alt="Thumbnail"
                            className="h-20 w-auto rounded object-cover border border-black/10"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 shadow hover:bg-red-700 transition"
                            title="Remove image"
                          >
                            <X className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileRef.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files?.[0];
                            if (file) handleFileChange(file);
                          }}
                          className="border border-dashed border-gray-300 hover:border-[#7D5B20] rounded-lg p-3 text-center cursor-pointer bg-gray-50/70 hover:bg-[#FAF7F2] transition"
                        >
                          <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileChange(file);
                            }}
                            className="hidden"
                          />
                          <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                          <span className="text-xs font-medium text-black/70 block">
                            Click to attach photo or screenshot
                          </span>
                          <span className="text-[10px] text-black/40">Uploaded to Neon S3 storage</span>
                        </div>
                      )}
                    </div>

                    {error && (
                      <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || !message.trim()}
                      className="w-full py-2.5 rounded-lg bg-[#7D5B20] hover:bg-[#684b1a] text-white font-medium text-xs sm:text-sm transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {submitting ? "Saving to Neon..." : "Submit Feedback"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Tab 2: Recent List */}
            {activeTab === "list" && (
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {items === null ? (
                  <div className="flex items-center justify-center py-10 text-xs text-black/50 gap-2">
                    Loading from Neon...
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-10 space-y-1 text-black/50">
                    <MessageSquare className="w-8 h-8 text-black/30 mx-auto" />
                    <p className="text-xs font-medium">No notes recorded for this page yet.</p>
                  </div>
                ) : (
                  items.map((it) => (
                    <div key={it.id} className="rounded-xl border border-gray-200 p-3.5 bg-white space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider ${
                          it.status === "resolved" ? "text-emerald-600" : "text-amber-600"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${it.status === "resolved" ? "bg-emerald-500" : "bg-amber-500"}`} />
                          {it.status === "resolved" ? "Resolved" : "Open"}
                        </span>
                        <span className="text-[11px] text-black/40">{relTime(it.createdAt)}</span>
                      </div>

                      <p className="text-xs text-black/80 whitespace-pre-wrap leading-relaxed">{it.text}</p>

                      {it.images && it.images.length > 0 && (
                        <div className="flex gap-2 pt-1">
                          {it.images.map((imgUrl, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={imgUrl}
                              alt="Attachment"
                              onClick={() => setLightbox(imgUrl)}
                              className="h-14 w-14 rounded-lg border border-gray-200 object-cover cursor-zoom-in hover:opacity-90"
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[11px] text-black/50">
                        <span>{it.submitterName || "Customer"}</span>
                        {it.status !== "resolved" && (
                          <button
                            type="button"
                            onClick={() => handleResolve(it.id)}
                            className="text-emerald-700 hover:underline font-medium text-[11px]"
                          >
                            ✓ Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Image Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Enlarged preview" className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl object-contain" />
        </div>
      )}
    </>
  );
}
