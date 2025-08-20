const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

class PostgreSQLDatabase {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || this.buildConnectionString(),
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        
        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    }

    buildConnectionString() {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || 5432;
        const database = process.env.DB_NAME || 'vexiumverse';
        const username = process.env.DB_USER || 'postgres';
        const password = process.env.DB_PASS || 'password';
        
        return `postgresql://${username}:${password}@${host}:${port}/${database}`;
    }

    async initialize() {
        try {
            await this.createTables();
            await this.createIndexes();
            console.log('✅ PostgreSQL database initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize PostgreSQL database:', error);
            throw error;
        }
    }

    async createTables() {
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                user_id VARCHAR(20) PRIMARY KEY,
                username VARCHAR(255),
                vex_balance DECIMAL(15,2) DEFAULT 1000.00,
                bank_balance DECIMAL(15,2) DEFAULT 0.00,
                level INTEGER DEFAULT 1,
                xp INTEGER DEFAULT 0,
                networth DECIMAL(15,2) DEFAULT 1000.00,
                daily_streak INTEGER DEFAULT 0,
                last_daily TIMESTAMP,
                last_work TIMESTAMP,
                current_job VARCHAR(50),
                job_level INTEGER DEFAULT 1,
                job_xp INTEGER DEFAULT 0,
                premium_tier VARCHAR(20),
                premium_expires TIMESTAMP,
                age_verified BOOLEAN DEFAULT FALSE,
                age_verification_date TIMESTAMP,
                jurisdiction VARCHAR(100),
                profile_data JSONB DEFAULT '{}',
                inventory JSONB DEFAULT '{}',
                investments JSONB DEFAULT '{}',
                achievements JSONB DEFAULT '[]',
                stats JSONB DEFAULT '{}',
                settings JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        const createTransactionsTable = `
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(20) NOT NULL,
                type VARCHAR(50) NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                description TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        `;

        const createAuditLogsTable = `
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(20),
                action VARCHAR(100) NOT NULL,
                details JSONB DEFAULT '{}',
                ip_address INET,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        const createGuildsTable = `
            CREATE TABLE IF NOT EXISTS guilds (
                guild_id VARCHAR(20) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                owner_id VARCHAR(20) NOT NULL,
                description TEXT,
                level INTEGER DEFAULT 1,
                xp INTEGER DEFAULT 0,
                treasury DECIMAL(15,2) DEFAULT 0.00,
                member_count INTEGER DEFAULT 1,
                max_members INTEGER DEFAULT 50,
                settings JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        `;

        const createGuildMembersTable = `
            CREATE TABLE IF NOT EXISTS guild_members (
                guild_id VARCHAR(20) NOT NULL,
                user_id VARCHAR(20) NOT NULL,
                role VARCHAR(20) DEFAULT 'member',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                contribution DECIMAL(15,2) DEFAULT 0.00,
                PRIMARY KEY (guild_id, user_id),
                FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        `;

        const createEventsTable = `
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                type VARCHAR(50) NOT NULL,
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP NOT NULL,
                rewards JSONB DEFAULT '{}',
                requirements JSONB DEFAULT '{}',
                participants JSONB DEFAULT '[]',
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        const createLotteryTable = `
            CREATE TABLE IF NOT EXISTS lottery (
                id SERIAL PRIMARY KEY,
                draw_date DATE NOT NULL,
                jackpot DECIMAL(15,2) NOT NULL,
                winning_numbers JSONB,
                tickets_sold INTEGER DEFAULT 0,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        const createLotteryTicketsTable = `
            CREATE TABLE IF NOT EXISTS lottery_tickets (
                id SERIAL PRIMARY KEY,
                lottery_id INTEGER NOT NULL,
                user_id VARCHAR(20) NOT NULL,
                numbers JSONB NOT NULL,
                purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lottery_id) REFERENCES lottery(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        `;

        const createAuctionsTable = `
            CREATE TABLE IF NOT EXISTS auctions (
                id SERIAL PRIMARY KEY,
                seller_id VARCHAR(20) NOT NULL,
                item_id VARCHAR(100) NOT NULL,
                item_name VARCHAR(255) NOT NULL,
                starting_bid DECIMAL(15,2) NOT NULL,
                current_bid DECIMAL(15,2),
                current_bidder_id VARCHAR(20),
                end_time TIMESTAMP NOT NULL,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        `;

        const createAuctionBidsTable = `
            CREATE TABLE IF NOT EXISTS auction_bids (
                id SERIAL PRIMARY KEY,
                auction_id INTEGER NOT NULL,
                bidder_id VARCHAR(20) NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
                FOREIGN KEY (bidder_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        `;

        const tables = [
            createUsersTable,
            createTransactionsTable,
            createAuditLogsTable,
            createGuildsTable,
            createGuildMembersTable,
            createEventsTable,
            createLotteryTable,
            createLotteryTicketsTable,
            createAuctionsTable,
            createAuctionBidsTable
        ];

        for (const tableSQL of tables) {
            await this.pool.query(tableSQL);
        }
    }

    async createIndexes() {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC);',
            'CREATE INDEX IF NOT EXISTS idx_users_networth ON users(networth DESC);',
            'CREATE INDEX IF NOT EXISTS idx_users_vex_balance ON users(vex_balance DESC);',
            'CREATE INDEX IF NOT EXISTS idx_users_bank_balance ON users(bank_balance DESC);',
            'CREATE INDEX IF NOT EXISTS idx_users_premium_tier ON users(premium_tier);',
            'CREATE INDEX IF NOT EXISTS idx_users_age_verified ON users(age_verified);',
            'CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);',
            'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);',
            'CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);',
            'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);',
            'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);',
            'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);',
            'CREATE INDEX IF NOT EXISTS idx_guilds_owner_id ON guilds(owner_id);',
            'CREATE INDEX IF NOT EXISTS idx_guilds_level ON guilds(level DESC);',
            'CREATE INDEX IF NOT EXISTS idx_guild_members_user_id ON guild_members(user_id);',
            'CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);',
            'CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);',
            'CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);',
            'CREATE INDEX IF NOT EXISTS idx_lottery_draw_date ON lottery(draw_date);',
            'CREATE INDEX IF NOT EXISTS idx_lottery_tickets_user_id ON lottery_tickets(user_id);',
            'CREATE INDEX IF NOT EXISTS idx_auctions_seller_id ON auctions(seller_id);',
            'CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);',
            'CREATE INDEX IF NOT EXISTS idx_auctions_end_time ON auctions(end_time);',
            'CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id ON auction_bids(auction_id);',
            'CREATE INDEX IF NOT EXISTS idx_auction_bids_bidder_id ON auction_bids(bidder_id);'
        ];

        for (const indexSQL of indexes) {
            await this.pool.query(indexSQL);
        }
    }

    async query(text, params) {
        const start = Date.now();
        try {
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            if (duration > 1000) {
                console.warn(`Slow query detected (${duration}ms):`, text.substring(0, 100));
            }
            
            return res;
        } catch (error) {
            console.error('Database query error:', error);
            console.error('Query:', text);
            console.error('Params:', params);
            throw error;
        }
    }

    async getClient() {
        return await this.pool.connect();
    }

    async transaction(callback) {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async close() {
        await this.pool.end();
    }

    async healthCheck() {
        try {
            const result = await this.query('SELECT 1 as health');
            return result.rows[0].health === 1;
        } catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }

    async getStats() {
        try {
            const userCount = await this.query('SELECT COUNT(*) as count FROM users');
            const transactionCount = await this.query('SELECT COUNT(*) as count FROM transactions');
            const guildCount = await this.query('SELECT COUNT(*) as count FROM guilds');
            
            return {
                users: parseInt(userCount.rows[0].count),
                transactions: parseInt(transactionCount.rows[0].count),
                guilds: parseInt(guildCount.rows[0].count),
                healthy: true
            };
        } catch (error) {
            console.error('Failed to get database stats:', error);
            return { healthy: false, error: error.message };
        }
    }
}

module.exports = PostgreSQLDatabase;
