import { FaqInput, FaqQuestionInput } from "../dto/faq.dto.js";

function escapeHtml(str: string): string {
    if (!str) return str;
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
}

export function sanitizeFaqQuestion(input: FaqQuestionInput): FaqQuestionInput {
    return {
        ...input,
        question: escapeHtml(input.question?.trim() || ""),
        answer: escapeHtml(input.answer?.trim() || "")
    };
}

export function sanitizeFaq(input: FaqInput): FaqInput {
    return {
        ...input,
        heading: escapeHtml(input.heading?.trim() || ""),
        faqQuestionList: Array.isArray(input.faqQuestionList) 
            ? input.faqQuestionList.map(sanitizeFaqQuestion) 
            : []
    };
}
