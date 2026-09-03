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
    try {
      const created = await this.repository.create({ name: data.name });
      return keyedResponse('material', mapMaterialEntityToOutput(created));
    } catch (e: any) {
      if (e.code === '23505') {
        return simpleResponse(false, 'Material with this name already exists.');
      }
      return simpleResponse(false, e.message || 'Failed to add material');
    }
  }

  async update(data: any) {
    if (!data.id) {
      return simpleResponse(false, 'Material ID is required.');
    }
    validateAddMaterial(data);
    data.name = sanitizeMaterialName(data.name);
    try {
      const updated = await this.repository.update(BigInt(data.id), { name: data.name });
      if (!updated) {
        return simpleResponse(false, 'Not found');
      }
      return keyedResponse('material', mapMaterialEntityToOutput(updated));
    } catch (e: any) {
      if (e.code === '23505') {
        return simpleResponse(false, 'Material with this name already exists.');
      }
      return simpleResponse(false, e.message || 'Failed to update material');
    }
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
