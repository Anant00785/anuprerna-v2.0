import { Injectable } from "@nestjs/common";
import { BlogRepository } from "../repository/blog.repository.js";
import { BlogContentTypeInput, BlogContentCategoryInput, BlogContentInput, BlogContentSectionInput } from "../types/blog.types.js";
import { ActionCode } from "../../../../common/errors/action-code.js";

@Injectable()
export class BlogService {
  constructor(private readonly blogRepository: BlogRepository) {}

  async getBlogContentTypes() {
    return this.blogRepository.getBlogContentTypes();
  }

  async addBlogContentType(data: BlogContentTypeInput) {
    const result = await this.blogRepository.addBlogContentType(data);
    return result ? ActionCode.INSERT_SUCCESS : ActionCode.INSERT_FAILURE;
  }

  async updateBlogContentType(data: BlogContentTypeInput) {
    if (!data.id) return ActionCode.UPDATE_FAILURE;
    const result = await this.blogRepository.updateBlogContentType(data.id, data);
    return result ? ActionCode.UPDATE_SUCCESS : ActionCode.UPDATE_FAILURE;
  }

  async getBlogContentCategories() {
    return this.blogRepository.getBlogContentCategories();
  }

  async addBlogContentCategory(blogContentTypeId: bigint, data: BlogContentCategoryInput) {
    const result = await this.blogRepository.addBlogContentCategory(Number(blogContentTypeId), data);
    return result ? ActionCode.INSERT_SUCCESS : ActionCode.INSERT_FAILURE;
  }

  async updateBlogContentCategory(data: BlogContentCategoryInput) {
    if (!data.id) return ActionCode.UPDATE_FAILURE;
    const result = await this.blogRepository.updateBlogContentCategory(data.id, data);
    return result ? ActionCode.UPDATE_SUCCESS : ActionCode.UPDATE_FAILURE;
  }

  async getBlogContentList() {
    return this.blogRepository.getBlogContentList();
  }

  async getBlogContentById(id: bigint) {
    const blog = await this.blogRepository.getBlogContentById(id);
    if (blog) {
      const sections = await this.blogRepository.getBlogContentSections(Number(id));
      return { ...blog, sections };
    }
    return null;
  }

  async getBlogContentBySlug(slug: string) {
    const blog = await this.blogRepository.getBlogContentBySlug(slug);
    if (blog) {
      const sections = await this.blogRepository.getBlogContentSections(Number(blog.id));
      return { ...blog, sections };
    }
    return null;
  }

  async getBlogContentListByCsv(commaSeparatedIDList: string) {
    const ids = commaSeparatedIDList
      .split(",")
      .map((id) => id.trim())
      .filter((id) => /^\d+$/.test(id))
      .map((id) => BigInt(id));
    return this.blogRepository.getBlogContentListByCsv(ids);
  }

  async getBlogsByCategory(categoryId: bigint) {
    return this.blogRepository.getBlogsByCategory(Number(categoryId));
  }

  async getAllBlogContentSections() {
    return this.blogRepository.getAllBlogContentSections();
  }

  async getBlogContentSections(blogContentId: bigint) {
    return this.blogRepository.getBlogContentSections(Number(blogContentId));
  }

  async getRecommendedBlogs(blogId: bigint) {
    return this.blogRepository.getRecommendedBlogs(blogId);
  }

  async addBlogContent(data: BlogContentInput) {
    const result = await this.blogRepository.addBlogContent(data);
    return result ? ActionCode.INSERT_SUCCESS : ActionCode.INSERT_FAILURE;
  }

  async updateBlogContent(id: bigint, data: BlogContentInput) {
    const result = await this.blogRepository.updateBlogContent(id, data);
    return result ? ActionCode.UPDATE_SUCCESS : ActionCode.UPDATE_FAILURE;
  }

  async deleteBlogContent(id: bigint) {
    await this.blogRepository.deleteBlogContent(id);
    return ActionCode.DELETE_SUCCESS;
  }

  async addBlogContentSection(data: BlogContentSectionInput) {
    const result = await this.blogRepository.addBlogContentSection(data);
    return result ? ActionCode.INSERT_SUCCESS : ActionCode.INSERT_FAILURE;
  }

  async updateBlogContentSection(id: bigint, data: BlogContentSectionInput) {
    const result = await this.blogRepository.updateBlogContentSection(id, data);
    return result ? ActionCode.UPDATE_SUCCESS : ActionCode.UPDATE_FAILURE;
  }

  async deleteBlogContentSection(id: bigint) {
    await this.blogRepository.deleteBlogContentSection(id);
    return ActionCode.DELETE_SUCCESS;
  }
}
