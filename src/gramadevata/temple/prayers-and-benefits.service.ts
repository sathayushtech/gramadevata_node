import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { PrayersAndBenefits } from './prayers-and-benefits.model';
import { EntityStatus } from '../../common/enums';
import { formatDjangoDateTime, sendAdminEmail } from '../../common/utils/gramadevata.utils';

export type PrayersAndBenefitsResponse = Record<string, unknown>;

@Injectable()
export class PrayersAndBenefitsService {
  constructor(
    @InjectModel(PrayersAndBenefits)
    private readonly prayersModel: typeof PrayersAndBenefits,
    private readonly configService: ConfigService,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  LIST (GET /) — status=ACTIVE + query params                        */
  /* ------------------------------------------------------------------ */
  async listActive(
    query: Record<string, string | undefined>,
  ): Promise<PrayersAndBenefitsResponse[]> {
    const where: Record<string, unknown> = { status: EntityStatus.ACTIVE };

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || key === 'format') continue;
      where[this.mapQueryKey(key)] = value;
    }

    const rows = await this.prayersModel.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    return rows.map((row) => this.toResponse(row));
  }

  /* ------------------------------------------------------------------ */
  /*  CREATE (POST /) — saves user_id, sends email                       */
  /* ------------------------------------------------------------------ */
  async create(payload: Record<string, unknown>): Promise<PrayersAndBenefitsResponse> {
    const now = new Date();

    const created = await this.prayersModel.create({
      ...(typeof payload._id === 'string' && payload._id.trim() ? { id: payload._id.trim() } : {}),
      ...(typeof payload.temple_id === 'string' ? { templeId: payload.temple_id } : {}),
      ...(typeof payload.user_id === 'string' ? { userId: payload.user_id } : {}),
      ...(typeof payload.homam === 'string' ? { homam: payload.homam } : {}),
      ...(typeof payload.special_vratas === 'string' ? { specialVratas: payload.special_vratas } : {}),
      ...(typeof payload.sevas === 'string' ? { sevas: payload.sevas } : {}),
      ...(typeof payload.abshikam === 'string' ? { abshikam: payload.abshikam } : {}),
      ...(typeof payload.kalyanam === 'string' ? { kalyanam: payload.kalyanam } : {}),
      ...(typeof payload.status === 'string' ? { status: payload.status } : {}),
      createdAt: now,
    } as any);

    // Send admin email notification (matches Django create behavior)
    await sendAdminEmail(this.configService, {
      subject: 'New Prayer and Benefit Added',
      text:
        `User ID: ${typeof payload.user_id === 'string' ? payload.user_id : ''}\n` +
        `Created Time: ${formatDjangoDateTime(now)}\n` +
        `Temple ID: ${created.templeId ?? ''}\n` +
        `Entry ID: ${String(created.id)}`,
      recipients: [this.configService.get<string>('DEFAULT_FROM_EMAIL')].filter(
        (email): email is string => typeof email === 'string' && email.trim().length > 0,
      ),
    });

    return this.toResponse(created);
  }

  /* ------------------------------------------------------------------ */
  /*  RETRIEVE (GET /:id) — ACTIVE only                                  */
  /* ------------------------------------------------------------------ */
  async getActiveById(id: string): Promise<PrayersAndBenefitsResponse | null> {
    const instance = await this.prayersModel.findOne({
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
  ): Promise<PrayersAndBenefitsResponse | null> {
    const instance = await this.prayersModel.findOne({
      where: { id, status: EntityStatus.ACTIVE },
    });
    if (!instance) return null;

    await instance.update({
      ...(typeof payload.temple_id === 'string' ? { templeId: payload.temple_id } : {}),
      ...(typeof payload.user_id === 'string' ? { userId: payload.user_id } : {}),
      ...(typeof payload.homam === 'string' ? { homam: payload.homam } : {}),
      ...(typeof payload.special_vratas === 'string' ? { specialVratas: payload.special_vratas } : {}),
      ...(typeof payload.sevas === 'string' ? { sevas: payload.sevas } : {}),
      ...(typeof payload.abshikam === 'string' ? { abshikam: payload.abshikam } : {}),
      ...(typeof payload.kalyanam === 'string' ? { kalyanam: payload.kalyanam } : {}),
      ...(typeof payload.status === 'string' ? { status: payload.status } : {}),
    } as any);

    return this.toResponse(instance);
  }

  /* ------------------------------------------------------------------ */
  /*  DESTROY (DELETE /:id) — ACTIVE only                                */
  /* ------------------------------------------------------------------ */
  async removeActive(id: string): Promise<boolean> {
    const deleted = await this.prayersModel.destroy({
      where: { id, status: EntityStatus.ACTIVE },
    });
    return deleted > 0;
  }

  /* ------------------------------------------------------------------ */
  /*  Serializer — matches Django fields = '__all__'                     */
  /* ------------------------------------------------------------------ */
  private toResponse(row: PrayersAndBenefits): PrayersAndBenefitsResponse {
    const plain = row.get({ plain: true }) as any;
    return {
      _id: String(plain.id),
      temple_id: plain.templeId ?? null,
      user_id: plain.userId ?? null,
      homam: plain.homam ?? null,
      special_vratas: plain.specialVratas ?? null,
      sevas: plain.sevas ?? null,
      abshikam: plain.abshikam ?? null,
      kalyanam: plain.kalyanam ?? null,
      status: plain.status ?? null,
      created_at: plain.createdAt ?? null,
    };
  }

  private mapQueryKey(key: string): string {
    const map: Record<string, string> = {
      temple_id: 'templeId',
      user_id: 'userId',
      special_vratas: 'specialVratas',
      created_at: 'createdAt',
    };
    return map[key] ?? key;
  }
}
