import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Register as User } from '../auth/user.model';
import { Temple } from '../temple/temple.model';
import { Village } from '../villages/village.model';

@Table({ tableName: 'connect', timestamps: false })
export class Connect extends Model<Connect> {
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
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user' })
  declare userId?: string;

  @BelongsTo(() => User, { foreignKey: 'userId', onDelete: 'CASCADE' })
  declare user?: User;

  @ForeignKey(() => Temple)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple' })
  declare templeId?: string;

  @BelongsTo(() => Temple, { foreignKey: 'templeId', onDelete: 'CASCADE' })
  declare temple?: Temple;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village' })
  declare villageId?: string;

  @BelongsTo(() => Village, { foreignKey: 'villageId', onDelete: 'CASCADE' })
  declare village?: Village;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'description' })
  declare description?: string;

  @Column({ type: DataType.STRING(30), allowNull: true, field: 'connected_as' })
  declare connectedAs?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'belongs_as', defaultValue: [] })
  declare belongsAs?: unknown;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at', defaultValue: DataType.NOW })
  declare createdAt?: Date;
}
