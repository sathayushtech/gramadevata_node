import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Village } from './village.model';
import { ActivityOption, EntityStatus } from '../../common/enums';
import { Register } from '../auth/user.model';

@Table({ tableName: 'village_devlopment_facilities', timestamps: false })
export class VillageDevelopmentFacility extends Model<VillageDevelopmentFacility> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village_id' })
  declare villageId?: string;

  @BelongsTo(() => Village)
  declare village?: Village;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'agriculture' })
  declare agriculture?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'handicraft' })
  declare handicraft?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'handloom' })
  declare handloom?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'smallscale_industry' })
  declare smallscaleIndustry?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'dairy' })
  declare dairy?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'poultry' })
  declare poultry?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'fisheries' })
  declare fisheries?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'cattle_breeding' })
  declare cattleBreeding?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'shepherding' })
  declare shepherding?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'horticulture' })
  declare horticulture?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'others' })
  declare others?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'water_and_irrigation' })
  declare waterAndIrrigation?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'tap_water' })
  declare tapWater?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'toilet' })
  declare toilet?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'health_centre' })
  declare healthCentre?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'school' })
  declare school?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'electricity' })
  declare electricity?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'gas' })
  declare gas?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'post_office' })
  declare postOffice?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'bank' })
  declare bank?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'telephone' })
  declare telephone?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'college' })
  declare college?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'internet' })
  declare internet?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'street_drainage_system' })
  declare streetDrainageSystem?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'shops_and_market' })
  declare shopsAndMarket?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'sports_ground' })
  declare sportsGround?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'public_spaces' })
  declare publicSpaces?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'road_facility' })
  declare roadFacility?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'atm', validate: { isIn: [Object.values(ActivityOption)] } })
  declare atm?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  @ForeignKey(() => Register)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @BelongsTo(() => Register)
  declare user?: Register;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'bank_name' })
  declare bankName?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'bank_contact_number' })
  declare bankContactNumber?: string;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'primarysource_of_livelihood_image' })
  declare primarysourceOfLivelihoodImage?: unknown;
}
