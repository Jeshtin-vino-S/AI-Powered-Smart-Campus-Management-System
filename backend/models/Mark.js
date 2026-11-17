import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Mark = sequelize.define(
  'Mark',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    examinationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    marksObtained: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    maxMarks: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    grade: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    remarks: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    evaluatedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'marks',
    timestamps: true,
    indexes: [
      {
        name: 'idx_marks_student_exam',
        fields: ['studentId', 'examinationId'],
      },
      {
        name: 'idx_marks_subject_exam',
        fields: ['subjectId', 'examinationId'],
      },
    ],
  }
);

export default Mark;
