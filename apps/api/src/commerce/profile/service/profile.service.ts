import { Injectable } from '@nestjs/common';
import { ProfileRepository } from '../repository/profile.repository.js';
import {
  AddSizeProfileInput,
  UpdateSizeProfileInput,
  AddBadgeProfileInput,
  UpdateBadgeProfileInput,
  AddMadeToOrderProfileInput,
  UpdateMadeToOrderProfileInput,
  UpdateCustomerProfileInput,
} from '../types/profile.types.js';
import {
  mapSizeProfile,
  mapSizeProfileOption,
  mapSizeProfileGuide,
  mapBadgeProfile,
  mapBadgeProfileItem,
  mapMadeToOrderProfile,
  mapTenantProfile,
} from '../mapper/profile.mapper.js';
import { simpleResponse, keyedResponse } from '../../../common/response/rain-response.js';

@Injectable()
export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  // Size Profile
  async getSizeProfileList() {
    const profiles = await this.repository.getSizeProfiles();
    return keyedResponse('data', profiles.map(mapSizeProfile));
  }

  async getSizeProfile(id: number) {
    const profile = await this.repository.getSizeProfileById(id);
    if (!profile) return simpleResponse(false, 'Size profile not found');
    return keyedResponse('data', mapSizeProfile(profile));
  }

  async addSizeProfile(input: AddSizeProfileInput, file: any) {
    // Assuming file upload logic is handled here or externally
    const imageUrl = file ? `https://s3.dummy.url/${file.filename}` : '';
    const profile = await this.repository.createSizeProfile(input, imageUrl);
    return keyedResponse('data', mapSizeProfile(profile));
  }

  async updateSizeProfile(id: number, input: UpdateSizeProfileInput) {
    const profile = await this.repository.updateSizeProfile(id, input);
    return keyedResponse('data', mapSizeProfile(profile));
  }

  async deleteSizeProfile(id: number) {
    await this.repository.deleteSizeProfile(id);
    return simpleResponse(true, 'Size profile deleted successfully');
  }

  async exploreSizeProfile(page: number, size: number) {
    const data = await this.repository.paginateSizeProfile(page, size);
    return keyedResponse('data', data.map(mapSizeProfile));
  }
  async exploreSizeProfileById(id: number) {
    const profile = await this.repository.getSizeProfileById(id);
    return keyedResponse('data', mapSizeProfile(profile));
  }

  async exploreSizeProfileGuide(page: number, size: number) {
    const data = await this.repository.paginateSizeProfileGuide(page, size);
    return keyedResponse('data', data.map(mapSizeProfileGuide));
  }

  async exploreSizeProfileOption(page: number, size: number) {
    const data = await this.repository.paginateSizeProfileOption(page, size);
    return keyedResponse('data', data.map(mapSizeProfileOption));
  }

  // Badge Profile
  async getBadgeProfileList() {
    const profiles = await this.repository.getBadgeProfiles();
    return keyedResponse('data', profiles.map(mapBadgeProfile));
  }

  async getBadgeProfile(id: number) {
    const profile = await this.repository.getBadgeProfileById(id);
    if (!profile) return simpleResponse(false, 'Badge profile not found');
    return keyedResponse('data', mapBadgeProfile(profile));
  }

  async addBadgeProfile(input: AddBadgeProfileInput) {
    const profile = await this.repository.createBadgeProfile(input);
    return keyedResponse('data', mapBadgeProfile(profile));
  }

  async updateBadgeProfile(id: number, input: UpdateBadgeProfileInput) {
    const profile = await this.repository.updateBadgeProfile(id, input);
    return keyedResponse('data', mapBadgeProfile(profile));
  }

  async deleteBadgeProfile(id: number) {
    await this.repository.deleteBadgeProfile(id);
    return simpleResponse(true, 'Badge profile deleted successfully');
  }

  async exploreBadgeProfile(page: number, size: number) {
    const data = await this.repository.paginateBadgeProfile(page, size);
    return keyedResponse('data', data.map(mapBadgeProfile));
  }

  async exploreBadgeProfileItem(page: number, size: number) {
    const data = await this.repository.paginateBadgeProfileItem(page, size);
    return keyedResponse('data', data.map(mapBadgeProfileItem));
  }

  // Made To Order Profile
  async getMadeToOrderProfileList() {
    const profiles = await this.repository.getMadeToOrderProfiles();
    return keyedResponse('data', profiles.map(mapMadeToOrderProfile));
  }

  async getMadeToOrderProfile(id: number) {
    const profile = await this.repository.getMadeToOrderProfileById(id);
    if (!profile) return simpleResponse(false, 'Profile not found');
    return keyedResponse('data', mapMadeToOrderProfile(profile));
  }

  async addMadeToOrderProfile(input: AddMadeToOrderProfileInput) {
    const profile = await this.repository.createMadeToOrderProfile(input);
    return keyedResponse('data', mapMadeToOrderProfile(profile));
  }

  async updateMadeToOrderProfile(input: UpdateMadeToOrderProfileInput) {
    const profile = await this.repository.updateMadeToOrderProfile(input.id, input);
    return keyedResponse('data', mapMadeToOrderProfile(profile));
  }

  async deleteMadeToOrderProfile(id: number) {
    await this.repository.deleteMadeToOrderProfile(id);
    return simpleResponse(true, 'Profile deleted successfully');
  }

  async exploreMadeToOrderProfile(page: number, size: number) {
    const data = await this.repository.paginateMadeToOrderProfile(page, size);
    return keyedResponse('data', data.map(mapMadeToOrderProfile));
  }

  // Tenant Profile
  async getSuperUserProfiles() {
    const tenants = await this.repository.getAllTenants();
    return keyedResponse('data', tenants.map(mapTenantProfile));
  }

  async getTenantProfile(id: number) {
    const tenant = await this.repository.getTenantById(id);
    if (!tenant) return simpleResponse(false, 'Tenant not found');
    return keyedResponse('data', mapTenantProfile(tenant));
  }

  async updateCustomerProfile(id: number, input: UpdateCustomerProfileInput) {
    const tenant = await this.repository.updateTenant(id, input);
    return keyedResponse('data', mapTenantProfile(tenant));
  }
}
