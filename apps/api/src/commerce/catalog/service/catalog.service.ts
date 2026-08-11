// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { ActionCode } from "../../../common/errors/action-code.js";
import { CatalogRepository } from "../repository/catalog.repository.js";

@Injectable()
export class CatalogService {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  async findById(id: bigint) {
    return await this.catalogRepository.findById(id);
  }

  async findAll() {
    return await this.catalogRepository.findAll();
  }

  async findByArtisan(artisanId: bigint) {
    return await this.catalogRepository.findByArtisan(artisanId);
  }

  async findRecent(limit: number) {
    return await this.catalogRepository.findRecent(limit);
  }

  async create(body: unknown) {}
  async update(body: unknown) {}
  async delete(id: bigint) {}
}
// @ts-nocheck
