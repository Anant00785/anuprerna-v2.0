'use client';

/**
 * Page-Feedback widget for the Anuprerna storefront demo.
 *
 * Faithful port of Weave's PageFeedbackWidget, adapted to the storefront:
 *  - storefront design tokens (clay / bark / sand / cream) + Material Symbols
 *    (the storefront has no lucide dependency),
 *  - the storefront's OWN auth: useAuth() (loom_jwt session) gates rendering,
 *  - all backend traffic via same-origin /api/feedback proxy routes which inject
 *    identity server-side and forward to the NestJS sandbox (app='storefront').
 *
 * Floating launcher -> right slide-out 'Page Feedback' panel: textarea +
 * paste/drop <=2 downscaled images, then this route's pending feedback with
 * thumbnails + lightbox + relative time + status + owner/submitter controls.
 * Mounted only when NEXT_PUBLIC_FEEDBACK_ENABLED==='true' (see layout).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

type Status = 'pending' | 'claude_done' | 'resolved';

interface FeedbackRow {
  id: string;
  route: string;
  pageLabel?: string;
  text: string;
  images: string[];
  submitterName: string;
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
  if (!ts) return '';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  if (d < 30) return d + 'd ago';
  return new Date(ts).toLocaleDateString();
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
        const sc = Math.min(MAX / width, MAX / height);
        width = Math.round(width * sc);
        height = Math.round(height * sc);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(raw);
      ctx.drawImage(img, 0, 0, width, height);
      try {
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } catch {
        resolve(raw);
      }
    };
    img.onerror = () => resolve(raw);
    img.src = raw;
  });
}

export default function PageFeedbackWidget() {
  const pathname = usePathname() || '/';
  const { user, loading } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FeedbackRow[] | null>(null);
  const [text, setText] = useState('');
  const [imgs, setImgs] = useState<string[]>([]); // pending new images (data-URLs)
  const [editKeep, setEditKeep] = useState<string[]>([]); // existing images kept while editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  // Count of open (pending|claude_done) feedback for the current route -- drives
  // the launcher badge so it is visible without opening the panel.
  const [openCount, setOpenCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const email = (me?.email || (user?.email as string) || '').toLowerCase();
  const isOwner = !!me?.isOwner;

  const pageLabel = useMemo(() => {
    if (typeof document !== 'undefined' && document.title) return document.title;
    return pathname;
  }, [pathname]);

  const load = useCallback(async () => {
    setItems(null);
    try {
      const r = await fetch(`/api/feedback?route=${encodeURIComponent(pathname)}`, {
        cache: 'no-store',
      });
      const d = (await r.json()) as { feedback: FeedbackRow[]; me: Me };
      if (d.me) setMe(d.me);
      setItems(d.feedback ?? []);
    } catch {
      setItems([]);
    }
  }, [pathname]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // Keep badge in sync whenever the panel's items list refreshes (avoids a
  // second network call while the panel is open).
  useEffect(() => {
    if (items !== null) {
      setOpenCount(
        items.filter((it) => it.status === 'pending' || it.status === 'claude_done').length
      );
    }
  }, [items]);

  // Background fetch on mount (and on pathname change) so the badge is visible
  // before the user ever opens the panel. Skipped in production: this is a
  // development-only tool and this fetch previously ran on every page view.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    let cancelled = false;
    fetch(`/api/feedback?route=${encodeURIComponent(pathname)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { feedback?: FeedbackRow[] }) => {
        if (cancelled) return;
        setOpenCount(
          (d.feedback ?? []).filter(
            (it) => it.status === 'pending' || it.status === 'claude_done'
          ).length
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname, user]);

  // Escape closes the lightbox.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  async function addFiles(files: File[] | FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).filter((f) => f.type.startsWith('image/'));
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
    setText('');
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
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.trim(), images }),
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Failed');
      } else {
        const r = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ route: pathname, pageLabel, text: text.trim(), images }),
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Failed');
      }
      resetForm();
      await load();
    } catch (e) {
      alert('Could not save feedback: ' + (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function patchStatus(id: string, status: Status) {
    // Optimistically update local state so resolved items vanish immediately.
    setItems((prev) =>
      prev === null ? prev : prev.map((it) => (it.id === id ? { ...it, status } : it))
    );
    try {
      const r = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Failed');
    } catch (e) {
      alert('Could not update: ' + (e as Error).message);
      await load(); // restore accurate state on error
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this feedback?')) return;
    try {
      const r = await fetch(`/api/feedback/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Failed');
      await load();
    } catch (e) {
      alert('Could not delete: ' + (e as Error).message);
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
      if (it.type.startsWith('image/')) {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      addFiles(files);
    }
  }

  // Storefront auth gate: render nothing until a logged-in customer is known,
  // and never on the auth screens.
  if (loading || pathname.startsWith('/auth')) return null;

  const visible = (items ?? []).filter((it) => it.status !== 'resolved');
  const pendingCount = (items ?? []).filter((it) => it.status === 'pending').length;
  const slots = imgs.length + editKeep.length;
  const hasPending = visible.some((i) => i.status === 'pending');
  const hasClaudeDone = visible.some((i) => i.status === 'claude_done');
  const fabColor = hasPending ? 'bg-red-500' : hasClaudeDone ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label='Page feedback'
          title='Page feedback'
          className='fixed bottom-6 right-6 z-[95] flex items-center gap-2 rounded-full bg-clay px-4 py-2.5 text-sm font-medium text-cream shadow-lg transition-shadow hover:shadow-xl'
        >
          {/* Icon wrapper -- relative so the badge can sit absolute on top-right */}
          <span className='relative'>
            <span className='material-symbols-outlined text-[18px] leading-none'>feedback</span>
            {openCount > 0 && (
              <span
                className={`absolute -top-2 -right-2.5 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 rounded-full ${fabColor} text-white text-[10px] font-semibold leading-none`}
                aria-label={`${openCount} open feedback items`}
              >
                {openCount}
              </span>
            )}
          </span>
          Feedback
        </button>
      )}

      {/* Slide-over panel */}
      {open && (
        <div className='fixed inset-0 z-[100]'>
          <div className='absolute inset-0 bg-black/30' onClick={() => setOpen(false)} />
          <aside
            className='absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-sand bg-cream shadow-xl'
            onPaste={handlePaste}
          >
            {/* Header */}
            <div className='flex items-center justify-between border-b border-sand px-5 py-4'>
              <div className='min-w-0'>
                <h2 className='text-base font-semibold text-clayd'>Page Feedback</h2>
                <p className='max-w-[18rem] truncate font-mono text-xs text-bark'>{pathname}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label='Close'
                className='rounded-md p-2 text-bark hover:bg-sand'
              >
                <span className='material-symbols-outlined'>close</span>
              </button>
            </div>

            {/* Compose */}
            <div className='space-y-3 border-b border-sand px-5 py-4'>
              {editingId && (
                <div className='flex items-center justify-between rounded border border-clay/30 bg-sand px-2 py-1 text-xs text-clay'>
                  <span>Editing your feedback…</span>
                  <button onClick={resetForm} className='underline'>cancel</button>
                </div>
              )}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='What should change on this page?'
                rows={3}
                className='w-full resize-none rounded-lg border border-sand bg-white p-2.5 text-sm text-clayd focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay'
              />
              {/* Image dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                className='flex flex-wrap items-center gap-2'
              >
                {editKeep.map((u, i) => (
                  <div key={'keep-' + i} className='relative h-14 w-14'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt='' className='h-14 w-14 rounded border border-sand object-cover' />
                    <button onClick={() => setEditKeep((p) => p.filter((_, j) => j !== i))} className='absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-clayd text-[10px] leading-none text-white'>x</button>
                  </div>
                ))}
                {imgs.map((u, i) => (
                  <div key={i} className='relative h-14 w-14'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt='' className='h-14 w-14 rounded border border-sand object-cover' />
                    <button onClick={() => removePending(i)} className='absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-clayd text-[10px] leading-none text-white'>x</button>
                  </div>
                ))}
                {slots < 2 && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className='flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded border border-dashed border-bark/50 text-bark hover:border-clay'
                    title='Add image (max 2)'
                  >
                    <span className='text-xl leading-none'>+</span>
                    <span className='px-0.5 text-center text-[8px] leading-tight'>paste / drop</span>
                  </button>
                )}
                <input ref={fileRef} type='file' accept='image/*' multiple className='hidden' onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
              </div>
              <button
                onClick={submit}
                disabled={!text.trim() || submitting}
                className='w-full rounded-lg bg-clay py-2 text-sm font-medium text-cream transition-opacity disabled:opacity-40'
              >
                {submitting ? 'Saving…' : editingId ? 'Update feedback' : 'Submit feedback'}
              </button>
            </div>

            {/* List */}
            <div className='flex-1 space-y-3 overflow-y-auto px-5 py-4'>
              <div className='text-xs font-semibold uppercase tracking-wider text-bark'>
                {items === null ? 'Loading…' : pendingCount + ' pending'}
              </div>

              {visible.map((it) => {
                const mine = (it.submitterEmail ?? '').toLowerCase() === email && !!email;
                const canControl = mine || isOwner;
                return (
                  <div key={it.id} className='space-y-2 rounded-lg border border-sand bg-white p-3'>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      it.status === 'resolved' ? 'text-emerald-600' :
                      it.status === 'claude_done' ? 'text-amber-500' :
                      'text-red-500'
                    }`}>
                      <span className={`w-2 h-2 rounded-full inline-block ${
                        it.status === 'resolved' ? 'bg-emerald-500' :
                        it.status === 'claude_done' ? 'bg-amber-500' :
                        'bg-red-500'
                      }`} />
                      {it.status === 'resolved' ? 'Resolved' : it.status === 'claude_done' ? 'Fixed by Claude' : 'Pending'}
                    </span>
                    <p className='whitespace-pre-wrap text-sm text-clayd'>{it.text}</p>
                    {it.images?.length > 0 && (
                      <div className='flex gap-2'>
                        {it.images.map((u, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={u} alt='' onClick={() => setLightbox(u)} className='h-16 w-16 cursor-zoom-in rounded border border-sand object-cover' />
                        ))}
                      </div>
                    )}
                    <div className='flex items-center justify-between text-[11px] text-bark'>
                      <span>{it.submitterName} · {relTime(it.createdAt)}</span>
                      <span className='flex items-center gap-2'>
                        {/* Resolve is freely clickable by any panel viewer — widget is local-only */}
                        {it.status !== 'resolved' && (
                          <button
                            onClick={() => patchStatus(it.id, 'resolved')}
                            className='rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-emerald-700 active:bg-emerald-800'
                          >
                            ✓ Resolve
                          </button>
                        )}
                        {canControl && (
                          <button onClick={() => startEdit(it)} className='text-bark hover:underline'>Edit</button>
                        )}
                        {canControl && (
                          <button onClick={() => onDelete(it.id)} className='text-red-700 hover:underline'>Delete</button>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}

              {items !== null && visible.length === 0 && (
                <p className='text-sm text-bark'>No feedback for this page yet.</p>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className='fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-6' onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt='' className='max-h-full max-w-full rounded' />
        </div>
      )}
    </>
  );
}
