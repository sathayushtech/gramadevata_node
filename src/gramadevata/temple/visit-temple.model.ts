import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Temple } from '../temple/temple.model';
import { Goshala } from '../goshalas/goshala.model';
import { Event } from '../events/event.model';
// import { Register } from '../auth/user.model';

@Table({ tableName: 'visited_temples', timestamps: false })
export class VisitTemple extends Model<VisitTemple> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  // @ForeignKey(() => Register)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  // declare userId?: string;

  // @BelongsTo(() => Register)
  // declare user?: Register;

  @ForeignKey(() => Temple)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @BelongsTo(() => Temple)
  declare temple?: Temple;

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

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;
}
