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
  })
  declare id: string;

  @Column({ type: DataType.STRING(45), allowNull: false, field: 'name' })
  declare name: string;

  @ForeignKey(() => Country)
  @Column({ type: DataType.STRING(45), allowNull: false, field: 'country_id' })
  declare countryId: string;

  @BelongsTo(() => Country)
  declare country?: Country;
}
