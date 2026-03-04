import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Temple } from '../temple/temple.model';
import { ActivityOption, EntityStatus } from '../../common/enums';
import { Register } from '../auth/user.model';

@Table({ tableName: 'social_activities', timestamps: false })
export class SocialActivity extends Model<SocialActivity> {
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

  @ForeignKey(() => Register)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @BelongsTo(() => Register, { foreignKey: 'userId', onDelete: 'CASCADE' })
  declare user?: Register;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'annadhanam', validate: { isIn: [Object.values(ActivityOption)] } })
  declare annadhaanam?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'marriage_hall', validate: { isIn: [Object.values(ActivityOption)] } })
  declare marriageHall?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'naamkarann', validate: { isIn: [Object.values(ActivityOption)] } })
  declare naamkarann?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'barasala', validate: { isIn: [Object.values(ActivityOption)] } })
  declare barasala?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'aksharabhyasam', validate: { isIn: [Object.values(ActivityOption)] } })
  declare aksharabhyasam?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'upanayanam', validate: { isIn: [Object.values(ActivityOption)] } })
  declare upanayanam?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'tulabharam', validate: { isIn: [Object.values(ActivityOption)] } })
  declare tulabharam?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'ear_piercing', validate: { isIn: [Object.values(ActivityOption)] } })
  declare earPiercing?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'annaprashanam', validate: { isIn: [Object.values(ActivityOption)] } })
  declare annaprashanam?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'head_shave', validate: { isIn: [Object.values(ActivityOption)] } })
  declare headShave?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'danaas', validate: { isIn: [Object.values(ActivityOption)] } })
  declare danaas?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;
}
