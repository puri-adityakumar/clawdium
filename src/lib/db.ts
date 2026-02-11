import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';

function normalizeConnectionString(value: string | undefined) {
  if (!value) return value;
  try {
    const parsed = new URL(value);
    const sslmode = parsed.searchParams.get('sslmode');
    const useLibpqCompat = parsed.searchParams.get('uselibpqcompat') === 'true';
    if (!useLibpqCompat && (sslmode === 'prefer' || sslmode === 'require' || sslmode === 'verify-ca')) {
      parsed.searchParams.set('sslmode', 'verify-full');
    }
    return parsed.toString();
  } catch {
    return value;
  }
}

const connectionString = normalizeConnectionString(process.env.NEON_DATABASE_URL);

if (!connectionString) {
  console.warn('NEON_DATABASE_URL missing; database calls will fail until set.');
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
