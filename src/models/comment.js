import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Comment = sequelize.define('Comment',
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: '_id'
    },
    templeId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'temple'
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'user'
    },
    goshalaId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'goshala'
    },
    eventId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'event'
    },
    body: {
      type: DataTypes.STRING(250),
      allowNull: true,
      field: 'body'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'created_at'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'status'
    }
  },
  {
    tableName: 'comment',
    timestamps: false
  }
);

export default Comment;