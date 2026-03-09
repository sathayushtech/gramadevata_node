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

@Injectable()
export class CityTemplesService {
  constructor(
    @InjectModel(Temple)
    private readonly templeModel: typeof Temple,
    @InjectModel(Event)
    private readonly eventModel: typeof Event,
    @InjectModel(Goshala)
    private readonly goshalaModel: typeof Goshala,
    @InjectModel(TempleFacilities)
    private readonly facilitiesModel: typeof TempleFacilities,
    @InjectModel(TourGuide)
    private readonly tourGuideModel: typeof TourGuide,
    @InjectModel(NearbyHospital)
    private readonly nearbyHospitalModel: typeof NearbyHospital,
    @InjectModel(TempleNearbyHotel)
    private readonly nearbyHotelModel: typeof TempleNearbyHotel,
    @InjectModel(TempleNearbyRestaurant)
    private readonly nearbyRestaurantModel: typeof TempleNearbyRestaurant,
    @InjectModel(SocialActivity)
    private readonly socialActivityModel: typeof SocialActivity,
    @InjectModel(TempleNearbyTourismPlace)
    private readonly tourismPlaceModel: typeof TempleNearbyTourismPlace,
    @InjectModel(TempleTransport)
    private readonly transportModel: typeof TempleTransport,
    @InjectModel(TourOperator)
    private readonly tourOperatorModel: typeof TourOperator,
    @InjectModel(PoliceStation)
    private readonly policeStationModel: typeof PoliceStation,
    @InjectModel(FireStation)
    private readonly fireStationModel: typeof FireStation,
    @InjectModel(AmbulanceFacility)
    private readonly ambulanceModel: typeof AmbulanceFacility,
    @InjectModel(BloodBank)
    private readonly bloodBankModel: typeof BloodBank,
    @InjectModel(WelfareHomes)
    private readonly welfareHomesModel: typeof WelfareHomes,
    @InjectModel(Village)
    private readonly villageModel: typeof Village,
    @InjectModel(Block)
    private readonly blockModel: typeof Block,
    @InjectModel(District)
    private readonly districtModel: typeof District,
    private readonly configService: ConfigService,
  ) {}

