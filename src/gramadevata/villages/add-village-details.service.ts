import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import type { CreationAttributes } from 'sequelize';
import { AddVillageDetails } from './add-village-details.model';
import { Village } from './village.model';
import { Register as User } from '../auth/user.model';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';

type CreateResult = {
  status: number;
  body: Record<string, unknown>;
};

type PaginatedResult = {
  count: number;
  next: number | null;
  previous: number | null;
  results: Record<string, unknown>[];
};

@Injectable()
export class AddVillageDetailsService {
  constructor(
    @InjectModel(AddVillageDetails)
    private readonly addVillageDetailsModel: typeof AddVillageDetails,
    @InjectModel(Village)
    private readonly villageModel: typeof Village,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly configService: ConfigService
  ) {}

  async list(query: Record<string, string | undefined>): Promise<Record<string, unknown>[] | PaginatedResult> {
    const page = this.parsePage(query.page ?? query.page_no);
    const pageSize = this.parsePageSize(query.page_size ?? query.pageSize);

    if (page !== null) {
      const limit = pageSize ?? 10;
      const offset = (page - 1) * limit;
      const { rows, count } = await this.addVillageDetailsModel.findAndCountAll({
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      const results = rows.map((record) => this.toResponse(record));
      const totalPages = Math.ceil(count / limit) || 1;

      return {
        count,
        next: page < totalPages ? page + 1 : null,
        previous: page > 1 ? page - 1 : null,
        results,
      };
    }

    const records = await this.addVillageDetailsModel.findAll({
      order: [['createdAt', 'DESC']],
    });

    return records.map((record) => this.toResponse(record));
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const record = await this.addVillageDetailsModel.findByPk(id);
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
      const videoList = this.parseList(payload.village_video ?? payload.villageVideo);

      const data = this.buildCreatePayload(payload, user.id);
      data.imageLocation = [];
      data.villageVideo = [];

      const created = await this.addVillageDetailsModel.create(data);

      const images = imageList.filter((img) => img && img !== 'null');
      const videos = videoList.filter((vid) => vid && vid !== 'null');

      const villageName = await this.getVillageName(created.villageId);
      const savedImages = await GramadevataUtils.saveEntityImagesToAzure({
        configService: this.configService,
        images,
        id: created.id,
        name: villageName ?? 'village',
        entityType: 'village',
        extension: 'webp',
      });
      const savedVideos = await GramadevataUtils.saveEntityVideosToAzure({
        configService: this.configService,
        videos,
        id: created.id,
        name: villageName ?? 'village',
        entityType: 'village',
      });

      if (savedImages.length) {
        created.imageLocation = savedImages;
      }
      if (savedVideos.length) {
        created.villageVideo = savedVideos;
      }
      if (savedImages.length || savedVideos.length) {
        await created.save();
      }

      const defaultEmail = this.configService.get<string>('DEFAULT_FROM_EMAIL');
			const recipients = [user.email, ...(defaultEmail ? [defaultEmail] : [])].filter((email): email is string => typeof email === 'string');
      await GramadevataUtils.sendAdminEmail(this.configService, { 
          subject: 'Added More Village Details', 
          text: `User ID: ${user.id}\nCreated Time: ${new Date().toISOString()}\nAdded Details ID: ${created.id}`, 
          recipients 
      });

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
    const record = await this.addVillageDetailsModel.findByPk(id);
    if (!record) {
      return null;
    }

    const updateData = this.buildUpdatePayload(payload);
    if (Object.keys(updateData).length) {
      await record.update(updateData as CreationAttributes<AddVillageDetails>);
    }

    const imageLocations = payload.image_location ?? payload.imageLocation ?? [];
    const videoFiles = payload.village_video ?? payload.villageVideo ?? [];

    const imageList = this.parseList(imageLocations);
    const videoList = this.parseList(videoFiles);

    const images = imageList.filter((img) => img && img !== 'null');
    const videos = videoList.filter((vid) => vid && vid !== 'null');

    const villageName = await this.getVillageName(record.villageId);
    const savedImages = await GramadevataUtils.saveEntityImagesToAzure({
      configService: this.configService,
      images,
      id: record.id,
      name: villageName ?? 'village',
      entityType: 'village',
      extension: 'webp',
    });
    const savedVideos = await GramadevataUtils.saveEntityVideosToAzure({
      configService: this.configService,
      videos,
      id: record.id,
      name: villageName ?? 'village',
      entityType: 'village',
    });

    let updated = false;
    if (savedImages.length) {
      record.imageLocation = savedImages;
      updated = true;
    }
    if (savedVideos.length) {
      record.villageVideo = savedVideos;
      updated = true;
    }

    if (updated) {
      await record.save();
    }

    return {
      message: 'updated successfully',
      data: this.toResponse(record),
    };
  }

  async remove(id: string): Promise<boolean> {
    const record = await this.addVillageDetailsModel.findByPk(id);
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

    const villageId = typeof payload.village_id === 'string'
      ? payload.village_id
      : typeof payload.villageId === 'string'
        ? payload.villageId
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

    const data: CreationAttributes<AddVillageDetails> = {
      id,
      villageId: villageId ?? null,
      userId: userId ?? null,
      desc: typeof payload.desc === 'string' ? payload.desc : null,
      mapUrl: typeof payload.map_location === 'string'
        ? payload.map_location
        : typeof payload.mapUrl === 'string'
          ? payload.mapUrl
          : null,
      imageLocation: payload.image_location ?? payload.imageLocation ?? [],
      villageVideo: payload.village_video ?? payload.villageVideo ?? [],
      status: typeof payload.status === 'string' ? payload.status : null,
      createdAt,
    } as CreationAttributes<AddVillageDetails>;

    return data;
  }

  private buildUpdatePayload(payload: Record<string, unknown>) {
    const updateData: Partial<AddVillageDetails> = {};

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

    if (Object.prototype.hasOwnProperty.call(payload, 'desc')) {
      if (typeof payload.desc === 'string') {
        updateData.desc = payload.desc;
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'map_location')) {
      if (typeof payload.map_location === 'string') {
        updateData.mapUrl = payload.map_location;
      }
    } else if (Object.prototype.hasOwnProperty.call(payload, 'mapUrl')) {
      if (typeof payload.mapUrl === 'string') {
        updateData.mapUrl = payload.mapUrl;
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
      if (typeof payload.status === 'string') {
        updateData.status = payload.status;
      }
    }

    return updateData;
  }

  private toResponse(record: AddVillageDetails): Record<string, unknown> {
    const plain = record.get({ plain: true }) as AddVillageDetails & {
      imageLocation?: unknown;
      villageVideo?: unknown;
      createdAt?: Date;
    };

    return {
      _id: plain.id,
      image_location: this.mapFileList(plain.imageLocation),
      desc: plain.desc ?? null,
      map_location: plain.mapUrl ?? null,
      village_id: plain.villageId ?? null,
      user_id: plain.userId ?? null,
      created_at: plain.createdAt ?? null,
      village_video: this.mapFileList(plain.villageVideo),
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

  private parsePage(value?: string) {
    if (!value) {
      return null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return null;
    }
    return Math.floor(parsed);
  }

  private parsePageSize(value?: string) {
    if (!value) {
      return null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return null;
    }
    return Math.floor(parsed);
  }

  private async getVillageName(villageId?: string | null) {
    if (!villageId) {
      return null;
    }

    const village = await this.villageModel.findByPk(villageId);
    return village?.name ?? null;
  }

  private async sendNotification(userId: string, detailId: string, villageId: string) {
    const transport = GramadevataUtils.getMailTransport(this.configService);
    const from = this.configService.get<string>('SMTP_FROM')
      || this.configService.get<string>('SMTP_USER')
      || '';
    const to = from;

    const subject = 'Added More Village Details';
    const createdTime = GramadevataUtils.formatDjangoDateTime(new Date());
    const body = `User ID: ${userId}\nCreated Time: ${createdTime}\nAdded Details ID: ${detailId}\nVillage ID: ${villageId}`;

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
}
