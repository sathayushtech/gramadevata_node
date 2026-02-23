import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Village } from '../villages/village.model';
import { Temple } from '../temple/temple.model';
import { Goshala } from '../goshalas/goshala.model';
import { EntityStatus } from '../../common/enums';
// import { Register } from '../auth/user.model';
// import { Country } from '../../common/models/country.model';

@Table({ tableName: 'temple_nearby_tourismplaces', timestamps: false })
export class TempleNearbyTourismPlace extends Model<TempleNearbyTourismPlace> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'name' })
  declare name?: string;

  @ForeignKey(() => Temple)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @BelongsTo(() => Temple)
  declare temple?: Temple;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'address' })
  declare address?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village_id' })
  declare villageId?: string;

  @BelongsTo(() => Village)
  declare village?: Village;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  // @ForeignKey(() => Register)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  // declare userId?: string;

  // @BelongsTo(() => Register)
  // declare user?: Register;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'image_location' })
  declare imageLocation?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'timings' })
  declare timings?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'type' })
  declare type?: string;

  @ForeignKey(() => Goshala)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'goshala_id' })
  declare goshalaId?: string;

  @BelongsTo(() => Goshala)
  declare goshala?: Goshala;

  // @ForeignKey(() => Country)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'country' })
  // declare countryId?: string;

  // @BelongsTo(() => Country)
  // declare country?: Country;
}
