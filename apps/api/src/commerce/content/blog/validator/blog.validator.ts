import { BlogContentTypeInput, BlogContentCategoryInput, BlogContentInput, BlogContentSectionInput } from "../types/blog.types.js";

export function validateBlogContentType(input: BlogContentTypeInput): string | null {
  if (!input.name || input.name.trim().length === 0) return "Name is required.";
  return null;
}

export function validateBlogContentCategory(input: BlogContentCategoryInput): string | null {
  if (!input.blogContentTypeId) return "Blog Content Type ID is required.";
  if (!input.name || input.name.trim().length === 0) return "Name is required.";
  return null;
}

export function validateBlogContent(input: BlogContentInput): string | null {
  if (!input.blogContentCategoryId) return "Category is required.";
  if (!input.title || input.title.trim().length === 0) return "Title is required.";
  if (!input.description || input.description.trim().length === 0) return "Description is required.";
  return null;
}

export function validateBlogContentSection(input: BlogContentSectionInput): string | null {
  if (!input.blogContentId) return "Blog Content ID is required.";
  if (input.templateType === undefined || input.templateType === null) return "Template Type is required.";
  if (input.templateColor === undefined || input.templateColor === null) return "Template Color is required.";
  return null;
}

function escapeHtml(str: string): string {
  if (!str) return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function sanitizeBlogContentType(input: BlogContentTypeInput): BlogContentTypeInput {
  return {
    ...input,
    name: escapeHtml(input.name.trim()),
  };
}

export function sanitizeBlogContentCategory(input: BlogContentCategoryInput): BlogContentCategoryInput {
  return {
    ...input,
    name: escapeHtml(input.name.trim()),
  };
}

export function sanitizeBlogContent(input: BlogContentInput): BlogContentInput {
  return {
    ...input,
    title: escapeHtml(input.title.trim()),
    description: escapeHtml(input.description.trim()),
  };
}

export function sanitizeBlogContentSection(input: BlogContentSectionInput): BlogContentSectionInput {
  return input; // Add sanitization as needed
}
