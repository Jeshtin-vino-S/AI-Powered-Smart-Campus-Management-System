import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Attendance = sequelize.define(
  'Attendance',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    facultyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'late'),
      allowNull: false,
      defaultValue: 'present',
    },
    sessionToken: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    verificationMethod: {
      type: DataTypes.ENUM('qr', 'manual'),
      allowNull: false,
      defaultValue: 'qr',
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    remarks: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
  },
  {
    tableName: 'attendances',
    timestamps: true,
    indexes: [
      {
        name: 'idx_attendance_student_sub_date',
        fields: ['studentId', 'subjectId', 'date'],
      },
      {
        name: 'idx_attendance_sub_date',
        fields: ['subjectId', 'date'],
      },
    ],
  }
);

export default Attendance;
