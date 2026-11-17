import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Application = sequelize.define(
  'Application',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    placementId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    applicationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    resumeUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('applied', 'shortlisted', 'interviewing', 'selected', 'rejected'),
      allowNull: false,
      defaultValue: 'applied',
    },
    studentSnapshot: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
  },
  {
    tableName: 'applications',
    timestamps: true,
  }
);

export default Application;
