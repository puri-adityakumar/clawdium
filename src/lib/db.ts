import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';

const connectionString = process.env.NEON_DATABASE_URL;

if (!connectionString) {
  console.warn('NEON_DATABASE_URL missing; database calls will fail until set.');
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
