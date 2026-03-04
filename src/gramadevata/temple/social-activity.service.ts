import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SocialActivity } from './social-activity.model';
import { EntityStatus } from '../../common/enums';

export type SocialActivityResponse = Record<string, unknown>;

@Injectable()
export class SocialActivityService {
  constructor(
    @InjectModel(SocialActivity)
    private readonly socialActivityModel: typeof SocialActivity,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  LIST (GET /) — status=ACTIVE + query params                        */
  /* ------------------------------------------------------------------ */
  async listActive(
    query: Record<string, string | undefined>,
  ): Promise<SocialActivityResponse[]> {
    const where: Record<string, unknown> = { status: EntityStatus.ACTIVE };

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || key === 'format') continue;
      where[this.mapQueryKey(key)] = value;
    }

    const rows = await this.socialActivityModel.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    return rows.map((row) => this.toResponse(row));
  }

  /* ------------------------------------------------------------------ */
  /*  CREATE (POST /)                                                    */
  /* ------------------------------------------------------------------ */
  async create(payload: Record<string, unknown>): Promise<SocialActivityResponse> {
    const created = await this.socialActivityModel.create({
      ...(typeof payload._id === 'string' && payload._id.trim() ? { id: payload._id.trim() } : {}),
      ...(typeof payload.temple_id === 'string' ? { templeId: payload.temple_id } : {}),
      ...(typeof payload.user_id === 'string' ? { userId: payload.user_id } : {}),
      ...(typeof payload.annadhanam === 'string' ? { annadhaanam: payload.annadhanam } : {}),
      ...(typeof payload.annadhaanam === 'string' ? { annadhaanam: payload.annadhaanam } : {}),
      ...(typeof payload.marriage_hall === 'string' ? { marriageHall: payload.marriage_hall } : {}),
      ...(typeof payload.naamkarann === 'string' ? { naamkarann: payload.naamkarann } : {}),
      ...(typeof payload.barasala === 'string' ? { barasala: payload.barasala } : {}),
      ...(typeof payload.aksharabhyasam === 'string' ? { aksharabhyasam: payload.aksharabhyasam } : {}),
      ...(typeof payload.upanayanam === 'string' ? { upanayanam: payload.upanayanam } : {}),
      ...(typeof payload.tulabharam === 'string' ? { tulabharam: payload.tulabharam } : {}),
      ...(typeof payload.ear_piercing === 'string' ? { earPiercing: payload.ear_piercing } : {}),
      ...(typeof payload.annaprashanam === 'string' ? { annaprashanam: payload.annaprashanam } : {}),
      ...(typeof payload.head_shave === 'string' ? { headShave: payload.head_shave } : {}),
      ...(typeof payload.danaas === 'string' ? { danaas: payload.danaas } : {}),
      ...(typeof payload.status === 'string' ? { status: payload.status } : {}),
      createdAt: new Date(),
    } as any);

    return this.toResponse(created);
  }

  /* ------------------------------------------------------------------ */
  /*  RETRIEVE (GET /:id) — ACTIVE only (get_queryset filters)           */
  /* ------------------------------------------------------------------ */
  async getActiveById(id: string): Promise<SocialActivityResponse | null> {
    const instance = await this.socialActivityModel.findOne({
      where: { id, status: EntityStatus.ACTIVE },
    });
    return instance ? this.toResponse(instance) : null;
  }

  /* ------------------------------------------------------------------ */
  /*  UPDATE (PUT / PATCH /:id) — ACTIVE only                            */
  /* ------------------------------------------------------------------ */
  async updateActive(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<SocialActivityResponse | null> {
    const instance = await this.socialActivityModel.findOne({
      where: { id, status: EntityStatus.ACTIVE },
    });
    if (!instance) return null;

    await instance.update({
      ...(typeof payload.temple_id === 'string' ? { templeId: payload.temple_id } : {}),
      ...(typeof payload.user_id === 'string' ? { userId: payload.user_id } : {}),
      ...(typeof payload.annadhanam === 'string' ? { annadhaanam: payload.annadhanam } : {}),
      ...(typeof payload.annadhaanam === 'string' ? { annadhaanam: payload.annadhaanam } : {}),
      ...(typeof payload.marriage_hall === 'string' ? { marriageHall: payload.marriage_hall } : {}),
      ...(typeof payload.naamkarann === 'string' ? { naamkarann: payload.naamkarann } : {}),
      ...(typeof payload.barasala === 'string' ? { barasala: payload.barasala } : {}),
      ...(typeof payload.aksharabhyasam === 'string' ? { aksharabhyasam: payload.aksharabhyasam } : {}),
      ...(typeof payload.upanayanam === 'string' ? { upanayanam: payload.upanayanam } : {}),
      ...(typeof payload.tulabharam === 'string' ? { tulabharam: payload.tulabharam } : {}),
      ...(typeof payload.ear_piercing === 'string' ? { earPiercing: payload.ear_piercing } : {}),
      ...(typeof payload.annaprashanam === 'string' ? { annaprashanam: payload.annaprashanam } : {}),
      ...(typeof payload.head_shave === 'string' ? { headShave: payload.head_shave } : {}),
      ...(typeof payload.danaas === 'string' ? { danaas: payload.danaas } : {}),
      ...(typeof payload.status === 'string' ? { status: payload.status } : {}),
    } as any);

    return this.toResponse(instance);
  }

  /* ------------------------------------------------------------------ */
  /*  DESTROY (DELETE /:id) — ACTIVE only                                */
  /* ------------------------------------------------------------------ */
  async removeActive(id: string): Promise<boolean> {
    const deleted = await this.socialActivityModel.destroy({
      where: { id, status: EntityStatus.ACTIVE },
    });
    return deleted > 0;
  }

  /* ------------------------------------------------------------------ */
  /*  Serializer — matches Django fields = '__all__'                     */
  /* ------------------------------------------------------------------ */
  private toResponse(row: SocialActivity): SocialActivityResponse {
    const plain = row.get({ plain: true }) as any;
    return {
      _id: String(plain.id),
      temple_id: plain.templeId ?? null,
      user_id: plain.userId ?? null,
      annadhanam: plain.annadhaanam ?? null,
      marriage_hall: plain.marriageHall ?? null,
      naamkarann: plain.naamkarann ?? null,
      barasala: plain.barasala ?? null,
      aksharabhyasam: plain.aksharabhyasam ?? null,
      upanayanam: plain.upanayanam ?? null,
      tulabharam: plain.tulabharam ?? null,
      ear_piercing: plain.earPiercing ?? null,
      annaprashanam: plain.annaprashanam ?? null,
      head_shave: plain.headShave ?? null,
      danaas: plain.danaas ?? null,
      status: plain.status ?? null,
      created_at: plain.createdAt ?? null,
    };
  }

  private mapQueryKey(key: string): string {
    const map: Record<string, string> = {
      temple_id: 'templeId',
      user_id: 'userId',
      annadhanam: 'annadhaanam',
      marriage_hall: 'marriageHall',
      ear_piercing: 'earPiercing',
      head_shave: 'headShave',
      created_at: 'createdAt',
    };
    return map[key] ?? key;
  }
}
