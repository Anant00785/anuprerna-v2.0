export interface FaqQuestionInput {
    id?: bigint | null;
    version?: bigint | null;
    faqId?: bigint | null;
    question: string;
    answer: string;
    timeOfCreation?: number | null;
}

export interface FaqInput {
    id?: bigint | null;
    version?: bigint | null;
    storyContentId?: bigint | null;
    blogContentId?: bigint | null;
    heading: string;
    timeOfCreation?: number | null;
    faqQuestionList: FaqQuestionInput[];
}

export function parseFaqQuestionInput(raw: unknown): FaqQuestionInput {
    const obj = raw as Record<string, unknown>;
    return {
        id: typeof obj.id === "bigint" ? obj.id : (typeof obj.id === "number" || typeof obj.id === "string" ? BigInt(obj.id) : null),
        version: typeof obj.version === "bigint" ? obj.version : (typeof obj.version === "number" || typeof obj.version === "string" ? BigInt(obj.version) : null),
        faqId: typeof obj.faqId === "bigint" ? obj.faqId : (typeof obj.faqId === "number" || typeof obj.faqId === "string" ? BigInt(obj.faqId) : null),
        question: typeof obj.question === "string" ? obj.question : "",
        answer: typeof obj.answer === "string" ? obj.answer : "",
        timeOfCreation: typeof obj.timeOfCreation === "number" ? obj.timeOfCreation : null,
    };
}

export function parseFaqInput(raw: unknown): FaqInput {
    const obj = raw as Record<string, unknown>;
    
    let faqQuestionList: FaqQuestionInput[] = [];
    if (Array.isArray(obj.faqQuestionList)) {
        faqQuestionList = obj.faqQuestionList.map(item => parseFaqQuestionInput(item));
    }
    
    return {
        id: typeof obj.id === "bigint" ? obj.id : (typeof obj.id === "number" || typeof obj.id === "string" ? BigInt(obj.id) : null),
        version: typeof obj.version === "bigint" ? obj.version : (typeof obj.version === "number" || typeof obj.version === "string" ? BigInt(obj.version) : null),
        storyContentId: typeof obj.storyContentId === "bigint" ? obj.storyContentId : (typeof obj.storyContentId === "number" || typeof obj.storyContentId === "string" ? BigInt(obj.storyContentId) : null),
        blogContentId: typeof obj.blogContentId === "bigint" ? obj.blogContentId : (typeof obj.blogContentId === "number" || typeof obj.blogContentId === "string" ? BigInt(obj.blogContentId) : null),
        heading: typeof obj.heading === "string" ? obj.heading : "",
        timeOfCreation: typeof obj.timeOfCreation === "number" ? obj.timeOfCreation : null,
        faqQuestionList: faqQuestionList,
    };
}
