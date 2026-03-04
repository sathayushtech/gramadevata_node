import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { TourOperator } from './tour-operator.model';
import { AddMoreTourOperator } from './add-more-tour-operator.model';
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
export class TourOperatorService {
  constructor(
    @InjectModel(TourOperator)
    private readonly tourOperatorModel: typeof TourOperator,
    @InjectModel(AddMoreTourOperator)
    private readonly addMoreModel: typeof AddMoreTourOperator,
    @InjectModel(Village)
    private readonly villageModel: typeof Village,
    @InjectModel(Block)
    private readonly blockModel: typeof Block,
    @InjectModel(District)
    private readonly districtModel: typeof District,
    @InjectModel(State)
    private readonly stateModel: typeof State,
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

    const rows = await this.tourOperatorModel.findAll({ where, order: [['createdAt', 'DESC']] });

    if (!rows.length) {
      return { message: 'No Tour Operators found', status: 404 };
    }

    return rows.map((row) => this.toFullResponse(row));
  }

  /* ──────────────── CREATE ──────────────── */

  async create(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const imageLocations = coerceStringList(payload.image_location);

    const created = await this.tourOperatorModel.create({
      ...(typeof payload._id === 'string' && payload._id.trim() ? { id: payload._id.trim() } : {}),
      ...(typeof payload.tour_operator_name === 'string' ? { tourOperatorName: payload.tour_operator_name } : {}),
      ...(typeof payload.temple_id === 'string' ? { templeId: payload.temple_id } : {}),
      ...(typeof payload.user_id === 'string' ? { userId: payload.user_id } : {}),
      ...(typeof payload.rating === 'string' ? { rating: payload.rating } : {}),
      createdAt: new Date(),
      ...(typeof payload.mobile_number === 'string' ? { mobileNumber: payload.mobile_number } : {}),
      ...(typeof payload.website === 'string' ? { website: payload.website } : {}),
      ...(typeof payload.email === 'string' ? { email: payload.email } : {}),
      ...(typeof payload.village_id === 'string' ? { villageId: payload.village_id } : {}),
      ...(typeof payload.contact_address === 'string' ? { contactAddress: payload.contact_address } : {}),
      ...(typeof payload.status === 'string' ? { status: payload.status } : {}),
      ...(typeof payload.map_location === 'string' ? { mapLocation: payload.map_location } : {}),
      ...(typeof payload.event_id === 'string' ? { eventId: payload.event_id } : {}),
      imageLocation: null,
    } as any);

    const images = imageLocations.filter((img) => img && img !== 'null');
    const savedImages = await saveEntityImagesToAzure({
      configService: this.configService,
      images,
      id: String(created.id),
      name: created.tourOperatorName ?? 'tour_operator',
      entityType: 'tour_operator',
    });

    if (savedImages.length) {
      created.imageLocation = savedImages;
      await created.save();
    }

    return this.toFullResponse(created);
  }

  /* ──────────────── RETRIEVE ──────────────── */

  async getActiveById(id: string): Promise<Record<string, unknown> | null> {
    const instance = await this.tourOperatorModel.findOne({ where: { id, status: EntityStatus.ACTIVE } });
    if (!instance) return null;
    return this.toFullResponse(instance);
  }

  /* ──────────────── UPDATE (supports PUT and PATCH) ──────────────── */

