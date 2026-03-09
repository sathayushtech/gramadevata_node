import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import type { CreationAttributes } from 'sequelize';
import { Op, literal } from 'sequelize';
import { EntityStatus } from '../../common/enums';
import { Country } from '../../common/models/country.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Comment } from '../comments/comment.model';
import { Register as User } from '../auth/user.model';
import { Connect } from '../connect/connect.model';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';
import { coerceList, extractLatLongFromUrl, toFileUrlList } from '../../common/utils/django-serializer';
import { Block } from '../block/block.model';
import { Village } from '../villages/village.model';
import { Temple } from './temple.model';
import { TempleCategory } from './temple-category.model';

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

@Injectable()
export class TempleService {
  constructor(
    @InjectModel(Temple)
    private readonly templeModel: typeof Temple,
    @InjectModel(Village)
    private readonly villageModel: typeof Village,
    @InjectModel(Block)
    private readonly blockModel: typeof Block,
    @InjectModel(District)
    private readonly districtModel: typeof District,
    @InjectModel(State)
    private readonly stateModel: typeof State,
    @InjectModel(Country)
    private readonly countryModel: typeof Country,
    @InjectModel(Connect)
    private readonly connectModel: typeof Connect,
    @InjectModel(Comment)
    private readonly commentModel: typeof Comment,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(TempleCategory)
    private readonly templeCategoryModel: typeof TempleCategory,
    private readonly configService: ConfigService,
  ) {}

  // Category ordering used in Django TempleView.list and GetTemplesByLocation.list.
  private readonly categoryOrderIds: string[] = [
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
    '742ccfe6-d0b5-11ee-84bd-0242ac110002',
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
    '6af7ab24-9a0e-42cb-a57a-372bc62cd842',
    '142a703b-e8ad-4550-b68a-6a0718b90922',
    '49eabde2-ce67-426a-a0ad-e51849910401',
    'd4f979f4-2f7a-4aab-9782-702b31a21087',
    '742fc5ca-d0b5-11ee-84bd-0242ac110002',
  ];

  private readonly noPaginationCategoryIds = new Set<string>([
    '74343760-d0b5-11ee-84bd-0242ac110002',
    '405033fe-fb78-49e0-aef9-35172863466c',
  ]);

  private readonly priorityOrderIds: string[] = [
    'd7df749f-97e8-4635-a211-371c44b3c31f',
    '630f3239-f515-47fb-be8d-db727b9f2174',
    'b78ac28e-d0b5-11ee-84bd-0242ac110002',
    'b78ac071-d0b5-11ee-84bd-0242ac110002',
  ];

  private buildCaseOrder(column: string, orderedIds: string[], defaultOrder: number) {
    const whens = orderedIds.map((id, idx) => `WHEN '${id}' THEN ${idx}`).join(' ');
    return `CASE ${column} ${whens} ELSE ${defaultOrder} END`;
  }

