import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import type { CreationAttributes } from 'sequelize';
import { AddMoreTourOperator } from './add-more-tour-operator.model';
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
export class AddMoreTourOperatorService {
  constructor(
    @InjectModel(AddMoreTourOperator)
    private readonly addMoreTourOperatorModel: typeof AddMoreTourOperator,
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
      const { rows, count } = await this.addMoreTourOperatorModel.findAndCountAll({
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

    const records = await this.addMoreTourOperatorModel.findAll({
      order: [['createdAt', 'DESC']],
    });

    return records.map((record) => this.toResponse(record));
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const record = await this.addMoreTourOperatorModel.findByPk(id);
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

      const created = await this.addMoreTourOperatorModel.create(data);

      const images = imageList.filter((img) => img && img !== 'null');
      const savedImages = await GramadevataUtils.saveEntityImagesToAzure({
        configService: this.configService,
        images,
        id: created.id,
        name: created.tourOperatorName ?? 'tour_operator',
        entityType: 'tour_operator',
      });

      if (savedImages.length) {
        created.imageLocation = savedImages;
        await created.save();
      }

      const defaultEmail = this.configService.get<string>('DEFAULT_FROM_EMAIL');
			const recipients = [user.email, ...(defaultEmail ? [defaultEmail] : [])].filter((email): email is string => typeof email === 'string');
      await GramadevataUtils.sendAdminEmail(this.configService, { 
            subject: 'Added Tour Operator', 
            text: `User ID: ${user.id}\nCreated Time: ${new Date().toISOString()}\nOperator ID: ${created.id}`, 
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
    const record = await this.addMoreTourOperatorModel.findByPk(id);
    if (!record) {
      return null;
    }

    const updateData = this.buildUpdatePayload(payload);
    if (Object.keys(updateData).length) {
      await record.update(updateData as CreationAttributes<AddMoreTourOperator>);
    }

    const imageLocations = payload.image_location ?? payload.imageLocation ?? [];
    const imageList = this.parseList(imageLocations);
    const images = imageList.filter((img) => img && img !== 'null');

    const savedImages = await GramadevataUtils.saveEntityImagesToAzure({
      configService: this.configService,
      images,
      id: record.id,
      name: record.tourOperatorName ?? 'tour_operator',
      entityType: 'tour_operator',
    });

    if (savedImages.length) {
      record.imageLocation = savedImages;
      await record.save();
    }

    return {
      message: 'updated successfully',
      data: this.toResponse(record),
    };
  }

  async remove(id: string): Promise<boolean> {
    const record = await this.addMoreTourOperatorModel.findByPk(id);
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

    const tourOperatorId = typeof payload.tour_operator_id === 'string'
      ? payload.tour_operator_id
      : typeof payload.tourOperatorId === 'string'
        ? payload.tourOperatorId
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

    const data: CreationAttributes<AddMoreTourOperator> = {
      id,
      tourOperatorName: typeof payload.tour_operator_name === 'string'
        ? payload.tour_operator_name
        : typeof payload.tourOperatorName === 'string'
          ? payload.tourOperatorName
          : null,
      tourOperatorId: tourOperatorId ?? null,
      userId: userId ?? null,
      rating: typeof payload.rating === 'string' ? payload.rating : null,
      mobileNumber: typeof payload.mobile_number === 'string'
        ? payload.mobile_number
        : typeof payload.mobileNumber === 'string'
          ? payload.mobileNumber
          : null,
      website: typeof payload.website === 'string' ? payload.website : null,
      email: typeof payload.email === 'string' ? payload.email : null,
      contactAddress: typeof payload.contact_address === 'string'
        ? payload.contact_address
        : typeof payload.contactAddress === 'string'
          ? payload.contactAddress
          : null,
      mapLocation: typeof payload.map_location === 'string'
        ? payload.map_location
        : typeof payload.mapLocation === 'string'
          ? payload.mapLocation
          : null,
      imageLocation: payload.image_location ?? payload.imageLocation ?? [],
      status: typeof payload.status === 'string' ? payload.status : null,
      createdAt,
    } as CreationAttributes<AddMoreTourOperator>;

    return data;
  }

  private buildUpdatePayload(payload: Record<string, unknown>) {
    const updateData: Partial<AddMoreTourOperator> = {};

    if (Object.prototype.hasOwnProperty.call(payload, 'tour_operator_name')) {
      if (typeof payload.tour_operator_name === 'string') {
        updateData.tourOperatorName = payload.tour_operator_name;
      }
    } else if (Object.prototype.hasOwnProperty.call(payload, 'tourOperatorName')) {
      if (typeof payload.tourOperatorName === 'string') {
        updateData.tourOperatorName = payload.tourOperatorName;
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'tour_operator_id')) {
      if (typeof payload.tour_operator_id === 'string') {
        updateData.tourOperatorId = payload.tour_operator_id;
      }
    } else if (Object.prototype.hasOwnProperty.call(payload, 'tourOperatorId')) {
      if (typeof payload.tourOperatorId === 'string') {
        updateData.tourOperatorId = payload.tourOperatorId;
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

    if (Object.prototype.hasOwnProperty.call(payload, 'rating')) {
      if (typeof payload.rating === 'string') {
        updateData.rating = payload.rating;
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'mobile_number')) {
      if (typeof payload.mobile_number === 'string') {
        updateData.mobileNumber = payload.mobile_number;
      }
    } else if (Object.prototype.hasOwnProperty.call(payload, 'mobileNumber')) {
      if (typeof payload.mobileNumber === 'string') {
        updateData.mobileNumber = payload.mobileNumber;
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'website')) {
      if (typeof payload.website === 'string') {
        updateData.website = payload.website;
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'email')) {
      if (typeof payload.email === 'string') {
        updateData.email = payload.email;
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'contact_address')) {
      if (typeof payload.contact_address === 'string') {
        updateData.contactAddress = payload.contact_address;
      }
    } else if (Object.prototype.hasOwnProperty.call(payload, 'contactAddress')) {
      if (typeof payload.contactAddress === 'string') {
        updateData.contactAddress = payload.contactAddress;
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

    if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
      if (typeof payload.status === 'string') {
        updateData.status = payload.status;
      }
    }

    return updateData;
  }

  private toResponse(record: AddMoreTourOperator): Record<string, unknown> {
    const plain = record.get({ plain: true }) as AddMoreTourOperator & {
      imageLocation?: unknown;
      createdAt?: Date;
    };

    return {
      _id: plain.id,
      tour_operator_name: plain.tourOperatorName ?? null,
      user_id: plain.userId ?? null,
      rating: plain.rating ?? null,
      mobile_number: plain.mobileNumber ?? null,
      website: plain.website ?? null,
      email: plain.email ?? null,
      contact_address: plain.contactAddress ?? null,
      map_location: plain.mapLocation ?? null,
      image_location: this.mapFileList(plain.imageLocation),
      tour_operator_id: plain.tourOperatorId ?? null,
      status: plain.status ?? null,
      created_at: plain.createdAt ?? null,
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
}
