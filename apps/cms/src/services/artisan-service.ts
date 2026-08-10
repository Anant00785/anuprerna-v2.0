import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export interface ArtisanSkill {
  id?: number;
  name: string;
  description?: string;
  [key: string]: any;
}

export interface ArtisanTenant {
  uid?: string;
  name?: string;
  email?: string;
  contactNumber?: string;
  gender?: string;
  active?: boolean;
  creationTime?: number;
  dob?: number;
  [key: string]: any;
}

export interface Artisan {
  id: number;
  artisanId?: number;
  name: string;
  contactNumber: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNDEFINED' | string;
  artisanRole: 'MASTER' | 'WORKER';
  active: boolean;
  hasWhatsapp?: boolean;
  masterArtisanId?: number | null;
  masterArtisan?: Artisan | null;
  state?: string;
  district?: string;
  villageTown?: string;
  postalCode?: string;
  expertise?: string;
  experience?: number;
  catalogCount?: number;
  dob?: number | string | null;
  hasBankAccount?: boolean;
  bankName?: string;
  accountHolderName?: string;
  ifscCode?: string;
  skills?: ArtisanSkill[];
  skillIds?: number[];
  tenant?: ArtisanTenant;
  timeOfCreation?: number;
  [key: string]: any;
}

export interface CreateArtisanRequest {
  name: string;
  contactNumber: string;
  artisanRole: 'MASTER' | 'WORKER';
  masterArtisanId?: number | null;
  skillIds?: number[];
  gender?: string | null;
  dob?: number | string | null;
  hasWhatsapp?: boolean;
  state?: string | null;
  district?: string | null;
  villageTown?: string | null;
  postalCode?: string | null;
  expertise?: string | null;
  experience?: number;
  hasBankAccount?: boolean;
  bankName?: string | null;
  accountHolderName?: string | null;
  ifscCode?: string | null;
  active?: boolean;
  [key: string]: any;
}

export interface UpdateArtisanRequest extends CreateArtisanRequest {
  id: number;
}

export class ArtisanService {
  public static coerceDob(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (value instanceof Date) return value.getTime();
    const asString = String(value).trim();
    const ddmmyyyy = asString.replace(/^(\d{2})\/(\d{2})\/(\d{4})$/, '$2/$1/$3');
    const parsed = Date.parse(ddmmyyyy);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private static normalizeArtisan(input: any): Artisan {
    if (!input || typeof input !== 'object') return input as Artisan;

    const tenant = input.tenant ?? {};
    const id = input.id ?? input.artisanId ?? 0;
    const name = input.name ?? tenant.name ?? '';
    const contactNumber = input.contactNumber ?? tenant.contactNumber ?? '';
    const active = input.active ?? tenant.active ?? false;
    const gender = input.gender ?? tenant.gender ?? 'UNDEFINED';
    const artisanRole = input.artisanRole ?? 'WORKER';
    const catalogCount = typeof input.catalogCount === 'number' ? input.catalogCount : 0;
    const hasWhatsapp = Boolean(input.hasWhatsapp ?? input.whatsappNumber ?? false);
    const dob = input.dob ?? tenant.dob ?? null;

    return {
      ...input,
      id,
      name,
      contactNumber,
      active,
      gender,
      artisanRole,
      catalogCount,
      hasWhatsapp,
      dob,
      state: input.state || '',
      district: input.district || '',
      villageTown: input.villageTown || '',
      skills: Array.isArray(input.skills) ? input.skills : [],
      skillIds: Array.isArray(input.skillIds)
        ? input.skillIds
        : Array.isArray(input.skills)
        ? input.skills.map((s: any) => s.id).filter((x: any) => typeof x === 'number')
        : [],
    };
  }

  public static async getArtisans(includeInactive: boolean = true): Promise<Artisan[]> {
    const response = await apiClient.get(`/get/artisans?includeInactive=${includeInactive}`);
    const rawList = unwrapResponseData<any[]>(response.data, 'artisanList');
    if (!Array.isArray(rawList)) return [];
    return rawList.map(item => this.normalizeArtisan(item));
  }

  public static async getArtisanById(id: string | number): Promise<Artisan> {
    const response = await apiClient.get(`/get/artisan/${id}`);
    const raw = unwrapResponseData<any>(response.data, 'artisan');
    return this.normalizeArtisan(raw);
  }

  public static async getWorkersOfMaster(masterId: string | number): Promise<Artisan[]> {
    const response = await apiClient.get(`/get/artisan/${masterId}/workers`);
    const rawList = unwrapResponseData<any[]>(response.data, 'artisanList');
    if (!Array.isArray(rawList)) return [];
    return rawList.map(item => this.normalizeArtisan(item));
  }

  public static async createArtisan(payload: CreateArtisanRequest): Promise<any> {
    const coercedDob = this.coerceDob(payload.dob);
    const { name, contactNumber, gender, active, dob, ...rest } = payload;

    const payloadToSend = {
      ...rest,
      tenant: {
        name: name ?? '',
        contactNumber: contactNumber ?? '',
        gender: gender ?? 'UNDEFINED',
        dob: coercedDob,
        active: active ?? true,
      },
    };

    const response = await apiClient.post('/add/artisan', payloadToSend);
    return response.data;
  }

  public static async updateArtisan(payload: UpdateArtisanRequest): Promise<any> {
    const coercedDob = this.coerceDob(payload.dob);
    const payloadToSend = {
      id: payload.id,
      artisanRole: payload.artisanRole,
      masterArtisanId: payload.artisanRole === 'WORKER' ? payload.masterArtisanId ?? null : null,
      hasWhatsapp: !!payload.hasWhatsapp,
      state: payload.state || null,
      district: payload.district || null,
      villageTown: payload.villageTown || null,
      postalCode: payload.postalCode || null,
      expertise: payload.expertise || null,
      experience: payload.experience || 0,
      hasBankAccount: !!payload.hasBankAccount,
      bankName: payload.bankName || null,
      accountHolderName: payload.accountHolderName || null,
      ifscCode: payload.ifscCode || null,
      skillIds: payload.skillIds || [],
      tenant: {
        name: payload.name ?? '',
        contactNumber: payload.contactNumber ?? '',
        gender: payload.gender ?? 'UNDEFINED',
        dob: coercedDob,
        active: payload.active ?? true,
      },
    };

    const response = await apiClient.post('/update/artisan', payloadToSend);
    return response.data;
  }

  public static async deleteArtisan(artisanId: number): Promise<any> {
    const response = await apiClient.delete(`/delete/artisan/${artisanId}`);
    return response.data;
  }

  public static async getSkills(): Promise<ArtisanSkill[]> {
    const response = await apiClient.get('/get/skills');
    return unwrapResponseData<ArtisanSkill[]>(response.data, 'skillList');
  }

  public static async getCatalogs(): Promise<any[]> {
    const response = await apiClient.get('/get/catalog-list');
    return unwrapResponseData<any[]>(response.data, 'catalogList');
  }

  public static async getCatalogListByArtisan(artisanId: string | number): Promise<any[]> {
    const response = await apiClient.get(`/get/catalog-list/artisan/${artisanId}`);
    return unwrapResponseData<any[]>(response.data, 'catalogList');
  }

  public static async getCatalogById(id: string | number): Promise<any> {
    const response = await apiClient.get(`/get/catalog/${id}`);
    return unwrapResponseData(response.data, 'catalog');
  }
}
