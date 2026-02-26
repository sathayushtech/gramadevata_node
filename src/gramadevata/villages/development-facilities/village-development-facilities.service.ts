import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import type { CreationAttributes } from 'sequelize';
import { VillageDevelopmentFacility } from '../village-development-facility.model';
import { coerceList, toDjangoKeys, toFileUrlList } from '../village.serializer';
import { saveEntityImagesToAzure } from '../../../common/utils/gramadevata.utils';

@Injectable()
export class VillageDevelopmentFacilitiesService {
  constructor(
    @InjectModel(VillageDevelopmentFacility)
    private readonly model: typeof VillageDevelopmentFacility,
    private readonly configService: ConfigService,
  ) {}

  private serialize(instance: VillageDevelopmentFacility) {
    const plain = instance.get({ plain: true }) as unknown as Record<string, unknown>;
    const out = toDjangoKeys(plain);
    out.primarysource_of_livelihood_image = toFileUrlList(this.configService, plain.primarysourceOfLivelihoodImage);
    return out;
  }

  async list() {
    const records = await this.model.findAll({ order: [['createdAt', 'DESC']] });
    return records.map((r) => this.serialize(r));
  }

  async getById(id: string) {
    const record = await this.model.findByPk(id);
    return record ? this.serialize(record) : null;
  }

  private looksLikeBase64Image(value: unknown) {
    return typeof value === 'string' && value.includes('base64,');
  }

  async create(payload: Record<string, unknown>) {
    const images = coerceList(payload.primarysource_of_livelihood_image);

    const requestData: Record<string, unknown> = { ...payload, primarysource_of_livelihood_image: [] };

    const created = await this.model.create({
      ...(requestData as CreationAttributes<VillageDevelopmentFacility>),
      primarysourceOfLivelihoodImage: [],
    } as CreationAttributes<VillageDevelopmentFacility>);

    const savedImages = await saveEntityImagesToAzure({
      configService: this.configService,
      images,
      id: created.id,
      name: 'primary_livelihood',
      entityType: 'village_development_facilities',
    });

    if (savedImages.length) {
      await created.update({
        primarysourceOfLivelihoodImage: savedImages,
      } as CreationAttributes<VillageDevelopmentFacility>);
    }

    return this.serialize(created);
  }

  async update(id: string, payload: Record<string, unknown>) {
    const instance = await this.model.findByPk(id);
    if (!instance) return null;

    const incomingImages = coerceList(payload.primarysource_of_livelihood_image);

    // Django doesn't override update; keep behavior conservative.
    const requestData: Record<string, unknown> = { ...payload };
    delete (requestData as any).primarysource_of_livelihood_image;

    await instance.update(requestData as CreationAttributes<VillageDevelopmentFacility>);

    // If client sends base64 images (common), mimic create() logic and store azure paths.
    if (incomingImages.some((x) => this.looksLikeBase64Image(x))) {
      const savedImages = await saveEntityImagesToAzure({
        configService: this.configService,
        images: incomingImages,
        id: instance.id,
        name: 'primary_livelihood',
        entityType: 'village_development_facilities',
      });

      if (savedImages.length) {
        await instance.update({
          primarysourceOfLivelihoodImage: savedImages,
        } as CreationAttributes<VillageDevelopmentFacility>);
      }
    } else if (incomingImages.length) {
      // If client sends already-saved paths, persist them.
      await instance.update({
        primarysourceOfLivelihoodImage: incomingImages,
      } as CreationAttributes<VillageDevelopmentFacility>);
    }

    return this.serialize(instance);
  }

  async remove(id: string) {
    const instance = await this.model.findByPk(id);
    if (!instance) return false;
    await instance.destroy();
    return true;
  }
}
