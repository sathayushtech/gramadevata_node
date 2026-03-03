import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { TempleCategory } from './temple-category.model';
import { toFileUrlString } from '../../common/utils/django-serializer';

@Injectable()
export class TempleCategoryService {
  constructor(
    @InjectModel(TempleCategory)
    private readonly templeCategoryModel: typeof TempleCategory,
    private readonly configService: ConfigService,
  ) {}

  private readonly orderedIds: string[] = [
    '742ccfe6-d0b5-11ee-84bd-0242ac110002',
    '742ecf7b-d0b5-11ee-84bd-0242ac110002',
    '742c4b08-d0b5-11ee-84bd-0242ac110002',
    '742c309e-d0b5-11ee-84bd-0242ac110002',
    '742c043d-d0b5-11ee-84bd-0242ac110002',
    '405033fe-fb78-49e0-aef9-35172863466c',
    '11633522-2084-4f76-b360-0a0038c3f285',
    '743339d5-d0b5-11ee-84bd-0242ac110002',
    '74333d89-d0b5-11ee-84bd-0242ac110002',
    '74333f6a-d0b5-11ee-84bd-0242ac110002',
    '72524742-6e3a-4c2a-b4d4-4a0a68b5faa7',
    '957b393b-2198-4e3f-a7a5-61a1b1b9652b',
    '742f645c-d0b5-11ee-84bd-0242ac110002',
    '74343760-d0b5-11ee-84bd-0242ac110002',
    '742f66d4-d0b5-11ee-84bd-0242ac110002',
    '742ed15f-d0b5-11ee-84bd-0242ac110002',
    '74353e76-d0b5-11ee-84bd-0242ac110002',
    '74334755-d0b5-11ee-84bd-0242ac110002',
    '742fb823-d0b5-11ee-84bd-0242ac110002',
    '7434333a-d0b5-11ee-84bd-0242ac110002',
    '7433a0e7-d0b5-11ee-84bd-0242ac110002',
    '74344055-d0b5-11ee-84bd-0242ac110002',
    '742ecbf6-d0b5-11ee-84bd-0242ac110002',
    '742e85ad-d0b5-11ee-84bd-0242ac110002',
    '74345ef3-d0b5-11ee-84bd-0242ac110002',
    '74353c0d-d0b5-11ee-84bd-0242ac110002',
    '742ed999-d0b5-11ee-84bd-0242ac110002',
    '742b10a6-d0b5-11ee-84bd-0242ac110002',
    '742da6dc-d0b5-11ee-84bd-0242ac110002',
    '742f57d9-d0b5-11ee-84bd-0242ac110002',
    '74344b60-d0b5-11ee-84bd-0242ac110002',
    '742c8632-d0b5-11ee-84bd-0242ac110002',
    '742ee33e-d0b5-11ee-84bd-0242ac110002',
    '742cc4f8-d0b5-11ee-84bd-0242ac110002',
    '742c5302-d0b5-11ee-84bd-0242ac110002',
    '742da3d3-d0b5-11ee-84bd-0242ac110002',
    '742f52be-d0b5-11ee-84bd-0242ac110002',
    '74339dc3-d0b5-11ee-84bd-0242ac110002',
    '743525d3-d0b5-11ee-84bd-0242ac110002',
    '742f2965-d0b5-11ee-84bd-0242ac110002',
    '742c0c1b-d0b5-11ee-84bd-0242ac110002',
    '742c1781-d0b5-11ee-84bd-0242ac110002',
    '742ebd7b-d0b5-11ee-84bd-0242ac110002',
    'fee05763-b9b1-49d5-8423-b385625045ff',
    '743340c9-d0b5-11ee-84bd-0242ac110002',
    'a19958cc-86c2-44fc-a8f2-35c54208fae5',
    '742fc433-d0b5-11ee-84bd-0242ac110002',
    '05dd3bfa-8f5a-49f7-83de-520a3b1c012d',
    '4117b4f9-f202-4b10-a637-50fc5151a0e4',
    '2257a2c4-73ac-49c1-ba3d-376c10b0c664',
    '142a703b-e8ad-4550-b68a-6a0718b90922',
    '49eabde2-ce67-426a-a0ad-e51849910401',
    'd4f979f4-2f7a-4aab-9782-702b31a21087',
    '742fc5ca-d0b5-11ee-84bd-0242ac110002',
    '6af7ab24-9a0e-42cb-a57a-372bc62cd842',
  ];

  /* ── helpers ─────────────────────────────────────── */

  /** Serialize for list (TempleCategeorySerializer – __all__ + pic URL) */
  private toListDto(r: TempleCategory): Record<string, any> {
    return {
      _id: r.id,
      name: r.name,
      desc: r.desc ?? null,
      shortname: r.shortname ?? null,
      created_at: r.createdAt ?? null,
      pic: toFileUrlString(this.configService, r.pic),
      main_category: r.mainCategoryId ?? null,
    };
  }

  /** Serialize for create / retrieve / update (TempleCategeorySerializer1 – only _id, name) */
  private toCompactDto(r: TempleCategory): Record<string, any> {
    return {
      _id: r.id,
      name: r.name,
    };
  }

  /* ── endpoints ───────────────────────────────────── */

  async list(query: Record<string, string | undefined>): Promise<any> {
    const where: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      if (key === 'page' || key === 'page_size') continue;

      if (key === '_id' || key === 'id') where.id = value;
      else if (key === 'name') where.name = value;
      else if (key === 'shortname') where.shortname = value;
      else if (key === 'main_category_id' || key === 'main_category') where.mainCategoryId = value;
    }

    const records = await this.templeCategoryModel.findAll({ where });
    if (!records.length) {
      return { message: 'Data not found', status: 404 };
    }

    const orderMap = new Map<string, number>();
    this.orderedIds.forEach((id, idx) => orderMap.set(id, idx));

    records.sort((a, b) => {
      const ao = orderMap.get(a.id) ?? 9999;
      const bo = orderMap.get(b.id) ?? 9999;
      return ao - bo;
    });

    return records.map((r) => this.toListDto(r));
  }

  async create(body: Record<string, any>): Promise<any> {
    const record = await this.templeCategoryModel.create({
      name: body.name,
      desc: body.desc,
      shortname: body.shortname,
      mainCategoryId: body.main_category_id ?? body.main_category,
      pic: body.pic,
    } as any);

    return this.toCompactDto(record);
  }

  async retrieve(id: string): Promise<any> {
    const record = await this.templeCategoryModel.findByPk(id);
    if (!record) {
      throw new NotFoundException({ message: 'Data not found', status: 404 });
    }
    return this.toCompactDto(record);
  }

  async update(id: string, body: Record<string, any>): Promise<any> {
    const record = await this.templeCategoryModel.findByPk(id);
    if (!record) {
      throw new NotFoundException({ message: 'Data not found', status: 404 });
    }

    if (body.name !== undefined) record.name = body.name;
    if (body.desc !== undefined) record.desc = body.desc;
    if (body.shortname !== undefined) record.shortname = body.shortname;
    if (body.pic !== undefined) record.pic = body.pic;
    if (body.main_category_id !== undefined) record.mainCategoryId = body.main_category_id;
    if (body.main_category !== undefined) record.mainCategoryId = body.main_category;

    await record.save();
    return this.toCompactDto(record);
  }

  async remove(id: string): Promise<void> {
    const record = await this.templeCategoryModel.findByPk(id);
    if (!record) {
      throw new NotFoundException({ message: 'Data not found', status: 404 });
    }
    await record.destroy();
  }
}
