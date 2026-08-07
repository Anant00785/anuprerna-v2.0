import { Injectable } from "@nestjs/common";
import { CatalogPdfRepository } from "../repository/catalog-pdf.repository.js";

@Injectable()
export class CatalogPdfService {
  constructor(private readonly catalogPdfRepository: CatalogPdfRepository) {}
}