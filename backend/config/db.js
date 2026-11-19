import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dialectOptions = {};
if (process.env.DB_SSL === 'true') {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false,
  };
}

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'mysql',
      logging: false,
      dialectOptions,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: false,
      },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        dialect: 'mysql',
        logging: false,
        dialectOptions,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        define: {
          timestamps: true,
          underscored: false,
        },
      }
    );

export const connectDB = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      // 1. Ensure database exists
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      });
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);

      // 2. Check for existing columns with CHAR/VARCHAR id or departmentId
      const [cols] = await connection.query(
        `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
         AND COLUMN_NAME IN ('id', 'departmentId');`
      );

      const hasStringTypes = cols.some((c) => {
        const type = String(c.DATA_TYPE || c.data_type || '').toLowerCase();
        return type === 'varchar' || type === 'char';
      });

      if (hasStringTypes) {
        console.log('[MySQL Migration]: Incompatible UUID schema detected. Resetting tables to AUTO_INCREMENT INT...');
        const [tables] = await connection.query(
          `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = '${process.env.DB_NAME}';`
        );
        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
        for (const t of tables) {
          const tName = t.TABLE_NAME || t.table_name;
          await connection.query(`DROP TABLE IF EXISTS \`${process.env.DB_NAME}\`.\`${tName}\`;`);
        }
        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
      }

      await connection.end();
    }

    // 3. Connect Sequelize and sync with FOREIGN_KEY_CHECKS disabled during initial creation
    await sequelize.authenticate();
    console.log(`MySQL Connected Successfully`);

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    try {
      await sequelize.sync();
    } catch (syncErr) {
      console.warn(`[MySQL Sync Notice]:`, syncErr.message);
    }
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('MySQL Database Tables Synchronized Successfully');
  } catch (error) {
    console.error(`MySQL Connection Error:`, error.message || error);
    process.exit(1);
  }
};

export default sequelize;
