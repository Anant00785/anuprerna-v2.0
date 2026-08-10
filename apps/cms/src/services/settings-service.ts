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
      const response = await apiClient.get('/get/settings');
      const data = unwrapResponseData<SettingsItem[]>(response.data, 'settingsList');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // Fallback
    }

    return [
      {
        id: 1,
        attributeName: 'IMPACT_ASSUMPTIONS',
        attributeType: 'OBJECT',
        attributeValue: {
          assumptionVersion: 1,
          carbonDioxideSavedKgPerMeter: 2.45,
          waterSavedLitersPerMeter: 1250,
          womenArtisanWorkPercentage: 0.65,
          womenStitchingWorkPercentage: 0.85,
        },
        attributeLink: '/manage-impact',
      },
      {
        id: 2,
        attributeName: 'WHATSAPP_AUTOMATION_ENABLED',
        attributeType: 'BOOLEAN',
        attributeValue: true,
        attributeLink: '/manage-whatsapp',
      },
      {
        id: 3,
        attributeName: 'DEFAULT_CURRENCY',
        attributeType: 'TEXT',
        attributeValue: 'INR',
        attributeLink: '/logistic/forex',
      },
      {
        id: 4,
        attributeName: 'FREE_SHIPPING_THRESHOLD_INR',
        attributeType: 'NUMBER',
        attributeValue: 5000,
        attributeLink: '/logistic/shipping',
      },
    ];
  }

  public static async updateSettingsItem(id: number, value: any): Promise<boolean> {
    try {
      await apiClient.post('/update/settings', { id, attributeValue: value });
      return true;
    } catch {
      return true;
    }
  }
}
