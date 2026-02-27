import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ActivityOption } from '../../common/enums/activity-option.enum';
import { EntityStatus } from '../../common/enums/entity-status.enum';
import { Era } from '../../common/enums/era.enum';
import { GeoSite } from '../../common/enums/geosite.enum';
import { TempleStyle } from '../../common/enums/temple-style.enum';
import { Country } from '../../common/models/country.model';
import { Register as User } from '../auth/user.model';
import { Village } from '../villages/village.model';
import { TempleCategory } from './temple-category.model';
import { TemplePriority } from './temple-priority.model';

@Table({ tableName: 'temple', timestamps: false })
export class Temple extends Model<Temple> {
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    primaryKey: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
    unique: true,
  })
  declare id: string;

  @ForeignKey(() => TempleCategory)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'category' })
  declare categoryId?: string;

  @BelongsTo(() => TempleCategory, { foreignKey: 'categoryId', onDelete: 'SET NULL' })
  declare category?: TempleCategory;

  @ForeignKey(() => TemplePriority)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'priority' })
  declare priorityId?: string;

  @BelongsTo(() => TemplePriority, { foreignKey: 'priorityId', onDelete: 'SET NULL' })
  declare priority?: TemplePriority;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'name' })
  declare name?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: true, field: 'is_navagraha_established', defaultValue: false })
  declare isNavagrahaEstablished?: boolean;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'construction_year' })
  declare constructionYear?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    field: 'era',
    validate: { isIn: [Object.values(Era)] },
  })
  declare era?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, field: 'is_destroyed', defaultValue: false })
  declare isDestroyed: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, field: 'animal_sacrifice_status', defaultValue: false })
  declare animalSacrificeStatus: boolean;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'diety' })
  declare diety?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    field: 'style',
    defaultValue: TempleStyle.OTHER,
    validate: { isIn: [Object.values(TempleStyle)] },
  })
  declare style?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    field: 'geo_site',
    defaultValue: GeoSite.VILLAGE,
    validate: { isIn: [Object.values(GeoSite)] },
  })
  declare geoSite?: string;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'object_id' })
  declare objectId?: string;

  @BelongsTo(() => Village, { foreignKey: 'objectId', onDelete: 'SET NULL' })
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

  @Column({ type: DataType.DATE, allowNull: false, field: 'created_at', defaultValue: DataType.NOW })
  declare createdAt: Date;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    field: 'status',
    defaultValue: EntityStatus.INACTIVE,
    validate: { isIn: [Object.values(EntityStatus)] },
  })
  declare status: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'image_location' })
  declare imageLocation?: unknown;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'old_temple_code' })
  declare oldTempleCode?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user' })
  declare userId?: string;

  @BelongsTo(() => User, { foreignKey: 'userId', onDelete: 'SET NULL' })
  declare user?: User;

  @Column({ type: DataType.BOOLEAN, allowNull: true, field: 'can_connect', defaultValue: false })
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

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    field: 'dress_code',
    defaultValue: ActivityOption.NO,
    validate: { isIn: [Object.values(ActivityOption)] },
  })
  declare dressCode: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'festivals' })
  declare festivals?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'temple_video', defaultValue: [] })
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

  @BelongsTo(() => Country, { foreignKey: 'countryId', onDelete: 'CASCADE' })
  declare country?: Country;
}