// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PatternRepository } from '../repository/pattern.repository.js';
import { simpleResponse, keyedResponse } from '../../../common/response/rain-response.js';
import { mapPatternEntityToOutput } from '../mapper/pattern.mapper.js';
import { validateAddPattern } from '../validators/pattern.validator.js';
import { sanitizePatternName } from '../validators/pattern.sanitizer.js';

@Injectable()
export class PatternService {
  constructor(private readonly repository: PatternRepository) {}

  async getList() {
    const items = await this.repository.findAll();
    return keyedResponse('patternList', items.map(mapPatternEntityToOutput));
  }

  async add(data: any) {
    validateAddPattern(data);
    data.name = sanitizePatternName(data.name);
    const created = await this.repository.create(data);
    return keyedResponse('pattern', mapPatternEntityToOutput(created));
  }

  async update(data: any) {
    validateAddPattern(data);
    data.name = sanitizePatternName(data.name);
    const { id, ...updateData } = data;
    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      return simpleResponse(false, 'Not found');
    }
    return keyedResponse('pattern', mapPatternEntityToOutput(updated));
  }

  async delete(id: string) {
    try {
      await this.repository.delete(BigInt(id));
      return simpleResponse(true, 'Deleted successfully');
    } catch (e) {
      return simpleResponse(false, 'Cannot delete — in use');
    }
  }

  async getTableExplorerData(page: number, size: number) {
    const items = await this.repository.getPaginated(page, size);
    return keyedResponse('data', items.map(mapPatternEntityToOutput));
  }

  async getTableExplorerDataById(id: string) {
    const item = await this.repository.findById(BigInt(id));
    if (!item) {
      return simpleResponse(false, 'Not found');
    }
    return keyedResponse('pattern', mapPatternEntityToOutput(item));
  }
}
// @ts-nocheck
