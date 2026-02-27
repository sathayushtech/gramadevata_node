import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { CommentStatus } from '../../common/enums/comment-status.enum';
import { Block } from '../block/block.model';
import { Country } from '../../common/models/country.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Comment } from '../comments/comment.model';
import { Goshala } from '../goshalas/goshala.model';
import { Village } from '../villages/village.model';
import { Event } from './event.model';
import { NearbyHospital } from '../hospital/nearby-hospital.model';
import { TempleNearbyHotel } from './temple-nearby-hotel.model';
import { TempleNearbyRestaurant } from './temple-nearby-restaurant.model';
import { TempleTransport } from './temple-transport.model';
import { TourGuide } from './tour-guide.model';
import { TourOperator } from '../tourism/tour-operator.model';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event)
    private readonly eventModel: typeof Event,
    @InjectModel(Comment)
    private readonly commentModel: typeof Comment,
    @InjectModel(Goshala)
    private readonly goshalaModel: typeof Goshala,
    @InjectModel(NearbyHospital)
    private readonly nearbyHospitalModel: typeof NearbyHospital,
    @InjectModel(TempleTransport)
    private readonly templeTransportModel: typeof TempleTransport,
    @InjectModel(TempleNearbyHotel)
    private readonly templeNearbyHotelModel: typeof TempleNearbyHotel,
    @InjectModel(TempleNearbyRestaurant)
    private readonly templeNearbyRestaurantModel: typeof TempleNearbyRestaurant,
    @InjectModel(TourOperator)
    private readonly tourOperatorModel: typeof TourOperator,
    @InjectModel(TourGuide)
    private readonly tourGuideModel: typeof TourGuide,
    private readonly configService: ConfigService
  ) {}

  async getByState(stateId: string): Promise<Record<string, unknown>[]> {
    const events = await this.eventModel.findAll({
      where: { status: 'ACTIVE' },
      include: [
        {
          model: Village,
          required: true,
          include: [
            {
              model: Block,
              required: true,
              include: [
                {
                  model: District,
                  required: true,
                  where: { stateId },
                  include: [
                    {
                      model: State,
                      required: true,
                      include: [
                        { model: Country, required: true },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    return this.enrichEvents(events);
  }

  async getByDistrict(districtId: string): Promise<Record<string, unknown>[]> {
    const events = await this.eventModel.findAll({
      where: { status: 'ACTIVE' },
      include: [
        {
          model: Village,
          required: true,
          include: [
            {
              model: Block,
              required: true,
              where: { districtId },
              include: [
                {
                  model: District,
                  required: true,
                  include: [
                    {
                      model: State,
                      required: true,
                      include: [
                        { model: Country, required: true },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    return this.enrichEvents(events);
  }

  async getByBlock(blockId: string): Promise<Record<string, unknown>[]> {
    const events = await this.eventModel.findAll({
      where: { status: 'ACTIVE' },
      include: [
        {
          model: Village,
          required: true,
          where: { blockId },
          include: [
            {
              model: Block,
              required: true,
              include: [
                {
                  model: District,
                  required: true,
                  include: [
                    {
                      model: State,
                      required: true,
                      include: [
                        { model: Country, required: true },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    return this.enrichEvents(events);
  }

  private async enrichEvents(events: Event[]) {
    const enriched = [];
    for (const event of events) {
      enriched.push(await this.toEventResponse(event));
    }
    return enriched;
  }

  private async toEventResponse(event: Event) {
    const plain = event.get({ plain: true }) as Event & { village?: Village };
    const rawBaseUrl = this.configService.get<string>('File_path') || '';
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

    const mapLocation = this.parseList(plain.mapLocation);
    const imageLocation = this.mapFileList(plain.imageLocation, baseUrl);
    const eventVideo = this.mapFileList(plain.eventVideo, baseUrl);
    const relativeTime = this.computeRelativeTime(plain.startDate, plain.startTime);

    const comments = await this.commentModel.findAll({
      where: { eventId: plain.id, status: CommentStatus.ACTIVE },
      order: [['createdAt', 'DESC']],
    });

    const [nearbyHospitals, transports, nearbyHotels, nearbyRestaurants, tourOperators, tourGuides] =
      await Promise.all([
        this.nearbyHospitalModel.findAll({
          where: { eventId: plain.id, status: 'ACTIVE' },
        }),
        this.templeTransportModel.findAll({
          where: { eventId: plain.id, status: 'ACTIVE' },
        }),
        this.templeNearbyHotelModel.findAll({
          where: { eventId: plain.id, status: 'ACTIVE' },
        }),
        this.templeNearbyRestaurantModel.findAll({
          where: { eventId: plain.id, status: 'ACTIVE' },
        }),
        this.tourOperatorModel.findAll({
          where: { eventId: plain.id, status: 'ACTIVE' },
        }),
        this.tourGuideModel.findAll({
          where: { eventId: plain.id, status: 'ACTIVE' },
        }),
      ]);

    const nearbyEvents = await this.getNearbyEvents(plain, baseUrl);
    const nearbyGoshalas = await this.getNearbyGoshalas(plain, baseUrl);

    return {
      _id: plain.id,
      comments: comments.map((comment) => ({
        ...comment.get({ plain: true }),
        user: comment.userId ? { id: comment.userId } : null,
        goshala: comment.goshalaId ? { id: comment.goshalaId } : null,
        temple: comment.templeId ? { id: comment.templeId } : null,
        event: plain.id ? { id: plain.id, name: plain.name } : null,
        posted_time_ago: this.timeSince(comment.createdAt),
      })),
      image_location: imageLocation,
      relative_time: relativeTime,
      object_id: this.buildObjectId(plain.village),
      event_video: eventVideo,
      near_by_hospitals: nearbyHospitals.map((hospital) =>
        this.toNearbyHospitalResponse(hospital, baseUrl)
      ),
      transport: transports.map((transport) => this.toTempleTransportResponse(transport)),
      nearby_hotels: nearbyHotels.map((hotel) => this.toTempleNearbyHotelResponse(hotel, baseUrl)),
      resturents: nearbyRestaurants.map((restaurant) =>
        this.toTempleNearbyRestaurantResponse(restaurant, baseUrl)
      ),
      touroperator: tourOperators.map((operator) => this.toTourOperatorResponse(operator, baseUrl)),
      tour_guide: tourGuides.map((guide) => this.toTourGuideResponse(guide, baseUrl)),
      nearby_events: nearbyEvents,
      nearby_goshalas: nearbyGoshalas,
      map_location: mapLocation,
      name: plain.name ?? null,
      start_date: plain.startDate ?? null,
      end_date: plain.endDate ?? null,
      start_time: plain.startTime ?? null,
      end_time: plain.endTime ?? null,
      tag: plain.tag ?? null,
      tag_id: plain.tagId ?? null,
      tag_type_id: plain.tagTypeId ?? null,
      created_at: plain.createdAt ?? null,
      geo_site: plain.geoSite ?? null,
      content_type_id: plain.contentTypeId ?? null,
      address: plain.address ?? null,
      contact_name: plain.contactName ?? null,
      contact_phone: plain.contactPhone ?? null,
      contact_email: plain.contactEmail ?? null,
      desc: plain.desc ?? null,
      status: plain.status ?? null,
      event_status: plain.eventStatus ?? null,
      organized_by: plain.organizedBy ?? null,
      food: plain.food ?? null,
      water: plain.water ?? null,
      toilets: plain.toilets ?? null,
      country_name: plain.countryName ?? null,
      state_name: plain.stateName ?? null,
      district_name: plain.districtName ?? null,
      block_name: plain.blockName ?? null,
      village_name: plain.villageName ?? null,
      other_name: plain.otherName ?? null,
      category: plain.category ?? null,
      user: plain.userId ?? null,
      temple: plain.templeId ?? null,
      country: plain.countryId ?? null,
    };
  }

  private buildObjectId(village?: Village) {
    if (!village) {
      return null;
    }

    const block = village.block as Block | undefined;
    const district = block?.district as District | undefined;
    const state = district?.state as State | undefined;
    const country = state?.country as Country | undefined;

    if (!block || !district || !state || !country) {
      return {
        _id: village.id,
        name: village.name,
      };
    }

    return {
      _id: village.id,
      name: village.name,
      block: {
        block_id: block.id,
        name: block.name,
        district: {
          district_id: district.id,
          name: district.name,
          state: {
            state_id: state.id,
            name: state.name,
            country: {
              country_id: country.id,
              name: country.name,
            },
          },
        },
      },
    };
  }

  private parseList(raw: unknown): string[] {
    if (!raw) {
      return [];
    }

    if (Array.isArray(raw)) {
      return raw.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        // ignore
      }

      return raw
        .replace(/[\[\]]/g, '')
        .split(',')
        .map((item) => item.replace(/['"]+/g, '').trim())
        .filter(Boolean);
    }

    return [];
  }

  private mapFileList(raw: unknown, baseUrl: string) {
    const list = this.parseList(raw);
    if (!baseUrl) {
      return list;
    }
    return list.map((path) => `${baseUrl}/${path.replace(/^\/+/, '')}`);
  }

  private mapFileListOrNull(raw: unknown, baseUrl: string) {
    if (raw === null || raw === undefined || raw === 'null' || raw === '"null"') {
      return null;
    }

    return this.mapFileList(raw, baseUrl);
  }

  private computeRelativeTime(startDate?: string, startTime?: string) {
    if (!startDate || !startTime) {
      return 'Unknown';
    }
    const startMs = this.toZonedEpochMs(startDate, startTime);
    if (startMs === null) {
      return 'Unknown';
    }

    const diffMs = startMs - Date.now();
    const diffDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));

    if (diffMs > 0) {
      if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${diffHours} hours, ${diffMinutes} minutes to go`;
      }
      return diffDays === 1 ? '1 day to go' : `${diffDays} days to go`;
    }

    if (diffDays === 0) {
      const diffHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffHours} hours, ${diffMinutes} minutes ago`;
    }

    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }

  private toZonedEpochMs(date: string, time: string) {
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute, second = 0] = time.split(':').map(Number);

    if ([year, month, day, hour, minute].some((value) => Number.isNaN(value))) {
      return null;
    }

    const offsetMinutes = this.getTimeZoneOffsetMinutes();
    const utcMs = Date.UTC(year, month - 1, day, hour, minute, Number(second));
    return utcMs - offsetMinutes * 60 * 1000;
  }

  private getTimeZoneOffsetMinutes() {
    const tz = (this.configService.get<string>('TIME_ZONE') || 'Asia/Kolkata').trim();
    if (tz === 'Asia/Kolkata') {
      return 330;
    }
    return 0;
  }

  private timeSince(date?: Date) {
    if (!date) {
      return null;
    }

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} days ago`;
    }
    if (hours > 0) {
      return `${hours} hours ago`;
    }
    if (minutes > 0) {
      return `${minutes} minutes ago`;
    }
    return `${seconds} seconds ago`;
  }

  private async getNearbyEvents(event: Event, baseUrl: string) {
    if (!event.objectId) {
      return [];
    }

    const villageId = event.objectId;

    const sameVillage = await this.eventModel.findAll({
      where: { objectId: villageId },
    });

    const blockId = (event.village as Village | undefined)?.blockId;
    const sameBlock = blockId
      ? await this.eventModel.findAll({
        include: [
          {
            model: Village,
            required: true,
            where: { blockId },
          },
        ],
      })
      : [];

    const combined = [...sameVillage, ...sameBlock].filter((item) => item.id !== event.id);
    const unique = new Map<string, Event>();
    for (const item of combined) {
      unique.set(item.id, item);
    }

    return Array.from(unique.values()).map((item) => {
      const plain = item.get({ plain: true }) as Event;
      return {
        _id: plain.id,
        name: plain.name ?? null,
        image_location: this.mapFileList(plain.imageLocation, baseUrl),
      };
    });
  }

  private async getNearbyGoshalas(event: Event, baseUrl: string) {
    const village = event.village as Village | undefined;
    const blockId = village?.blockId;
    if (!blockId) {
      return [];
    }

    const goshalas = await this.goshalaModel.findAll({
      where: { status: 'ACTIVE' },
      include: [
        {
          model: Village,
          required: true,
          where: { blockId },
        },
      ],
    });

    return goshalas
      .filter((goshala) => goshala.id !== event.id)
      .map((goshala) => this.toGoshalaResponse(goshala, baseUrl));
  }

  private toGoshalaResponse(goshala: Goshala, baseUrl: string) {
    const plain = goshala.get({ plain: true }) as Goshala;

    return {
        _id: plain.id,
        name: plain.name ?? null,
        reg_num: plain.regNum ?? null,
        geo_site: plain.geoSite ?? null,
        map_location: plain.mapLocation ?? null,
        contact_name: plain.contactName ?? null,
        contact_phone: plain.contactPhone ?? null,
        address: plain.address ?? null,
        email: plain.email ?? null,
        desc: plain.desc ?? null,
        regn_document: plain.regnDocument ?? null,
        status: plain.status ?? null,
        image_location: this.mapFileList(plain.imageLocation, baseUrl),
        goshala_video: this.mapFileListOrNull(plain.goshalaVideo, baseUrl),
        managed_by: plain.managedBy ?? null,
        timings: plain.timings ?? null,
        official_website: plain.officialWebsite ?? null,
        country_name: plain.countryName ?? null,
        state_name: plain.stateName ?? null,
        district_name: plain.districtName ?? null,
        block_name: plain.blockName ?? null,
        village_name: plain.villageName ?? null,
        other_name: plain.otherName ?? null,
        devotees_visiting: plain.devoteesVisiting ?? null,
        feeding_accessibility: plain.feedingAccessibility ?? null,
        inside_feeding_accessibility: plain.insideFeedingAccessibility ?? null,
        outside_feeding_accessibility: plain.outsideFeedingAccessibility ?? null,
        adoption_of_cow_or_bull_inside: plain.adoptionOfCowOrBullInside ?? null,
        adoption_of_cow_or_bull_outside: plain.adoptionOfCowOrBullOutside ?? null,
        festivals: plain.festivals ?? null,
        prayers: plain.prayers ?? null,
        social_activites: plain.socialActivites ?? null,
        other_services: plain.otherServices ?? null,
        created_at: plain.createdAt ?? null,
        category: plain.category ?? null,
        object_id: plain.objectId ?? null,
        temple: plain.temple ?? null,
        user: plain.user ?? null,
        country: plain.country ?? null
    };
  }

  private toNearbyHospitalResponse(hospital: NearbyHospital, baseUrl: string) {
    const plain = hospital.get({ plain: true }) as NearbyHospital;

    return {
      _id: plain.id,
      name: plain.name ?? null,
      address: plain.address ?? null,
      map_location: plain.mapLocation ?? null,
      temple_id: plain.templeId ?? null,
      village_id: plain.villageId ?? null,
      user_id: plain.userId ?? null,
      image_location: this.mapFileList(plain.imageLocation, baseUrl),
      created_at: plain.createdAt ?? null,
      status: plain.status ?? null,
      event_id: plain.eventId ?? null,
      tourism_places: plain.tourismPlaces ?? null,
      owner_name: plain.ownerName ?? null,
      contact_number: plain.contactNumber ?? null,
      license_copy: this.mapFileList(plain.licenseCopy, baseUrl),
    };
  }

  private toTempleTransportResponse(transport: TempleTransport) {
    const plain = transport.get({ plain: true }) as TempleTransport;

    return {
      _id: plain.id,
      desc: plain.desc ?? null,
      created_at: plain.createdAt ?? null,
      temple_id: plain.templeId ?? null,
      village_id: plain.villageId ?? null,
      status: plain.status ?? null,
      user_id: plain.userId ?? null,
      map_location: plain.mapLocation ?? null,
      transport_type: plain.transportType ?? null,
      event_id: plain.eventId ?? null,
      tourism_places: plain.tourismPlaces ?? null,
    };
  }

  private toTempleNearbyHotelResponse(hotel: TempleNearbyHotel, baseUrl: string) {
    const plain = hotel.get({ plain: true }) as TempleNearbyHotel;

    return {
      _id: plain.id,
      name: plain.name ?? null,
      hotel_rating: plain.hotelRating ?? null,
      temple_id: plain.templeId ?? null,
      created_at: plain.createdAt ?? null,
      address: plain.address ?? null,
      map_location: plain.mapLocation ?? null,
      status: plain.status ?? null,
      user_id: plain.userId ?? null,
      village_id: plain.villageId ?? null,
      image_location: this.mapFileList(plain.imageLocation, baseUrl),
      owner_name: plain.ownerName ?? null,
      contact_number: plain.contactNumber ?? null,
      email_id: plain.emailId ?? null,
      website: plain.website ?? null,
      event_id: plain.eventId ?? null,
      tourism_places: plain.tourismPlaces ?? null,
      license_copy: this.mapFileList(plain.licenseCopy, baseUrl),
      restaurent: plain.restaurent ?? null,
    };
  }

  private toTempleNearbyRestaurantResponse(restaurant: TempleNearbyRestaurant, baseUrl: string) {
    const plain = restaurant.get({ plain: true }) as TempleNearbyRestaurant;

    return {
      _id: plain.id,
      name: plain.name ?? null,
      temple_id: plain.templeId ?? null,
      created_at: plain.createdAt ?? null,
      address: plain.address ?? null,
      map_location: plain.mapLocation ?? null,
      village_id: plain.villageId ?? null,
      status: plain.status ?? null,
      user_id: plain.userId ?? null,
      image_location: this.mapFileList(plain.imageLocation, baseUrl),
      owner_name: plain.ownerName ?? null,
      contact_number: plain.contactNumber ?? null,
      email_id: plain.emailId ?? null,
      website: plain.website ?? null,
      event_id: plain.eventId ?? null,
      tourism_places: plain.tourismPlaces ?? null,
    };
  }

  private toTourOperatorResponse(operator: TourOperator, baseUrl: string) {
    const plain = operator.get({ plain: true }) as TourOperator;

    return {
      _id: plain.id,
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
      image_location: this.mapFileList(plain.imageLocation, baseUrl),
    };
  }

  private toTourGuideResponse(guide: TourGuide, baseUrl: string) {
    const plain = guide.get({ plain: true }) as TourGuide;

    return {
      _id: plain.id,
      user_id: plain.userId ?? null,
      village_id: plain.villageId ?? null,
      temple_id: plain.templeId ?? null,
      created_at: plain.createdAt ?? null,
      tourist_spot_covered: plain.touristSpotCovered ?? null,
      language: plain.language ?? null,
      mobile: plain.mobile ?? null,
      status: plain.status ?? null,
      event_id: plain.eventId ?? null,
      image_location: this.mapFileList(plain.imageLocation, baseUrl),
    };
  }
}
