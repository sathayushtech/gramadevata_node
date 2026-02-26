import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { EntityStatus } from '../../common/enums/entity-status.enum';
import { Register as User } from '../auth/user.model';
import { TourOperator } from './tour-operator.model';

@Table({ tableName: 'add_tour_operator', timestamps: false })
export class AddMoreTourOperator extends Model<AddMoreTourOperator> {
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

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  declare userId?: string;

  @BelongsTo(() => User)
  declare user?: User;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'rating' })
  declare rating?: string;

  @Column({ type: DataType.STRING(15), allowNull: true, field: 'mobile_number' })
  declare mobileNumber?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'website' })
  declare website?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'email' })
  declare email?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'contact_address' })
  declare contactAddress?: string;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'image_location', defaultValue: [] })
  declare imageLocation?: unknown;

  @ForeignKey(() => TourOperator)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'tour_operator_id' })
  declare tourOperatorId?: string;

  @BelongsTo(() => TourOperator)
  declare tourOperator?: TourOperator;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    field: 'status',
    defaultValue: EntityStatus.INACTIVE,
    validate: { isIn: [Object.values(EntityStatus)] },
  })
  declare status?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: Date;
}
