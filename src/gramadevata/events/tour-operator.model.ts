import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'tour_operator', timestamps: false })
export class TourOperator extends Model<TourOperator> {
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
    primaryKey: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'tour_operator_name' })
  declare tourOperatorName?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'temple_id' })
  declare templeId?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'rating' })
  declare rating?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: Date;

  @Column({ type: DataType.STRING(15), allowNull: true, field: 'mobile_number' })
  declare mobileNumber?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'website' })
  declare website?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'email' })
  declare email?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'village_id' })
  declare villageId?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'contact_address' })
  declare contactAddress?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, field: 'status' })
  declare status?: string;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'event_id' })
  declare eventId?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'image_location' })
  declare imageLocation?: unknown;
}
