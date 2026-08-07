import { Injectable } from "@nestjs/common";
import { StoryRepository } from "../repository/story.repository.js";
import { StoryContentCategoryInput, StoryContentInput, StoryContentSectionInput, StoryProductMappingInput } from "../types/story.types.js";
import { ActionCode } from "../../../../common/errors/action-code.js";

@Injectable()
export class StoryService {
  constructor(private readonly storyRepository: StoryRepository) {}

  async getStoryContentCategories() {
    return this.storyRepository.getStoryContentCategories();
  }

  async addStoryContentCategory(data: StoryContentCategoryInput) {
    const result = await this.storyRepository.addStoryContentCategory(data);
    return result ? ActionCode.INSERT_SUCCESS : ActionCode.INSERT_FAILURE;
  }

  async updateStoryContentCategory(data: StoryContentCategoryInput) {
    if (!data.id) return ActionCode.UPDATE_FAILURE;
    const result = await this.storyRepository.updateStoryContentCategory(data.id, data);
    return result ? ActionCode.UPDATE_SUCCESS : ActionCode.UPDATE_FAILURE;
  }

  async getStoryContentList() {
    return this.storyRepository.getStoryContentList();
  }

  async getStoryContentById(id: bigint) {
    const story = await this.storyRepository.getStoryContentById(id);
    if (story) {
      const sections = await this.storyRepository.getStoryContentSections(id);
      return { ...story, sections };
    }
    return null;
  }

  async getStoryContentBySlug(slug: string) {
    const story = await this.storyRepository.getStoryContentBySlug(slug);
    if (story) {
      const sections = await this.storyRepository.getStoryContentSections(story.id);
      return { ...story, sections };
    }
    return null;
  }

  async getStoryContentListByCsv(commaSeparatedIDList: string) {
    const ids = commaSeparatedIDList.split(",").map(id => BigInt(id.trim())).filter(id => !isNaN(Number(id)));
    return this.storyRepository.getStoryContentListByCsv(ids);
  }

  async getStoriesByCategory(categoryId: bigint) {
    return this.storyRepository.getStoriesByCategory(categoryId);
  }

  async addStoryContent(data: StoryContentInput) {
    const result = await this.storyRepository.addStoryContent(data);
    return result ? ActionCode.INSERT_SUCCESS : ActionCode.INSERT_FAILURE;
  }

  async updateStoryContent(id: bigint, data: StoryContentInput) {
    const result = await this.storyRepository.updateStoryContent(id, data);
    return result ? ActionCode.UPDATE_SUCCESS : ActionCode.UPDATE_FAILURE;
  }

  async deleteStoryContent(id: bigint) {
    await this.storyRepository.deleteStoryContent(id);
    return ActionCode.DELETE_SUCCESS;
  }

  async addStoryContentSection(data: StoryContentSectionInput) {
    const result = await this.storyRepository.addStoryContentSection(data);
    return result ? ActionCode.INSERT_SUCCESS : ActionCode.INSERT_FAILURE;
  }

  async updateStoryContentSection(id: bigint, data: StoryContentSectionInput) {
    const result = await this.storyRepository.updateStoryContentSection(id, data);
    return result ? ActionCode.UPDATE_SUCCESS : ActionCode.UPDATE_FAILURE;
  }

  async deleteStoryContentSection(id: bigint) {
    await this.storyRepository.deleteStoryContentSection(id);
    return ActionCode.DELETE_SUCCESS;
  }

  async getStoryRelatedToProduct(productId: bigint) {
    return this.storyRepository.getStoryRelatedToProduct(productId);
  }

  async getProductsRelatedToStory(storyContentId: bigint) {
    return this.storyRepository.getProductsRelatedToStory(storyContentId);
  }

  async getStoryProductPreviews(storyContentId: bigint) {
    // This typically joins with the Product table, returning simple preview DTOs.
    // For now we return raw mappings.
    return this.storyRepository.getProductsRelatedToStory(storyContentId);
  }

  async addStoryProductMapping(data: StoryProductMappingInput) {
    const result = await this.storyRepository.addStoryProductMapping(data);
    return result ? ActionCode.INSERT_SUCCESS : ActionCode.INSERT_FAILURE;
  }

  async updateStoryProductMapping(data: StoryProductMappingInput) {
    if (!data.id) return ActionCode.UPDATE_FAILURE;
    const result = await this.storyRepository.updateStoryProductMapping(data.id, data);
    return result ? ActionCode.UPDATE_SUCCESS : ActionCode.UPDATE_FAILURE;
  }
}
