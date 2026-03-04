import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Media } from './media.model';
import { EntityStatus } from '../../common/enums';
import { saveEntityVideosToAzure } from '../../common/utils/gramadevata.utils';

export type MediaResponse = Record<string, unknown>;

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Media)
    private readonly mediaModel: typeof Media,
    private readonly configService: ConfigService,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  LIST (GET /) — ACTIVE only                                         */
  /* ------------------------------------------------------------------ */
  async listActive(): Promise<MediaResponse[]> {
    const rows = await this.mediaModel.findAll({
      where: { status: EntityStatus.ACTIVE },
      order: [['createdAt', 'DESC']],
    });
    return rows.map((row) => this.toResponse(row));
  }

  /* ------------------------------------------------------------------ */
  /*  CREATE (POST /) — uploads videos to Azure                          */
  /* ------------------------------------------------------------------ */
  async create(
    payload: Record<string, unknown>,
    userId?: string,
  ): Promise<MediaResponse> {
    // Process video uploads
    let videoDataList = this.coerceList(payload.video);
    const savedVideoPaths: string[] = [];

    if (videoDataList.length && userId) {
      const saved = await saveEntityVideosToAzure({
        configService: this.configService,
        videos: videoDataList,
        id: userId,
        name: 'media_video',
        entityType: 'media',
      });
      savedVideoPaths.push(...saved);
    }

    const created = await this.mediaModel.create({
      ...(typeof payload._id === 'string' && payload._id.trim()
        ? { id: payload._id.trim() }
        : {}),
      ...(typeof payload.title === 'string' ? { title: payload.title } : {}),
      ...(typeof payload.desc === 'string' ? { desc: payload.desc } : {}),
      video: savedVideoPaths.length ? savedVideoPaths : [],
      createdAt: new Date(),
      ...(typeof payload.user_id === 'string'
        ? { userId: payload.user_id }
        : userId
          ? { userId }
          : {}),
      ...(typeof payload.temple_id === 'string'
        ? { templeId: payload.temple_id }
        : {}),
      ...(typeof payload.village_id === 'string'
        ? { villageId: payload.village_id }
        : {}),
      ...(typeof payload.status === 'string'
        ? { status: payload.status }
        : {}),
    } as any);

    return this.toResponse(created);
  }

  /* ------------------------------------------------------------------ */
  /*  RETRIEVE (GET /:id) — ACTIVE only                                  */
  /* ------------------------------------------------------------------ */
  async getActiveById(id: string): Promise<MediaResponse | null> {
    const instance = await this.mediaModel.findOne({
      where: { id, status: EntityStatus.ACTIVE },
    });
    return instance ? this.toResponse(instance) : null;
  }

  /* ------------------------------------------------------------------ */
  /*  UPDATE (PUT / PATCH /:id) — uploads new videos to Azure            */
  /* ------------------------------------------------------------------ */
  async update(
    id: string,
    payload: Record<string, unknown>,
    userId?: string,
  ): Promise<MediaResponse | null> {
    const instance = await this.mediaModel.findByPk(id);
    if (!instance) return null;

    // Process video uploads
    const videoDataList = this.coerceList(payload.video);
    const savedVideoPaths: string[] = [];

    const effectiveUserId =
      typeof payload.user_id === 'string'
        ? payload.user_id
        : userId ?? (instance.userId ? String(instance.userId) : undefined);

    if (videoDataList.length && effectiveUserId) {
      const saved = await saveEntityVideosToAzure({
        configService: this.configService,
        videos: videoDataList,
        id: effectiveUserId,
        name: 'media_video',
        entityType: 'media',
      });
      savedVideoPaths.push(...saved);
    }

    // Build update payload (exclude video from direct serialization)
    await instance.update({
      ...(typeof payload.title === 'string' ? { title: payload.title } : {}),
      ...(typeof payload.desc === 'string' ? { desc: payload.desc } : {}),
      ...(typeof payload.user_id === 'string'
        ? { userId: payload.user_id }
        : {}),
      ...(typeof payload.temple_id === 'string'
        ? { templeId: payload.temple_id }
        : {}),
      ...(typeof payload.village_id === 'string'
        ? { villageId: payload.village_id }
        : {}),
      ...(typeof payload.status === 'string'
        ? { status: payload.status }
        : {}),
    } as any);

    // Save uploaded videos separately
    if (savedVideoPaths.length) {
      instance.video = savedVideoPaths;
      await instance.save();
    }

    return this.toResponse(instance);
  }

  /* ------------------------------------------------------------------ */
  /*  DESTROY (DELETE /:id)                                              */
  /* ------------------------------------------------------------------ */
  async remove(id: string): Promise<boolean> {
    const deleted = await this.mediaModel.destroy({ where: { id } });
    return deleted > 0;
  }

  /* ------------------------------------------------------------------ */
  /*  Serializer — matches Django fields = '__all__'                     */
  /* ------------------------------------------------------------------ */
  private toResponse(row: Media): MediaResponse {
    const plain = row.get({ plain: true }) as any;

    // Resolve video URLs
    const rawVideo = this.coerceList(plain.video);
    const resolvedVideo = this.resolveFileUrls(rawVideo);

    return {
      _id: String(plain.id),
      title: plain.title ?? null,
      desc: plain.desc ?? null,
      video: resolvedVideo,
      created_at: plain.createdAt ?? null,
      user_id: plain.userId ?? null,
      temple_id: plain.templeId ?? null,
      village_id: plain.villageId ?? null,
      status: plain.status ?? null,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */
  private resolveFileUrls(paths: string[]): string[] {
    if (!paths.length) return [];
    const fileUrl = this.configService.get<string>('FILE_URL');
    if (!fileUrl) return paths;
    const trimmed = fileUrl.endsWith('/') ? fileUrl.slice(0, -1) : fileUrl;
    return paths.map((p) =>
      `${trimmed}/${p.startsWith('/') ? p.slice(1) : p}`,
    );
  }

  private coerceList(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (typeof value === 'string') {
      const raw = value.trim();
      if (!raw || raw.toLowerCase() === 'null') return [];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.trim())
            .filter(Boolean);
        }
      } catch {
        /* not JSON */
      }
      return [raw];
    }
    return [];
  }
}
