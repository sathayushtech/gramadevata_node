import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op, literal } from 'sequelize';
import { EntityStatus } from '../../common/enums';
import { toFileUrlList, extractLatLongFromUrl, coerceList } from '../../common/utils/django-serializer';
import { Temple } from './temple.model';
import { Event } from '../events/event.model';
import { Goshala } from '../goshalas/goshala.model';
import { TempleFacilities } from './temple-facilities.model';
import { TourGuide } from '../events/tour-guide.model';
import { NearbyHospital } from '../hospital/nearby-hospital.model';
import { TempleNearbyHotel } from '../events/temple-nearby-hotel.model';
import { TempleNearbyRestaurant } from '../events/temple-nearby-restaurant.model';
import { SocialActivity } from './social-activity.model';
import { TempleNearbyTourismPlace } from '../tourism/temple-nearby-tourism.model';
import { TempleTransport } from '../events/temple-transport.model';
import { TourOperator } from '../tourism/tour-operator.model';
import { PoliceStation } from '../police-station/police-station.model';
import { FireStation } from '../fire-station/fire-station.model';
import { AmbulanceFacility } from '../ambulance/ambulance-facility.model';
import { BloodBank } from '../blood-bank/blood-bank.model';
import { TemplePoojaTiming } from './pooja-timing.model';
import { PrayersAndBenefits } from './prayers-and-benefits.model';
import { FavoriteTemple } from './favorite-temple.model';
import { VisitTemple } from './visit-temple.model';
import { Media } from '../media/media.model';
import { PoojaStore } from '../pooja-store/pooja-store.model';
import { Comment } from '../comments/comment.model';
import { Connect } from '../connect/connect.model';
import { Register as User } from '../auth/user.model';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';

/**
 * Maps Django Temple model field names to Sequelize column names.
 */
