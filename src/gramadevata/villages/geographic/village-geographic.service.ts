import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { CreationAttributes } from 'sequelize';
import { Geographic } from '../village-geographic.model';

@Injectable()
export class VillageGeographicService {
  constructor(
    @InjectModel(Geographic)
    private readonly geographicModel: typeof Geographic,
  ) {}

  async list() {
    return this.geographicModel.findAll({ order: [['createdAt', 'DESC']] });
  }

  async getById(id: string) {
    return this.geographicModel.findByPk(id);
  }

  async create(payload: Record<string, unknown>) {
    return this.geographicModel.create(payload as CreationAttributes<Geographic>);
  }

  async update(id: string, payload: Record<string, unknown>) {
    const record = await this.getById(id);
    if (!record) return null;

    await record.update(payload as CreationAttributes<Geographic>);
    return record;
  }

  async remove(id: string) {
    const record = await this.getById(id);
    if (!record) return false;

    await record.destroy();
    return true;
  }
}