  async getByLocation(query: Record<string, string | undefined>): Promise<{ status: number; body: Record<string, unknown> }> {
    const inputValue = query.input_value || query.inputValue;
    const searchText = (query.search || '').trim();

    if (!inputValue) {
      return { status: 400, body: { message: 'Location input_value is required' } };
    }

    const locationResult = await this.resolveLocation(inputValue);
    if (!locationResult) {
      return { status: 400, body: { message: 'No village, block, or district found for given input_value' } };
    }

    const { geoData, villageIds } = locationResult;

    const templeWhere: Record<string | symbol, unknown> = {
      status: 'ACTIVE',
      objectId: { [Op.in]: villageIds },
    };

    if (searchText) {
      const pattern = `%${searchText}%`;
      templeWhere[Op.or] = [
        { name: { [Op.like]: pattern } },
        { address: { [Op.like]: pattern } },
      ];
    }

    const allTemples = await this.templeModel.findAll({ where: templeWhere });
    const allTempleIds = allTemples.map((temple) => temple.id);

    const iconicId = 'd7df749f-97e8-4635-a211-371c44b3c31f';
    const famousId = '630f3239-f515-47fb-be8d-db727b9f2174';
    const gramadevataId = '742ccfe6-d0b5-11ee-84bd-0242ac110002';

    const iconicTemples = allTemples.filter((temple) => temple.priorityId === iconicId);
    const famousTemples = allTemples.filter((temple) => temple.priorityId === famousId);
    const gramadevataTemples = allTemples.filter((temple) => temple.categoryId === gramadevataId);

    const excludedIds = new Set([
      ...iconicTemples.map((temple) => temple.id),
      ...famousTemples.map((temple) => temple.id),
      ...gramadevataTemples.map((temple) => temple.id),
    ]);

    const otherTemples = allTemples.filter((temple) => !excludedIds.has(temple.id));

    const [
      events,
      goshalas,
      facilities,
      guides,
      hospitals,
      hotels,
      activities,
      tourismPlaces,
      transports,
      tourOperators,
      restaurants,
      policeStations,
      ambulanceFacilities,
      fireStations,
      bloodBanks,
      welfareHomes,
      independentEvents,
      independentGoshalas,
    ] = await Promise.all([
      this.eventModel.findAll({ where: { templeId: { [Op.in]: allTempleIds }, status: 'ACTIVE' } }),
      this.goshalaModel.findAll({ where: { temple: { [Op.in]: allTempleIds }, status: 'ACTIVE' } }),
      this.facilitiesModel.findAll({
        where: { templeId: { [Op.in]: allTempleIds }, status: 'ACTIVE' },
        attributes: {
          exclude: ['physicalDisabilitiesServices'],
          include: [[literal('`physical_disabilities_services(wheelchair)`'), 'physicalDisabilitiesServices']],
        },
      }),
      this.tourGuideModel.findAll({
        where: {
          status: 'ACTIVE',
          [Op.or]: [
            { templeId: { [Op.in]: allTempleIds } },
            { villageId: { [Op.in]: villageIds } },
          ],
        },
      }),
      this.nearbyHospitalModel.findAll({
        where: {
          status: 'ACTIVE',
          [Op.or]: [
            { templeId: { [Op.in]: allTempleIds } },
            { villageId: { [Op.in]: villageIds } },
          ],
        },
      }),
      this.nearbyHotelModel.findAll({
        where: {
          status: 'ACTIVE',
          [Op.or]: [
            { templeId: { [Op.in]: allTempleIds } },
            { villageId: { [Op.in]: villageIds } },
          ],
        },
      }),
      this.socialActivityModel.findAll({ where: { templeId: { [Op.in]: allTempleIds }, status: 'ACTIVE' } }),
      this.tourismPlaceModel.findAll({
        where: {
          status: 'ACTIVE',
          [Op.or]: [
            { templeId: { [Op.in]: allTempleIds } },
            { villageId: { [Op.in]: villageIds } },
          ],
        },
      }),
      this.transportModel.findAll({
        where: {
          status: 'ACTIVE',
          [Op.or]: [
            { templeId: { [Op.in]: allTempleIds } },
            { villageId: { [Op.in]: villageIds } },
          ],
        },
      }),
      this.tourOperatorModel.findAll({
        where: {
          status: 'ACTIVE',
          [Op.or]: [
            { templeId: { [Op.in]: allTempleIds } },
            { villageId: { [Op.in]: villageIds } },
          ],
        },
      }),
      this.nearbyRestaurantModel.findAll({
        where: {
          status: 'ACTIVE',
          [Op.or]: [
            { templeId: { [Op.in]: allTempleIds } },
            { villageId: { [Op.in]: villageIds } },
          ],
        },
      }),
      this.policeStationModel.findAll({
        where: {
          status: 'ACTIVE',
          [Op.or]: [
            { templeId: { [Op.in]: allTempleIds } },
            { villageId: { [Op.in]: villageIds } },
          ],
        },
      }),
      this.ambulanceModel.findAll({
        where: {
          status: 'ACTIVE',
          [Op.or]: [
            { templeId: { [Op.in]: allTempleIds } },
            { villageId: { [Op.in]: villageIds } },
          ],
        },
      }),
      this.fireStationModel.findAll({
        where: {
          status: 'ACTIVE',
          [Op.or]: [
            { templeId: { [Op.in]: allTempleIds } },
            { villageId: { [Op.in]: villageIds } },
          ],
        },
      }),
      this.bloodBankModel.findAll({
        where: {
          status: 'ACTIVE',
          [Op.or]: [
            { templeId: { [Op.in]: allTempleIds } },
            { villageId: { [Op.in]: villageIds } },
          ],
        },
      }),
      this.welfareHomesModel.findAll({
        where: {
          status: 'ACTIVE',
          villageId: { [Op.in]: villageIds },
        },
      }),
      this.getIndependentEvents(inputValue),
      this.getIndependentGoshalas(inputValue),
    ]);

    const mergedEvents = this.mergeUniqueById([...events, ...independentEvents]);
    const mergedGoshalas = this.mergeUniqueById([...goshalas, ...independentGoshalas]);

    const villageMap = await this.loadVillageMap([
      ...hospitals.map((item) => item.villageId),
      ...restaurants.map((item) => item.villageId),
      ...bloodBanks.map((item) => item.villageId),
    ]);

    return {
      status: 200,
      body: {
        location_details: geoData,
        temples: allTemples.map((temple) => this.mapCityTemple(temple)),
        iconic_temples: iconicTemples.map((temple) => this.mapCityTemple(temple)),
        famous_temples: famousTemples.map((temple) => this.mapCityTemple(temple)),
        gramadevata_temples: gramadevataTemples.map((temple) => this.mapCityTemple(temple)),
        other_temples: otherTemples.map((temple) => this.mapCityTemple(temple)),
        events: mergedEvents.map((event) => this.mapEvent(event)),
        goshalas: mergedGoshalas.map((goshala) => this.mapGoshala(goshala)),
        temple_facilities: facilities.map((facility) => this.toSnakeRecord(facility)),
        temple_guides: guides.map((guide) => this.mapTourGuide(guide)),
        nearby_hospitals: hospitals.map((hospital) => this.mapNearbyHospital(hospital, villageMap)),
        nearby_hotels: hotels.map((hotel) => this.mapHotel(hotel)),
        nearby_resturants: restaurants.map((restaurant) => this.mapRestaurant(restaurant, villageMap)),
        social_activities: activities.map((activity) => this.toSnakeRecord(activity)),
        nearby_tourism_places: tourismPlaces.map((place) => this.mapTourismPlace(place)),
        temple_transport: transports.map((transport) => this.toSnakeRecord(transport)),
        tour_operators: tourOperators.map((operator) => this.mapTourOperator(operator)),
        police_station: policeStations.map((station) => this.mapPoliceStation(station)),
        ambulance_facility: ambulanceFacilities.map((facility) => this.mapAmbulanceFacility(facility)),
        fire_station: fireStations.map((station) => this.mapFireStation(station)),
        blood_bank: bloodBanks.map((bank) => this.mapBloodBank(bank, villageMap)),
        welfare_homes: welfareHomes.map((home) => this.mapWelfareHome(home)),
      },
    };
  }

