import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { literal } from 'sequelize';
import { TempleFacilities } from './temple-facilities.model';
import { EntityStatus } from '../../common/enums';

@Injectable()
export class TempleFacilitiesService {
  constructor(
    @InjectModel(TempleFacilities)
    private readonly facilitiesModel: typeof TempleFacilities,
  ) {}

  /* ── helpers ─────────────────────────────────────── */

  /**
   * Serialize to Django-compatible TempleFacilitiesSerializer output.
   * Keys use Django model **field names** (not db_column names).
   */
  private toDto(r: TempleFacilities): Record<string, any> {
    return {
      _id: r.id,
      temple_id: r.templeId ?? null,
      user_id: r.userId ?? null,
      pooja_shops: r.poojaShops ?? null,
      restroom: r.restroom ?? null,
      drinking_water: r.drinkingWater ?? null,
      accommodation: r.accommodation ?? null,
      restaurants: r.restaurants ?? null,
      lockers: r.lockers ?? null,
      shoe_rack: r.shoeRack ?? null,
      physical_disabilities_services: r.physicalDisabilitiesServices ?? null,
      medical_emergency: r.medicalEmergency ?? null,
      chemist_pharmacy: r.chemistPharmacy ?? null,
      status: r.status ?? null,
      created_at: r.createdAt ?? null,
    };
  }

  /* ── endpoints ───────────────────────────────────── */

  async list(query: Record<string, string | undefined>): Promise<any> {
    const where: Record<string, unknown> = {
      status: EntityStatus.ACTIVE,
    };

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      if (key === 'page' || key === 'page_size') continue;
      if (key === 'status') continue;

      if (key === '_id' || key === 'id') where.id = value;
      else if (key === 'temple_id') where.templeId = value;
      else if (key === 'user_id') where.userId = value;
    }

    const records = await this.facilitiesModel.findAll({
      where,
      order: [['createdAt', 'DESC']],
      attributes: {
        exclude: ['physicalDisabilitiesServices'],
        include: [[literal('`physical_disabilities_services(wheelchair)`'), 'physicalDisabilitiesServices']],
      },
    });
    return records.map((r) => this.toDto(r));
  }

  async create(body: Record<string, any>): Promise<any> {
    const record = await this.facilitiesModel.create({
      templeId: body.temple_id,
      userId: body.user_id,
      poojaShops: body.pooja_shops,
      restroom: body.restroom,
      drinkingWater: body.drinking_water,
      accommodation: body.accommodation,
      restaurants: body.restaurants,
      lockers: body.lockers,
      shoeRack: body.shoe_rack,
      physicalDisabilitiesServices: body.physical_disabilities_services,
      medicalEmergency: body.medical_emergency,
      chemistPharmacy: body.chemist_pharmacy,
      status: body.status,
    } as any);

    return this.toDto(record);
  }

  async getById(id: string): Promise<any> {
    const record = await this.facilitiesModel.findByPk(id);
    if (!record) return null;
    if (record.status !== EntityStatus.ACTIVE) return 'inactive' as const;

    return this.toDto(record);
  }

  async update(id: string, body: Record<string, any>): Promise<any> {
    const record = await this.facilitiesModel.findByPk(id);
    if (!record) {
      throw new NotFoundException({ message: 'Data not found', status: 404 });
    }

    if (body.temple_id !== undefined) record.templeId = body.temple_id;
    if (body.user_id !== undefined) record.userId = body.user_id;
    if (body.pooja_shops !== undefined) record.poojaShops = body.pooja_shops;
    if (body.restroom !== undefined) record.restroom = body.restroom;
    if (body.drinking_water !== undefined) record.drinkingWater = body.drinking_water;
    if (body.accommodation !== undefined) record.accommodation = body.accommodation;
    if (body.restaurants !== undefined) record.restaurants = body.restaurants;
    if (body.lockers !== undefined) record.lockers = body.lockers;
    if (body.shoe_rack !== undefined) record.shoeRack = body.shoe_rack;
    if (body.physical_disabilities_services !== undefined) record.physicalDisabilitiesServices = body.physical_disabilities_services;
    if (body.medical_emergency !== undefined) record.medicalEmergency = body.medical_emergency;
    if (body.chemist_pharmacy !== undefined) record.chemistPharmacy = body.chemist_pharmacy;
    if (body.status !== undefined) record.status = body.status;

    await record.save();
    return this.toDto(record);
  }

  async remove(id: string): Promise<void> {
    const record = await this.facilitiesModel.findByPk(id);
    if (!record) {
      throw new NotFoundException({ message: 'Data not found', status: 404 });
    }
    await record.destroy();
  }
}
