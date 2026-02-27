import { Column, DataType, Model, Table, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { District } from '../../common/models/district.model';

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

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'municipality' })
  declare municipality?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'population' })
  declare population?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @ForeignKey(() => District)
  @Column({ type: DataType.STRING(45), allowNull: false, field: 'district_id' })
  declare districtId: string;

  @BelongsTo(() => District)
  declare district?: District;

  @Column({ type: DataType.DATE, allowNull: false, field: 'created_at', defaultValue: DataType.NOW })
  declare createdAt: Date;

  @Column({
    type: DataType.STRING(30),
    allowNull: true,
    field: 'type',
    defaultValue: 'BLOCK',
    validate: { isIn: [['BLOCK', 'TOWN']] },
  })
  declare type?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'image_location' })
  declare imageLocation?: string;
}