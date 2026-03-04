import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { PujariSubCategory } from './pujari-subcategory.model';

export type PujariSubCategoryResponse = Record<string, unknown>;

@Injectable()
export class PujariSubCategoryService {
  constructor(
    @InjectModel(PujariSubCategory)
    private readonly pujariSubCategoryModel: typeof PujariSubCategory,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  LIST (GET /) — supports multi-value category & _id filtering       */
  /* ------------------------------------------------------------------ */
  async list(
    query: Record<string, string | undefined>,
  ): Promise<PujariSubCategoryResponse[]> {
    const where: Record<string, unknown> = {};

    // Handle category multi-value filter
    const categoryParam = query.category;
    if (categoryParam) {
      const categoryIds = categoryParam.split(',').map((c) => c.trim()).filter(Boolean);
      if (categoryIds.length === 1) {
        where.categoryId = categoryIds[0];
      } else if (categoryIds.length > 1) {
        where.categoryId = { [Op.in]: categoryIds };
      }
    }

    // Handle _id multi-value filter
    const idsParam = query._id;
    if (idsParam) {
      const idList = idsParam.split(',').map((i) => i.trim()).filter(Boolean);
      if (idList.length === 1) {
        where.id = idList[0];
      } else if (idList.length > 1) {
        where.id = { [Op.in]: idList };
      }
    }

    // Handle remaining single-value filters
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || key === 'format' || key === 'category' || key === '_id') continue;
      where[this.mapKey(key)] = value;
    }

    const rows = await this.pujariSubCategoryModel.findAll({ where });
    return rows.map((row) => this.toResponse(row));
  }

  /* ------------------------------------------------------------------ */
  /*  CREATE (POST /)                                                    */
  /* ------------------------------------------------------------------ */
  async create(payload: Record<string, unknown>): Promise<PujariSubCategoryResponse> {
    const created = await this.pujariSubCategoryModel.create({
      ...(typeof payload._id === 'string' && payload._id.trim() ? { id: payload._id.trim() } : {}),
      ...(typeof payload.name === 'string' ? { name: payload.name } : {}),
      ...(typeof payload.category === 'string' ? { categoryId: payload.category } : {}),
    } as any);
    return this.toResponse(created);
  }

  /* ------------------------------------------------------------------ */
  /*  RETRIEVE (GET /:id)                                                */
  /* ------------------------------------------------------------------ */
  async getById(id: string): Promise<PujariSubCategoryResponse | null> {
    const instance = await this.pujariSubCategoryModel.findByPk(id);
    return instance ? this.toResponse(instance) : null;
  }

  /* ------------------------------------------------------------------ */
  /*  UPDATE (PUT / PATCH /:id)                                          */
  /* ------------------------------------------------------------------ */
  async update(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<PujariSubCategoryResponse | null> {
    const instance = await this.pujariSubCategoryModel.findByPk(id);
    if (!instance) return null;

    await instance.update({
      ...(typeof payload.name === 'string' ? { name: payload.name } : {}),
      ...(typeof payload.category === 'string' ? { categoryId: payload.category } : {}),
    } as any);

    return this.toResponse(instance);
  }

  /* ------------------------------------------------------------------ */
  /*  DESTROY (DELETE /:id)                                              */
  /* ------------------------------------------------------------------ */
  async remove(id: string): Promise<boolean> {
    const deleted = await this.pujariSubCategoryModel.destroy({ where: { id } });
    return deleted > 0;
  }

  /* ------------------------------------------------------------------ */
  /*  Serializer — matches Django fields = ['_id', 'name', 'category']   */
  /* ------------------------------------------------------------------ */
  private toResponse(row: PujariSubCategory): PujariSubCategoryResponse {
    const plain = row.get({ plain: true }) as any;
    return {
      _id: String(plain.id),
      name: plain.name ?? null,
      category: plain.categoryId ?? null,
    };
  }

  private mapKey(key: string): string {
    const map: Record<string, string> = { _id: 'id', category_id: 'categoryId' };
    return map[key] ?? key;
  }
}
