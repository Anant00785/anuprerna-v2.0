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
}
// @ts-nocheck
