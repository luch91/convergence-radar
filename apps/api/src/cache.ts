import { createClient, type RedisClientType } from "redis";

export interface CacheStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  close(): Promise<void>;
}

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

export class InMemoryCacheStore implements CacheStore {
  private readonly entries = new Map<string, CacheEntry>();

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.entries.get(key);
    if (entry === undefined) {
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.entries.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  }

  async close(): Promise<void> {
    this.entries.clear();
  }
}

export class RedisCacheStore implements CacheStore {
  private readonly client: RedisClientType;

  constructor(redisUrl: string) {
    this.client = createClient({
      url: redisUrl,
      socket: { connectTimeout: 5_000 }
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.client.get(key);
    return value === null ? undefined : JSON.parse(value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  }

  async close(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }
}

export async function createCacheStore(redisUrl: string | undefined): Promise<CacheStore> {
  if (redisUrl === undefined) {
    return new InMemoryCacheStore();
  }

  const cache = new RedisCacheStore(redisUrl);
  try {
    await cache.connect();
    console.log("Redis cache connected.");
    return cache;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    console.error(`Redis cache connection failed. Using in-memory cache. ${message}`);
    await cache.close();
    return new InMemoryCacheStore();
  }
}
