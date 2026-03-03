import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import type { CreationAttributes } from 'sequelize';
import { Op } from 'sequelize';
import { EntityStatus } from '../../common/enums';
import { coerceList, toFileUrlList } from '../../common/utils/django-serializer';
import * as GramadevataUtils from '../../common/utils/gramadevata.utils';
import { TempleFestival } from './temple-festival.model';

@Injectable()
export class TempleFestivalService {
  constructor(
    @InjectModel(TempleFestival)
    private readonly festivalModel: typeof TempleFestival,
    private readonly configService: ConfigService,
  ) {}

  private parseList(raw: unknown) {
    return coerceList(raw).filter((v) => v && v.toLowerCase() !== 'null');
  }

  private serialize(record: TempleFestival) {
    const plain = record.get({ plain: true }) as unknown as Record<string, unknown>;
    // Align keys with Django serializer (__all__) + FILE_URL prefix.
    return {
      _id: (plain as any).id,
      name: (plain as any).name ?? null,
      start_date: (plain as any).startDate ?? null,
      end_date: (plain as any).endDate ?? null,
      desc: (plain as any).desc ?? null,
      created_at: (plain as any).createdAt ?? null,
      temple_id: (plain as any).templeId ?? null,
      status: (plain as any).status ?? null,
      image_location: toFileUrlList(this.configService, (plain as any).imageLocation),
    };
  }

  async list(query: Record<string, string | undefined>) {
    const where: Record<string, unknown> = { status: EntityStatus.ACTIVE };
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      if (key === 'status') continue;
      if (key === 'page' || key === 'page_size') continue;
      if (key === 'temple_id') where.templeId = value;
      if (key === 'name') where.name = { [Op.like]: `%${value}%` };
    }

    const records = await this.festivalModel.findAll({ where });
    return records.map((r) => this.serialize(r));
  }

  async getById(id: string) {
    const record = await this.festivalModel.findByPk(id);
    if (!record) return null;
    if (record.status !== EntityStatus.ACTIVE) return 'inactive' as const;
    return this.serialize(record);
  }

  async create(payload: Record<string, unknown>, user?: Record<string, unknown>) {
    try {
      const imagesRaw = payload.image_location ?? payload.imageLocation;
      const images = this.parseList(imagesRaw);

      const created = await this.festivalModel.create({
        name: typeof payload.name === 'string' ? payload.name : null,
        startDate: typeof payload.start_date === 'string'
          ? payload.start_date
          : typeof payload.startDate === 'string'
            ? payload.startDate
            : null,
        endDate: typeof payload.end_date === 'string'
          ? payload.end_date
          : typeof payload.endDate === 'string'
            ? payload.endDate
            : null,
        desc: typeof payload.desc === 'string' ? payload.desc : null,
        templeId: typeof payload.temple_id === 'string'
          ? payload.temple_id
          : typeof payload.templeId === 'string'
            ? payload.templeId
            : null,
        status: typeof payload.status === 'string' ? payload.status : EntityStatus.INACTIVE,
        imageLocation: 'null' as unknown as TempleFestival['imageLocation'],
      } as CreationAttributes<TempleFestival>);

      const saved = await GramadevataUtils.saveEntityImagesToAzure({
        configService: this.configService,
        images,
        id: created.id,
        name: created.name ?? 'temple_festival',
        entityType: 'temple_festival',
      });

      if (saved.length) {
        // Store as JSON string (column is TEXT in DB).
        created.imageLocation = JSON.stringify(saved);
        await created.save();
      }

      const userId = typeof user?.id === 'string' ? user.id : typeof user?.user_id === 'string' ? (user as any).user_id : 'Anonymous';
      const userName = typeof user?.full_name === 'string' ? (user as any).full_name : '';
      const recipients = [this.configService.get<string>('DEFAULT_FROM_EMAIL')].filter(Boolean) as string[];
      await GramadevataUtils.sendAdminEmail(this.configService, {
        subject: 'New Temple Festival Added',
        text: `User ID: ${userId}\nFull Name: ${userName}\nCreated Time: ${new Date().toISOString()}\nFestival ID: ${created.id}\nFestival Name: ${created.name ?? ''}`,
        recipients,
      });

      return { status: 201, body: { message: 'success', result: this.serialize(created) } };
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
    try {
      const instance = await this.festivalModel.findByPk(id);
      if (!instance) {
        return { status: 404, body: { message: 'Data not found', status: 404 } };
      }

      const imagesRaw = payload.image_location ?? payload.imageLocation;
      const images = this.parseList(imagesRaw);

      const patch: Partial<TempleFestival> = {};
      if (typeof payload.name === 'string') patch.name = payload.name;
      if (typeof payload.start_date === 'string') patch.startDate = payload.start_date;
      if (typeof payload.startDate === 'string') patch.startDate = payload.startDate;
      if (typeof payload.end_date === 'string') patch.endDate = payload.end_date;
      if (typeof payload.endDate === 'string') patch.endDate = payload.endDate;
      if (typeof payload.desc === 'string') patch.desc = payload.desc;
      if (typeof payload.temple_id === 'string') patch.templeId = payload.temple_id;
      if (typeof payload.templeId === 'string') patch.templeId = payload.templeId;
      if (typeof payload.status === 'string') patch.status = payload.status;

      await instance.update(patch);

      if (images.length) {
        const existing = this.parseList(instance.imageLocation);
        const saved = await GramadevataUtils.saveEntityImagesToAzure({
          configService: this.configService,
          images,
          id: instance.id,
          name: instance.name ?? 'temple_festival',
          entityType: 'temple_festival',
        });
        const finalImages = [...existing, ...saved].filter(Boolean);
        if (finalImages.length) {
          instance.imageLocation = JSON.stringify(finalImages);
          await instance.save();
        }
      }

      return { status: 200, body: { message: 'updated successfully', result: this.serialize(instance) } };
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

  async remove(id: string) {
    const instance = await this.festivalModel.findByPk(id);
    if (!instance) {
      return { status: 404, body: { message: 'Data not found', status: 404 } };
    }
    await instance.destroy();
    return { status: 200, body: { message: 'deleted successfully' } };
  }
}
