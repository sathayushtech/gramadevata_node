import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import type { CreationAttributes } from 'sequelize';
import { AmbulanceFacility } from './ambulance-facility.model';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';

type CreateResult = {
  status: number;
  body: Record<string, unknown>;
};

@Injectable()
export class AmbulanceFacilityService {
  constructor(
    @InjectModel(AmbulanceFacility)
    private readonly ambulanceModel: typeof AmbulanceFacility,
    private readonly configService: ConfigService,
  ) {}

  async list(query: Record<string, string | undefined>) {
    const filters = this.buildFilters(query);
    filters.status = 'ACTIVE';

    const records = await this.ambulanceModel.findAll({
      where: filters,
      order: [['createdAt', 'DESC']],
    });

    if (!records.length) {
      return { message: 'Data not found', status: 404 };
    }

    return records.map((record) => this.toResponse(record));
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const record = await this.ambulanceModel.findOne({
      where: { id, status: 'ACTIVE' },
    });

    if (!record) {
      return null;
    }

    return this.toResponse(record);
  }

  async create(payload: Record<string, unknown>, userPayload?: Record<string, unknown>): Promise<CreateResult> {
    try {
      const imageLocations = this.parseList(payload.image_location ?? payload.imageLocation);
      const data = this.mapPayload(payload);
      data.imageLocation = [];

      const created = await this.ambulanceModel.create(data);

      if (imageLocations.length) {
        const saved = await GramadevataUtils.saveEntityImagesToAzure({
          configService: this.configService,
          images: imageLocations,
          id: created.id,
          name: created.name ?? 'ambulance',
          entityType: 'ambulance',
        });

        if (saved.length) {
          created.imageLocation = saved;
          await created.save();
        }
      }

      const userId = this.resolveUserId(userPayload);
      await this.sendNotification(userId, created);

      return {
        status: 201,
        body: { message: 'success', result: this.toResponse(created) },
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

  async update(id: string, payload: Record<string, unknown>) {
    const record = await this.ambulanceModel.findByPk(id);
    if (!record) {
      return null;
    }

    const updateData = this.mapUpdatePayload(payload);
    if (Object.keys(updateData).length) {
      await record.update(updateData as CreationAttributes<AmbulanceFacility>);
    }

    return this.toResponse(record);
  }

  async remove(id: string) {
    const record = await this.ambulanceModel.findByPk(id);
    if (!record) {
      return false;
    }

    await record.destroy();
    return true;
  }

  private buildFilters(query: Record<string, string | undefined>) {
    const filters: Record<string, string> = {};

    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }

      switch (key) {
        case '_id':
        case 'id':
          filters.id = value;
          break;
        case 'temple_id':
          filters.templeId = value;
          break;
        case 'village_id':
          filters.villageId = value;
          break;
        case 'user_id':
          filters.userId = value;
          break;
        case 'contact_number':
          filters.contactNumber = value;
          break;
        case 'map_location':
          filters.mapLocation = value;
          break;
        case 'name':
          filters.name = value;
          break;
        case 'address':
          filters.address = value;
          break;
        case 'status':
          filters.status = value;
          break;
        default:
          break;
      }
    });

    return filters;
  }

  private mapPayload(payload: Record<string, unknown>) {
    const id = typeof payload._id === 'string'
      ? payload._id
      : typeof payload.id === 'string'
        ? payload.id
        : undefined;

    const createdAt = this.parseDate(payload.created_at ?? payload.createdAt);

    const data: CreationAttributes<AmbulanceFacility> = {
      id,
      name: typeof payload.name === 'string' ? payload.name : null,
      address: typeof payload.address === 'string' ? payload.address : null,
      contactNumber: typeof payload.contact_number === 'string'
        ? payload.contact_number
        : typeof payload.contactNumber === 'string'
          ? payload.contactNumber
          : null,
      mapLocation: typeof payload.map_location === 'string'
        ? payload.map_location
        : typeof payload.mapLocation === 'string'
          ? payload.mapLocation
          : null,
      templeId: typeof payload.temple_id === 'string'
        ? payload.temple_id
        : typeof payload.templeId === 'string'
          ? payload.templeId
          : null,
      villageId: typeof payload.village_id === 'string'
        ? payload.village_id
        : typeof payload.villageId === 'string'
          ? payload.villageId
          : null,
      userId: typeof payload.user_id === 'string'
        ? payload.user_id
        : typeof payload.userId === 'string'
          ? payload.userId
          : null,
      imageLocation: payload.image_location ?? payload.imageLocation ?? [],
      createdAt,
      status: typeof payload.status === 'string' ? payload.status : null,
    } as CreationAttributes<AmbulanceFacility>;

    return data;
  }

