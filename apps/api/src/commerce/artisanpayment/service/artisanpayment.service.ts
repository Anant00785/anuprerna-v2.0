import { Injectable } from "@nestjs/common";
import { ArtisanPaymentRepository } from "../repository/artisanpayment.repository.js";

@Injectable()
export class ArtisanPaymentService {
  constructor(private readonly repo: ArtisanPaymentRepository) {}

  async getAllRecords(page = 0, size = 50) {
    return this.repo.findAllRecords(page, size);
  }

  async getRecordById(id: bigint) {
    return this.repo.findRecordById(id);
  }

  async getRecordsByArtisan(artisanId: bigint, page = 0, size = 50) {
    return this.repo.findByArtisanId(artisanId, page, size);
  }

  async createPaymentRecord(data: any) {
    return this.repo.createRecord(data);
  }

  async updateStatus(id: bigint, status: string) {
    return this.repo.updateRecordStatus(id, status);
  }

  async getIncentiveConfigs() {
    return this.repo.findIncentiveConfig();
  }
}
