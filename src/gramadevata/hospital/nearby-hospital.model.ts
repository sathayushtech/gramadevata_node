import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { EntityStatus } from '../../common/enums';
import { Village } from '../villages/village.model';

@Table({ tableName: 'nearby_hospitals', timestamps: false })
export class NearbyHospital extends Model<NearbyHospital> {
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    primaryKey: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'name' })
  declare name?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'address' })
  declare address?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village_id' })
  declare villageId?: string;

  @ForeignKey(() => Village)
  @BelongsTo(() => Village, { foreignKey: 'villageId', onDelete: 'SET NULL' })
  declare village?: Village;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'image_location' })
  declare imageLocation?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: Date;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'event_id' })
  declare eventId?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'tourism_places' })
  declare tourismPlaces?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'owner_name' })
  declare ownerName?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'contact_number' })
  declare contactNumber?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'license_copy' })
  declare licenseCopy?: string;
}
