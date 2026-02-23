import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Village } from '../villages/village.model';
import { Temple } from '../temple/temple.model';
// import { Register } from '../auth/user.model';

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
  declare id: CreationOptional<string>;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'message' })
  declare message: string;

  // @ForeignKey(() => Register)
  // @Column({ type: DataType.STRING(45), allowNull: false, field: 'user' })
  // declare userId: string;

  // @BelongsTo(() => Register)
  // declare user: Register;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village' })
  declare villageId?: string;

  @BelongsTo(() => Village)
  declare village?: Village;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'posted_time_ago' })
  declare postedTimeAgo?: string;

  @ForeignKey(() => Temple)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple' })
  declare templeId?: string;

  @BelongsTo(() => Temple)
  declare temple?: Temple;

  @Column({ type: DataType.STRING(10), allowNull: true, field: 'chat_user_type' })
  declare chatUserType?: string;

  @Column({ type: DataType.STRING(10), allowNull: true, field: 'chat_entity_type' })
  declare chatEntityType?: string;
}
