import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import type { CreationAttributes } from 'sequelize';
import { VillagePostOffice } from '../village-post-office.model';
import { coerceList, normalizeSnakePayload, toDjangoKeys, toFileUrlList } from '../village.serializer';
import { saveEntityImagesToAzure } from '../../../common/utils/gramadevata.utils';

@Injectable()
export class VillagePostOfficesService {
  constructor(
    @InjectModel(VillagePostOffice)
    private readonly model: typeof VillagePostOffice,
    private readonly configService: ConfigService,
  ) {}

  private serialize(instance: VillagePostOffice) {
    const plain = instance.get({ plain: true }) as unknown as Record<string, unknown>;
    const out = toDjangoKeys(plain);
    out.image_location = toFileUrlList(this.configService, plain.imageLocation);
    return out;
  }

  private looksLikeBase64(value: string) {
    return value.includes('base64,');
  }

  async list() {
    const records = await this.model.findAll({ order: [['createdAt', 'DESC']] });
    return records.map((r) => this.serialize(r));
  }

  async getById(id: string) {
    const record = await this.model.findByPk(id);
    return record ? this.serialize(record) : null;
  }

  async create(payload: Record<string, unknown>) {
    const images = coerceList(payload.image_location);
    const requestData = normalizeSnakePayload(payload);
    delete (requestData as any).imageLocation;

    const created = await this.model.create({
      ...(requestData as CreationAttributes<VillagePostOffice>),
      imageLocation: [],
    } as CreationAttributes<VillagePostOffice>);

    const savedImages = await saveEntityImagesToAzure({
      configService: this.configService,
      images,
      id: created.id,
      name: 'image_location',
      entityType: 'village-postoffice',
    });

    if (savedImages.length) {
      await created.update({ imageLocation: savedImages } as CreationAttributes<VillagePostOffice>);
    }

    return this.serialize(created);
  }

  async update(id: string, payload: Record<string, unknown>) {
    const instance = await this.model.findByPk(id);
    if (!instance) return null;

    const images = coerceList(payload.image_location);
    const requestData = normalizeSnakePayload(payload);
    delete (requestData as any).imageLocation;

    await instance.update(requestData as CreationAttributes<VillagePostOffice>);

    if (images.length) {
      if (images.some((x) => this.looksLikeBase64(x))) {
        const savedImages = await saveEntityImagesToAzure({
          configService: this.configService,
          images,
          id: instance.id,
          name: 'image_location',
          entityType: 'village-postoffice',
        });
        await instance.update({ imageLocation: savedImages } as CreationAttributes<VillagePostOffice>);
      } else {
        await instance.update({ imageLocation: images } as CreationAttributes<VillagePostOffice>);
      }
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
