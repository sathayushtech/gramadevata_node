import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { WelfareHomesCategory } from './welfare-homes-category.model';

export type WelfareHomesCategoryResponse = {
  _id: string;
  name: string | null;
  image_location: string[] | null;
};

@Injectable()
export class WelfareHomesCategoryService {
  constructor(
    @InjectModel(WelfareHomesCategory)
    private readonly categoryModel: typeof WelfareHomesCategory,
    private readonly configService: ConfigService,
  ) {}

  async list(): Promise<WelfareHomesCategoryResponse[]> {
    const categories = await this.categoryModel.findAll({
      order: [
        ['priority', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });

    return categories.map((category) => this.toResponse(category));
  }

  async getById(id: string): Promise<WelfareHomesCategoryResponse | null> {
    const category = await this.categoryModel.findByPk(id);
    return category ? this.toResponse(category) : null;
  }

  async create(payload: Record<string, unknown>): Promise<WelfareHomesCategoryResponse> {
    const createPayload = {
      ...(typeof payload._id === 'string' && payload._id.trim() ? { id: payload._id.trim() } : {}),
      ...(typeof payload.name === 'string' ? { name: payload.name } : {}),
      ...(payload.image_location !== undefined ? { imageLocation: this.serializeImageLocation(payload.image_location) } : {}),
    } as unknown as Partial<WelfareHomesCategory>;

    const category = await this.categoryModel.create(createPayload as any);
    return this.toResponse(category);
  }

  async update(id: string, payload: Record<string, unknown>): Promise<WelfareHomesCategoryResponse | null> {
    const category = await this.categoryModel.findByPk(id);
    if (!category) {
      return null;
    }

    if (typeof payload.name === 'string') {
      category.name = payload.name;
    }

    if (payload.image_location !== undefined) {
      category.imageLocation = this.serializeImageLocation(payload.image_location);
    }

    await category.save();
    return this.toResponse(category);
  }

  async remove(id: string): Promise<boolean> {
    const deleted = await this.categoryModel.destroy({ where: { id } });
    return deleted > 0;
  }

  private toResponse(category: WelfareHomesCategory): WelfareHomesCategoryResponse {
    return {
      _id: String(category.id),
      name: category.name ?? null,
      image_location: this.resolveImageLocation(category.imageLocation),
    };
  }

  private resolveImageLocation(value: unknown): string[] | null {
    const paths = this.parseImagePaths(value);
    if (!paths?.length) {
      return null;
    }

    const fileUrl = this.configService.get<string>('FILE_URL');
    if (!fileUrl) {
      return paths;
    }

    const trimmed = fileUrl.endsWith('/') ? fileUrl.slice(0, -1) : fileUrl;
    return paths.map((path) => {
      const normalized = path.startsWith('/') ? path.slice(1) : path;
      return `${trimmed}/${normalized}`;
    });
  }

  private parseImagePaths(value: unknown): string[] {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
    }

    if (typeof value !== 'string') {
      return [];
    }

    const raw = value.trim();
    if (!raw) {
      return [];
    }

    if (raw.startsWith('[') && raw.endsWith(']')) {
      const cleaned = raw
        .slice(1, -1)
        .replace(/\"/g, '')
        .replace(/"/g, '')
        .replace(/'/g, '');

      return cleaned
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    }

    return [raw];
  }

  private serializeImageLocation(value: unknown): string | null {
    if (value === null) {
      return null;
    }

    if (value === undefined) {
      return null;
    }

    if (Array.isArray(value)) {
      const cleaned = value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
      if (!cleaned.length) {
        return null;
      }
      return JSON.stringify(cleaned);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    }

    return null;
  }
}
