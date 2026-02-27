import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import type { CreationAttributes } from 'sequelize';
import { AddEventDetails } from './add-event-details.model';
import { Register as User } from '../auth/user.model';
import { Event } from './event.model';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';

type CreateResult = {
  status: number;
  body: Record<string, unknown>;
};

@Injectable()
export class AddEventDetailsService {
  constructor(
    @InjectModel(AddEventDetails)
    private readonly addEventDetailsModel: typeof AddEventDetails,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Event)
    private readonly eventModel: typeof Event,
    private readonly configService: ConfigService
  ) {}

  async list(): Promise<Record<string, unknown>[]> {
    const records = await this.addEventDetailsModel.findAll({
      order: [['createdAt', 'DESC']],
    });

    return records.map((record) => this.toResponse(record));
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const record = await this.addEventDetailsModel.findByPk(id);
    if (!record) {
      return null;
    }

    return this.toResponse(record);
  }

  async create(payload: Record<string, unknown>, userPayload?: Record<string, unknown>): Promise<CreateResult> {
    try {
      const user = await this.findUser(userPayload);
      if (!user || (user.isMember ?? '').toString().toLowerCase() === 'false') {
        return { status: 403, body: { message: 'Membership required' } };
      }

      const imageList = this.parseList(payload.image_location ?? payload.imageLocation);
      const videoList = this.parseList(payload.event_video ?? payload.eventVideo);

      const data = this.buildCreatePayload(payload, user.id);
      data.imageLocation = [];
      data.eventVideo = [];

      const created = await this.addEventDetailsModel.create(data);

      const images = imageList.filter((img) => img && img !== 'null');
      const videos = videoList.filter((vid) => vid && vid !== 'null');

      if (images.length) {
        created.imageLocation = images;
      }
      if (videos.length) {
        created.eventVideo = videos;
      }

      if (images.length || videos.length) {
        await created.save();
      }

      await this.sendNotification(created.eventId ?? '');

      return {
        status: 201,
        body: { message: 'success', result: this.toResponse(created) },
      };
    } catch (error) {
      return {
        status: 500,
        body: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  async update(id: string, payload: Record<string, unknown>) {
    const record = await this.addEventDetailsModel.findByPk(id);
    if (!record) {
      return null;
    }

    const updateData = this.buildUpdatePayload(payload);
    if (Object.keys(updateData).length) {
      await record.update(updateData as CreationAttributes<AddEventDetails>);
    }

    const imageList = this.parseList(payload.image_location ?? payload.imageLocation);
    const videoList = this.parseList(payload.event_video ?? payload.eventVideo);

    const newImages = imageList.filter((img) => img && img !== 'null');
    const newVideos = videoList.filter((vid) => vid && vid !== 'null');

    if (newImages.length) {
      const existingImages = this.parseList(record.imageLocation);
      record.imageLocation = existingImages.concat(newImages);
    }

    if (newVideos.length) {
      const existingVideos = this.parseList(record.eventVideo);
      record.eventVideo = existingVideos.concat(newVideos);
    }

    if (newImages.length || newVideos.length) {
      await record.save();
    }

    return {
      message: 'updated successfully',
      data: this.toResponse(record),
    };
  }

  async remove(id: string): Promise<boolean> {
    const record = await this.addEventDetailsModel.findByPk(id);
    if (!record) {
      return false;
    }

    await record.destroy();
    return true;
  }

  async mergeEventDetails(eventId: string, payload: Record<string, unknown>) {
    try {
      const event = await this.eventModel.findByPk(eventId);
      if (!event) {
        return { status: 404, body: { message: 'Event not found' } };
      }

      const newDesc = typeof payload.desc === 'string' ? payload.desc.trim() : '';
      const newImages = this.parseList(payload.image_location).filter((img) => img && img !== 'null');
      const newVideos = this.parseList(payload.event_video).filter((vid) => vid && vid !== 'null');
      const newMapLocation = this.cleanMapLocation(payload.map_location);

      const oldDesc = typeof event.desc === 'string' ? event.desc : '';
      const oldImages = this.parseList(event.imageLocation).filter(Boolean);
      const oldVideos = this.parseList(event.eventVideo).filter(Boolean);
      const oldMapLocation = this.cleanMapLocation(event.mapLocation);

      const details = await this.addEventDetailsModel.findAll({ where: { eventId: event.id } });

      const detailDescs: string[] = [];
      let detailImages: string[] = [];
      let detailVideos: string[] = [];
      let detailMapLocations: string[] = [];

      details.forEach((record) => {
        if (record.desc) {
          detailDescs.push(record.desc.trim());
        }
        detailImages = detailImages.concat(this.parseList(record.imageLocation));
        detailVideos = detailVideos.concat(this.parseList(record.eventVideo));
        detailMapLocations = detailMapLocations.concat(this.cleanMapLocation(record.mapLocation));
      });

      const mergedDesc = this.uniqueList([oldDesc, ...detailDescs, newDesc].filter(Boolean)).join(', ');
      const mergedImages = this.uniqueList([...oldImages, ...detailImages, ...newImages]);
      const mergedVideos = this.uniqueList([...oldVideos, ...detailVideos, ...newVideos]);
      const mergedMapLocation = this.cleanMapLocation([
        ...oldMapLocation,
        ...detailMapLocations,
        ...newMapLocation,
      ]);

      event.desc = mergedDesc || undefined;
      event.imageLocation = mergedImages;
      event.eventVideo = mergedVideos;
      event.mapLocation = mergedMapLocation.length ? JSON.stringify(mergedMapLocation) : undefined;
      event.status = 'ACTIVE';
      await event.save();

      await this.addEventDetailsModel.destroy({ where: { eventId: event.id } });

      await this.addEventDetailsModel.create({
        eventId: event.id,
        desc: mergedDesc || undefined,
        imageLocation: mergedImages,
        eventVideo: mergedVideos,
        mapLocation: mergedMapLocation.length ? JSON.stringify(mergedMapLocation) : undefined,
        status: 'ACTIVE',
      } as CreationAttributes<AddEventDetails>);

      const baseUrl = this.getBaseUrl();

      return {
        status: 200,
        body: {
          event_id: event.id,
          name: event.name ?? null,
          desc: mergedDesc,
          image_location: mergedImages.map((img) => `${baseUrl}${img}`),
          event_video: mergedVideos.map((vid) => `${baseUrl}${vid}`),
          map_location: mergedMapLocation,
          status: 'ACTIVE',
        },
      };
    } catch (error) {
      return {
        status: 500,
        body: { message: 'Error occurred', error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  private async findUser(userPayload?: Record<string, unknown>) {
    if (!userPayload) {
      return null;
    }

    const email = typeof userPayload.email === 'string' ? userPayload.email : undefined;
    const contactNumber = typeof userPayload.contact_number === 'string'
      ? userPayload.contact_number
      : typeof userPayload.contactNumber === 'string'
        ? userPayload.contactNumber
        : undefined;
    const userId = typeof userPayload.user_id === 'string'
      ? userPayload.user_id
      : typeof userPayload.id === 'string'
        ? userPayload.id
        : undefined;

    if (email || contactNumber) {
      const orConditions = [] as Record<string, string>[];
      if (email) {
        orConditions.push({ email });
      }
      if (contactNumber) {
        orConditions.push({ contactNumber });
      }

      const user = await this.userModel.findOne({
        where: {
          [Op.or]: orConditions,
        },
      });

      if (user) {
        return user;
      }
    }

    if (userId) {
      return this.userModel.findByPk(userId);
    }

    return null;
  }

  private buildCreatePayload(payload: Record<string, unknown>, fallbackUserId: string) {
    const id = typeof payload._id === 'string'
      ? payload._id
      : typeof payload.id === 'string'
        ? payload.id
        : undefined;

    const eventId = typeof payload.event_id === 'string'
      ? payload.event_id
      : typeof payload.eventId === 'string'
        ? payload.eventId
        : undefined;

    const userId = typeof payload.user_id === 'string'
      ? payload.user_id
      : typeof payload.userId === 'string'
        ? payload.userId
        : fallbackUserId;

    const createdAt = payload.created_at instanceof Date
      ? payload.created_at
      : typeof payload.created_at === 'string'
        ? new Date(payload.created_at)
        : new Date();

    const data: CreationAttributes<AddEventDetails> = {
      id,
      eventId: eventId ?? null,
      userId: userId ?? null,
      desc: typeof payload.desc === 'string' ? payload.desc : null,
      mapLocation: typeof payload.map_location === 'string'
        ? payload.map_location
        : typeof payload.mapLocation === 'string'
          ? payload.mapLocation
          : null,
      startTime: typeof payload.start_time === 'string'
        ? payload.start_time
        : typeof payload.startTime === 'string'
          ? payload.startTime
          : null,
      endTime: typeof payload.end_time === 'string'
        ? payload.end_time
        : typeof payload.endTime === 'string'
          ? payload.endTime
          : null,
      imageLocation: payload.image_location ?? payload.imageLocation ?? [],
      eventVideo: payload.event_video ?? payload.eventVideo ?? [],
      status: typeof payload.status === 'string' ? payload.status : null,
      createdAt,
    } as CreationAttributes<AddEventDetails>;

    return data;
  }

  private buildUpdatePayload(payload: Record<string, unknown>) {
    const updateData: Partial<AddEventDetails> = {};

    if (typeof payload.desc === 'string') {
      updateData.desc = payload.desc;
    }

    if (typeof payload.map_location === 'string') {
      updateData.mapLocation = payload.map_location;
    } else if (typeof payload.mapLocation === 'string') {
      updateData.mapLocation = payload.mapLocation;
    }

    if (typeof payload.event_id === 'string') {
      updateData.eventId = payload.event_id;
    } else if (typeof payload.eventId === 'string') {
      updateData.eventId = payload.eventId;
    }

    if (typeof payload.user_id === 'string') {
      updateData.userId = payload.user_id;
    } else if (typeof payload.userId === 'string') {
      updateData.userId = payload.userId;
    }

    if (typeof payload.start_time === 'string') {
      updateData.startTime = payload.start_time;
    } else if (typeof payload.startTime === 'string') {
      updateData.startTime = payload.startTime;
    }

    if (typeof payload.end_time === 'string') {
      updateData.endTime = payload.end_time;
    } else if (typeof payload.endTime === 'string') {
      updateData.endTime = payload.endTime;
    }

    if (typeof payload.status === 'string') {
      updateData.status = payload.status;
    }

    return updateData;
  }

  private toResponse(record: AddEventDetails): Record<string, unknown> {
    const plain = record.get({ plain: true }) as AddEventDetails & {
      eventId?: string;
      userId?: string;
      imageLocation?: unknown;
      eventVideo?: unknown;
      createdAt?: Date;
      startTime?: string;
      endTime?: string;
    };

    return {
      _id: plain.id,
      image_location: this.mapFileList(plain.imageLocation),
      desc: plain.desc ?? null,
      map_location: plain.mapLocation ?? null,
      created_at: this.formatCreatedAt(plain.createdAt),
      start_time: plain.startTime ?? null,
      end_time: plain.endTime ?? null,
      event_video: this.mapFileList(plain.eventVideo),
      status: plain.status ?? null,
      event_id: plain.eventId ?? null,
      user_id: plain.userId ?? null,
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

  private cleanMapLocation(raw: unknown): string[] {
    const results: string[] = [];

    const visit = (value: unknown) => {
      if (!value) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }

      if (typeof value === 'string') {
        let trimmed = value.trim();
        if (!trimmed) {
          return;
        }

        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed);
            visit(parsed);
            return;
          } catch {
            // fall through
          }
        }

        trimmed = trimmed.replace(/\\/g, '').replace(/['"]+/g, '');
        const match = trimmed.match(/https:\/\/maps\.app\.goo\.gl\/\S+/);
        if (match) {
          results.push(match[0]);
        }
      }
    };

    visit(raw);
    return this.uniqueList(results);
  }

  private uniqueList(values: string[]) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  private getBaseUrl() {
    const raw = this.configService.get<string>('FILE_URL')
      || this.configService.get<string>('File_path')
      || '';
    if (!raw) {
      return '';
    }
    return raw.endsWith('/') ? raw : `${raw}/`;
  }

  private mapFileList(raw: unknown) {
    const list = this.parseList(raw);
    const baseUrl = this.configService.get<string>('File_path');
    if (!baseUrl) {
      return list;
    }

    return list.map((path) => `${baseUrl}${path.trim()}`);
  }

  private formatCreatedAt(value?: Date) {
    if (!value) {
      return null;
    }

    const tz = (this.configService.get<string>('TIME_ZONE') || 'Asia/Kolkata').trim();
    const offsetMinutes = tz === 'Asia/Kolkata' ? 330 : 0;
    const shifted = new Date(value.getTime() + offsetMinutes * 60 * 1000);

    const year = shifted.getUTCFullYear();
    const month = this.padTwo(shifted.getUTCMonth() + 1);
    const day = this.padTwo(shifted.getUTCDate());
    const hours = this.padTwo(shifted.getUTCHours());
    const minutes = this.padTwo(shifted.getUTCMinutes());
    const seconds = this.padTwo(shifted.getUTCSeconds());
    const offsetSign = offsetMinutes >= 0 ? '+' : '-';
    const offsetAbs = Math.abs(offsetMinutes);
    const offsetHours = this.padTwo(Math.floor(offsetAbs / 60));
    const offsetMins = this.padTwo(offsetAbs % 60);

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMins}`;
  }

  private padTwo(value: number) {
    return value.toString().padStart(2, '0');
  }

  private async sendNotification(eventId: string) {
    const recipient = this.configService.get<string>('EMAIL_HOST_USER');
    const subject = 'Added Event Details';
    const body = `Event ID: ${eventId}`;

    await GramadevataUtils.sendAdminEmail(this.configService, {
      subject,
      text: body,
      recipients: recipient ? [recipient] : [],
    });
  }
}
