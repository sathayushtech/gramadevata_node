import { Column, DataType, Model, Table, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { Village } from '../villages/village.model';
import { ActivityOption, EntityStatus, EventStatusEnum, EventTag, GeoSite } from '../../common/enums';

@Table({ tableName: 'event', timestamps: false })
export class Event extends Model<Event> {
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    primaryKey: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: string;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'object_id' })
  declare objectId?: string;

  @BelongsTo(() => Village)
  declare village?: Village;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'category' })
  declare category?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'name' })
  declare name?: string;

  @Column({ type: DataType.DATEONLY, allowNull: true, field: 'start_date' })
  declare startDate?: string;

  @Column({ type: DataType.DATEONLY, allowNull: true, field: 'end_date' })
  declare endDate?: string;

  @Column({ type: DataType.TIME, allowNull: true, field: 'start_time' })
  declare startTime?: string;

  @Column({ type: DataType.TIME, allowNull: true, field: 'end_time' })
  declare endTime?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, field: 'tag', validate: { isIn: [Object.values(EventTag)] } })
  declare tag?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'tag_id' })
  declare tagId?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'tag_type_id' })
  declare tagTypeId?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: Date;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: GeoSite.VILLAGE, field: 'geo_site', validate: { isIn: [Object.values(GeoSite)] } })
  declare geoSite?: string;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'content_type_id' })
  declare contentTypeId?: number;

  @Column({ type: DataType.STRING(450), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @Column({ type: DataType.STRING(200), allowNull: true, field: 'address' })
  declare address?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'contact_name' })
  declare contactName?: string;

  @Column({ type: DataType.STRING(10), allowNull: true, field: 'contact_phone' })
  declare contactPhone?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'contact_email' })
  declare contactEmail?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'image_location' })
  declare imageLocation?: unknown;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EventStatusEnum.UPCOMING, field: 'event_status', validate: { isIn: [Object.values(EventStatusEnum)] } })
  declare eventStatus?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'event_video' })
  declare eventVideo?: unknown;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'organized_by' })
  declare organizedBy?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'food', validate: { isIn: [Object.values(ActivityOption)] } })
  declare food?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'water', validate: { isIn: [Object.values(ActivityOption)] } })
  declare water?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: ActivityOption.NO, field: 'toilets', validate: { isIn: [Object.values(ActivityOption)] } })
  declare toilets?: string;

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

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'country' })
  declare countryId?: string;
}
