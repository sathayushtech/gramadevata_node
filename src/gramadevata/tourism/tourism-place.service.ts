import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { TempleNearbyTourismPlace } from './temple-nearby-tourism.model';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';
import { Register } from '../auth/user.model';
import { EntityStatus } from '../../common/enums';
import {
  coerceStringList,
  formatDjangoDateTime,
  saveEntityImagesToAzure,
  sendAdminEmail,
} from '../../common/utils/gramadevata.utils';

type RequestLike = {
  protocol: string;
  get(name: string): string | undefined;
  path: string;
  query: unknown;
};

type DrfPagination<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

@Injectable()
export class TourismPlaceService {
  constructor(
    @InjectModel(TempleNearbyTourismPlace)
    private readonly tourismModel: typeof TempleNearbyTourismPlace,
    @InjectModel(Village)
    private readonly villageModel: typeof Village,
    @InjectModel(Block)
    private readonly blockModel: typeof Block,
    @InjectModel(District)
    private readonly districtModel: typeof District,
    @InjectModel(State)
    private readonly stateModel: typeof State,
    @InjectModel(Register)
    private readonly registerModel: typeof Register,
    private readonly configService: ConfigService,
  ) {}

  /* ──────────────── LIST (ACTIVE) ──────────────── */

  async listActive(
    query: Record<string, string | undefined>,
  ): Promise<Record<string, unknown>[] | { message: string; status: number }> {
    const where: Record<string, unknown> = { status: EntityStatus.ACTIVE };

    // Apply extra query-param filters (Django does filter(**filter_kwargs))
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && !['page', 'page_size', 'search'].includes(key)) {
        where[key] = value;
      }
    }

    const rows = await this.tourismModel.findAll({ where, order: [['createdAt', 'DESC']] });

    if (!rows.length) {
      return { message: 'Data not found', status: 404 };
    }

    return rows.map((row) => this.toFullResponse(row));
  }

  /* ──────────────── CREATE ──────────────── */

  async create(payload: Record<string, unknown>): Promise<{ message: string; result: Record<string, unknown> }> {
    const imageLocations = coerceStringList(payload.image_location);

    const created = await this.tourismModel.create({
      ...(typeof payload._id === 'string' && payload._id.trim() ? { id: payload._id.trim() } : {}),
      ...(typeof payload.name === 'string' ? { name: payload.name } : {}),
      ...(typeof payload.temple_id === 'string' ? { templeId: payload.temple_id } : {}),
      createdAt: new Date(),
      ...(typeof payload.address === 'string' ? { address: payload.address } : {}),
      ...(typeof payload.map_location === 'string' ? { mapLocation: payload.map_location } : {}),
      ...(typeof payload.village_id === 'string' ? { villageId: payload.village_id } : {}),
      ...(typeof payload.status === 'string' ? { status: payload.status } : {}),
      ...(typeof payload.user_id === 'string' ? { userId: payload.user_id } : {}),
      imageLocation: null,
      ...(typeof payload.desc === 'string' ? { desc: payload.desc } : {}),
      ...(typeof payload.timings === 'string' ? { timings: payload.timings } : {}),
      ...(typeof payload.type === 'string' ? { type: payload.type } : {}),
      ...(typeof payload.goshala_id === 'string' ? { goshalaId: payload.goshala_id } : {}),
      ...(typeof payload.country === 'string' ? { countryId: payload.country } : {}),
    } as any);

    const images = imageLocations.filter((img) => img && img !== 'null');
    const savedImages = await saveEntityImagesToAzure({
      configService: this.configService,
      images,
      id: String(created.id),
      name: (created.name ?? 'tourism').toString(),
      entityType: 'tourism',
    });

    if (savedImages.length) {
      await created.update({ imageLocation: savedImages } as any);
    }

    const now = new Date();
    const userId = typeof payload.user_id === 'string' ? payload.user_id : 'Anonymous';

    await sendAdminEmail(this.configService, {
      subject: 'New Temple Nearby Tourism Place Added',
      text:
        `User ID: ${userId}\n` +
        `Created Time: ${formatDjangoDateTime(now)}\n` +
        `Tourism Place ID: ${String(created.id)}\n` +
        `Tourism Place Name: ${created.name ?? ''}`,
      recipients: [this.configService.get<string>('DEFAULT_FROM_EMAIL')].filter(
        (e): e is string => typeof e === 'string' && e.trim().length > 0,
      ),
    });

    return { message: 'success', result: this.toFullResponse(created) };
  }

  /* ──────────────── RETRIEVE (with related temples/goshalas/events) ──────────────── */

  async getActiveById(id: string): Promise<Record<string, unknown> | null> {
    const instance = await this.tourismModel.findOne({
      where: { id, status: EntityStatus.ACTIVE },
      include: [
        {
          model: Village,
          required: false,
          include: [
            {
              model: Block,
              required: false,
              include: [
                {
                  model: District,
                  required: false,
                  include: [
                    {
                      model: State,
                      required: false,
                      include: [{ model: Country, required: false }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!instance) {
      return null;
    }

    return this.toFullResponse(instance);
  }

  /* ──────────────── UPDATE ──────────────── */

  async update(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const instance = await this.tourismModel.findOne({ where: { id, status: EntityStatus.ACTIVE } });
    if (!instance) {
      return null;
    }

    const imageLocations = payload.image_location !== undefined ? coerceStringList(payload.image_location) : null;

    await instance.update({
      ...(typeof payload.name === 'string' ? { name: payload.name } : {}),
      ...(typeof payload.temple_id === 'string' ? { templeId: payload.temple_id } : {}),
      ...(typeof payload.address === 'string' ? { address: payload.address } : {}),
      ...(typeof payload.map_location === 'string' ? { mapLocation: payload.map_location } : {}),
      ...(typeof payload.village_id === 'string' ? { villageId: payload.village_id } : {}),
      ...(typeof payload.status === 'string' ? { status: payload.status } : {}),
      ...(typeof payload.user_id === 'string' ? { userId: payload.user_id } : {}),
      ...(imageLocations !== null ? { imageLocation: null } : {}),
      ...(typeof payload.desc === 'string' ? { desc: payload.desc } : {}),
      ...(typeof payload.timings === 'string' ? { timings: payload.timings } : {}),
      ...(typeof payload.type === 'string' ? { type: payload.type } : {}),
      ...(typeof payload.goshala_id === 'string' ? { goshalaId: payload.goshala_id } : {}),
      ...(typeof payload.country === 'string' ? { countryId: payload.country } : {}),
    } as any);

    if (imageLocations !== null) {
      const images = imageLocations.filter((img) => img && img !== 'null');
      const savedImages = await saveEntityImagesToAzure({
        configService: this.configService,
        images,
        id: String(instance.id),
        name: (instance.name ?? 'tourism').toString(),
        entityType: 'tourism',
      });
      if (savedImages.length) {
        await instance.update({ imageLocation: savedImages } as any);
      }
    }

    return this.toFullResponse(instance);
  }

  /* ──────────────── DELETE ──────────────── */

  async removeActive(id: string): Promise<boolean> {
    const deleted = await this.tourismModel.destroy({ where: { id, status: EntityStatus.ACTIVE } });
    return deleted > 0;
  }

  /* ──────────────── TOURISM BY LOCATION ──────────────── */

  async listByLocation(
    statusFilter: EntityStatus,
    query: Record<string, string | undefined>,
  ): Promise<{ tourism_places: Record<string, unknown>[] }> {
    const inputValue = query.input_value?.trim();
    const search = query.search?.trim();

    if (!inputValue) {
      throw new BadRequestException('input_value is required.');
    }

    const villageIds = await this.resolveVillageIdsByLocation(inputValue);

    const where: any = { status: statusFilter };
    if (villageIds.length) {
      where.villageId = { [Op.in]: villageIds };
    } else {
      // No matching villages — return empty
      return { tourism_places: [] };
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
      ];
    }

    const rows = await this.tourismModel.findAll({
      where,
      include: [
        {
          model: Village,
          required: false,
          include: [
            {
              model: Block,
              required: false,
              include: [
                {
                  model: District,
                  required: false,
                  include: [
                    {
                      model: State,
                      required: false,
                      include: [{ model: Country, required: false }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return {
      tourism_places: rows.map((row) => this.toLocationResponse(row)),
    };
  }

  /* ──────────────── INACTIVE LIST (tourism_inactive) ──────────────── */

  async listInactive(
    query: Record<string, string | undefined>,
  ): Promise<{ count: number; results: Record<string, unknown>[]; message?: string }> {
    const search = query.search?.trim();

    const where: any = { status: EntityStatus.INACTIVE };
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
      ];
    }

    const rows = await this.tourismModel.findAll({ where, order: [['createdAt', 'DESC']] });

    if (!rows.length) {
      return { message: 'Data not found', count: 0, results: [] };
    }

    // Fetch user full names
    const userIds = Array.from(
      new Set(
        rows
          .map((row) => row.userId)
          .filter((uid): uid is string => typeof uid === 'string' && uid.trim().length > 0),
      ),
    );

    const users = userIds.length
      ? await this.registerModel.findAll({ where: { id: { [Op.in]: userIds } } })
      : [];

    const userMap = new Map(users.map((u) => [String(u.id), u.fullName ?? null]));

    const results = rows.map((row) => {
      const base = this.toFullResponse(row);
      const createdAt = row.createdAt ?? null;
      return {
        ...base,
        user_full_name: row.userId ? userMap.get(String(row.userId)) ?? null : null,
        relative_time: createdAt ? this.relativeTime(createdAt) : null,
      };
    });

    return { count: rows.length, results };
  }

  /* ──────────────── PRIVATE HELPERS ──────────────── */

  private toFullResponse(row: TempleNearbyTourismPlace): Record<string, unknown> {
    const plain = row.get({ plain: true }) as any;
    return {
      _id: String(plain.id),
      name: plain.name ?? null,
      temple_id: plain.templeId ?? null,
      created_at: plain.createdAt ?? null,
      address: plain.address ?? null,
      map_location: plain.mapLocation ?? null,
      village_id: plain.villageId ?? null,
      status: plain.status ?? null,
      user_id: plain.userId ?? null,
      image_location: this.resolveImages(this.parseImagePaths(plain.imageLocation)),
      desc: plain.desc ?? null,
      timings: plain.timings ?? null,
      type: plain.type ?? null,
      goshala_id: plain.goshalaId ?? null,
      country: plain.countryId ?? null,
    };
  }

  private toLocationResponse(row: TempleNearbyTourismPlace): Record<string, unknown> {
    const plain = row.get({ plain: true }) as any;
    const village: Village | undefined = (row as any).village;
    return {
      _id: String(plain.id),
      name: plain.name ?? null,
      image_location: this.resolveImages(this.parseImagePaths(plain.imageLocation)),
      village_id: this.toVillageLocation(village),
    };
  }

  private toVillageLocation(village?: Village) {
    if (!village) return null;

    const block: Block | undefined = (village as any).block;
    const district: District | undefined = block ? (block as any).district : undefined;
    const state: State | undefined = district ? (district as any).state : undefined;
    const country: Country | undefined = state ? (state as any).country : undefined;

    if (!block || !district || !state || !country) return null;

    return {
      _id: String(village.id),
      name: village.name,
      block: {
        block_id: String(block.id),
        name: block.name,
        district: {
          district_id: String(district.id),
          name: district.name,
          state: {
            state_id: String(state.id),
            name: state.name,
            country: {
              country_id: String(country.id),
              name: country.name,
            },
          },
        },
      },
    };
  }

  private resolveImages(paths: string[]): string[] {
    if (!paths.length) return [];
    const fileUrl = this.configService.get<string>('FILE_URL');
    if (!fileUrl) return paths;
    const base = fileUrl.endsWith('/') ? fileUrl.slice(0, -1) : fileUrl;
    return paths.map((p) => `${base}/${p.startsWith('/') ? p.slice(1) : p}`);
  }

  private parseImagePaths(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string').map((i) => i.trim()).filter(Boolean);
    }
    if (typeof value !== 'string') return [];
    const raw = value.trim();
    if (!raw || raw.toLowerCase() === 'null') return [];
    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((i): i is string => typeof i === 'string').map((i) => i.trim()).filter(Boolean);
        }
      } catch { /* fallthrough */ }
      return raw.slice(1, -1).replace(/"/g, '').replace(/'/g, '').split(',').map((p) => p.trim()).filter(Boolean);
    }
    return [raw];
  }

  private async resolveVillageIdsByLocation(inputValue: string): Promise<string[]> {
    const found = new Set<string>();

    const villagesByVillage = await this.villageModel.findAll({ where: { id: inputValue }, attributes: ['id'] });
    villagesByVillage.forEach((v) => found.add(String(v.id)));

    const villagesByBlock = await this.villageModel.findAll({ where: { blockId: inputValue }, attributes: ['id'] });
    villagesByBlock.forEach((v) => found.add(String(v.id)));

    const blocksByDistrict = await this.blockModel.findAll({ where: { districtId: inputValue }, attributes: ['id'] });
    if (blocksByDistrict.length) {
      const blockIds = blocksByDistrict.map((b) => String(b.id));
      const villages = await this.villageModel.findAll({ where: { blockId: { [Op.in]: blockIds } }, attributes: ['id'] });
      villages.forEach((v) => found.add(String(v.id)));
    }

    const districtsByState = await this.districtModel.findAll({ where: { stateId: inputValue }, attributes: ['id'] });
    if (districtsByState.length) {
      const districtIds = districtsByState.map((d) => String(d.id));
      const blocks = await this.blockModel.findAll({ where: { districtId: { [Op.in]: districtIds } }, attributes: ['id'] });
      const blockIds = blocks.map((b) => String(b.id));
      if (blockIds.length) {
        const villages = await this.villageModel.findAll({ where: { blockId: { [Op.in]: blockIds } }, attributes: ['id'] });
        villages.forEach((v) => found.add(String(v.id)));
      }
    }

    const statesByCountry = await this.stateModel.findAll({ where: { countryId: inputValue }, attributes: ['id'] });
    if (statesByCountry.length) {
      const stateIds = statesByCountry.map((s) => String(s.id));
      const districts = await this.districtModel.findAll({ where: { stateId: { [Op.in]: stateIds } }, attributes: ['id'] });
      const districtIds = districts.map((d) => String(d.id));
      if (districtIds.length) {
        const blocks = await this.blockModel.findAll({ where: { districtId: { [Op.in]: districtIds } }, attributes: ['id'] });
        const blockIds = blocks.map((b) => String(b.id));
        if (blockIds.length) {
          const villages = await this.villageModel.findAll({ where: { blockId: { [Op.in]: blockIds } }, attributes: ['id'] });
          villages.forEach((v) => found.add(String(v.id)));
        }
      }
    }

    return Array.from(found);
  }

  private relativeTime(date: Date): string {
    const deltaSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    const minutes = Math.floor(deltaSeconds / 60);
    if (minutes < 60) return `${minutes || 0} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} months ago`;
    const years = Math.floor(months / 12);
    return `${years} years ago`;
  }
}
