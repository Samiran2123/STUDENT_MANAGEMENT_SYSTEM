require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sms_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

pool.query("UPDATE students SET admission_status = 'pending' WHERE id = 1")
  .then(() => {
    console.log("Reset student 1 to pending");
    pool.end();
  });