const DJANGO_FIELD_MAP: Record<string, string> = {
  _id: 'id',
  category: 'categoryId',
  priority: 'priorityId',
  object_id: 'objectId',
  user: 'userId',
  temple_map_location: 'templeMapLocation',
  contact_name: 'contactName',
  contact_phone: 'contactPhone',
  contact_email: 'contactEmail',
  temple_timings: 'templeTimings',
  temple_official_website: 'templeOfficialWebsite',
  other_dieties: 'otherDieties',
  temple_management: 'templeManagement',
  sthala_vriksha: 'sthalaVriksha',
  other_speciality: 'otherSpeciality',
  sthala_puranam: 'sthalaPuranam',
  dress_code: 'dressCode',
  temple_video: 'templeVideo',
  image_location: 'imageLocation',
  old_temple_code: 'oldTempleCode',
  can_connect: 'canConnect',
  temple_area: 'templeArea',
  country_name: 'countryName',
  state_name: 'stateName',
  district_name: 'districtName',
  block_name: 'blockName',
  village_name: 'villageName',
  other_name: 'otherName',
  is_navagraha_established: 'isNavagrahaEstablished',
  construction_year: 'constructionYear',
  is_destroyed: 'isDestroyed',
  animal_sacrifice_status: 'animalSacrificeStatus',
  geo_site: 'geoSite',
  created_at: 'createdAt',
  country: 'countryId',
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

@Injectable()
export class TempleSearchService {
  constructor(
    @InjectModel(Temple) private readonly templeModel: typeof Temple,
    @InjectModel(Event) private readonly eventModel: typeof Event,
    @InjectModel(Goshala) private readonly goshalaModel: typeof Goshala,
    @InjectModel(TempleFacilities) private readonly facilitiesModel: typeof TempleFacilities,
    @InjectModel(TourGuide) private readonly tourGuideModel: typeof TourGuide,
    @InjectModel(NearbyHospital) private readonly nearbyHospitalModel: typeof NearbyHospital,
    @InjectModel(TempleNearbyHotel) private readonly nearbyHotelModel: typeof TempleNearbyHotel,
    @InjectModel(TempleNearbyRestaurant) private readonly nearbyRestaurantModel: typeof TempleNearbyRestaurant,
    @InjectModel(SocialActivity) private readonly socialActivityModel: typeof SocialActivity,
    @InjectModel(TempleNearbyTourismPlace) private readonly tourismPlaceModel: typeof TempleNearbyTourismPlace,
    @InjectModel(TempleTransport) private readonly transportModel: typeof TempleTransport,
    @InjectModel(TourOperator) private readonly tourOperatorModel: typeof TourOperator,
    @InjectModel(PoliceStation) private readonly policeStationModel: typeof PoliceStation,
    @InjectModel(FireStation) private readonly fireStationModel: typeof FireStation,
    @InjectModel(AmbulanceFacility) private readonly ambulanceModel: typeof AmbulanceFacility,
    @InjectModel(BloodBank) private readonly bloodBankModel: typeof BloodBank,
    @InjectModel(TemplePoojaTiming) private readonly poojaTimingModel: typeof TemplePoojaTiming,
    @InjectModel(PrayersAndBenefits) private readonly prayersModel: typeof PrayersAndBenefits,
    @InjectModel(FavoriteTemple) private readonly favoriteModel: typeof FavoriteTemple,
    @InjectModel(VisitTemple) private readonly visitModel: typeof VisitTemple,
    @InjectModel(Media) private readonly mediaModel: typeof Media,
    @InjectModel(PoojaStore) private readonly poojaStoreModel: typeof PoojaStore,
    @InjectModel(Comment) private readonly commentModel: typeof Comment,
    @InjectModel(Connect) private readonly connectModel: typeof Connect,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Village) private readonly villageModel: typeof Village,
    @InjectModel(Block) private readonly blockModel: typeof Block,
    @InjectModel(District) private readonly districtModel: typeof District,
    @InjectModel(State) private readonly stateModel: typeof State,
    @InjectModel(Country) private readonly countryModel: typeof Country,
    private readonly configService: ConfigService,
  ) {}

  // ──────────────── Village Include Chain ────────────────

  private get villageInclude() {
    return {
      model: Village,
      as: 'village',
      include: [{
        model: Block,
        as: 'block',
        include: [{
          model: District,
          as: 'district',
          include: [{ model: State, as: 'state', include: [{ model: Country, as: 'country' }] }],
        }],
      }],
    };
  }

  // ──────────────── Public Endpoints ────────────────

  /**
   * GET templeget/:fieldName/:inputValue
   * Dynamic field filter on ACTIVE temples — returns TempleSerializer1.
   */
  async getByField(
    fieldName: string,
    inputValue: string,
    user?: Record<string, unknown>,
  ): Promise<{ status: number; body: unknown }> {
    const seqField = DJANGO_FIELD_MAP[fieldName] ?? fieldName;
    const where: Record<string, unknown> = { status: EntityStatus.ACTIVE, [seqField]: inputValue };

    const temples = await this.templeModel.findAll({
      where,
      include: [this.villageInclude],
    });

    const results = await this.serializeTemplesFull(temples, user);
    return { status: 200, body: results };
  }

  /**
   * GET temples/country_id/:countryId
   */
  async templesByCountry(countryId: string, user?: Record<string, unknown>): Promise<unknown[]> {
    const villageIds = await this.resolveVillagesByCountry(countryId);
    return this.templesByVillageIds(villageIds, user);
  }

  /**
   * GET temples/state_id/:stateId
   */
  async templesByState(stateId: string, user?: Record<string, unknown>): Promise<unknown[]> {
    const villageIds = await this.resolveVillagesByState(stateId);
    return this.templesByVillageIds(villageIds, user);
  }

  /**
   * GET temples/district_id/:districtId
   */
  async templesByDistrict(districtId: string, user?: Record<string, unknown>): Promise<unknown[]> {
    const villageIds = await this.resolveVillagesByDistrict(districtId);
    return this.templesByVillageIds(villageIds, user);
  }

  /**
   * GET temples/block_id/:blockId
   */
  async templesByBlock(blockId: string, user?: Record<string, unknown>): Promise<unknown[]> {
    const villages = await this.villageModel.findAll({ attributes: ['id'], where: { blockId } });
    return this.templesByVillageIds(villages.map((v) => v.id), user);
  }

  /**
   * GET indiatemples — all temples whose object_id references a Village, paginated.
   */
  async getIndianTemples(
    basePath: string,
    query: Record<string, string | undefined>,
    user?: Record<string, unknown>,
  ): Promise<PaginatedResponse<unknown>> {
    const page = this.parsePage(query.page, 1);
    const pageSize = this.parsePageSize(query.page_size, 50);

    const allVillageIds = (
      await this.villageModel.findAll({ attributes: ['id'] })
    ).map((v) => v.id);

    const { rows, count } = await this.templeModel.findAndCountAll({
      where: { objectId: { [Op.in]: allVillageIds } },
      limit: pageSize,
      offset: (page - 1) * pageSize,
      include: [this.villageInclude],
    });

    const totalPages = Math.max(1, Math.ceil(count / pageSize));
    const next = page < totalPages ? this.buildPageUrl(basePath, query, page + 1, pageSize) : null;
    const previous = page > 1 ? this.buildPageUrl(basePath, query, page - 1, pageSize) : null;

    const results = await this.serializeTemplesFull(rows, user);
    return { count, next, previous, results };
  }

  // ──────────────── Full TempleSerializer1 ────────────────

  /**
   * Batch-serializes temples in TempleSerializer1 format (includes all nested relationships).
   */
  private async serializeTemplesFull(
    temples: Temple[],
    user?: Record<string, unknown>,
  ): Promise<Record<string, unknown>[]> {
    if (!temples.length) return [];

    const templeIds = temples.map((t) => t.id);
    const userId = typeof user?.id === 'string' ? user.id : undefined;
    const activeWhere = (field: string) => ({
      [field]: { [Op.in]: templeIds },
      status: EntityStatus.ACTIVE,
    });

    // Batch-fetch all related entities in parallel
    const [
      events, hotels, tourism, transports, media, operators,
      socialActivities, hospitals, facilities, prayers,
      guides, poojaTimings, goshalas, favorites, visits,
      restaurants, ambulances, bloodBanks, fireStations,
      policeStations, poojaStores, comments, connections,
    ] = await Promise.all([
      this.eventModel.findAll({ where: activeWhere('templeId') }),
      this.nearbyHotelModel.findAll({ where: activeWhere('templeId') }),
      this.tourismPlaceModel.findAll({ where: activeWhere('templeId') }),
      this.transportModel.findAll({ where: activeWhere('templeId') }),
      this.mediaModel.findAll({ where: activeWhere('templeId') }),
      this.tourOperatorModel.findAll({ where: activeWhere('templeId') }),
      this.socialActivityModel.findAll({ where: activeWhere('templeId') }),
      this.nearbyHospitalModel.findAll({ where: activeWhere('templeId') }),
      this.facilitiesModel.findAll({
        where: activeWhere('templeId'),
        attributes: {
          exclude: ['physicalDisabilitiesServices'],
          include: [[literal('`physical_disabilities_services(wheelchair)`'), 'physicalDisabilitiesServices']],
        },
      }),
      this.prayersModel.findAll({ where: activeWhere('templeId') }),
      this.tourGuideModel.findAll({ where: activeWhere('templeId') }),
      this.poojaTimingModel.findAll({ where: activeWhere('templeId') }),
      this.goshalaModel.findAll({ where: { temple: { [Op.in]: templeIds }, status: EntityStatus.ACTIVE } }),
      this.favoriteModel.findAll({ where: { templeId: { [Op.in]: templeIds } } }),
      this.visitModel.findAll({ where: { templeId: { [Op.in]: templeIds } } }),
      this.nearbyRestaurantModel.findAll({ where: activeWhere('templeId') }),
      this.ambulanceModel.findAll({ where: activeWhere('templeId') }),
      this.bloodBankModel.findAll({ where: activeWhere('templeId') }),
      this.fireStationModel.findAll({ where: activeWhere('templeId') }),
      this.policeStationModel.findAll({ where: activeWhere('templeId') }),
      this.poojaStoreModel.findAll({ where: activeWhere('templeId') }),
      this.commentModel.findAll({
        where: { templeId: { [Op.in]: templeIds }, status: EntityStatus.ACTIVE },
        order: [['createdAt', 'DESC']],
      }),
      userId
        ? this.connectModel.findAll({ where: { userId, templeId: { [Op.in]: templeIds } } })
        : Promise.resolve([]),
    ]);

    // Build lookup maps keyed by templeId
    const group = <T extends { templeId?: string }>(items: T[]) => {
      const map = new Map<string, T[]>();
      for (const item of items) {
        if (!item.templeId) continue;
        const list = map.get(item.templeId) ?? [];
        list.push(item);
        map.set(item.templeId, list);
      }
      return map;
    };

    const groupByField = <T>(items: T[], field: string) => {
      const map = new Map<string, T[]>();
      for (const item of items) {
        const key = (item as any)[field];
        if (!key) continue;
        const list = map.get(key) ?? [];
        list.push(item);
        map.set(key, list);
      }
      return map;
    };

    const eventsMap = group(events);
    const hotelsMap = group(hotels);
    const tourismMap = group(tourism);
    const transportsMap = group(transports);
    const mediaMap = group(media);
    const operatorsMap = group(operators);
    const socialMap = group(socialActivities);
    const hospitalsMap = group(hospitals);
    const facilitiesMap = group(facilities);
    const prayersMap = group(prayers);
    const guidesMap = group(guides);
    const timingsMap = group(poojaTimings);
    const goshalaMap = groupByField(goshalas, 'temple');
    const favoritesMap = group(favorites);
    const visitsMap = group(visits);
    const restaurantsMap = group(restaurants);
    const ambulancesMap = group(ambulances);
    const bloodBanksMap = group(bloodBanks);
    const fireMap = group(fireStations);
    const policeMap = group(policeStations);
    const poojaStoresMap = group(poojaStores);
    const commentsMap = group(comments);

    // Connection lookup per temple
    const connectionMap = new Map<string, Connect>();
    for (const c of connections) {
      if (c.templeId) connectionMap.set(c.templeId, c);
    }

    // User cache for comment serialization
    const commentUserIds = Array.from(new Set(comments.map((c) => c.userId).filter(Boolean))) as string[];
    const commentUsers = commentUserIds.length
      ? await this.userModel.findAll({ where: { id: { [Op.in]: commentUserIds } } })
      : [];
    const userLookup = new Map(commentUsers.map((u) => [u.id, u]));

    return temples.map((temple) => {
      const tid = temple.id;
      const { latitude, longitude } = extractLatLongFromUrl(temple.templeMapLocation ?? null);
      const conn = connectionMap.get(tid);

      const memberConn = connections.find((c) => c.templeId === tid && c.connectedAs === 'MEMBER');
      const pujariConn = connections.find((c) => c.templeId === tid && c.connectedAs === 'PUJARI');
      const volunteerConn = connections.find((c) => c.templeId === tid && c.connectedAs === 'VOLUNTARY');

      return {
        _id: tid,
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
        connectionId: conn?.id ?? null,
        ispujari: !!pujariConn,
        ismember: !!memberConn,
        isvolunteer: !!volunteerConn,
        istemplemember: !!conn,
        comments: (commentsMap.get(tid) ?? []).map((c) => {
          const u = c.userId ? userLookup.get(c.userId) : undefined;
          return {
            _id: c.id,
            temple: c.templeId ? { id: c.templeId } : null,
            user: c.userId ? { id: c.userId, name: u?.fullName ?? null, username: u?.username ?? null } : null,
            goshala: c.goshalaId ? { id: c.goshalaId } : null,
            event: c.eventId ? { id: c.eventId } : null,
            body: c.body,
            created_at: c.createdAt,
            status: c.status,
          };
        }),
        goshalas: (goshalaMap.get(tid) ?? []).map((g) => ({
          _id: g.id,
          name: g.name ?? null,
          image_location: this.mapImageList(g.imageLocation),
        })),
        pooja_timing: (timingsMap.get(tid) ?? []).map((pt) => this.toSnakeRecord(pt)),
        tour_guide: (guidesMap.get(tid) ?? []).map((tg) => ({
          ...this.toSnakeRecord(tg),
          image_location: this.mapImageList((tg as any).imageLocation),
        })),
        prayers_and_benefits: (prayersMap.get(tid) ?? []).map((p) => this.toSnakeRecord(p)),
        temple_facilities: (facilitiesMap.get(tid) ?? []).map((f) => this.toSnakeRecord(f)),
        pooja_stores: (poojaStoresMap.get(tid) ?? []).map((ps) => ({
          _id: ps.id,
          name: ps.name ?? null,
          temple_id: ps.templeId ?? null,
          address: ps.address ?? null,
          map_location: ps.mapLocation ?? null,
          village_id: ps.villageId ?? null,
          image_location: this.mapImageList((ps as any).imageLocation),
        })),
        resturents: (restaurantsMap.get(tid) ?? []).map((r) => ({
          _id: r.id,
          name: r.name ?? null,
          image_location: this.mapImageList(r.imageLocation),
          map_location: r.mapLocation ?? null,
          address: r.address ?? null,
          village_id: r.villageId ?? null,
        })),
        near_by_hospitals: (hospitalsMap.get(tid) ?? []).map((h) => ({
          _id: h.id,
          name: h.name ?? null,
          image_location: this.mapImageList(h.imageLocation),
          map_location: h.mapLocation ?? null,
          address: h.address ?? null,
          village_id: h.villageId ?? null,
        })),
        social_activity: (socialMap.get(tid) ?? []).map((s) => this.toSnakeRecord(s)),
        police_station: (policeMap.get(tid) ?? []).map((p) => ({
          _id: p.id,
          name: p.name ?? null,
          image_location: this.mapImageList(p.imageLocation),
          map_location: p.mapLocation ?? null,
          address: p.address ?? null,
        })),
        fire_station: (fireMap.get(tid) ?? []).map((f) => ({
          _id: f.id,
          name: f.name ?? null,
          image_location: this.mapImageList(f.imageLocation),
          map_location: f.mapLocation ?? null,
          address: f.address ?? null,
        })),
        blood_bank: (bloodBanksMap.get(tid) ?? []).map((b) => ({
          _id: b.id,
          name: b.name ?? null,
          image_location: this.mapImageList(b.imageLocation),
          map_location: b.mapLocation ?? null,
          address: b.address ?? null,
          village_id: b.villageId ?? null,
        })),
        ambulance_facility: (ambulancesMap.get(tid) ?? []).map((a) => ({
          _id: a.id,
          name: a.name ?? null,
          image_location: this.mapImageList(a.imageLocation),
          map_location: a.mapLocation ?? null,
          address: a.address ?? null,
        })),
        touroperator: (operatorsMap.get(tid) ?? []).map((o) => ({
          ...this.toSnakeRecord(o),
          image_location: this.mapImageList((o as any).imageLocation),
        })),
        media: (mediaMap.get(tid) ?? []).map((m) => this.toSnakeRecord(m)),
        transport: (transportsMap.get(tid) ?? []).map((t) => this.toSnakeRecord(t)),
        tourismplace: (tourismMap.get(tid) ?? []).map((tp) => ({
          _id: tp.id,
          name: tp.name ?? null,
          image_location: this.mapImageList(tp.imageLocation),
        })),
        nearby_hotels: (hotelsMap.get(tid) ?? []).map((h) => ({
          _id: h.id,
          name: h.name ?? null,
          image_location: this.mapImageList(h.imageLocation),
          map_location: h.mapLocation ?? null,
          address: h.address ?? null,
          hotel_rating: h.hotelRating ?? null,
        })),
        events: (eventsMap.get(tid) ?? []).map((e) => ({
          _id: e.id,
          name: e.name ?? null,
          image_location: this.mapImageList(e.imageLocation),
        })),
        visit_temples: (visitsMap.get(tid) ?? []).map((v) => this.toSnakeRecord(v)),
        favorite: (favoritesMap.get(tid) ?? []).map((f) => this.toSnakeRecord(f)),
        Connections: connections
          .filter((c) => c.templeId === tid)
          .map((c) => this.toSnakeRecord(c)),
      };
    });
  }

  // ──────────────── Village Resolution ────────────────

  private async resolveVillagesByCountry(countryId: string): Promise<string[]> {
    const villages = await this.villageModel.findAll({
      attributes: ['id'],
      include: [{
        model: Block, as: 'block', required: true, attributes: [],
        include: [{
          model: District, as: 'district', required: true, attributes: [],
          include: [{ model: State, as: 'state', required: true, attributes: [], where: { countryId } }],
        }],
      }],
    });
    return villages.map((v) => v.id);
  }

  private async resolveVillagesByState(stateId: string): Promise<string[]> {
    const villages = await this.villageModel.findAll({
      attributes: ['id'],
      include: [{
        model: Block, as: 'block', required: true, attributes: [],
        include: [{
          model: District, as: 'district', required: true, attributes: [],
          where: { stateId },
        }],
      }],
    });
    return villages.map((v) => v.id);
  }

  private async resolveVillagesByDistrict(districtId: string): Promise<string[]> {
    const villages = await this.villageModel.findAll({
      attributes: ['id'],
      include: [{
        model: Block, as: 'block', required: true, attributes: [],
        where: { districtId },
      }],
    });
    return villages.map((v) => v.id);
  }

  private async templesByVillageIds(
    villageIds: string[],
    user?: Record<string, unknown>,
  ): Promise<unknown[]> {
    if (!villageIds.length) return [];
    const temples = await this.templeModel.findAll({
      where: { objectId: { [Op.in]: villageIds } },
      include: [this.villageInclude],
    });
    return this.serializeTemplesFull(temples, user);
  }

  // ──────────────── Helpers ────────────────

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

  private mapImageList(raw: unknown): string[] {
    const list = this.parseList(raw);
    const base = this.getFileBaseUrl();
    if (!base) return list;
    return list.map((p) => `${base}${p.replace(/\\/g, '/').replace(/^\//, '')}`);
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

  private toSnakeRecord(record: any): Record<string, unknown> {
    const plain = record?.get ? record.get({ plain: true }) : record;
    const mapped: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(plain)) {
      if (key === 'id') {
        mapped._id = value;
      } else {
        mapped[key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/__/g, '_').toLowerCase()] = value;
      }
    }
    return mapped;
  }

  private parsePage(value: unknown, defaultValue = 1): number {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : defaultValue;
  }

  private parsePageSize(value: unknown, defaultValue = 50): number {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) && parsed >= 1 ? Math.min(parsed, 1000) : defaultValue;
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