  private async resolveLocation(inputValue: string) {
    const village = await this.villageModel.findByPk(inputValue, {
      include: [
        {
          model: Block,
          as: 'block',
          include: [
            {
              model: District,
              as: 'district',
              include: [{ model: State, as: 'state', include: [{ model: Country, as: 'country' }] }],
            },
          ],
        },
      ],
    });

    if (village) {
      const geoData = {
        village_images: this.parseImages(village.imageLocation, this.getLocationBaseUrl()),
        village_desc: village.desc ?? null,
        village: village.name,
        block: village.block?.name ?? null,
        district: village.block?.district?.name ?? null,
        state: village.block?.district?.state?.name ?? null,
        country: village.block?.district?.state?.country?.name ?? null,
      };

      return {
        locationType: 'village',
        geoData,
        villageIds: [village.id],
      };
    }

    const block = await this.blockModel.findByPk(inputValue, {
      include: [
        {
          model: District,
          as: 'district',
          include: [{ model: State, as: 'state', include: [{ model: Country, as: 'country' }] }],
        },
      ],
    });

    if (block) {
      const geoData = {
        block_images: this.parseImages(block.imageLocation, this.getLocationBaseUrl()),
        block_desc: block.desc ?? null,
        block: block.name,
        district: block.district?.name ?? null,
        state: block.district?.state?.name ?? null,
        country: block.district?.state?.country?.name ?? null,
      };

      const villages = await this.villageModel.findAll({ where: { blockId: block.id } });
      return {
        locationType: 'block',
        geoData,
        villageIds: villages.map((item) => item.id),
      };
    }

    const district = await this.districtModel.findByPk(inputValue, {
      include: [{ model: State, as: 'state', include: [{ model: Country, as: 'country' }] }],
    });

    if (!district) {
      return null;
    }

    const geoData = {
      district_images: this.parseImages(district.imageLocation, this.getLocationBaseUrl()),
      district_desc: district.desc ?? null,
      district: district.name,
      state: district.state?.name ?? null,
      country: district.state?.country?.name ?? null,
    };

    const blocks = await this.blockModel.findAll({ where: { districtId: district.id } });
    const blockIds = blocks.map((item) => item.id);
    const villages = blockIds.length
      ? await this.villageModel.findAll({ where: { blockId: { [Op.in]: blockIds } } })
      : [];

    return {
      locationType: 'district',
      geoData,
      villageIds: villages.map((item) => item.id),
    };
  }

