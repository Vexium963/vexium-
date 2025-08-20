const PostgreSQLDatabase = require('../postgresql');
const RedisCache = require('../redis');
const constants = require('../../utils/constants');

class UserPostgreSQL {
    constructor(userId) {
        this.userId = userId;
        this.postgres = new PostgreSQLDatabase();
        this.redis = new RedisCache();
        this.cacheEnabled = true;
        this.cacheTTL = 1800; // 30 minutes
    }

    async load() {
        try {
            if (this.cacheEnabled) {
                const cached = await this.redis.getUserCache(this.userId);
                if (cached) {
                    return cached;
                }
            }

            const query = `
                SELECT * FROM users WHERE user_id = $1
            `;
            
            const result = await this.postgres.query(query, [this.userId]);
            
            if (result.rows.length === 0) {
                return await this.createNewUser();
            }

            const userData = this.formatUserData(result.rows[0]);
            
            if (this.cacheEnabled) {
                await this.redis.setUserCache(this.userId, userData, this.cacheTTL);
            }

            return userData;
        } catch (error) {
            console.error(`Error loading user ${this.userId}:`, error);
            throw error;
        }
    }

    async save(userData) {
        try {
            const query = `
                UPDATE users SET
                    username = $2,
                    vex_balance = $3,
                    bank_balance = $4,
                    level = $5,
                    xp = $6,
                    networth = $7,
                    daily_streak = $8,
                    last_daily = $9,
                    last_work = $10,
                    current_job = $11,
                    job_level = $12,
                    job_xp = $13,
                    premium_tier = $14,
                    premium_expires = $15,
                    age_verified = $16,
                    age_verification_date = $17,
                    jurisdiction = $18,
                    profile_data = $19,
                    inventory = $20,
                    investments = $21,
                    achievements = $22,
                    stats = $23,
                    settings = $24,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $1
            `;

            const values = [
                this.userId,
                userData.username,
                userData.vexBalance,
                userData.bankBalance,
                userData.level,
                userData.xp,
                userData.networth,
                userData.dailyStreak,
                userData.lastDaily ? new Date(userData.lastDaily) : null,
                userData.lastWork ? new Date(userData.lastWork) : null,
                userData.currentJob,
                userData.jobLevel,
                userData.jobXp,
                userData.premiumTier,
                userData.premiumExpires ? new Date(userData.premiumExpires) : null,
                userData.ageVerified,
                userData.ageVerificationDate ? new Date(userData.ageVerificationDate) : null,
                userData.jurisdiction,
                JSON.stringify(userData.profile || {}),
                JSON.stringify(userData.inventory || {}),
                JSON.stringify(userData.investments || {}),
                JSON.stringify(userData.achievements || []),
                JSON.stringify(userData.stats || {}),
                JSON.stringify(userData.settings || {})
            ];

            await this.postgres.query(query, values);

            if (this.cacheEnabled) {
                await this.redis.setUserCache(this.userId, userData, this.cacheTTL);
            }

            return { success: true };
        } catch (error) {
            console.error(`Error saving user ${this.userId}:`, error);
            throw error;
        }
    }

