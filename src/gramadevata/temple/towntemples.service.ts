import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op, literal } from 'sequelize';
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
import { WelfareHomes } from '../welfare/welfare-homes.model';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';

const ICONIC_ID = 'd7df749f-97e8-4635-a211-371c44b3c31f';
const FAMOUS_ID = '630f3239-f515-47fb-be8d-db727b9f2174';
const GRAMADEVATA_CATEGORY_ID = '742ccfe6-d0b5-11ee-84bd-0242ac110002';

@Injectable()
export class TownTemplesService {
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
    @InjectModel(WelfareHomes) private readonly welfareHomesModel: typeof WelfareHomes,
    @InjectModel(Village) private readonly villageModel: typeof Village,
    @InjectModel(Block) private readonly blockModel: typeof Block,
    @InjectModel(District) private readonly districtModel: typeof District,
    private readonly configService: ConfigService,
  ) {}

  async getByLocation(query: Record<string, string | undefined>): Promise<{ status: number; body: Record<string, unknown> }> {
    const inputValue = query.input_value || query.inputValue;
    const searchQuery = (query.search || '').trim();

    if (!inputValue) {
      return { status: 400, body: { message: 'Location input_value is required' } };
    }

    // Resolve village or block
    const location = await this.resolveLocation(inputValue);
    if (!location) {
      return { status: 400, body: { message: 'No village or block found for given input_value' } };
    }

    const { geoData, villageIds } = location;

    // Fetch active temples
    const templeWhere: Record<string | symbol, unknown> = {
      status: 'ACTIVE',
      objectId: { [Op.in]: villageIds },
    };
    if (searchQuery) {
      templeWhere[Op.or] = [
        { name: { [Op.like]: `%${searchQuery}%` } },
        { address: { [Op.like]: `%${searchQuery}%` } },
      ];
    }

    const allTemples = await this.templeModel.findAll({ where: templeWhere });
    const allTempleIds = allTemples.map((t) => t.id);

    // Categorize
    const iconicTemples = allTemples.filter((t) => t.priorityId === ICONIC_ID);
    const famousTemples = allTemples.filter((t) => t.priorityId === FAMOUS_ID);
    const gramadevataTemples = allTemples.filter((t) => t.categoryId === GRAMADEVATA_CATEGORY_ID);
    const excludedIds = new Set([
      ...iconicTemples.map((t) => t.id),
      ...famousTemples.map((t) => t.id),
      ...gramadevataTemples.map((t) => t.id),
    ]);
    const otherTemples = allTemples.filter((t) => !excludedIds.has(t.id));

    // Related entity queries — temple-based AND village-based
    const templeOrVillage = {
      status: 'ACTIVE',
      [Op.or]: [
        ...(allTempleIds.length ? [{ templeId: { [Op.in]: allTempleIds } }] : []),
        ...(villageIds.length ? [{ villageId: { [Op.in]: villageIds } }] : []),
      ],
    };
    const templeOnly = (field = 'templeId') => ({
      [field]: allTempleIds.length ? { [Op.in]: allTempleIds } : null,
      status: 'ACTIVE',
    });

    const [
      events, goshalas, facilities, guides, hospitals,
      hotels, activities, tourismPlaces, transports,
      tourOperators, restaurants, policeStations,
      ambulanceFacilities, fireStations, bloodBanks,
      welfareHomes, independentEvents, independentGoshalas,
    ] = await Promise.all([
      this.eventModel.findAll({ where: templeOnly('templeId') }),
      this.goshalaModel.findAll({ where: templeOnly('temple') }),
      this.facilitiesModel.findAll({
        where: templeOnly('templeId'),
        attributes: {
          exclude: ['physicalDisabilitiesServices'],
          include: [[literal('`physical_disabilities_services(wheelchair)`'), 'physicalDisabilitiesServices']],
        },
      }),
      this.tourGuideModel.findAll({ where: templeOrVillage }),
      this.nearbyHospitalModel.findAll({ where: templeOrVillage }),
      this.nearbyHotelModel.findAll({ where: templeOrVillage }),
      this.socialActivityModel.findAll({ where: templeOnly('templeId') }),
      this.tourismPlaceModel.findAll({ where: templeOrVillage }),
      this.transportModel.findAll({ where: templeOrVillage }),
      this.tourOperatorModel.findAll({ where: templeOrVillage }),
      this.nearbyRestaurantModel.findAll({ where: templeOrVillage }),
      this.policeStationModel.findAll({ where: templeOrVillage }),
      this.ambulanceModel.findAll({ where: templeOrVillage }),
      this.fireStationModel.findAll({ where: templeOrVillage }),
      this.bloodBankModel.findAll({ where: templeOrVillage }),
      this.welfareHomesModel.findAll({
        where: villageIds.length
          ? { status: 'ACTIVE', villageId: { [Op.in]: villageIds } }
          : ({ status: 'ACTIVE', villageId: '' } as any),
      }),
      this.getIndependentEvents(inputValue),
      this.getIndependentGoshalas(inputValue),
    ]);

    const mergedEvents = this.mergeUniqueById([...events, ...independentEvents]);
    const mergedGoshalas = this.mergeUniqueById([...goshalas, ...independentGoshalas]);

    return {
      status: 200,
      body: {
        location_details: geoData,
        temples: allTemples.map((t) => this.mapCitySerializer1(t)),
        iconic_temples: iconicTemples.map((t) => this.mapCitySerializer1(t)),
        famous_temples: famousTemples.map((t) => this.mapCitySerializer1(t)),
        gramadevata_temples: gramadevataTemples.map((t) => this.mapCitySerializer1(t)),
        other_temples: otherTemples.map((t) => this.mapCitySerializer1(t)),
        events: mergedEvents.map((e) => ({ _id: e.id, name: e.name ?? null, image_location: this.mapImageList(e.imageLocation) })),
        goshalas: mergedGoshalas.map((g) => ({ _id: g.id, name: g.name ?? null, image_location: this.mapImageList(g.imageLocation) })),
        temple_facilities: facilities.map((f) => this.toSnakeRecord(f)),
        temple_guides: guides.map((g) => ({ ...this.toSnakeRecord(g), image_location: this.mapImageList((g as any).imageLocation) })),
        nearby_hospitals: hospitals.map((h) => ({
          _id: h.id, name: h.name ?? null, image_location: this.mapImageList(h.imageLocation),
          map_location: h.mapLocation ?? null, address: h.address ?? null,
        })),
        nearby_hotels: hotels.map((h) => ({
          _id: h.id, name: h.name ?? null, image_location: this.mapImageList(h.imageLocation),
          map_location: h.mapLocation ?? null, address: h.address ?? null, hotel_rating: h.hotelRating ?? null,
        })),
        nearby_resturants: restaurants.map((r) => ({
          _id: r.id, name: r.name ?? null, image_location: this.mapImageList(r.imageLocation),
          map_location: r.mapLocation ?? null, address: r.address ?? null,
        })),
        social_activities: activities.map((a) => this.toSnakeRecord(a)),
        nearby_tourism_places: tourismPlaces.map((tp) => ({ _id: tp.id, name: tp.name ?? null, image_location: this.mapImageList(tp.imageLocation) })),
        temple_transport: transports.map((t) => this.toSnakeRecord(t)),
        tour_operators: tourOperators.map((o) => ({ ...this.toSnakeRecord(o), image_location: this.mapImageList((o as any).imageLocation) })),
        police_station: policeStations.map((p) => ({
          _id: p.id, name: p.name ?? null, image_location: this.mapImageList(p.imageLocation),
          map_location: p.mapLocation ?? null, address: p.address ?? null,
        })),
        ambulance_facility: ambulanceFacilities.map((a) => ({
          _id: a.id, name: a.name ?? null, image_location: this.mapImageList(a.imageLocation),
          map_location: a.mapLocation ?? null, address: a.address ?? null,
        })),
        fire_station: fireStations.map((f) => ({
          _id: f.id, name: f.name ?? null, image_location: this.mapImageList(f.imageLocation),
          map_location: f.mapLocation ?? null, address: f.address ?? null,
        })),
        blood_bank: bloodBanks.map((b) => ({
          _id: b.id, name: b.name ?? null, image_location: this.mapImageList(b.imageLocation),
          map_location: b.mapLocation ?? null, address: b.address ?? null,
        })),
        welfare_homes: welfareHomes.map((w) => ({ _id: w.id, name: w.name ?? null, image_location: this.mapImageList(w.imageLocation) })),
      },
    };
  }

  // ──────────────── Location Resolution (Village / Block only) ────────────────

  private async resolveLocation(inputValue: string) {
    const village = await this.villageModel.findByPk(inputValue, {
      include: [{
        model: Block, as: 'block',
        include: [{
          model: District, as: 'district',
          include: [{ model: State, as: 'state', include: [{ model: Country, as: 'country' }] }],
        }],
      }],
    });
    if (village) {
      return {
        geoData: {
          village_images: this.mapImageList(village.imageLocation),
          village_desc: village.desc ?? null,
          village: village.name,
          block: village.block?.name ?? null,
          district: village.block?.district?.name ?? null,
          state: village.block?.district?.state?.name ?? null,
          country: village.block?.district?.state?.country?.name ?? null,
        },
        villageIds: [village.id],
      };
    }

    const block = await this.blockModel.findByPk(inputValue, {
      include: [{
        model: District, as: 'district',
        include: [{ model: State, as: 'state', include: [{ model: Country, as: 'country' }] }],
      }],
    });
    if (block) {
      const villages = await this.villageModel.findAll({ where: { blockId: block.id } });
      return {
        geoData: {
          block_images: this.mapImageList((block as any).imageLocation),
          block_desc: (block as any).desc ?? null,
          block: block.name,
          district: block.district?.name ?? null,
          state: block.district?.state?.name ?? null,
          country: block.district?.state?.country?.name ?? null,
        },
        villageIds: villages.map((v) => v.id),
      };
    }

    return null;
  }

  // ──────────────── Independent Data ────────────────

  private async getIndependentEvents(inputValue: string): Promise<Event[]> {
    const villages = await this.villageModel.findAll({ where: { blockId: inputValue } });
    if (!villages.length) return [];
    return this.eventModel.findAll({
      where: { objectId: { [Op.in]: villages.map((v) => v.id) }, status: 'ACTIVE' },
    });
  }

  private async getIndependentGoshalas(inputValue: string): Promise<Goshala[]> {
    const villages = await this.villageModel.findAll({ where: { blockId: inputValue } });
    if (!villages.length) return [];
    return this.goshalaModel.findAll({
      where: { objectId: { [Op.in]: villages.map((v) => v.id) }, status: 'ACTIVE' },
    });
  }

  // ──────────────── Helpers ────────────────

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

  private mergeUniqueById<T extends { id: string }>(items: T[]): T[] {
    const map = new Map<string, T>();
    for (const item of items) {
      if (!map.has(item.id)) map.set(item.id, item);
    }
    return Array.from(map.values());
  }
}
