/**
 * Loom: `profile/custom_size/dao/controller/CustomSizeProfileDAOController.java`
 * and `CustomSizeProfileJpaRepository`.
 *
 * A profile and its items are one aggregate in Loom (`@OneToMany` with cascade
 * and orphan removal), so create and update both cascade into
 * custom_size_profile_item and both run in one transaction.
 */
import { Inject, Injectable } from "@nestjs/common";
import { asc, eq, sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import type { CustomSizeProfileInput } from "../dto/custom-size-profile.dto.js";

type Executor = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

export interface CustomSizeProfileItem {
  id: number;
  label: string;
  fieldType: number;
  placeholder: string;
  mandatory: boolean;
}

export interface CustomSizeProfile {
  id: number;
  profileName: string;
  disclaimer: string;
  price: number;
  timeOfCreation: number;
  customSizeProfileItemList: CustomSizeProfileItem[];
}

/** Loom: profile/pojo/ProfileDelete, serialized under `deleteResult`. */
export interface ProfileDeleteResult {
  success: boolean;
  message: string;
  productSkuList: string[] | null;
  subcategoryCount: number | null;
  subCategoryNameList: string[] | null;
}

@Injectable()
export class CustomSizeProfileRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  private async itemsFor(profileIds: number[], tx: Executor): Promise<Map<number, CustomSizeProfileItem[]>> {
    const byProfile = new Map<number, CustomSizeProfileItem[]>();
    if (profileIds.length === 0) return byProfile;

    const rows = await tx
      .select()
      .from(schema.customSizeProfileItem)
      .where(
        profileIds.length === 1
          ? eq(schema.customSizeProfileItem.profileId, profileIds[0])
          : sql`${schema.customSizeProfileItem.profileId} IN ${profileIds}`,
      )
      .orderBy(asc(schema.customSizeProfileItem.id));

    for (const row of rows) {
      const list = byProfile.get(row.profileId) ?? [];
      list.push({
        id: Number(row.id),
        label: row.label,
        fieldType: row.fieldType,
        placeholder: row.placeholder,
        mandatory: row.mandatory,
      });
      byProfile.set(row.profileId, list);
    }
    return byProfile;
  }

  /** Loom: retrieveCustomSizeProfileList — findAll(). */
  async findAll(): Promise<CustomSizeProfile[]> {
    const rows = await this.db.select().from(schema.customSizeProfile).orderBy(asc(schema.customSizeProfile.id));
    const items = await this.itemsFor(rows.map((row) => Number(row.id)), this.db);
    return rows.map((row) => ({
      id: Number(row.id),
      profileName: row.profileName,
      disclaimer: row.disclaimer,
      price: row.price,
      timeOfCreation: Number(row.timeOfCreation),
      customSizeProfileItemList: items.get(Number(row.id)) ?? [],
    }));
  }

  /** Loom: retrieveCustomSizeProfile(profileId) — null when absent. */
  async findById(profileId: number): Promise<CustomSizeProfile | null> {
    const rows = await this.db
      .select()
      .from(schema.customSizeProfile)
      .where(eq(schema.customSizeProfile.id, BigInt(profileId)))
      .limit(1);
    if (rows.length === 0) return null;

    const items = await this.itemsFor([profileId], this.db);
    return {
      id: Number(rows[0].id),
      profileName: rows[0].profileName,
      disclaimer: rows[0].disclaimer,
      price: rows[0].price,
      timeOfCreation: Number(rows[0].timeOfCreation),
      customSizeProfileItemList: items.get(profileId) ?? [],
    };
  }

  /**
   * Loom: createCustomSizeProfile — stamps timeOfCreation and cascades the item
   * list. One transaction: a profile without its items is unusable.
   */
  async create(input: CustomSizeProfileInput): Promise<number> {
    return this.db.transaction(async (tx) => {
      const [profile] = await tx
        .insert(schema.customSizeProfile)
        .values({
          profileName: input.profileName,
          disclaimer: input.disclaimer,
          price: input.price,
          timeOfCreation: Date.now(),
        })
        .returning({ id: schema.customSizeProfile.id });

      const profileId = Number(profile.id);
      await tx.insert(schema.customSizeProfileItem).values(
        input.customSizeProfileItemList.map((item) => ({
          profileId,
          label: item.label,
          fieldType: item.fieldType,
          placeholder: item.placeholder,
          mandatory: item.mandatory,
        })),
      );
      return profileId;
    });
  }

  /**
   * Loom: updateCustomSizeProfile — the item list is CLEARED and rewritten from
   * the body (`profile.getCustomSizeProfileItemList().clear()` plus
   * `deleteCustomSizeProfileItems`), so the body is authoritative. timeOfCreation
   * is not touched.
   *
   * @returns false when the profile does not exist (Loom NPEs here; refusing is
   *          the corrected behaviour, and nothing is written either way).
   */
  async update(input: CustomSizeProfileInput & { id: number }): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: schema.customSizeProfile.id })
        .from(schema.customSizeProfile)
        .where(eq(schema.customSizeProfile.id, BigInt(input.id)))
        .limit(1);
      if (existing.length === 0) return false;

      await tx
        .update(schema.customSizeProfile)
        .set({ profileName: input.profileName, disclaimer: input.disclaimer, price: input.price })
        .where(eq(schema.customSizeProfile.id, BigInt(input.id)));

      await tx.delete(schema.customSizeProfileItem).where(eq(schema.customSizeProfileItem.profileId, input.id));
      await tx.insert(schema.customSizeProfileItem).values(
        input.customSizeProfileItemList.map((item) => ({
          profileId: input.id,
          label: item.label,
          fieldType: item.fieldType,
          placeholder: item.placeholder,
          mandatory: item.mandatory,
        })),
      );
      return true;
    });
  }

  /**
   * Loom: deleteCustomSizeProfile — refuses while any product or sub-category
   * still references the profile, and reports exactly which. A hard delete of a
   * referenced profile would orphan those rows; this table has no soft-delete
   * flag, so the reference check IS the safety.
   */
  async remove(profileId: number): Promise<ProfileDeleteResult> {
    return this.db.transaction(async (tx) => {
      const skuRows = await tx.execute(
        sql`SELECT sku FROM product WHERE custom_size_profile_id = ${profileId}`,
      );
      const skuList = (((skuRows as { rows?: unknown[] })?.rows ?? (skuRows as unknown[])) as Record<string, unknown>[])
        .map((row) => String(row.sku));

      const countRows = await tx.execute(
        sql`SELECT COUNT(*) AS count FROM sub_category WHERE custom_size_profile_id = ${profileId}`,
      );
      const countRow = (((countRows as { rows?: unknown[] })?.rows ?? (countRows as unknown[])) as Record<string, unknown>[])[0];
      const subCategoryCount = Number(countRow?.count ?? 0);

      if (skuList.length > 0 || subCategoryCount > 0) {
        return {
          success: true,
          message: `Custom Size profile has ${skuList.length} products and ${subCategoryCount} sub categories associated. Cannot be deleted.`,
          productSkuList: skuList,
          subcategoryCount: subCategoryCount,
          subCategoryNameList: null,
        };
      }

      const existing = await tx
        .select({ id: schema.customSizeProfile.id })
        .from(schema.customSizeProfile)
        .where(eq(schema.customSizeProfile.id, BigInt(profileId)))
        .limit(1);
      if (existing.length === 0) {
        return {
          success: false,
          message: "Profile not found.",
          productSkuList: null,
          subcategoryCount: null,
          subCategoryNameList: null,
        };
      }

      await tx.delete(schema.customSizeProfileItem).where(eq(schema.customSizeProfileItem.profileId, profileId));
      await tx.delete(schema.customSizeProfile).where(eq(schema.customSizeProfile.id, BigInt(profileId)));

      return {
        success: true,
        message: "Custom Size profile deleted.",
        productSkuList: null,
        subcategoryCount: null,
        subCategoryNameList: null,
      };
    });
  }
}
