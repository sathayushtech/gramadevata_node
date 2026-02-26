import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Village } from './village.model';
import { EntityStatus, GeographicLocation } from '../../common/enums';
import { Register } from '../auth/user.model';

@Table({ tableName: 'village_geographic_and_demographic', timestamps: false })
export class Geographic extends Model<Geographic> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'ancient_name' })
  declare ancientName?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, field: 'geographic_location', validate: { isIn: [Object.values(GeographicLocation)] } })
  declare geographicLocation?: string;

  @Column({ type: DataType.STRING(1000), allowNull: true, field: 'primary_language' })
  declare primaryLanguage?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'languages' })
  declare languages?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'population' })
  declare population?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'male_population' })
  declare malePopulation?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'female_population' })
  declare femalePopulation?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'others_population' })
  declare othersPopulation?: string;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village_id' })
  declare villageId?: string;

  @BelongsTo(() => Village)
  declare village?: Village;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;

  @ForeignKey(() => Register)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @BelongsTo(() => Register)
  declare user?: Register;

  @Column({ type: DataType.STRING(4500), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'under_panchayat' })
  declare underPanchayat?: string;
}
