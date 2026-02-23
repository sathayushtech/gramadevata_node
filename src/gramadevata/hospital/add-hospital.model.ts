import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
// import { NearbyHospital } from './nearby-hospital.model';
// import { Register } from '../auth/register.model';
import { EntityStatus } from '../../common/enums';

@Table({ tableName: 'add_hospital', timestamps: false })
export class AddMoreHospital extends Model<AddMoreHospital> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  // @ForeignKey(() => NearbyHospital)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'hospital_id' })
  // declare hospitalId?: string;

  // @BelongsTo(() => NearbyHospital)
  // declare hospital?: NearbyHospital;

  // @ForeignKey(() => Register)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  // declare userId?: string;

  // @BelongsTo(() => Register)
  // declare user?: Register;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'image_location' })
  declare imageLocation?: unknown;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'address' })
  declare address?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'contact_number' })
  declare contactNumber?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'owner_name' })
  declare ownerName?: string;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'website' })
  declare website?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'email_id' })
  declare emailId?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'license_copy' })
  declare licenseCopy?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;
}