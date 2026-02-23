import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Village } from '../villages/village.model';
import { Temple } from '../temple/temple.model';
import { EntityStatus } from '../../common/enums';
// import { Register } from '../auth/user.model';
// import { TempleNearbyTourismPlace } from '../tourism/tourism-place.model';

@Table({ tableName: 'police_station', timestamps: false })
export class PoliceStation extends Model<PoliceStation> {
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

  @Column({ type: DataType.TEXT, allowNull: true, field: 'address' })
  declare address?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'contact_number' })
  declare contactNumber?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

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

  @Column({ type: DataType.TEXT, allowNull: true, field: 'image_location' })
  declare imageLocation?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  // @ForeignKey(() => TempleNearbyTourismPlace)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'tourism_places' })
  // declare tourismPlaces?: string;

  // @BelongsTo(() => TempleNearbyTourismPlace)
  // declare tourismPlace?: TempleNearbyTourismPlace;
}
