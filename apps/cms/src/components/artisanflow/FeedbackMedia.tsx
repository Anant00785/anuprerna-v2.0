import { normalizeFeedbackMediaList } from "@/lib/feedback-media";
import { Video } from "lucide-react";

/** QC image thumbnails + "play video" links for a subprocess/step feedback entry.
 *  Plain links (not a lightbox) so this stays usable from pure-render / SSR
 *  boards as well as client components.
 *
 *  A single feedback field can carry SEVERAL comma-separated files (Loom's
 *  multi-upload) — render every one. Treating the whole field as one filename is
 *  what produced the "403 wall" the media helper documents. */
export function FeedbackMedia({ image, video }: { image?: string; video?: string }) {
  const imgs = normalizeFeedbackMediaList(image);
  const vids = normalizeFeedbackMediaList(video);
  if (!imgs.length && !vids.length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2">
      {imgs.map((img, i) => (
        <a key={img} href={img} target="_blank" rel="noreferrer" title={`View QC image ${i + 1} of ${imgs.length}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={`QC ${i + 1}`} className="h-12 w-12 rounded-md border object-cover" style={{ borderColor: "#E8E4DE" }} />
        </a>
      ))}
      {vids.map((vid, i) => (
        <a
          key={vid}
          href={vid}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors hover:bg-stone-50"
          style={{ borderColor: "#E8E4DE", color: "#1D4ED8" }}
        >
          <Video className="h-3 w-3" /> Play video{vids.length > 1 ? ` ${i + 1}` : ""}
        </a>
      ))}
    </div>
  );
}
