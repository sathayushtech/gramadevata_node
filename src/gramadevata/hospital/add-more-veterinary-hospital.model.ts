import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { EntityStatus } from '../../common/enums/entity-status.enum';
import { Register as User } from '../auth/user.model';
import { NearbyVeterinaryHospital } from './nearby-veterinary-hospital.model';

@Table({ tableName: 'add_veterinary_hospital', timestamps: false })
export class AddMoreVeterinaryHospital extends Model<AddMoreVeterinaryHospital> {
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    primaryKey: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: string;

  @ForeignKey(() => NearbyVeterinaryHospital)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'veterinary_hospital_id' })
  declare veterinaryHospitalId?: string;

  @BelongsTo(() => NearbyVeterinaryHospital)
  declare veterinaryHospital?: NearbyVeterinaryHospital;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @BelongsTo(() => User)
  declare user?: User;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'image_location', defaultValue: [] })
  declare imageLocation?: unknown;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'license_copy' })
  declare licenseCopy?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'doctor_name' })
  declare doctorName?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'contact_number' })
  declare contactNumber?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    field: 'status',
    defaultValue: EntityStatus.INACTIVE,
    validate: { isIn: [Object.values(EntityStatus)] },
  })
  declare status?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: Date;
}
