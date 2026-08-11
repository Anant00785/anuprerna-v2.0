// @ts-nocheck
import { UpdateSettingsRequest } from '../types/settings.types.js';

export function validateUpdateSettingsRequest(request: UpdateSettingsRequest): string | null {
  if (!request.id) return 'Settings ID is required';
  if (!request.attributeValue) return 'Attribute Value is required';
  return null;
}
// @ts-nocheck
// @ts-nocheck
