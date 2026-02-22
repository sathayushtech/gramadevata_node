import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'country', timestamps: false })
export class Country extends Model<Country> {
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    primaryKey: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: string;

  @Column({ type: DataType.STRING(100), allowNull: false, field: 'name' })
  declare name: string;
}
