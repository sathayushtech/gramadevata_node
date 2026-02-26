import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { VisitTemple } from './visit-temple.model';
import { Temple } from './temple.model';
import { Goshala } from '../goshalas/goshala.model';
import { Event } from '../events/event.model';

export type VisitTempleResponse = {
  _id: string;
  user_id: string | null;
  temple_id: string | null;
  created_at: Date | null;
  temple_name: string | null;
  temple_image: string | null;
  event_id: string | null;
  event_name: string | null;
  event_image: string | null;
  goshala_id: string | null;
  goshala_name: string | null;
  goshala_image: string | null;
};

@Injectable()
export class VisitTempleService {
  constructor(
    @InjectModel(VisitTemple)
    private readonly visitTempleModel: typeof VisitTemple,
    private readonly configService: ConfigService,
  ) {}

  async list(): Promise<VisitTempleResponse[]> {
    const rows = await this.visitTempleModel.findAll({
      include: [Temple, Event, Goshala],
      order: [['createdAt', 'DESC']],
    });

    return rows.map((row) => this.toResponse(row));
  }

  async getById(id: string): Promise<VisitTempleResponse | null> {
    const row = await this.visitTempleModel.findByPk(id, { include: [Temple, Event, Goshala] });
    return row ? this.toResponse(row) : null;
  }

  async create(payload: Record<string, unknown>, user: { user_id?: string } | undefined): Promise<VisitTempleResponse> {
    const userId = user?.user_id;
    if (!userId) {
      // Matches the custom NotAuthenticated message in Django perform_create.
      throw new HttpException({ detail: 'You must be logged in to add a visit.' }, 401);
    }

    const templeId = typeof payload.temple_id === 'string' ? payload.temple_id : undefined;
    const eventId = typeof payload.event_id === 'string' ? payload.event_id : undefined;
    const goshalaId = typeof payload.goshala_id === 'string' ? payload.goshala_id : undefined;

    if (templeId) {
      const exists = await this.visitTempleModel.count({ where: { userId, templeId } });
      if (exists) {
        throw new HttpException({ detail: 'Already visited this temple.' }, 400);
      }
    }

    if (eventId) {
      const exists = await this.visitTempleModel.count({ where: { userId, eventId } });
      if (exists) {
        throw new HttpException({ detail: 'Already visited this event.' }, 400);
      }
    }

    if (goshalaId) {
      const exists = await this.visitTempleModel.count({ where: { userId, goshalaId } });
      if (exists) {
        throw new HttpException({ detail: 'Already visited this goshala.' }, 400);
      }
    }

    const created = await this.visitTempleModel.create({
      userId,
      ...(templeId ? { templeId } : {}),
      ...(eventId ? { eventId } : {}),
      ...(goshalaId ? { goshalaId } : {}),
    } as any);

    const reloaded = await this.visitTempleModel.findByPk(created.id, { include: [Temple, Event, Goshala] });
    return this.toResponse(reloaded ?? created);
  }

  async update(id: string, payload: Record<string, unknown>): Promise<VisitTempleResponse | null> {
    const row = await this.visitTempleModel.findByPk(id);
    if (!row) {
      return null;
    }

    await row.update({
      ...(typeof payload.temple_id === 'string' ? { templeId: payload.temple_id } : {}),
      ...(typeof payload.event_id === 'string' ? { eventId: payload.event_id } : {}),
      ...(typeof payload.goshala_id === 'string' ? { goshalaId: payload.goshala_id } : {}),
      ...(typeof payload.user_id === 'string' ? { userId: payload.user_id } : {}),
    } as any);

    const reloaded = await this.visitTempleModel.findByPk(id, { include: [Temple, Event, Goshala] });
    return reloaded ? this.toResponse(reloaded) : this.toResponse(row);
  }

  async remove(id: string): Promise<boolean> {
    const deleted = await this.visitTempleModel.destroy({ where: { id } });
    return deleted > 0;
  }

  private toResponse(row: VisitTemple): VisitTempleResponse {
    const plain = row.get({ plain: true }) as any;

    const temple: Temple | undefined = (row as any).temple;
    const event: Event | undefined = (row as any).event;
    const goshala: Goshala | undefined = (row as any).goshala;

    return {
      _id: String(plain.id),
      user_id: plain.userId ?? null,
      temple_id: plain.templeId ?? null,
      created_at: plain.createdAt ?? null,
      temple_name: temple?.name ?? null,
      temple_image: this.extractFirstImageUrl((temple as any)?.imageLocation),
      event_id: plain.eventId ?? null,
      event_name: event?.name ?? null,
      event_image: this.extractFirstImageUrl((event as any)?.imageLocation),
      goshala_id: plain.goshalaId ?? null,
      goshala_name: goshala?.name ?? null,
      goshala_image: this.extractFirstImageUrl((goshala as any)?.imageLocation),
    };
  }

  private extractFirstImageUrl(value: unknown): string | null {
    const paths = this.parseImagePaths(value);
    if (!paths.length) {
      return null;
    }

    const first = paths[0];
    const fileUrl = this.configService.get<string>('FILE_URL');
    if (!fileUrl) {
      return first;
    }

    const trimmed = fileUrl.endsWith('/') ? fileUrl.slice(0, -1) : fileUrl;
    return `${trimmed}/${first.startsWith('/') ? first.slice(1) : first}`;
  }

  private parseImagePaths(value: unknown): string[] {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (typeof value !== 'string') {
      return [];
    }

    const raw = value.trim();
    if (!raw || raw.toLowerCase() === 'null') {
      return [];
    }

    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.trim())
            .filter(Boolean);
        }
      } catch {
        // fallthrough
      }

      const cleaned = raw
        .slice(1, -1)
        .replace(/\"/g, '')
        .replace(/"/g, '')
        .replace(/'/g, '');

      return cleaned
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    }

    return [raw];
  }
}
