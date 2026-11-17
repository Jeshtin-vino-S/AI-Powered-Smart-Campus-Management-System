import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Student = sequelize.define(
  'Student',
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
    rollNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    registrationNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    currentSemester: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    section: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cgpa: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    attendancePercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 100.0,
    },
    guardianName: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    guardianPhone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    guardianEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    mentorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    riskStatus: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'low',
    },
  },
  {
    tableName: 'students',
    timestamps: true,
    indexes: [
      {
        name: 'idx_students_dept_sem',
        fields: ['departmentId', 'currentSemester'],
      },
      {
        name: 'idx_students_user',
        fields: ['userId'],
      },
    ],
  }
);

export default Student;
