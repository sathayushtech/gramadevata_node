import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Village } from '../villages/village.model';
// import { Register } from '../auth/user.model';

@Table({ tableName: 'Pujari', timestamps: false })
export class Pujari extends Model<Pujari> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @Column({ type: DataType.STRING(200), allowNull: false, field: 'first_name' })
  declare firstName: string;

  @Column({ type: DataType.STRING(200), allowNull: false, field: 'last_name' })
  declare lastName: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'father_name' })
  declare fatherName?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'contact_number' })
  declare contactNumber?: string;

  // @ForeignKey(() => Register)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'user' })
  // declare userId?: string;

  // @BelongsTo(() => Register)
  // declare user?: Register;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village' })
  declare villageId?: string;

  @BelongsTo(() => Village)
  declare village?: Village;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'pujari_certificate' })
  declare pujariCertificate?: string;

  @Column({ type: DataType.STRING(150), allowNull: true, field: 'working_temple' })
  declare workingTemple?: string;
}
