import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import type { CreationAttributes } from 'sequelize';
import { VillageFamousPersonality } from '../village-famous-personality.model';
import { coerceList, toDjangoKeys, toFileUrlList } from '../village.serializer';
import {
  formatDjangoDateTime,
  saveEntityImagesToAzure,
  sendAdminEmail,
} from '../../../common/utils/gramadevata.utils';

@Injectable()
export class VillageFamousPersonalitiesService {
  constructor(
    @InjectModel(VillageFamousPersonality)
    private readonly model: typeof VillageFamousPersonality,
    private readonly configService: ConfigService,
  ) {}

  private serialize(instance: VillageFamousPersonality) {
    const plain = instance.get({ plain: true }) as unknown as Record<string, unknown>;
    const out = toDjangoKeys(plain);
    out.person_image = toFileUrlList(this.configService, plain.personImage);
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

  async create(payload: Record<string, unknown>, opts: { userId?: string }) {
    const userId = opts.userId;
    if (!userId) {
      throw new Error('User is not authenticated');
    }

    const images = coerceList(payload.person_image);

    const created = await this.model.create({
      ...(payload as CreationAttributes<VillageFamousPersonality>),
      personImage: [],
    } as CreationAttributes<VillageFamousPersonality>);

    const savedImages = await saveEntityImagesToAzure({
      configService: this.configService,
      images,
      id: created.id,
      name: String(created.personName || 'Unknown'),
      entityType: 'famous_personality',
    });

    if (savedImages.length) {
      await created.update({ personImage: savedImages } as CreationAttributes<VillageFamousPersonality>);
    }

    const recipient = this.configService.get<string>('EMAIL_HOST_USER');
    await sendAdminEmail(this.configService, {
      subject: 'New Village Famous Personality Added',
      text:
        `User ID: ${userId}\n` +
        `Created Time: ${formatDjangoDateTime(new Date())}\n` +
        `Personality ID: ${created.id}\n` +
        `Person Name: ${created.personName ?? ''}`,
      recipients: recipient ? [recipient] : [],
    });

    return { message: 'success', result: this.serialize(created) };
  }

  async update(id: string, payload: Record<string, unknown>, opts: { userId?: string; fullName?: string }) {
    const userId = opts.userId;
    if (!userId) {
      throw new Error('User is not authenticated');
    }

    const instance = await this.model.findByPk(id);
    if (!instance) return null;

    const images = coerceList(payload.person_image);

    // Update non-image fields first.
    const { person_image: _ignored, ...rest } = payload as any;
    await instance.update(rest as CreationAttributes<VillageFamousPersonality>);

    const savedImages = await saveEntityImagesToAzure({
      configService: this.configService,
      images,
      id: instance.id,
      name: String(instance.personName || 'Unknown'),
      entityType: 'famous_personality',
    });

    if (savedImages.length) {
      await instance.update({ personImage: savedImages } as CreationAttributes<VillageFamousPersonality>);
    }

    const recipient = this.configService.get<string>('EMAIL_HOST_USER');
    await sendAdminEmail(this.configService, {
      subject: 'Village Famous Personality Updated',
      text:
        `User ID: ${userId}\n` +
        (opts.fullName ? `Full Name: ${opts.fullName}\n` : '') +
        `Updated Time: ${formatDjangoDateTime(new Date())}\n` +
        `Personality ID: ${instance.id}\n` +
        `Person Name: ${instance.personName ?? ''}`,
      recipients: recipient ? [recipient] : [],
    });

    return { message: 'updated successfully', data: this.serialize(instance) };
  }

  async remove(id: string) {
    const instance = await this.model.findByPk(id);
    if (!instance) return false;
    await instance.destroy();
    return true;
  }
}
