import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import type { CreationAttributes, WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import { EventCategory } from './event-category.model';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';

type CreateResult = {
  status: number;
  body: Record<string, unknown>;
};

@Injectable()
export class EventCategoryService {
  constructor(
    @InjectModel(EventCategory)
    private readonly eventCategoryModel: typeof EventCategory,
    private readonly configService: ConfigService
  ) {}

  async list(query: Record<string, string | undefined>): Promise<Record<string, unknown>[] | { status: number; body: Record<string, unknown> }> {
    const orderedIds = [
      '1cb6a4e7-0491-4516-b096-4c80b8f3caa7',
      '7426b52b-4046-4fe8-9d04-278a9d3562f8',
      'd8d437e8-1a6c-49ea-8cb6-55398bfd0989',
      'a03301df-2f2b-47de-a23d-98b186ed7aca',
      '5ae77981-ce01-432c-bdd9-1e9cf815f8b2',
      '83d00234-ebba-4aea-b896-0c8dbe6d5932',
      'a667b7f9-0a23-4bb6-bcd3-f042cb7a9060',
      'c18ec6e7-938c-42c9-8967-14c950167a4e',
      '1e3034dc-4661-4fdd-86a5-e3ee90ac3c49',
    ];

    const where: WhereOptions<EventCategory> = {};
    if (Object.keys(query).length) {
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
    }

    if (!Object.keys(where).length) {
      const categories = await this.eventCategoryModel.findAll({
        where: { id: { [Op.in]: orderedIds } },
      });

      if (!categories.length) {
        return { status: 404, body: { message: 'No matching EventCategories found', status: 404 } };
      }

      const map = new Map(categories.map((category) => [category.id, category]));
      const ordered = orderedIds
        .map((id) => map.get(id))
        .filter((category): category is EventCategory => Boolean(category));

      if (!ordered.length) {
        return { status: 404, body: { message: 'No matching EventCategories found', status: 404 } };
      }

      return ordered.map((category) => this.toResponse(category));
    }

    const categories = await this.eventCategoryModel.findAll({ where });
    if (!categories.length) {
      return { status: 404, body: { message: 'No matching EventCategories found', status: 404 } };
    }

    return categories.map((category) => this.toResponse(category));
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const category = await this.eventCategoryModel.findByPk(id);
    if (!category) {
      return null;
    }
    return this.toResponse(category);
  }

  async create(payload: Record<string, unknown>): Promise<CreateResult> {
    try {
      if (!payload.name || typeof payload.name !== 'string') {
        return { status: 400, body: { message: 'Name is required', status: 400 } };
      }

      const createData: Partial<CreationAttributes<EventCategory>> = {
        name: payload.name as string,
        desc: payload.desc as string | undefined,
      };

      const category = await this.eventCategoryModel.create(createData as CreationAttributes<EventCategory>);

      const picValue = this.normalizePicInput(payload.pic);
      if (picValue) {
        const saved = await GramadevataUtils.saveEntityImagesToAzure({
          configService: this.configService,
          images: [picValue],
          id: category.id,
          name: category.name,
          entityType: 'eventcategory',
        });
        if (saved.length) {
          await category.update({ pic: saved[0] });
        }
      }

      return { status: 201, body: this.toResponse(category) };
    } catch (error) {
      return {
        status: 500,
        body: { message: 'Internal server error', status: 500 },
      };
    }
  }

  async update(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const category = await this.eventCategoryModel.findByPk(id);
    if (!category) {
      return null;
    }

    const updateData: Partial<EventCategory> = {};
    if (payload.name !== undefined) updateData.name = payload.name as string;
    if (payload.desc !== undefined) updateData.desc = payload.desc as string;

    if (payload.pic !== undefined) {
      const picValue = this.normalizePicInput(payload.pic);
      if (picValue) {
        const saved = await GramadevataUtils.saveEntityImagesToAzure({
          configService: this.configService,
          images: [picValue],
          id: category.id,
          name: category.name,
          entityType: 'eventcategory',
        });
        updateData.pic = saved.length ? saved[0] : (null as unknown as string);
      } else {
        updateData.pic = null as unknown as string;
      }
    }

    await category.update(updateData);
    await category.reload();

    return this.toResponse(category);
  }

  async delete(id: string): Promise<boolean> {
    const category = await this.eventCategoryModel.findByPk(id);
    if (!category) {
      return false;
    }
    await category.destroy();
    return true;
  }

  private normalizePicInput(value: unknown) {
    if (!value) {
      return '';
    }
    if (Array.isArray(value)) {
      const first = value.find((item) => typeof item === 'string' && item.trim());
      return typeof first === 'string' ? first.trim() : '';
    }
    if (typeof value === 'string') {
      return value.trim();
    }
    return '';
  }

  private toResponse(category: EventCategory) {
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
    const base = this.configService.get<string>('FILE_URL')
      || this.configService.get<string>('File_path')
      || '';
    if (!base) {
      return pic;
    }
    const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleaned = pic.startsWith('/') ? pic.slice(1) : pic;
    return `${trimmed}/${cleaned}`;
  }
}
