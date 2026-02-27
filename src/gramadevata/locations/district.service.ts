import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import type { CreationAttributes, WhereOptions } from 'sequelize';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';

type CreateResult = {
  status: number;
  body: Record<string, unknown>;
};

@Injectable()
export class DistrictService {
  constructor(
    @InjectModel(District)
    private readonly districtModel: typeof District,
    @InjectModel(State)
    private readonly stateModel: typeof State,
    private readonly configService: ConfigService
  ) {}

  async list(query: Record<string, string | undefined>): Promise<Record<string, unknown>[]> {
    const where: WhereOptions<District> = this.buildWhereClause(query);

    const districts = await this.districtModel.findAll({
      where,
      include: [{ model: State, as: 'state' }],
    });

    if (!districts || districts.length === 0) {
      return [];
    }

    return districts.map((district) => this.toResponse(district));
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const district = await this.districtModel.findByPk(id, {
      include: [{ model: State, as: 'state' }],
    });

    if (!district) {
      return null;
    }

    return this.toResponse(district);
  }

  async create(payload: Record<string, unknown>): Promise<CreateResult> {
    try {
      if (!payload.name || typeof payload.name !== 'string') {
        return {
          status: 400,
          body: { message: 'Name is required', status: 400 },
        };
      }

      if (!payload.state_id || typeof payload.state_id !== 'string') {
        return {
          status: 400,
          body: { message: 'State ID is required', status: 400 },
        };
      }

      const state = await this.stateModel.findByPk(payload.state_id as string);
      if (!state) {
        return {
          status: 404,
          body: { message: 'State not found', status: 404 },
        };
      }

      let imageLocations: string[] = [];
      if (payload.image_location) {
        const images = GramadevataUtils.coerceStringList(payload.image_location);
        const tempId = `temp-${Date.now()}`;
        imageLocations = await this.saveImagesToAzure(images, tempId, payload.name as string);
      }

      const createData: Partial<CreationAttributes<District>> = {
        name: payload.name as string,
        stateId: payload.state_id as string,
        desc: payload.desc as string | undefined,
        imageLocation: imageLocations.length > 0 ? JSON.stringify(imageLocations) : undefined,
      };

      const district = await this.districtModel.create(createData as CreationAttributes<District>);

      if (imageLocations.length > 0) {
        const updatedImages = await this.saveImagesToAzure(
          GramadevataUtils.coerceStringList(payload.image_location),
          district.id,
          district.name
        );
        await district.update({ imageLocation: JSON.stringify(updatedImages) });
      }

      return {
        status: 201,
        body: this.toResponse(district),
      };
    } catch (error) {
      console.error('Error creating district:', error);
      return {
        status: 500,
        body: { message: 'Internal server error', status: 500 },
      };
    }
  }

  async update(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const district = await this.districtModel.findByPk(id);

    if (!district) {
      return null;
    }

    if (payload.image_location !== undefined) {
      const images = GramadevataUtils.coerceStringList(payload.image_location);
      const updatedImages = await this.saveImagesToAzure(images, district.id, district.name);
      payload.image_location = updatedImages.length > 0 ? JSON.stringify(updatedImages) : null;
    }

    const updateData: Partial<District> = {};
    if (payload.name !== undefined) updateData.name = payload.name as string;
    if (payload.desc !== undefined) updateData.desc = payload.desc as string;
    if (payload.state_id !== undefined) {
      const state = await this.stateModel.findByPk(payload.state_id as string);
      if (!state) {
        throw new NotFoundException('State not found');
      }
      updateData.stateId = payload.state_id as string;
    }
    if (payload.image_location !== undefined) updateData.imageLocation = (payload.image_location as string) || undefined;

    await district.update(updateData);
    await district.reload({ include: [{ model: State, as: 'state' }] });

    return this.toResponse(district);
  }

  async delete(id: string): Promise<boolean> {
    const district = await this.districtModel.findByPk(id);

    if (!district) {
      return false;
    }

    await district.destroy();
    return true;
  }

  private buildWhereClause(query: Record<string, string | undefined>): WhereOptions<District> {
    const where: WhereOptions<District> = {};

    const fieldMap: Record<string, string> = {
      _id: 'id',
      name: 'name',
      state: 'stateId',
      state_id: 'stateId',
      type: 'type',
    };

    for (const [key, value] of Object.entries(query)) {
      if (['page', 'page_size', 'pageSize', 'page_no', 'ordering'].includes(key)) {
        continue;
      }

      if (value === undefined || value === null || value === '') {
        continue;
      }

      const modelField = fieldMap[key] || key;
      (where as Record<string, unknown>)[modelField] = value;
    }

    return where;
  }

  private toResponse(district: District): Record<string, unknown> {
    const rawBaseUrl = this.configService.get<string>('File_path') || '';
    const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

    let imageLocations: string[] = [];
    if (district.imageLocation) {
      try {
        const parsed = typeof district.imageLocation === 'string'
          ? JSON.parse(district.imageLocation)
          : district.imageLocation;
        imageLocations = Array.isArray(parsed) ? parsed : [parsed as string];
      } catch {
        imageLocations = [];
      }
    }

    const imageLocationUrls = imageLocations
      .filter(Boolean)
      .map((pathValue) => {
        if (pathValue.startsWith('http://') || pathValue.startsWith('https://')) {
          return pathValue;
        }
        if (!baseUrl) {
          return pathValue;
        }
        return `${baseUrl}/${pathValue}`;
      });

    return {
      _id: district.id,
      name: district.name,
      state: district.stateId,
      desc: district.desc ?? null,
      image_location: imageLocationUrls,
    };
  }

  async saveImagesToAzure(images: string[], id: string, name: string): Promise<string[]> {
    if (!images || images.length === 0) {
      return [];
    }
    return GramadevataUtils.saveEntityImagesToAzure({
      configService: this.configService,
      images,
      id,
      name,
      entityType: 'district',
    });
  }

  async sendNotificationEmail(subject: string, text: string, recipients: string[]): Promise<void> {
    if (!recipients || recipients.length === 0) {
      return;
    }
    await GramadevataUtils.sendAdminEmail(this.configService, {
      subject,
      text,
      recipients,
    });
  }
}
