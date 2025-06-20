import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// Use dynamic import for dialectModule in ESM
const pg = await import('pg');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    dialectModule: pg.default,  // <-- this is key
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

export default sequelize;
