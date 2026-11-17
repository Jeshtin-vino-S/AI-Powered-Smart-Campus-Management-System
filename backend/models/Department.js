import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Department = sequelize.define(
  'Department',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    establishedYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    intakeCapacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    hodId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'departments',
    timestamps: true,
  }
);

export default Department;
