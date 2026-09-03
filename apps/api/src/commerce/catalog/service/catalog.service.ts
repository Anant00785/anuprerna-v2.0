import { Injectable } from "@nestjs/common";
import { CatalogRepository } from "../repository/catalog.repository.js";

@Injectable()
export class CatalogService {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  async findById(id: bigint | number) {
    return await this.catalogRepository.findById(id);
  }

  async findAll(limit = 100, offset = 0) {
    return await this.catalogRepository.findAll(limit, offset);
  }

  async findByArtisan(artisanId: bigint | number) {
    return await this.catalogRepository.findByArtisan(artisanId);
  }

  async findRecent(limit = 10) {
    return await this.catalogRepository.findRecent(limit);
  }

  async create(body: unknown) {
    return await this.catalogRepository.create(body);
  }

  async update(body: unknown) {
    return await this.catalogRepository.update(body);
  }

  async delete(id: bigint | number) {
    return await this.catalogRepository.delete(id);
  }
}