  private async getIndependentEvents(inputValue: string) {
    const villages = await this.villageModel.findAll({ where: { blockId: inputValue } });
    if (!villages.length) {
      return [];
    }

    return this.eventModel.findAll({
      where: {
        objectId: { [Op.in]: villages.map((item) => item.id) },
        status: 'ACTIVE',
      },
    });
  }

  private async getIndependentGoshalas(inputValue: string) {
    const villages = await this.villageModel.findAll({ where: { blockId: inputValue } });
    if (!villages.length) {
      return [];
    }

    return this.goshalaModel.findAll({
      where: {
        objectId: { [Op.in]: villages.map((item) => item.id) },
        status: 'ACTIVE',
      },
    });
  }

  private async loadVillageMap(ids: Array<string | undefined>) {
    const unique = Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
    if (!unique.length) {
      return new Map<string, Record<string, unknown>>();
    }

    const villages = await this.villageModel.findAll({
      where: { id: { [Op.in]: unique } },
      include: [
        {
          model: Block,
          as: 'block',
          include: [
            {
              model: District,
              as: 'district',
              include: [{ model: State, as: 'state', include: [{ model: Country, as: 'country' }] }],
            },
          ],
        },
      ],
    });

    const map = new Map<string, Record<string, unknown>>();
    villages.forEach((village) => {
      map.set(village.id, this.mapVillage(village));
    });

    return map;
  }

  private mapCityTemple(temple: Temple) {
    return {
      _id: temple.id,
      name: temple.name ?? null,
      image_location: this.mapImageList(temple.imageLocation),
    };
  }

  private mapEvent(event: Event) {
    return {
      _id: event.id,
      name: event.name ?? null,
      image_location: this.mapImageList(event.imageLocation),
    };
  }

  private mapGoshala(goshala: Goshala) {
    return {
      _id: goshala.id,
      name: goshala.name ?? null,
      image_location: this.mapImageList(goshala.imageLocation),
    };
  }

  private mapTourGuide(guide: TourGuide) {
    return this.mapWithImage(guide);
  }

  private mapTourOperator(operator: TourOperator) {
    return this.mapWithImage(operator);
  }

  private mapTourismPlace(place: TempleNearbyTourismPlace) {
    return {
      _id: place.id,
      name: place.name ?? null,
      image_location: this.mapImageList(place.imageLocation),
    };
  }

  private mapHotel(hotel: TempleNearbyHotel) {
    return {
      _id: hotel.id,
      name: hotel.name ?? null,
      image_location: this.mapImageList(hotel.imageLocation),
      map_location: hotel.mapLocation ?? null,
      address: hotel.address ?? null,
      hotel_rating: hotel.hotelRating ?? null,
    };
  }

  private mapNearbyHospital(hospital: NearbyHospital, villageMap: Map<string, Record<string, unknown>>) {
    return {
      _id: hospital.id,
      name: hospital.name ?? null,
      image_location: this.mapImageList(hospital.imageLocation),
      map_location: hospital.mapLocation ?? null,
      address: hospital.address ?? null,
      village_id: hospital.villageId ? villageMap.get(hospital.villageId) ?? null : null,
    };
  }

  private mapRestaurant(restaurant: TempleNearbyRestaurant, villageMap: Map<string, Record<string, unknown>>) {
    return {
      _id: restaurant.id,
      name: restaurant.name ?? null,
      image_location: this.mapImageList(restaurant.imageLocation),
      map_location: restaurant.mapLocation ?? null,
      address: restaurant.address ?? null,
      village_id: restaurant.villageId ? villageMap.get(restaurant.villageId) ?? null : null,
    };
  }

  private mapPoliceStation(station: PoliceStation) {
    return {
      _id: station.id,
      name: station.name ?? null,
      image_location: this.mapImageList(station.imageLocation),
      map_location: station.mapLocation ?? null,
      address: station.address ?? null,
    };
  }

