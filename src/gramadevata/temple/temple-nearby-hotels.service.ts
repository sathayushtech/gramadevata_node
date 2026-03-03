import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import type { CreationAttributes } from 'sequelize';
import { Op } from 'sequelize';
import { EntityStatus } from '../../common/enums';
import { Country } from '../../common/models/country.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { coerceList, toFileUrlList } from '../../common/utils/django-serializer';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';
import { Block } from '../block/block.model';
import { Village } from '../villages/village.model';
import { TempleNearbyHotel } from '../events/temple-nearby-hotel.model';

@Injectable()
export class TempleNearbyHotelsService {
  constructor(
    @InjectModel(TempleNearbyHotel)
    private readonly hotelModel: typeof TempleNearbyHotel,
    @InjectModel(Village)
    private readonly villageModel: typeof Village,
    @InjectModel(Block)
    private readonly blockModel: typeof Block,
    @InjectModel(District)
    private readonly districtModel: typeof District,
    @InjectModel(State)
    private readonly stateModel: typeof State,
    @InjectModel(Country)
    private readonly countryModel: typeof Country,
    private readonly configService: ConfigService,
  ) {}

  private parseList(raw: unknown) {
    return coerceList(raw).filter((v) => v && v.toLowerCase() !== 'null');
  }

  private serialize(record: TempleNearbyHotel) {
    const plain = record.get({ plain: true }) as unknown as Record<string, unknown>;
    return {
      _id: (plain as any).id,
      name: (plain as any).name ?? null,
      hotel_rating: (plain as any).hotelRating ?? null,
      temple_id: (plain as any).templeId ?? null,
      created_at: (plain as any).createdAt ?? null,
      address: (plain as any).address ?? null,
      map_location: (plain as any).mapLocation ?? null,
      status: (plain as any).status ?? null,
      user_id: (plain as any).userId ?? null,
      village_id: (plain as any).villageId ?? null,
      owner_name: (plain as any).ownerName ?? null,
      contact_number: (plain as any).contactNumber ?? null,
      email_id: (plain as any).emailId ?? null,
      website: (plain as any).website ?? null,
      event_id: (plain as any).eventId ?? null,
      tourism_places: (plain as any).tourismPlaces ?? null,
      restaurent: (plain as any).restaurent ?? null,
      image_location: toFileUrlList(this.configService, (plain as any).imageLocation),
      license_copy: toFileUrlList(this.configService, (plain as any).licenseCopy),
    };
  }

  private serializeNearby(record: TempleNearbyHotel) {
    const plain = record.get({ plain: true }) as unknown as Record<string, unknown>;
    return {
      _id: (plain as any).id,
      name: (plain as any).name ?? null,
      image_location: toFileUrlList(this.configService, (plain as any).imageLocation),
      map_location: (plain as any).mapLocation ?? null,
      address: (plain as any).address ?? null,
      hotel_rating: (plain as any).hotelRating ?? null,
    };
  }

  async list(query: Record<string, string | undefined>) {
    const where: Record<string, unknown> = { status: EntityStatus.ACTIVE };

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      if (key === 'status') continue;
      if (key === 'page' || key === 'page_size') continue;

      if (key === '_id' || key === 'id') where.id = value;
      if (key === 'name') where.name = value;
      if (key === 'hotel_rating') where.hotelRating = value;
      if (key === 'temple_id') where.templeId = value;
      if (key === 'user_id') where.userId = value;
      if (key === 'village_id') where.villageId = value;
      if (key === 'event_id') where.eventId = value;
      if (key === 'tourism_places') where.tourismPlaces = value;
      if (key === 'restaurent') where.restaurent = value;
    }

    const records = await this.hotelModel.findAll({ where });
    if (!records.length) {
      return { message: 'Data not found', status: 404 };
    }

