import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('announcement', 'alert', 'attendance', 'assignment', 'exam', 'placement'),
      allowNull: false,
      defaultValue: 'announcement',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
  },
  {
    tableName: 'notifications',
    timestamps: true,
  }
);

export default Notification;
