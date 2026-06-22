// scripts/test-db.mjs
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const result = await pool.query("SELECT NOW() AS current_time");
console.log("Connected! Database time is:", result.rows[0].current_time);

const tables = await pool.query(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;
`);
console.log("Tables found:", tables.rows.map(r => r.table_name));

await pool.end();
