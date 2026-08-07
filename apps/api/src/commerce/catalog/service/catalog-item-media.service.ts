import { Injectable } from "@nestjs/common";
import { CatalogItemMediaRepository } from "../repository/catalog-item-media.repository.js";

@Injectable()
export class CatalogItemMediaService {
  constructor(private readonly catalogItemMediaRepository: CatalogItemMediaRepository) {}

  async create(body: unknown) {}
  async delete(id: bigint) {}
}