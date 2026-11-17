import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Assignment = sequelize.define(
  'Assignment',
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
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    facultyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    maxMarks: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    attachmentUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    totalSubmissions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: 'assignments',
    timestamps: true,
  }
);

export default Assignment;
