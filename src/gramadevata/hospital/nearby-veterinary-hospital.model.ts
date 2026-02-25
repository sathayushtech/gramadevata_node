import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'nearby_vetarnary_hospital', timestamps: false })
export class NearbyVeterinaryHospital extends Model<NearbyVeterinaryHospital> {
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    primaryKey: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'name' })
  declare name?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'address' })
  declare address?: string;

  @Column({ type: DataType.STRING(1000), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'image_location' })
  declare imageLocation?: unknown;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village_id' })
  declare villageId?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'doctor_name' })
  declare doctorName?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'goshala_id' })
  declare goshalaId?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'status' })
  declare status?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: Date;

  @Column({ type: DataType.STRING(20), allowNull: true, field: 'contact_number' })
  declare contactNumber?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'license_copy' })
  declare licenseCopy?: string;
}
