export interface BlogContentTypeInput {
  id?: bigint;
  name: string;
}

export function parseBlogContentTypeInput(raw: unknown): BlogContentTypeInput {
  const obj = raw as Record<string, unknown>;
  return {
    id: typeof obj.id === "string" || typeof obj.id === "number" || typeof obj.id === "bigint" ? BigInt(obj.id) : undefined,
    name: typeof obj.name === "string" ? obj.name : "",
  };
}

export interface BlogContentCategoryInput {
  id?: bigint;
  blogContentTypeId: number;
  name: string;
}

export function parseBlogContentCategoryInput(raw: unknown): BlogContentCategoryInput {
  const obj = raw as Record<string, unknown>;
  return {
    id: typeof obj.id === "string" || typeof obj.id === "number" || typeof obj.id === "bigint" ? BigInt(obj.id) : undefined,
    blogContentTypeId: typeof obj.blogContentTypeId === "string" || typeof obj.blogContentTypeId === "number" || typeof obj.blogContentTypeId === "bigint" ? Number(obj.blogContentTypeId) : 0,
    name: typeof obj.name === "string" ? obj.name : "",
  };
}

export interface BlogContentInput {
  id?: bigint;
  blogContentCategoryId: number;
  title: string;
  description: string;
  readingTime: number;
  bannerImageDesktop: string;
  bannerImageMobile: string;
  bannerImageParallax?: string;
  parallaxText?: string;
  slug?: string;
  previousBlog?: number;
  nextBlog?: number;
  authorId: number;
  metaTitle: string;
  metaDescription: string;
  bannerImageAlt: string;
  bannerImageParallaxAlt: string;
  backwardCompatibleLink: string;
}

export function parseBlogContentInput(raw: unknown): BlogContentInput {
  const obj = raw as Record<string, unknown>;
  return {
    id: typeof obj.id === "string" || typeof obj.id === "number" || typeof obj.id === "bigint" ? BigInt(obj.id) : undefined,
    blogContentCategoryId: typeof obj.blogContentCategoryId === "string" || typeof obj.blogContentCategoryId === "number" || typeof obj.blogContentCategoryId === "bigint" ? Number(obj.blogContentCategoryId) : 0,
    title: typeof obj.title === "string" ? obj.title : "",
    description: typeof obj.description === "string" ? obj.description : "",
    readingTime: typeof obj.readingTime === "number" ? obj.readingTime : 0,
    bannerImageDesktop: typeof obj.bannerImageDesktop === "string" ? obj.bannerImageDesktop : "",
    bannerImageMobile: typeof obj.bannerImageMobile === "string" ? obj.bannerImageMobile : "",
    bannerImageParallax: typeof obj.bannerImageParallax === "string" ? obj.bannerImageParallax : undefined,
    parallaxText: typeof obj.parallaxText === "string" ? obj.parallaxText : undefined,
    slug: typeof obj.slug === "string" ? obj.slug : undefined,
    previousBlog: typeof obj.previousBlog === "string" || typeof obj.previousBlog === "number" || typeof obj.previousBlog === "bigint" ? Number(obj.previousBlog) : undefined,
    nextBlog: typeof obj.nextBlog === "string" || typeof obj.nextBlog === "number" || typeof obj.nextBlog === "bigint" ? Number(obj.nextBlog) : undefined,
    authorId: typeof obj.authorId === "string" || typeof obj.authorId === "number" || typeof obj.authorId === "bigint" ? Number(obj.authorId) : 0,
    metaTitle: typeof obj.metaTitle === "string" ? obj.metaTitle : "",
    metaDescription: typeof obj.metaDescription === "string" ? obj.metaDescription : "",
    bannerImageAlt: typeof obj.bannerImageAlt === "string" ? obj.bannerImageAlt : "",
    bannerImageParallaxAlt: typeof obj.bannerImageParallaxAlt === "string" ? obj.bannerImageParallaxAlt : "",
    backwardCompatibleLink: typeof obj.backwardCompatibleLink === "string" ? obj.backwardCompatibleLink : "",
  };
}

export interface BlogContentSectionInput {
  id?: bigint;
  blogContentId: number;
  templateType: number;
  templateColor: number;
  sortOrder: number;
  image1?: string;
  image2?: string;
  caption1?: string;
  caption2?: string;
  video1?: string;
  video2?: string;
  heading?: string;
  title1?: string;
  title2?: string;
  paragraph1?: string;
  paragraph2?: string;
  ctaButtonName1?: string;
  ctaLink1?: string;
  ctaButtonName2?: string;
  ctaLink2?: string;
  topMotif?: string;
  bottomMotif?: string;
  image1Alt: string;
  image2Alt: string;
  video1Alt: string;
  video2Alt: string;
  image1Link?: string;
  image2Link?: string;
}

export function parseBlogContentSectionInput(raw: unknown): BlogContentSectionInput {
  const obj = raw as Record<string, unknown>;
  return {
    id: typeof obj.id === "string" || typeof obj.id === "number" || typeof obj.id === "bigint" ? BigInt(obj.id) : undefined,
    blogContentId: typeof obj.blogContentId === "string" || typeof obj.blogContentId === "number" || typeof obj.blogContentId === "bigint" ? Number(obj.blogContentId) : 0,
    templateType: typeof obj.templateType === "number" ? obj.templateType : 0,
    templateColor: typeof obj.templateColor === "number" ? obj.templateColor : 0,
    sortOrder: typeof obj.sortOrder === "number" ? obj.sortOrder : 0,
    image1: typeof obj.image1 === "string" ? obj.image1 : undefined,
    image2: typeof obj.image2 === "string" ? obj.image2 : undefined,
    caption1: typeof obj.caption1 === "string" ? obj.caption1 : undefined,
    caption2: typeof obj.caption2 === "string" ? obj.caption2 : undefined,
    video1: typeof obj.video1 === "string" ? obj.video1 : undefined,
    video2: typeof obj.video2 === "string" ? obj.video2 : undefined,
    heading: typeof obj.heading === "string" ? obj.heading : undefined,
    title1: typeof obj.title1 === "string" ? obj.title1 : undefined,
    title2: typeof obj.title2 === "string" ? obj.title2 : undefined,
    paragraph1: typeof obj.paragraph1 === "string" ? obj.paragraph1 : undefined,
    paragraph2: typeof obj.paragraph2 === "string" ? obj.paragraph2 : undefined,
    ctaButtonName1: typeof obj.ctaButtonName1 === "string" ? obj.ctaButtonName1 : undefined,
    ctaLink1: typeof obj.ctaLink1 === "string" ? obj.ctaLink1 : undefined,
    ctaButtonName2: typeof obj.ctaButtonName2 === "string" ? obj.ctaButtonName2 : undefined,
    ctaLink2: typeof obj.ctaLink2 === "string" ? obj.ctaLink2 : undefined,
    topMotif: typeof obj.topMotif === "string" ? obj.topMotif : undefined,
    bottomMotif: typeof obj.bottomMotif === "string" ? obj.bottomMotif : undefined,
    image1Alt: typeof obj.image1Alt === "string" ? obj.image1Alt : "",
    image2Alt: typeof obj.image2Alt === "string" ? obj.image2Alt : "",
    video1Alt: typeof obj.video1Alt === "string" ? obj.video1Alt : "",
    video2Alt: typeof obj.video2Alt === "string" ? obj.video2Alt : "",
    image1Link: typeof obj.image1Link === "string" ? obj.image1Link : undefined,
    image2Link: typeof obj.image2Link === "string" ? obj.image2Link : undefined,
  };
}
