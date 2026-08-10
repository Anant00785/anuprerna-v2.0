import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export interface Skill {
  id?: number;
  name: string;
  description?: string;
  deleted?: boolean;
  timeOfCreation?: number;
  lastUpdateTime?: number;
  [key: string]: any;
}

export interface CreateSkillRequest {
  name: string;
  description?: string;
}

export interface UpdateSkillRequest {
  id: number;
  name: string;
  description?: string;
}

const EMOJI_MAP: Array<[string, string]> = [
  ['weav', '🧵'],
  ['jamdani', '🪡'],
  ['silk', '🪡'],
  ['stitch', '🪡'],
  ['tailor', '🪡'],
  ['sew', '🪡'],
  ['embroider', '✨'],
  ['kantha', '✨'],
  ['batik', '🎨'],
  ['print', '🎨'],
  ['block', '🎨'],
  ['paint', '🖌️'],
  ['dye', '🌀'],
  ['knit', '🧶'],
  ['crochet', '🧶'],
  ['spin', '🪺'],
  ['cotton', '🌾'],
  ['khadi', '🌾'],
  ['wool', '🐑'],
  ['clay', '🏺'],
  ['pottery', '🏺'],
  ['ceramic', '🏺'],
  ['wood', '🪵'],
  ['carv', '🪵'],
  ['metal', '⚒️'],
  ['forge', '⚒️'],
];

export class SkillService {
  public static resolveEmoji(name?: string): string {
    if (!name) return '🎯';
    const lower = name.toLowerCase();
    for (const [keyword, emoji] of EMOJI_MAP) {
      if (lower.includes(keyword)) return emoji;
    }
    return '🎯';
  }

  public static async getSkills(): Promise<Skill[]> {
    const response = await apiClient.get('/get/skills');
    const list = unwrapResponseData<Skill[]>(response.data, 'skillList');
    if (!Array.isArray(list)) return [];
    return list.map(item => ({
      id: item.id,
      name: item.name || '',
      description: item.description || '',
      deleted: item.deleted === true,
      timeOfCreation: item.timeOfCreation || 0,
      lastUpdateTime: item.lastUpdateTime || 0,
    }));
  }

  public static async getSkillById(id: number | string): Promise<Skill | null> {
    const numId = Number(id);
    const skills = await this.getSkills();
    return skills.find(s => s.id === numId) || null;
  }

  public static async createSkill(payload: CreateSkillRequest): Promise<any> {
    const response = await apiClient.post('/add/skill', {
      name: payload.name.trim(),
      description: payload.description?.trim() || '',
    });
    return response.data;
  }

  public static async updateSkill(payload: UpdateSkillRequest): Promise<any> {
    const response = await apiClient.post('/update/skill', {
      id: payload.id,
      name: payload.name.trim(),
      description: payload.description?.trim() || '',
    });
    return response.data;
  }

  public static async deleteSkill(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/skill/${id}`);
    return response.data;
  }
}