  async update(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const instance = await this.tourOperatorModel.findOne({ where: { id, status: EntityStatus.ACTIVE } });
    if (!instance) return null;

    const imageLocations = payload.image_location !== undefined ? coerceStringList(payload.image_location) : null;

    await instance.update({
      ...(typeof payload.tour_operator_name === 'string' ? { tourOperatorName: payload.tour_operator_name } : {}),
      ...(typeof payload.temple_id === 'string' ? { templeId: payload.temple_id } : {}),
      ...(typeof payload.user_id === 'string' ? { userId: payload.user_id } : {}),
      ...(typeof payload.rating === 'string' ? { rating: payload.rating } : {}),
      ...(typeof payload.mobile_number === 'string' ? { mobileNumber: payload.mobile_number } : {}),
      ...(typeof payload.website === 'string' ? { website: payload.website } : {}),
      ...(typeof payload.email === 'string' ? { email: payload.email } : {}),
      ...(typeof payload.village_id === 'string' ? { villageId: payload.village_id } : {}),
      ...(typeof payload.contact_address === 'string' ? { contactAddress: payload.contact_address } : {}),
      ...(typeof payload.status === 'string' ? { status: payload.status } : {}),
      ...(typeof payload.map_location === 'string' ? { mapLocation: payload.map_location } : {}),
      ...(typeof payload.event_id === 'string' ? { eventId: payload.event_id } : {}),
    } as any);

    if (imageLocations !== null) {
      const existing = this.parseImagePaths(instance.imageLocation);
      const images = imageLocations.filter((img) => img && img !== 'null');
      const savedImages = await saveEntityImagesToAzure({
        configService: this.configService,
        images,
        id: String(instance.id),
        name: instance.tourOperatorName ?? 'tour_operator',
        entityType: 'tour_operator',
      });
      const merged = [...existing, ...savedImages];
      if (merged.length) {
        instance.imageLocation = merged;
        await instance.save();
      }
    }

    return this.toFullResponse(instance);
  }

  /* ──────────────── DELETE ──────────────── */

  async removeActive(id: string): Promise<boolean> {
    const deleted = await this.tourOperatorModel.destroy({ where: { id, status: EntityStatus.ACTIVE } });
    return deleted > 0;
  }

  /* ──────────────── BY LOCATION ──────────────── */

