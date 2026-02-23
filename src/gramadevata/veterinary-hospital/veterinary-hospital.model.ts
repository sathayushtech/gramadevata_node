import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Village } from '../villages/village.model';
import { Temple } from '../temple/temple.model';
import { Goshala } from '../goshalas/goshala.model';
import { EntityStatus } from '../../common/enums';
// import { Register } from '../auth/user.model';

@Table({ tableName: 'nearby_vetarnary_hospital', timestamps: false })
export class VeterinaryHospital extends Model<VeterinaryHospital> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @Column({ type: DataType.STRING(255), allowNull: false, field: 'name' })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'address' })
  declare address?: string;

  @Column({ type: DataType.STRING(1000), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'image_location' })
  declare imageLocation?: unknown;

  @ForeignKey(() => Temple)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @BelongsTo(() => Temple)
  declare temple?: Temple;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village_id' })
  declare villageId?: string;

  @BelongsTo(() => Village)
  declare village?: Village;

  // @ForeignKey(() => Register)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  // declare userId?: string;

  // @BelongsTo(() => Register)
  // declare user?: Register;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'doctor_name' })
  declare doctorName?: string;

  @ForeignKey(() => Goshala)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'goshala_id' })
  declare goshalaId?: string;

  @BelongsTo(() => Goshala)
  declare goshala?: Goshala;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'contact_number' })
  declare contactNumber?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'license_copy' })
  declare licenseCopy?: string;
}
