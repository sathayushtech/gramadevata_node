import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { CreationAttributes, Op, literal, Order } from 'sequelize';
import { CommentStatus } from '../../common/enums/comment-status.enum';
import { Block } from '../block/block.model';
import { Country } from '../../common/models/country.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Comment } from '../comments/comment.model';
import { Register as User } from '../auth/user.model';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';
import { Goshala } from '../goshalas/goshala.model';
import { Village } from '../villages/village.model';
import { Event } from './event.model';
import { EventCategory } from './event-category.model';
import { NearbyHospital } from '../hospital/nearby-hospital.model';
import { TempleNearbyHotel } from './temple-nearby-hotel.model';
import { TempleNearbyRestaurant } from './temple-nearby-restaurant.model';
import { TempleTransport } from './temple-transport.model';
import { TourGuide } from './tour-guide.model';
import { TourOperator } from '../tourism/tour-operator.model';
import { Temple } from '../temple/temple.model';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event)
    private readonly eventModel: typeof Event,
    @InjectModel(EventCategory)
    private readonly eventCategoryModel: typeof EventCategory,
    @InjectModel(Village)
    private readonly villageModel: typeof Village,
    @InjectModel(Comment)
    private readonly commentModel: typeof Comment,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Goshala)
    private readonly goshalaModel: typeof Goshala,
    @InjectModel(Temple)
    private readonly templeModel: typeof Temple,
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

  async listEvents(query: Record<string, string | undefined>): Promise<Record<string, unknown>> {
    const filters = this.buildEventFilters(query);
    filters.status = 'ACTIVE';

    let events = await this.eventModel.findAll({
      where: filters,
      include: this.getLocationInclude(),
    });

    if (!events.length) {
      return { message: 'Data not found', status: 404 };
    }

    await this.updateEventStatuses(events);

    events = await this.eventModel.findAll({
      where: filters,
      include: this.getLocationInclude(),
    });

    if (!Object.keys(query).length) {
      const upcoming = events.filter((event) => event.eventStatus === 'UPCOMING');
      const ongoing = events.filter((event) => event.eventStatus === 'ONGOING');
      const completed = events.filter((event) => event.eventStatus === 'COMPLETED');

      return {
        status: 200,
        event_upcoming: await this.enrichEventsWithNearbyTemples(upcoming),
        event_ongoing: await this.enrichEventsWithNearbyTemples(ongoing),
        event_completed: await this.enrichEventsWithNearbyTemples(completed),
      };
    }

    return this.enrichEventsWithNearbyTemples(events) as unknown as Record<string, unknown>;
  }

  async getEventById(id: string): Promise<Record<string, unknown> | null> {
    const event = await this.eventModel.findByPk(id, {
      include: this.getLocationInclude(),
    });

    if (!event) {
      return null;
    }

    return this.toEventResponse(event);
  }

  async createEvent(payload: Record<string, unknown>, userPayload?: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const user = await this.resolveUser(userPayload);
      if (!user) {
        return { status: 404, body: { message: 'User not found.' } };
      }

      if ((user.isMember || '').toLowerCase() === 'false') {
        return {
          status: 400,
          body: {
            message:
              'Cannot add Event. Membership required. Update your profile and become a member to add an event.',
          },
        };
      }

      const imageLocations = this.cleanUploadList(payload.image_location);
      const eventVideos = this.cleanUploadList(payload.event_video);

      const createData = this.mapEventPayload(payload);
      createData.imageLocation = [];
      createData.eventVideo = [];
      createData.userId = user.id;

      const event = await this.eventModel.create(createData as CreationAttributes<Event>);

      if (imageLocations.length) {
        const savedImages = await GramadevataUtils.saveEntityImagesToAzure({
          configService: this.configService,
          images: imageLocations,
          id: event.id,
          name: event.name ?? 'event',
          entityType: 'events',
        });
        if (savedImages.length) {
          event.imageLocation = savedImages;
        }
      }

      if (eventVideos.length) {
        const savedVideos = await GramadevataUtils.saveEntityVideosToAzure({
          configService: this.configService,
          videos: eventVideos,
          id: event.id,
          name: event.name ?? 'event',
          entityType: 'events',
        });
        if (savedVideos.length) {
          event.eventVideo = savedVideos;
        }
      }

      event.eventStatus = this.computeEventStatus(event.startDate, event.startTime, event.endDate, event.endTime);
      await event.save();

      await this.sendEventNotification('New Event Added', user.id, event);

      return {
        status: 201,
        body: { message: 'success', result: await this.toEventResponse(event) },
      };
    } catch (error) {
      return {
        status: 500,
        body: {
          message: 'An error occurred.',
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async createEventPost(payload: Record<string, unknown>, userPayload?: Record<string, unknown>) {
    try {
      const user = await this.resolveUser(userPayload);
      if (!user) {
        return { status: 404, body: { message: 'User not found.' } };
      }

      const memberFlag = (user.isMember || '').toString().toUpperCase();
      if (memberFlag === 'NO' || memberFlag === 'FALSE') {
        return {
          status: 400,
          body: {
            message: 'Cannot add the temple. Membership details are required. Update your profile and become a member.',
          },
        };
      }

      const imageLocations = this.cleanUploadList(payload.image_location);

      const createData = this.mapEventPayload(payload);
      createData.imageLocation = [];
      createData.userId = user.id;

      const event = await this.eventModel.create(createData as CreationAttributes<Event>);

      if (imageLocations.length) {
        const savedImages = await GramadevataUtils.saveEntityImagesToAzure({
          configService: this.configService,
          images: imageLocations,
          id: event.id,
          name: event.name ?? 'event',
          entityType: 'event',
        });
        if (savedImages.length) {
          event.imageLocation = savedImages;
          await event.save();
        }
      }

      return {
        status: 200,
        body: { message: 'success', result: this.toEventRaw(event) },
      };
    } catch (error) {
      return {
        status: 500,
        body: { message: 'An error occurred.', error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  async updateEvent(id: string, payload: Record<string, unknown>, userPayload?: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const user = await this.resolveUser(userPayload);
      if (!user) {
        return { status: 404, body: { message: 'User not found.' } };
      }

      if ((user.isMember || '').toLowerCase() === 'false') {
        return {
          status: 400,
          body: {
            message:
              'Cannot update Event. Membership details are required. Update your profile and become a member to update Event.',
          },
        };
      }

      const event = await this.eventModel.findByPk(id);
      if (!event) {
        return { status: 404, body: { message: 'Object not found' } };
      }

      const updateData = this.mapEventPayload(payload);
      await event.update(updateData);

      const imageLocations = this.cleanUploadList(payload.image_location);
      if (imageLocations.length && !imageLocations.includes('null')) {
        const savedImages = await GramadevataUtils.saveEntityImagesToAzure({
          configService: this.configService,
          images: imageLocations,
          id: event.id,
          name: event.name ?? 'event',
          entityType: 'events',
        });
        if (savedImages.length) {
          event.imageLocation = savedImages;
        }
      }

      event.eventStatus = this.computeEventStatus(event.startDate, event.startTime, event.endDate, event.endTime);
      await event.save();

      await this.sendEventNotification('Event Updated', user.id, event);

      return {
        status: 200,
        body: { message: 'updated successfully', data: await this.toEventResponse(event) },
      };
    } catch (error) {
      return {
        status: 500,
        body: {
          message: 'An error occurred.',
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async removeEvent(id: string): Promise<boolean> {
    const event = await this.eventModel.findByPk(id);
    if (!event) {
      return false;
    }

    await event.destroy();
    return true;
  }

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

  async listEventStatus(
    query: Record<string, string | undefined>,
    baseUrl?: string
  ): Promise<Record<string, unknown>> {
    const statusParam = query.status?.toUpperCase();
    const allowedStatuses = ['UPCOMING', 'COMPLETED', 'ONGOING'];
    if (statusParam && !allowedStatuses.includes(statusParam)) {
      throw new BadRequestException('Invalid status value');
    }

    const allEvents = await this.eventModel.findAll();
    await this.updateEventStatuses(allEvents);

    const where: Record<string, unknown> = {};
    if (statusParam) {
      where.eventStatus = statusParam;
    }

    const page = this.normalizePage(query.page ?? query.page_no);
    const pageSize = this.normalizePageSize(query.page_size ?? query.pageSize);
    const offset = (page - 1) * pageSize;

    const { count, rows } = await this.eventModel.findAndCountAll({
      where,
      include: this.getLocationInclude(),
      order: this.getEventStatusOrder(),
      limit: pageSize,
      offset,
    });

    const results = await this.enrichEvents(rows);

    return this.buildPaginatedResponse({
      count,
      page,
      pageSize,
      results,
      baseUrl,
      query,
    });
  }

  async listInactiveEvents(query: Record<string, string | undefined>) {
    const filters = this.buildEventFilters(query);
    const searchQuery = query.search;

    const where: Record<string, unknown> & { [Op.or]?: unknown } = {
      ...filters,
      status: 'INACTIVE',
    };

    if (searchQuery) {
      where[Op.or] = [
        { name: { [Op.like]: `%${searchQuery}%` } },
        { address: { [Op.like]: `%${searchQuery}%` } },
      ];
    }

    const events = await this.eventModel.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    if (!events.length) {
      return { status: 404, body: { message: 'Data not found', status: 404 } };
    }

    const responses = await this.toInactiveResponses(events);

    return {
      status: 200,
      count: responses.length,
      event_upcoming: responses.filter((event) => event.event_status === 'UPCOMING'),
      event_completed: responses.filter((event) => event.event_status === 'COMPLETED'),
      event_ongoing: responses.filter((event) => event.event_status === 'ONGOING'),
    };
  }

  async getInactiveEventByField(fieldName: string, inputValue: string): Promise<{ status: number; body: unknown }> {
    const resolvedField = this.resolveEventFieldName(fieldName);
    if (!resolvedField || !this.isEventField(resolvedField)) {
      return {
        status: 400,
        body: {
          message: `Invalid field name: '${fieldName}'`,
          status: 400,
        },
      };
    }

    const events = await this.eventModel.findAll({
      where: { [resolvedField]: inputValue, status: 'INACTIVE' },
      include: this.getLocationInclude(),
    });

    if (!events.length) {
      return { status: 404, body: { message: 'Event not found', status: 404 } };
    }

    return {
      status: 200,
      body: await this.enrichEvents(events),
    };
  }

  async getEventsMain(): Promise<Record<string, unknown>> {
    const [categories, villages] = await Promise.all([
      this.eventCategoryModel.findAll({ limit: 4 }),
      this.villageModel.findAll(),
    ]);

    const villageIds = villages.map((village: Village) => village.id);

    const indianEvents = villageIds.length
      ? await this.eventModel.findAll({
        where: { objectId: { [Op.in]: villageIds } },
        include: this.getLocationInclude(),
        limit: 4,
      })
      : [];

    const globalEvents = await this.eventModel.findAll({
      where: {
        ...(villageIds.length ? { objectId: { [Op.notIn]: villageIds } } : {}),
        geoSite: { [Op.notIn]: ['S', 'D', 'B', 'V'] },
      },
      include: this.getLocationInclude(),
      limit: 4,
    });

    return {
      categories: categories.map((category: EventCategory) => this.toEventCategoryResponse(category)),
      indianevents: await this.enrichEvents(indianEvents),
      globalevents: await this.enrichEvents(globalEvents),
    };
  }

  async getInactiveByLocation(
    inputValue?: string,
    category?: string
  ): Promise<{ status: number; event_upcoming: Record<string, unknown>[]; event_completed: Record<string, unknown>[] }> {
    if (!inputValue && !category) {
      throw new BadRequestException('At least one of input_value or category must be provided.');
    }

    const include = this.getLocationInclude();
    const order = this.getEventOrder();

    let events = await this.eventModel.findAll({
      where: this.buildLocationWhere(inputValue, category),
      include,
      order,
    });

    if (!events.length && inputValue) {
      events = await this.eventModel.findAll({
        where: this.buildFallbackWhere(inputValue, category),
        include,
        order,
      });
    }

    const inactive = events.filter((event) => event.status === 'INACTIVE');
    const enriched = await this.enrichEvents(inactive);

    return {
      status: 200,
      event_upcoming: enriched.filter((event) => event.event_status === 'UPCOMING'),
      event_completed: enriched.filter((event) => event.event_status === 'COMPLETED'),
    };
  }

  async listGlobalEvents(
    query: Record<string, string | undefined>,
    baseUrl?: string
  ): Promise<Record<string, unknown>> {
    const page = this.normalizePage(query.page ?? query.page_no);
    const pageSize = this.normalizePageSize(query.page_size ?? query.pageSize);
    const offset = (page - 1) * pageSize;

    const { count, rows } = await this.eventModel.findAndCountAll({
      where: {
        geoSite: { [Op.notIn]: ['S', 'D', 'B', 'V'] },
      },
      include: this.getLocationInclude(),
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset,
    });

    const results = await this.enrichEvents(rows);

    return this.buildPaginatedResponse({
      count,
      page,
      pageSize,
      results,
      baseUrl,
      query,
    });
  }

  private async enrichEvents(events: Event[]) {
    const enriched = [];
    for (const event of events) {
      enriched.push(await this.toEventResponse(event));
    }
    return enriched;
  }

  private async enrichEventsWithNearbyTemples(events: Event[]) {
    const rawBaseUrl = this.configService.get<string>('File_path') || '';
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
    const results = [];

    for (const event of events) {
      const response = await this.toEventResponse(event);
      const nearbyTemples = await this.getNearbyTemples(event, baseUrl);
      results.push({
        ...response,
        nearby_temples: nearbyTemples,
      });
    }

    return results;
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

  private async getNearbyTemples(event: Event, baseUrl: string) {
    const ICONIC_ID = 'd7df749f-97e8-4635-a211-371c44b3c31f';
    const FAMOUS_ID = '630f3239-f515-47fb-be8d-db727b9f2174';
    const GRAMADEVATA_ID = '742ccfe6-d0b5-11ee-84bd-0242ac110002';

    const village = event.village as Village | undefined;
    const block = village?.block;

    let temples = await this.templeModel.findAll({
      include: this.getLocationInclude(),
    });

    if (village) {
      temples = temples.filter((temple) => temple.objectId === village.id);
    } else if (block) {
      temples = temples.filter((temple) => (temple.village as Village | undefined)?.blockId === block.id);
    }

    const iconic = temples.filter((temple) => temple.priorityId === ICONIC_ID);
    const famous = temples.filter((temple) => temple.priorityId === FAMOUS_ID);
    const gramadevata = temples.filter((temple) => temple.categoryId === GRAMADEVATA_ID);

    const excludeIds = new Set([
      ...iconic.map((temple) => temple.id),
      ...famous.map((temple) => temple.id),
      ...gramadevata.map((temple) => temple.id),
    ]);

    const other = temples.filter((temple) => !excludeIds.has(temple.id));

    const mapTempleList = (list: Temple[]) =>
      list.map((temple) => {
        const plain = temple.get({ plain: true }) as Temple;
        return {
          _id: plain.id,
          name: plain.name ?? null,
          image_location: this.mapFileList(plain.imageLocation, baseUrl),
        };
      });

    return {
      iconic_temples: mapTempleList(iconic),
      famous_temples: mapTempleList(famous),
      gramadevata_temples: mapTempleList(gramadevata),
      other_temples: mapTempleList(other),
    };
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

  private getLocationInclude() {
    return [
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
    ];
  }

  private getEventOrder(): Order {
    const today = new Date().toISOString().slice(0, 10);
    return [
      [
        literal(
          `CASE WHEN start_date >= '${today}' THEN 0 WHEN start_date < '${today}' THEN 1 ELSE 2 END`
        ),
        'ASC',
      ],
      ['startDate', 'ASC'],
    ];
  }

  private buildLocationWhere(inputValue?: string, category?: string) {
    const where: Record<string, unknown> & { [Op.or]?: unknown } = {};
    if (category) {
      where.category = category;
    }
    if (inputValue) {
      where[Op.or] = [
        { '$village.block.district.state.country.id$': inputValue },
        { '$village.block.district.state.id$': inputValue },
        { '$village.block.district.id$': inputValue },
        { '$village.block.id$': inputValue },
        { '$village.id$': inputValue },
      ];
    }
    return where;
  }

  private buildFallbackWhere(inputValue?: string, category?: string) {
    const where: Record<string, unknown> = {};
    if (inputValue) {
      where.objectId = inputValue;
    }
    if (category) {
      where.category = category;
    }
    return where;
  }

  private buildEventFilters(query: Record<string, string | undefined>) {
    const filters: Record<string, string> = {};

    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      if (['page', 'page_size', 'pageSize', 'page_no', 'ordering'].includes(key)) {
        return;
      }

      if (key === '_id') {
        filters.id = value;
        return;
      }

      filters[key] = value;
    });

    return filters;
  }

  private cleanUploadList(value: unknown) {
    return GramadevataUtils.coerceStringList(value).filter((item) => item && item !== 'null');
  }

  private mapEventPayload(payload: Record<string, unknown>) {
    const data: Partial<Event> = {};
    const mappings: Record<string, string> = {
      category: 'category',
      name: 'name',
      start_date: 'startDate',
      end_date: 'endDate',
      start_time: 'startTime',
      end_time: 'endTime',
      tag: 'tag',
      tag_id: 'tagId',
      tag_type_id: 'tagTypeId',
      geo_site: 'geoSite',
      object_id: 'objectId',
      content_type_id: 'contentTypeId',
      map_location: 'mapLocation',
      address: 'address',
      contact_name: 'contactName',
      contact_phone: 'contactPhone',
      contact_email: 'contactEmail',
      desc: 'desc',
      status: 'status',
      temple: 'templeId',
      temple_id: 'templeId',
      event_status: 'eventStatus',
      organized_by: 'organizedBy',
      food: 'food',
      water: 'water',
      toilets: 'toilets',
      country_name: 'countryName',
      state_name: 'stateName',
      district_name: 'districtName',
      block_name: 'blockName',
      village_name: 'villageName',
      other_name: 'otherName',
      country: 'countryId',
    };

    Object.entries(mappings).forEach(([inputKey, modelKey]) => {
      if (payload[inputKey] !== undefined) {
        (data as Record<string, unknown>)[modelKey] = payload[inputKey];
      }
    });

    return data;
  }

  private computeEventStatus(
    startDate?: string,
    startTime?: string,
    endDate?: string,
    endTime?: string
  ) {
    if (!startDate || !startTime || !endDate || !endTime) {
      return 'UPCOMING';
    }

    const startMs = this.toZonedEpochMs(startDate, startTime);
    const endMs = this.toZonedEpochMs(endDate, endTime);
    if (startMs === null || endMs === null) {
      return 'UPCOMING';
    }

    const now = Date.now();
    if (now < startMs) {
      return 'UPCOMING';
    }
    if (now >= startMs && now <= endMs) {
      return 'ONGOING';
    }
    return 'COMPLETED';
  }

  private async updateEventStatuses(events: Event[]) {
    for (const event of events) {
      const status = this.computeEventStatus(
        event.startDate,
        event.startTime,
        event.endDate,
        event.endTime
      );
      if (event.eventStatus !== status) {
        event.eventStatus = status;
        await event.save();
      }
    }
  }

  private async resolveUser(userPayload?: Record<string, unknown>) {
    if (!userPayload) {
      return null;
    }

    const userId = userPayload.user_id ?? userPayload.id;
    if (userId) {
      const user = await this.userModel.findByPk(String(userId));
      if (user) {
        return user;
      }
    }

    const email = typeof userPayload.email === 'string' ? userPayload.email : undefined;
    const contactNumber = typeof userPayload.contact_number === 'string' ? userPayload.contact_number : undefined;
    const username = typeof userPayload.username === 'string' ? userPayload.username : undefined;

    if (email) {
      const user = await this.userModel.findOne({ where: { email } });
      if (user) {
        return user;
      }
    }

    if (contactNumber) {
      const user = await this.userModel.findOne({ where: { contactNumber } });
      if (user) {
        return user;
      }
    }

    if (username) {
      const user = await this.userModel.findOne({ where: { username } });
      if (user) {
        return user;
      }
    }

    return null;
  }

  private async sendEventNotification(subject: string, userId: string, event: Event) {
    const recipient = this.configService.get<string>('EMAIL_HOST_USER');
    if (!recipient) {
      return;
    }

    await GramadevataUtils.sendAdminEmail(this.configService, {
      subject,
      text: `User ID: ${userId}\n` +
        `Created Time: ${new Date().toISOString().slice(0, 19).replace('T', ' ')}\n` +
        `Event ID: ${event.id}\n` +
        `Event Name: ${event.name ?? ''}`,
      recipients: [recipient],
    });
  }

  
  private toEventRaw(event: Event) {
    const plain = event.get({ plain: true }) as Event;
    return {
      _id: plain.id,
      category: plain.category ?? null,
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
      object_id: plain.objectId ?? null,
      content_type_id: plain.contentTypeId ?? null,
      map_location: plain.mapLocation ?? null,
      address: plain.address ?? null,
      contact_name: plain.contactName ?? null,
      contact_phone: plain.contactPhone ?? null,
      contact_email: plain.contactEmail ?? null,
      desc: plain.desc ?? null,
      status: plain.status ?? null,
      user: plain.userId ?? null,
      image_location: this.parseList(plain.imageLocation),
      temple: plain.templeId ?? null,
      event_status: plain.eventStatus ?? null,
      event_video: this.parseList(plain.eventVideo),
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
      country: plain.countryId ?? null,
    };
  }

  private getEventStatusOrder(): Order {
    return [
      [
        literal(
          "CASE WHEN event_status = 'UPCOMING' THEN 0 WHEN event_status = 'COMPLETED' THEN 1 ELSE 2 END"
        ),
        'ASC',
      ],
      ['startDate', 'ASC'],
    ];
  }

  private buildPaginatedResponse(params: {
    count: number;
    page: number;
    pageSize: number;
    results: Record<string, unknown>[];
    baseUrl?: string;
    query: Record<string, string | undefined>;
  }) {
    const { count, page, pageSize, results, baseUrl, query } = params;
    const totalPages = Math.ceil(count / pageSize) || 1;

    const nextPage = page < totalPages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    const next = nextPage ? this.buildPageLink(baseUrl, query, nextPage, pageSize) : null;
    const previous = prevPage ? this.buildPageLink(baseUrl, query, prevPage, pageSize) : null;

    return {
      count,
      next,
      previous,
      results,
    };
  }

  private buildPageLink(
    baseUrl: string | undefined,
    query: Record<string, string | undefined>,
    page: number,
    pageSize: number
  ) {
    if (!baseUrl) {
      return page;
    }

    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      if (key === 'page' || key === 'page_no') {
        return;
      }
      params.set(key, value);
    });

    params.set('page', String(page));
    params.set('page_size', String(pageSize));

    return `${baseUrl}?${params.toString()}`;
  }

  private normalizePage(value?: string) {
    const page = Number.parseInt(value ?? '1', 10);
    return Number.isNaN(page) || page < 1 ? 1 : page;
  }

  private normalizePageSize(value?: string) {
    const size = Number.parseInt(value ?? '50', 10);
    if (Number.isNaN(size) || size < 1) {
      return 50;
    }
    return Math.min(size, 90);
  }

  private resolveEventFieldName(fieldName: string) {
    if (fieldName === '_id') {
      return 'id';
    }

    const mapping: Record<string, string> = {
      category: 'category',
      name: 'name',
      start_date: 'startDate',
      end_date: 'endDate',
      start_time: 'startTime',
      end_time: 'endTime',
      tag: 'tag',
      tag_id: 'tagId',
      tag_type_id: 'tagTypeId',
      geo_site: 'geoSite',
      object_id: 'objectId',
      content_type_id: 'contentTypeId',
      map_location: 'mapLocation',
      address: 'address',
      contact_name: 'contactName',
      contact_phone: 'contactPhone',
      contact_email: 'contactEmail',
      desc: 'desc',
      status: 'status',
      temple: 'templeId',
      temple_id: 'templeId',
      event_status: 'eventStatus',
      event_video: 'eventVideo',
      organized_by: 'organizedBy',
      food: 'food',
      water: 'water',
      toilets: 'toilets',
      country_name: 'countryName',
      state_name: 'stateName',
      district_name: 'districtName',
      block_name: 'blockName',
      village_name: 'villageName',
      other_name: 'otherName',
      country: 'countryId',
      user: 'userId',
      user_id: 'userId',
    };

    return mapping[fieldName] ?? fieldName;
  }

  private isEventField(fieldName: string) {
    return Object.prototype.hasOwnProperty.call(this.eventModel.rawAttributes, fieldName);
  }

  private async toInactiveResponses(events: Event[]) {
    const userIds = Array.from(
      new Set(events.map((event) => event.userId).filter((id): id is string => Boolean(id)))
    );

    const users = userIds.length
      ? await this.userModel.findAll({ where: { id: { [Op.in]: userIds } } })
      : [];

    const userMap = new Map(users.map((user) => [user.id, user.fullName ?? null]));

    return events.map((event) => this.toEventInactiveResponse(event, userMap));
  }

  private toEventInactiveResponse(event: Event, userMap: Map<string, string | null>) {
    const plain = event.get({ plain: true }) as Event;
    const rawBaseUrl = this.configService.get<string>('File_path') || '';
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

    return {
      _id: plain.id,
      category: plain.category ?? null,
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
      object_id: plain.objectId ?? null,
      content_type_id: plain.contentTypeId ?? null,
      map_location: plain.mapLocation ?? null,
      address: plain.address ?? null,
      contact_name: plain.contactName ?? null,
      contact_phone: plain.contactPhone ?? null,
      contact_email: plain.contactEmail ?? null,
      desc: plain.desc ?? null,
      status: plain.status ?? null,
      user: plain.userId ?? null,
      image_location: this.mapFileList(plain.imageLocation, baseUrl),
      temple: plain.templeId ?? null,
      event_status: plain.eventStatus ?? null,
      event_video: this.mapFileList(plain.eventVideo, baseUrl),
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
      country: plain.countryId ?? null,
      user_full_name: plain.userId ? userMap.get(plain.userId) ?? null : null,
      relative_time: plain.createdAt ? this.timeSince(plain.createdAt) : null,
    };
  }

  private toEventCategoryResponse(category: EventCategory) {
    const rawBaseUrl = this.configService.get<string>('FILE_URL')
      || this.configService.get<string>('File_path')
      || '';
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
    const pic = category.pic
      ? category.pic.startsWith('http')
        ? category.pic
        : `${baseUrl}/${category.pic.replace(/^\/+/, '')}`
      : null;

    return {
      _id: category.id,
      name: category.name,
      desc: category.desc ?? null,
      created_at: category.createdAt ?? null,
      pic,
    };
  }
}
