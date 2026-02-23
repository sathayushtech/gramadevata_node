import { CreationOptional } from 'sequelize';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'Event_category', timestamps: false })
export class EventCategory extends Model<EventCategory> {
  @Column({
    type: DataType.STRING(200),
    allowNull: false,
    primaryKey: true,
    field: '_id',
  })
  declare id: CreationOptional<string>;

  @Column({ type: DataType.STRING(45), allowNull: false, field: 'name' })
  declare name: string;

  @Column({ type: DataType.STRING(250), allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'pic' })
  declare pic?: string;
}
