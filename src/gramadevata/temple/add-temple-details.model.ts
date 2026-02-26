import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Temple } from './temple.model';
import { Register as User } from '../auth/user.model';
import { EntityStatus } from '../../common/enums';

@Table({ tableName: 'add_temple_details', timestamps: false })
export class AddTempleDetails extends Model<AddTempleDetails> {
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

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @ForeignKey(() => Temple)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @BelongsTo(() => Temple)
  declare temple?: Temple;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @BelongsTo(() => User)
  declare user?: User;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'temple_website' })
  declare templeWebsite?: string;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'video' })
  declare video?: unknown;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'temple_area' })
  declare templeArea?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'temple_timings' })
  declare templeTimings?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'construction_year' })
  declare constructionYear?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'other_diety' })
  declare otherDiety?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;
}