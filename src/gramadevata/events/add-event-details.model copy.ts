import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Event } from './event.model';
import { Register as User } from '../auth/user.model';

@Table({ tableName: 'add_event_details', timestamps: false })
export class AddEventDetails extends Model<AddEventDetails> {
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    primaryKey: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'image_location', defaultValue: [] })
  declare imageLocation?: unknown;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @ForeignKey(() => Event)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'event_id' })
  declare eventId?: string;

  @BelongsTo(() => Event)
  declare event?: Event;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @BelongsTo(() => User)
  declare user?: User;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: Date;

  @Column({ type: DataType.TIME, allowNull: true, field: 'start_time' })
  declare startTime?: string;

  @Column({ type: DataType.TIME, allowNull: true, field: 'end_time' })
  declare endTime?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'event_video', defaultValue: [] })
  declare eventVideo?: unknown;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'status' })
  declare status?: string;
}
