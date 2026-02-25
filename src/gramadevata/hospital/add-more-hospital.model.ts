import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { NearbyHospital } from './nearby-hospital.model';
import { Register as User } from '../auth/user.model';

@Table({ tableName: 'add_hospital', timestamps: false })
export class AddMoreHospital extends Model<AddMoreHospital> {
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    primaryKey: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: string;

  @ForeignKey(() => NearbyHospital)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'hospital_id' })
  declare hospitalId?: string;

  @BelongsTo(() => NearbyHospital)
  declare hospital?: NearbyHospital;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @BelongsTo(() => User)
  declare user?: User;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'image_location', defaultValue: [] })
  declare imageLocation?: unknown;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'address' })
  declare address?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'contact_number' })
  declare contactNumber?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'owner_name' })
  declare ownerName?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'website' })
  declare website?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'email_id' })
  declare emailId?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'license_copy' })
  declare licenseCopy?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'status' })
  declare status?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: Date;
}