    async createNewUser() {
        const userData = {
            userId: this.userId,
            username: null,
            vexBalance: constants.STARTING_BALANCE || 1000.00,
            bankBalance: 0.00,
            level: 1,
            xp: 0,
            networth: constants.STARTING_BALANCE || 1000.00,
            dailyStreak: 0,
            lastDaily: null,
            lastWork: null,
            currentJob: null,
            jobLevel: 1,
            jobXp: 0,
            premiumTier: null,
            premiumExpires: null,
            ageVerified: false,
            ageVerificationDate: null,
            jurisdiction: null,
            profile: {},
            inventory: {},
            investments: {},
            achievements: [],
            stats: {
                commandsUsed: 0,
                totalEarned: 0,
                totalEntertainmentPlayed: 0,
                totalInvested: 0,
                gamesPlayed: 0,
                tradesCompleted: 0
            },
            settings: {},
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const query = `
            INSERT INTO users (
                user_id, username, vex_balance, bank_balance, level, xp, networth,
                daily_streak, last_daily, last_work, current_job, job_level, job_xp,
                premium_tier, premium_expires, age_verified, age_verification_date,
                jurisdiction, profile_data, inventory, investments, achievements,
                stats, settings, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
        `;

        const values = [
            userData.userId,
            userData.username,
            userData.vexBalance,
            userData.bankBalance,
            userData.level,
            userData.xp,
            userData.networth,
            userData.dailyStreak,
            userData.lastDaily,
            userData.lastWork,
            userData.currentJob,
            userData.jobLevel,
            userData.jobXp,
            userData.premiumTier,
            userData.premiumExpires,
            userData.ageVerified,
            userData.ageVerificationDate,
            userData.jurisdiction,
            JSON.stringify(userData.profile),
            JSON.stringify(userData.inventory),
            JSON.stringify(userData.investments),
            JSON.stringify(userData.achievements),
            JSON.stringify(userData.stats),
            JSON.stringify(userData.settings),
            userData.createdAt,
            userData.updatedAt
        ];

        await this.postgres.query(query, values);

        if (this.cacheEnabled) {
            await this.redis.setUserCache(this.userId, userData, this.cacheTTL);
        }

        return userData;
    }

    formatUserData(row) {
        return {
            userId: row.user_id,
            username: row.username,
            vexBalance: parseFloat(row.vex_balance),
            bankBalance: parseFloat(row.bank_balance),
            level: row.level,
            xp: row.xp,
            networth: parseFloat(row.networth),
            dailyStreak: row.daily_streak,
            lastDaily: row.last_daily,
            lastWork: row.last_work,
            currentJob: row.current_job,
            jobLevel: row.job_level,
            jobXp: row.job_xp,
            premiumTier: row.premium_tier,
            premiumExpires: row.premium_expires,
            ageVerified: row.age_verified,
            ageVerificationDate: row.age_verification_date,
            jurisdiction: row.jurisdiction,
            profile: row.profile_data || {},
            inventory: row.inventory || {},
            investments: row.investments || {},
            achievements: row.achievements || [],
            stats: row.stats || {},
            settings: row.settings || {},
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    async addVEX(amount, reason = 'unknown', skipTax = false) {
        try {
            const userData = await this.load();
            
            if (!skipTax && constants.TAX_SYSTEM?.INCOME?.RATE) {
                const taxAmount = amount * constants.TAX_SYSTEM.INCOME.RATE;
                amount -= taxAmount;
                await this.logTransaction('tax_deduction', taxAmount, `Tax on ${reason}`);
            }

            userData.vexBalance += amount;
            userData.networth = userData.vexBalance + userData.bankBalance;
            userData.stats.totalEarned = (userData.stats.totalEarned || 0) + amount;

            await this.save(userData);
            await this.logTransaction('income', amount, reason);

            return { success: true, newBalance: userData.vexBalance };
        } catch (error) {
            console.error(`Error adding VEX to user ${this.userId}:`, error);
            return { success: false, reason: error.message };
        }
    }

    async removeVEX(amount, reason = 'unknown', skipValidation = false) {
        try {
            const userData = await this.load();
            
            if (!skipValidation && userData.vexBalance < amount) {
                return { success: false, reason: 'Insufficient balance' };
            }

            userData.vexBalance -= amount;
            userData.networth = userData.vexBalance + userData.bankBalance;

            await this.save(userData);
            await this.logTransaction('expense', amount, reason);

            return { success: true, newBalance: userData.vexBalance };
        } catch (error) {
            console.error(`Error removing VEX from user ${this.userId}:`, error);
            return { success: false, reason: error.message };
        }
    }

    async burnVEX(amount, reason = 'burn') {
        try {
            await this.logTransaction('burn', amount, reason);
            return { success: true };
        } catch (error) {
            console.error(`Error burning VEX for user ${this.userId}:`, error);
            return { success: false, reason: error.message };
        }
    }

    async logTransaction(type, amount, description, metadata = {}) {
        try {
            const query = `
                INSERT INTO transactions (user_id, type, amount, description, metadata, created_at)
                VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            `;

            const values = [
                this.userId,
                type,
                amount,
                description,
                JSON.stringify(metadata)
            ];

            await this.postgres.query(query, values);
        } catch (error) {
            console.error(`Error logging transaction for user ${this.userId}:`, error);
        }
    }

    async addItem(itemId, quantity = 1) {
        try {
            const userData = await this.load();
            
            if (!userData.inventory[itemId]) {
                userData.inventory[itemId] = 0;
            }
            
            userData.inventory[itemId] += quantity;
            
            await this.save(userData);
            return { success: true };
        } catch (error) {
            console.error(`Error adding item to user ${this.userId}:`, error);
            return { success: false, reason: error.message };
        }
    }

    async removeItem(itemId, quantity = 1) {
        try {
            const userData = await this.load();
            
            if (!userData.inventory[itemId] || userData.inventory[itemId] < quantity) {
                return { success: false, reason: 'Insufficient items' };
            }
            
            userData.inventory[itemId] -= quantity;
            
            if (userData.inventory[itemId] <= 0) {
                delete userData.inventory[itemId];
            }
            
            await this.save(userData);
            return { success: true };
        } catch (error) {
            console.error(`Error removing item from user ${this.userId}:`, error);
            return { success: false, reason: error.message };
        }
    }

    static async getLeaderboard(category, limit = 100) {
        try {
            const postgres = new PostgreSQLDatabase();
            const redis = new RedisCache();
            
            if (redis.isConnected) {
                const cached = await redis.getLeaderboardCache(category);
                if (cached) {
                    return cached;
                }
            }

            let orderBy = 'networth DESC';
            
            switch (category) {
                case 'level':
                    orderBy = 'level DESC, xp DESC';
                    break;
                case 'vexBalance':
                    orderBy = 'vex_balance DESC';
                    break;
                case 'bankBalance':
                    orderBy = 'bank_balance DESC';
                    break;
                case 'totalEarned':
                    orderBy = "(stats->>'totalEarned')::numeric DESC";
                    break;
                case 'totalEntertainmentPlayed':
                    orderBy = "(stats->>'totalEntertainmentPlayed')::numeric DESC";
                    break;
                case 'totalInvested':
                    orderBy = "(stats->>'totalInvested')::numeric DESC";
                    break;
                case 'gamesPlayed':
                    orderBy = "(stats->>'gamesPlayed')::numeric DESC";
                    break;
                case 'tradesCompleted':
                    orderBy = "(stats->>'tradesCompleted')::numeric DESC";
                    break;
            }

            const query = `
                SELECT user_id, username, vex_balance, bank_balance, level, xp, networth,
                       premium_tier, stats, created_at
                FROM users
                ORDER BY ${orderBy}
                LIMIT $1
            `;

            const result = await postgres.query(query, [limit]);
            const leaderboard = result.rows.map(row => ({
                userId: row.user_id,
                username: row.username,
                vexBalance: parseFloat(row.vex_balance),
                bankBalance: parseFloat(row.bank_balance),
                level: row.level,
                xp: row.xp,
                networth: parseFloat(row.networth),
                premiumTier: row.premium_tier,
                stats: row.stats || {},
                createdAt: row.created_at
            }));

            if (redis.isConnected) {
                await redis.setLeaderboardCache(category, leaderboard, 900); // 15 minutes
            }

            return leaderboard;
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return [];
        }
    }

    async invalidateCache() {
        if (this.cacheEnabled) {
            await this.redis.invalidateUserCache(this.userId);
        }
    }
}

module.exports = UserPostgreSQL;
