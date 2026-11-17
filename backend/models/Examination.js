import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Examination = sequelize.define(
  'Examination',
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
    type: {
      type: DataTypes.ENUM('midterm', 'final', 'quiz', 'internal'),
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
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    examDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    totalMarks: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    passingMarks: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    roomNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'examinations',
    timestamps: true,
  }
);

export default Examination;
