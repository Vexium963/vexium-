const Redis = require('./redis');
const constants = require('./constants');

class DailyCapsManager {
    constructor() {
        this.redis = Redis;
    }

    async checkDailyCap(userId, capType, amount = 1) {
        const today = new Date().toISOString().split('T')[0];
        const key = `daily_cap:${capType}:${userId}:${today}`;
        
        const currentUsage = await this.redis.get(key) || 0;
        const cap = constants.DAILY_CAPS[capType];
        
        if (!cap) return { allowed: true, remaining: Infinity };
        
        const newUsage = parseInt(currentUsage) + amount;
        
        if (newUsage > cap) {
            return {
                allowed: false,
                remaining: Math.max(0, cap - parseInt(currentUsage)),
                cap: cap,
                resetTime: this.getResetTime()
            };
        }
        
        await this.redis.set(key, newUsage, 86400);
        
        return {
            allowed: true,
            remaining: cap - newUsage,
            cap: cap
        };
    }

    async getDailyUsage(userId, capType) {
        const today = new Date().toISOString().split('T')[0];
        const key = `daily_cap:${capType}:${userId}:${today}`;
        
        const usage = await this.redis.get(key) || 0;
        const cap = constants.DAILY_CAPS[capType] || Infinity;
        
        return {
            used: parseInt(usage),
            remaining: Math.max(0, cap - parseInt(usage)),
            cap: cap,
            resetTime: this.getResetTime()
        };
    }

    getResetTime() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
    }

    async resetUserCaps(userId) {
        const today = new Date().toISOString().split('T')[0];
        const pattern = `daily_cap:*:${userId}:${today}`;
        
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
        
        return { reset: keys.length };
    }
}

module.exports = new DailyCapsManager();
