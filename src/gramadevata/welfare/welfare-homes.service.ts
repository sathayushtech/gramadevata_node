import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { WelfareHomes } from './welfare-homes.model';
import { Village } from '../villages/village.model';
import { Block } from '../../common/models/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';
import { EntityStatus } from '../../common/enums';
import { Register } from '../auth/user.model';
import { coerceStringList, formatDjangoDateTime, saveEntityImagesToAzure, sendAdminEmail } from '../../common/utils/gramadevata.utils';

export type DrfPagination<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type RequestLike = {
  protocol: string;
  get(name: string): string | undefined;
  path: string;
  query: unknown;
};

export type WelfareHomeFullResponse = Record<string, unknown>;

export type WelfareHomeLocationResponse = {
  _id: string;
  name: string | null;
  image_location: string[];
  village_id: {
    _id: string;
    name: string;
    block: {
      block_id: string;
      name: string;
      district: {
        district_id: string;
        name: string;
        state: {
          state_id: string;
          name: string;
          country: {
            country_id: string;
            name: string;
          };
        };
      };
    };
  } | null;
};

@Injectable()
export class WelfareHomesService {
  constructor(
    @InjectModel(WelfareHomes)
    private readonly welfareModel: typeof WelfareHomes,
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

  async listActive(query: Record<string, string | undefined>, req?: RequestLike): Promise<DrfPagination<WelfareHomeFullResponse>> {
    return this.list({
      status: EntityStatus.ACTIVE,
      query,
      req,
      serializer: 'processed',
    });
  }

  async getActiveById(id: string): Promise<WelfareHomeFullResponse | null> {
    const instance = await this.welfareModel.findOne({ where: { id, status: EntityStatus.ACTIVE } });
    return instance ? this.toFullProcessed(instance) : null;
  }

  async create(payload: Record<string, unknown>): Promise<WelfareHomeFullResponse> {
    const now = new Date();
    const imageLocations = coerceStringList(payload.image_location);

    const created = await this.welfareModel.create({
      ...(typeof payload._id === 'string' && payload._id.trim() ? { id: payload._id.trim() } : {}),
      ...(typeof payload.name === 'string' ? { name: payload.name } : {}),
      ...(typeof payload.desc === 'string' ? { desc: payload.desc } : {}),
      createdAt: now,
      // Django sets image_location to null before saving, then uploads and updates it.
      imageLocation: null,
      ...(typeof payload.village_id === 'string' ? { villageId: payload.village_id } : {}),
      ...(typeof payload.user === 'string' ? { userId: payload.user } : {}),
      ...(typeof payload.status === 'string' ? { status: payload.status } : {}),
      ...(typeof payload.address === 'string' ? { address: payload.address } : {}),
      ...(typeof payload.category === 'string' ? { categoryId: payload.category } : {}),
      ...(typeof payload.contact_number === 'string' ? { contactNumber: payload.contact_number } : {}),
      ...(typeof payload.email === 'string' ? { email: payload.email } : {}),
      ...(typeof payload.website === 'string' ? { website: payload.website } : {}),
      ...(typeof payload.is_government === 'string' ? { isGovernment: payload.is_government } : {}),
      ...(typeof payload.established_year === 'string' ? { establishedYear: payload.established_year } : {}),
      ...(typeof payload.medical_care === 'string' ? { medicalCare: payload.medical_care } : {}),
      ...(typeof payload.food_and_shelter === 'string' ? { foodAndShelter: payload.food_and_shelter } : {}),
      ...(typeof payload.counseling_services === 'string' ? { counselingServices: payload.counseling_services } : {}),
      ...(typeof payload.rehabilitation_programs === 'string' ? { rehabilitationPrograms: payload.rehabilitation_programs } : {}),
      ...(typeof payload.skill_training === 'string' ? { skillTraining: payload.skill_training } : {}),
      ...(typeof payload.mental_health_support === 'string' ? { mentalHealthSupport: payload.mental_health_support } : {}),
      ...(typeof payload.legal_aid === 'string' ? { legalAid: payload.legal_aid } : {}),
      ...(typeof payload.is_24_7_support === 'string' ? { is247Support: payload.is_24_7_support } : {}),
      ...(typeof payload.security === 'string' ? { security: payload.security } : {}),
      ...(typeof payload.education === 'string' ? { education: payload.education } : {}),
      ...(typeof payload.physiotherapy === 'string' ? { physiotherapy: payload.physiotherapy } : {}),
      ...(typeof payload.play_area === 'string' ? { playArea: payload.play_area } : {}),
      ...(typeof payload.recreational_activities === 'string' ? { recreationalActivities: payload.recreational_activities } : {}),
      ...(typeof payload.adoption_services === 'string' ? { adoptionServices: payload.adoption_services } : {}),
      ...(typeof payload.family_counseling === 'string' ? { familyCounseling: payload.family_counseling } : {}),
      ...(typeof payload.emergency_response === 'string' ? { emergencyResponse: payload.emergency_response } : {}),
      ...(typeof payload.special_needs_support === 'string' ? { specialNeedsSupport: payload.special_needs_support } : {}),
      ...(typeof payload.map_location === 'string' ? { mapLocation: payload.map_location } : {}),
      ...(typeof payload.welfare_fee === 'string' ? { welfareFee: payload.welfare_fee } : {}),
      ...(typeof payload.country === 'string' ? { countryId: payload.country } : {}),
    } as any);

    const savedImages = await saveEntityImagesToAzure({
      configService: this.configService,
      images: imageLocations,
      id: String(created.id),
      name: (created.name ?? 'welfare_home').toString(),
      entityType: 'welfare_homes',
    });
    if (savedImages.length) {
      await created.update({ imageLocation: savedImages } as any);
    }

    await sendAdminEmail(this.configService, {
      subject: 'Welfare Home Updated',
      text:
        `User ID: ${typeof payload.user === 'string' ? payload.user : ''}\n` +
        `Created Time: ${formatDjangoDateTime(now)}\n` +
        `Welfare Home ID: ${String(created.id)}\n` +
        `Welfare Home Name: ${created.name ?? ''}`,
      recipients: [this.configService.get<string>('DEFAULT_FROM_EMAIL')].filter((email): email is string => typeof email === 'string' && email.trim().length > 0),
    });

    return this.toFullRaw(created);
  }

  async updateActive(id: string, payload: Record<string, unknown>): Promise<WelfareHomeFullResponse | null> {
    const instance = await this.welfareModel.findOne({ where: { id, status: EntityStatus.ACTIVE } });
    if (!instance) {
      return null;
    }

    const imageLocations = payload.image_location !== undefined ? coerceStringList(payload.image_location) : null;

    await instance.update({
      ...(typeof payload.name === 'string' ? { name: payload.name } : {}),
      ...(typeof payload.desc === 'string' ? { desc: payload.desc } : {}),
      // Django sets image_location to null on update and then re-saves uploaded images.
      ...(imageLocations !== null ? { imageLocation: null } : {}),
      ...(typeof payload.village_id === 'string' ? { villageId: payload.village_id } : {}),
      ...(typeof payload.user === 'string' ? { userId: payload.user } : {}),
      ...(typeof payload.status === 'string' ? { status: payload.status } : {}),
      ...(typeof payload.address === 'string' ? { address: payload.address } : {}),
      ...(typeof payload.category === 'string' ? { categoryId: payload.category } : {}),
      ...(typeof payload.contact_number === 'string' ? { contactNumber: payload.contact_number } : {}),
      ...(typeof payload.email === 'string' ? { email: payload.email } : {}),
      ...(typeof payload.website === 'string' ? { website: payload.website } : {}),
      ...(typeof payload.is_government === 'string' ? { isGovernment: payload.is_government } : {}),
      ...(typeof payload.established_year === 'string' ? { establishedYear: payload.established_year } : {}),
      ...(typeof payload.medical_care === 'string' ? { medicalCare: payload.medical_care } : {}),
      ...(typeof payload.food_and_shelter === 'string' ? { foodAndShelter: payload.food_and_shelter } : {}),
      ...(typeof payload.counseling_services === 'string' ? { counselingServices: payload.counseling_services } : {}),
      ...(typeof payload.rehabilitation_programs === 'string' ? { rehabilitationPrograms: payload.rehabilitation_programs } : {}),
      ...(typeof payload.skill_training === 'string' ? { skillTraining: payload.skill_training } : {}),
      ...(typeof payload.mental_health_support === 'string' ? { mentalHealthSupport: payload.mental_health_support } : {}),
      ...(typeof payload.legal_aid === 'string' ? { legalAid: payload.legal_aid } : {}),
      ...(typeof payload.is_24_7_support === 'string' ? { is247Support: payload.is_24_7_support } : {}),
      ...(typeof payload.security === 'string' ? { security: payload.security } : {}),
      ...(typeof payload.education === 'string' ? { education: payload.education } : {}),
      ...(typeof payload.physiotherapy === 'string' ? { physiotherapy: payload.physiotherapy } : {}),
      ...(typeof payload.play_area === 'string' ? { playArea: payload.play_area } : {}),
      ...(typeof payload.recreational_activities === 'string' ? { recreationalActivities: payload.recreational_activities } : {}),
      ...(typeof payload.adoption_services === 'string' ? { adoptionServices: payload.adoption_services } : {}),
      ...(typeof payload.family_counseling === 'string' ? { familyCounseling: payload.family_counseling } : {}),
      ...(typeof payload.emergency_response === 'string' ? { emergencyResponse: payload.emergency_response } : {}),
      ...(typeof payload.special_needs_support === 'string' ? { specialNeedsSupport: payload.special_needs_support } : {}),
      ...(typeof payload.map_location === 'string' ? { mapLocation: payload.map_location } : {}),
      ...(typeof payload.welfare_fee === 'string' ? { welfareFee: payload.welfare_fee } : {}),
      ...(typeof payload.country === 'string' ? { countryId: payload.country } : {}),
    } as any);

    const occurredAt = new Date();
    if (imageLocations !== null) {
      const savedImages = await saveEntityImagesToAzure({
        configService: this.configService,
        images: imageLocations,
        id: String(instance.id),
        name: (instance.name ?? 'welfare_home').toString(),
        entityType: 'welfare_homes',
      });
      if (savedImages.length) {
        await instance.update({ imageLocation: savedImages } as any);
      }
    }

    await sendAdminEmail(this.configService, {
      subject: 'Welfare Home Updated',
      text:
        `User ID: ${typeof payload.user === 'string' ? payload.user : (instance.userId ? String(instance.userId) : '')}\n` +
        `Updated Time: ${formatDjangoDateTime(occurredAt)}\n` +
        `Welfare Home ID: ${String(instance.id)}\n` +
        `Welfare Home Name: ${instance.name ?? ''}`,
      recipients: [this.configService.get<string>('DEFAULT_FROM_EMAIL')].filter((email): email is string => typeof email === 'string' && email.trim().length > 0),
    });

    return this.toFullProcessed(instance);
  }

  async removeActive(id: string): Promise<boolean> {
    const deleted = await this.welfareModel.destroy({ where: { id, status: EntityStatus.ACTIVE } });
    return deleted > 0;
  }

  async listByLocation(
    status: EntityStatus,
    query: Record<string, string | undefined>,
    req?: RequestLike,
  ): Promise<DrfPagination<WelfareHomeLocationResponse>> {
    const inputValue = query.input_value?.trim();
    const category = query.category?.trim();
    const search = query.search?.trim();

    if (!inputValue && !category && !search) {
      throw new BadRequestException('Input value, category, or search is required');
    }

    const villageIds = inputValue ? await this.resolveVillageIdsByLocation(inputValue) : null;

    const where: any = { status };
    if (category) {
      where.categoryId = category;
    }
    if (villageIds) {
      where.villageId = { [Op.in]: villageIds };
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
      ];
    }

    const pageSize = this.parsePositiveInt(query.page_size, 50);
    const page = this.parsePositiveInt(query.page, 1);

    const { rows, count } = await this.welfareModel.findAndCountAll({
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
      distinct: true,
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    const results = rows.map((row) => this.toLocationResponse(row));
    return this.toDrfPagination({ count, page, pageSize, results, req });
  }

  async listInactiveFeed(query: Record<string, string | undefined>): Promise<{ count: number; results: WelfareHomeFullResponse[]; message?: string }> {
    const search = query.search?.trim();

    const where: any = { status: EntityStatus.INACTIVE };
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
      ];
    }

    const rows = await this.welfareModel.findAll({ where, order: [['createdAt', 'DESC']] });

    if (!rows.length) {
      return { count: 0, results: [], message: 'Data not found' };
    }

    const userIds = Array.from(
      new Set(
        rows
          .map((row) => row.userId)
          .filter((id): id is string => typeof id === 'string' && id.trim().length > 0),
      ),
    );

    const users = userIds.length
      ? await this.registerModel.findAll({ where: { id: { [Op.in]: userIds } } })
      : [];

    const userMap = new Map(users.map((user) => [String(user.id), user.fullName ?? null]));

    const results = rows.map((row) => {
      const base = this.toFullProcessed(row);
      const createdAt = row.createdAt ?? null;
      const relativeTime = createdAt ? this.relativeTime(createdAt) : null;
      const userFullName = row.userId ? userMap.get(String(row.userId)) ?? null : null;

      return {
        ...base,
        user_full_name: userFullName,
        relative_time: relativeTime,
      };
    });

    return { count: rows.length, results };
  }

