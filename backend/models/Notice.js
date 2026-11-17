import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Notice = sequelize.define(
  'Notice',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('normal', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'normal',
    },
    targetRoles: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    postedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'notices',
    timestamps: true,
  }
);

export default Notice;
