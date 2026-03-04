import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { EntityStatus } from '../../common/enums/entity-status.enum';
import { Register as User } from '../auth/user.model';
import { Village } from '../villages/village.model';
import { Temple } from '../temple/temple.model';

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

  @ForeignKey(() => Temple)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @BelongsTo(() => Temple, { foreignKey: 'templeId', onDelete: 'CASCADE' })
  declare temple?: Temple;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at', defaultValue: DataType.NOW })
  declare createdAt?: Date;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'tourist_spot_coverd' })
  declare touristSpotCovered?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'language' })
  declare language?: string;

  @Column({ type: DataType.STRING(15), allowNull: true, field: 'mobile' })
  declare mobile?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    defaultValue: EntityStatus.INACTIVE,
    field: 'status',
    validate: { isIn: [Object.values(EntityStatus)] },
  })
  declare status?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'event_id' })
  declare eventId?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'image_location' })
  declare imageLocation?: unknown;
}
