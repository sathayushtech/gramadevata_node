import { CreationOptional } from 'sequelize';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'main_category', timestamps: false })
export class TempleMainCategory extends Model<TempleMainCategory> {
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
}
