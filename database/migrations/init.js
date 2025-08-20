const fs = require('fs');
const path = require('path');

class DatabaseMigration {
    constructor() {
        this.dataPath = path.join(__dirname, '../data');
        this.backupPath = path.join(__dirname, '../backups');
    }

    async initialize() {
        try {
            console.log('🔄 Initializing VexiumVerse database...');
            
            this.ensureDirectories();
            await this.createInitialStructure();
            await this.runMigrations();
            
            console.log('✅ Database initialization complete!');
            return true;
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            return false;
        }
    }

    ensureDirectories() {
        const directories = [this.dataPath, this.backupPath];
        
        directories.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        });
    }

    async createInitialStructure() {
        const configPath = path.join(this.dataPath, 'config.json');
        
        if (!fs.existsSync(configPath)) {
            const initialConfig = {
                version: '1.0.0',
                createdAt: new Date().toISOString(),
                lastBackup: null,
                totalUsers: 0,
                settings: {
                    autoBackup: true,
                    backupInterval: 24,
                    maxBackups: 30,
                    compressionEnabled: true
                }
            };
            
            fs.writeFileSync(configPath, JSON.stringify(initialConfig, null, 2));
            console.log('📄 Created database configuration file');
        }
    }

    async runMigrations() {
        const migrations = [
            this.migration_001_addUserStats,
            this.migration_002_addInvestments,
            this.migration_003_addAchievements,
            this.migration_004_addLinkedWallets
        ];

        for (const migration of migrations) {
            try {
                await migration.call(this);
            } catch (error) {
                console.error(`Migration failed: ${migration.name}`, error);
            }
        }
    }

    async migration_001_addUserStats() {
        console.log('🔄 Running migration: Add user statistics');
        
        const files = fs.readdirSync(this.dataPath).filter(file => 
            file.endsWith('.json') && file !== 'config.json'
        );

        for (const file of files) {
            try {
                const filePath = path.join(this.dataPath, file);
                const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (!userData.stats) {
                    userData.stats = {
                        totalEarned: 0,
                        totalSpent: 0,
                        totalEntertainmentPlayed: 0,
                        totalWon: 0,
                        totalLost: 0,
                        commandsUsed: 0,
                        gamesPlayed: 0,
                        tradesCompleted: 0,
                        giftsReceived: 0,
                        giftsSent: 0
                    };
                    
                    fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));
                }
            } catch (error) {
                console.error(`Error migrating user file ${file}:`, error);
            }
        }
    }

    async migration_002_addInvestments() {
        console.log('🔄 Running migration: Add investment system');
        
        const files = fs.readdirSync(this.dataPath).filter(file => 
            file.endsWith('.json') && file !== 'config.json'
        );

        for (const file of files) {
            try {
                const filePath = path.join(this.dataPath, file);
                const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (!userData.investments) {
                    userData.investments = {
                        crypto: {},
                        stocks: {},
                        bonds: {},
                        realEstate: {}
                    };
                    
                    fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));
                }
            } catch (error) {
                console.error(`Error migrating user file ${file}:`, error);
            }
        }
    }

    async migration_003_addAchievements() {
        console.log('🔄 Running migration: Add achievement system');
        
        const files = fs.readdirSync(this.dataPath).filter(file => 
            file.endsWith('.json') && file !== 'config.json'
        );

        for (const file of files) {
            try {
                const filePath = path.join(this.dataPath, file);
                const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (!userData.achievements) {
                    userData.achievements = [];
                }
                
                if (!userData.profile) {
                    userData.profile = {
                        bio: null,
                        color: '#7289DA',
                        avatar: null,
                        badges: [],
                        status: 'Active'
                    };
                }
                
                fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));
            } catch (error) {
                console.error(`Error migrating user file ${file}:`, error);
            }
        }
    }

    async migration_004_addLinkedWallets() {
        console.log('🔄 Running migration: Add linked wallet system');
        
        const files = fs.readdirSync(this.dataPath).filter(file => 
            file.endsWith('.json') && file !== 'config.json'
        );

        for (const file of files) {
            try {
                const filePath = path.join(this.dataPath, file);
                const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (!userData.linkedWallets) {
                    userData.linkedWallets = {};
                }
                
                if (!userData.settings) {
                    userData.settings = {
                        notifications: true,
                        privacy: 'public',
                        language: 'en'
                    };
                }
                
                fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));
            } catch (error) {
                console.error(`Error migrating user file ${file}:`, error);
            }
        }
    }

    async createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(this.backupPath, `backup_${timestamp}`);
            
            fs.mkdirSync(backupDir, { recursive: true });
            
            const files = fs.readdirSync(this.dataPath);
            for (const file of files) {
                const sourcePath = path.join(this.dataPath, file);
                const destPath = path.join(backupDir, file);
                fs.copyFileSync(sourcePath, destPath);
            }
            
            console.log(`💾 Database backup created: ${backupDir}`);
            return backupDir;
        } catch (error) {
            console.error('❌ Backup creation failed:', error);
            return null;
        }
    }

    async cleanOldBackups() {
        try {
            const backups = fs.readdirSync(this.backupPath)
                .filter(dir => dir.startsWith('backup_'))
                .map(dir => ({
                    name: dir,
                    path: path.join(this.backupPath, dir),
                    created: fs.statSync(path.join(this.backupPath, dir)).birthtime
                }))
                .sort((a, b) => b.created - a.created);

            const maxBackups = 30;
            if (backups.length > maxBackups) {
                const toDelete = backups.slice(maxBackups);
                for (const backup of toDelete) {
                    fs.rmSync(backup.path, { recursive: true, force: true });
                    console.log(`🗑️ Deleted old backup: ${backup.name}`);
                }
            }
        } catch (error) {
            console.error('❌ Error cleaning old backups:', error);
        }
    }
}

module.exports = DatabaseMigration;
