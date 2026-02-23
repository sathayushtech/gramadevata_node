import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Village } from './village.model';
import { EntityStatus } from '../../common/enums';
// import { Register } from '../auth/user.model';

@Table({ tableName: 'village_artists', timestamps: false })
export class VillageArtist extends Model<VillageArtist> {
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

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'artist_name' })
  declare artistName?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'artist_image' })
  declare artistImage?: unknown;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'traditional_occupation' })
  declare traditionalOccupation?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'traditional_occupation_pics' })
  declare traditionalOccupationPics?: unknown;

  @Column({ type: DataType.JSON, allowNull: true, field: 'traditional_occupation_video' })
  declare traditionalOccupationVideo?: unknown;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'trained_under' })
  declare trainedUnder?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'trained_under_pics' })
  declare trainedUnderPics?: unknown;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'other_artists_list' })
  declare otherArtistsList?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'audio_recordings' })
  declare audioRecordings?: unknown;

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
