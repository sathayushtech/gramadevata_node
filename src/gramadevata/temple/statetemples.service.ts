import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op, literal } from 'sequelize';
import { Temple } from './temple.model';
import { Event } from '../events/event.model';
import { Goshala } from '../goshalas/goshala.model';
import { TempleNearbyTourismPlace } from '../tourism/temple-nearby-tourism.model';
import { WelfareHomes } from '../welfare/welfare-homes.model';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';

const ICONIC_ID = 'd7df749f-97e8-4635-a211-371c44b3c31f';
const FAMOUS_ID = '630f3239-f515-47fb-be8d-db727b9f2174';
const GRAMADEVATA_CATEGORY_ID = '742ccfe6-d0b5-11ee-84bd-0242ac110002';
const SPECIAL_TEMPLE_ID = 'c7cf23c3-82c1-409f-9726-840693a3ffe0';
const AP_STATE_ID = 'd1b01400-d0b0-11ee-ade9-0242ac110002';

@Injectable()
export class StateTemplesService {
  constructor(
    @InjectModel(Temple) private readonly templeModel: typeof Temple,
    @InjectModel(Event) private readonly eventModel: typeof Event,
    @InjectModel(Goshala) private readonly goshalaModel: typeof Goshala,
    @InjectModel(TempleNearbyTourismPlace) private readonly tourismModel: typeof TempleNearbyTourismPlace,
    @InjectModel(WelfareHomes) private readonly welfareModel: typeof WelfareHomes,
    @InjectModel(Village) private readonly villageModel: typeof Village,
    @InjectModel(Block) private readonly blockModel: typeof Block,
    @InjectModel(District) private readonly districtModel: typeof District,
    @InjectModel(State) private readonly stateModel: typeof State,
    @InjectModel(Country) private readonly countryModel: typeof Country,
    private readonly configService: ConfigService,
  ) {}

