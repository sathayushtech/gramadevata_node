import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Village } from '../villages/village.model';
import { WelfareHomesCategory } from './welfare-homes-category.model';
import { Country } from '../../common/models/country.model';
import { ActivityOption, EntityStatus } from '../../common/enums';
import { Register } from '../auth/user.model';

@Table({ tableName: 'welfare_homes', timestamps: false })
export class WelfareHomes extends Model<WelfareHomes> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'name' })
  declare name?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.DATE, allowNull: false, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  @Column({
    type: DataType.TEXT('long'),
    allowNull: true,
    field: 'image_location',
    get(this: WelfareHomes) {
      const raw = this.getDataValue('imageLocation');
      if (typeof raw !== 'string') return raw;
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    },
    set(this: WelfareHomes, value: unknown) {
      if (value === null || value === undefined) {
        this.setDataValue('imageLocation', null);
        return;
      }
      if (typeof value === 'string') {
        this.setDataValue('imageLocation', value);
        return;
      }
      this.setDataValue('imageLocation', JSON.stringify(value));
    },
  })
  declare imageLocation?: unknown;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village_id' })
  declare villageId?: string;

  @BelongsTo(() => Village)
  declare village?: Village;

  @ForeignKey(() => Register)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user' })
  declare userId?: string | null;

  @BelongsTo(() => Register)
  declare user?: Register;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'address' })
  declare address?: string;

  @ForeignKey(() => WelfareHomesCategory)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'category' })
  declare categoryId?: string;

  @BelongsTo(() => WelfareHomesCategory)
  declare category?: WelfareHomesCategory;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'contact_number' })
  declare contactNumber?: string;

  @Column({ type: DataType.STRING(254), allowNull: true, field: 'email' })
  declare email?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'website' })
  declare website?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'is_government', validate: { isIn: [Object.values(ActivityOption)] } })
  declare isGovernment?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, field: 'established_year' })
  declare establishedYear?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'medical_care', validate: { isIn: [Object.values(ActivityOption)] } })
  declare medicalCare?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'food_and_shelter', validate: { isIn: [Object.values(ActivityOption)] } })
  declare foodAndShelter?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'counseling_services', validate: { isIn: [Object.values(ActivityOption)] } })
  declare counselingServices?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'rehabilitation_programs', validate: { isIn: [Object.values(ActivityOption)] } })
  declare rehabilitationPrograms?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'skill_training', validate: { isIn: [Object.values(ActivityOption)] } })
  declare skillTraining?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'mental_health_support', validate: { isIn: [Object.values(ActivityOption)] } })
  declare mentalHealthSupport?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'legal_aid', validate: { isIn: [Object.values(ActivityOption)] } })
  declare legalAid?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'is_24_7_support', validate: { isIn: [Object.values(ActivityOption)] } })
  declare is247Support?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'security', validate: { isIn: [Object.values(ActivityOption)] } })
  declare security?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'education', validate: { isIn: [Object.values(ActivityOption)] } })
  declare education?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'physiotherapy', validate: { isIn: [Object.values(ActivityOption)] } })
  declare physiotherapy?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'play_area', validate: { isIn: [Object.values(ActivityOption)] } })
  declare playArea?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'recreational_activities', validate: { isIn: [Object.values(ActivityOption)] } })
  declare recreationalActivities?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'adoption_services', validate: { isIn: [Object.values(ActivityOption)] } })
  declare adoptionServices?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'family_counseling', validate: { isIn: [Object.values(ActivityOption)] } })
  declare familyCounseling?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'emergency_response', validate: { isIn: [Object.values(ActivityOption)] } })
  declare emergencyResponse?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'special_needs_support', validate: { isIn: [Object.values(ActivityOption)] } })
  declare specialNeedsSupport?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'welfare_fee' })
  declare welfareFee?: string;

  @ForeignKey(() => Country)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'country' })
  declare countryId?: string | null;

  @BelongsTo(() => Country)
  declare country?: Country;
}
