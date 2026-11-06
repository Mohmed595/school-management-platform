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

    const sqlHost = process.env.SQL_HOST || '';
    // Cloud SQL Unix sockets look like "/cloudsql/project:region:instance" and must be
    // passed as the socket directory. Managed providers (Neon, Supabase, Render, RDS…)
    // require TLS, while local/plain Postgres over TCP usually does not.
    const isUnixSocket = sqlHost.startsWith('/');
    const useSsl =
      process.env.SQL_SSL === 'false'
        ? false
        : process.env.SQL_SSL === 'true'
          ? true
          : !isUnixSocket && sqlHost !== 'localhost' && sqlHost !== '127.0.0.1';

    global._postgresPool = new Pool({
      // For Unix sockets pg expects the socket directory path; for TCP a hostname/IP.
      host: sqlHost,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
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
