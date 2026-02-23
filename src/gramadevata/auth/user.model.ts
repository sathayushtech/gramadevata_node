import { CreationOptional } from 'sequelize';
import { BelongsToMany, Column, DataType, Model, Table } from 'sequelize-typescript';
import { PujariCategory } from '../pujari/pujari-category.model';
import { PujariSubCategory } from '../pujari/pujari-subcategory.model';
import { AccountType, Gender, GeoSite, MaritalStatus, MemberStatus, MemberType, PujariCertificate, PujariCertificateType, PujariIdType, PujariType, StakeholderType, UserStatus } from '../../common/enums';

@Table({ tableName: 'user', timestamps: false })
export class Register extends Model<Register> {
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: 'id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'full_name' })
  declare fullName?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'surname' })
  declare surname?: string;

  @Column({ type: DataType.STRING(200), allowNull: false, field: 'first_name' })
  declare firstName: string;

  @Column({ type: DataType.STRING(200), allowNull: false, field: 'last_name' })
  declare lastName: string;

  @Column({ type: DataType.STRING(150), allowNull: true, field: 'username' })
  declare username?: string;

  @Column({ type: DataType.STRING(254), allowNull: true, field: 'email' })
  declare email?: string;

  @Column({ type: DataType.STRING(128), allowNull: true, field: 'password' })
  declare password?: string;

  @Column({ type: DataType.STRING(10), allowNull: false, field: 'contact_number' })
  declare contactNumber: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'profile_pic' })
  declare profilePic?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: Gender.MALE, field: 'gender', validate: { isIn: [Object.values(Gender)] } })
  declare gender?: string;

  @Column({ type: DataType.DATEONLY, allowNull: false, field: 'dob' })
  declare dob: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'gotram' })
  declare gotram?: string;

  @Column({ type: DataType.STRING(6), allowNull: true, field: 'verification_otp' })
  declare verificationOtp?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'verification_otp_created_time' })
  declare verificationOtpCreatedTime?: Date;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0, field: 'verification_otp_resend_count' })
  declare verificationOtpResendCount?: number;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: UserStatus.CREATED, field: 'status', validate: { isIn: [Object.values(UserStatus)] } })
  declare status?: string;

  @Column({ type: DataType.STRING(6), allowNull: true, field: 'forgot_password_otp' })
  declare forgotPasswordOtp?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'forgot_password_otp_created_time' })
  declare forgotPasswordOtpCreatedTime?: Date;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0, field: 'forgot_password_otp_resend_count' })
  declare forgotPasswordOtpResendCount?: number;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: MemberStatus.false, field: 'is_member', validate: { isIn: [Object.values(MemberStatus)] } })
  declare isMember?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: MemberType.MEMBER, field: 'type', validate: { isIn: [Object.values(MemberType)] } })
  declare type?: string;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'pujari_certificate' })
  declare pujariCertificate?: unknown;

  @Column({ type: DataType.STRING(150), allowNull: true, field: 'working_temple' })
  declare workingTemple?: string;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'family_images' })
  declare familyImages?: unknown;

  // Father's side
  @Column({ type: DataType.STRING(200), allowNull: false, field: 'father_name' })
  declare fatherName: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'paternal_grandfather_name' })
  declare paternalGrandfatherName?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'paternal_grandmother_name' })
  declare paternalGrandmotherName?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'paternal_great_grandfather_name' })
  declare paternalGreatGrandfatherName?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'paternal_great_grandmother_name' })
  declare paternalGreatGrandmotherName?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'paternal_grandmother_father_name' })
  declare paternalGrandmotherFatherName?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'paternal_grandmother_mother_name' })
  declare paternalGrandmotherMotherName?: string;

  // Mother's side
  @Column({ type: DataType.STRING(200), allowNull: true, field: 'mother_name' })
  declare motherName?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'maternal_grandfather_name' })
  declare maternalGrandfatherName?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'maternal_grandmother_name' })
  declare maternalGrandmotherName?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'maternal_great_grandfather_name' })
  declare maternalGreatGrandfatherName?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'maternal_great_grandmother_name' })
  declare maternalGreatGrandmotherName?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'maternal_grandmother_father_name' })
  declare maternalGrandmotherFatherName?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'maternal_grandmother_mother_name' })
  declare maternalGrandmotherMotherName?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, defaultValue: AccountType.PRIVATE, field: 'account_type', validate: { isIn: [Object.values(AccountType)] } })
  declare accountType?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, defaultValue: MaritalStatus.MARRIED, field: 'marital_status', validate: { isIn: [Object.values(MaritalStatus)] } })
  declare maritalStatus?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'wife' })
  declare wife?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'husband' })
  declare husband?: string;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'children' })
  declare children?: string;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'siblings' })
  declare siblings?: string;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'pujari_designation' })
  declare pujariDesignation?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: StakeholderType.NONE, field: 'stakeholder_type', validate: { isIn: [Object.values(StakeholderType)] } })
  declare stakeholderType?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false, field: 'is_staff' })
  declare isStaff?: boolean;

  @Column({ type: DataType.STRING(50), allowNull: true, field: 'voluntary_level', validate: { isIn: [Object.values(GeoSite)] } })
  declare voluntaryLevel?: string;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'pujari_expertise' })
  declare pujariExpertise?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, field: 'pujari_id_type', validate: { isIn: [Object.values(PujariIdType)] } })
  declare pujariIdType?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'pujari_id_image' })
  declare pujariIdImage?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, field: 'pujari_certificate_type', validate: { isIn: [Object.values(PujariCertificateType)] } })
  declare pujariCertificateType?: string;

  // ManyToMany relationships — requires junction tables
  // @BelongsToMany(() => PujariCategory, ...)
  // @BelongsToMany(() => PujariSubCategory, ...)

  @Column({ type: DataType.STRING(50), allowNull: true, field: 'issued_by', validate: { isIn: [Object.values(PujariCertificate)] } })
  declare issuedBy?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, field: 'pujari_type', validate: { isIn: [Object.values(PujariType)] } })
  declare pujariType?: string;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'pujari_video' })
  declare pujariVideo?: unknown;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'mf_image' })
  declare mfImage?: unknown;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'f_mf_image' })
  declare fMfImage?: unknown;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'm_mf_image' })
  declare mMfImage?: unknown;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'ff_mf_image' })
  declare ffMfImage?: unknown;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'fm_mf_image' })
  declare fmMfImage?: unknown;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'mf_mf_image' })
  declare mfMfImage?: unknown;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'mm_mf_image' })
  declare mmMfImage?: unknown;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'last_seen' })
  declare lastSeen?: Date;

  // AbstractUser fields from Django
  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: true, field: 'is_active' })
  declare isActive?: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false, field: 'is_superuser' })
  declare isSuperuser?: boolean;

  @Column({ type: DataType.DATE, allowNull: true, field: 'date_joined' })
  declare dateJoined?: Date;

  @Column({ type: DataType.DATE, allowNull: true, field: 'last_login' })
  declare lastLogin?: Date;
}
