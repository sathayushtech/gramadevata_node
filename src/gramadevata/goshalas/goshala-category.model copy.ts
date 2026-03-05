import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'goshala_category', timestamps: false })
export class GoshalaCategory extends Model<GoshalaCategory> {
  @Column({
    type: DataType.STRING(200),
    allowNull: false,
    primaryKey: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: string;

  @Column({ type: DataType.STRING(45), allowNull: false, field: 'name' })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: Date;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'pic' })
  declare pic?: string;
}
