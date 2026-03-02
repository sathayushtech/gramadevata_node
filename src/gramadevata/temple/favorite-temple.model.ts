import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Register as User } from '../auth/user.model';
import { Event } from '../events/event.model';
import { Goshala } from '../goshalas/goshala.model';
import { Temple } from './temple.model';

@Table({ tableName: 'add_favorite_temples', timestamps: false })
export class FavoriteTemple extends Model<FavoriteTemple> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @BelongsTo(() => User)
  declare user?: User;

  @ForeignKey(() => Temple)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @BelongsTo(() => Temple)
  declare temple?: Temple;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: Date;

  @ForeignKey(() => Goshala)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'goshala_id' })
  declare goshalaId?: string;

  @BelongsTo(() => Goshala)
  declare goshala?: Goshala;

  @ForeignKey(() => Event)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'event_id' })
  declare eventId?: string;

  @BelongsTo(() => Event)
  declare event?: Event;
}
