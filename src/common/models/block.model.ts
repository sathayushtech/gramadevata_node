import { Column, DataType, Model, Table, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { District } from './district.model';

@Table({ tableName: 'block', timestamps: false })
export class Block extends Model<Block> {
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    primaryKey: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: string;

  @Column({ type: DataType.STRING(45), allowNull: false, field: 'name' })
  declare name: string;

  @ForeignKey(() => District)
  @Column({ type: DataType.STRING(45), allowNull: false, field: 'district_id' })
  declare districtId: string;

  @BelongsTo(() => District)
  declare district?: District;
}
