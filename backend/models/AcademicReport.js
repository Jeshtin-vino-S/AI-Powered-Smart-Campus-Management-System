import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AcademicReport = sequelize.define(
  'AcademicReport',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    riskLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'low',
    },
    riskFactors: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    recommendedInterventions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    aiAnalysis: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    lastEvaluated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'academic_reports',
    timestamps: true,
  }
);

export default AcademicReport;
