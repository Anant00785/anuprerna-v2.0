import { SettingsDTO, SettingsAttributeEnum, SettingsAttributeTypeEnum } from '../types/settings.types.js';

export function mapSettingsRowToDTO(row: any): SettingsDTO {
  return {
    id: row.id,
    version: row.version,
    attributeName: row.attributeName as SettingsAttributeEnum,
    attributeType: row.attributeType as SettingsAttributeTypeEnum,
    attributeValue: row.attributeValue,
    attributeLink: row.attributeLink,
  };
}

export function mapSettingsRowListToDTOList(rows: any[]): SettingsDTO[] {
  return rows.map(mapSettingsRowToDTO);
}