  private async list(opts: {
    status: EntityStatus;
    query: Record<string, string | undefined>;
    req?: RequestLike;
    serializer: 'processed' | 'raw';
  }): Promise<DrfPagination<WelfareHomeFullResponse>> {
    const { status, query, req, serializer } = opts;

    const search = query.search?.trim();

    const where: any = { status };
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
      ];
    }

    const pageSize = this.parsePositiveInt(query.page_size, 50);
    const page = this.parsePositiveInt(query.page, 1);

    const { rows, count } = await this.welfareModel.findAndCountAll({
      where,
      distinct: true,
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    const results = rows.map((row) => (serializer === 'processed' ? this.toFullProcessed(row) : this.toFullRaw(row)));
    return this.toDrfPagination({ count, page, pageSize, results, req });
  }

  private toFullRaw(row: WelfareHomes): WelfareHomeFullResponse {
    const plain = row.get({ plain: true }) as any;
    return {
      _id: String(plain.id),
      name: plain.name ?? null,
      desc: plain.desc ?? null,
      created_at: plain.createdAt ?? null,
      image_location: this.parseImagePaths(plain.imageLocation),
      village_id: plain.villageId ?? null,
      user: plain.userId ?? null,
      status: plain.status ?? null,
      address: plain.address ?? null,
      category: plain.categoryId ?? null,
      contact_number: plain.contactNumber ?? null,
      email: plain.email ?? null,
      website: plain.website ?? null,
      is_government: plain.isGovernment ?? null,
      established_year: plain.establishedYear ?? null,
      medical_care: plain.medicalCare ?? null,
      food_and_shelter: plain.foodAndShelter ?? null,
      counseling_services: plain.counselingServices ?? null,
      rehabilitation_programs: plain.rehabilitationPrograms ?? null,
      skill_training: plain.skillTraining ?? null,
      mental_health_support: plain.mentalHealthSupport ?? null,
      legal_aid: plain.legalAid ?? null,
      is_24_7_support: plain.is247Support ?? null,
      security: plain.security ?? null,
      education: plain.education ?? null,
      physiotherapy: plain.physiotherapy ?? null,
      play_area: plain.playArea ?? null,
      recreational_activities: plain.recreationalActivities ?? null,
      adoption_services: plain.adoptionServices ?? null,
      family_counseling: plain.familyCounseling ?? null,
      emergency_response: plain.emergencyResponse ?? null,
      special_needs_support: plain.specialNeedsSupport ?? null,
      map_location: plain.mapLocation ?? null,
      welfare_fee: plain.welfareFee ?? null,
      country: plain.countryId ?? null,
    };
  }

  private toFullProcessed(row: WelfareHomes): WelfareHomeFullResponse {
    const base = this.toFullRaw(row);
    const imageLocation = base.image_location;
    const resolved = Array.isArray(imageLocation) ? this.resolveImageLocation(imageLocation) : [];
    return { ...base, image_location: resolved };
  }

  private toLocationResponse(row: WelfareHomes): WelfareHomeLocationResponse {
    const plain = row.get({ plain: true }) as any;

    const images = this.resolveImageLocation(this.parseImagePaths(plain.imageLocation));

    const village: Village | undefined = (row as any).village;
    const location = this.toVillageLocation(village);

    return {
      _id: String(plain.id),
      name: plain.name ?? null,
      image_location: images,
      village_id: location,
    };
  }

  private toVillageLocation(village?: Village): WelfareHomeLocationResponse['village_id'] {
    if (!village) {
      return null;
    }

    const block: Block | undefined = (village as any).block;
    const district: District | undefined = block ? (block as any).district : undefined;
    const state: State | undefined = district ? (district as any).state : undefined;
    const country: Country | undefined = state ? (state as any).country : undefined;

    if (!block || !district || !state || !country) {
      return null;
    }

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

  private resolveImageLocation(paths: string[]): string[] {
    if (!paths.length) {
      return [];
    }

    const fileUrl = this.configService.get<string>('FILE_URL');
    if (!fileUrl) {
      return paths;
    }

    const trimmed = fileUrl.endsWith('/') ? fileUrl.slice(0, -1) : fileUrl;
    return paths.map((path) => `${trimmed}/${path.startsWith('/') ? path.slice(1) : path}`);
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
    if (!raw || raw.toLowerCase() === 'null') {
      return [];
    }

    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
        }
      } catch {
        // fallthrough to manual parsing
      }

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
    if (value === null || value === undefined) {
      return null;
    }

    if (Array.isArray(value)) {
      const cleaned = value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
      return cleaned.length ? JSON.stringify(cleaned) : null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed.toLowerCase() === 'null') {
        return null;
      }
      return trimmed;
    }

    return null;
  }

  private parsePositiveInt(value: string | undefined, fallback: number): number {
    if (!value) {
      return fallback;
    }

    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }

    return parsed;
  }

  private toDrfPagination<T>(opts: {
    count: number;
    page: number;
    pageSize: number;
    results: T[];
    req?: RequestLike;
  }): DrfPagination<T> {
    const { count, page, pageSize, results, req } = opts;

    if (!req) {
      return { count, next: null, previous: null, results };
    }

    const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;
    const params = new URLSearchParams(req.query as any);

    const lastPage = Math.max(1, Math.ceil(count / pageSize));

    const next = page < lastPage ? this.buildPageUrl(baseUrl, params, page + 1) : null;
    const previous = page > 1 ? this.buildPageUrl(baseUrl, params, page - 1) : null;

    return { count, next, previous, results };
  }

  private buildPageUrl(baseUrl: string, params: URLSearchParams, page: number): string {
    const updated = new URLSearchParams(params);
    updated.set('page', String(page));
    return `${baseUrl}?${updated.toString()}`;
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
    if (minutes < 60) {
      return `${minutes || 0} minutes ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hours ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 30) {
      return `${days} days ago`;
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
      return `${months} months ago`;
    }

    const years = Math.floor(months / 12);
    return `${years} years ago`;
  }
}
