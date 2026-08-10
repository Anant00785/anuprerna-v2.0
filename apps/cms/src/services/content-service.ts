import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export interface BlogType {
  id: number;
  name: string;
  timeOfCreation?: number;
  [key: string]: any;
}

export interface BlogCategory {
  id: number;
  name: string;
  blogContentType?: BlogType;
  blogContentTypeId?: number;
  timeOfCreation?: number;
  [key: string]: any;
}

export interface BlogPost {
  id: number;
  title: string;
  heading?: string;
  subHeading?: string;
  body?: string;
  description?: string;
  coverImageUrl?: string;
  bannerImageUrl?: string;
  blogContentCategory?: BlogCategory;
  blogContentCategoryId?: number;
  views?: number;
  publishDate?: string;
  timeOfCreation?: number;
  [key: string]: any;
}

export interface StoryCategory {
  id: number;
  name: string;
  storyContentType?: string;
  timeOfCreation?: number;
  [key: string]: any;
}

export interface StoryPost {
  id: number;
  title: string;
  description?: string;
  coverImageUrl?: string;
  bannerImageUrl?: string;
  storyContentCategory?: StoryCategory;
  storyContentCategoryId?: number;
  views?: number;
  timeOfCreation?: number;
  [key: string]: any;
}

export class ContentService {
  // BLOG TYPES
  public static async getBlogTypes(): Promise<BlogType[]> {
    const response = await apiClient.get('/get/blog-content-types');
    const list = unwrapResponseData<BlogType[]>(response.data, 'blogContentTypeList');
    return Array.isArray(list) ? list : [];
  }

  public static async createBlogType(name: string): Promise<any> {
    const response = await apiClient.post('/add/blog-content-type', { name: name.trim() });
    return response.data;
  }

  public static async updateBlogType(id: number, name: string): Promise<any> {
    const response = await apiClient.post('/update/blog-content-type', { id, name: name.trim() });
    return response.data;
  }

  // BLOG CATEGORIES
  public static async getBlogCategories(): Promise<BlogCategory[]> {
    const response = await apiClient.get('/get/blog-content-category-list');
    const list = unwrapResponseData<BlogCategory[]>(response.data, 'blogContentCategoryList');
    return Array.isArray(list) ? list : [];
  }

  public static async createBlogCategory(name: string, blogContentTypeId: number): Promise<any> {
    const response = await apiClient.post('/add/blog-content-category/', {
      name: name.trim(),
      blogContentTypeId,
    });
    return response.data;
  }

  public static async updateBlogCategory(id: number, name: string, blogContentTypeId: number): Promise<any> {
    const response = await apiClient.post('/update/blog-content-category', {
      id,
      name: name.trim(),
      blogContentTypeId,
    });
    return response.data;
  }

  // BLOG POSTS
  public static async getBlogs(): Promise<BlogPost[]> {
    const response = await apiClient.get('/get/blog-content-list');
    const list = unwrapResponseData<BlogPost[]>(response.data, 'blogContentList');
    return Array.isArray(list) ? list : [];
  }

  public static async getBlogById(id: string | number): Promise<BlogPost> {
    const response = await apiClient.get(`/get/blog-content/${id}`);
    return unwrapResponseData<BlogPost>(response.data, 'blogContent');
  }

  public static async createBlog(payload: Partial<BlogPost>): Promise<any> {
    const response = await apiClient.post('/add/blog-content', payload);
    return response.data;
  }

  public static async updateBlog(payload: Partial<BlogPost>): Promise<any> {
    const response = await apiClient.post(`/update/blog-content/`, payload);
    return response.data;
  }

  public static async deleteBlog(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/blog-content/${id}`);
    return response.data;
  }

  // STORY CATEGORIES
  public static async getStoryCategories(): Promise<StoryCategory[]> {
    const response = await apiClient.get('/get/story-content-category-list');
    const list = unwrapResponseData<StoryCategory[]>(response.data, 'storyContentCategoryList');
    return Array.isArray(list) ? list : [];
  }

  public static async createStoryCategory(name: string, storyContentType: string = 'CRAFTS'): Promise<any> {
    const response = await apiClient.post('/add/story-content-category', {
      name: name.trim(),
      storyContentType,
    });
    return response.data;
  }

  public static async updateStoryCategory(id: number, name: string, storyContentType: string = 'CRAFTS'): Promise<any> {
    const response = await apiClient.post('/update/story-content-category', {
      id,
      name: name.trim(),
      storyContentType,
    });
    return response.data;
  }

  // STORIES
  public static async getStories(): Promise<StoryPost[]> {
    const response = await apiClient.get('/get/story-content-list');
    const list = unwrapResponseData<StoryPost[]>(response.data, 'storyContentList');
    return Array.isArray(list) ? list : [];
  }

  public static async getStoryById(id: string | number): Promise<StoryPost> {
    const response = await apiClient.get(`/get/story-content/${id}`);
    return unwrapResponseData<StoryPost>(response.data, 'storyContent');
  }

  public static async createStory(payload: Partial<StoryPost>): Promise<any> {
    const response = await apiClient.post('/add/story-content', payload);
    return response.data;
  }

  public static async updateStory(payload: Partial<StoryPost>): Promise<any> {
    const response = await apiClient.post('/update/story-content/', payload);
    return response.data;
  }

  public static async deleteStory(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/story-content/${id}`);
    return response.data;
  }

  // FAQS
  public static async getFaqs(): Promise<any[]> {
    const response = await apiClient.get('/get/faqs');
    return unwrapResponseData<any[]>(response.data, 'faqList');
  }
}
