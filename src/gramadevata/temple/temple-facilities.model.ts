import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Temple } from '../temple/temple.model';
import { ActivityOption, EntityStatus } from '../../common/enums';
// import { Register } from '../auth/user.model';

@Table({ tableName: 'temple_facilities', timestamps: false })
export class TempleFacilities extends Model<TempleFacilities> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @ForeignKey(() => Temple)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @BelongsTo(() => Temple)
  declare temple?: Temple;

  // @ForeignKey(() => Register)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  // declare userId?: string;

  // @BelongsTo(() => Register)
  // declare user?: Register;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'pooja_shops', validate: { isIn: [Object.values(ActivityOption)] } })
  declare poojaShops?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'restroom', validate: { isIn: [Object.values(ActivityOption)] } })
  declare restroom?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'drinking_water', validate: { isIn: [Object.values(ActivityOption)] } })
  declare drinkingWater?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'accommodation', validate: { isIn: [Object.values(ActivityOption)] } })
  declare accommodation?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'restaurants', validate: { isIn: [Object.values(ActivityOption)] } })
  declare restaurants?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'lockers_for_mobile/electronic_goods/bags', validate: { isIn: [Object.values(ActivityOption)] } })
  declare lockers?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'shoe_rack', validate: { isIn: [Object.values(ActivityOption)] } })
  declare shoeRack?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'physical_disabilities_services(wheelchair)', validate: { isIn: [Object.values(ActivityOption)] } })
  declare physicalDisabilitiesServices?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'medical_emergency', validate: { isIn: [Object.values(ActivityOption)] } })
  declare medicalEmergency?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'chemist/pharmacy', validate: { isIn: [Object.values(ActivityOption)] } })
  declare chemistPharmacy?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;
}
