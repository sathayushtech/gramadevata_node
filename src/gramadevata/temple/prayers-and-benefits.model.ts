import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Temple } from '../temple/temple.model';
import { ActivityOption, EntityStatus } from '../../common/enums';
import { Register } from '../auth/user.model';

@Table({ tableName: 'prayers_and_benefits', timestamps: false })
export class PrayersAndBenefits extends Model<PrayersAndBenefits> {
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

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'homam', validate: { isIn: [Object.values(ActivityOption)] } })
  declare homam?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'special_vratas', validate: { isIn: [Object.values(ActivityOption)] } })
  declare specialVratas?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'sevas', validate: { isIn: [Object.values(ActivityOption)] } })
  declare sevas?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'abshikam', validate: { isIn: [Object.values(ActivityOption)] } })
  declare abshikam?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'kalyanam', validate: { isIn: [Object.values(ActivityOption)] } })
  declare kalyanam?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;
}
