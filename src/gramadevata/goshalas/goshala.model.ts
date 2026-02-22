import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Village } from '../villages/village.model';

@Table({ tableName: 'goshala', timestamps: false })
export class Goshala extends Model<Goshala> {
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    primaryKey: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'name' })
  declare name?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'category' })
  declare category?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'reg_num' })
  declare regNum?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, field: 'status' })
  declare status?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, field: 'geo_site' })
  declare geoSite?: string;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'object_id' })
  declare objectId?: string;

  @BelongsTo(() => Village)
  declare village?: Village;

  @Column({ type: DataType.STRING(450), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare temple?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'contact_name' })
  declare contactName?: string;

  @Column({ type: DataType.STRING(15), allowNull: true, field: 'contact_phone' })
  declare contactPhone?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'address' })
  declare address?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'email' })
  declare email?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'regn_document' })
  declare regnDocument?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'image_location' })
  declare imageLocation?: unknown;

  @Column({ type: DataType.JSON, allowNull: true, field: 'goshala_video' })
  declare goshalaVideo?: unknown;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user' })
  declare user?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'managed_by' })
  declare managedBy?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'timings' })
  declare timings?: string;

  @Column({ type: DataType.STRING(450), allowNull: true, field: 'official_website' })
  declare officialWebsite?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'country_name' })
  declare countryName?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'state_name' })
  declare stateName?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'district_name' })
  declare districtName?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'block_name' })
  declare blockName?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'village_name' })
  declare villageName?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'other_name' })
  declare otherName?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'devotees_visiting' })
  declare devoteesVisiting?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'feeding_accessibility' })
  declare feedingAccessibility?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'inside_feeding_accessibility' })
  declare insideFeedingAccessibility?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'outside_feeding_accessibility' })
  declare outsideFeedingAccessibility?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'adoption_of_cow_or_bull_inside' })
  declare adoptionOfCowOrBullInside?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'adoption_of_cow_or_bull_outside' })
  declare adoptionOfCowOrBullOutside?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'festivals' })
  declare festivals?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'prayers' })
  declare prayers?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'social_activites' })
  declare socialActivites?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'other_services' })
  declare otherServices?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'country' })
  declare country?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: Date;
}
