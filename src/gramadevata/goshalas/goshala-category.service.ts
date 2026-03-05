import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import type { CreationAttributes, WhereOptions } from 'sequelize';
import { GoshalaCategory } from './goshala-category.model';

@Injectable()
export class GoshalaCategoryService {
  constructor(
    @InjectModel(GoshalaCategory)
    private readonly goshalaCategoryModel: typeof GoshalaCategory,
    private readonly configService: ConfigService
  ) {}

  async list(
    query: Record<string, string | undefined>,
  ): Promise<Record<string, unknown>[] | { status: number; body: Record<string, unknown> }> {
    const where: WhereOptions<GoshalaCategory> = {};

    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      if (['page', 'page_size', 'pageSize', 'page_no', 'ordering'].includes(key)) {
        return;
      }
      if (key === '_id') {
        (where as Record<string, unknown>).id = value;
        return;
      }
      (where as Record<string, unknown>)[key] = value;
    });

    const categories = await this.goshalaCategoryModel.findAll({ where });
    if (!categories.length) {
      return { status: 404, body: { message: 'Data not found', status: 404 } };
    }

    return categories.map((category) => this.toResponse(category));
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const category = await this.goshalaCategoryModel.findByPk(id);
    if (!category) {
      return null;
    }
    return this.toResponse(category);
  }

  async create(payload: Record<string, unknown>): Promise<{ status: number; body: Record<string, unknown> }> {
    if (!payload.name || typeof payload.name !== 'string') {
      return { status: 400, body: { message: 'Name is required', status: 400 } };
    }

    const createData: Partial<CreationAttributes<GoshalaCategory>> = {
      name: payload.name as string,
      desc: payload.desc as string | undefined,
      pic: typeof payload.pic === 'string' ? payload.pic : undefined,
    };

    const created = await this.goshalaCategoryModel.create(createData as CreationAttributes<GoshalaCategory>);
    return { status: 201, body: this.toResponse(created) };
  }

  async update(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const category = await this.goshalaCategoryModel.findByPk(id);
    if (!category) {
      return null;
    }

    const updateData: Partial<GoshalaCategory> = {};
    if (payload.name !== undefined) updateData.name = payload.name as string;
    if (payload.desc !== undefined) updateData.desc = payload.desc as string;
    if (payload.pic !== undefined) updateData.pic = payload.pic as string;

    await category.update(updateData);
    await category.reload();

    return this.toResponse(category);
  }

  async delete(id: string): Promise<boolean> {
    const category = await this.goshalaCategoryModel.findByPk(id);
    if (!category) {
      return false;
    }
    await category.destroy();
    return true;
  }

  private toResponse(category: GoshalaCategory) {
    return {
      _id: category.id,
      name: category.name,
      desc: category.desc ?? null,
      created_at: category.createdAt ?? null,
      pic: this.mapPic(category.pic),
    };
  }

  private mapPic(pic?: string | null) {
    if (!pic) {
      return null;
    }
    if (pic.startsWith('http://') || pic.startsWith('https://')) {
      return pic;
    }
    const base = this.configService.get<string>('File_path');
    if (!base) {
      return pic;
    }
    const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${normalized}/${pic.replace(/^\/+/, '')}`;
  }
}
