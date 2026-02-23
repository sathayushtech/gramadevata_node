import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Temple } from '../temple/temple.model';
import { EntityStatus } from '../../common/enums';
// import { Register } from '../auth/user.model';

@Table({ tableName: 'temple_festivals', timestamps: false })
export class TempleFestival extends Model<TempleFestival> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'name' })
  declare name?: string;

  @Column({ type: DataType.DATEONLY, allowNull: true, field: 'start_date' })
  declare startDate?: string;

  @Column({ type: DataType.DATEONLY, allowNull: true, field: 'end_date' })
  declare endDate?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  @ForeignKey(() => Temple)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @BelongsTo(() => Temple)
  declare temple?: Temple;

  // @ForeignKey(() => Register)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  // declare userId?: string;

  // @BelongsTo(() => Register)
  // declare user?: Register;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'image_location' })
  declare imageLocation?: string;
}
