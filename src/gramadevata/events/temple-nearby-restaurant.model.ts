import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { EntityStatus } from '../../common/enums';

@Table({ tableName: 'temple_nearby_restaurants', timestamps: false })
export class TempleNearbyRestaurant extends Model<TempleNearbyRestaurant> {
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

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: Date;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'address' })
  declare address?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village_id' })
  declare villageId?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'image_location' })
  declare imageLocation?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'owner_name' })
  declare ownerName?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'contact_number' })
  declare contactNumber?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'email_id' })
  declare emailId?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'website' })
  declare website?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'event_id' })
  declare eventId?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'tourism_places' })
  declare tourismPlaces?: string;
}
