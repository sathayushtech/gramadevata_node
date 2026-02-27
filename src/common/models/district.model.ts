import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { State } from './state.model';

@Table({ tableName: 'district', timestamps: false })
export class District extends Model<District> {
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

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'image_location' })
  declare imageLocation?: string;

  @ForeignKey(() => State)
  @Column({ type: DataType.STRING(45), allowNull: false, field: 'state_id' })
  declare stateId: string;

  @BelongsTo(() => State)
  declare state?: State;
}
