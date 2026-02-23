import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Village } from './village.model';
import { EntityStatus } from '../../common/enums';
// import { Register } from '../auth/user.model';

@Table({ tableName: 'village_famous_personalities', timestamps: false })
export class VillageFamousPersonality extends Model<VillageFamousPersonality> {
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

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'person_name' })
  declare personName?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'person_image' })
  declare personImage?: unknown;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'personal_details' })
  declare personalDetails?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'lengends_stories' })
  declare legendsStories?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'person_family' })
  declare personFamily?: string;

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
