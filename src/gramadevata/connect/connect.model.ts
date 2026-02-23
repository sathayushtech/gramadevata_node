import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Village } from '../villages/village.model';
import { Temple } from '../temple/temple.model';
import { ConnectedAs } from '../../common/enums';
// import { Register } from '../auth/user.model';

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
  declare id: CreationOptional<string>;

  // @ForeignKey(() => Register)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'user' })
  // declare userId?: string;

  // @BelongsTo(() => Register)
  // declare user?: Register;

  @ForeignKey(() => Temple)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple' })
  declare templeId?: string;

  @BelongsTo(() => Temple)
  declare temple?: Temple;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village' })
  declare villageId?: string;

  @BelongsTo(() => Village)
  declare village?: Village;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'description' })
  declare description?: string;

  @Column({ type: DataType.STRING(30), allowNull: true, defaultValue: ConnectedAs.MEMBER, field: 'connected_as', validate: { isIn: [Object.values(ConnectedAs)] } })
  declare connectedAs?: string;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'belongs_as' })
  declare belongsAs?: unknown;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;
}
