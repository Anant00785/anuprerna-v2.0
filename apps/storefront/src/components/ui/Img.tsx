import NextImage, { type ImageProps } from 'next/image';

/**
 * Img — reusable next/image wrapper that serves WebP automatically.
 *
 * next/image already negotiates AVIF/WebP based on the `formats` list set in
 * next.config.mjs (we include image/webp there) and the browser Accept header,
 * so any remote S3/Loom image routed through this component is delivered as WebP
 * to supporting browsers without changing the source URL.
 *
 * Usage:
 *   <Img src={url} alt="..." width={400} height={300} sizes="(max-width:768px) 100vw, 400px" />
 *   <Img src={url} alt="..." fill className="object-cover" priority />
 *
 * Props are a straight pass-through to next/image (src, alt, width/height OR fill,
 * sizes, className, priority, quality, ...).
 */
export default function Img(props: ImageProps) {
  return <NextImage {...props} />;
}
