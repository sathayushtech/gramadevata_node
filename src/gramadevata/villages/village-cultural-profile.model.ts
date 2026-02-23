import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Village } from './village.model';
import { EntityStatus } from '../../common/enums';
// import { Register } from '../auth/user.model';

@Table({ tableName: 'village_cultural_profile', timestamps: false })
export class VillageCulturalProfile extends Model<VillageCulturalProfile> {
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

  @Column({ type: DataType.TEXT, allowNull: true, field: 'famous_for' })
  declare famousFor?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'religious_beliefs' })
  declare religiousBeliefs?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'religios_beliefs_image' })
  declare religiousbeliefsImage?: unknown;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'traditional_food' })
  declare traditionalFood?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'traditional_food_image' })
  declare traditionalFoodImage?: unknown;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'traditional_dress' })
  declare traditionalDress?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'traditional_dress_image' })
  declare traditionalDressImage?: unknown;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'traditional_ornaments' })
  declare traditionalOrnaments?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'traditional_ornaments_image' })
  declare traditionalOrnamentsImage?: unknown;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'specific_rituals' })
  declare specificRituals?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'festivals_name' })
  declare festivalsName?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'festivals_image' })
  declare festivalsImage?: unknown;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'festival_participants' })
  declare festivalParticipants?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'festival_organizers' })
  declare festivalOrganizers?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'festival_special_dishes' })
  declare festivalSpecialDishes?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'art_forms_practiced' })
  declare artFormsPracticed?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'art_forms_practiced_image' })
  declare artFormsPracticedImage?: unknown;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'linked_to_rituals' })
  declare linkedToRituals?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'production_techniques' })
  declare productionTechniques?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'display_sale_occasions' })
  declare displaySaleOccasions?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'stories_songs' })
  declare storiesSongs?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'present_status_of_art' })
  declare presentStatusOfArt?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'suggestions_for_revitalization' })
  declare suggestionsForRevitalization?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'suggestions_for_self_reliant' })
  declare suggestionsForSelfReliant?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  // @ForeignKey(() => Register)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  // declare userId?: string;

  // @BelongsTo(() => Register)
  // declare user?: Register;
}
