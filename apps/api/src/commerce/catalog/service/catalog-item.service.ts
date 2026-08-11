// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { CatalogItemRepository } from "../repository/catalog-item.repository.js";

@Injectable()
export class CatalogItemService {
  constructor(private readonly catalogItemRepository: CatalogItemRepository) {}

  async findById(id: bigint) {
    const row = await this.catalogItemRepository.findById(id);
    if (!row) {
      throw new NotFoundException("Catalog item was not found.");
    }
    return row;
  }

  async findAll() {
    return await this.catalogItemRepository.findAll();
  }

  async create(body: unknown) {}
  async update(body: unknown) {}
  async delete(id: bigint) {}
}
// @ts-nocheck
