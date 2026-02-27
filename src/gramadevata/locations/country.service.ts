import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Country } from '../../common/models/country.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Temple } from '../temple/temple.model';
import { Goshala } from '../goshalas/goshala.model';
import { Event } from '../events/event.model';
import { WelfareHomes } from '../welfare/welfare-homes.model';
import { TempleNearbyTourismPlace } from '../tourism/temple-nearby-tourism.model';
import { NearbyHospital } from '../hospital/nearby-hospital.model';
import { NearbyVeterinaryHospital } from '../hospital/nearby-veterinary-hospital.model';
import { BloodBank } from '../blood-bank/blood-bank.model';
import { TempleNearbyHotel } from '../events/temple-nearby-hotel.model';
import { TempleNearbyRestaurant } from '../events/temple-nearby-restaurant.model';
import { PoojaStore } from '../pooja-store/pooja-store.model';
import { TourOperator } from '../tourism/tour-operator.model';
import { Village } from '../villages/village.model';

@Injectable()
export class CountryService {
  constructor(
    @InjectModel(Country)
    private readonly countryModel: typeof Country,
    @InjectModel(Temple)
    private readonly templeModel: typeof Temple,
    @InjectModel(Goshala)
    private readonly goshalaModel: typeof Goshala,
    @InjectModel(Event)
    private readonly eventModel: typeof Event,
    @InjectModel(WelfareHomes)
    private readonly welfareHomesModel: typeof WelfareHomes,
    @InjectModel(TempleNearbyTourismPlace)
    private readonly tourismPlaceModel: typeof TempleNearbyTourismPlace,
    @InjectModel(NearbyHospital)
    private readonly nearbyHospitalModel: typeof NearbyHospital,
    @InjectModel(NearbyVeterinaryHospital)
    private readonly nearbyVeterinaryHospitalModel: typeof NearbyVeterinaryHospital,
    @InjectModel(BloodBank)
    private readonly bloodBankModel: typeof BloodBank,
    @InjectModel(TempleNearbyHotel)
    private readonly nearbyHotelModel: typeof TempleNearbyHotel,
    @InjectModel(TempleNearbyRestaurant)
    private readonly nearbyRestaurantModel: typeof TempleNearbyRestaurant,
    @InjectModel(PoojaStore)
    private readonly poojaStoreModel: typeof PoojaStore,
    @InjectModel(TourOperator)
    private readonly tourOperatorModel: typeof TourOperator,
    @InjectModel(Village)
    private readonly villageModel: typeof Village,
    private readonly configService: ConfigService
  ) {}

  async list(pageType?: string): Promise<Record<string, unknown>[]> {
    if (!pageType) {
      const countries = await this.countryModel.findAll();
      return countries.map((country) => this.toResponse(country));
    }

    const countryIds = await this.getCountryIdsByPageType(pageType);

    if (countryIds === null) {
      const countries = await this.countryModel.findAll();
      return countries.map((country) => this.toResponse(country));
    }

    if (!countryIds.length) {
      return [];
    }

    const countries = await this.countryModel.findAll({
      where: { id: { [Op.in]: countryIds } },
    });

    return countries.map((country) => this.toResponse(country));
  }

