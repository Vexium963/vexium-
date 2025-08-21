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
        
        const User = require('../database/models/User');
        const user = new User(userId);
        const removeResult = await user.removeVEX(amount, `pending_${type}`, false);
        
        if (!removeResult.success) {
            throw new Error('Insufficient funds');
        }
        
        await this.redis.set(lockKey, txId, 60);
        
        const pendingKey = `pending:${txId}`;
        await this.redis.set(pendingKey, JSON.stringify({
            userId, type, amount, timestamp: Date.now(), ref_tx_id: txId
        }), 300); // 5 min TTL
        
        await this.writeLedger(userId, 'pending', -amount, txId, type);
        
        return txId;
    }

    async commit(txId) {
        await this.initialize();
        
        const pendingKey = `pending:${txId}`;
        const txData = await this.redis.get(pendingKey);
        
        if (!txData) {
            throw new Error('Transaction not found or expired');
        }
        
        const { userId, type, amount } = JSON.parse(txData);
        
        await this.redis.del(pendingKey);
        await this.redis.del(`session:${type}:${userId}`);
        
        await this.writeLedger(userId, 'commit', amount, txId, type);
        
        return { success: true, txId };
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
            
            await this.writeLedger(userId, 'rollback', amount, txId, type);
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

    async writeLedger(userId, type, deltaVEX, ref_tx_id, meta) {
        const Economics = require('./economics');
        const price = Economics.getCurrentPrice();
        
        const ledgerEntry = {
            id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            type,
            deltaVEX,
            price,
            ref_tx_id,
            meta,
            timestamp: new Date().toISOString()
        };
        
        await this.redis.set(`ledger:${ledgerEntry.id}`, JSON.stringify(ledgerEntry), 86400 * 30); // 30 days
        
        return ledgerEntry;
    }

    async getLedgerEntries(userId, limit = 10) {
        await this.initialize();
        
        const pattern = `ledger:*`;
        const keys = await this.redis.keys(pattern);
        const entries = [];
        
        for (const key of keys) {
            const data = await this.redis.get(key);
            if (data) {
                const entry = JSON.parse(data);
                if (entry.userId === userId) {
                    entries.push(entry);
                }
            }
        }
        
        return entries
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }
}

module.exports = new TransactionManager();