  private mapFireStation(station: FireStation) {
    return {
      _id: station.id,
      name: station.name ?? null,
      image_location: this.mapImageList(station.imageLocation),
      map_location: station.mapLocation ?? null,
      address: station.address ?? null,
    };
  }

  private mapAmbulanceFacility(facility: AmbulanceFacility) {
    return {
      _id: facility.id,
      name: facility.name ?? null,
      image_location: this.mapImageList(facility.imageLocation),
      map_location: facility.mapLocation ?? null,
      address: facility.address ?? null,
    };
  }

  private mapBloodBank(bank: BloodBank, villageMap: Map<string, Record<string, unknown>>) {
    return {
      _id: bank.id,
      village_id: bank.villageId ? villageMap.get(bank.villageId) ?? null : null,
      name: bank.name ?? null,
      image_location: this.mapImageList(bank.imageLocation),
      map_location: bank.mapLocation ?? null,
      address: bank.address ?? null,
    };
  }

  private mapWelfareHome(home: WelfareHomes) {
    return {
      _id: home.id,
      name: home.name ?? null,
      image_location: this.mapImageList(home.imageLocation),
    };
  }

  private parseImages(raw: unknown, baseUrl: string) {
    const list = this.parseList(raw);
    if (!baseUrl) {
      return list;
    }
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return list.map((item) => `${normalizedBase}${item.replace(/\\/g, '/').replace(/^\//, '')}`);
  }

  private mapImageList(raw: unknown) {
    const list = this.parseList(raw);
    const baseUrl = this.getFileBaseUrl();
    if (!baseUrl) {
      return list;
    }
    return list.map((item) => `${baseUrl}${item.replace(/\\/g, '/').replace(/^\//, '')}`);
  }

  private parseList(raw: unknown): string[] {
    if (raw === null || raw === undefined) {
      return [];
    }

    if (Array.isArray(raw)) {
      return raw.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed || trimmed === 'null') {
        return [];
      }

      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        // ignore
      }

      return trimmed
        .replace(/^[\[]|[\]]$/g, '')
        .split(',')
        .map((item) => item.replace(/['"]+/g, '').trim())
        .filter(Boolean);
    }

    return [];
  }

  private getFileBaseUrl() {
    const raw = this.configService.get<string>('File_path')
      || this.configService.get<string>('FILE_URL')
      || '';
    if (!raw) {
      return '';
    }
    return raw.endsWith('/') ? raw : `${raw}/`;
  }

  private getLocationBaseUrl() {
    return this.configService.get<string>('FILE_URL')
      || 'https://sathayushstorage.blob.core.windows.net/sathayush/';
  }

  private mapVillage(village: Village) {
    const block = village.block;
    const district = block?.district;
    const state = district?.state;
    const country = state?.country;

    return {
      _id: village.id,
      name: village.name,
      block: {
        block_id: block?.id ?? null,
        name: block?.name ?? null,
        district: {
          district_id: district?.id ?? null,
          name: district?.name ?? null,
          state: {
            state_id: state?.id ?? null,
            name: state?.name ?? null,
            country: {
              country_id: country?.id ?? null,
              name: country?.name ?? null,
            },
          },
        },
      },
    };
  }

  private mapWithImage(record: { id: string; imageLocation?: unknown; get?: (opts: { plain: true }) => Record<string, unknown> }) {
    const base = this.toSnakeRecord(record as { get?: (opts: { plain: true }) => Record<string, unknown> });
    return {
      ...base,
      image_location: this.mapImageList(record.imageLocation),
    };
  }

  private toSnakeRecord(record: { get?: (opts: { plain: true }) => Record<string, unknown> }) {
    const plain = record.get ? record.get({ plain: true }) : (record as Record<string, unknown>);
    const mapped: Record<string, unknown> = {};

    Object.entries(plain).forEach(([key, value]) => {
      if (key === 'id') {
        mapped._id = value;
        return;
      }

      const snake = key
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/__/g, '_')
        .toLowerCase();
      mapped[snake] = value;
    });

    return mapped;
  }

  private mergeUniqueById<T extends { id: string }>(items: T[]) {
    const map = new Map<string, T>();
    items.forEach((item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }
}
