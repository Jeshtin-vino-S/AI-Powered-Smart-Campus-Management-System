import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Timetable = sequelize.define(
  'Timetable',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    semester: {
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
    dayOfWeek: {
      type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
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
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    facultyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    roomNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'timetables',
    timestamps: true,
    indexes: [
      {
        name: 'idx_timetable_dept_sem_day',
        fields: ['departmentId', 'semester', 'dayOfWeek'],
      },
      {
        name: 'idx_timetable_faculty_day',
        fields: ['facultyId', 'dayOfWeek'],
      },
    ],
  }
);

export default Timetable;
