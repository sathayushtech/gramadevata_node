import { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Block } from '../../common/models/block.model';
import { EntityStatus } from '../../common/enums';

@Table({ tableName: 'village', timestamps: false })
export class Village extends Model<Village> {
  @Column({
    type: DataType.UUID,
    allowNull: false,
    primaryKey: true,
    field: '_id',
    defaultValue: DataType.UUIDV1,
  })
  declare id: CreationOptional<string>;

  @Column({ type: DataType.STRING(45), allowNull: false, field: 'name' })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'desc' })
  declare desc?: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'map_url' })
  declare mapUrl?: string;

  @Column({ type: DataType.STRING(50), allowNull: true, defaultValue: EntityStatus.INACTIVE, field: 'status', validate: { isIn: [Object.values(EntityStatus)] } })
  declare status?: string;

  @Column({ type: DataType.STRING(15), allowNull: true, field: 'pin_code' })
  declare pinCode?: string;

  @ForeignKey(() => Block)
  @Column({ type: DataType.STRING(45), allowNull: true, field: 'block_id' })
  declare blockId?: string;

  @BelongsTo(() => Block)
  declare block?: Block;

  @Column({ type: DataType.DATE, allowNull: true, field: 'created_at' })
  declare createdAt?: Date;

  @Column({ type: DataType.JSON, allowNull: true, field: 'image_location' })
  declare imageLocation?: unknown;

  @Column({ type: DataType.STRING, allowNull: true, field: 'user_id' })
  declare userId?: string;

  @Column({ type: DataType.STRING(30), allowNull: true, defaultValue: 'VILLAGE', field: 'type' })
  declare type?: string;

  @Column({ type: DataType.STRING(45), allowNull: true, field: 'old_village_code' })
  declare oldVillageCode?: string;

  @Column({ type: DataType.JSON, allowNull: true, field: 'village_video' })
  declare villageVideo?: unknown;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'precedence' })
  declare precedence?: number;
}
