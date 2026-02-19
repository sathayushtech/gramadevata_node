import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Village = sequelize.define(
  'Village',
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV1,
      field: '_id',
    },
    name: {
      type: DataTypes.STRING(45),
      allowNull: false,
      field: 'name',
    },
    desc: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'desc',
    },
    mapUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'map_url',
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'INACTIVE',
      field: 'status',
    },
    pinCode: {
      type: DataTypes.STRING(15),
      allowNull: true,
      field: 'pin_code',
    },
    blockId: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'block_id',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'created_at',
    },
    imageLocation: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'image_location',
    },
    userId: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'user',
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: 'VILLAGE',
      field: 'type',
    },
    oldVillageCode: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'old_village_code',
    },
    villageVideo: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'village_video',
    },
    precedence: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'precedence',
    },
  },
  {
    tableName: 'village',
    timestamps: false,
  }
);

export default Village;
