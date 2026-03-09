import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { EntityStatus } from '../../common/enums/entity-status.enum';
import { Register as User } from '../auth/user.model';
import { Temple } from '../temple/temple.model';
import { Village } from '../villages/village.model';

@Table({ tableName: 'blood_bank', timestamps: false })
export class BloodBank extends Model<BloodBank> {
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'name' })
  declare name?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'address' })
  declare address?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'blood_group' })
  declare bloodGroup?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @ForeignKey(() => Temple)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @BelongsTo(() => Temple, { foreignKey: 'templeId', onDelete: 'CASCADE' })
  declare temple?: Temple;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village_id' })
  declare villageId?: string;

  @BelongsTo(() => Village, { foreignKey: 'villageId', onDelete: 'SET NULL' })
  declare village?: Village;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @BelongsTo(() => User, { foreignKey: 'userId', onDelete: 'CASCADE' })
  declare user?: User;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'image_location' })
  declare imageLocation?: string;

  @Column({ type: DataType.DATE, allowNull: false, field: 'created_at', defaultValue: DataType.NOW })
  declare createdAt: Date;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    field: 'status',
    defaultValue: EntityStatus.INACTIVE,
    validate: { isIn: [Object.values(EntityStatus)] },
  })
  declare status: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'organization_name' })
  declare organizationName?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'contact_number' })
  declare contactNumber?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'license_copy' })
  declare licenseCopy?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'license_number' })
  declare licenseNumber?: string;

  @Column({ type: DataType.STRING(10), allowNull: true, field: 'whatsapp_number' })
  declare whatsappNumber?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'owner_name' })
  declare ownerName?: string;
}