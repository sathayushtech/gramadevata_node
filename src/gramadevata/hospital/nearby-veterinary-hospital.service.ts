import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import type { CreationAttributes, WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import { NearbyVeterinaryHospital } from './nearby-veterinary-hospital.model';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';

type CreateResult = {
  status: number;
  body: Record<string, unknown>;
};

@Injectable()
export class NearbyVeterinaryHospitalService {
  constructor(
    @InjectModel(NearbyVeterinaryHospital)
    private readonly veterinaryHospitalModel: typeof NearbyVeterinaryHospital,
    private readonly configService: ConfigService,
  ) {}

  async list(query: Record<string, string | undefined>) {
    const filters = this.buildFilters(query);

    const records = await this.veterinaryHospitalModel.findAll({
      where: filters,
      order: [['createdAt', 'DESC']],
    });

    return records.map((record) => this.toResponse(record));
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const record = await this.veterinaryHospitalModel.findByPk(id);
    if (!record) {
      return null;
    }

    if ((record.status ?? '').toString() !== 'ACTIVE') {
      return null;
    }

    return this.toResponse(record);
  }

  async create(payload: Record<string, unknown>, userPayload?: Record<string, unknown>): Promise<CreateResult> {
    try {
      const imageLocations = this.parseList(payload.image_location ?? payload.imageLocation);
      const licenseCopies = this.parseList(payload.license_copy ?? payload.licenseCopy);

      const data = this.mapPayload(payload, userPayload);
      data.imageLocation = this.storeList([]) ?? undefined;
      data.licenseCopy = this.storeList([]) ?? undefined;

      const created = await this.veterinaryHospitalModel.create(data);

      const savedImages = imageLocations.length
        ? await GramadevataUtils.saveEntityImagesToAzure({
          configService: this.configService,
          images: imageLocations,
          id: created.id,
          name: created.name ?? 'veterinary_hospital',
          entityType: 'veterinary_hospital',
        })
        : [];

      const savedLicenses = licenseCopies.length
        ? await GramadevataUtils.saveEntityImagesToAzure({
          configService: this.configService,
          images: licenseCopies,
          id: created.id,
          name: created.name ?? 'veterinary_hospital',
          entityType: 'veterinary_license',
        })
        : [];

      if (savedImages.length) {
        created.imageLocation = this.storeList(savedImages) ?? undefined;
      }

      if (savedLicenses.length) {
        created.licenseCopy = this.storeList(savedLicenses) ?? undefined;
      }

      if (savedImages.length || savedLicenses.length) {
        await created.save();
      }

      await this.sendNotifications(userPayload, created);

      return {
        status: 201,
        body: { message: 'success', result: this.toResponse(created) },
      };
    } catch (error) {
      return {
        status: 500,
        body: {
          message: 'An error occurred',
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async update(id: string, payload: Record<string, unknown>) {
    const record = await this.veterinaryHospitalModel.findByPk(id);
    if (!record) {
      return null;
    }

    if ((record.status ?? '').toString() !== 'ACTIVE') {
      return null;
    }

    const updateData = this.mapUpdatePayload(payload);
    if (Object.keys(updateData).length) {
      await record.update(updateData as CreationAttributes<NearbyVeterinaryHospital>);
    }

    const newImages = this.parseList(payload.image_location ?? payload.imageLocation);
    const newLicenses = this.parseList(payload.license_copy ?? payload.licenseCopy);

    const storedImages = this.parseList(record.imageLocation);
    const storedLicenses = this.parseList(record.licenseCopy);

    if (newImages.length) {
      const savedImages = await GramadevataUtils.saveEntityImagesToAzure({
        configService: this.configService,
        images: newImages,
        id: record.id,
        name: record.name ?? 'veterinary_hospital',
        entityType: 'veterinary_hospital',
      });

      if (savedImages.length) {
        record.imageLocation = this.storeList([...storedImages, ...savedImages]) ?? undefined;
      }
    }

    if (newLicenses.length) {
      const savedLicenses = await GramadevataUtils.saveEntityImagesToAzure({
        configService: this.configService,
        images: newLicenses,
        id: record.id,
        name: record.name ?? 'veterinary_hospital',
        entityType: 'veterinary_license',
      });

      if (savedLicenses.length) {
        record.licenseCopy = this.storeList([...storedLicenses, ...savedLicenses]) ?? undefined;
      }
    }

    await record.save();

    return {
      message: 'Veterinary Hospital updated successfully',
      result: this.toResponse(record),
    };
  }

  async remove(id: string) {
    const record = await this.veterinaryHospitalModel.findByPk(id);
    if (!record) {
      return false;
    }

    await record.destroy();
    return true;
  }

  async listByLocation(query: Record<string, string | undefined>) {
    const inputValue = query.input_value || query.inputValue;
    if (!inputValue) {
      return {
        status: 400,
        body: { detail: ['input_value is required'] },
      };
    }

    const search = (query.search || '').trim();

    const include = [
      {
        model: Village,
        as: 'village',
        required: false,
        include: [
          {
            model: Block,
            as: 'block',
            required: false,
            include: [
              {
                model: District,
                as: 'district',
                required: false,
                include: [
                  {
                    model: State,
                    as: 'state',
                    required: false,
                    include: [
                      {
                        model: Country,
                        as: 'country',
                        required: false,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const orFilters: WhereOptions<NearbyVeterinaryHospital>[] = [
      { '$village.block.district.state.country.id$': inputValue },
      { '$village.block.district.state.id$': inputValue },
      { '$village.block.district.id$': inputValue },
      { '$village.block.id$': inputValue },
      { '$village.id$': inputValue },
    ];

    const searchFilters: WhereOptions<NearbyVeterinaryHospital>[] = [];
    if (search) {
      const pattern = `%${search}%`;
      searchFilters.push(
        { name: { [Op.like]: pattern } },
        { address: { [Op.like]: pattern } },
        { doctorName: { [Op.like]: pattern } },
      );
    }

    const where: WhereOptions<NearbyVeterinaryHospital> = {
      status: 'ACTIVE',
      [Op.or]: orFilters,
      ...(searchFilters.length ? { [Op.and]: [{ [Op.or]: searchFilters }] } : {}),
    };

    let records = await this.veterinaryHospitalModel.findAll({
      where,
      include,
    });

    if (!records.length) {
      const fallbackWhere: WhereOptions<NearbyVeterinaryHospital> = {
        status: 'ACTIVE',
        villageId: inputValue,
        ...(searchFilters.length ? { [Op.or]: searchFilters } : {}),
      };

      records = await this.veterinaryHospitalModel.findAll({
        where: fallbackWhere,
        include,
      });
    }

    return {
      status: 200,
      body: { veterinary_hospitals: records.map((record) => this.toLocationResponse(record)) },
    };
  }

  private buildFilters(query: Record<string, string | undefined>) {
    const filters: Record<string, string> = { status: 'ACTIVE' };

    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }

      switch (key) {
        case '_id':
        case 'id':
          filters.id = value;
          break;
        case 'status':
          filters.status = value;
          break;
        case 'name':
          filters.name = value;
          break;
        case 'address':
          filters.address = value;
          break;
        case 'map_location':
          filters.mapLocation = value;
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
        case 'doctor_name':
          filters.doctorName = value;
          break;
        case 'goshala_id':
          filters.goshalaId = value;
          break;
        case 'desc':
          filters.desc = value;
          break;
        case 'contact_number':
          filters.contactNumber = value;
          break;
        default:
          break;
      }
    });

    return filters;
  }

  private mapPayload(payload: Record<string, unknown>, userPayload?: Record<string, unknown>) {
    const id = typeof payload._id === 'string'
      ? payload._id
      : typeof payload.id === 'string'
        ? payload.id
        : undefined;

    const data: CreationAttributes<NearbyVeterinaryHospital> = {
      id,
      name: typeof payload.name === 'string' ? payload.name : '',
      address: typeof payload.address === 'string' ? payload.address : null,
      mapLocation: typeof payload.map_location === 'string'
        ? payload.map_location
        : typeof payload.mapLocation === 'string'
          ? payload.mapLocation
          : null,
      imageLocation: payload.image_location ?? payload.imageLocation ?? null,
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
          : this.resolveUserId(userPayload),
      doctorName: typeof payload.doctor_name === 'string'
        ? payload.doctor_name
        : typeof payload.doctorName === 'string'
          ? payload.doctorName
          : null,
      goshalaId: typeof payload.goshala_id === 'string'
        ? payload.goshala_id
        : typeof payload.goshalaId === 'string'
          ? payload.goshalaId
          : null,
      desc: typeof payload.desc === 'string' ? payload.desc : null,
      status: typeof payload.status === 'string' ? payload.status : null,
      createdAt: payload.created_at instanceof Date
        ? payload.created_at
        : typeof payload.created_at === 'string'
          ? new Date(payload.created_at)
          : new Date(),
      contactNumber: typeof payload.contact_number === 'string'
        ? payload.contact_number
        : typeof payload.contactNumber === 'string'
          ? payload.contactNumber
          : null,
      licenseCopy: payload.license_copy ?? payload.licenseCopy ?? null,
    } as CreationAttributes<NearbyVeterinaryHospital>;

    return data;
  }

  private mapUpdatePayload(payload: Record<string, unknown>) {
    const update: Partial<NearbyVeterinaryHospital> = {};

    if (Object.prototype.hasOwnProperty.call(payload, 'name') && typeof payload.name === 'string') {
      update.name = payload.name;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'address') && typeof payload.address === 'string') {
      update.address = payload.address;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'map_location') && typeof payload.map_location === 'string') {
      update.mapLocation = payload.map_location;
    } else if (Object.prototype.hasOwnProperty.call(payload, 'mapLocation') && typeof payload.mapLocation === 'string') {
      update.mapLocation = payload.mapLocation;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'temple_id') && typeof payload.temple_id === 'string') {
      update.templeId = payload.temple_id;
    } else if (Object.prototype.hasOwnProperty.call(payload, 'templeId') && typeof payload.templeId === 'string') {
      update.templeId = payload.templeId;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'village_id') && typeof payload.village_id === 'string') {
      update.villageId = payload.village_id;
    } else if (Object.prototype.hasOwnProperty.call(payload, 'villageId') && typeof payload.villageId === 'string') {
      update.villageId = payload.villageId;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'doctor_name') && typeof payload.doctor_name === 'string') {
      update.doctorName = payload.doctor_name;
    } else if (Object.prototype.hasOwnProperty.call(payload, 'doctorName') && typeof payload.doctorName === 'string') {
      update.doctorName = payload.doctorName;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'goshala_id') && typeof payload.goshala_id === 'string') {
      update.goshalaId = payload.goshala_id;
    } else if (Object.prototype.hasOwnProperty.call(payload, 'goshalaId') && typeof payload.goshalaId === 'string') {
      update.goshalaId = payload.goshalaId;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'desc') && typeof payload.desc === 'string') {
      update.desc = payload.desc;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'contact_number') && typeof payload.contact_number === 'string') {
      update.contactNumber = payload.contact_number;
    } else if (Object.prototype.hasOwnProperty.call(payload, 'contactNumber') && typeof payload.contactNumber === 'string') {
      update.contactNumber = payload.contactNumber;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'status') && typeof payload.status === 'string') {
      update.status = payload.status;
    }

    return update;
  }

  private toResponse(record: NearbyVeterinaryHospital): Record<string, unknown> {
    return {
      _id: record.id,
      name: record.name ?? null,
      address: record.address ?? null,
      map_location: record.mapLocation ?? null,
      image_location: this.mapFileList(this.parseList(record.imageLocation)),
      temple_id: record.templeId ?? null,
      village_id: record.villageId ?? null,
      user_id: record.userId ?? null,
      doctor_name: record.doctorName ?? null,
      goshala_id: record.goshalaId ?? null,
      desc: record.desc ?? null,
      status: record.status ?? null,
      created_at: record.createdAt ?? null,
      contact_number: record.contactNumber ?? null,
      license_copy: this.mapFileList(this.parseList(record.licenseCopy)),
    };
  }

  private toLocationResponse(record: NearbyVeterinaryHospital): Record<string, unknown> {
    return {
      _id: record.id,
      name: record.name ?? null,
      address: record.address ?? null,
      map_location: record.mapLocation ?? null,
      image_location: this.mapFileList(this.parseList(record.imageLocation)),
      temple_id: record.templeId ?? null,
      village_id: this.mapVillage((record as unknown as { village?: Village | null }).village),
      user_id: record.userId ?? null,
      doctor_name: record.doctorName ?? null,
      goshala_id: record.goshalaId ?? null,
      desc: record.desc ?? null,
      status: record.status ?? null,
      created_at: record.createdAt ?? null,
      contact_number: record.contactNumber ?? null,
      license_copy: this.mapFileList(this.parseList(record.licenseCopy)),
    };
  }

  private mapVillage(village?: Village | null) {
    if (!village) {
      return null;
    }

    const block = village.block;
    const district = block?.district;
    const state = district?.state;
    const country = state?.country;

    return {
      _id: village.id,
      name: village.name,
      block: {
        block_id: block?.id ?? null,
        name: block?.name ?? null,
        district: {
          district_id: district?.id ?? null,
          name: district?.name ?? null,
          state: {
            state_id: state?.id ?? null,
            name: state?.name ?? null,
            country: {
              country_id: country?.id ?? null,
              name: country?.name ?? null,
            },
          },
        },
      },
    };
  }

  private parseList(raw: unknown): string[] {
    if (!raw) {
      return [];
    }

    if (Array.isArray(raw)) {
      return raw.map((item) => String(item).trim()).filter((item) => item && item !== 'null');
    }

    if (typeof raw === 'string') {
      const trimmed = raw.trim();

      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter((item) => item && item !== 'null');
        }
      } catch {
        // ignore
      }

      return trimmed
        .replace(/^[\[]|[\]]$/g, '')
        .split(',')
        .map((item) => item.replace(/['"]+/g, '').trim())
        .filter((item) => item && item !== 'null');
    }

    return [];
  }

  private storeList(list: string[]) {
    if (!list.length) {
      return null;
    }
    return JSON.stringify(list);
  }

  private mapFileList(list: string[]) {
    const baseUrl = this.getFileBaseUrl();
    if (!baseUrl) {
      return list;
    }
    return list.map((path) => `${baseUrl}${path}`);
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

  private resolveUserId(userPayload?: Record<string, unknown>) {
    if (!userPayload) {
      return null;
    }

    if (typeof userPayload.id === 'string') {
      return userPayload.id;
    }

    if (typeof userPayload.user_id === 'string') {
      return userPayload.user_id;
    }

    return null;
  }

  private async sendNotifications(userPayload: Record<string, unknown> | undefined, record: NearbyVeterinaryHospital) {
    const defaultRecipient = this.configService.get<string>('DEFAULT_FROM_EMAIL');

    const userName = typeof userPayload?.name === 'string'
      ? userPayload.name
      : typeof userPayload?.username === 'string'
        ? userPayload.username
        : 'Anonymous';

    const userEmail = typeof userPayload?.email === 'string' ? userPayload.email : null;

    const createdAt = GramadevataUtils.formatDjangoDateTime(new Date());
    const adminText = `Hospital ID: ${record.id}\nHospital Name: ${record.name ?? ''}\nCreated Time: ${createdAt}\n\nAdded By: ${userName}\nUser Email: ${userEmail ?? 'N/A'}`;

    await GramadevataUtils.sendAdminEmail(this.configService, {
      subject: 'New Veterinary Hospital Added',
      text: adminText,
      recipients: defaultRecipient ? [defaultRecipient] : [],
    });

    if (userEmail) {
      const userText = `Hi ${userName},\n\nYour veterinary hospital "${record.name ?? ''}" has been added successfully.\n\nHospital ID: ${record.id}\n\nThanks & Regards,\nSathayush Tech Solutions`;

      await GramadevataUtils.sendAdminEmail(this.configService, {
        subject: 'Veterinary Hospital Added Successfully',
        text: userText,
        recipients: [userEmail],
      });
    }
  }
}
