import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import type { CreationAttributes } from 'sequelize';
import nodemailer from 'nodemailer';
import { AddMorePoojaStore } from './add-pooja-store.model';
import { Register as User } from '../auth/user.model';
import { PoojaStore } from './pooja-store.model';

type CreateResult = {
  status: number;
  body: Record<string, unknown>;
};

@Injectable()
export class AddMorePoojaStoreService {
  constructor(
    @InjectModel(AddMorePoojaStore)
    private readonly addMorePoojaStoreModel: typeof AddMorePoojaStore,
    @InjectModel(PoojaStore)
    private readonly poojaStoreModel: typeof PoojaStore,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly configService: ConfigService
  ) {}

  async list(): Promise<Record<string, unknown>[]> {
    const records = await this.addMorePoojaStoreModel.findAll({
      order: [['createdAt', 'DESC']],
    });

    return records.map((record) => this.toResponse(record));
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const record = await this.addMorePoojaStoreModel.findByPk(id);
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

      const created = await this.addMorePoojaStoreModel.create(data);

      const images = imageList.filter((img) => img && img !== 'null');
      if (images.length) {
        created.imageLocation = images;
        await created.save();
      }

      await this.sendNotification(user.id, created.poojaStoreId ?? '');

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
    const record = await this.addMorePoojaStoreModel.findByPk(id);
    if (!record) {
      return null;
    }

    const updateData = this.buildUpdatePayload(payload);
    if (Object.keys(updateData).length) {
      await record.update(updateData as CreationAttributes<AddMorePoojaStore>);
    }

    return this.toResponse(record);
  }

  async remove(id: string): Promise<boolean> {
    const record = await this.addMorePoojaStoreModel.findByPk(id);
    if (!record) {
      return false;
    }

    await record.destroy();
    return true;
  }

