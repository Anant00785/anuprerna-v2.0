// @ts-nocheck
import { FaqInput, FaqQuestionInput } from "../dto/faq.dto.js";

/**
 * Validates the length of a string.
 */
function validateString(val: string, minLength: number, maxLength: number): boolean {
    if (!val) return false;
    const len = val.length;
    return len >= minLength && len <= maxLength;
}

/**
 * Validates a single FaqQuestion by checking that the question and answer
 * satisfy their respective length constraints.
 * Question: 5-3000 chars.
 * Answer: 2-3000 chars.
 */
export function validateFaqQuestion(input: FaqQuestionInput): string | null {
    if (!validateString(input.question, 5, 3000)) {
        return "Question must be between 5 and 3000 characters.";
    }
    if (!validateString(input.answer, 2, 3000)) {
        return "Answer must be between 2 and 3000 characters.";
    }
    return null;
}

/**
 * Validates the given Faq by checking that the heading satisfies its length
 * constraint and that the FAQ question list is non-empty with all questions passing
 * validation.
 * Heading: 3-255 chars.
 */
export function validateFaq(input: FaqInput): string | null {
    if (!validateString(input.heading, 3, 255)) {
        return "Heading must be between 3 and 255 characters.";
    }
    if (!input.faqQuestionList || input.faqQuestionList.length === 0) {
        return "FAQ must have at least one question.";
    }
    
    for (const question of input.faqQuestionList) {
        const qErr = validateFaqQuestion(question);
        if (qErr) {
            return qErr;
        }
    }
    
    return null;
}
// @ts-nocheck
// @ts-nocheck
