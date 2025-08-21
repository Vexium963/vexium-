const RedisCache = require('../database/redis');

class TransactionManager {
    constructor() {
        this.redis = new RedisCache();
        this.isInitialized = false;
    }

    async initialize() {
        if (!this.isInitialized) {
            await this.redis.connect();
            this.isInitialized = true;
        }
    }

    async begin(userId, type, amount) {
        await this.initialize();
        
        const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const lockKey = `session:${type}:${userId}`;
        
        const existingLock = await this.redis.get(lockKey);
        if (existingLock) {
            throw new Error('Transaction already in progress');
        }
        
        await this.redis.set(lockKey, txId, 60);
        
        const pendingKey = `pending:${txId}`;
        await this.redis.set(pendingKey, JSON.stringify({
            userId, type, amount, timestamp: Date.now()
        }), 300); // 5 min TTL
        
        return txId;
    }

    async commit(txId) {
        await this.initialize();
        
        const pendingKey = `pending:${txId}`;
        const txData = await this.redis.get(pendingKey);
        
        if (!txData) {
            throw new Error('Transaction not found or expired');
        }
        
        const { userId, type } = JSON.parse(txData);
        
        await this.redis.del(pendingKey);
        await this.redis.del(`session:${type}:${userId}`);
        
        return { success: true };
    }

    async rollback(txId) {
        await this.initialize();
        
        const pendingKey = `pending:${txId}`;
        const txData = await this.redis.get(pendingKey);
        
        if (txData) {
            const { userId, type, amount } = JSON.parse(txData);
            
            const User = require('../database/models/User');
            const user = new User(userId);
            await user.addVEX(amount, `rollback_${type}`);
            
            await this.redis.del(pendingKey);
            await this.redis.del(`session:${type}:${userId}`);
        }
        
        return { success: true };
    }

    async isLocked(userId, type) {
        await this.initialize();
        
        const lockKey = `session:${type}:${userId}`;
        const lock = await this.redis.get(lockKey);
        return !!lock;
    }

    async clearLock(userId, type) {
        await this.initialize();
        
        const lockKey = `session:${type}:${userId}`;
        await this.redis.del(lockKey);
    }
}

module.exports = new TransactionManager();