    return records.map((r) => this.serialize(r));
  }

  async getById(id: string) {
    const record = await this.hotelModel.findByPk(id);
    if (!record) return null;
    if (record.status !== EntityStatus.ACTIVE) return 'inactive' as const;
    return this.serialize(record);
  }

  async create(payload: Record<string, unknown>, user?: Record<string, unknown>) {
    try {
      const images = this.parseList(payload.image_location ?? payload.imageLocation);
      const licenses = this.parseList(payload.license_copy ?? payload.licenseCopy);

      const created = await this.hotelModel.create({
        name: typeof payload.name === 'string' ? payload.name : null,
        hotelRating: typeof payload.hotel_rating === 'string'
          ? payload.hotel_rating
          : typeof payload.hotelRating === 'string'
            ? payload.hotelRating
            : null,
        templeId: typeof payload.temple_id === 'string'
          ? payload.temple_id
          : typeof payload.templeId === 'string'
            ? payload.templeId
            : null,
        address: typeof payload.address === 'string' ? payload.address : null,
        mapLocation: typeof payload.map_location === 'string'
          ? payload.map_location
          : typeof payload.mapLocation === 'string'
            ? payload.mapLocation
            : null,
        status: typeof payload.status === 'string' ? payload.status : EntityStatus.INACTIVE,
        userId: typeof payload.user_id === 'string'
          ? payload.user_id
          : typeof payload.userId === 'string'
            ? payload.userId
            : undefined,
        villageId: typeof payload.village_id === 'string'
          ? payload.village_id
          : typeof payload.villageId === 'string'
            ? payload.villageId
            : undefined,
        ownerName: typeof payload.owner_name === 'string'
          ? payload.owner_name
          : typeof payload.ownerName === 'string'
            ? payload.ownerName
            : null,
        contactNumber: typeof payload.contact_number === 'string'
          ? payload.contact_number
          : typeof payload.contactNumber === 'string'
            ? payload.contactNumber
            : null,
        emailId: typeof payload.email_id === 'string'
          ? payload.email_id
          : typeof payload.emailId === 'string'
            ? payload.emailId
            : null,
        website: typeof payload.website === 'string' ? payload.website : null,
        eventId: typeof payload.event_id === 'string'
          ? payload.event_id
          : typeof payload.eventId === 'string'
            ? payload.eventId
            : null,
        tourismPlaces: typeof payload.tourism_places === 'string'
          ? payload.tourism_places
          : typeof payload.tourismPlaces === 'string'
            ? payload.tourismPlaces
            : null,
        restaurent: typeof payload.restaurent === 'string' ? payload.restaurent : undefined,
        imageLocation: 'null' as unknown as TempleNearbyHotel['imageLocation'],
        licenseCopy: 'null' as unknown as TempleNearbyHotel['licenseCopy'],
      } as CreationAttributes<TempleNearbyHotel>);

      const savedImages = await GramadevataUtils.saveEntityImagesToAzure({
        configService: this.configService,
        images,
        id: created.id,
        name: created.name ?? 'hotel',
        entityType: 'hotels',
      });

      const savedLicenses = await GramadevataUtils.saveEntityImagesToAzure({
        configService: this.configService,
        images: licenses,
        id: created.id,
        name: created.name ?? 'hotel_license',
        entityType: 'hotel_license',
      });

      if (savedImages.length) {
        created.imageLocation = JSON.stringify(savedImages);
      }
      if (savedLicenses.length) {
        created.licenseCopy = JSON.stringify(savedLicenses);
      }
      if (savedImages.length || savedLicenses.length) {
        await created.save();
      }

      const userId = typeof user?.id === 'string' ? user.id : typeof (user as any)?.user_id === 'string' ? (user as any).user_id : 'Anonymous';
      const recipients = [this.configService.get<string>('DEFAULT_FROM_EMAIL')].filter(Boolean) as string[];
      await GramadevataUtils.sendAdminEmail(this.configService, {
        subject: 'New Temple Nearby Hotel Added',
        text: `User ID: ${userId}\nCreated Time: ${new Date().toISOString()}\nHotel ID: ${created.id}\nHotel Name: ${created.name ?? ''}`,
        recipients,
      });

      return { status: 201, body: { message: 'success', result: this.serialize(created) } };
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

  async update(id: string, payload: Record<string, unknown>) {
    try {
      const instance = await this.hotelModel.findByPk(id);
      if (!instance || instance.status !== EntityStatus.ACTIVE) {
        return { status: 404, body: { message: 'Hotel not found', status: 404 } };
      }

      const newImages = this.parseList(payload.image_location ?? payload.imageLocation);
      const newLicenses = this.parseList(payload.license_copy ?? payload.licenseCopy);

      const patch: Partial<TempleNearbyHotel> = {};
      if (typeof payload.name === 'string') patch.name = payload.name;
      if (typeof payload.hotel_rating === 'string') patch.hotelRating = payload.hotel_rating;
      if (typeof payload.hotelRating === 'string') patch.hotelRating = payload.hotelRating;
      if (typeof payload.temple_id === 'string') patch.templeId = payload.temple_id;
      if (typeof payload.templeId === 'string') patch.templeId = payload.templeId;
      if (typeof payload.address === 'string') patch.address = payload.address;
      if (typeof payload.map_location === 'string') patch.mapLocation = payload.map_location;
      if (typeof payload.mapLocation === 'string') patch.mapLocation = payload.mapLocation;
      if (typeof payload.owner_name === 'string') patch.ownerName = payload.owner_name;
      if (typeof payload.ownerName === 'string') patch.ownerName = payload.ownerName;
      if (typeof payload.contact_number === 'string') patch.contactNumber = payload.contact_number;
      if (typeof payload.contactNumber === 'string') patch.contactNumber = payload.contactNumber;
      if (typeof payload.email_id === 'string') patch.emailId = payload.email_id;
      if (typeof payload.emailId === 'string') patch.emailId = payload.emailId;
      if (typeof payload.website === 'string') patch.website = payload.website;
      if (typeof payload.event_id === 'string') patch.eventId = payload.event_id;
      if (typeof payload.eventId === 'string') patch.eventId = payload.eventId;
      if (typeof payload.tourism_places === 'string') patch.tourismPlaces = payload.tourism_places;
      if (typeof payload.tourismPlaces === 'string') patch.tourismPlaces = payload.tourismPlaces;
      if (typeof payload.village_id === 'string') patch.villageId = payload.village_id;
      if (typeof payload.villageId === 'string') patch.villageId = payload.villageId;
      if (typeof payload.restaurent === 'string') patch.restaurent = payload.restaurent;
      if (typeof payload.status === 'string') patch.status = payload.status;

      await instance.update(patch);

      const existingImages = this.parseList(instance.imageLocation);
      const existingLicenses = this.parseList(instance.licenseCopy);

      const uploadedImages = await GramadevataUtils.saveEntityImagesToAzure({
        configService: this.configService,
        images: newImages,
        id: instance.id,
        name: instance.name ?? 'hotel',
        entityType: 'hotels',
      });

      const uploadedLicenses = await GramadevataUtils.saveEntityImagesToAzure({
        configService: this.configService,
        images: newLicenses,
        id: instance.id,
        name: instance.name ?? 'hotel_license',
        entityType: 'hotel_license',
      });

      const finalImages = [...existingImages, ...uploadedImages].filter(Boolean);
      const finalLicenses = [...existingLicenses, ...uploadedLicenses].filter(Boolean);

      if (finalImages.length) instance.imageLocation = JSON.stringify(finalImages);
      if (finalLicenses.length) instance.licenseCopy = JSON.stringify(finalLicenses);
      if (uploadedImages.length || uploadedLicenses.length) {
        await instance.save();
      }

      return { status: 200, body: { message: 'Hotel updated successfully', result: this.serialize(instance) } };
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

  async remove(id: string) {
    const instance = await this.hotelModel.findByPk(id);
    if (!instance) {
      return { status: 404, body: { message: 'Hotel not found', status: 404 } };
    }
    await instance.destroy();
    return { status: 200, body: { message: 'Hotel deleted successfully' } };
  }

  private async resolveVillageIds(inputValue: string): Promise<string[]> {
    if (await this.countryModel.findByPk(inputValue)) {
      const villages = await this.villageModel.findAll({
        attributes: ['id'],
        include: [
          {
            model: this.blockModel,
            required: true,
            attributes: [],
            include: [
              {
                model: this.districtModel,
                required: true,
                attributes: [],
                include: [
                  {
                    model: this.stateModel,
                    required: true,
                    attributes: [],
                    where: { countryId: inputValue },
                  },
                ],
              },
            ],
          },
        ],
      });
      return villages.map((v) => v.id);
    }

    if (await this.stateModel.findByPk(inputValue)) {
      const villages = await this.villageModel.findAll({
        attributes: ['id'],
        include: [
          {
            model: this.blockModel,
            required: true,
            attributes: [],
            include: [
              {
                model: this.districtModel,
                required: true,
                attributes: [],
                where: { stateId: inputValue },
              },
            ],
          },
        ],
      });
      return villages.map((v) => v.id);
    }

    if (await this.districtModel.findByPk(inputValue)) {
      const villages = await this.villageModel.findAll({
        attributes: ['id'],
        include: [
          {
            model: this.blockModel,
            required: true,
            attributes: [],
            where: { districtId: inputValue },
          },
        ],
      });
      return villages.map((v) => v.id);
    }

    if (await this.blockModel.findByPk(inputValue)) {
      const villages = await this.villageModel.findAll({
        attributes: ['id'],
        where: { blockId: inputValue },
      });
      return villages.map((v) => v.id);
    }

    if (await this.villageModel.findByPk(inputValue)) {
      return [inputValue];
    }

    return [];
  }

  async hotelsByLocation(inputValue: string, search?: string) {
    const villageIds = await this.resolveVillageIds(inputValue);
    const where: Record<string, unknown> = { status: EntityStatus.ACTIVE };

    if (villageIds.length) {
      where.villageId = { [Op.in]: villageIds };
    } else {
      where.villageId = inputValue;
    }

    const searchQuery = (search || '').trim();
    if (searchQuery) {
      (where as any)[Op.or] = [
        { name: { [Op.like]: `%${searchQuery}%` } },
        { address: { [Op.like]: `%${searchQuery}%` } },
        { hotelRating: { [Op.like]: `%${searchQuery}%` } },
      ];
    }

    let records = await this.hotelModel.findAll({ where });
    if (!records.length && villageIds.length) {
      // Django fallback: direct village lookup.
      const fallbackWhere: Record<string, unknown> = { status: EntityStatus.ACTIVE, villageId: inputValue };
      if (searchQuery) {
        (fallbackWhere as any)[Op.or] = [
          { name: { [Op.like]: `%${searchQuery}%` } },
          { address: { [Op.like]: `%${searchQuery}%` } },
          { hotelRating: { [Op.like]: `%${searchQuery}%` } },
        ];
      }
      records = await this.hotelModel.findAll({ where: fallbackWhere });
    }

    return { nearby_hotels: records.map((r) => this.serializeNearby(r)) };
  }
}
