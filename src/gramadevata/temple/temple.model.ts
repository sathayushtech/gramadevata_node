import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Village } from '../villages/village.model';
// import { TempleCategory } from './temple-category.model';
// import { TemplePriority } from './temple-priority.model';
// import { Register } from '../auth/register.model';
import { Country } from '../../common/models/country.model';
import { ActivityOption, EntityStatus, Era, GeoSite, TempleStyle } from '../../common/enums';

@Table({ tableName: 'temple', timestamps: false })
export class Temple extends Model<Temple> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  // @ForeignKey(() => TempleCategory)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'category' })
  // declare category?: string;

  // @BelongsTo(() => TempleCategory)
  // declare templeCategory?: TempleCategory;

  // @ForeignKey(() => TemplePriority)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'priority' })
  // declare priority?: string;

  // @BelongsTo(() => TemplePriority)
  // declare templePriority?: TemplePriority;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'name' })
  declare name?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false, field: 'is_navagraha_established' })
  declare isNavagrahaEstablished?: boolean;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'construction_year' })
  declare constructionYear?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: null, field: 'era', validate: { isIn: [Object.values(Era)] } })
  declare era?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false, field: 'is_destroyed' })
  declare isDestroyed?: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false, field: 'animal_sacrifice_status' })
  declare animalSacrificeStatus?: boolean;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'diety' })
  declare diety?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: TempleStyle.OTHER, field: 'style', validate: { isIn: [Object.values(TempleStyle)] } })
  declare style?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: GeoSite.VILLAGE, field: 'geo_site', validate: { isIn: [Object.values(GeoSite)] } })
  declare geoSite?: string;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'object_id' })
  declare objectId?: string;

  @BelongsTo(() => Village)
  declare village?: Village;

  @Column({ type: DataType.STRING(450), allowNull: true, field: 'temple_map_location' })
  declare templeMapLocation?: string;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'address' })
  declare address?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'contact_name' })
  declare contactName?: string;

  @Column({ type: DataType.STRING(15), allowNull: true, field: 'contact_phone' })
  declare contactPhone?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'contact_email' })
  declare contactEmail?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'image_location' })
  declare imageLocation?: unknown;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'old_temple_code' })
  declare oldTempleCode?: string;

  // @ForeignKey(() => Register)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'user' })
  // declare userId?: string;

  // @BelongsTo(() => Register)
  // declare user?: Register;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false, field: 'can_connect' })
  declare canConnect?: boolean;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'temple_area' })
  declare templeArea?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'temple_timings' })
  declare templeTimings?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'temple_official_website' })
  declare templeOfficialWebsite?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'other_dieties' })
  declare otherDieties?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'temple_management' })
  declare templeManagement?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'sthala_vriksha' })
  declare sthalaVriksha?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'river' })
  declare river?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'ratham' })
  declare ratham?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'other_speciality' })
  declare otherSpeciality?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'sthala_puranam' })
  declare sthalaPuranam?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'architecture' })
  declare architecture?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'longitude' })
  declare longitude?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'latitude' })
  declare latitude?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'dress_code', validate: { isIn: [Object.values(ActivityOption)] } })
  declare dressCode?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'festivals' })
  declare festivals?: string;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'temple_video' })
  declare templeVideo?: unknown;

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

  @ForeignKey(() => Country)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'country' })
  declare countryId?: string;

  @BelongsTo(() => Country)
  declare countryRef?: Country;
}