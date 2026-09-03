import { Injectable } from "@nestjs/common";
import { ForexRepository } from "../repository/forex.repository.js";

@Injectable()
export class ForexService {
  constructor(private readonly repo: ForexRepository) {}

  async getAllExchangeRates() {
    return this.repo.findAllExchangeRates();
  }

  async getLatestExchangeRate() {
    return this.repo.findLatestExchangeRate();
  }

  async getExchangeRateByCode(code: string) {
    return this.repo.findExchangeRateByCode(code);
  }

  async updateExchangeRate(code: string, rate: number, symbol?: string) {
    return this.repo.upsertExchangeRate(code, rate, symbol);
  }

  async getAllForexRecords() {
    return this.repo.findAllForexRecords();
  }
}
