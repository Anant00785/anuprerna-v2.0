/**
 * Artisans / Skills / Catalog domain types — Milestone: Relationships cluster.
 *
 * Normalized (flat) shapes derived from the Loom backend. The live Loom
 * artisan record nests identity fields under a `tenant` object; we flatten
 * them to top-level here (mirrors the Angular ArtisanTransmissionService
 * normalize logic) so the UI can read `artisan.name` directly.
 */

export type ArtisanRole = "MASTER" | "WORKER";
export type Gender = "MALE" | "FEMALE" | "OTHER" | "UNDEFINED";

export interface SkillRef {
  id: number;
  name: string;
}

export interface ArtisanRow {
  id: number;
  name: string;
  contactNumber: string;
  artisanRole: ArtisanRole;
  masterArtisanId: number | null;
  masterArtisanName: string;
  skills: SkillRef[];
  skillIds: number[];
  gender: Gender;
  dob: number;
  hasWhatsapp: boolean;
  state: string;
  district: string;
  villageTown: string;
  postalCode: string;
  expertise: string;
  experience: number;
  catalogCount: number;
  hasBankAccount: boolean;
  bankName: string;
  accountHolderName: string;
  ifscCode: string;
  active: boolean;
  timeOfCreation: number;
}

export interface SkillRow {
  id: number;
  name: string;
  description: string;
  deleted: boolean;
  timeOfCreation: number;
  lastUpdateTime: number;
}

export interface CatalogItemMedia {
  id: number;
  mediaUrl: string;
  mediaType: string;
  altText: string;
  hero: boolean;
}

export interface CatalogItemRow {
  id: number;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  unit: string;
  description: string;
  media: CatalogItemMedia[];
}

export interface ArtisanCatalogRow {
  id: number;
  name: string;
  description: string;
  artisanId: number;
  artisanName: string;
  artisanState: string;
  defaultCatalog: boolean;
  createdAt: number;
  updatedAt: number;
  items: CatalogItemRow[];
  itemCount: number;
  imageCount: number;
}
