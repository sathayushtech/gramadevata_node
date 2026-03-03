import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TempleTransport } from '../events/temple-transport.model';
import { EntityStatus } from '../../common/enums';

@Injectable()
export class TempleTransportService {
  constructor(
    @InjectModel(TempleTransport)
    private readonly transportModel: typeof TempleTransport,
  ) {}

  /* ── helpers ─────────────────────────────────────── */

  /**
   * Serialize to Django-compatible TempleTransportSerializer output (fields = '__all__').
   */
  private toDto(r: TempleTransport): Record<string, any> {
    return {
      _id: r.id,
      desc: r.desc ?? null,
      created_at: r.createdAt ?? null,
      temple_id: r.templeId ?? null,
      village_id: r.villageId ?? null,
      status: r.status ?? null,
      user_id: r.userId ?? null,
      map_location: r.mapLocation ?? null,
      transport_type: r.transportType ?? null,
      event_id: r.eventId ?? null,
      tourism_places: r.tourismPlaces ?? null,
    };
  }

  /* ── endpoints ───────────────────────────────────── */

  /**
   * Django: list – filter(**query_params), always force status=ACTIVE.
   * Returns 404 body when no records found.
   */
  async list(query: Record<string, string | undefined>): Promise<any> {
    const where: Record<string, unknown> = { status: EntityStatus.ACTIVE };

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      if (key === 'page' || key === 'page_size') continue;
      if (key === 'status') continue; // always ACTIVE

      if (key === '_id' || key === 'id') where.id = value;
      else if (key === 'temple_id') where.templeId = value;
      else if (key === 'village_id') where.villageId = value;
      else if (key === 'user_id') where.userId = value;
      else if (key === 'transport_type') where.transportType = value;
      else if (key === 'event_id') where.eventId = value;
      else if (key === 'tourism_places') where.tourismPlaces = value;
    }

    const records = await this.transportModel.findAll({ where });
    if (!records.length) {
      return { message: 'Data not found', status: 404 };
    }
    return records.map((r) => this.toDto(r));
  }

  /**
   * Django: create – standard ModelViewSet create.
   */
  async create(body: Record<string, any>): Promise<any> {
    const record = await this.transportModel.create({
      desc: body.desc,
      templeId: body.temple_id,
      villageId: body.village_id,
      status: body.status,
      userId: body.user_id,
      mapLocation: body.map_location,
      transportType: body.transport_type,
      eventId: body.event_id,
      tourismPlaces: body.tourism_places,
    } as any);

    return this.toDto(record);
  }

  /**
   * Django: retrieve – only returns ACTIVE records.
   */
  async retrieve(id: string): Promise<any> {
    const record = await this.transportModel.findOne({
      where: { id, status: EntityStatus.ACTIVE },
    });
    if (!record) {
      throw new NotFoundException({ message: 'Transport record not found', status: 404 });
    }
    return this.toDto(record);
  }

  /**
   * Django: update / partial_update – standard ModelViewSet.
   */
  async update(id: string, body: Record<string, any>): Promise<any> {
    const record = await this.transportModel.findByPk(id);
    if (!record) {
      throw new NotFoundException({ message: 'Transport record not found', status: 404 });
    }

    if (body.desc !== undefined) record.desc = body.desc;
    if (body.temple_id !== undefined) record.templeId = body.temple_id;
    if (body.village_id !== undefined) record.villageId = body.village_id;
    if (body.status !== undefined) record.status = body.status;
    if (body.user_id !== undefined) record.userId = body.user_id;
    if (body.map_location !== undefined) record.mapLocation = body.map_location;
    if (body.transport_type !== undefined) record.transportType = body.transport_type;
    if (body.event_id !== undefined) record.eventId = body.event_id;
    if (body.tourism_places !== undefined) record.tourismPlaces = body.tourism_places;

    await record.save();
    return this.toDto(record);
  }

  /**
   * Django: destroy – standard ModelViewSet.
   */
  async remove(id: string): Promise<void> {
    const record = await this.transportModel.findByPk(id);
    if (!record) {
      throw new NotFoundException({ message: 'Transport record not found', status: 404 });
    }
    await record.destroy();
  }
}
