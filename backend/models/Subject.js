import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Subject = sequelize.define(
  'Subject',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    credits: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('theory', 'practical', 'elective'),
      allowNull: false,
    },
    syllabus: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    facultyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'subjects',
    timestamps: true,
    indexes: [
      {
        name: 'idx_subjects_dept_sem',
        fields: ['departmentId', 'semester'],
      },
      {
        name: 'idx_subjects_faculty',
        fields: ['facultyId'],
      },
    ],
  }
);

export default Subject;
