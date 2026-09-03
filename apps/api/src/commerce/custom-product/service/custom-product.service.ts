import { Injectable } from "@nestjs/common";
import { CustomProductRepository } from "../repository/custom-product.repository.js";
import type { CustomProductInput } from "../dto/custom-product.dto.js";

@Injectable()
export class CustomProductService {
  constructor(private readonly repo: CustomProductRepository) {}

  getCustomProduct(id: number) {
    return this.repo.findById(id);
  }

  getCustomProducts() {
    return this.repo.findAll();
  }

  async addCustomProduct(input: CustomProductInput) {
    return !!(await this.repo.insert(input));
  }

  async updateCustomProduct(id: number, input: CustomProductInput) {
    return !!(await this.repo.update(id, input));
  }
}
