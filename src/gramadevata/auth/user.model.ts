import { CreationOptional } from 'sequelize';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'user', timestamps: false })
export class User extends Model<User> {
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    primaryKey: true,
    field: 'id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @Column({ type: DataType.STRING(255), allowNull: false, field: 'username' })
  declare username: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'email' })
  declare email?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'contact_number' })
  declare contactNumber?: string;

  @Column({ type: DataType.STRING(6), allowNull: true, field: 'verification_otp' })
  declare verificationOtp?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'verification_otp_created_time' })
  declare verificationOtpCreatedTime?: Date;

  @Column({ type: DataType.STRING(50), allowNull: true, field: 'status' })
  declare status?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, field: 'is_member' })
  declare isMember?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, field: 'type' })
  declare type?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'profile_pic' })
  declare profilePic?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'full_name' })
  declare fullName?: string;
}
