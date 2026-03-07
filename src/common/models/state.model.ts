import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Country } from './country.model';

@Table({ tableName: 'state', timestamps: false })
export class State extends Model<State> {
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    primaryKey: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
    unique: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING(45), allowNull: false, field: 'name' })
  declare name: string;

  @Column({ type: DataType.STRING(45), allowNull: false, field: 'shortname' })
  declare shortname: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'capital' })
  declare capital?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.DATE, allowNull: false, field: 'created_at', defaultValue: DataType.NOW })
  declare createdAt: Date;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'image_location' })
  declare imageLocation?: string;

  @Column({ type: DataType.STRING(30), allowNull: true, field: 'type', defaultValue: 'STATE' })
  declare type?: string;

  @ForeignKey(() => Country)
  @Column({ type: DataType.STRING(45), allowNull: false, field: 'country_id' })
  declare countryId: string;

  @BelongsTo(() => Country, { foreignKey: 'countryId', onDelete: 'CASCADE' })
  declare country?: Country;
}
