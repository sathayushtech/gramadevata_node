import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { EntityStatus } from '../../common/enums';

@Table({ tableName: 'tour_guides', timestamps: false })
export class TourGuide extends Model<TourGuide> {
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    primaryKey: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village_id' })
  declare villageId?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: Date;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'tourist_spot_coverd' })
  declare touristSpotCovered?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'language' })
  declare language?: string;

  @Column({ type: DataType.STRING(15), allowNull: true, field: 'mobile' })
  declare mobile?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'event_id' })
  declare eventId?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'image_location' })
  declare imageLocation?: unknown;
}
