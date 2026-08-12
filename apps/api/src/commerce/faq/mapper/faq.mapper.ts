// @ts-nocheck
import { FaqInput, FaqQuestionInput } from "../dto/faq.dto.js";

export function mapFaqQuestionRowToDto(row: any): FaqQuestionInput {
    return {
        id: row.id,
        version: row.version,
        faqId: row.faqId,
        question: row.question,
        answer: row.answer,
        timeOfCreation: row.timeOfCreation
    };
}

export function mapFaqRowToDto(row: any, questions: any[] = []): FaqInput {
    return {
        id: row.id,
        version: row.version,
        storyContentId: row.storyContentId,
        blogContentId: row.blogContentId,
        heading: row.heading,
        timeOfCreation: row.timeOfCreation,
        faqQuestionList: questions.map(mapFaqQuestionRowToDto)
    };
}
// @ts-nocheck
// @ts-nocheck