  async getByLocation(query: Record<string, string | undefined>): Promise<{ status: number; body: unknown }> {
    const inputValue = query.input_value || query.inputValue;
    const searchQuery = (query.search || '').trim();

    if (!inputValue) {
      return { status: 400, body: { message: 'Location input_value is required' } };
    }

    const location = await this.resolveLocation(inputValue);
    if (!location) {
      return { status: 400, body: { message: 'Invalid input_value. No matching location found.' } };
    }

    const { geoData, villageIds, locationType, locationObj } = location;

    // Fetch active temples in location
    const templeWhere: Record<string | symbol, unknown> = {
      status: 'ACTIVE',
      objectId: villageIds.length ? { [Op.in]: villageIds } : null,
    };
    if (!villageIds.length) {
      return {
        status: 200,
        body: this.buildEmptyResponse(geoData),
      };
    }
    if (searchQuery) {
      templeWhere[Op.or] = [
        { name: { [Op.like]: `%${searchQuery}%` } },
        { address: { [Op.like]: `%${searchQuery}%` } },
      ];
    }

    const allTemples = await this.templeModel.findAll({ where: templeWhere });
    const templeIds = allTemples.map((t) => t.id);

    // Categorize temples
    let iconicTemples = allTemples.filter((t) => t.priorityId === ICONIC_ID);
    const famousTemples = allTemples.filter((t) => t.priorityId === FAMOUS_ID);
    const gramadevataTemples = allTemples.filter(
      (t) => t.categoryId === GRAMADEVATA_CATEGORY_ID && t.priorityId !== ICONIC_ID && t.priorityId !== FAMOUS_ID,
    );
    const otherTemples = allTemples.filter(
      (t) => t.categoryId !== GRAMADEVATA_CATEGORY_ID && t.priorityId !== ICONIC_ID && t.priorityId !== FAMOUS_ID,
    );

    // Special AP reorder for iconic temples
    if (inputValue === AP_STATE_ID) {
      iconicTemples = [...iconicTemples].sort((a, b) => {
        if (a.id === SPECIAL_TEMPLE_ID) return -1;
        if (b.id === SPECIAL_TEMPLE_ID) return 1;
        return (a.name ?? '').localeCompare(b.name ?? '');
      });
    } else {
      iconicTemples = [...iconicTemples].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    }

    // Paginate famous, gramadevata, other (page_size=50 from Django CustomPagination)
    const page = this.parsePage(query.page, 1);
    const pageSize = this.parsePageSize(query.page_size, 50);
    const paginate = <T>(items: T[]) => items.slice((page - 1) * pageSize, page * pageSize);

    const paginatedFamous = paginate([...famousTemples].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')));
    const paginatedGrama = paginate([...gramadevataTemples].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')));
    const paginatedOther = paginate([...otherTemples].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')));

    // Related data
    const locationWhere = villageIds.length
      ? { objectId: { [Op.in]: villageIds }, status: 'ACTIVE' as const }
      : { objectId: '', status: 'ACTIVE' as const };

    const tourismOrClauses: Record<string, unknown>[] = [];
    if (templeIds.length) tourismOrClauses.push({ templeId: { [Op.in]: templeIds } });
    if (villageIds.length) tourismOrClauses.push({ villageId: { [Op.in]: villageIds } });
    const tourismWhere: Record<string, unknown> = { status: 'ACTIVE' };
    if (tourismOrClauses.length) tourismWhere[Op.or as unknown as string] = tourismOrClauses;
    else tourismWhere.templeId = '';

    const welfareWhere = villageIds.length
      ? { status: 'ACTIVE' as const, villageId: { [Op.in]: villageIds } }
      : { status: 'ACTIVE' as const, villageId: '' };

    const [events, goshalas, tourismPlaces, welfareHomes] = await Promise.all([
      this.eventModel.findAll({ where: locationWhere as any }),
      this.goshalaModel.findAll({ where: locationWhere as any }),
      this.tourismModel.findAll({ where: tourismWhere as any }),
      this.welfareModel.findAll({ where: welfareWhere as any }),
    ]);

    const totalCount = allTemples.length;
    const totalPages = Math.max(1, Math.ceil(Math.max(famousTemples.length, gramadevataTemples.length, otherTemples.length) / pageSize));
    const basePath = '/gramadevata/statetemples_bylocation';
    const next = page < totalPages ? this.buildPageUrl(basePath, query, page + 1, pageSize) : null;
    const previous = page > 1 ? this.buildPageUrl(basePath, query, page - 1, pageSize) : null;

    return {
      status: 200,
      body: {
        count: totalCount,
        next,
        previous,
        results: {
          location_details: geoData,
          iconic_temples: iconicTemples.map((t) => this.mapCitySerializer1(t)),
          famous_temples: paginatedFamous.map((t) => this.mapCitySerializer1(t)),
          gramadevata_temples: paginatedGrama.map((t) => this.mapCitySerializer1(t)),
          other_temples: paginatedOther.map((t) => this.mapCitySerializer1(t)),
          events: events.map((e) => ({
            _id: e.id,
            name: e.name ?? null,
            image_location: this.mapImageList(e.imageLocation),
          })),
          goshalas: goshalas.map((g) => ({
            _id: g.id,
            name: g.name ?? null,
            image_location: this.mapImageList(g.imageLocation),
          })),
          nearby_tourism_places: tourismPlaces.map((tp) => ({
            _id: tp.id,
            name: tp.name ?? null,
            image_location: this.mapImageList(tp.imageLocation),
          })),
          welfare_homes: welfareHomes.map((w) => ({
            _id: w.id,
            name: w.name ?? null,
            image_location: this.mapImageList(w.imageLocation),
          })),
        },
      },
    };
  }

  // ──────────────── Location Resolution ────────────────

  private async resolveLocation(inputValue: string) {
    // Try State
    const state = await this.stateModel.findByPk(inputValue, {
      include: [{ model: Country, as: 'country' }],
    });
    if (state) {
      const districts = await this.districtModel.findAll({ where: { stateId: state.id } });
      const districtIds = districts.map((d) => d.id);
      const blocks = districtIds.length
        ? await this.blockModel.findAll({ where: { districtId: { [Op.in]: districtIds } } })
        : [];
      const blockIds = blocks.map((b) => b.id);
      const villages = blockIds.length
        ? await this.villageModel.findAll({ attributes: ['id'], where: { blockId: { [Op.in]: blockIds } } })
        : [];
      return {
        locationType: 'state',
        locationObj: state,
        geoData: {
          state: state.name,
          state_desc: (state as any).desc ?? '',
          state_images: this.parseImages((state as any).imageLocation),
          country: state.country?.name ?? 'Unknown Country',
        },
        villageIds: villages.map((v) => v.id),
      };
    }

    // Try District
    const district = await this.districtModel.findByPk(inputValue, {
      include: [{ model: State, as: 'state', include: [{ model: Country, as: 'country' }] }],
    });
    if (district) {
      const blocks = await this.blockModel.findAll({ where: { districtId: district.id } });
      const blockIds = blocks.map((b) => b.id);
      const villages = blockIds.length
        ? await this.villageModel.findAll({ attributes: ['id'], where: { blockId: { [Op.in]: blockIds } } })
        : [];
      return {
        locationType: 'district',
        locationObj: district,
        geoData: {
          district: district.name,
          district_desc: (district as any).desc ?? '',
          district_images: this.parseImages((district as any).imageLocation),
          state: district.state?.name ?? null,
          country: district.state?.country?.name ?? 'Unknown Country',
        },
        villageIds: villages.map((v) => v.id),
      };
    }

    // Try Block
    const block = await this.blockModel.findByPk(inputValue, {
      include: [{
        model: District,
        as: 'district',
        include: [{ model: State, as: 'state', include: [{ model: Country, as: 'country' }] }],
      }],
    });
    if (block) {
      const villages = await this.villageModel.findAll({ attributes: ['id'], where: { blockId: block.id } });
      return {
        locationType: 'block',
        locationObj: block,
        geoData: {
          block: block.name,
          block_desc: (block as any).desc ?? '',
          block_images: this.parseImages((block as any).imageLocation),
          district: block.district?.name ?? null,
          state: block.district?.state?.name ?? null,
          country: block.district?.state?.country?.name ?? 'Unknown Country',
        },
        villageIds: villages.map((v) => v.id),
      };
    }

    // Try Village
    const village = await this.villageModel.findByPk(inputValue, {
      include: [{
        model: Block,
        as: 'block',
        include: [{
          model: District,
          as: 'district',
          include: [{ model: State, as: 'state', include: [{ model: Country, as: 'country' }] }],
        }],
      }],
    });
    if (village) {
      return {
        locationType: 'village',
        locationObj: village,
        geoData: {
          village: village.name,
          village_desc: village.desc ?? '',
          village_images: this.parseImages(village.imageLocation),
          block: village.block?.name ?? null,
          district: village.block?.district?.name ?? null,
          state: village.block?.district?.state?.name ?? null,
          country: village.block?.district?.state?.country?.name ?? 'Unknown Country',
        },
        villageIds: [village.id],
      };
    }

    return null;
  }

  // ──────────────── Helpers ────────────────

  private buildEmptyResponse(geoData: Record<string, unknown>) {
    return {
      count: 0,
      next: null,
      previous: null,
      results: {
        location_details: geoData,
        iconic_temples: [],
        famous_temples: [],
        gramadevata_temples: [],
        other_temples: [],
        events: [],
        goshalas: [],
        nearby_tourism_places: [],
        welfare_homes: [],
      },
    };
  }

  private mapCitySerializer1(temple: Temple) {
    return {
      _id: temple.id,
      name: temple.name ?? null,
      image_location: this.mapImageList(temple.imageLocation),
    };
  }

  private mapImageList(raw: unknown): string[] {
    const list = this.parseList(raw);
    const base = this.getFileBaseUrl();
    if (!base) return list;
    return list.map((p) => `${base}${p.replace(/\\/g, '/').replace(/^\//, '')}`);
  }

  private parseImages(raw: unknown): string[] {
    return this.mapImageList(raw);
  }

  private parseList(raw: unknown): string[] {
    if (raw === null || raw === undefined) return [];
    if (Array.isArray(raw)) return raw.map((i) => String(i).trim()).filter(Boolean);
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed || trimmed === 'null') return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map((i) => String(i).trim()).filter(Boolean);
      } catch { /* ignore */ }
      return trimmed.replace(/^[\[]|[\]]$/g, '').split(',').map((i) => i.replace(/['"]+/g, '').trim()).filter(Boolean);
    }
    return [];
  }

  private getFileBaseUrl(): string {
    const raw = this.configService.get<string>('File_path') || this.configService.get<string>('FILE_URL') || '';
    return raw ? (raw.endsWith('/') ? raw : `${raw}/`) : '';
  }

  private parsePage(value: unknown, defaultValue = 1): number {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : defaultValue;
  }

  private parsePageSize(value: unknown, defaultValue = 50): number {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) && parsed >= 1 ? Math.min(parsed, 100) : defaultValue;
  }

  private buildPageUrl(basePath: string, query: Record<string, string | undefined>, page: number, pageSize: number): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || k === 'page' || k === 'page_size') continue;
      params.set(k, v);
    }
    params.set('page', String(page));
    params.set('page_size', String(pageSize));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }
}
