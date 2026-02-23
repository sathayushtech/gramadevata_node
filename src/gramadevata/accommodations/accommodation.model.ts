import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { EntityStatus } from '../../common/enums/entity-status.enum';
import { Register as User } from '../auth/user.model';
import { Event } from '../events/event.model';
import { TempleNearbyTourismPlace } from '../tourism/tourism-place.model';
import { Temple } from '../temple/temple.model';
import { Village } from '../villages/village.model';

@Table({ tableName: 'accommodation', timestamps: false })
export class Accommodation extends Model<Accommodation> {
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    primaryKey: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
    unique: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING(250), allowNull: true, field: 'name' })
  declare name?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'accommodation_rating' })
  declare accommodationRating?: string;

  @ForeignKey(() => Temple)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @BelongsTo(() => Temple, { foreignKey: 'templeId', onDelete: 'CASCADE' })
  declare temple?: Temple;

  @Column({ type: DataType.DATE(6), allowNull: false, field: 'created_at', defaultValue: DataType.NOW })
  declare createdAt: Date;

  @Column({ type: DataType.STRING(150), allowNull: true, field: 'address' })
  declare address?: string;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    field: 'status',
    defaultValue: EntityStatus.INACTIVE,
    validate: { isIn: [Object.values(EntityStatus)] },
  })
  declare status: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @BelongsTo(() => User, { foreignKey: 'userId', onDelete: 'CASCADE' })
  declare user?: User;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village_id' })
  declare villageId?: string;

  @BelongsTo(() => Village, { foreignKey: 'villageId', onDelete: 'SET NULL' })
  declare village?: Village;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'image_location' })
  declare imageLocation?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'owner_name' })
  declare ownerName?: string;

  @Column({ type: DataType.STRING(10), allowNull: true, field: 'contact_number' })
  declare contactNumber?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'email_id' })
  declare emailId?: string;

  @Column({ type: DataType.STRING(450), allowNull: true, field: 'website' })
  declare website?: string;

  @ForeignKey(() => Event)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'event_id' })
  declare eventId?: string;

  @BelongsTo(() => Event, { foreignKey: 'eventId', onDelete: 'CASCADE' })
  declare event?: Event;

  @ForeignKey(() => TempleNearbyTourismPlace)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'tourism_places' })
  declare tourismPlaces?: string;

  @BelongsTo(() => TempleNearbyTourismPlace, { foreignKey: 'tourismPlaces', onDelete: 'SET NULL' })
  declare tourismPlace?: TempleNearbyTourismPlace;
}
