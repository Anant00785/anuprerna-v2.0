import { describe, it, expect } from "vitest";
import { sanitizeFaq, sanitizeFaqQuestion } from "./faq.sanitizer.js";
import { FaqInput, FaqQuestionInput } from "../dto/faq.dto.js";

describe("sanitizeFaqQuestion", () => {
  it("trims and HTML-escapes question and answer", () => {
    const input: FaqQuestionInput = { question: "  <b>Q</b>  ", answer: "  A & B  " };
    const out = sanitizeFaqQuestion(input);
    expect(out.question).toBe("&lt;b&gt;Q&lt;/b&gt;");
    expect(out.answer).toBe("A &amp; B");
  });
});

describe("sanitizeFaq", () => {
  it("trims heading and sanitizes every nested question", () => {
    const input: FaqInput = {
      heading: "  <script>x</script>  ",
      faqQuestionList: [{ question: "<i>q</i>", answer: "a" }],
    };
    const out = sanitizeFaq(input);
    expect(out.heading).toBe("&lt;script&gt;x&lt;/script&gt;");
    expect(out.faqQuestionList[0].question).toBe("&lt;i&gt;q&lt;/i&gt;");
  });

  it("defaults faqQuestionList to [] when it is not an array", () => {
    const input = { heading: "Heading", faqQuestionList: undefined } as unknown as FaqInput;
    expect(sanitizeFaq(input).faqQuestionList).toEqual([]);
  });
});
