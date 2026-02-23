import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
// import { Register } from '../auth/register.model';
import { BloodBank } from './blood-bank.model';
import { EntityStatus } from '../../common/enums';

@Table({ tableName: 'add_more_blood_bank', timestamps: false })
export class AddMoreBloodBank extends Model<AddMoreBloodBank> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @ForeignKey(() => BloodBank)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'blood_bank_id' })
  declare bloodBankId?: string;

  @BelongsTo(() => BloodBank)
  declare bloodBank?: BloodBank;

  // @ForeignKey(() => Register)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  // declare userId?: string;

  // @BelongsTo(() => Register)
  // declare user?: Register;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'image_location' })
  declare imageLocation?: unknown;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'license_copy' })
  declare licenseCopy?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;
}