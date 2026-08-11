import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { CatalogRepository, type CatalogListResult } from "./repository/catalog.repository.js";

@Injectable()
export class CatalogService {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  async findAll(limit: number, offset: number): Promise<CatalogListResult> {
    try {
      return await this.catalogRepository.findAll(limit, offset);
    } catch (error) {
      throw new InternalServerErrorException("Failed to fetch catalogs from the database.");
    }
  }

  async findById(id: number) {
    const row = await this.catalogRepository.findById(BigInt(id));
    if (!row) {
      throw new NotFoundException("Catalog was not found.");
    }
    return row;
  }
}