  private parsePage(value: unknown, defaultValue = 1) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (!Number.isFinite(parsed) || parsed < 1) return defaultValue;
    return parsed;
  }

  private parsePageSize(value: unknown, defaultValue = 50) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (!Number.isFinite(parsed) || parsed < 1) return defaultValue;
    return Math.min(parsed, 1000);
  }

  private buildPageUrl(basePath: string, query: Record<string, string | undefined>, page: number, pageSize: number): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      if (k === 'page' || k === 'page_size') continue;
      params.set(k, v);
    }
    params.set('page', String(page));
    params.set('page_size', String(pageSize));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  private parseList(raw: unknown) {
    return coerceList(raw).filter((v) => v && v.toLowerCase() !== 'null');
  }

  private async resolveVillageIds(inputValue: string): Promise<string[]> {
    if (await this.countryModel.findByPk(inputValue)) {
      const villages = await this.villageModel.findAll({
        attributes: ['id'],
        include: [
          {
            model: this.blockModel,
            required: true,
            attributes: [],
            include: [
              {
                model: this.districtModel,
                required: true,
                attributes: [],
                include: [
                  {
                    model: this.stateModel,
                    required: true,
                    attributes: [],
                    where: { countryId: inputValue },
                  },
                ],
              },
            ],
          },
        ],
      });
      return villages.map((v) => v.id);
    }

    if (await this.stateModel.findByPk(inputValue)) {
      const villages = await this.villageModel.findAll({
        attributes: ['id'],
        include: [
          {
            model: this.blockModel,
            required: true,
            attributes: [],
            include: [
              {
                model: this.districtModel,
                required: true,
                attributes: [],
                where: { stateId: inputValue },
              },
            ],
          },
        ],
      });
      return villages.map((v) => v.id);
    }

    if (await this.districtModel.findByPk(inputValue)) {
      const villages = await this.villageModel.findAll({
        attributes: ['id'],
        include: [
          {
            model: this.blockModel,
            required: true,
            attributes: [],
            where: { districtId: inputValue },
          },
        ],
      });
      return villages.map((v) => v.id);
    }

    if (await this.blockModel.findByPk(inputValue)) {
      const villages = await this.villageModel.findAll({
        attributes: ['id'],
        where: { blockId: inputValue },
      });
      return villages.map((v) => v.id);
    }

    if (await this.villageModel.findByPk(inputValue)) {
      return [inputValue];
    }

    return [];
  }

  private serializeObjectId(village?: Village | null) {
    if (!village?.block?.district?.state?.country) return null;
    return {
      _id: village.id,
      name: village.name,
      block: {
        block_id: village.block.id,
        name: village.block.name,
        district: {
          district_id: village.block.district.id,
          name: village.block.district.name,
          state: {
            state_id: village.block.district.state.id,
            name: village.block.district.state.name,
            country: {
              country_id: village.block.district.state.country.id,
              name: village.block.district.state.country.name,
            },
          },
        },
      },
    };
  }

  private async serializeComments(templeId: string) {
    const comments = await this.commentModel.findAll({
      where: { templeId, status: 'ACTIVE' },
      order: [['createdAt', 'DESC']],
      limit: 200,
    });

    const userIds = Array.from(new Set(comments.map((c) => c.userId).filter(Boolean))) as string[];
    const users = userIds.length
      ? await this.userModel.findAll({ where: { id: { [Op.in]: userIds } } })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u] as const));

    return comments.map((c) => {
      const u = c.userId ? userMap.get(c.userId) : undefined;
      return {
        _id: c.id,
        temple: c.templeId ? { id: c.templeId } : null,
        user: c.userId
          ? {
              id: c.userId,
              name: u?.fullName ?? null,
              username: u?.username ?? null,
            }
          : null,
        goshala: c.goshalaId ? { id: c.goshalaId } : null,
        event: c.eventId ? { id: c.eventId } : null,
        body: c.body,
        created_at: c.createdAt,
        status: c.status,
      };
    });
  }

  private async serializeNearbyTemples(temple: Temple) {
    if (!temple.village?.block?.district?.id) return [];
    const districtId = temple.village.block.district.id;
    const nearby = await this.templeModel.findAll({
      where: { status: EntityStatus.ACTIVE },
      include: [
        {
          model: Village,
          as: 'village',
          required: true,
          include: [
            {
              model: Block,
              as: 'block',
              required: true,
              where: { districtId },
            },
          ],
        },
      ],
      limit: 6,
    });

    return nearby
      .filter((t) => t.id !== temple.id)
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        name: t.name ?? null,
        map_location: t.templeMapLocation ?? null,
      }));
  }

  private async serializeTempleDetail(temple: Temple, user?: Record<string, unknown>) {
    const { latitude, longitude } = extractLatLongFromUrl(temple.templeMapLocation ?? null);

    const userId = typeof user?.id === 'string' ? user.id : undefined;
    const connection = userId
      ? await this.connectModel.findOne({ where: { userId, templeId: temple.id } })
      : null;

    const ismember = !!(userId && (await this.connectModel.count({ where: { userId, templeId: temple.id, connectedAs: 'MEMBER' } })));
    const ispujari = !!(userId && (await this.connectModel.count({ where: { userId, templeId: temple.id, connectedAs: 'PUJARI' } })));

    return {
      _id: temple.id,
      name: temple.name ?? null,
      diety: temple.diety ?? null,
      object_id: this.serializeObjectId(temple.village ?? null),
      temple_map_location: temple.templeMapLocation ?? null,
      address: temple.address ?? null,
      image_location: toFileUrlList(this.configService, temple.imageLocation),
      temple_timings: temple.templeTimings ?? null,
      contact_email: temple.contactEmail ?? null,
      contact_phone: temple.contactPhone ?? null,
      desc: temple.desc ?? null,
      temple_official_website: temple.templeOfficialWebsite ?? null,
      other_dieties: temple.otherDieties ?? null,
      dress_code: temple.dressCode ?? null,
      festivals: temple.festivals ?? null,
      temple_video: toFileUrlList(this.configService, temple.templeVideo),
      latitude,
      longitude,
      connectionId: connection?.id ?? null,
      ispujari,
      ismember,
      comments: await this.serializeComments(temple.id),
      nearby_temples: await this.serializeNearbyTemples(temple),
      user: temple.userId ?? null,
    };
  }

  async list(
    basePath: string,
    query: Record<string, string | undefined>,
    user?: Record<string, unknown>,
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const page = this.parsePage(query.page, 1);
    const pageSize = this.parsePageSize(query.page_size, 50);

    const where: Record<string, unknown> = { status: EntityStatus.ACTIVE };
    const search = (query.search || '').trim();
    if (search) {
      (where as any)[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
      ];
    }

    const categoryCase = this.buildCaseOrder('category', this.categoryOrderIds, 999);
    const priorityCase = this.buildCaseOrder('priority', this.priorityOrderIds, 999);

    const { rows, count } = await this.templeModel.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [[literal(categoryCase), 'ASC'], [literal(priorityCase), 'ASC']],
      include: [
        {
          model: Village,
          as: 'village',
          include: [
            {
              model: Block,
              as: 'block',
              include: [
                {
                  model: District,
                  as: 'district',
                  include: [
                    {
                      model: State,
                      as: 'state',
                      include: [{ model: Country, as: 'country' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const totalPages = Math.max(1, Math.ceil(count / pageSize));
    const next = page < totalPages ? this.buildPageUrl(basePath, query, page + 1, pageSize) : null;
    const previous = page > 1 ? this.buildPageUrl(basePath, query, page - 1, pageSize) : null;

    const results = await Promise.all(rows.map((t) => this.serializeTempleDetail(t, user)));
    return { count, next, previous, results };
  }

  async getById(id: string, user?: Record<string, unknown>): Promise<any> {
    const temple = await this.templeModel.findByPk(id, {
      include: [
        {
          model: Village,
          as: 'village',
          include: [
            {
              model: Block,
              as: 'block',
              include: [
                {
                  model: District,
                  as: 'district',
                  include: [
                    {
                      model: State,
                      as: 'state',
                      include: [{ model: Country, as: 'country' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    if (!temple) return null;
    return this.serializeTempleDetail(temple, user);
  }

  async create(payload: Record<string, unknown>, user?: Record<string, unknown>): Promise<any> {
    try {
      const images = this.parseList(payload.image_location ?? payload.imageLocation);
      const videos = this.parseList(payload.temple_video ?? payload.templeVideo);

      const created = await this.templeModel.create({
        categoryId: typeof payload.category === 'string' ? payload.category : typeof payload.category_id === 'string' ? payload.category_id : undefined,
        priorityId: typeof payload.priority === 'string' ? payload.priority : typeof payload.priority_id === 'string' ? payload.priority_id : undefined,
        name: typeof payload.name === 'string' ? payload.name : null,
        diety: typeof payload.diety === 'string' ? payload.diety : null,
        objectId: typeof payload.object_id === 'string' ? payload.object_id : typeof payload.objectId === 'string' ? payload.objectId : undefined,
        templeMapLocation: typeof payload.temple_map_location === 'string'
          ? payload.temple_map_location
          : typeof payload.templeMapLocation === 'string'
            ? payload.templeMapLocation
            : null,
        address: typeof payload.address === 'string' ? payload.address : null,
        contactEmail: typeof payload.contact_email === 'string' ? payload.contact_email : typeof payload.contactEmail === 'string' ? payload.contactEmail : null,
        contactPhone: typeof payload.contact_phone === 'string' ? payload.contact_phone : typeof payload.contactPhone === 'string' ? payload.contactPhone : null,
        desc: typeof payload.desc === 'string' ? payload.desc : null,
        templeTimings: typeof payload.temple_timings === 'string' ? payload.temple_timings : typeof payload.templeTimings === 'string' ? payload.templeTimings : null,
        templeOfficialWebsite: typeof payload.temple_official_website === 'string'
          ? payload.temple_official_website
          : typeof payload.templeOfficialWebsite === 'string'
            ? payload.templeOfficialWebsite
            : null,
        otherDieties: typeof payload.other_dieties === 'string' ? payload.other_dieties : typeof payload.otherDieties === 'string' ? payload.otherDieties : null,
        dressCode: typeof payload.dress_code === 'string' ? payload.dress_code : typeof payload.dressCode === 'string' ? payload.dressCode : undefined,
        festivals: typeof payload.festivals === 'string' ? payload.festivals : null,
        status: typeof payload.status === 'string' ? payload.status : EntityStatus.INACTIVE,
        userId: typeof payload.user === 'string' ? payload.user : typeof payload.user_id === 'string' ? payload.user_id : undefined,
        imageLocation: 'null',
        templeVideo: 'null',
      } as CreationAttributes<Temple>);

      const savedImages = await GramadevataUtils.saveEntityImagesToAzure({
        configService: this.configService,
        images,
        id: created.id,
        name: created.name ?? 'temple',
        entityType: 'temple',
      });
      const savedVideos = await GramadevataUtils.saveEntityVideosToAzure({
        configService: this.configService,
        videos,
        id: created.id,
        name: created.name ?? 'temple',
        entityType: 'temple',
      });

      if (savedImages.length) created.imageLocation = savedImages;
      if (savedVideos.length) created.templeVideo = savedVideos;
      if (savedImages.length || savedVideos.length) {
        await created.save();
      }

      const userId = typeof user?.id === 'string' ? user.id : 'Anonymous';
      const userName = typeof (user as any)?.full_name === 'string' ? (user as any).full_name : '';
      const recipients = [this.configService.get<string>('DEFAULT_FROM_EMAIL')].filter(Boolean) as string[];
      await GramadevataUtils.sendAdminEmail(this.configService, {
        subject: 'New Temple Added',
        text: `User ID: ${userId}\nFull Name: ${userName}\nCreated Time: ${new Date().toISOString()}\nTemple ID: ${created.id}\nTemple Name: ${created.name ?? ''}`,
        recipients,
      });

      return { status: 201, body: { message: 'success', result: await this.getById(created.id, user) } };
    } catch (error) {
      return {
        status: 500,
        body: {
          message: 'An error occurred.',
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async update(id: string, payload: Record<string, unknown>, user?: Record<string, unknown>): Promise<any> {
    try {
      const instance = await this.templeModel.findByPk(id);
      if (!instance) {
        return { status: 404, body: { message: 'Object not found', status: 404 } };
      }

      const images = this.parseList(payload.image_location ?? payload.imageLocation);

      const patch: Partial<Temple> = {};
      if (typeof payload.category === 'string') patch.categoryId = payload.category;
      if (typeof payload.priority === 'string') patch.priorityId = payload.priority;
      if (typeof payload.name === 'string') patch.name = payload.name;
      if (typeof payload.diety === 'string') patch.diety = payload.diety;
      if (typeof payload.object_id === 'string') patch.objectId = payload.object_id;
      if (typeof payload.temple_map_location === 'string') patch.templeMapLocation = payload.temple_map_location;
      if (typeof payload.address === 'string') patch.address = payload.address;
      if (typeof payload.contact_email === 'string') patch.contactEmail = payload.contact_email;
      if (typeof payload.contact_phone === 'string') patch.contactPhone = payload.contact_phone;
      if (typeof payload.desc === 'string') patch.desc = payload.desc;
      if (typeof payload.temple_timings === 'string') patch.templeTimings = payload.temple_timings;
      if (typeof payload.temple_official_website === 'string') patch.templeOfficialWebsite = payload.temple_official_website;
      if (typeof payload.other_dieties === 'string') patch.otherDieties = payload.other_dieties;
      if (typeof payload.dress_code === 'string') patch.dressCode = payload.dress_code;
      if (typeof payload.festivals === 'string') patch.festivals = payload.festivals;
      if (typeof payload.status === 'string') patch.status = payload.status;

      await instance.update(patch);

      if (images.length) {
        const saved = await GramadevataUtils.saveEntityImagesToAzure({
          configService: this.configService,
          images,
          id: instance.id,
          name: instance.name ?? 'temple',
          entityType: 'temple',
        });
        if (saved.length) {
          instance.imageLocation = saved;
          await instance.save();
        }
      }

      const userId = typeof user?.id === 'string' ? user.id : 'Anonymous';
      const userName = typeof (user as any)?.full_name === 'string' ? (user as any).full_name : '';
      const recipients = [this.configService.get<string>('DEFAULT_FROM_EMAIL')].filter(Boolean) as string[];
      await GramadevataUtils.sendAdminEmail(this.configService, {
        subject: 'Temple Updated',
        text: `User ID: ${userId}\nFull Name: ${userName}\nUpdated Time: ${new Date().toISOString()}\nTemple ID: ${instance.id}\nTemple Name: ${instance.name ?? ''}`,
        recipients,
      });

      return { status: 200, body: { message: 'updated successfully', data: await this.getById(instance.id, user) } };
    } catch (error) {
      return {
        status: 500,
        body: {
          message: 'An error occurred.',
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async remove(id: string): Promise<any> {
    const instance = await this.templeModel.findByPk(id);
    if (!instance) {
      return { status: 404, body: { message: 'Object not found', status: 404 } };
    }
    await instance.destroy();
    return { status: 200, body: { message: 'deleted successfully' } };
  }

  async locationByTemples(basePath: string, query: Record<string, string | undefined>): Promise<PaginatedResponse<Record<string, unknown>> | { count: number; next: null; previous: null; results: Record<string, unknown>[] }> {
    const inputValue = (query.input_value || '').trim();
    const category = (query.category || '').trim();

    if (!inputValue && !category) {
      throw new Error('Input value or category is required');
    }

    const where: Record<string, unknown> = { status: EntityStatus.ACTIVE };
    if (category) where.categoryId = category;

    const villageIds = inputValue ? await this.resolveVillageIds(inputValue) : [];
    if (inputValue && villageIds.length) {
      where.objectId = { [Op.in]: villageIds };
    } else if (inputValue) {
      where.objectId = inputValue;
    }

    const search = (query.search || '').trim();
    if (search) {
      (where as any)[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
      ];
    }

    const categoryCase = this.buildCaseOrder('category', this.categoryOrderIds, 999);
    const priorityCase = this.buildCaseOrder('priority', this.priorityOrderIds, 999);

    const serializeCity = (t: Temple) => ({
      _id: t.id,
      name: t.name ?? null,
      image_location: toFileUrlList(this.configService, t.imageLocation),
      object_id: this.serializeObjectId(t.village ?? null),
    });

    if (category && this.noPaginationCategoryIds.has(category)) {
      const records = await this.templeModel.findAll({
        where,
        order: [[literal(categoryCase), 'ASC'], [literal(priorityCase), 'ASC']],
        include: [
          {
            model: Village,
            as: 'village',
            include: [
              {
                model: Block,
                as: 'block',
                include: [
                  {
                    model: District,
                    as: 'district',
                    include: [
                      {
                        model: State,
                        as: 'state',
                        include: [{ model: Country, as: 'country' }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      return {
        count: records.length,
        next: null,
        previous: null,
        results: records.map(serializeCity),
      };
    }

    const page = this.parsePage(query.page, 1);
    const pageSize = this.parsePageSize(query.page_size, 50);
    const { rows, count } = await this.templeModel.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [[literal(categoryCase), 'ASC'], [literal(priorityCase), 'ASC']],
      include: [
        {
          model: Village,
          as: 'village',
          include: [
            {
              model: Block,
              as: 'block',
              include: [
                {
                  model: District,
                  as: 'district',
                  include: [
                    {
                      model: State,
                      as: 'state',
                      include: [{ model: Country, as: 'country' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const totalPages = Math.max(1, Math.ceil(count / pageSize));
    const next = page < totalPages ? this.buildPageUrl(basePath, query, page + 1, pageSize) : null;
    const previous = page > 1 ? this.buildPageUrl(basePath, query, page - 1, pageSize) : null;

    return { count, next, previous, results: rows.map(serializeCity) };
  }

  private humanRelativeTime(date: Date | undefined) {
    if (!date) return null;
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec} seconds ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minutes ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hours ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} days ago`;
  }

  async inactiveLocationByTemples(basePath: string, query: Record<string, string | undefined>): Promise<any> {
    const inputValue = (query.input_value || '').trim();
    const category = (query.category || '').trim();

    if (!inputValue && !category) {
      throw new Error('Input value or category is required');
    }

    const where: Record<string, unknown> = { status: EntityStatus.INACTIVE };
    if (category) where.categoryId = category;

    const villageIds = inputValue ? await this.resolveVillageIds(inputValue) : [];
    if (inputValue && villageIds.length) {
      where.objectId = { [Op.in]: villageIds };
    } else if (inputValue) {
      where.objectId = inputValue;
    }

    const categoryCase = this.buildCaseOrder('category', this.categoryOrderIds, 999);
    const priorityCase = this.buildCaseOrder('priority', this.priorityOrderIds, 999);

    const page = this.parsePage(query.page, 1);
    const pageSize = this.parsePageSize(query.page_size, 50);

    const { rows, count } = await this.templeModel.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [[literal(categoryCase), 'ASC'], [literal(priorityCase), 'ASC']],
      include: [{ model: User, as: 'user' }],
    });

    const totalPages = Math.max(1, Math.ceil(count / pageSize));
    const next = page < totalPages ? this.buildPageUrl(basePath, query, page + 1, pageSize) : null;
    const previous = page > 1 ? this.buildPageUrl(basePath, query, page - 1, pageSize) : null;

    const results = rows.map((t) => {
      const plain = t.get({ plain: true }) as any;
      return {
        ...plain,
        _id: plain.id,
        image_location: toFileUrlList(this.configService, plain.imageLocation),
        user_full_name: t.user?.fullName ?? null,
        relative_time: this.humanRelativeTime(t.createdAt),
      };
    });

    return { count, next, previous, results };
  }

  // ──────────────── Django field-name → Sequelize attribute mapping ────────────────

  private readonly DJANGO_FIELD_MAP: Record<string, string> = {
    _id: 'id', category: 'categoryId', priority: 'priorityId', object_id: 'objectId',
    user: 'userId', temple_map_location: 'templeMapLocation', contact_name: 'contactName',
    contact_phone: 'contactPhone', contact_email: 'contactEmail', geo_site: 'geoSite',
    old_temple_code: 'oldTempleCode', can_connect: 'canConnect', temple_area: 'templeArea',
    temple_timings: 'templeTimings', temple_official_website: 'templeOfficialWebsite',
    other_dieties: 'otherDieties', temple_management: 'templeManagement',
    sthala_vriksha: 'sthalaVriksha', other_speciality: 'otherSpeciality',
    sthala_puranam: 'sthalaPuranam', dress_code: 'dressCode', temple_video: 'templeVideo',
    country_name: 'countryName', state_name: 'stateName', district_name: 'districtName',
    block_name: 'blockName', village_name: 'villageName', other_name: 'otherName',
    country: 'countryId', is_navagraha_established: 'isNavagrahaEstablished',
    construction_year: 'constructionYear', is_destroyed: 'isDestroyed',
    animal_sacrifice_status: 'animalSacrificeStatus', image_location: 'imageLocation',
    created_at: 'createdAt',
  };

  // ──────────────── Village chain include reusable fragment ────────────────

  private get villageChainInclude() {
    return [
      {
        model: Village,
        as: 'village',
        include: [
          {
            model: Block,
            as: 'block',
            include: [
              {
                model: District,
                as: 'district',
                include: [
                  { model: State, as: 'state', include: [{ model: Country, as: 'country' }] },
                ],
              },
            ],
          },
        ],
      },
    ];
  }

  // ──────────────── temple_inactive ────────────────

  async listInactive(
    basePath: string,
    query: Record<string, string | undefined>,
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const page = this.parsePage(query.page, 1);
    const pageSize = this.parsePageSize(query.page_size, 50);

    const where: Record<string | symbol, unknown> = { status: EntityStatus.INACTIVE };
    const search = (query.search || '').trim();
    if (search) {
      (where as any)[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
      ];
    }

    const priorityCase = this.buildCaseOrder('priority', this.priorityOrderIds, 999);

    const { rows, count } = await this.templeModel.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [[literal(priorityCase), 'ASC']],
      include: [{ model: User, as: 'user' }],
    });

    const totalPages = Math.max(1, Math.ceil(count / pageSize));
    const next = page < totalPages ? this.buildPageUrl(basePath, query, page + 1, pageSize) : null;
    const previous = page > 1 ? this.buildPageUrl(basePath, query, page - 1, pageSize) : null;

    const results = rows.map((t) => {
      const plain = t.get({ plain: true }) as any;
      return {
        ...plain,
        _id: plain.id,
        image_location: toFileUrlList(this.configService, plain.imageLocation),
        user_full_name: t.user?.fullName ?? null,
        relative_time: this.humanRelativeTime(t.createdAt),
      };
    });

    return { count, next, previous, results };
  }

  // ──────────────── temple_inactive_get ────────────────

  async getInactiveByField(
    fieldName: string,
    inputValue: string,
    user?: Record<string, unknown>,
  ): Promise<Record<string, unknown>[]> {
    const seqField = this.DJANGO_FIELD_MAP[fieldName] ?? fieldName;
    const temples = await this.templeModel.findAll({
      where: { [seqField]: inputValue, status: EntityStatus.INACTIVE },
      include: this.villageChainInclude,
    });
    return Promise.all(temples.map((t) => this.serializeTempleDetail(t, user)));
  }

  // ──────────────── templemain ────────────────

  async getTempleMain(user?: Record<string, unknown>): Promise<Record<string, unknown>> {
    const MAIN_CATEGORY_IDS = [
      '742ecf7b-d0b5-11ee-84bd-0242ac110002',
      '742f645c-d0b5-11ee-84bd-0242ac110002',
      '74353e76-d0b5-11ee-84bd-0242ac110002',
      '74344055-d0b5-11ee-84bd-0242ac110002',
    ];

    const [categories, indianTemplesRaw, globalTemplesRaw] = await Promise.all([
      this.templeCategoryModel.findAll({ where: { id: { [Op.in]: MAIN_CATEGORY_IDS } } }),
      this.templeModel.findAll({
        where: { status: EntityStatus.ACTIVE, geoSite: 'Village', objectId: { [Op.ne]: null as any } },
        limit: 4,
        include: this.villageChainInclude,
      }),
      this.templeModel.findAll({
        where: {
          status: EntityStatus.ACTIVE,
          geoSite: { [Op.notIn]: ['Village', 'State', 'District', 'Block'] },
        },
        limit: 4,
        include: this.villageChainInclude,
      }),
    ]);

    const [indianTemples, globalTemples] = await Promise.all([
      Promise.all(indianTemplesRaw.map((t) => this.serializeTempleDetail(t, user))),
      Promise.all(globalTemplesRaw.map((t) => this.serializeTempleDetail(t, user))),
    ]);

    return {
      temple_categories: categories.map((c) => ({
        _id: c.id,
        name: c.name,
        desc: c.desc ?? null,
        shortname: c.shortname ?? null,
        created_at: c.createdAt ?? null,
        pic: c.pic ?? null,
        main_category_id: c.mainCategoryId ?? null,
      })),
      indian_temples: indianTemples,
      global_temples: globalTemples,
    };
  }

  // ──────────────── templepost (membership-gated create) ────────────────

  async createWithMembershipCheck(
    payload: Record<string, unknown>,
    user?: Record<string, unknown>,
  ): Promise<{ status: number; body: Record<string, unknown> }> {
    const userId =
      typeof payload.user === 'string' ? payload.user
      : typeof payload.user_id === 'string' ? payload.user_id
      : undefined;

    if (!userId) {
      return { status: 400, body: { message: 'User ID is required.' } };
    }

    const register = await this.userModel.findByPk(userId);
    if (!register) {
      return { status: 404, body: { message: 'User not found. Please register.' } };
    }

    if ((register as any).isMember === 'NO') {
      return { status: 400, body: { message: "You're not a member. Please register as a member." } };
    }

    return this.create(payload, user);
  }
}
