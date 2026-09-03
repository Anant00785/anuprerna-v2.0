/**
 * Asserts GET /get/stories/:storyId/recommended returns what
 * StoryContentPreviewDAOController.retrieveRecommendedStoriesByStoryId returns:
 * up to six stories from the source story's category (excluding itself), topped
 * up from the same content type when fewer than six are found.
 */
import { describe, it, expect, vi } from "vitest";
import { StoryService } from "./story.service.js";
import type { StoryRepository } from "../repository/story.repository.js";

const CATEGORY_ID = 5;

function story(id: number) {
  return { id: BigInt(id), storyContentCategoryId: CATEGORY_ID, title: `story ${id}` };
}

function make(options: {
  source?: { id: bigint; storyContentCategoryId: number } | null;
  category?: { storyContentType: string } | null;
  sameCategory?: ReturnType<typeof story>[];
  byType?: ReturnType<typeof story>[];
} = {}) {
  const repo = {
    getStoryContentById: vi.fn(async () =>
      options.source === undefined ? story(1) : options.source,
    ),
    getStoryContentCategoryById: vi.fn(async () =>
      options.category === undefined ? { storyContentType: "BLOG" } : options.category,
    ),
    getStoriesFromSameCategory: vi.fn(async () => options.sameCategory ?? []),
    getStoriesByContentType: vi.fn(async () => options.byType ?? []),
  };
  return { repo, service: new StoryService(repo as unknown as StoryRepository) };
}

describe("StoryService.getRecommendedStories", () => {
  it("returns the six same-category stories without topping up", async () => {
    const six = [2, 3, 4, 5, 6, 7].map(story);
    const { service, repo } = make({ sameCategory: six });

    const result = await service.getRecommendedStories(1n);

    expect(result).toHaveLength(6);
    expect(repo.getStoriesFromSameCategory).toHaveBeenCalledWith(1n, CATEGORY_ID, 6);
    expect(repo.getStoriesByContentType).not.toHaveBeenCalled();
  });

  it("tops up from the same content type, excluding what is already selected and the source", async () => {
    const { service, repo } = make({
      sameCategory: [story(2), story(3)],
      byType: [story(8), story(9), story(10), story(11)],
    });

    const result = await service.getRecommendedStories(1n);

    expect(result.map((s) => Number(s.id))).toEqual([2, 3, 8, 9, 10, 11]);
    expect(repo.getStoriesByContentType).toHaveBeenCalledWith([2n, 3n, 1n], "BLOG", 4);
  });

  it("returns an empty list for a missing source story — Java returns new ArrayList<>()", async () => {
    const { service, repo } = make({ source: null });
    await expect(service.getRecommendedStories(999n)).resolves.toEqual([]);
    expect(repo.getStoriesFromSameCategory).not.toHaveBeenCalled();
  });

  it("returns an empty list when the source story's category is missing", async () => {
    const { service } = make({ category: null });
    await expect(service.getRecommendedStories(1n)).resolves.toEqual([]);
  });

  it("returns only the same-category matches when nothing else shares the content type", async () => {
    const { service } = make({ sameCategory: [story(2)], byType: [] });
    const result = await service.getRecommendedStories(1n);
    expect(result.map((s) => Number(s.id))).toEqual([2]);
  });
});
