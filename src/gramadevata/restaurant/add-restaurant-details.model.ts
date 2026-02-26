import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { TempleNearbyRestaurant } from '../events/temple-nearby-restaurant.model';
import { Register as User } from '../auth/user.model';
import { EntityStatus } from '../../common/enums';

@Table({ tableName: 'add_restaurent_details', timestamps: false })
export class AddRestaurantDetails extends Model<AddRestaurantDetails> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'image_location' })
  declare imageLocation?: unknown;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @BelongsTo(() => User)
  declare user?: User;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'name' })
  declare name?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'address' })
  declare address?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'owner_name' })
  declare ownerName?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'contact_number' })
  declare contactNumber?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'email_id' })
  declare emailId?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'website' })
  declare website?: string;

  @ForeignKey(() => TempleNearbyRestaurant)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'restaurent_id' })
  declare restaurentId?: string;

  @BelongsTo(() => TempleNearbyRestaurant)
  declare restaurant?: TempleNearbyRestaurant;
}