  async mergePoojaStoreDetails(
    poojaStoreId: string,
    payload: Record<string, unknown>,
  ): Promise<CreateResult> {
    try {
      const store = await this.poojaStoreModel.findByPk(poojaStoreId);
      if (!store) {
        return { status: 404, body: { message: 'Pooja Store not found' } };
      }

      const newDesc = typeof payload.desc === 'string' ? payload.desc.trim() : '';
      const newImages = this.parseListField(payload.image_location ?? payload.imageLocation);
      const newMapLocation = this.cleanMapLocation(payload.map_location ?? payload.mapLocation);

      const oldDesc = '';
      const oldImages = this.parseListField(store.imageLocation);
      const oldMapLocation = this.cleanMapLocation(store.mapLocation);

      const details = await this.addMorePoojaStoreModel.findAll({ where: { poojaStoreId } });

      const allDescs: string[] = [];
      const allImages: string[] = [];
      const allMapLocations: string[] = [];

      for (const detail of details) {
        if (detail.desc) {
          allDescs.push(detail.desc.trim());
        }
        allImages.push(...this.parseListField(detail.imageLocation));
        allMapLocations.push(...this.cleanMapLocation(detail.mapLocation));
      }

      const mergedDesc = this.uniqueStrings([oldDesc, ...allDescs, newDesc].filter(Boolean)).join(', ');
      const mergedImages = this.uniqueStrings([...oldImages, ...allImages, ...newImages]);
      const mergedMapLocation = this.uniqueStrings([
        ...oldMapLocation,
        ...allMapLocations,
        ...newMapLocation,
      ]);

      store.imageLocation = mergedImages as unknown as PoojaStore['imageLocation'];
      store.mapLocation = JSON.stringify(mergedMapLocation);
      store.status = 'ACTIVE';
      await store.save();

      if (details.length) {
        await this.addMorePoojaStoreModel.destroy({ where: { poojaStoreId } });
      }

      await this.addMorePoojaStoreModel.create({
        poojaStoreId,
        desc: mergedDesc,
        imageLocation: mergedImages,
        mapLocation: JSON.stringify(mergedMapLocation),
        status: 'ACTIVE',
      } as CreationAttributes<AddMorePoojaStore>);

      const base = this.configService.get<string>('File_path');
      const baseUrl = base ? `${base}/` : '';

      return {
        status: 200,
        body: {
          pooja_store_id: store.id,
          name: store.name,
          desc: mergedDesc,
          image_location: mergedImages.map((img) => `${baseUrl}${img}`),
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

  private parseListField(raw: unknown): string[] {
    if (Array.isArray(raw)) {
      return raw.map((item) => String(item).trim()).filter(Boolean);
    }

    if (!raw) {
      return [];
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
        .map((item) => item.replace(/['\"]+/g, '').trim())
        .filter(Boolean);
    }

    return [];
  }

  private cleanMapLocation(raw: unknown): string[] {
    const results: string[] = [];

    const ingest = (value: unknown) => {
      if (!value) {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((item) => ingest(item));
        return;
      }
      if (typeof value !== 'string') {
        return;
      }

      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }

      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          ingest(parsed);
          return;
        } catch {
          // ignore
        }
      }

      const cleaned = trimmed.replace(/\\/g, '').replace(/^["']+|["']+$/g, '');
      const match = cleaned.match(/https:\/\/maps\.app\.goo\.gl\/\S+/);
      if (match) {
        results.push(match[0]);
      }
    };

    ingest(raw);

    return this.uniqueStrings(results);
  }

  private uniqueStrings(values: string[]) {
    const unique = new Set<string>();
    values.forEach((value) => {
      if (value) {
        unique.add(value);
      }
    });
    return Array.from(unique);
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

    const poojaStoreId = typeof payload.pooja_store_id === 'string'
      ? payload.pooja_store_id
      : typeof payload.poojaStoreId === 'string'
        ? payload.poojaStoreId
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

    const data: CreationAttributes<AddMorePoojaStore> = {
      id,
      poojaStoreId: poojaStoreId ?? null,
      userId: userId ?? null,
      desc: typeof payload.desc === 'string' ? payload.desc : null,
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
      mapLocation: typeof payload.map_location === 'string'
        ? payload.map_location
        : typeof payload.mapLocation === 'string'
          ? payload.mapLocation
          : null,
      imageLocation: payload.image_location ?? payload.imageLocation ?? [],
      status: typeof payload.status === 'string' ? payload.status : null,
      createdAt,
    } as CreationAttributes<AddMorePoojaStore>;

    return data;
  }

  private buildUpdatePayload(payload: Record<string, unknown>) {
    const updateData: Partial<AddMorePoojaStore> = {};

    if (typeof payload.desc === 'string') {
      updateData.desc = payload.desc;
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

    if (typeof payload.map_location === 'string') {
      updateData.mapLocation = payload.map_location;
    } else if (typeof payload.mapLocation === 'string') {
      updateData.mapLocation = payload.mapLocation;
    }

    if (typeof payload.pooja_store_id === 'string') {
      updateData.poojaStoreId = payload.pooja_store_id;
    } else if (typeof payload.poojaStoreId === 'string') {
      updateData.poojaStoreId = payload.poojaStoreId;
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

  private toResponse(record: AddMorePoojaStore): Record<string, unknown> {
    const plain = record.get({ plain: true }) as AddMorePoojaStore & {
      poojaStoreId?: string;
      userId?: string;
      imageLocation?: unknown;
      createdAt?: Date;
    };

    return {
      _id: plain.id,
      pooja_store_id: plain.poojaStoreId ?? null,
      user_id: plain.userId ?? null,
      desc: plain.desc ?? null,
      image_location: this.mapFileList(plain.imageLocation),
      address: plain.address ?? null,
      owner_name: plain.ownerName ?? null,
      contact_number: plain.contactNumber ?? null,
      map_location: plain.mapLocation ?? null,
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

  private async sendNotification(userId: string, poojaStoreId: string) {
    const transport = this.getMailTransport();
    const from = this.configService.get<string>('SMTP_FROM')
      || this.configService.get<string>('SMTP_USER')
      || '';
    const to = from;

    const subject = 'Added More Pooja Store Details';
    const body = `User ID: ${userId}\nCreated Time: ${new Date().toISOString()}\nPooja Store ID: ${poojaStoreId}`;

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
