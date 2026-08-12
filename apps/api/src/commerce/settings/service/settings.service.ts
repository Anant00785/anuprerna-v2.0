// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { SettingsRepository } from '../repository/settings.repository.js';
import { SettingsDTO, UpdateSettingsRequest } from '../types/settings.types.js';

@Injectable()
export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async getAllSettings(): Promise<SettingsDTO[]> {
    return this.settingsRepository.findAll();
  }

  async getSettingById(id: bigint): Promise<SettingsDTO | null> {
    return this.settingsRepository.findById(id);
  }

  async updateSettings(request: UpdateSettingsRequest): Promise<SettingsDTO> {
    const existing = await this.settingsRepository.findById(request.id);
    if (!existing) {
        throw new Error('Setting not found');
    }
    return this.settingsRepository.updateSettings(request.id, request.attributeValue, request.attributeLink);
  }

  async getPaginatedSettings(page: number, size: number): Promise<SettingsDTO[]> {
    return this.settingsRepository.getPaginatedSettings(page, size);
  }
}
// @ts-nocheck
