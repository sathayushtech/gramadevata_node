import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { TourGuide } from './tour-guide.model';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';
import { Register } from '../auth/user.model';
import { EntityStatus } from '../../common/enums';
import {
  coerceStringList,
  saveEntityImagesToAzure,
} from '../../common/utils/gramadevata.utils';

@Injectable()
export class TourGuideService {
  constructor(
    @InjectModel(TourGuide)
    private readonly tourGuideModel: typeof TourGuide,
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

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && !['page', 'page_size', 'search'].includes(key)) {
        where[key] = value;
      }
    }

    const rows = await this.tourGuideModel.findAll({ where, order: [['createdAt', 'DESC']] });

    if (!rows.length) {
      return { message: 'Data not found', status: 404 };
    }

    return rows.map((row) => this.toFullResponse(row));
  }

  /* ──────────────── CREATE ──────────────── */

  async create(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const imageLocations = coerceStringList(payload.image_location);

    const created = await this.tourGuideModel.create({
      ...(typeof payload._id === 'string' && payload._id.trim() ? { id: payload._id.trim() } : {}),
      ...(typeof payload.user_id === 'string' ? { userId: payload.user_id } : {}),
      ...(typeof payload.village_id === 'string' ? { villageId: payload.village_id } : {}),
      ...(typeof payload.temple_id === 'string' ? { templeId: payload.temple_id } : {}),
      createdAt: new Date(),
      ...(typeof payload.tourist_spot_covered === 'string' ? { touristSpotCovered: payload.tourist_spot_covered } : {}),
      ...(typeof payload.language === 'string' ? { language: payload.language } : {}),
      ...(typeof payload.mobile === 'string' ? { mobile: payload.mobile } : {}),
      ...(typeof payload.status === 'string' ? { status: payload.status } : {}),
      ...(typeof payload.event_id === 'string' ? { eventId: payload.event_id } : {}),
      imageLocation: null,
    } as any);

    const images = imageLocations.filter((img) => img && img !== 'null');
    const savedImages = await saveEntityImagesToAzure({
      configService: this.configService,
      images,
      id: String(created.id),
      name: created.userId ?? String(created.id),
      entityType: 'tour_guide',
    });

    if (savedImages.length) {
      created.imageLocation = savedImages;
      await created.save();
    }

    return this.toFullResponse(created);
  }

  /* ──────────────── RETRIEVE ──────────────── */

  async getActiveById(id: string): Promise<Record<string, unknown> | null> {
    const instance = await this.tourGuideModel.findOne({ where: { id, status: EntityStatus.ACTIVE } });
    if (!instance) return null;
    return this.toFullResponse(instance);
  }

  /* ──────────────── UPDATE (PUT + PATCH) ──────────────── */

  async update(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const instance = await this.tourGuideModel.findOne({ where: { id, status: EntityStatus.ACTIVE } });
    if (!instance) return null;

    const imageLocations = payload.image_location !== undefined ? coerceStringList(payload.image_location) : null;

    await instance.update({
      ...(typeof payload.user_id === 'string' ? { userId: payload.user_id } : {}),
      ...(typeof payload.village_id === 'string' ? { villageId: payload.village_id } : {}),
      ...(typeof payload.temple_id === 'string' ? { templeId: payload.temple_id } : {}),
      ...(typeof payload.tourist_spot_covered === 'string' ? { touristSpotCovered: payload.tourist_spot_covered } : {}),
      ...(typeof payload.language === 'string' ? { language: payload.language } : {}),
      ...(typeof payload.mobile === 'string' ? { mobile: payload.mobile } : {}),
      ...(typeof payload.status === 'string' ? { status: payload.status } : {}),
      ...(typeof payload.event_id === 'string' ? { eventId: payload.event_id } : {}),
    } as any);

    if (imageLocations !== null) {
      const images = imageLocations.filter((img) => img && img !== 'null');
      const savedImages = await saveEntityImagesToAzure({
        configService: this.configService,
        images,
        id: String(instance.id),
        name: instance.userId ?? String(instance.id),
        entityType: 'tour_guide',
      });
      if (savedImages.length) {
        instance.imageLocation = savedImages;
        await instance.save();
      }
    }

    return this.toFullResponse(instance);
  }

  /* ──────────────── DELETE ──────────────── */

  async removeActive(id: string): Promise<boolean> {
    const deleted = await this.tourGuideModel.destroy({ where: { id, status: EntityStatus.ACTIVE } });
    return deleted > 0;
  }

  /* ──────────────── BY LOCATION ──────────────── */

  async listByLocation(
    query: Record<string, string | undefined>,
  ): Promise<{ tour_guides: Record<string, unknown>[] }> {
    const inputValue = query.input_value?.trim();
    const search = query.search?.trim();

    if (!inputValue) {
      throw new BadRequestException('input_value is required');
    }

    const villageIds = await this.resolveVillageIdsByLocation(inputValue);

    if (!villageIds.length) {
      return { tour_guides: [] };
    }

    const where: any = { status: EntityStatus.ACTIVE, villageId: { [Op.in]: villageIds } };

    if (search) {
      where[Op.or] = [
        { language: { [Op.like]: `%${search}%` } },
        { touristSpotCovered: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
      ];
    }

    const rows = await this.tourGuideModel.findAll({
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
      tour_guides: rows.map((row) => this.toLocationResponse(row)),
    };
  }

  /* ──────────────── PRIVATE HELPERS ──────────────── */

  private toFullResponse(row: TourGuide): Record<string, unknown> {
    const plain = row.get({ plain: true }) as any;
    return {
      _id: String(plain.id),
      user_id: plain.userId ?? null,
      village_id: plain.villageId ?? null,
      temple_id: plain.templeId ?? null,
      created_at: plain.createdAt ?? null,
      tourist_spot_covered: plain.touristSpotCovered ?? null,
      language: plain.language ?? null,
      mobile: plain.mobile ?? null,
      status: plain.status ?? null,
      event_id: plain.eventId ?? null,
      image_location: this.resolveImages(this.parseImagePaths(plain.imageLocation)),
    };
  }

  private toLocationResponse(row: TourGuide): Record<string, unknown> {
    const plain = row.get({ plain: true }) as any;
    const village: Village | undefined = (row as any).village;
    return {
      _id: String(plain.id),
      user_id: plain.userId ?? null,
      village_id: this.toVillageLocation(village),
      temple_id: plain.templeId ?? null,
      created_at: plain.createdAt ?? null,
      tourist_spot_covered: plain.touristSpotCovered ?? null,
      language: plain.language ?? null,
      mobile: plain.mobile ?? null,
      status: plain.status ?? null,
      event_id: plain.eventId ?? null,
      image_location: this.resolveImages(this.parseImagePaths(plain.imageLocation)),
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
}
