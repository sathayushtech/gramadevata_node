import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes } from 'sequelize';
import type { CreationAttributes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { AddMoreVeterinaryHospital } from './add-more-veterinary-hospital.model';
import { NearbyVeterinaryHospital } from './nearby-veterinary-hospital.model';
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
export class AddMoreVeterinaryHospitalService {
  constructor(
    @InjectModel(AddMoreVeterinaryHospital)
    private readonly addMoreVeterinaryHospitalModel: typeof AddMoreVeterinaryHospital,
    @InjectModel(NearbyVeterinaryHospital)
    private readonly nearbyVeterinaryHospitalModel: typeof NearbyVeterinaryHospital,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly sequelize: Sequelize,
    private readonly configService: ConfigService
  ) {}

  async list(query: Record<string, string | undefined>): Promise<Record<string, unknown>[] | PaginatedResult> {
    const page = this.parsePage(query.page ?? query.page_no);
    const pageSize = this.parsePageSize(query.page_size ?? query.pageSize);

    if (page !== null) {
      const limit = pageSize ?? 10;
      const offset = (page - 1) * limit;
      const { rows, count } = await this.addMoreVeterinaryHospitalModel.findAndCountAll({
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

    const records = await this.addMoreVeterinaryHospitalModel.findAll({
      order: [['createdAt', 'DESC']],
    });

    return records.map((record) => this.toResponse(record));
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const record = await this.addMoreVeterinaryHospitalModel.findByPk(id);
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
      if (!user.isMember || user.isMember.toString().toLowerCase() === 'false') {
        return {
          status: 403,
          body: { message: 'Cannot add more details. Membership is required.' },
        };
      }

      const imageList = this.parseList(payload.image_location ?? payload.imageLocation);
      const data = this.buildCreatePayload(payload, user.id);
      data.imageLocation = [];

      const created = await this.addMoreVeterinaryHospitalModel.create(data);
      const images = imageList.filter((img) => img && img !== 'null');

      const hospitalName = images.length
        ? await this.getHospitalName(created.veterinaryHospitalId)
        : null;
      const savedImages = images.length
        ? await GramadevataUtils.saveEntityImagesToAzure({
          configService: this.configService,
          images,
          id: created.id,
          name: hospitalName ?? 'veterinary_hospital',
          entityType: 'veterinary_hospital',
        })
        : [];

      if (savedImages.length) {
        created.imageLocation = savedImages;
        await created.save();
      }

      const defaultEmail = this.configService.get<string>('DEFAULT_FROM_EMAIL');
      const recipients = [user.email, ...(defaultEmail ? [defaultEmail] : [])].filter((email): email is string => typeof email === 'string');
      await GramadevataUtils.sendAdminEmail(this.configService, { 
        subject: 'Added More Veterinary Hospital Details', 
        text: `User ID: ${user.id}\nCreated Time: ${new Date().toISOString()}\nHospital ID: ${created.id}`, 
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
    const record = await this.addMoreVeterinaryHospitalModel.findByPk(id);
    if (!record) {
      return null;
    }

    const updateData = this.buildUpdatePayload(payload);
    if (Object.keys(updateData).length) {
      await record.update(updateData as CreationAttributes<AddMoreVeterinaryHospital>);
    }

    const imageLocations = payload.image_location ?? payload.imageLocation ?? [];
    const imageList = this.parseList(imageLocations);
    const images = imageList.filter((img) => img && img !== 'null');

    const hospitalName = images.length
      ? await this.getHospitalName(record.veterinaryHospitalId)
      : null;
    const savedImages = images.length
      ? await GramadevataUtils.saveEntityImagesToAzure({
        configService: this.configService,
        images,
        id: record.id,
        name: hospitalName ?? 'veterinary_hospital',
        entityType: 'veterinary_hospital',
      })
      : [];

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
    const record = await this.addMoreVeterinaryHospitalModel.findByPk(id);
    if (!record) {
      return false;
    }

    await record.destroy();
    return true;
  }

  async merge(id: string, payload: Record<string, unknown>) {
    const record = await this.addMoreVeterinaryHospitalModel.findByPk(id);
    if (!record) {
      return null;
    }

    const hospitalName = await this.getHospitalName(record.veterinaryHospitalId);
    if (!hospitalName) {
      return null;
    }

    const newDesc = typeof payload.desc === 'string' ? payload.desc.trim() : '';
    const newImages = this.parseList(payload.image_location ?? payload.imageLocation);
    const newMapLocations = this.cleanMapLocation(payload.map_location ?? payload.mapLocation);

    const oldDesc = typeof record.desc === 'string' ? record.desc.trim() : '';
    const oldImages = this.parseList(record.imageLocation);

    const hasMapLocation = await this.tableHasColumn('add_veterinary_hospital', 'map_location');
    const oldMapLocations = hasMapLocation
      ? this.cleanMapLocation(await this.getRawMapLocation(record.id))
      : [];

    const matchingHospitals = await this.nearbyVeterinaryHospitalModel.findAll({
      where: { name: hospitalName },
      attributes: ['id'],
    });

    const matchingHospitalIds = matchingHospitals.map((h) => h.id).filter(Boolean);

    const duplicates = matchingHospitalIds.length
      ? await this.addMoreVeterinaryHospitalModel.findAll({
        where: {
          veterinaryHospitalId: { [Op.in]: matchingHospitalIds },
          id: { [Op.ne]: record.id },
        },
      })
      : [];

    const duplicateDescs: string[] = [];
    const duplicateImages: string[] = [];
    const duplicateIds = duplicates.map((d) => d.id);

    duplicates.forEach((dup) => {
      if (dup.desc) {
        duplicateDescs.push(String(dup.desc).trim());
      }
      duplicateImages.push(...this.parseList(dup.imageLocation));
    });

    const duplicateMapLocations = hasMapLocation && duplicateIds.length
      ? this.cleanMapLocation(await this.getRawMapLocations(duplicateIds))
      : [];

    const mergedDesc = this.mergeUnique([oldDesc, ...duplicateDescs, newDesc]).filter(Boolean).join(', ');
    const mergedImages = this.mergeUnique([...oldImages, ...duplicateImages, ...newImages]);
    const mergedMapLocations = this.cleanMapLocation([...oldMapLocations, ...duplicateMapLocations, ...newMapLocations]);

    record.desc = mergedDesc || undefined;
    record.imageLocation = mergedImages;
    record.status = 'ACTIVE';
    await record.save();

    if (hasMapLocation) {
      await this.setRawMapLocation(record.id, mergedMapLocations);
    }

    if (duplicateIds.length) {
      await this.addMoreVeterinaryHospitalModel.destroy({
        where: { id: { [Op.in]: duplicateIds } },
      });
    }

    const baseUrl = this.getFileBaseUrl();

    return {
      hospital_id: String(record.id),
      hospital_name: hospitalName,
      desc: mergedDesc,
      image_location: mergedImages.map((img) => `${baseUrl}${img}`),
      map_location: mergedMapLocations,
      status: 'ACTIVE',
    };
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

    const hospitalId = typeof payload.veterinary_hospital_id === 'string'
      ? payload.veterinary_hospital_id
      : typeof payload.veterinaryHospitalId === 'string'
        ? payload.veterinaryHospitalId
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

    const data: CreationAttributes<AddMoreVeterinaryHospital> = {
      id,
      veterinaryHospitalId: hospitalId ?? null,
      userId: userId ?? null,
      desc: typeof payload.desc === 'string' ? payload.desc : null,
      imageLocation: payload.image_location ?? payload.imageLocation ?? [],
      licenseCopy: typeof payload.license_copy === 'string'
        ? payload.license_copy
        : typeof payload.licenseCopy === 'string'
          ? payload.licenseCopy
          : null,
      doctorName: typeof payload.doctor_name === 'string'
        ? payload.doctor_name
        : typeof payload.doctorName === 'string'
          ? payload.doctorName
          : null,
      contactNumber: typeof payload.contact_number === 'string'
        ? payload.contact_number
        : typeof payload.contactNumber === 'string'
          ? payload.contactNumber
          : null,
      status: typeof payload.status === 'string' ? payload.status : null,
      createdAt,
    } as CreationAttributes<AddMoreVeterinaryHospital>;

    return data;
  }

  private buildUpdatePayload(payload: Record<string, unknown>) {
    const updateData: Partial<AddMoreVeterinaryHospital> = {};

    if (Object.prototype.hasOwnProperty.call(payload, 'veterinary_hospital_id')) {
      if (typeof payload.veterinary_hospital_id === 'string') {
        updateData.veterinaryHospitalId = payload.veterinary_hospital_id;
      }
    } else if (Object.prototype.hasOwnProperty.call(payload, 'veterinaryHospitalId')) {
      if (typeof payload.veterinaryHospitalId === 'string') {
        updateData.veterinaryHospitalId = payload.veterinaryHospitalId;
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

    if (Object.prototype.hasOwnProperty.call(payload, 'license_copy')) {
      if (typeof payload.license_copy === 'string') {
        updateData.licenseCopy = payload.license_copy;
      }
    } else if (Object.prototype.hasOwnProperty.call(payload, 'licenseCopy')) {
      if (typeof payload.licenseCopy === 'string') {
        updateData.licenseCopy = payload.licenseCopy;
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'doctor_name')) {
      if (typeof payload.doctor_name === 'string') {
        updateData.doctorName = payload.doctor_name;
      }
    } else if (Object.prototype.hasOwnProperty.call(payload, 'doctorName')) {
      if (typeof payload.doctorName === 'string') {
        updateData.doctorName = payload.doctorName;
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

    if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
      if (typeof payload.status === 'string') {
        updateData.status = payload.status;
      }
    }

    return updateData;
  }

  private toResponse(record: AddMoreVeterinaryHospital): Record<string, unknown> {
    const plain = record.get({ plain: true }) as AddMoreVeterinaryHospital & {
      imageLocation?: unknown;
      createdAt?: Date;
    };

    return {
      _id: plain.id,
      veterinary_hospital_id: plain.veterinaryHospitalId ?? null,
      user_id: plain.userId ?? null,
      desc: plain.desc ?? null,
      image_location: this.mapFileList(plain.imageLocation),
      license_copy: plain.licenseCopy ?? null,
      doctor_name: plain.doctorName ?? null,
      contact_number: plain.contactNumber ?? null,
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
    const baseUrl = this.getFileBaseUrl();
    if (!baseUrl) {
      return list;
    }

    return list.map((path) => `${baseUrl}${path.trim()}`);
  }

  private getFileBaseUrl() {
    const raw = this.configService.get<string>('File_path')
      || this.configService.get<string>('FILE_URL')
      || '';
    if (!raw) {
      return '';
    }
    return raw.endsWith('/') ? raw : `${raw}/`;
  }

  private mergeUnique(items: string[]) {
    const seen = new Set<string>();
    const result: string[] = [];

    items.forEach((item) => {
      const trimmed = item.trim();
      if (!trimmed) {
        return;
      }
      if (seen.has(trimmed)) {
        return;
      }
      seen.add(trimmed);
      result.push(trimmed);
    });

    return result;
  }

  private cleanMapLocation(raw: unknown): string[] {
    const results: string[] = [];
    const seen = new Set<string>();

    const visit = (value: unknown) => {
      if (!value) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => visit(item));
        return;
      }

      if (typeof value !== 'string') {
        return;
      }

      let text = value.trim();
      if (!text) {
        return;
      }

      if (text.startsWith('[') && text.endsWith(']')) {
        try {
          const parsed = JSON.parse(text);
          visit(parsed);
          return;
        } catch {
          // fallback below
        }
      }

      text = text.replace(/\\/g, '').replace(/^['"]|['"]$/g, '');
      const matches = text.match(/https:\/\/maps\.app\.goo\.gl\/\S+/g);
      if (!matches) {
        return;
      }

      matches.forEach((match) => {
        const url = match.trim();
        if (!url || seen.has(url)) {
          return;
        }
        seen.add(url);
        results.push(url);
      });
    };

    visit(raw);
    return results;
  }

  private async tableHasColumn(tableName: string, columnName: string) {
    const rows = await this.sequelize.query(
      `SHOW COLUMNS FROM ${tableName} LIKE :columnName`,
      {
        replacements: { columnName },
        type: QueryTypes.SELECT,
      },
    );
    return Array.isArray(rows) && rows.length > 0;
  }

  private async getRawMapLocation(id: string): Promise<unknown> {
    const rows = await this.sequelize.query<{ map_location: unknown }>(
      'SELECT map_location FROM add_veterinary_hospital WHERE _id = :id LIMIT 1',
      {
        replacements: { id },
        type: QueryTypes.SELECT,
      },
    );

    return rows?.[0]?.map_location;
  }

  private async getRawMapLocations(ids: string[]): Promise<unknown[]> {
    if (!ids.length) {
      return [];
    }

    const rows = await this.sequelize.query<{ map_location: unknown }>(
      'SELECT map_location FROM add_veterinary_hospital WHERE _id IN (:ids)',
      {
        replacements: { ids },
        type: QueryTypes.SELECT,
      },
    );

    return rows.map((row) => row.map_location);
  }

  private async setRawMapLocation(id: string, locations: string[]) {
    const value = locations.length ? JSON.stringify(locations) : null;

    await this.sequelize.query(
      'UPDATE add_veterinary_hospital SET map_location = :value WHERE _id = :id',
      {
        replacements: { id, value },
        type: QueryTypes.UPDATE,
      },
    );
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

  private async getHospitalName(hospitalId?: string | null) {
    if (!hospitalId) {
      return null;
    }

    const hospital = await this.nearbyVeterinaryHospitalModel.findByPk(hospitalId);
    return hospital?.name ?? null;
  }

  private async sendNotification(userId: string, hospitalId: string) {
    const transport = GramadevataUtils.getMailTransport(this.configService);
    const from = this.configService.get<string>('SMTP_FROM')
      || this.configService.get<string>('SMTP_USER')
      || '';
    const to = from;

    const subject = 'Added More Veterinary Hospital Details';
    const createdTime = GramadevataUtils.formatDjangoDateTime(new Date());
    const body = `User ID: ${userId}\nCreated Time: ${createdTime}\nHospital ID: ${hospitalId}`;

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
