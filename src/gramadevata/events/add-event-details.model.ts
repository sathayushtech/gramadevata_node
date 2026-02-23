import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Event } from './event.model';
import { EntityStatus } from '../../common/enums';
// import { Register } from '../auth/register.model';

@Table({ tableName: 'add_event_details', timestamps: false })
export class AddEventDetails extends Model<AddEventDetails> {
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

  @ForeignKey(() => Event)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'event_id' })
  declare eventId?: string;

  @BelongsTo(() => Event)
  declare event?: Event;

  // @ForeignKey(() => Register)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  // declare userId?: string;

  // @BelongsTo(() => Register)
  // declare user?: Register;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  @Column({ type: DataType.TIME, allowNull: true, field: 'start_time' })
  declare startTime?: string;

  @Column({ type: DataType.TIME, allowNull: true, field: 'end_time' })
  declare endTime?: string;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'event_video' })
  declare eventVideo?: unknown;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;
}