  private mapUpdatePayload(payload: Record<string, unknown>) {
    const updateData: Partial<AmbulanceFacility> = {};

    if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
      if (typeof payload.name === 'string') {
        updateData.name = payload.name;
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'address')) {
      if (typeof payload.address === 'string') {
        updateData.address = payload.address;
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'contact_number')) {
      if (typeof payload.contact_number === 'string') {
        updateData.contactNumber = payload.contact_number;
      }
    } else if (Object.prototype.hasOwnProperty.call(payload, 'contactNumber')) {
      if (typeof payload.contactNumber === 'string') {
        updateData.contactNumber = payload.contactNumber;
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'map_location')) {
      if (typeof payload.map_location === 'string') {
        updateData.mapLocation = payload.map_location;
      }
    } else if (Object.prototype.hasOwnProperty.call(payload, 'mapLocation')) {
      if (typeof payload.mapLocation === 'string') {
        updateData.mapLocation = payload.mapLocation;
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'temple_id')) {
      if (typeof payload.temple_id === 'string') {
        updateData.templeId = payload.temple_id;
      }
    } else if (Object.prototype.hasOwnProperty.call(payload, 'templeId')) {
      if (typeof payload.templeId === 'string') {
        updateData.templeId = payload.templeId;
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'village_id')) {
      if (typeof payload.village_id === 'string') {
        updateData.villageId = payload.village_id;
      }
    } else if (Object.prototype.hasOwnProperty.call(payload, 'villageId')) {
      if (typeof payload.villageId === 'string') {
        updateData.villageId = payload.villageId;
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'user_id')) {
      if (typeof payload.user_id === 'string') {
        updateData.userId = payload.user_id;
      }
    } else if (Object.prototype.hasOwnProperty.call(payload, 'userId')) {
      if (typeof payload.userId === 'string') {
        updateData.userId = payload.userId;
      }
    }

    if (payload.image_location !== undefined || payload.imageLocation !== undefined) {
      updateData.imageLocation = this.parseList(payload.image_location ?? payload.imageLocation);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'created_at')) {
      updateData.createdAt = this.parseDate(payload.created_at);
    } else if (Object.prototype.hasOwnProperty.call(payload, 'createdAt')) {
      updateData.createdAt = this.parseDate(payload.createdAt);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
      if (typeof payload.status === 'string') {
        updateData.status = payload.status;
      }
    }

    return updateData;
  }

  private toResponse(record: AmbulanceFacility): Record<string, unknown> {
    const plain = record.get({ plain: true }) as AmbulanceFacility & {
      imageLocation?: unknown;
      createdAt?: Date;
    };

    return {
      _id: plain.id,
      name: plain.name ?? null,
      address: plain.address ?? null,
      contact_number: plain.contactNumber ?? null,
      map_location: plain.mapLocation ?? null,
      temple_id: plain.templeId ?? null,
      village_id: plain.villageId ?? null,
      user_id: plain.userId ?? null,
      image_location: this.mapFileList(plain.imageLocation),
      created_at: plain.createdAt ?? null,
      status: plain.status ?? null,
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
        .replace(/\[|\]/g, '')
        .split(',')
        .map((item) => item.replace(/['"]+/g, '').trim())
        .filter(Boolean);
    }

    return [];
  }

  private mapFileList(raw: unknown) {
    const list = this.parseList(raw);
    const baseUrl = this.configService.get<string>('File_path')
      || this.configService.get<string>('FILE_URL')
      || '';
    if (!baseUrl) {
      return list;
    }

    return list.map((path) => `${baseUrl}${path.trim()}`);
  }

  private parseDate(raw: unknown) {
    if (raw instanceof Date) {
      return raw;
    }

    if (typeof raw === 'string') {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return new Date();
  }

  private resolveUserId(userPayload?: Record<string, unknown>) {
    if (!userPayload) {
      return 'Anonymous';
    }

    if (typeof userPayload.id === 'string') {
      return userPayload.id;
    }

    if (typeof userPayload.user_id === 'string') {
      return userPayload.user_id;
    }

    return 'Anonymous';
  }

  private async sendNotification(userId: string, created: AmbulanceFacility) {
    const recipient = this.configService.get<string>('EMAIL_HOST_USER');
    const createdAt = created.createdAt instanceof Date ? created.createdAt : new Date();
    const createdTime = GramadevataUtils.formatDjangoDateTime(createdAt);

    const subject = 'New AmbulanceFacility Added';
    const text = `User ID: ${userId}\nCreated Time: ${createdTime}\nambulance ID: ${created.id}\nambulance Name: ${created.name ?? ''}`;

    await GramadevataUtils.sendAdminEmail(this.configService, {
      subject,
      text,
      recipients: recipient ? [recipient] : [],
    });
  }
}
