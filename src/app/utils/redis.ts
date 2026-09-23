import Redis from 'ioredis';
import { config } from '../config/index.js';

// In-memory fallback cache for when Redis standalone instance is not running
class MemoryCacheStore {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiresAt: number | undefined;
    if (mode === 'EX' && typeof duration === 'number') {
      expiresAt = Date.now() + duration * 1000;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(key: string): Promise<number> {
    const exists = this.store.delete(key);
    return exists ? 1 : 0;
  }

  async flushall(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }
}

class RedisService {
  private client: Redis | null = null;
  private memoryFallback = new MemoryCacheStore();
  private isConnected = false;

  constructor() {
    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        retryStrategy: () => null, // don't spam reconnect loops if redis not hosted locally
        maxRetriesPerRequest: 1,
        connectTimeout: 800,
        lazyConnect: true,
      });

      this.client
        .connect()
        .then(() => {
          this.isConnected = true;
          console.log('⚡ Redis connected successfully');
        })
        .catch(() => {
          this.isConnected = false;
          console.log(
            'ℹ️ Redis server not reachable locally, using high-performance in-memory Redis store',
          );
        });

      this.client.on('error', () => {
        this.isConnected = false;
      });
    } catch {
      this.isConnected = false;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {
        // fallback to memory
      }
    }
    await this.memoryFallback.set(key, value, ttlSeconds ? 'EX' : undefined, ttlSeconds);
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        const val = await this.client.get(key);
        if (val !== null) return val;
      } catch {
        // fallback to memory
      }
    }
    return await this.memoryFallback.get(key);
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch {
        // fallback
      }
    }
    await this.memoryFallback.del(key);
  }

  // OTP Helper Methods
  async setOtp(email: string, otp: string, ttlSeconds = 300): Promise<void> {
    const key = `otp:${email.toLowerCase()}`;
    await this.set(key, otp, ttlSeconds);
  }

  async getOtp(email: string): Promise<string | null> {
    const key = `otp:${email.toLowerCase()}`;
    return await this.get(key);
  }

  async deleteOtp(email: string): Promise<void> {
    const key = `otp:${email.toLowerCase()}`;
    await this.del(key);
  }
}

export const redisClient = new RedisService();
