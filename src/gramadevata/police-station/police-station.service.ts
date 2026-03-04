import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { PoliceStation } from './police-station.model';
import { EntityStatus } from '../../common/enums';
import {
  coerceStringList,
  formatDjangoDateTime,
  saveEntityImagesToAzure,
  sendAdminEmail,
} from '../../common/utils/gramadevata.utils';

export type PoliceStationResponse = Record<string, unknown>;

@Injectable()
export class PoliceStationService {
  constructor(
    @InjectModel(PoliceStation)
    private readonly policeStationModel: typeof PoliceStation,
    private readonly configService: ConfigService,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  LIST (GET /) — filters by query params + status=ACTIVE             */
  /* ------------------------------------------------------------------ */
  async listActive(
    query: Record<string, string | undefined>,
  ): Promise<PoliceStationResponse[] | { message: string; status: number }> {
    const where: Record<string, unknown> = { status: EntityStatus.ACTIVE };

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || key === 'format') continue;
      where[this.mapQueryKey(key)] = value;
    }

    const rows = await this.policeStationModel.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    if (!rows.length) {
      return { message: 'Data not found', status: 404 };
    }

    return rows.map((row) => this.toProcessed(row));
  }

  /* ------------------------------------------------------------------ */
  /*  CREATE  (POST /)                                                   */
  /* ------------------------------------------------------------------ */
  async create(payload: Record<string, unknown>): Promise<PoliceStationResponse> {
    const now = new Date();
    const imageLocations = coerceStringList(payload.image_location);

    const created = await this.policeStationModel.create({
      ...(typeof payload._id === 'string' && payload._id.trim() ? { id: payload._id.trim() } : {}),
      ...(typeof payload.name === 'string' ? { name: payload.name } : {}),
      ...(typeof payload.address === 'string' ? { address: payload.address } : {}),
      ...(typeof payload.contact_number === 'string' ? { contactNumber: payload.contact_number } : {}),
      ...(typeof payload.map_location === 'string' ? { mapLocation: payload.map_location } : {}),
      ...(typeof payload.temple_id === 'string' ? { templeId: payload.temple_id } : {}),
      ...(typeof payload.village_id === 'string' ? { villageId: payload.village_id } : {}),
      ...(typeof payload.user_id === 'string' ? { userId: payload.user_id } : {}),
      ...(typeof payload.tourism_places === 'string' ? { tourismPlaces: payload.tourism_places } : {}),
      ...(typeof payload.status === 'string' ? { status: payload.status } : {}),
      createdAt: payload.created_at ? this.parseDate(payload.created_at) : now,
      imageLocation: null,
    } as any);

    // Upload images to Azure
    const savedImages = await saveEntityImagesToAzure({
      configService: this.configService,
      images: imageLocations,
      id: String(created.id),
      name: (created.name ?? 'policestation').toString(),
      entityType: 'policestation',
    });
    if (savedImages.length) {
      await created.update({ imageLocation: savedImages } as any);
    }

    // Send admin email notification
    await sendAdminEmail(this.configService, {
      subject: 'New PoliceStation Added',
      text:
        `User ID: ${typeof payload.user_id === 'string' ? payload.user_id : 'Anonymous'}\n` +
        `Created Time: ${formatDjangoDateTime(created.createdAt ?? now)}\n` +
        `policestation ID: ${String(created.id)}\n` +
        `policestation Name: ${created.name ?? ''}`,
      recipients: [this.configService.get<string>('DEFAULT_FROM_EMAIL')].filter(
        (email): email is string => typeof email === 'string' && email.trim().length > 0,
      ),
    });

    return this.toRaw(created);
  }

  /* ------------------------------------------------------------------ */
  /*  RETRIEVE (GET /:id) — ACTIVE only                                  */
  /* ------------------------------------------------------------------ */
  async getActiveById(id: string): Promise<PoliceStationResponse | null> {
    const instance = await this.policeStationModel.findOne({
      where: { id, status: EntityStatus.ACTIVE },
    });
    return instance ? this.toProcessed(instance) : null;
  }

  /* ------------------------------------------------------------------ */
  /*  UPDATE (PUT / PATCH /:id)                                          */
  /* ------------------------------------------------------------------ */
  async update(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<PoliceStationResponse | null> {
    const instance = await this.policeStationModel.findOne({ where: { id } });
    if (!instance) return null;

    const imageLocations =
      payload.image_location !== undefined
        ? coerceStringList(payload.image_location)
        : null;

    await instance.update({
      ...(typeof payload.name === 'string' ? { name: payload.name } : {}),
      ...(typeof payload.address === 'string' ? { address: payload.address } : {}),
      ...(typeof payload.contact_number === 'string' ? { contactNumber: payload.contact_number } : {}),
      ...(typeof payload.map_location === 'string' ? { mapLocation: payload.map_location } : {}),
      ...(typeof payload.temple_id === 'string' ? { templeId: payload.temple_id } : {}),
      ...(typeof payload.village_id === 'string' ? { villageId: payload.village_id } : {}),
      ...(typeof payload.user_id === 'string' ? { userId: payload.user_id } : {}),
      ...(typeof payload.tourism_places === 'string' ? { tourismPlaces: payload.tourism_places } : {}),
      ...(typeof payload.status === 'string' ? { status: payload.status } : {}),
      ...(imageLocations !== null ? { imageLocation: null } : {}),
    } as any);

    if (imageLocations !== null) {
      const savedImages = await saveEntityImagesToAzure({
        configService: this.configService,
        images: imageLocations,
        id: String(instance.id),
        name: (instance.name ?? 'policestation').toString(),
        entityType: 'policestation',
      });
      if (savedImages.length) {
        await instance.update({ imageLocation: savedImages } as any);
      }
    }

    return this.toProcessed(instance);
  }

  /* ------------------------------------------------------------------ */
  /*  DESTROY (DELETE /:id)                                              */
  /* ------------------------------------------------------------------ */
  async remove(id: string): Promise<boolean> {
    const deleted = await this.policeStationModel.destroy({ where: { id } });
    return deleted > 0;
  }

  /* ------------------------------------------------------------------ */
  /*  Serializers                                                        */
  /* ------------------------------------------------------------------ */
  private toRaw(row: PoliceStation): PoliceStationResponse {
    const plain = row.get({ plain: true }) as any;
    return {
      _id: String(plain.id),
      name: plain.name ?? null,
      address: plain.address ?? null,
      contact_number: plain.contactNumber ?? null,
      map_location: plain.mapLocation ?? null,
      temple_id: plain.templeId ?? null,
      village_id: plain.villageId ?? null,
      user_id: plain.userId ?? null,
      image_location: this.parseImagePaths(plain.imageLocation),
      created_at: plain.createdAt ?? null,
      status: plain.status ?? null,
      tourism_places: plain.tourismPlaces ?? null,
    };
  }

  private toProcessed(row: PoliceStation): PoliceStationResponse {
    const base = this.toRaw(row);
    const images = Array.isArray(base.image_location)
      ? this.resolveImageLocation(base.image_location as string[])
      : [];
    return { ...base, image_location: images };
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */
  private resolveImageLocation(paths: string[]): string[] {
    if (!paths.length) return [];
    const fileUrl = this.configService.get<string>('FILE_URL');
    if (!fileUrl) return paths;
    const trimmed = fileUrl.endsWith('/') ? fileUrl.slice(0, -1) : fileUrl;
    return paths.map((p) => `${trimmed}/${p.startsWith('/') ? p.slice(1) : p}`);
  }

  private parseImagePaths(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (typeof value !== 'string') return [];
    const raw = value.trim();
    if (!raw || raw.toLowerCase() === 'null') return [];
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
        /* fallthrough */
      }
      const cleaned = raw
        .slice(1, -1)
        .replace(/"/g, '')
        .replace(/'/g, '');
      return cleaned
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    }
    return [raw];
  }

  private mapQueryKey(key: string): string {
    const map: Record<string, string> = {
      temple_id: 'templeId',
      village_id: 'villageId',
      user_id: 'userId',
      contact_number: 'contactNumber',
      map_location: 'mapLocation',
      image_location: 'imageLocation',
      tourism_places: 'tourismPlaces',
      created_at: 'createdAt',
    };
    return map[key] ?? key;
  }

  private parseDate(value: unknown): Date {
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }
}
