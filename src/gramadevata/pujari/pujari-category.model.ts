import { CreationOptional } from 'sequelize';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'pujari_category', timestamps: false })
export class PujariCategory extends Model<PujariCategory> {
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
}
