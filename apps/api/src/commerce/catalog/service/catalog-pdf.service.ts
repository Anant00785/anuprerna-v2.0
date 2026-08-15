// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { CatalogPdfRepository } from "../repository/catalog-pdf.repository.js";

@Injectable()
export class CatalogPdfService {
  constructor(private readonly catalogPdfRepository: CatalogPdfRepository) {}

  async findById(id: bigint) {
    const row = await this.catalogPdfRepository.findById(id);
    if (!row) {
      throw new NotFoundException("Catalog PDF was not found.");
    }
    return row;
  }

  async findAll() {
    return await this.catalogPdfRepository.findAll();
  }

  async findByArtisan(artisanId: bigint | number) {
    return await this.catalogPdfRepository.findByArtisan(BigInt(artisanId || 0));
  }

  async create(artisanId: bigint | number, body?: unknown) {
    return await this.catalogPdfRepository.create(BigInt(artisanId || 0), body);
  }
}
