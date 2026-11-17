import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Placement = sequelize.define(
  'Placement',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    jobRole: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    jobType: {
      type: DataTypes.ENUM('internship', 'fulltime', 'intern_to_ft'),
      allowNull: false,
      defaultValue: 'fulltime',
    },
    salaryPackage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    minimumCgpa: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
    },
    eligibilityCriteria: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    requiredSkills: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    applicationDeadline: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    selectionProcess: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    jobDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    postedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: 'placements',
    timestamps: true,
  }
);

export default Placement;
