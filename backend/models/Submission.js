import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Submission = sequelize.define(
  'Submission',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    assignmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    submissionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    marksObtained: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    evaluatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    evaluatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('submitted', 'evaluated', 'late'),
      allowNull: false,
      defaultValue: 'submitted',
    },
  },
  {
    tableName: 'submissions',
    timestamps: true,
  }
);

export default Submission;
