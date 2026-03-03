import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TemplePoojaTiming } from './pooja-timing.model';
import { EntityStatus } from '../../common/enums';

@Injectable()
export class TemplePoojaTimingService {
  constructor(
    @InjectModel(TemplePoojaTiming)
    private readonly poojaTimingModel: typeof TemplePoojaTiming,
  ) {}

  /* ── helpers ─────────────────────────────────────── */

  /**
   * Serialize to Django-compatible TemplePoojaTimingSerializer (fields = '__all__').
   */
  private toDto(r: TemplePoojaTiming): Record<string, any> {
    return {
      _id: r.id,
      temple_id: r.templeId ?? null,
      pooja_name: r.poojaName ?? null,
      start_time: r.startTime ?? null,
      end_time: r.endTime ?? null,
      days: r.days ?? null,
      desc: r.desc ?? null,
      status: r.status ?? null,
      created_at: r.createdAt ?? null,
      user_id: r.userId ?? null,
    };
  }

  /* ── endpoints ───────────────────────────────────── */

  /**
   * Django: list – filter(**query_params), always force status=ACTIVE.
   * Returns 404 body when no records found.
   * Django Meta ordering = ['start_time'].
   */
  async list(query: Record<string, string | undefined>): Promise<any> {
    const where: Record<string, unknown> = { status: EntityStatus.ACTIVE };

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      if (key === 'page' || key === 'page_size') continue;
      if (key === 'status') continue; // always ACTIVE

      if (key === '_id' || key === 'id') where.id = value;
      else if (key === 'temple_id') where.templeId = value;
      else if (key === 'pooja_name') where.poojaName = value;
      else if (key === 'user_id') where.userId = value;
      else if (key === 'days') where.days = value;
    }

    const records = await this.poojaTimingModel.findAll({
      where,
      order: [['start_time', 'ASC']],
    });

    if (!records.length) {
      return { message: 'Data not found', status: 404 };
    }
    return records.map((r) => this.toDto(r));
  }

  /**
   * Django: create – standard ModelViewSet create.
   */
  async create(body: Record<string, any>): Promise<any> {
    const record = await this.poojaTimingModel.create({
      templeId: body.temple_id,
      poojaName: body.pooja_name,
      startTime: body.start_time,
      endTime: body.end_time,
      days: body.days,
      desc: body.desc,
      status: body.status,
      userId: body.user_id,
    } as any);

    return this.toDto(record);
  }

  /**
   * Django: retrieve – only returns ACTIVE records.
   */
  async retrieve(id: string): Promise<any> {
    const record = await this.poojaTimingModel.findOne({
      where: { id, status: EntityStatus.ACTIVE },
    });
    if (!record) {
      throw new NotFoundException({ message: 'Pooja timing record not found', status: 404 });
    }
    return this.toDto(record);
  }

  /**
   * Django: update / partial_update – standard ModelViewSet.
   */
  async update(id: string, body: Record<string, any>): Promise<any> {
    const record = await this.poojaTimingModel.findByPk(id);
    if (!record) {
      throw new NotFoundException({ message: 'Pooja timing record not found', status: 404 });
    }

    if (body.temple_id !== undefined) record.templeId = body.temple_id;
    if (body.pooja_name !== undefined) record.poojaName = body.pooja_name;
    if (body.start_time !== undefined) record.startTime = body.start_time;
    if (body.end_time !== undefined) record.endTime = body.end_time;
    if (body.days !== undefined) record.days = body.days;
    if (body.desc !== undefined) record.desc = body.desc;
    if (body.status !== undefined) record.status = body.status;
    if (body.user_id !== undefined) record.userId = body.user_id;

    await record.save();
    return this.toDto(record);
  }

  /**
   * Django: destroy – standard ModelViewSet.
   */
  async remove(id: string): Promise<void> {
    const record = await this.poojaTimingModel.findByPk(id);
    if (!record) {
      throw new NotFoundException({ message: 'Pooja timing record not found', status: 404 });
    }
    await record.destroy();
  }
}
