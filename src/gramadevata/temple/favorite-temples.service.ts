import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { CreationAttributes, Op } from 'sequelize';
import { Register as User } from '../auth/user.model';
import { Event } from '../events/event.model';
import { Goshala } from '../goshalas/goshala.model';
import { Temple } from './temple.model';
import { FavoriteTemple } from './favorite-temple.model';

@Injectable()
export class FavoriteTemplesService {
  constructor(
    @InjectModel(FavoriteTemple)
    private readonly favoriteTempleModel: typeof FavoriteTemple,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Temple)
    private readonly templeModel: typeof Temple,
    @InjectModel(Goshala)
    private readonly goshalaModel: typeof Goshala,
    @InjectModel(Event)
    private readonly eventModel: typeof Event,
    private readonly configService: ConfigService
  ) {}

  async list(query: Record<string, string | undefined>) {
    const where: Record<string, unknown> = {};
    Object.entries(query).forEach(([key, value]) => {
      if (!value) {
        return;
      }
      if (key === '_id') {
        where.id = value;
        return;
      }
      where[key] = value;
    });

    const favorites = await this.favoriteTempleModel.findAll({
      where,
      include: [
        { model: this.templeModel, required: false },
        { model: this.goshalaModel, required: false },
        { model: this.eventModel, required: false },
      ],
      order: [['createdAt', 'DESC']],
    });

    return favorites.map((favorite) => this.toResponse(favorite));
  }

  async getById(id: string) {
    const favorite = await this.favoriteTempleModel.findByPk(id, {
      include: [
        { model: this.templeModel, required: false },
        { model: this.goshalaModel, required: false },
        { model: this.eventModel, required: false },
      ],
    });

    if (!favorite) {
      return null;
    }

    return this.toResponse(favorite);
  }

  async create(payload: Record<string, unknown>, userPayload?: Record<string, unknown>) {
    const user = await this.resolveUser(userPayload);
    if (!user) {
      throw new UnauthorizedException('You must be logged in to add a favorite.');
    }

    const templeId = this.toStringOrUndefined(payload.temple_id ?? payload.templeId);
    const eventId = this.toStringOrUndefined(payload.event_id ?? payload.eventId);
    const goshalaId = this.toStringOrUndefined(payload.goshala_id ?? payload.goshalaId);

    if (!templeId && !eventId && !goshalaId) {
      throw new BadRequestException('temple_id, event_id, or goshala_id is required.');
    }

    await this.assertNotDuplicate(user.id, templeId, eventId, goshalaId);

    const favorite = await this.favoriteTempleModel.create({
      userId: user.id,
      templeId,
      eventId,
      goshalaId,
    } as CreationAttributes<FavoriteTemple>);

    await favorite.reload({
      include: [
        { model: this.templeModel, required: false },
        { model: this.goshalaModel, required: false },
        { model: this.eventModel, required: false },
      ],
    });

    return this.toResponse(favorite);
  }

  async update(id: string, payload: Record<string, unknown>) {
    const favorite = await this.favoriteTempleModel.findByPk(id);
    if (!favorite) {
      return null;
    }

    const updateData: Partial<FavoriteTemple> = {};
    if (payload.temple_id !== undefined || payload.templeId !== undefined) {
      updateData.templeId = this.toStringOrUndefined(payload.temple_id ?? payload.templeId);
    }
    if (payload.event_id !== undefined || payload.eventId !== undefined) {
      updateData.eventId = this.toStringOrUndefined(payload.event_id ?? payload.eventId);
    }
    if (payload.goshala_id !== undefined || payload.goshalaId !== undefined) {
      updateData.goshalaId = this.toStringOrUndefined(payload.goshala_id ?? payload.goshalaId);
    }

    await favorite.update(updateData);
    await favorite.reload({
      include: [
        { model: this.templeModel, required: false },
        { model: this.goshalaModel, required: false },
        { model: this.eventModel, required: false },
      ],
    });

    return this.toResponse(favorite);
  }

  async remove(id: string) {
    const favorite = await this.favoriteTempleModel.findByPk(id);
    if (!favorite) {
      return false;
    }

    await favorite.destroy();
    return true;
  }

  private async assertNotDuplicate(
    userId: string,
    templeId?: string,
    eventId?: string,
    goshalaId?: string
  ) {
    if (templeId) {
      const exists = await this.favoriteTempleModel.findOne({
        where: { userId, templeId },
      });
      if (exists) {
        throw new BadRequestException({ detail: 'Already favorite this temple.' });
      }
    }

    if (eventId) {
      const exists = await this.favoriteTempleModel.findOne({
        where: { userId, eventId },
      });
      if (exists) {
        throw new BadRequestException({ detail: 'Already favorite this event.' });
      }
    }

    if (goshalaId) {
      const exists = await this.favoriteTempleModel.findOne({
        where: { userId, goshalaId },
      });
      if (exists) {
        throw new BadRequestException({ detail: 'Already favorite this goshala.' });
      }
    }
  }

  private toResponse(favorite: FavoriteTemple) {
    const plain = favorite.get({ plain: true }) as FavoriteTemple & {
      temple?: Temple;
      goshala?: Goshala;
      event?: Event;
    };

    return {
      _id: plain.id,
      user_id: plain.userId ?? null,
      temple_id: plain.templeId ?? null,
      created_at: plain.createdAt ?? null,
      temple_name: plain.temple?.name ?? null,
      temple_image: this.firstImageUrl(plain.temple?.imageLocation),
      event_id: plain.eventId ?? null,
      event_image: this.firstImageUrl(plain.event?.imageLocation),
      goshala_id: plain.goshalaId ?? null,
      goshala_image: this.firstImageUrl(plain.goshala?.imageLocation),
    };
  }

  private firstImageUrl(raw: unknown) {
    const list = this.parseList(raw);
    if (!list.length) {
      return null;
    }

    const rawBase = this.configService.get<string>('FILE_URL')
      || this.configService.get<string>('File_path')
      || '';
    const base = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

    if (!base) {
      return list[0];
    }

    return `${base}/${list[0].replace(/^\/+/, '')}`;
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
        .replace(/\[|\]/g, '')
        .split(',')
        .map((item) => item.replace(/['"]+/g, '').trim())
        .filter(Boolean);
    }

    return [];
  }

  private toStringOrUndefined(value: unknown) {
    if (typeof value === 'string') {
      return value.trim() || undefined;
    }
    if (value === null || value === undefined) {
      return undefined;
    }
    return String(value);
  }

  private async resolveUser(userPayload?: Record<string, unknown>) {
    if (!userPayload) {
      return null;
    }

    const userId = userPayload.user_id ?? userPayload.id;
    if (userId) {
      const user = await this.userModel.findByPk(String(userId));
      if (user) {
        return user;
      }
    }

    const email = typeof userPayload.email === 'string' ? userPayload.email : undefined;
    const contactNumber = typeof userPayload.contact_number === 'string' ? userPayload.contact_number : undefined;
    const username = typeof userPayload.username === 'string' ? userPayload.username : undefined;

    if (email) {
      const user = await this.userModel.findOne({ where: { email } });
      if (user) {
        return user;
      }
    }

    if (contactNumber) {
      const user = await this.userModel.findOne({ where: { contactNumber } });
      if (user) {
        return user;
      }
    }

    if (username) {
      const user = await this.userModel.findOne({ where: { username } });
      if (user) {
        return user;
      }
    }

    return null;
  }
}
