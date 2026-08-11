// @ts-nocheck
import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../../database/database.module.js';
import * as schema from '../../../database/schema/schema.js';
import { eq, desc } from 'drizzle-orm';
import {
  AddSizeProfileInput,
  UpdateSizeProfileInput,
  AddBadgeProfileInput,
  UpdateBadgeProfileInput,
  AddMadeToOrderProfileInput,
  UpdateMadeToOrderProfileInput,
  UpdateCustomerProfileInput,
} from '../types/profile.types.js';

@Injectable()
export class ProfileRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  // Size Profile
  async getSizeProfiles() {
    return this.db.select().from(schema.sizeProfile).orderBy(desc(schema.sizeProfile.id));
  }

  async getSizeProfileById(id: number) {
    const profileRows = await this.db
      .select()
      .from(schema.sizeProfile)
      .where(eq(schema.sizeProfile.id, BigInt(id)))
      .limit(1);
    return profileRows[0];
  }

  async createSizeProfile(input: AddSizeProfileInput, imageUrl: string) {
    return this.db.transaction(async (tx) => {
      const insertedProfile = await tx.insert(schema.sizeProfile).values({
        version: BigInt(1),
        profileName: input.profileName,
        displayName: input.displayName || 'Size',
        disclaimer: input.disclaimer,
        image: imageUrl,
        timeOfCreation: Date.now(),
      }).returning();
      
      const profileId = insertedProfile[0].id;

      for (let i = 0; i < (input.options?.length || 0); i++) {
        const option = input.options[i];
        const insertedOption = await tx.insert(schema.sizeProfileOption).values({
          version: BigInt(1),
          profileId: profileId,
          label: option.label,
          keyFeature: option.keyFeature || '',
          sortOrder: option.sortOrder || i,
          consumedFabric: String(option.consumedFabric || 0.0),
        }).returning();

        const optionId = insertedOption[0].id;

        for (let j = 0; j < (option.guides?.length || 0); j++) {
          const guide = option.guides[j];
          await tx.insert(schema.sizeProfileGuide).values({
            version: BigInt(1),
            profileId: profileId,
            optionId: optionId,
            guide: guide.guide,
            value: guide.value,
            sortOrder: guide.sortOrder || j,
          });
        }
      }

      return insertedProfile[0];
    });
  }

  async updateSizeProfile(id: number, input: UpdateSizeProfileInput) {
    const updates: any = {};
    if (input.profileName !== undefined) updates.profileName = input.profileName;
    if (input.displayName !== undefined) updates.displayName = input.displayName;
    if (input.disclaimer !== undefined) updates.disclaimer = input.disclaimer;
    
    if (Object.keys(updates).length > 0) {
      const res = await this.db.update(schema.sizeProfile)
        .set(updates)
        .where(eq(schema.sizeProfile.id, BigInt(id)))
        .returning();
      return res[0];
    }
    return this.getSizeProfileById(id);
  }

  async deleteSizeProfile(id: number) {
    return this.db.transaction(async (tx) => {
      await tx.delete(schema.sizeProfileGuide).where(eq(schema.sizeProfileGuide.profileId, BigInt(id)));
      await tx.delete(schema.sizeProfileOption).where(eq(schema.sizeProfileOption.profileId, BigInt(id)));
      await tx.delete(schema.sizeProfile).where(eq(schema.sizeProfile.id, BigInt(id)));
      return true;
    });
  }

  async paginateSizeProfile(page: number, size: number) {
    return this.db.select().from(schema.sizeProfile).limit(size).offset(page * size);
  }

  async paginateSizeProfileOption(page: number, size: number) {
    return this.db.select().from(schema.sizeProfileOption).limit(size).offset(page * size);
  }

  async paginateSizeProfileGuide(page: number, size: number) {
    return this.db.select().from(schema.sizeProfileGuide).limit(size).offset(page * size);
  }

  // Badge Profile
  async getBadgeProfiles() {
    return this.db.select().from(schema.badgeProfile).orderBy(desc(schema.badgeProfile.id));
  }

  async getBadgeProfileById(id: number) {
    const rows = await this.db.select().from(schema.badgeProfile).where(eq(schema.badgeProfile.id, BigInt(id))).limit(1);
    return rows[0];
  }

  async createBadgeProfile(input: AddBadgeProfileInput) {
    return this.db.transaction(async (tx) => {
      const inserted = await tx.insert(schema.badgeProfile).values({
        version: BigInt(1),
        name: input.name,
        timeOfCreation: Date.now(),
      }).returning();
      const profileId = inserted[0].id;

      for (let i = 0; i < (input.items?.length || 0); i++) {
        const item = input.items[i];
        await tx.insert(schema.badgeProfileItem).values({
          version: BigInt(1),
          profileId: profileId,
          label: item.label,
          icon: item.icon,
          sortOrder: item.sortOrder || i,
        });
      }
      return inserted[0];
    });
  }

  async updateBadgeProfile(id: number, input: UpdateBadgeProfileInput) {
    const updates: any = {};
    if (input.name !== undefined) updates.name = input.name;
    
    return this.db.transaction(async (tx) => {
      let profile;
      if (Object.keys(updates).length > 0) {
        const res = await tx.update(schema.badgeProfile).set(updates).where(eq(schema.badgeProfile.id, BigInt(id))).returning();
        profile = res[0];
      }
      
      if (input.items && input.items.length > 0) {
        await tx.delete(schema.badgeProfileItem).where(eq(schema.badgeProfileItem.profileId, BigInt(id)));
        for (let i = 0; i < input.items.length; i++) {
          const item = input.items[i];
          await tx.insert(schema.badgeProfileItem).values({
            version: BigInt(1),
            profileId: BigInt(id),
            label: item.label,
            icon: item.icon,
            sortOrder: item.sortOrder || i,
          });
        }
      }
      return profile || this.getBadgeProfileById(id);
    });
  }

  async deleteBadgeProfile(id: number) {
    return this.db.transaction(async (tx) => {
      await tx.delete(schema.badgeProfileItem).where(eq(schema.badgeProfileItem.profileId, BigInt(id)));
      await tx.delete(schema.badgeProfile).where(eq(schema.badgeProfile.id, BigInt(id)));
      return true;
    });
  }

  async paginateBadgeProfile(page: number, size: number) {
    return this.db.select().from(schema.badgeProfile).limit(size).offset(page * size);
  }

  async paginateBadgeProfileItem(page: number, size: number) {
    return this.db.select().from(schema.badgeProfileItem).limit(size).offset(page * size);
  }

  // Made To Order Profile
  async getMadeToOrderProfiles() {
    return this.db.select().from(schema.madeToOrderProfile).orderBy(desc(schema.madeToOrderProfile.id));
  }

  async getMadeToOrderProfileById(id: number) {
    const rows = await this.db.select().from(schema.madeToOrderProfile).where(eq(schema.madeToOrderProfile.id, BigInt(id))).limit(1);
    return rows[0];
  }

  async createMadeToOrderProfile(input: AddMadeToOrderProfileInput) {
    const inserted = await this.db.insert(schema.madeToOrderProfile).values({
      version: BigInt(1),
      profileName: input.profileName,
      minimumOrderQuantity: input.minimumOrderQuantity,
      deliveryFromDays: input.deliveryFromDays,
      deliveryToDays: input.deliveryToDays,
      timeOfCreation: Date.now(),
      consumedFabric: String(input.consumedFabric || 0.0),
    }).returning();
    return inserted[0];
  }

  async updateMadeToOrderProfile(id: number, input: UpdateMadeToOrderProfileInput) {
    const updates: any = {};
    if (input.profileName !== undefined) updates.profileName = input.profileName;
    if (input.minimumOrderQuantity !== undefined) updates.minimumOrderQuantity = input.minimumOrderQuantity;
    if (input.deliveryFromDays !== undefined) updates.deliveryFromDays = input.deliveryFromDays;
    if (input.deliveryToDays !== undefined) updates.deliveryToDays = input.deliveryToDays;
    if (input.consumedFabric !== undefined) updates.consumedFabric = String(input.consumedFabric);

    if (Object.keys(updates).length > 0) {
      const res = await this.db.update(schema.madeToOrderProfile).set(updates).where(eq(schema.madeToOrderProfile.id, BigInt(id))).returning();
      return res[0];
    }
    return this.getMadeToOrderProfileById(id);
  }

  async deleteMadeToOrderProfile(id: number) {
    await this.db.delete(schema.madeToOrderProfile).where(eq(schema.madeToOrderProfile.id, BigInt(id)));
    return true;
  }

  async paginateMadeToOrderProfile(page: number, size: number) {
    return this.db.select().from(schema.madeToOrderProfile).limit(size).offset(page * size);
  }

  // Tenant Profile
  async getAllTenants() {
    return this.db.select().from(schema.tenant);
  }

  async getTenantById(id: number) {
    const rows = await this.db.select().from(schema.tenant).where(eq(schema.tenant.id, BigInt(id))).limit(1);
    return rows[0];
  }

  async updateTenant(id: number, input: UpdateCustomerProfileInput) {
    const updates: any = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.phone !== undefined) updates.phone = input.phone;
    
    if (Object.keys(updates).length > 0) {
      const res = await this.db.update(schema.tenant).set(updates).where(eq(schema.tenant.id, BigInt(id))).returning();
      return res[0];
    }
    return this.getTenantById(id);
  }
}
// @ts-nocheck
// @ts-nocheck
