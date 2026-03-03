import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { TemplePriority } from './temple-priority.model';

@Injectable()
export class TemplePriorityService {
  constructor(
    @InjectModel(TemplePriority)
    private readonly priorityModel: typeof TemplePriority,
  ) {}

  private readonly priorityIds = [
    'b78ac071-d0b5-11ee-84bd-0242ac110002',
    'b78ac28e-d0b5-11ee-84bd-0242ac110002',
    '630f3239-f515-47fb-be8d-db727b9f2174',
    'd7df749f-97e8-4635-a211-371c44b3c31f',
  ];

  /* ── helpers ─────────────────────────────────────── */

  /** Serialize to Django TemplePrioritySerializer (fields = '__all__') */
  private toDto(r: TemplePriority): Record<string, any> {
    return {
      _id: r.id,
      name: r.name,
      desc: r.desc ?? null,
      shortname: r.shortname ?? null,
      created_at: r.createdAt ?? null,
    };
  }

  /* ── endpoints ───────────────────────────────────── */

  /**
   * Django: get_queryset filters to the 4 hardcoded priority IDs,
   * ordered by Case/When position.
   */
  async list(_query: Record<string, string | undefined>): Promise<any> {
    const records = await this.priorityModel.findAll({
      where: { id: { [Op.in]: this.priorityIds } },
    });

    const map = new Map(records.map((r) => [r.id, r] as const));
    const ordered = this.priorityIds.map((id) => map.get(id)).filter(Boolean) as TemplePriority[];

    return ordered.map((r) => this.toDto(r));
  }

  async create(body: Record<string, any>): Promise<any> {
    const record = await this.priorityModel.create({
      name: body.name,
      desc: body.desc,
      shortname: body.shortname,
    } as any);

    return this.toDto(record);
  }

  async retrieve(id: string): Promise<any> {
    const record = await this.priorityModel.findByPk(id);
    if (!record) {
      throw new NotFoundException({ message: 'Data not found', status: 404 });
    }
    return this.toDto(record);
  }

  async update(id: string, body: Record<string, any>): Promise<any> {
    const record = await this.priorityModel.findByPk(id);
    if (!record) {
      throw new NotFoundException({ message: 'Data not found', status: 404 });
    }

    if (body.name !== undefined) record.name = body.name;
    if (body.desc !== undefined) record.desc = body.desc;
    if (body.shortname !== undefined) record.shortname = body.shortname;

    await record.save();
    return this.toDto(record);
  }

  async remove(id: string): Promise<void> {
    const record = await this.priorityModel.findByPk(id);
    if (!record) {
      throw new NotFoundException({ message: 'Data not found', status: 404 });
    }
    await record.destroy();
  }
}
