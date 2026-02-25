import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Goshala } from './goshala.model';
import { Register as User } from '../auth/user.model';

@Table({ tableName: 'add_goshala_details', timestamps: false })
export class AddGoshalaDetails extends Model<AddGoshalaDetails> {
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

  @Column({ type: DataType.TEXT, allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @ForeignKey(() => Goshala)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'goshala_id' })
  declare goshalaId?: string;

  @BelongsTo(() => Goshala)
  declare goshala?: Goshala;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @BelongsTo(() => User)
  declare user?: User;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: Date;

  @Column({ type: DataType.JSON, allowNull: true, field: 'goshala_video', defaultValue: [] })
  declare goshalaVideo?: unknown;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'status' })
  declare status?: string;
}