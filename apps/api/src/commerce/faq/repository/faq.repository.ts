// @ts-nocheck
import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { FaqInput } from "../dto/faq.dto.js";

@Injectable()
export class FaqRepository {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
    ) {}

    async retrieveFaqList() {
        const faqs = await this.db.select().from(schema.faq);
        if (faqs.length === 0) return [];

        const faqIds = faqs.map(f => f.id);
        const questions = await this.db.select().from(schema.faqQuestion).where(inArray(schema.faqQuestion.faqId, faqIds));

        return faqs.map(f => {
            return {
                ...f,
                faqQuestionList: questions.filter(q => q.faqId === f.id)
            };
        });
    }

    async retrieveFaqById(id: bigint) {
        const rows = await this.db.select().from(schema.faq).where(eq(schema.faq.id, id));
        const faq = rows[0] ?? null;

        if (!faq) return null;

        const questions = await this.db.select().from(schema.faqQuestion).where(eq(schema.faqQuestion.faqId, faq.id));

        return {
            ...faq,
            faqQuestionList: questions
        };
    }

    async retrieveFaqData(page: number, size: number) {
        return this.db.select({
            id: schema.faq.id,
            version: schema.faq.version,
            storyContentId: schema.faq.storyContentId,
            blogContentId: schema.faq.blogContentId,
            heading: schema.faq.heading,
            timeOfCreation: schema.faq.timeOfCreation
        }).from(schema.faq).limit(size).offset(page * size);
    }

    async retrieveFaqDataById(id: bigint) {
        const rows = await this.db.select({
            id: schema.faq.id,
            version: schema.faq.version,
            storyContentId: schema.faq.storyContentId,
            blogContentId: schema.faq.blogContentId,
            heading: schema.faq.heading,
            timeOfCreation: schema.faq.timeOfCreation
        }).from(schema.faq).where(eq(schema.faq.id, id));
        return rows[0] ?? null;
    }

    async createNewFaq(faqInput: FaqInput): Promise<boolean> {
        return await this.db.transaction(async (tx) => {
            const timeOfCreation = faqInput.timeOfCreation || Date.now();
            
            const insertedFaqs = await tx.insert(schema.faq).values({
                heading: faqInput.heading,
                storyContentId: faqInput.storyContentId,
                blogContentId: faqInput.blogContentId,
                timeOfCreation: timeOfCreation
            }).returning({ id: schema.faq.id });

            const newFaqId = insertedFaqs[0].id;

            if (faqInput.faqQuestionList && faqInput.faqQuestionList.length > 0) {
                const questionsToInsert = faqInput.faqQuestionList.map(q => ({
                    faqId: newFaqId,
                    question: q.question,
                    answer: q.answer,
                    timeOfCreation: timeOfCreation
                }));

                await tx.insert(schema.faqQuestion).values(questionsToInsert);
            }
            return true;
        });
    }

    async updateExistingFaq(faqInput: FaqInput): Promise<boolean> {
        if (!faqInput.id) return false;

        return await this.db.transaction(async (tx) => {
            await tx.update(schema.faq)
                .set({ heading: faqInput.heading })
                .where(eq(schema.faq.id, faqInput.id!));

            await tx.delete(schema.faqQuestion).where(eq(schema.faqQuestion.faqId, faqInput.id!));

            if (faqInput.faqQuestionList && faqInput.faqQuestionList.length > 0) {
                const timeOfCreation = Date.now();
                const questionsToInsert = faqInput.faqQuestionList.map(q => ({
                    faqId: faqInput.id!,
                    question: q.question,
                    answer: q.answer,
                    timeOfCreation: timeOfCreation
                }));

                await tx.insert(schema.faqQuestion).values(questionsToInsert);
            }
            return true;
        });
    }

    async retrieveFaqQuestionData(page: number, size: number) {
        return this.db.select({
            id: schema.faqQuestion.id,
            version: schema.faqQuestion.version,
            faqId: schema.faqQuestion.faqId,
            question: schema.faqQuestion.question,
            answer: schema.faqQuestion.answer,
            timeOfCreation: schema.faqQuestion.timeOfCreation
        }).from(schema.faqQuestion).limit(size).offset(page * size);
    }

    async retrieveFaqQuestionDataById(id: bigint) {
        const rows = await this.db.select({
            id: schema.faqQuestion.id,
            version: schema.faqQuestion.version,
            faqId: schema.faqQuestion.faqId,
            question: schema.faqQuestion.question,
            answer: schema.faqQuestion.answer,
            timeOfCreation: schema.faqQuestion.timeOfCreation
        }).from(schema.faqQuestion).where(eq(schema.faqQuestion.id, id));
        return rows[0] ?? null;
    }
}
