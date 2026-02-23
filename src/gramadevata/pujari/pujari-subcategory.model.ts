import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { PujariCategory } from './pujari-category.model';

@Table({ tableName: 'pujari_sub_category', timestamps: false })
export class PujariSubCategory extends Model<PujariSubCategory> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @Column({ type: DataType.STRING(100), allowNull: false, field: 'name' })
  declare name: string;

  @ForeignKey(() => PujariCategory)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'category_id' })
  declare categoryId?: string;

  @BelongsTo(() => PujariCategory)
  declare category?: PujariCategory;
}
