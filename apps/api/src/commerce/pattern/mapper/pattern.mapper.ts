import { PatternOutput } from '../types/pattern.types.js';

export function mapPatternEntityToOutput(entity: any): PatternOutput {
  return {
    id: entity.id.toString(),
    name: entity.name,
    timeOfCreation: entity.timeOfCreation,
  };
}
