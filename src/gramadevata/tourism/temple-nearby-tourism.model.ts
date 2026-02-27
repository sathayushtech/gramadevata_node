import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { EntityStatus } from '../../common/enums/entity-status.enum';
import { Country } from '../../common/models/country.model';
import { Register as User } from '../auth/user.model';
import { Goshala } from '../goshalas/goshala.model';
import { Temple } from '../temple/temple.model';
import { Village } from '../villages/village.model';

@Table({ tableName: 'temple_nearby_tourismplaces', timestamps: false })
export class TempleNearbyTourismPlace extends Model<TempleNearbyTourismPlace> {
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    primaryKey: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
    unique: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'name' })
  declare name?: string;

  @ForeignKey(() => Temple)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @BelongsTo(() => Temple, { foreignKey: 'templeId', onDelete: 'CASCADE' })
  declare temple?: Temple;

  @Column({ type: DataType.DATE, allowNull: false, field: 'created_at', defaultValue: DataType.NOW })
  declare createdAt: Date;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'address' })
  declare address?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @ForeignKey(() => Village)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village_id' })
  declare villageId?: string;

  @BelongsTo(() => Village, { foreignKey: 'villageId', onDelete: 'SET NULL' })
  declare village?: Village;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    field: 'status',
    defaultValue: EntityStatus.INACTIVE,
    validate: { isIn: [Object.values(EntityStatus)] },
  })
  declare status: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @BelongsTo(() => User, { foreignKey: 'userId', onDelete: 'CASCADE' })
  declare user?: User;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'image_location' })
  declare imageLocation?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'timings' })
  declare timings?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'type' })
  declare type?: string;

  @ForeignKey(() => Goshala)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'goshala_id' })
  declare goshalaId?: string;

  @BelongsTo(() => Goshala, { foreignKey: 'goshalaId', onDelete: 'CASCADE' })
  declare goshala?: Goshala;

  @ForeignKey(() => Country)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'country' })
  declare countryId?: string;

  @BelongsTo(() => Country, { foreignKey: 'countryId', onDelete: 'CASCADE' })
  declare country?: Country;
}
