// @ts-nocheck
/**
 * apps/api/src/commerce/product/category/mapper/category.mapper.ts
 *
 * Translates between the API-facing CategoryInput shape and the Drizzle
 * insert/update value shapes for the `category` table. Kept separate from
 * the service so the "which fields get written on create vs. update" rule
 * (source: CategoryDAOController#createNewCategory / #updateCategory) stays
 * visible in one place.
 */
import { InsertCategoryValues } from "../repository/category.repository.js";
import { CategoryInput } from "../types/category.types.js";

/**
 * createNewCategory(Category category) — builds the insert payload.
 * timeOfCreation is set server-side (Pastebox.getCurrentTimeInMillis());
 * icon / socialImage are the uploaded-and-stored URLs, resolved by the
 * service via ImageStoragePort before calling this.
 */
export function toInsertValues(input: CategoryInput, iconUrl: string, socialImageUrl: string): InsertCategoryValues {
  return {
    name: input.name,
    icon: iconUrl,
    metaTitle: input.metaTitle ?? "",
    metaDescription: input.metaDescription ?? "",
    socialImage: socialImageUrl,
    timeOfCreation: Date.now(),
  };
}

/**
 * updateCategory(Category updatedCategory, Long categoryId) — source always
 * overwrites name/metaTitle/metaDescription, and only overwrites
 * icon/socialImage when a replacement file was actually uploaded (source
 * quirk: `if (updatedCategory.getIconFile() != null)` / same for social
 * image). `iconUrl` / `socialImageUrl` are only passed when the service
 * uploaded a replacement; omit them to leave the existing DB value alone.
 */
export function toUpdateValues(
  input: CategoryInput,
  iconUrl?: string,
  socialImageUrl?: string,
): Partial<InsertCategoryValues> {
  const values: Partial<InsertCategoryValues> = {
    name: input.name,
    metaTitle: input.metaTitle ?? "",
    metaDescription: input.metaDescription ?? "",
  };
  if (iconUrl !== undefined) values.icon = iconUrl;
  if (socialImageUrl !== undefined) values.socialImage = socialImageUrl;
  return values;
}
// @ts-nocheck
// @ts-nocheck
