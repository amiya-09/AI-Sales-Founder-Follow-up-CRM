import { Pool } from "pg";

// One shared connection pool, reused across all API routes.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Neon requires SSL
});

export default pool;
