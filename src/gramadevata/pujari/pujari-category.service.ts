import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { PujariCategory } from './pujari-category.model';

export type PujariCategoryResponse = Record<string, unknown>;

@Injectable()
export class PujariCategoryService {
  constructor(
    @InjectModel(PujariCategory)
    private readonly pujariCategoryModel: typeof PujariCategory,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  LIST (GET /) — supports comma-separated filter values               */
  /* ------------------------------------------------------------------ */
  async list(
    query: Record<string, string | undefined>,
  ): Promise<PujariCategoryResponse[] | { message: string; status: number }> {
    const where: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || key === 'format') continue;
      const dbKey = this.mapKey(key);

      if (value.includes(',')) {
        where[dbKey] = { [Op.in]: value.split(',').map((v) => v.trim()) };
      } else {
        where[dbKey] = value;
      }
    }

    const rows = await this.pujariCategoryModel.findAll({ where });

    if (!rows.length) {
      return { message: 'Data not found', status: 404 };
    }

    return rows.map((row) => this.toResponse(row));
  }

  /* ------------------------------------------------------------------ */
  /*  CREATE (POST /)                                                    */
  /* ------------------------------------------------------------------ */
  async create(payload: Record<string, unknown>): Promise<PujariCategoryResponse> {
    const created = await this.pujariCategoryModel.create({
      ...(typeof payload._id === 'string' && payload._id.trim() ? { id: payload._id.trim() } : {}),
      ...(typeof payload.name === 'string' ? { name: payload.name } : {}),
    } as any);
    return this.toResponse(created);
  }

  /* ------------------------------------------------------------------ */
  /*  RETRIEVE (GET /:id)                                                */
  /* ------------------------------------------------------------------ */
  async getById(id: string): Promise<PujariCategoryResponse | null> {
    const instance = await this.pujariCategoryModel.findByPk(id);
    return instance ? this.toResponse(instance) : null;
  }

  /* ------------------------------------------------------------------ */
  /*  UPDATE (PUT / PATCH /:id)                                          */
  /* ------------------------------------------------------------------ */
  async update(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<PujariCategoryResponse | null> {
    const instance = await this.pujariCategoryModel.findByPk(id);
    if (!instance) return null;

    await instance.update({
      ...(typeof payload.name === 'string' ? { name: payload.name } : {}),
    } as any);

    return this.toResponse(instance);
  }

  /* ------------------------------------------------------------------ */
  /*  DESTROY (DELETE /:id)                                              */
  /* ------------------------------------------------------------------ */
  async remove(id: string): Promise<boolean> {
    const deleted = await this.pujariCategoryModel.destroy({ where: { id } });
    return deleted > 0;
  }

  /* ------------------------------------------------------------------ */
  /*  Serializer — matches Django fields = ["_id", "name"]               */
  /* ------------------------------------------------------------------ */
  private toResponse(row: PujariCategory): PujariCategoryResponse {
    const plain = row.get({ plain: true }) as any;
    return {
      _id: String(plain.id),
      name: plain.name ?? null,
    };
  }

  private mapKey(key: string): string {
    const map: Record<string, string> = { _id: 'id' };
    return map[key] ?? key;
  }
}
