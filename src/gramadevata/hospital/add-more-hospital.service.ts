import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import type { CreationAttributes } from 'sequelize';
import nodemailer from 'nodemailer';
import { AddMoreHospital } from './add-more-hospital.model';
import { Register as User } from '../auth/user.model';

type CreateResult = {
  status: number;
  body: Record<string, unknown>;
};

@Injectable()
export class AddMoreHospitalService {
  constructor(
    @InjectModel(AddMoreHospital)
    private readonly addMoreHospitalModel: typeof AddMoreHospital,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly configService: ConfigService
  ) {}

  async list(): Promise<Record<string, unknown>[]> {
    const records = await this.addMoreHospitalModel.findAll({
      order: [['createdAt', 'DESC']],
    });

    return records.map((record) => this.toResponse(record));
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const record = await this.addMoreHospitalModel.findByPk(id);
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

      const created = await this.addMoreHospitalModel.create(data);

      const images = imageList.filter((img) => img && img !== 'null');
      if (images.length) {
        created.imageLocation = images;
        await created.save();
      }

      await this.sendNotification(user.id, created.hospitalId ?? '');

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
    const record = await this.addMoreHospitalModel.findByPk(id);
    if (!record) {
      return null;
    }

    const updateData = this.buildUpdatePayload(payload);
    if (Object.keys(updateData).length) {
      await record.update(updateData as CreationAttributes<AddMoreHospital>);
    }

    return {
      message: 'updated successfully',
      data: this.toResponse(record),
    };
  }

  async remove(id: string): Promise<boolean> {
    const record = await this.addMoreHospitalModel.findByPk(id);
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

    const hospitalId = typeof payload.hospital_id === 'string'
      ? payload.hospital_id
      : typeof payload.hospitalId === 'string'
        ? payload.hospitalId
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

    const data: CreationAttributes<AddMoreHospital> = {
      id,
      hospitalId: hospitalId ?? null,
      userId: userId ?? null,
      desc: typeof payload.desc === 'string' ? payload.desc : null,
      address: typeof payload.address === 'string' ? payload.address : null,
      contactNumber: typeof payload.contact_number === 'string'
        ? payload.contact_number
        : typeof payload.contactNumber === 'string'
          ? payload.contactNumber
          : null,
      ownerName: typeof payload.owner_name === 'string'
        ? payload.owner_name
        : typeof payload.ownerName === 'string'
          ? payload.ownerName
          : null,
      mapLocation: typeof payload.map_location === 'string'
        ? payload.map_location
        : typeof payload.mapLocation === 'string'
          ? payload.mapLocation
          : null,
      website: typeof payload.website === 'string' ? payload.website : null,
      emailId: typeof payload.email_id === 'string'
        ? payload.email_id
        : typeof payload.emailId === 'string'
          ? payload.emailId
          : null,
      licenseCopy: typeof payload.license_copy === 'string'
        ? payload.license_copy
        : typeof payload.licenseCopy === 'string'
          ? payload.licenseCopy
          : null,
      imageLocation: payload.image_location ?? payload.imageLocation ?? [],
      status: typeof payload.status === 'string' ? payload.status : null,
      createdAt,
    } as CreationAttributes<AddMoreHospital>;

    return data;
  }

  private buildUpdatePayload(payload: Record<string, unknown>) {
    const updateData: Partial<AddMoreHospital> = {};

    if (typeof payload.desc === 'string') {
      updateData.desc = payload.desc;
    }

    if (typeof payload.address === 'string') {
      updateData.address = payload.address;
    }

    if (typeof payload.contact_number === 'string') {
      updateData.contactNumber = payload.contact_number;
    } else if (typeof payload.contactNumber === 'string') {
      updateData.contactNumber = payload.contactNumber;
    }

    if (typeof payload.owner_name === 'string') {
      updateData.ownerName = payload.owner_name;
    } else if (typeof payload.ownerName === 'string') {
      updateData.ownerName = payload.ownerName;
    }

    if (typeof payload.map_location === 'string') {
      updateData.mapLocation = payload.map_location;
    } else if (typeof payload.mapLocation === 'string') {
      updateData.mapLocation = payload.mapLocation;
    }

    if (typeof payload.website === 'string') {
      updateData.website = payload.website;
    }

    if (typeof payload.email_id === 'string') {
      updateData.emailId = payload.email_id;
    } else if (typeof payload.emailId === 'string') {
      updateData.emailId = payload.emailId;
    }

    if (typeof payload.license_copy === 'string') {
      updateData.licenseCopy = payload.license_copy;
    } else if (typeof payload.licenseCopy === 'string') {
      updateData.licenseCopy = payload.licenseCopy;
    }

    if (typeof payload.hospital_id === 'string') {
      updateData.hospitalId = payload.hospital_id;
    } else if (typeof payload.hospitalId === 'string') {
      updateData.hospitalId = payload.hospitalId;
    }

    if (typeof payload.user_id === 'string') {
      updateData.userId = payload.user_id;
    } else if (typeof payload.userId === 'string') {
      updateData.userId = payload.userId;
    }

    if (payload.image_location !== undefined || payload.imageLocation !== undefined) {
      updateData.imageLocation = this.parseList(payload.image_location ?? payload.imageLocation);
    }

    if (typeof payload.status === 'string') {
      updateData.status = payload.status;
    }

    return updateData;
  }

  private toResponse(record: AddMoreHospital): Record<string, unknown> {
    const plain = record.get({ plain: true }) as AddMoreHospital & {
      hospitalId?: string;
      userId?: string;
      imageLocation?: unknown;
      createdAt?: Date;
    };

    return {
      _id: plain.id,
      hospital_id: plain.hospitalId ?? null,
      user_id: plain.userId ?? null,
      desc: plain.desc ?? null,
      image_location: this.mapFileList(plain.imageLocation),
      address: plain.address ?? null,
      contact_number: plain.contactNumber ?? null,
      owner_name: plain.ownerName ?? null,
      map_location: plain.mapLocation ?? null,
      website: plain.website ?? null,
      email_id: plain.emailId ?? null,
      license_copy: plain.licenseCopy ?? null,
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

  private async sendNotification(userId: string, hospitalId: string) {
    const transport = this.getMailTransport();
    const from = this.configService.get<string>('SMTP_FROM')
      || this.configService.get<string>('SMTP_USER')
      || '';
    const to = from;

    const subject = 'Added More Nearby Hospital Details';
    const body = `User ID: ${userId}\nCreated Time: ${new Date().toISOString()}\nHospital ID: ${hospitalId}`;

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
