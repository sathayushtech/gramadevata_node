import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { TourOperator } from './tour-operator.model';
import { EntityStatus } from '../../common/enums';
// import { Register } from '../auth/user.model';

@Table({ tableName: 'add_tour_operator', timestamps: false })
export class AddTourOperator extends Model<AddTourOperator> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'tour_operator_name' })
  declare tourOperatorName?: string;

  // @ForeignKey(() => Register)
  // @Column({ type: DataType.STRING(45), allowNull: true, field: 'user_id' })
  // declare userId?: string;

  // @BelongsTo(() => Register)
  // declare user?: Register;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'rating' })
  declare rating?: string;

  @Column({ type: DataType.STRING(15), allowNull: true, field: 'mobile_number' })
  declare mobileNumber?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'website' })
  declare website?: string;

  @Column({ type: DataType.STRING(254), allowNull: true, field: 'email' })
  declare email?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'contact_address' })
  declare contactAddress?: string;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'map_location' })
  declare mapLocation?: string;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [], field: 'image_location' })
  declare imageLocation?: unknown;

  @ForeignKey(() => TourOperator)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'tour_operator_id' })
  declare tourOperatorId?: string;

  @BelongsTo(() => TourOperator)
  declare tourOperator?: TourOperator;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: CreationOptional<Date>;
}
