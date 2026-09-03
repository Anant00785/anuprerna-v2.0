export enum SettingsAttributeEnum {
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  SWATCH_PRICE_PERCENTAGE = 'SWATCH_PRICE_PERCENTAGE',
  FABRIC_SITE_NOTIFICATION = 'FABRIC_SITE_NOTIFICATION',
  CRAFT_SITE_NOTIFICATION = 'CRAFT_SITE_NOTIFICATION',
}

export enum SettingsAttributeTypeEnum {
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  TEXT = 'TEXT',
}

export interface SettingsDTO {
  id: bigint;
  version: bigint;
  attributeName: SettingsAttributeEnum;
  attributeType: SettingsAttributeTypeEnum;
  attributeValue: any;
  attributeLink: string;
}

export interface UpdateSettingsRequest {
  id: bigint;
  attributeValue: any;
  attributeLink: string;
}
