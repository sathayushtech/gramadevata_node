import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Village } from './village.model';
import { Temple } from '../temple/temple.model';
import { BankType, EntityStatus } from '../../common/enums';
// import { Register } from '../auth/user.model';

@Table({ tableName: 'village_banks', timestamps: false })
export class VillageBank extends Model<VillageBank> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'name' })
  declare name?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'branch_name' })
  declare branchName?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'manager_name' })
  declare managerName?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, defaultValue: BankType.PUBLIC, field: 'bank_type', validate: { isIn: [Object.values(BankType)] } })
  declare bankType?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'address' })
  declare address?: string;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village_id' })
  declare villageId?: string;

  @BelongsTo(() => Village)
  declare village?: Village;

  @ForeignKey(() => Temple)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @BelongsTo(() => Temple)
  declare temple?: Temple;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  // @ForeignKey(() => Register)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  // declare userId?: string;

  // @BelongsTo(() => Register)
  // declare user?: Register;

  @Column({ type: DataType.JSON, allowNull: true, field: 'image_location' })
  declare imageLocation?: unknown;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'contact_number' })
  declare contactNumber?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'email_id' })
  declare emailId?: string;
}
