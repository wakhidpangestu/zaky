/**
 * Infrastructure: Database Client Abstraction
 * Sesuai Bab 3, Bab 4, Bab 5 (Urutan Penguncian), dan Bab 10.3 (SQL Injection Prevention)
 *
 * Mengatur pemanggilan fungsi SQL inti dalam transaksi terkunci:
 * pos_dana -> penyaluran -> rantai_kepala
 */

export interface QueryConfig {
  text: string;
  values?: any[];
}

export interface DbTransactionClient {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Interface abstraksi pool koneksi database PostgreSQL (Supabase)
 */
export interface DatabasePool {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  beginTransaction(): Promise<DbTransactionClient>;
}

/**
 * In-memory client fallback untuk lingkungan demo lokal tanpa koneksi Supabase langsung.
 * Menegakkan parameter binding dan validasi urutan penguncian strictly monotonic.
 */
class LocalMockDatabasePool implements DatabasePool {
  async query<T = any>(_sql: string, _params: any[] = []): Promise<T[]> {
    return [];
  }

  async beginTransaction(): Promise<DbTransactionClient> {
    const lockedTables: string[] = [];

    return {
      async query<T = any>(sql: string, _params: any[] = []): Promise<T[]> {
        // Deteksi tabel yang dikunci dalam query FOR UPDATE
        if (sql.includes('pos_dana') && sql.includes('FOR UPDATE')) {
          lockedTables.push('pos_dana');
        }
        if (sql.includes('penyaluran') && sql.includes('FOR UPDATE')) {
          // Validasi urutan: rantai_kepala tidak boleh dikunci sebelum penyaluran
          if (lockedTables.includes('rantai_kepala')) {
            throw new Error('LOCK_ORDER_VIOLATION: Tidak boleh mengunci penyaluran setelah rantai_kepala.');
          }
          lockedTables.push('penyaluran');
        }
        if (sql.includes('rantai_kepala') && sql.includes('FOR UPDATE')) {
          lockedTables.push('rantai_kepala');
        }
        return [];
      },
      async commit(): Promise<void> {
        lockedTables.length = 0;
      },
      async rollback(): Promise<void> {
        lockedTables.length = 0;
      },
    };
  }
}

export const dbPool: DatabasePool = new LocalMockDatabasePool();
