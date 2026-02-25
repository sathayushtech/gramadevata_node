import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import type { CreationAttributes } from 'sequelize';
import nodemailer from 'nodemailer';
import { AddGoshalaDetails } from './add-ghoshala.model';
import { Register as User } from '../auth/user.model';

type CreateResult = {
  status: number;
  body: Record<string, unknown>;
};

@Injectable()
export class AddGoshalaDetailsService {
  constructor(
    @InjectModel(AddGoshalaDetails)
    private readonly addGoshalaDetailsModel: typeof AddGoshalaDetails,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly configService: ConfigService
  ) {}

  async list(): Promise<Record<string, unknown>[]> {
    const records = await this.addGoshalaDetailsModel.findAll({
      order: [['createdAt', 'DESC']],
    });

    return records.map((record) => this.toResponse(record));
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const record = await this.addGoshalaDetailsModel.findByPk(id);
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
      const videoList = this.parseList(payload.goshala_video ?? payload.goshalaVideo);

      const data = this.buildCreatePayload(payload, user.id);
      data.imageLocation = [];
      data.goshalaVideo = [];

      const created = await this.addGoshalaDetailsModel.create(data);

      const images = imageList.filter((img) => img && img !== 'null');
      const videos = videoList.filter((vid) => vid && vid !== 'null');

      if (images.length) {
        created.imageLocation = images;
      }
      if (videos.length) {
        created.goshalaVideo = videos;
      }

      if (images.length || videos.length) {
        await created.save();
      }

      await this.sendNotification(created.goshalaId ?? '');

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
    const record = await this.addGoshalaDetailsModel.findByPk(id);
    if (!record) {
      return null;
    }

    const updateData = this.buildUpdatePayload(payload);
    if (Object.keys(updateData).length) {
      await record.update(updateData as CreationAttributes<AddGoshalaDetails>);
    }

    const imageList = this.parseList(payload.image_location ?? payload.imageLocation);
    const videoList = this.parseList(payload.goshala_video ?? payload.goshalaVideo);

    const newImages = imageList.filter((img) => img && img !== 'null');
    const newVideos = videoList.filter((vid) => vid && vid !== 'null');

    if (newImages.length) {
      const existingImages = this.parseList(record.imageLocation);
      record.imageLocation = existingImages.concat(newImages);
    }

    if (newVideos.length) {
      const existingVideos = this.parseList(record.goshalaVideo);
      record.goshalaVideo = existingVideos.concat(newVideos);
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
    const record = await this.addGoshalaDetailsModel.findByPk(id);
    if (!record) {
      return false;
    }

    await record.destroy();
    return true;
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

    const goshalaId = typeof payload.goshala_id === 'string'
      ? payload.goshala_id
      : typeof payload.goshalaId === 'string'
        ? payload.goshalaId
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

    const data: CreationAttributes<AddGoshalaDetails> = {
      id,
      goshalaId: goshalaId ?? null,
      userId: userId ?? null,
      desc: typeof payload.desc === 'string' ? payload.desc : null,
      mapLocation: typeof payload.map_location === 'string'
        ? payload.map_location
        : typeof payload.mapLocation === 'string'
          ? payload.mapLocation
          : null,
      imageLocation: payload.image_location ?? payload.imageLocation ?? [],
      goshalaVideo: payload.goshala_video ?? payload.goshalaVideo ?? [],
      status: typeof payload.status === 'string' ? payload.status : null,
      createdAt,
    } as CreationAttributes<AddGoshalaDetails>;

    return data;
  }

  private buildUpdatePayload(payload: Record<string, unknown>) {
    const updateData: Partial<AddGoshalaDetails> = {};

    if (typeof payload.desc === 'string') {
      updateData.desc = payload.desc;
    }

    if (typeof payload.map_location === 'string') {
      updateData.mapLocation = payload.map_location;
    } else if (typeof payload.mapLocation === 'string') {
      updateData.mapLocation = payload.mapLocation;
    }

    if (typeof payload.goshala_id === 'string') {
      updateData.goshalaId = payload.goshala_id;
    } else if (typeof payload.goshalaId === 'string') {
      updateData.goshalaId = payload.goshalaId;
    }

    if (typeof payload.user_id === 'string') {
      updateData.userId = payload.user_id;
    } else if (typeof payload.userId === 'string') {
      updateData.userId = payload.userId;
    }

    if (typeof payload.status === 'string') {
      updateData.status = payload.status;
    }

    return updateData;
  }

  private toResponse(record: AddGoshalaDetails): Record<string, unknown> {
    const plain = record.get({ plain: true }) as AddGoshalaDetails & {
      goshalaId?: string;
      userId?: string;
      imageLocation?: unknown;
      goshalaVideo?: unknown;
      createdAt?: Date;
    };

    return {
      _id: plain.id,
      image_location: this.mapFileList(plain.imageLocation),
      desc: plain.desc ?? null,
      map_location: plain.mapLocation ?? null,
      goshala_id: plain.goshalaId ?? null,
      user_id: plain.userId ?? null,
      created_at: this.formatCreatedAt(plain.createdAt),
      goshala_video: this.mapFileList(plain.goshalaVideo),
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
        .replace(/[\[\]]/g, '')
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

  private async sendNotification(goshalaId: string) {
    const transport = this.getMailTransport();
    const from = this.configService.get<string>('SMTP_FROM')
      || this.configService.get<string>('SMTP_USER')
      || '';
    const to = from;

    const subject = 'Added goshala Details';
    const body = `Goshala ID: ${goshalaId}`;

    if (!transport || !to) {
      console.log(`Email: ${subject}\n${body}`);
      return;
    }

    await transport.sendMail({
      from,
      to,
      subject,
      text: body,
    });
  }

  private getMailTransport() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') || 465);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
}
