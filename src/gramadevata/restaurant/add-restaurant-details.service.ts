import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import type { CreationAttributes } from 'sequelize';
import nodemailer from 'nodemailer';
import { AddRestaurantDetails } from './add-restaurant-details.model';
import { Register as User } from '../auth/user.model';

type CreateResult = {
  status: number;
  body: Record<string, unknown>;
};

@Injectable()
export class AddRestaurantDetailsService {
  constructor(
    @InjectModel(AddRestaurantDetails)
    private readonly addRestaurantModel: typeof AddRestaurantDetails,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly configService: ConfigService
  ) {}

  async list(): Promise<Record<string, unknown>[]> {
    const records = await this.addRestaurantModel.findAll({
      order: [['createdAt', 'DESC']],
    });

    return records.map((record) => this.toResponse(record));
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const record = await this.addRestaurantModel.findByPk(id);
    if (!record) {
      return null;
    }

    return this.toResponse(record);
  }

  async create(payload: Record<string, unknown>, userPayload?: Record<string, unknown>): Promise<CreateResult> {
    try {
      const user = await this.findUser(userPayload);
      if (!user) {
        return { status: 404, body: { message: 'User not found.' } };
      }
      if ((user.isMember ?? '').toString().toLowerCase() === 'false') {
        return {
          status: 200,
          body: { message: 'Cannot add more details. Membership details are required.' },
        };
      }

      const imageList = this.parseList(payload.image_location ?? payload.imageLocation);

      const data = this.buildCreatePayload(payload, user.id);
      data.imageLocation = [];

      const created = await this.addRestaurantModel.create(data);

      const images = imageList.filter((img) => img && img !== 'null');
      if (images.length) {
        created.imageLocation = images;
        await created.save();
      }

      await this.sendNotification(user.id, created.id, created.name ?? '');

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
    const record = await this.addRestaurantModel.findByPk(id);
    if (!record) {
      return null;
    }

    const updateData = this.buildUpdatePayload(payload);
    if (Object.keys(updateData).length) {
      await record.update(updateData as CreationAttributes<AddRestaurantDetails>);
    }

    const imageList = this.parseList(payload.image_location ?? payload.imageLocation);
    const images = imageList.filter((img) => img && img !== 'null');
    if (images.length) {
      record.imageLocation = images;
      await record.save();
    }

    return {
      message: 'updated successfully',
      data: this.toResponse(record),
    };
  }

  async remove(id: string): Promise<boolean> {
    const record = await this.addRestaurantModel.findByPk(id);
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

    const restaurentId = typeof payload.restaurent_id === 'string'
      ? payload.restaurent_id
      : typeof payload.restaurentId === 'string'
        ? payload.restaurentId
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

    const data: CreationAttributes<AddRestaurantDetails> = {
      id,
      restaurentId: restaurentId ?? null,
      userId: userId ?? null,
      name: typeof payload.name === 'string' ? payload.name : null,
      address: typeof payload.address === 'string' ? payload.address : null,
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
      mapLocation: typeof payload.map_location === 'string'
        ? payload.map_location
        : typeof payload.mapLocation === 'string'
          ? payload.mapLocation
          : null,
      imageLocation: payload.image_location ?? payload.imageLocation ?? [],
      status: typeof payload.status === 'string' ? payload.status : null,
      createdAt,
    } as CreationAttributes<AddRestaurantDetails>;

    return data;
  }

  private buildUpdatePayload(payload: Record<string, unknown>) {
    const updateData: Partial<AddRestaurantDetails> = {};

    if (typeof payload.name === 'string') {
      updateData.name = payload.name;
    }

    if (typeof payload.address === 'string') {
      updateData.address = payload.address;
    }

    if (typeof payload.owner_name === 'string') {
      updateData.ownerName = payload.owner_name;
    } else if (typeof payload.ownerName === 'string') {
      updateData.ownerName = payload.ownerName;
    }

    if (typeof payload.contact_number === 'string') {
      updateData.contactNumber = payload.contact_number;
    } else if (typeof payload.contactNumber === 'string') {
      updateData.contactNumber = payload.contactNumber;
    }

    if (typeof payload.email_id === 'string') {
      updateData.emailId = payload.email_id;
    } else if (typeof payload.emailId === 'string') {
      updateData.emailId = payload.emailId;
    }

    if (typeof payload.website === 'string') {
      updateData.website = payload.website;
    }

    if (typeof payload.map_location === 'string') {
      updateData.mapLocation = payload.map_location;
    } else if (typeof payload.mapLocation === 'string') {
      updateData.mapLocation = payload.mapLocation;
    }

    if (typeof payload.restaurent_id === 'string') {
      updateData.restaurentId = payload.restaurent_id;
    } else if (typeof payload.restaurentId === 'string') {
      updateData.restaurentId = payload.restaurentId;
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

  private toResponse(record: AddRestaurantDetails): Record<string, unknown> {
    const plain = record.get({ plain: true }) as AddRestaurantDetails & {
      restaurentId?: string;
      userId?: string;
      imageLocation?: unknown;
      createdAt?: Date;
    };

    return {
      _id: plain.id,
      name: plain.name ?? null,
      address: plain.address ?? null,
      owner_name: plain.ownerName ?? null,
      contact_number: plain.contactNumber ?? null,
      email_id: plain.emailId ?? null,
      website: plain.website ?? null,
      map_location: plain.mapLocation ?? null,
      restaurent_id: plain.restaurentId ?? null,
      user_id: plain.userId ?? null,
      image_location: this.mapFileList(plain.imageLocation),
      status: plain.status ?? null,
      created_at: this.formatCreatedAt(plain.createdAt),
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

  private async sendNotification(userId: string, detailId: string, restaurantName: string) {
    const transport = this.getMailTransport();
    const from = this.configService.get<string>('SMTP_FROM')
      || this.configService.get<string>('SMTP_USER')
      || '';
    const to = from;

    const subject = 'Added More Restaurant Details';
    const createdTime = new Date().toISOString().replace('T', ' ').replace('Z', '');
    const body = `User ID: ${userId}\nCreated Time: ${createdTime}\nAdded Details ID: ${detailId}\nRestaurant Name: ${restaurantName}`;

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
