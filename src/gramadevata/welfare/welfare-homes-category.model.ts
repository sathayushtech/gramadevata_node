import { CreationOptional } from 'sequelize';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'welfare_homes_category', timestamps: false })
export class WelfareHomesCategory extends Model<WelfareHomesCategory> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'name' })
  declare name?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'image_location' })
  declare imageLocation?: string;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'priority' })
  declare priority?: number;
}
