import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'ambulance_facility', timestamps: false })
export class AmbulanceFacility extends Model<AmbulanceFacility> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'name' })
  declare name?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'address' })
  declare address?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'contact_number' })
  declare contactNumber?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village_id' })
  declare villageId?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'image_location', defaultValue: [] })
  declare imageLocation?: unknown;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: Date;

  @Column({ type: DataType.STRING(50), allowNull: true, field: 'status' })
  declare status?: string;
}
