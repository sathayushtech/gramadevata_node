import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { TempleMainCategory } from './temple-main-category.model';

@Table({ tableName: 'temple_category', timestamps: false })
export class TempleCategory extends Model<TempleCategory> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @Column({ type: DataType.STRING(45), allowNull: false, field: 'name' })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.STRING(32), allowNull: true, unique: true, field: 'shortname' })
  declare shortname?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'pic' })
  declare pic?: string;

  @ForeignKey(() => TempleMainCategory)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'main_category_id' })
  declare mainCategoryId?: string;

  @BelongsTo(() => TempleMainCategory)
  declare mainCategory?: TempleMainCategory;
}
