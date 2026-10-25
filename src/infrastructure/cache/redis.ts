/**
 * Infrastructure: Cache & Rate Limiting (Redis / Upstash)
 * Sesuai Bab 3, Bab 11 (Ketersediaan AV-01), dan ADR-13
 *
 * Catatan Arsitektur (ADR-13):
 * Data utama tidak bergantung pada cache. Jika cache tidak tersedia,
 * sistem langsung membaca sumber data utama tanpa kegagalan fatal.
 */

export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlDetik?: number): Promise<void>;
  del(key: string): Promise<void>;
}

class InMemoryFallbackCache implements CacheStore {
  private store = new Map<string, { value: any; expiredAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiredAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set(key: string, value: any, ttlDetik: number = 300): Promise<void> {
    // Default TTL 5 menit (300 detik) sesuai AV-01
    this.store.set(key, {
      value,
      expiredAt: Date.now() + ttlDetik * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export const cacheStore: CacheStore = new InMemoryFallbackCache();
