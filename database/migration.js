const fs = require('fs').promises;
const path = require('path');
const PostgreSQLDatabase = require('./postgresql');
const RedisCache = require('./redis');

class DatabaseMigration {
    constructor() {
        this.postgres = new PostgreSQLDatabase();
        this.redis = new RedisCache();
        this.jsonDataPath = path.join(__dirname, 'data');
        this.backupPath = path.join(__dirname, 'backup');
    }

    async initialize() {
        console.log('🚀 Starting database migration process...');
        
        try {
            await this.postgres.initialize();
            await this.redis.connect();
            console.log('✅ Database connections established');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize databases:', error);
            return false;
        }
    }

    async createBackup() {
        console.log('📦 Creating backup of existing JSON data...');
        
        try {
            await fs.mkdir(this.backupPath, { recursive: true });
            
            const files = await fs.readdir(this.jsonDataPath);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const sourcePath = path.join(this.jsonDataPath, file);
                    const backupFileName = `${timestamp}_${file}`;
                    const backupFilePath = path.join(this.backupPath, backupFileName);
                    
                    await fs.copyFile(sourcePath, backupFilePath);
                    console.log(`✅ Backed up ${file} to ${backupFileName}`);
                }
            }
            
            console.log('✅ Backup completed successfully');
            return true;
        } catch (error) {
            console.error('❌ Backup failed:', error);
            return false;
        }
    }

    async migrateUsers() {
        console.log('👥 Migrating user data to PostgreSQL...');
        
        try {
            const usersFilePath = path.join(this.jsonDataPath, 'users.json');
            
            let userData = {};
            try {
                const fileContent = await fs.readFile(usersFilePath, 'utf8');
                userData = JSON.parse(fileContent);
            } catch (error) {
                console.log('No existing users.json file found, starting fresh');
                return true;
            }

            let migratedCount = 0;
            let errorCount = 0;

            for (const [userId, user] of Object.entries(userData)) {
                try {
                    await this.migrateUser(userId, user);
                    migratedCount++;
                    
                    if (migratedCount % 100 === 0) {
                        console.log(`📊 Migrated ${migratedCount} users...`);
                    }
                } catch (error) {
                    console.error(`❌ Failed to migrate user ${userId}:`, error);
                    errorCount++;
                }
            }

            console.log(`✅ User migration completed: ${migratedCount} successful, ${errorCount} errors`);
            return errorCount === 0;
        } catch (error) {
            console.error('❌ User migration failed:', error);
            return false;
        }
    }

    async migrateUser(userId, userData) {
        const query = `
            INSERT INTO users (
                user_id, username, vex_balance, bank_balance, level, xp, networth,
                daily_streak, last_daily, last_work, current_job, job_level, job_xp,
                premium_tier, premium_expires, age_verified, age_verification_date,
                jurisdiction, profile_data, inventory, investments, achievements,
                stats, settings, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
            ON CONFLICT (user_id) DO UPDATE SET
                username = EXCLUDED.username,
                vex_balance = EXCLUDED.vex_balance,
                bank_balance = EXCLUDED.bank_balance,
                level = EXCLUDED.level,
                xp = EXCLUDED.xp,
                networth = EXCLUDED.networth,
                daily_streak = EXCLUDED.daily_streak,
                last_daily = EXCLUDED.last_daily,
                last_work = EXCLUDED.last_work,
                current_job = EXCLUDED.current_job,
                job_level = EXCLUDED.job_level,
                job_xp = EXCLUDED.job_xp,
                premium_tier = EXCLUDED.premium_tier,
                premium_expires = EXCLUDED.premium_expires,
                age_verified = EXCLUDED.age_verified,
                age_verification_date = EXCLUDED.age_verification_date,
                jurisdiction = EXCLUDED.jurisdiction,
                profile_data = EXCLUDED.profile_data,
                inventory = EXCLUDED.inventory,
                investments = EXCLUDED.investments,
                achievements = EXCLUDED.achievements,
                stats = EXCLUDED.stats,
                settings = EXCLUDED.settings,
                updated_at = CURRENT_TIMESTAMP
        `;

        const values = [
            userId,
            userData.username || null,
            userData.vexBalance || 1000.00,
            userData.bankBalance || 0.00,
            userData.level || 1,
            userData.xp || 0,
            userData.networth || 1000.00,
            userData.dailyStreak || 0,
            userData.lastDaily ? new Date(userData.lastDaily) : null,
            userData.lastWork ? new Date(userData.lastWork) : null,
            userData.currentJob || null,
            userData.jobLevel || 1,
            userData.jobXp || 0,
            userData.premiumTier || null,
            userData.premiumExpires ? new Date(userData.premiumExpires) : null,
            userData.ageVerified || false,
            userData.ageVerificationDate ? new Date(userData.ageVerificationDate) : null,
            userData.jurisdiction || null,
            JSON.stringify(userData.profile || {}),
            JSON.stringify(userData.inventory || {}),
            JSON.stringify(userData.investments || {}),
            JSON.stringify(userData.achievements || []),
            JSON.stringify(userData.stats || {}),
            JSON.stringify(userData.settings || {}),
            userData.createdAt ? new Date(userData.createdAt) : new Date(),
            new Date()
        ];

        await this.postgres.query(query, values);
    }

    async migrateTransactions() {
        console.log('💳 Migrating transaction data...');
        
        try {
            const transactionsFilePath = path.join(this.jsonDataPath, 'transactions.json');
            
            let transactionData = {};
            try {
                const fileContent = await fs.readFile(transactionsFilePath, 'utf8');
                transactionData = JSON.parse(fileContent);
            } catch (error) {
                console.log('No existing transactions.json file found');
                return true;
            }

            let migratedCount = 0;
            let errorCount = 0;

            for (const [transactionId, transaction] of Object.entries(transactionData)) {
                try {
                    await this.migrateTransaction(transaction);
                    migratedCount++;
                    
                    if (migratedCount % 500 === 0) {
                        console.log(`📊 Migrated ${migratedCount} transactions...`);
                    }
                } catch (error) {
                    console.error(`❌ Failed to migrate transaction ${transactionId}:`, error);
                    errorCount++;
                }
            }

            console.log(`✅ Transaction migration completed: ${migratedCount} successful, ${errorCount} errors`);
            return errorCount === 0;
        } catch (error) {
            console.error('❌ Transaction migration failed:', error);
            return false;
        }
    }

    async migrateTransaction(transactionData) {
        const query = `
            INSERT INTO transactions (user_id, type, amount, description, metadata, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;

        const values = [
            transactionData.userId,
            transactionData.type,
            transactionData.amount,
            transactionData.description || null,
            JSON.stringify(transactionData.metadata || {}),
            transactionData.timestamp ? new Date(transactionData.timestamp) : new Date()
        ];

        await this.postgres.query(query, values);
    }

    async validateMigration() {
        console.log('🔍 Validating migration integrity...');
        
        try {
            const postgresStats = await this.postgres.getStats();
            console.log('📊 PostgreSQL Stats:', postgresStats);

            const redisStats = await this.redis.getStats();
            console.log('📊 Redis Stats:', redisStats);

            const healthCheck = await this.postgres.healthCheck() && await this.redis.healthCheck();
            
            if (healthCheck) {
                console.log('✅ Migration validation successful');
                return true;
            } else {
                console.log('❌ Migration validation failed - health checks failed');
                return false;
            }
        } catch (error) {
            console.error('❌ Migration validation failed:', error);
            return false;
        }
    }

    async cleanup() {
        console.log('🧹 Cleaning up migration process...');
        
        try {
            await this.postgres.close();
            await this.redis.disconnect();
            console.log('✅ Database connections closed');
        } catch (error) {
            console.error('❌ Cleanup failed:', error);
        }
    }

    async run() {
        console.log('🚀 Starting complete database migration...');
        
        try {
            const initialized = await this.initialize();
            if (!initialized) {
                throw new Error('Failed to initialize databases');
            }

            const backupCreated = await this.createBackup();
            if (!backupCreated) {
                throw new Error('Failed to create backup');
            }

            const usersMigrated = await this.migrateUsers();
            if (!usersMigrated) {
                throw new Error('Failed to migrate users');
            }

            const transactionsMigrated = await this.migrateTransactions();
            if (!transactionsMigrated) {
                throw new Error('Failed to migrate transactions');
            }

            const validated = await this.validateMigration();
            if (!validated) {
                throw new Error('Migration validation failed');
            }

            console.log('🎉 Database migration completed successfully!');
            return true;
        } catch (error) {
            console.error('💥 Database migration failed:', error);
            return false;
        } finally {
            await this.cleanup();
        }
    }
}

module.exports = DatabaseMigration;

if (require.main === module) {
    const migration = new DatabaseMigration();
    migration.run().then(success => {
        process.exit(success ? 0 : 1);
    });
}
