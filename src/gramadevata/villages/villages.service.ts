import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Village } from './village.model';
import type { CreationAttributes } from 'sequelize';

@Injectable()
export class VillagesService {
  constructor(
    @InjectModel(Village)
    private readonly villageModel: typeof Village
  ) {}

  async create(payload: Record<string, unknown>) {
    return this.villageModel.create(payload as CreationAttributes<Village>);
  }

  async list(query: Record<string, string | undefined>) {
    const filters: Record<string, string> = {};

    if (query.blockId) filters.blockId = query.blockId;
    if (query.status) filters.status = query.status;
    if (query.type) filters.type = query.type;
    if (query.name) filters.name = query.name;

    return this.villageModel.findAll({ where: filters });
  }

  async getById(id: string) {
    return this.villageModel.findByPk(id);
  }

  async update(id: string, payload: Record<string, unknown>) {
    const village = await this.getById(id);
    if (!village) {
      return null;
    }

    await village.update(payload as CreationAttributes<Village>);
    return village;
  }

  async remove(id: string) {
    const village = await this.getById(id);
    if (!village) {
      return false;
    }

    await village.destroy();
    return true;
  }
}
