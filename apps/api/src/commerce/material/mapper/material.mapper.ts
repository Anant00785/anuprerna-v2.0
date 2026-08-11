import { MaterialOutput } from '../types/material.types.js';

export function mapMaterialEntityToOutput(entity: any): MaterialOutput {
  return {
    id: entity.id.toString(),
    name: entity.name,
    timeOfCreation: entity.timeOfCreation,
  };
}
