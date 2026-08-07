import { Injectable } from "@nestjs/common";
import { CatalogItemRepository } from "../repository/catalog-item.repository.js";

@Injectable()
export class CatalogItemService {
  constructor(private readonly catalogItemRepository: CatalogItemRepository) {}

  async findById(id: bigint) {
    return await this.catalogItemRepository.findById(id);
  }

  async findAll() {
    return await this.catalogItemRepository.findAll();
  }

  async create(body: unknown) {}
  async update(body: unknown) {}
  async delete(id: bigint) {}
}