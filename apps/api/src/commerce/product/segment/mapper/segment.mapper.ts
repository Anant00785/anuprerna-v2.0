/**
 * apps/api/src/commerce/product/segment/mapper/segment.mapper.ts
 *
 * Translates between the API-facing SegmentInput shape and the Drizzle
 * insert/update value shapes for the `segment` table. Source:
 * SegmentDAOController#createNewSegment / #updateSegment.
 */
import { InsertSegmentValues } from "../repository/segment.repository.js";
import { SegmentInput } from "../types/segment.types.js";

/**
 * createNewSegment(Segment segment) — builds the insert payload.
 * timeOfCreation is set server-side (Pastebox.getCurrentTimeInMillis());
 * categoryId is the caller-supplied FK, already resolved/validated to
 * exist by the service via CategoryService before this is called;
 * icon/socialImage are the uploaded-and-stored URLs.
 */
export function toInsertValues(input: SegmentInput, iconUrl: string, socialImageUrl: string): InsertSegmentValues {
  return {
    categoryId: input.categoryId,
    name: input.name,
    icon: iconUrl,
    metaTitle: input.metaTitle ?? "",
    metaDescription: input.metaDescription ?? "",
    socialImage: socialImageUrl,
    timeOfCreation: Date.now(),
  };
}

/**
 * updateSegment(Segment updatedSegment, Long segmentId) — source always
 * overwrites name/metaTitle/metaDescription AND categoryId (unlike
 * icon/socialImage, which are only overwritten when a replacement file was
 * uploaded — source quirk preserved: `if (updatedSegment.getIconFile() !=
 * null)` / same for social image). `iconUrl` / `socialImageUrl` are only
 * passed when the service uploaded a replacement.
 */
export function toUpdateValues(
  input: SegmentInput,
  iconUrl?: string,
  socialImageUrl?: string,
): Partial<InsertSegmentValues> {
  const values: Partial<InsertSegmentValues> = {
    categoryId: input.categoryId,
    name: input.name,
    metaTitle: input.metaTitle ?? "",
    metaDescription: input.metaDescription ?? "",
  };
  if (iconUrl !== undefined) values.icon = iconUrl;
  if (socialImageUrl !== undefined) values.socialImage = socialImageUrl;
  return values;
}
