const Redis = require('redis');

class RedisCache {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.retryAttempts = 0;
        this.maxRetries = 5;
    }

    async connect() {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            
            this.client = Redis.createClient({
                url: redisUrl,
                retry_strategy: (options) => {
                    if (options.error && options.error.code === 'ECONNREFUSED') {
                        console.error('Redis server connection refused');
                        return new Error('Redis server connection refused');
                    }
                    if (options.total_retry_time > 1000 * 60 * 60) {
                        console.error('Redis retry time exhausted');
                        return new Error('Retry time exhausted');
                    }
                    if (options.attempt > this.maxRetries) {
                        console.error('Redis max retries reached');
                        return undefined;
                    }
                    return Math.min(options.attempt * 100, 3000);
                }
            });

            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('✅ Redis connected successfully');
                this.isConnected = true;
                this.retryAttempts = 0;
            });

            this.client.on('ready', () => {
                console.log('✅ Redis client ready');
            });

            this.client.on('end', () => {
                console.log('Redis connection ended');
                this.isConnected = false;
            });

            await this.client.connect();
            return true;
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            this.isConnected = false;
            return false;
        }
    }

    async disconnect() {
        if (this.client && this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
        }
    }

    async set(key, value, ttl = 3600) {
        if (!this.isConnected) {
            console.warn('Redis not connected, skipping cache set');
            return false;
        }

        try {
            const serializedValue = JSON.stringify(value);
            if (ttl > 0) {
                await this.client.setEx(key, ttl, serializedValue);
            } else {
                await this.client.set(key, serializedValue);
            }
            return true;
        } catch (error) {
            console.error('Redis set error:', error);
            return false;
        }
    }

    async get(key) {
        if (!this.isConnected) {
            return null;
        }

        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }

    async del(key) {
        if (!this.isConnected) {
            return false;
        }

        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            console.error('Redis delete error:', error);
            return false;
        }
    }

    async exists(key) {
        if (!this.isConnected) {
            return false;
        }

        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            console.error('Redis exists error:', error);
            return false;
        }
    }

    async increment(key, amount = 1) {
        if (!this.isConnected) {
            return null;
        }

        try {
            return await this.client.incrBy(key, amount);
        } catch (error) {
            console.error('Redis increment error:', error);
            return null;
        }
    }

    async expire(key, ttl) {
        if (!this.isConnected) {
            return false;
        }

        try {
            await this.client.expire(key, ttl);
            return true;
        } catch (error) {
            console.error('Redis expire error:', error);
            return false;
        }
    }

    async keys(pattern) {
        if (!this.isConnected) {
            return [];
        }

        try {
            return await this.client.keys(pattern);
        } catch (error) {
            console.error('Redis keys error:', error);
            return [];
        }
    }

    async flushPattern(pattern) {
        if (!this.isConnected) {
            return false;
        }

        try {
            const keys = await this.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
            return true;
        } catch (error) {
            console.error('Redis flush pattern error:', error);
            return false;
        }
    }

    async setUserCache(userId, userData, ttl = 1800) {
        return await this.set(`user:${userId}`, userData, ttl);
    }

    async getUserCache(userId) {
        return await this.get(`user:${userId}`);
    }

    async invalidateUserCache(userId) {
        return await this.del(`user:${userId}`);
    }

    async setLeaderboardCache(category, data, ttl = 900) {
        return await this.set(`leaderboard:${category}`, data, ttl);
    }

    async getLeaderboardCache(category) {
        return await this.get(`leaderboard:${category}`);
    }

    async invalidateLeaderboardCache() {
        return await this.flushPattern('leaderboard:*');
    }

    async setCooldown(userId, command, duration) {
        const key = `cooldown:${userId}:${command}`;
        return await this.set(key, Date.now(), duration);
    }

    async getCooldown(userId, command) {
        const key = `cooldown:${userId}:${command}`;
        return await this.get(key);
    }

    async setRateLimit(identifier, limit, window) {
        const key = `ratelimit:${identifier}`;
        const current = await this.increment(key);
        
        if (current === 1) {
            await this.expire(key, window);
        }
        
        return {
            current,
            limit,
            remaining: Math.max(0, limit - current),
            resetTime: Date.now() + (window * 1000)
        };
    }

    async getRateLimit(identifier) {
        const key = `ratelimit:${identifier}`;
        const current = await this.get(key);
        return current || 0;
    }

    async setSessionData(sessionId, data, ttl = 86400) {
        return await this.set(`session:${sessionId}`, data, ttl);
    }

    async getSessionData(sessionId) {
        return await this.get(`session:${sessionId}`);
    }

    async invalidateSession(sessionId) {
        return await this.del(`session:${sessionId}`);
    }

    async healthCheck() {
        if (!this.isConnected) {
            return false;
        }

        try {
            const result = await this.client.ping();
            return result === 'PONG';
        } catch (error) {
            console.error('Redis health check failed:', error);
            return false;
        }
    }

    async getStats() {
        if (!this.isConnected) {
            return { connected: false };
        }

        try {
            const info = await this.client.info();
            const lines = info.split('\r\n');
            const stats = {};
            
            lines.forEach(line => {
                if (line.includes(':')) {
                    const [key, value] = line.split(':');
                    stats[key] = value;
                }
            });

            return {
                connected: true,
                memory: stats.used_memory_human,
                connections: stats.connected_clients,
                commands: stats.total_commands_processed,
                uptime: stats.uptime_in_seconds
            };
        } catch (error) {
            console.error('Failed to get Redis stats:', error);
            return { connected: false, error: error.message };
        }
    }
}

module.exports = RedisCache;
