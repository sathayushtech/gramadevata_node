import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
// import { Temple } from '../temples/temple.model';
// import { Register } from '../auth/register.model';
import { Village } from '../villages/village.model';
import { EntityStatus } from '../../common/enums';
import { Event } from '../events/event.model';
// import { TempleNearbyTourismPlace } from '../tourismplaces/tourismplace.model';

@Table({ tableName: 'accommodation', timestamps: false })
export class Accommodation extends Model<Accommodation> {
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

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'accommodation_rating' })
  declare accommodationRating?: string;

//   @ForeignKey(() => Temple)
//   @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
//   declare templeId?: string;

//   @BelongsTo(() => Temple)
//   declare temple?: Temple;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'address' })
  declare address?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

//   @ForeignKey(() => Register)
//   @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
//   declare userId?: string;

//   @BelongsTo(() => Register)
//   declare user?: Register;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village_id' })
  declare villageId?: string;

  @BelongsTo(() => Village)
  declare village?: Village;

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

  @ForeignKey(() => Event)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'event_id' })
  declare eventId?: string;

  @BelongsTo(() => Event)
  declare event?: Event;

//   @ForeignKey(() => TempleNearbyTourismPlace)
//   @Column({ type: DataType.STRING(45), allowNull: true, field: 'tourism_places' })
//   declare tourismPlaces?: string;

//   @BelongsTo(() => TempleNearbyTourismPlace)
//   declare tourismPlace?: TempleNearbyTourismPlace;
}