  async listByLocation(
    query: Record<string, string | undefined>,
  ): Promise<{ tour_operators: Record<string, unknown>[] }> {
    const inputValue = query.input_value?.trim();
    const search = query.search?.trim();

    if (!inputValue) {
      throw new BadRequestException('input_value is required');
    }

    const villageIds = await this.resolveVillageIdsByLocation(inputValue);

    if (!villageIds.length) {
      return { tour_operators: [] };
    }

    const where: any = { status: EntityStatus.ACTIVE, villageId: { [Op.in]: villageIds } };

    if (search) {
      where[Op.or] = [
        { tourOperatorName: { [Op.like]: `%${search}%` } },
        { contactAddress: { [Op.like]: `%${search}%` } },
        { mobileNumber: { [Op.like]: `%${search}%` } },
      ];
    }

    const rows = await this.tourOperatorModel.findAll({
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
      tour_operators: rows.map((row) => this.toLocationResponse(row)),
    };
  }

  /* ──────────────── MERGE ──────────────── */

  async merge(
    operatorId: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    const operator = await this.addMoreModel.findOne({ where: { id: operatorId } });
    if (!operator) return null;

    const newDesc = typeof payload.desc === 'string' ? payload.desc.trim() : '';
    const newImages = coerceStringList(payload.image_location);
    const newMapLocation = this.cleanMapLocation(payload.map_location);

    const oldDesc = (operator as any).desc || '';
    const oldImages = this.parseImagePaths(operator.imageLocation);
    const oldMapLocation = this.cleanMapLocation(operator.mapLocation);

    // Find duplicates by name
    const duplicates = await this.addMoreModel.findAll({
      where: {
        tourOperatorName: { [Op.like]: operator.tourOperatorName ?? '' },
        id: { [Op.ne]: operatorId },
      },
    });

    const allDescs: string[] = [];
    const allImages: string[] = [];
    const allMapLocations: string[] = [];

    for (const dup of duplicates) {
      if ((dup as any).desc) allDescs.push(String((dup as any).desc).trim());
      allImages.push(...this.parseImagePaths(dup.imageLocation));
      allMapLocations.push(...this.cleanMapLocation(dup.mapLocation));
    }

    // Merge (deduplicate)
    const mergedDesc = [...new Set([oldDesc, ...allDescs, newDesc].filter(Boolean))].join(', ');
    const mergedImages = [...new Set([...oldImages, ...allImages, ...newImages])];
    const mergedMapLocation = [...new Set([...oldMapLocation, ...allMapLocations, ...newMapLocation])];

    // Save operator
    await operator.update({
      status: EntityStatus.ACTIVE,
    } as any);

    // The AddMoreTourOperator model may not have desc, so set via raw
    (operator as any).desc = mergedDesc;
    operator.imageLocation = mergedImages;
    operator.mapLocation = mergedMapLocation.length ? JSON.stringify(mergedMapLocation) : undefined;
    await operator.save();

    // Delete duplicates
    if (duplicates.length) {
      await this.addMoreModel.destroy({
        where: {
          id: { [Op.in]: duplicates.map((d) => String(d.id)) },
        },
      });
    }

    const fileUrl = (this.configService.get<string>('FILE_URL') ?? '').replace(/\/+$/, '') + '/';

    return {
      operator_id: String(operator.id),
      tour_operator_name: operator.tourOperatorName ?? null,
      desc: mergedDesc,
      image_location: mergedImages.map((img) => `${fileUrl}${img}`),
      map_location: mergedMapLocation,
      status: 'ACTIVE',
    };
  }

  /* ──────────────── PRIVATE HELPERS ──────────────── */

  private toFullResponse(row: TourOperator): Record<string, unknown> {
    const plain = row.get({ plain: true }) as any;
    return {
      _id: String(plain.id),
      tour_operator_name: plain.tourOperatorName ?? null,
      temple_id: plain.templeId ?? null,
      user_id: plain.userId ?? null,
      rating: plain.rating ?? null,
      created_at: plain.createdAt ?? null,
      mobile_number: plain.mobileNumber ?? null,
      website: plain.website ?? null,
      email: plain.email ?? null,
      village_id: plain.villageId ?? null,
      contact_address: plain.contactAddress ?? null,
      status: plain.status ?? null,
      map_location: plain.mapLocation ?? null,
      event_id: plain.eventId ?? null,
      image_location: this.resolveImages(this.parseImagePaths(plain.imageLocation)),
    };
  }

  private toLocationResponse(row: TourOperator): Record<string, unknown> {
    const plain = row.get({ plain: true }) as any;
    const village: Village | undefined = (row as any).village;
    return {
      _id: String(plain.id),
      tour_operator_name: plain.tourOperatorName ?? null,
      temple_id: plain.templeId ?? null,
      user_id: plain.userId ?? null,
      rating: plain.rating ?? null,
      created_at: plain.createdAt ?? null,
      mobile_number: plain.mobileNumber ?? null,
      website: plain.website ?? null,
      email: plain.email ?? null,
      village_id: this.toVillageLocation(village),
      contact_address: plain.contactAddress ?? null,
      status: plain.status ?? null,
      map_location: plain.mapLocation ?? null,
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

  private cleanMapLocation(raw: unknown): string[] {
    const results: string[] = [];
    const mapRe = /https:\/\/maps\.app\.goo\.gl\/\S+/g;

    const process = (item: unknown): void => {
      if (!item) return;
      if (Array.isArray(item)) {
        item.forEach((i) => process(i));
        return;
      }
      if (typeof item === 'string') {
        let val = item.trim();
        if (val.startsWith('[') && val.endsWith(']')) {
          try {
            const parsed = JSON.parse(val);
            process(parsed);
            return;
          } catch { /* fallthrough */ }
        }
        val = val.replace(/\\/g, '').replace(/^['"]|['"]$/g, '');
        const matches = val.match(mapRe);
        if (matches) results.push(...matches);
      }
    };

    process(raw);
    return [...new Set(results)];
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
