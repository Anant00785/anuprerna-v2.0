// @ts-nocheck
import { StoryContentCategoryInput, StoryContentInput, StoryContentSectionInput, StoryProductMappingInput } from "../types/story.types.js";

export function validateStoryContentCategory(input: StoryContentCategoryInput): string | null {
  if (!input.name || input.name.trim().length === 0) return "Name is required.";
  return null;
}

export function validateStoryContent(input: StoryContentInput): string | null {
  if (!input.storyContentCategoryId) return "Category is required.";
  if (!input.title || input.title.trim().length === 0) return "Title is required.";
  if (!input.description || input.description.trim().length === 0) return "Description is required.";
  return null;
}

export function validateStoryContentSection(input: StoryContentSectionInput): string | null {
  if (!input.storyContentId) return "Story Content ID is required.";
  if (input.templateType === undefined || input.templateType === null) return "Template Type is required.";
  if (input.templateColor === undefined || input.templateColor === null) return "Template Color is required.";
  return null;
}

export function validateStoryProductMapping(input: StoryProductMappingInput): string | null {
  if (!input.storyContentId) return "Story Content ID is required.";
  if (!input.productId) return "Product ID is required.";
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

export function sanitizeStoryContentCategory(input: StoryContentCategoryInput): StoryContentCategoryInput {
  return {
    ...input,
    name: escapeHtml(input.name.trim()),
  };
}

export function sanitizeStoryContent(input: StoryContentInput): StoryContentInput {
  return {
    ...input,
    title: escapeHtml(input.title.trim()),
    description: escapeHtml(input.description.trim()),
  };
}

export function sanitizeStoryContentSection(input: StoryContentSectionInput): StoryContentSectionInput {
  return input;
}

export function sanitizeStoryProductMapping(input: StoryProductMappingInput): StoryProductMappingInput {
  return input;
}
// @ts-nocheck
// @ts-nocheck
