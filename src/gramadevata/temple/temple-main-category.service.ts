import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { Op } from 'sequelize';
import { TempleMainCategory } from './temple-main-category.model';
import { toFileUrlString } from '../../common/utils/django-serializer';

@Injectable()
export class TempleMainCategoryService {
  constructor(
    @InjectModel(TempleMainCategory)
    private readonly mainCategoryModel: typeof TempleMainCategory,
    private readonly configService: ConfigService,
  ) {}

  private readonly mainCategoryIds = [
    'e9e8933f-81ee-42bd-9b6d-e923d30d2e5b',
    '64dece57-7b94-4eb1-b31c-884bfa57fcce',
    'ed4b72fd-5dd7-4749-9852-a4483899642b',
    '56ee646b-8370-4129-84f5-22af7ed538e5',
  ];

  /* ── helpers ─────────────────────────────────────── */

  /** Serialize to Django-compatible TempleMainCategorySerializer output (__all__ + pic URL) */
  private toDto(r: TempleMainCategory): Record<string, any> {
    return {
      _id: r.id,
      name: r.name,
      desc: r.desc ?? null,
      shortname: r.shortname ?? null,
      created_at: r.createdAt ?? null,
      pic: toFileUrlString(this.configService, r.pic),
    };
  }

  /* ── endpoints ───────────────────────────────────── */

  async list(query: Record<string, string | undefined>): Promise<any> {
    const where: Record<string, unknown> = {
      id: { [Op.in]: this.mainCategoryIds },
    };

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      if (key === 'page' || key === 'page_size') continue;
      if (key === '_id' || key === 'id') {
        where.id = value;
      }
      if (key === 'name') where.name = value;
      if (key === 'shortname') where.shortname = value;
    }

    const records = await this.mainCategoryModel.findAll({ where });

    if (!records.length) {
      return { message: 'No matching data found', status: 404 };
    }

    const map = new Map(records.map((r) => [r.id, r] as const));
    const ordered = this.mainCategoryIds.map((id) => map.get(id)).filter(Boolean) as TempleMainCategory[];

    if (!ordered.length) {
      return { message: 'No matching data found', status: 404 };
    }

    return ordered.map((r) => this.toDto(r));
  }

  async create(body: Record<string, any>): Promise<any> {
    const record = await this.mainCategoryModel.create({
      name: body.name,
      desc: body.desc,
      shortname: body.shortname,
      pic: body.pic,
    } as any);

    return this.toDto(record);
  }

  async retrieve(id: string): Promise<any> {
    const record = await this.mainCategoryModel.findByPk(id);
    if (!record) {
      throw new NotFoundException({ message: 'Data not found', status: 404 });
    }
    return this.toDto(record);
  }

  async update(id: string, body: Record<string, any>): Promise<any> {
    const record = await this.mainCategoryModel.findByPk(id);
    if (!record) {
      throw new NotFoundException({ message: 'Data not found', status: 404 });
    }

    if (body.name !== undefined) record.name = body.name;
    if (body.desc !== undefined) record.desc = body.desc;
    if (body.shortname !== undefined) record.shortname = body.shortname;
    if (body.pic !== undefined) record.pic = body.pic;

    await record.save();
    return this.toDto(record);
  }

  async remove(id: string): Promise<void> {
    const record = await this.mainCategoryModel.findByPk(id);
    if (!record) {
      throw new NotFoundException({ message: 'Data not found', status: 404 });
    }
    await record.destroy();
  }
}
