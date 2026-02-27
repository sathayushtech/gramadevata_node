import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Village } from '../villages/village.model';
import { Temple } from '../temple/temple.model';
import { Register as User } from '../auth/user.model';
@Table({ tableName: 'chat', timestamps: false })
export class Chat extends Model<Chat> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: string;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'message' })
  declare message: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING(45), allowNull: false, field: 'user' })
  declare userId: string;

  @BelongsTo(() => User, { foreignKey: 'userId', onDelete: 'CASCADE' })
  declare user?: User;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village' })
  declare villageId?: string;

  @BelongsTo(() => Village, { foreignKey: 'villageId', onDelete: 'CASCADE' })
  declare village?: Village;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: Date;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'posted_time_ago' })
  declare postedTimeAgo?: string;

  @ForeignKey(() => Temple)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple' })
  declare templeId?: string;

  @BelongsTo(() => Temple, { foreignKey: 'templeId', onDelete: 'CASCADE' })
  declare temple?: Temple;

  @Column({ type: DataType.STRING(10), allowNull: true, field: 'chat_user_type' })
  declare chatUserType?: string;

  @Column({ type: DataType.STRING(10), allowNull: true, field: 'chat_entity_type' })
  declare chatEntityType?: string;
}
