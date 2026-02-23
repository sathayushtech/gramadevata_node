import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { CreationAttributes } from 'sequelize';
import { Accommodation } from './accommodation.model';

@Injectable()
export class AccommodationsService {
  constructor(
    @InjectModel(Accommodation)
    private readonly accommodationModel: typeof Accommodation,
    private readonly configService: ConfigService
  ) {}

  async list(query: Record<string, string | undefined>) {
    const where: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        where[key] = value;
      }
    }
    where.status = 'ACTIVE';

    const accommodations = await this.accommodationModel.findAll({ where });
    if (!accommodations.length) {
      return { message: 'Data not found', status: 404 };
    }

    return accommodations.map((item) => this.toAccommodationResponse(item));
  }

  async create(payload: Record<string, unknown>) {
    try {
      const imageLocations = this.normalizeImageLocations(payload.image_location);
      const createPayload = this.toCreatePayload(payload) as CreationAttributes<Accommodation>;

      const created = await this.accommodationModel.create({
        ...createPayload,
      });

      if (imageLocations.length) {
        const normalized = imageLocations.filter((item) => item && item !== 'null');
        if (normalized.length) {
          created.imageLocation = JSON.stringify(normalized);
          await created.save();
        }
      }

      return {
        message: 'success',
        result: this.toAccommodationResponse(created),
      };
    } catch (error) {
      throw new BadRequestException({
        message: 'An error occurred.',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getById(id: string) {
    const accommodation = await this.accommodationModel.findOne({
      where: { id, status: 'ACTIVE' },
    });
    if (!accommodation) {
      return null;
    }
    return this.toAccommodationResponse(accommodation);
  }

  async update(id: string, payload: Record<string, unknown>) {
    const accommodation = await this.accommodationModel.findByPk(id);
    if (!accommodation) {
      return null;
    }

    const updatePayload = this.toUpdatePayload(payload);
    if (Object.keys(updatePayload).length) {
      await accommodation.update(updatePayload);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'image_location')) {
      const imageLocations = this.normalizeImageLocations(payload.image_location);
      const normalized = imageLocations.filter((item) => item && item !== 'null');
      accommodation.imageLocation = normalized.length ? JSON.stringify(normalized) : 'null';
      await accommodation.save();
    }

    return this.toAccommodationResponse(accommodation);
  }

  async remove(id: string) {
    const accommodation = await this.accommodationModel.findByPk(id);
    if (!accommodation) {
      return false;
    }
    await accommodation.destroy();
    return true;
  }

  private toOptionalString(value: unknown) {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    return String(value);
  }

  private toCreatePayload(payload: Record<string, unknown>) {
    return {
      name: this.toOptionalString(payload.name),
      accommodationRating: this.toOptionalString(payload.accommodation_rating ?? payload.accommodationRating),
      templeId: this.toOptionalString(payload.temple_id ?? payload.templeId),
      address: this.toOptionalString(payload.address),
      mapLocation: this.toOptionalString(payload.map_location ?? payload.mapLocation),
      userId: this.toOptionalString(payload.user_id ?? payload.userId),
      villageId: this.toOptionalString(payload.village_id ?? payload.villageId),
      ownerName: this.toOptionalString(payload.owner_name ?? payload.ownerName),
      contactNumber: this.toOptionalString(payload.contact_number ?? payload.contactNumber),
      emailId: this.toOptionalString(payload.email_id ?? payload.emailId),
      website: this.toOptionalString(payload.website),
      eventId: this.toOptionalString(payload.event_id ?? payload.eventId),
      tourismPlaces: this.toOptionalString(payload.tourism_places ?? payload.tourismPlaces),
      status: this.toOptionalString(payload.status) ?? 'ACTIVE',
    };
  }

  private toUpdatePayload(payload: Record<string, unknown>) {
    const updatePayload: Partial<Accommodation> = {};

    if (payload.name !== undefined) {
      updatePayload.name = this.toOptionalString(payload.name);
    }
    if (payload.accommodation_rating !== undefined || payload.accommodationRating !== undefined) {
      updatePayload.accommodationRating = this.toOptionalString(
        payload.accommodation_rating ?? payload.accommodationRating
      );
    }
    if (payload.temple_id !== undefined || payload.templeId !== undefined) {
      updatePayload.templeId = this.toOptionalString(payload.temple_id ?? payload.templeId);
    }
    if (payload.address !== undefined) {
      updatePayload.address = this.toOptionalString(payload.address);
    }
    if (payload.map_location !== undefined || payload.mapLocation !== undefined) {
      updatePayload.mapLocation = this.toOptionalString(payload.map_location ?? payload.mapLocation);
    }
    if (payload.user_id !== undefined || payload.userId !== undefined) {
      updatePayload.userId = this.toOptionalString(payload.user_id ?? payload.userId);
    }
    if (payload.village_id !== undefined || payload.villageId !== undefined) {
      updatePayload.villageId = this.toOptionalString(payload.village_id ?? payload.villageId);
    }
    if (payload.owner_name !== undefined || payload.ownerName !== undefined) {
      updatePayload.ownerName = this.toOptionalString(payload.owner_name ?? payload.ownerName);
    }
    if (payload.contact_number !== undefined || payload.contactNumber !== undefined) {
      updatePayload.contactNumber = this.toOptionalString(payload.contact_number ?? payload.contactNumber);
    }
    if (payload.email_id !== undefined || payload.emailId !== undefined) {
      updatePayload.emailId = this.toOptionalString(payload.email_id ?? payload.emailId);
    }
    if (payload.website !== undefined) {
      updatePayload.website = this.toOptionalString(payload.website);
    }
    if (payload.event_id !== undefined || payload.eventId !== undefined) {
      updatePayload.eventId = this.toOptionalString(payload.event_id ?? payload.eventId);
    }
    if (payload.tourism_places !== undefined || payload.tourismPlaces !== undefined) {
      updatePayload.tourismPlaces = this.toOptionalString(payload.tourism_places ?? payload.tourismPlaces);
    }
    if (payload.status !== undefined) {
      updatePayload.status = this.toOptionalString(payload.status);
    }

    return updatePayload;
  }

  private toAccommodationResponse(accommodation: Accommodation) {
    const plain = accommodation.get({ plain: true }) as Accommodation;
    const rawBaseUrl = this.configService.get<string>('File_path') || '';
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

    return {
      _id: plain.id,
      name: plain.name ?? null,
      accommodation_rating: plain.accommodationRating ?? null,
      temple_id: plain.templeId ?? null,
      address: plain.address ?? null,
      map_location: plain.mapLocation ?? null,
      user_id: plain.userId ?? null,
      village_id: plain.villageId ?? null,
      image_location: this.mapFileList(plain.imageLocation, baseUrl),
      owner_name: plain.ownerName ?? null,
      contact_number: plain.contactNumber ?? null,
      tourism_places: plain.tourismPlaces ?? null,
      event_id: plain.eventId ?? null,
    };
  }

  private normalizeImageLocations(raw: unknown): string[] {
    if (!raw) {
      return [];
    }
    if (Array.isArray(raw)) {
      return raw.map((item) => String(item).trim()).filter(Boolean);
    }
    return [String(raw).trim()].filter(Boolean);
  }

  private parseList(raw: unknown): string[] {
    if (!raw || raw === 'null') {
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
        .replace(/\[|\]/g, '')
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
}