  private async getCountryIdsByPageType(pageType: string): Promise<string[] | null> {
    switch (pageType) {
      case 'temple': {
        const temples = await this.templeModel.findAll({
          where: { status: 'ACTIVE' },
          attributes: ['countryId', 'objectId'],
        });
        return this.mergeIds([
          this.collectIds(temples.map((temple) => temple.countryId)),
          await this.getCountryIdsFromVillageIds(temples.map((temple) => temple.objectId)),
        ]);
      }
      case 'goshala': {
        const goshalas = await this.goshalaModel.findAll({
          where: { status: 'ACTIVE' },
          attributes: ['country', 'objectId'],
        });
        return this.mergeIds([
          this.collectIds(goshalas.map((goshala) => goshala.country)),
          await this.getCountryIdsFromVillageIds(goshalas.map((goshala) => goshala.objectId)),
        ]);
      }
      case 'event': {
        const events = await this.eventModel.findAll({
          where: { status: 'ACTIVE' },
          attributes: ['countryId', 'objectId'],
        });
        return this.mergeIds([
          this.collectIds(events.map((event) => event.countryId)),
          await this.getCountryIdsFromVillageIds(events.map((event) => event.objectId)),
        ]);
      }
      case 'tourism': {
        const places = await this.tourismPlaceModel.findAll({
          where: { status: 'ACTIVE' },
          attributes: ['countryId', 'villageId'],
        });
        return this.mergeIds([
          this.collectIds(places.map((place) => place.countryId)),
          await this.getCountryIdsFromVillageIds(places.map((place) => place.villageId)),
        ]);
      }
      case 'welfare': {
        const homes = await this.welfareHomesModel.findAll({
          where: { status: 'ACTIVE' },
          attributes: ['villageId'],
        });
        return this.getCountryIdsFromVillageIds(homes.map((home) => home.villageId));
      }
      case 'hospital': {
        const hospitals = await this.nearbyHospitalModel.findAll({
          where: { status: 'ACTIVE' },
          attributes: ['villageId'],
        });
        return this.getCountryIdsFromVillageIds(hospitals.map((hospital) => hospital.villageId));
      }
      case 'veterinary_hospital': {
        const hospitals = await this.nearbyVeterinaryHospitalModel.findAll({
          where: { status: 'ACTIVE' },
          attributes: ['villageId'],
        });
        return this.getCountryIdsFromVillageIds(hospitals.map((hospital) => hospital.villageId));
      }
      case 'blood_bank': {
        const banks = await this.bloodBankModel.findAll({
          where: { status: 'ACTIVE' },
          attributes: ['villageId'],
        });
        return this.getCountryIdsFromVillageIds(banks.map((bank) => bank.villageId));
      }
      case 'hotel': {
        const hotels = await this.nearbyHotelModel.findAll({
          where: { status: 'ACTIVE' },
          attributes: ['villageId'],
        });
        return this.getCountryIdsFromVillageIds(hotels.map((hotel) => hotel.villageId));
      }
      case 'restaurant': {
        const restaurants = await this.nearbyRestaurantModel.findAll({
          where: { status: 'ACTIVE' },
          attributes: ['villageId'],
        });
        return this.getCountryIdsFromVillageIds(restaurants.map((restaurant) => restaurant.villageId));
      }
      case 'pooja_store': {
        const stores = await this.poojaStoreModel.findAll({
          where: { status: 'ACTIVE' },
          attributes: ['villageId'],
        });
        return this.getCountryIdsFromVillageIds(stores.map((store) => store.villageId));
      }
      case 'tour_operator': {
        const operators = await this.tourOperatorModel.findAll({
          where: { status: 'ACTIVE' },
          attributes: ['villageId'],
        });
        return this.getCountryIdsFromVillageIds(operators.map((operator) => operator.villageId));
      }
      default:
        return null;
    }
  }

  private async getCountryIdsFromVillageIds(villageIds: Array<string | undefined>) {
    const uniqueVillageIds = this.collectIds(villageIds);

    if (!uniqueVillageIds.length) {
      return [];
    }

    const villages = await this.villageModel.findAll({
      where: { id: { [Op.in]: uniqueVillageIds } },
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
                },
              ],
            },
          ],
        },
      ],
    });

    const countryIds = villages
      .map((village) => village.block?.district?.state?.countryId)
      .filter((id): id is string => Boolean(id));

    return this.collectIds(countryIds);
  }

  private collectIds(values: Array<string | undefined | null>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
  }

  private mergeIds(groups: string[][]) {
    return this.collectIds(groups.flat());
  }

  private toResponse(country: Country): Record<string, unknown> {
    return {
      _id: country.id,
      name: country.name,
      image_location: this.mapImageLocation(country.imageLocation),
    };
  }

  private mapImageLocation(imageLocation?: string | null) {
    if (!imageLocation) {
      return [];
    }

    const trimmed = imageLocation.trim();
    if (!trimmed) {
      return [];
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    const rawBaseUrl =
      this.configService.get<string>('FILE_URL') ||
      this.configService.get<string>('File_path') ||
      '';

    if (!rawBaseUrl) {
      return trimmed;
    }

    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`;
    return `${baseUrl}${trimmed.replace(/^\/+/, '')}`;
  }
}
