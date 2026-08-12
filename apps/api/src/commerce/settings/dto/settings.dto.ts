// @ts-nocheck
import { UpdateSettingsRequest } from '../types/settings.types.js';

export function parseUpdateSettingsRequest(body: any): UpdateSettingsRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const id = BigInt(body.id);
  if (isNaN(Number(id))) {
      throw new Error('id must be a valid number');
  }

  const attributeValue = body.attributeValue;
  if (attributeValue === undefined || attributeValue === null) {
      throw new Error('attributeValue is required');
  }

  const attributeLink = typeof body.attributeLink === 'string' ? body.attributeLink : '';

  return {
    id,
    attributeValue,
    attributeLink,
  };
}
// @ts-nocheck
// @ts-nocheck
