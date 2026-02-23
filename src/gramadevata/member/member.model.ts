import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Village } from '../villages/village.model';
import { Connect } from '../connect/connect.model';
import { VillagerRole } from '../../common/enums';
// import { Register } from '../auth/user.model';

@Table({ tableName: 'Member', timestamps: false })
export class Member extends Model<Member> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @Column({ type: DataType.STRING(200), allowNull: false, field: 'name' })
  declare name: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'surname' })
  declare surname?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'father_name' })
  declare fatherName?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'you_belongs_to_the_village' })
  declare youBelongsToTheVillage?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, defaultValue: VillagerRole.Villager, field: 'your_role_in_our_village', validate: { isIn: [Object.values(VillagerRole)] } })
  declare yourRoleInOurVillage?: string;

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

  @ForeignKey(() => Connect)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'connect' })
  declare connectId?: string;

  @BelongsTo(() => Connect)
  declare connect?: Connect;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'pujari_certificate' })
  declare pujariCertificate?: string;

  @Column({ type: DataType.STRING(150), allowNull: true, field: 'working_temple' })
  declare workingTemple?: string;
}
