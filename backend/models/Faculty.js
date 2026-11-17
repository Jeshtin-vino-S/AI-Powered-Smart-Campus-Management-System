import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Faculty = sequelize.define(
  'Faculty',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    employeeId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    qualification: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    joiningDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    teachingLoadHours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 16,
    },
    cabinNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
  },
  {
    tableName: 'faculties',
    timestamps: true,
    indexes: [
      {
        name: 'idx_faculties_dept',
        fields: ['departmentId'],
      },
      {
        name: 'idx_faculties_user',
        fields: ['userId'],
      },
    ],
  }
);

export default Faculty;
