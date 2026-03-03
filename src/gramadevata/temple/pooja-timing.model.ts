import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Temple } from '../temple/temple.model';
import { EntityStatus } from '../../common/enums';
// import { Register } from '../auth/user.model';

@Table({ tableName: 'temple_pooja_timings', timestamps: false })
export class TemplePoojaTiming extends Model<TemplePoojaTiming> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @ForeignKey(() => Temple)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @BelongsTo(() => Temple)
  declare temple?: Temple;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'pooja_name' })
  declare poojaName?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, field: 'start_time' })
  declare startTime?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, field: 'end_time' })
  declare endTime?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'days' })
  declare days?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;
}
