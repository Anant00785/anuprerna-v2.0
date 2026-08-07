import { Injectable } from "@nestjs/common";
import { FaqRepository } from "../repository/faq.repository.js";
import { FaqInput } from "../dto/faq.dto.js";

@Injectable()
export class FaqService {
    constructor(private readonly faqRepository: FaqRepository) {}

    async retrieveFaqList() {
        return await this.faqRepository.retrieveFaqList();
    }

    async retrieveFaqById(id: bigint) {
        return await this.faqRepository.retrieveFaqById(id);
    }

    async retrieveFaqData(page: number, size: number) {
        return await this.faqRepository.retrieveFaqData(page, size);
    }

    async retrieveFaqDataById(id: bigint) {
        return await this.faqRepository.retrieveFaqDataById(id);
    }

    async retrieveFaqQuestionData(page: number, size: number) {
        return await this.faqRepository.retrieveFaqQuestionData(page, size);
    }

    async retrieveFaqQuestionDataById(id: bigint) {
        return await this.faqRepository.retrieveFaqQuestionDataById(id);
    }

    async createNewFaq(faqInput: FaqInput): Promise<boolean> {
        return await this.faqRepository.createNewFaq(faqInput);
    }

    async updateExistingFaq(faqInput: FaqInput): Promise<boolean> {
        return await this.faqRepository.updateExistingFaq(faqInput);
    }
}
