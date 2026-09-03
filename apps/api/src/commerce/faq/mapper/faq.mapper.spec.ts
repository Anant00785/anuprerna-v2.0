import { describe, it, expect } from "vitest";
import { mapFaqQuestionRowToDto, mapFaqRowToDto } from "./faq.mapper.js";

describe("mapFaqQuestionRowToDto", () => {
  it("maps every field straight through", () => {
    const out = mapFaqQuestionRowToDto({
      id: 1,
      version: 2,
      faqId: 3,
      question: "Q?",
      answer: "A.",
      timeOfCreation: 100,
    });
    expect(out).toEqual({
      id: 1,
      version: 2,
      faqId: 3,
      question: "Q?",
      answer: "A.",
      timeOfCreation: 100,
    });
  });
});

describe("mapFaqRowToDto", () => {
  it("maps the row and nests mapped questions", () => {
    const out = mapFaqRowToDto(
      { id: 1, version: 1, storyContentId: 5, blogContentId: null, heading: "H", timeOfCreation: 100 },
      [{ id: 10, version: 1, faqId: 1, question: "Q1", answer: "A1", timeOfCreation: 200 }],
    );
    expect(out).toEqual({
      id: 1,
      version: 1,
      storyContentId: 5,
      blogContentId: null,
      heading: "H",
      timeOfCreation: 100,
      faqQuestionList: [
        { id: 10, version: 1, faqId: 1, question: "Q1", answer: "A1", timeOfCreation: 200 },
      ],
    });
  });

  it("defaults faqQuestionList to [] when no questions are passed", () => {
    const out = mapFaqRowToDto({
      id: 1,
      version: 1,
      storyContentId: null,
      blogContentId: null,
      heading: "H",
      timeOfCreation: 100,
    });
    expect(out.faqQuestionList).toEqual([]);
  });
});
