import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { CommentStatus } from '../../common/enums/comment-status.enum';

@Table({ tableName: 'comment', timestamps: false })
export class Comment extends Model<Comment> {
  @Column({
    type: DataType.CHAR(32),
    allowNull: false,
    primaryKey: true,
    field: '_id',
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: true, field: 'temple' })
  declare templeId?: string;

  @Column({ type: DataType.STRING, allowNull: true, field: 'user' })
  declare userId?: string;

  @Column({ type: DataType.STRING, allowNull: true, field: 'goshala' })
  declare goshalaId?: string;

  @Column({ type: DataType.STRING, allowNull: true, field: 'event' })
  declare eventId?: string;

  @Column({ type: DataType.STRING(250), allowNull: false, field: 'body' })
  declare body: string;

  @Column({ type: DataType.DATE, allowNull: false, field: 'created_at', defaultValue: DataType.NOW })
  declare createdAt: Date;

  @Column({ type: DataType.STRING(50), allowNull: false, field: 'status', defaultValue: CommentStatus.ACTIVE, validate: { isIn: [Object.values(CommentStatus)] } })
  declare status: CommentStatus;
}
