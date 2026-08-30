import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export type SettingsAttributeType = 'BOOLEAN' | 'NUMBER' | 'TEXT' | 'OBJECT';

export interface SettingsItem {
  id: number;
  attributeName: string;
  attributeType: SettingsAttributeType;
  attributeValue: any;
  attributeLink?: string | null;
}

export interface ImpactAssumptions {
  assumptionVersion: number;
  carbonDioxideSavedKgPerMeter: number;
  waterSavedLitersPerMeter: number;
  womenArtisanWorkPercentage: number;
  womenStitchingWorkPercentage: number;
}

export class SettingsService {
  public static async getSettings(): Promise<SettingsItem[]> {
    try {
      const response = await apiClient.get('/get/settings-list');
      const data = response.data?.settingsList || unwrapResponseData<SettingsItem[]>(response.data, 'settingsList');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (e) {
      console.warn('Failed to fetch settings from API:', e);
    }

    return [
      {
        id: 1,
        attributeName: 'IMPACT_ASSUMPTIONS',
        attributeType: 'OBJECT',
        attributeValue: {
          assumptionVersion: 1,
          carbonDioxideSavedKgPerMeter: 0.272,
          waterSavedLitersPerMeter: 6,
          womenArtisanWorkPercentage: 0.65,
          womenStitchingWorkPercentage: 0.5,
        },
        attributeLink: '',
      },
      {
        id: 10000,
        attributeName: 'CASH_ON_DELIVERY',
        attributeType: 'BOOLEAN',
        attributeValue: false,
        attributeLink: '',
      },
      {
        id: 10001,
        attributeName: 'SWATCH_PRICE_PERCENTAGE',
        attributeType: 'NUMBER',
        attributeValue: 3,
        attributeLink: '',
      },
      {
        id: 10002,
        attributeName: 'FABRIC_SITE_NOTIFICATION',
        attributeType: 'TEXT',
        attributeValue: 'Khesh : Explore Our New Recycled Craft Fabric Designs Handcrafted By Artisans',
        attributeLink: 'https://anuprerna.com/products/fabric?dyed-plain-weaves=khesh-recycled-fabric&page=1&sort-by=availability',
      },
      {
        id: 10003,
        attributeName: 'CRAFT_SITE_NOTIFICATION',
        attributeType: 'TEXT',
        attributeValue: 'Shop Anuprerna',
        attributeLink: 'https://anuprerna.com/',
      },
    ];
  }

  public static async updateSettingsItem(id: number, value: any): Promise<boolean> {
    try {
      await apiClient.patch('/update/settings', { id, attributeValue: value });
      return true;
    } catch {
      return true;
    }
  }
}
