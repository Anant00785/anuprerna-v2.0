// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { MaterialRepository } from '../repository/material.repository.js';
import { simpleResponse, keyedResponse } from '../../../common/response/rain-response.js';
import { mapMaterialEntityToOutput } from '../mapper/material.mapper.js';
import { validateAddMaterial } from '../validators/material.validator.js';
import { sanitizeMaterialName } from '../validators/material.sanitizer.js';

@Injectable()
export class MaterialService {
  constructor(private readonly repository: MaterialRepository) {}

  async getList() {
    const items = await this.repository.findAll();
    return keyedResponse('materialList', items.map(mapMaterialEntityToOutput));
  }

  async add(data: any) {
    validateAddMaterial(data);
    data.name = sanitizeMaterialName(data.name);
    const created = await this.repository.create(data);
    return keyedResponse('material', mapMaterialEntityToOutput(created));
  }

  async update(data: any) {
    validateAddMaterial(data);
    data.name = sanitizeMaterialName(data.name);
    const { id, ...updateData } = data;
    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      return simpleResponse(false, 'Not found');
    }
    return keyedResponse('material', mapMaterialEntityToOutput(updated));
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
    return keyedResponse('data', items.map(mapMaterialEntityToOutput));
  }

  async getTableExplorerDataById(id: string) {
    const item = await this.repository.findById(BigInt(id));
    if (!item) {
      return simpleResponse(false, 'Not found');
    }
    return keyedResponse('material', mapMaterialEntityToOutput(item));
  }
}
// @ts-nocheck
