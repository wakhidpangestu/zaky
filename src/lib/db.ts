import { Pool, QueryResult, QueryResultRow } from 'pg';

let globalPool: Pool | null = null;

/**
 * Returns a singleton PostgreSQL connection pool configured for Supabase & Vercel
 */
export function getDbPool(): Pool {
  if (!globalPool) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL;

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL or POSTGRES_URL environment variable is missing. Please set your Supabase connection string.'
      );
    }

    const isCloudDb =
      process.env.NODE_ENV === 'production' ||
      connectionString.includes('supabase.co') ||
      connectionString.includes('pooler.supabase.com');

    globalPool = new Pool({
      connectionString,
      ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    });

    globalPool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });
  }

  return globalPool;
}

/**
 * Helper to execute parameterized SQL query with automatic client disposal
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getDbPool();
  return pool.query<T>(text, params);
}

export default getDbPool;
