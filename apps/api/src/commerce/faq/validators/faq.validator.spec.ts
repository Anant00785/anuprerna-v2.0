import { describe, it, expect } from "vitest";
import { validateFaq, validateFaqQuestion } from "./faq.validator.js";
import { FaqInput, FaqQuestionInput } from "../dto/faq.dto.js";

const validQuestion: FaqQuestionInput = { question: "How long is shipping?", answer: "5-7 days" };

function makeFaq(overrides: Partial<FaqInput> = {}): FaqInput {
  return { heading: "Shipping FAQ", faqQuestionList: [validQuestion], ...overrides };
}

describe("validateFaqQuestion", () => {
  it("accepts a valid question/answer pair", () => {
    expect(validateFaqQuestion(validQuestion)).toBeNull();
  });

  it("rejects a question shorter than 5 chars", () => {
    expect(validateFaqQuestion({ question: "abcd", answer: "ok" })).toMatch(/Question/);
  });

  it("rejects a question longer than 3000 chars", () => {
    expect(validateFaqQuestion({ question: "a".repeat(3001), answer: "ok" })).toMatch(/Question/);
  });

  it("rejects an answer shorter than 2 chars", () => {
    expect(validateFaqQuestion({ question: "Valid question", answer: "a" })).toMatch(/Answer/);
  });

  it("accepts boundary lengths (5-char question, 2-char answer)", () => {
    expect(validateFaqQuestion({ question: "abcde", answer: "ab" })).toBeNull();
  });
});

describe("validateFaq", () => {
  it("accepts a valid FAQ", () => {
    expect(validateFaq(makeFaq())).toBeNull();
  });

  it("rejects a heading shorter than 3 chars", () => {
    expect(validateFaq(makeFaq({ heading: "ab" }))).toMatch(/Heading/);
  });

  it("rejects an empty question list", () => {
    expect(validateFaq(makeFaq({ faqQuestionList: [] }))).toMatch(/at least one question/);
  });

  it("propagates a question-level validation error", () => {
    expect(validateFaq(makeFaq({ faqQuestionList: [{ question: "x", answer: "ok" }] }))).toMatch(/Question/);
  });
});
