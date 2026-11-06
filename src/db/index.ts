import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';

declare global {
  var _postgresPool: InstanceType<typeof Pool> | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    // Cloud SQL Safety Sizing:
    // Real Cloud SQL max_connections is 50 (with 3 reserved for superuser = 47 usable slots).
    // System processes, monitoring agents, and cloudsqlagent consume ~10 connections.
    // Setting default pool max to 6 allows up to 5 Cloud Run instances to scale concurrently (5 * 6 = 30 connections),
    // safely preserving 17-20 connection slots for migrations, background jobs, and PostgreSQL internal buffers.
    // Can be overridden dynamically via SQL_MAX_POOL environment variable when Cloud SQL tier is upgraded.
    const maxPoolSize = process.env.SQL_MAX_POOL ? parseInt(process.env.SQL_MAX_POOL, 10) : 6;
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: Number.isFinite(maxPoolSize) && maxPoolSize > 0 ? maxPoolSize : 6,
      min: 1,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 15000,
      query_timeout: 15000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    global._postgresPool.on('error', (err: Error) => {
      // Idle client error guard - safely handled to prevent process crash
      console.warn('[DB Pool Notice]: Idle database client event handled safely:', err?.message || err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export { pool };
export const db = drizzle(pool, { schema });
