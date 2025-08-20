const fs = require('fs');
const path = require('path');
const constants = require('../../utils/constants');

class User {
    constructor(userId) {
        this.userId = userId;
        this.dataPath = path.join(__dirname, '../data');
        this.filePath = path.join(this.dataPath, `${userId}.json`);
        this.ensureDataDirectory();
    }

    ensureDataDirectory() {
        if (!fs.existsSync(this.dataPath)) {
            fs.mkdirSync(this.dataPath, { recursive: true });
        }
    }

    getDefaultData() {
        return {
            userId: this.userId,
            vexBalance: constants.VEX_TOKEN.STARTING_BALANCE,
            bankBalance: 0.00,
            networth: constants.VEX_TOKEN.STARTING_BALANCE,
            level: 1,
            xp: 0,
            lastDaily: null,
            dailyStreak: 0,
            lastWork: null,
            lastEntertainmentGame: null,
            lastWithdraw: null,
            job: null,
            jobLevel: 1,
            jobXp: 0,
            premiumTier: null,
            premiumExpiry: null,
            inventory: {},
            investments: {
                crypto: {},
                stocks: {},
                bonds: {},
                realEstate: {}
            },
            achievements: [],
            profile: {
                bio: null,
                color: constants.COLORS.PRIMARY,
                avatar: null,
                badges: [],
                status: 'Active',
                title: null,
                frame: null
            },
            stats: {
                totalEarned: 0.00,
                totalSpent: 0.00,
                totalEntertainmentPlayed: 0.00,
                totalWon: 0.00,
                totalLost: 0.00,
                totalInvested: 0.00,
                totalWithdrawn: 0.00,
                totalTaxesPaid: 0.00,
                totalBurned: 0.00,
                commandsUsed: 0,
                gamesPlayed: 0,
                tradesCompleted: 0,
                giftsReceived: 0,
                giftsSent: 0,
                withdrawalCount: 0,
                investmentReturns: 0.00
            },
            settings: {
                notifications: true,
                privacy: 'public',
                language: 'en',
                autoInvest: false,
                riskTolerance: 'medium'
            },
            linkedWallets: {},
            transactionHistory: [],
            burnHistory: [],
            taxHistory: [],
            referralCode: null,
            referredBy: null,
            referrals: [],
            nftCollection: [],
            activeEffects: {},
            cooldowns: {},
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
        };
    }

    async load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
                const defaultData = this.getDefaultData();
                const mergedData = { ...defaultData, ...data };
                
                mergedData.networth = this.calculateNetworth(mergedData);
                return mergedData;
            } else {
                const defaultData = this.getDefaultData();
                await this.save(defaultData);
                return defaultData;
            }
        } catch (error) {
            console.error(`Error loading user data for ${this.userId}:`, error);
            return this.getDefaultData();
        }
    }

    async save(data) {
        try {
            data.lastActive = new Date().toISOString();
            data.networth = this.calculateNetworth(data);
            
            fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Error saving user data for ${this.userId}:`, error);
            return false;
        }
    }

    calculateNetworth(data) {
        let total = data.vexBalance + data.bankBalance;
        
        Object.values(data.investments).forEach(category => {
            Object.values(category).forEach(investment => {
                if (investment.currentValue) {
                    total += investment.currentValue;
                }
            });
        });
        
        return Math.round(total * 100) / 100;
    }

    async addVEX(amount, source = 'unknown', skipTax = false) {
        const data = await this.load();
        const roundedAmount = Math.round(amount * 100) / 100;
        
        data.vexBalance += roundedAmount;
        data.stats.totalEarned += roundedAmount;
        
        this.logTransaction(data, 'earn', roundedAmount, source);
        
        await this.save(data);
        return data;
    }

    async removeVEX(amount, source = 'unknown', applyTax = false) {
        const data = await this.load();
        const roundedAmount = Math.round(amount * 100) / 100;
        
        if (data.vexBalance < roundedAmount) {
            return { success: false, data, reason: 'Insufficient VEX balance' };
        }
        
        let finalAmount = roundedAmount;
        let taxAmount = 0;
        
        if (applyTax) {
            const taxResult = this.calculateTax(data, roundedAmount, source);
            taxAmount = taxResult.taxAmount;
            finalAmount = roundedAmount + taxAmount;
            
            if (data.vexBalance < finalAmount) {
                return { success: false, data, reason: 'Insufficient VEX balance including tax' };
            }
            
            data.stats.totalTaxesPaid += taxAmount;
            this.logTax(data, taxAmount, source);
            await this.addToTreasury(taxAmount, 'tax');
        }
        
        data.vexBalance -= finalAmount;
        data.stats.totalSpent += roundedAmount;
        
        this.logTransaction(data, 'spend', roundedAmount, source, taxAmount);
        
        await this.save(data);
        return { success: true, data, taxAmount };
    }

    async burnVEX(amount, reason = 'unknown') {
        const data = await this.load();
        const roundedAmount = Math.round(amount * 100) / 100;
        
        if (data.vexBalance >= roundedAmount) {
            data.vexBalance -= roundedAmount;
            data.stats.totalBurned += roundedAmount;
            
            this.logBurn(data, roundedAmount, reason);
            await this.addToTreasury(roundedAmount, 'burn');
            await this.save(data);
        }
        
        return data;
    }

    calculateTax(userData, amount, source) {
        const taxRates = constants.TAX_SYSTEM;
        let baseRate = taxRates.WITHDRAWAL.BASE_RATE;
        
        if (userData.premiumTier) {
            const tier = constants.PREMIUM_TIERS[userData.premiumTier.toUpperCase()];
            if (tier) {
                baseRate -= tier.benefits.withdrawalTaxReduction;
            }
        }
        
        if (amount > taxRates.WITHDRAWAL.HIGH_AMOUNT_THRESHOLD) {
            baseRate += taxRates.WITHDRAWAL.HIGH_AMOUNT_RATE;
        }
        
        if (userData.stats.withdrawalCount > 5) {
            baseRate += taxRates.WITHDRAWAL.FREQUENT_WITHDRAWAL_PENALTY;
        }
        
        const taxAmount = Math.round(amount * baseRate * 100) / 100;
        
        return {
            baseRate,
            taxAmount,
            effectiveRate: baseRate
        };
    }

    async addItem(itemId, quantity = 1) {
        const data = await this.load();
        if (!data.inventory[itemId]) {
            data.inventory[itemId] = 0;
        }
        data.inventory[itemId] += quantity;
        await this.save(data);
        return data;
    }

    async removeItem(itemId, quantity = 1) {
        const data = await this.load();
        if (data.inventory[itemId] && data.inventory[itemId] >= quantity) {
            data.inventory[itemId] -= quantity;
            if (data.inventory[itemId] === 0) {
                delete data.inventory[itemId];
            }
            await this.save(data);
            return { success: true, data };
        }
        return { success: false, data };
    }

    async addXP(amount, source = 'general') {
        const data = await this.load();
        const oldLevel = data.level;
        data.xp += amount;
        
        const xpNeeded = this.getXPForLevel(data.level + 1);
        
        while (data.xp >= xpNeeded) {
            data.level++;
            data.xp -= xpNeeded;
            
            const levelReward = data.level * 0.50;
            data.vexBalance += levelReward;
            data.stats.totalEarned += levelReward;
            
            this.logTransaction(data, 'level_reward', levelReward, `Level ${data.level}`);
        }
        
        const leveledUp = data.level > oldLevel;
        await this.save(data);
        
        return {
            leveledUp,
            oldLevel,
            newLevel: data.level,
            xpGained: amount,
            levelReward: leveledUp ? data.level * 0.50 : 0
        };
    }

    getXPForLevel(level) {
        const { BASE, MULTIPLIER } = constants.LEVEL_XP_REQUIREMENTS;
        return Math.floor(BASE * Math.pow(MULTIPLIER, level - 1));
    }

    logTransaction(userData, type, amount, source, taxAmount = 0) {
        const transaction = {
            id: this.generateId(),
            type,
            amount: Math.round(amount * 100) / 100,
            taxAmount: Math.round(taxAmount * 100) / 100,
            source,
            timestamp: new Date().toISOString(),
            balanceAfter: Math.round(userData.vexBalance * 100) / 100
        };
        
        if (!userData.transactionHistory) {
            userData.transactionHistory = [];
        }
        
        userData.transactionHistory.unshift(transaction);
        
        if (userData.transactionHistory.length > 1000) {
            userData.transactionHistory = userData.transactionHistory.slice(0, 1000);
        }
    }

    logBurn(userData, amount, reason) {
        const burnRecord = {
            id: this.generateId(),
            amount: Math.round(amount * 100) / 100,
            reason,
            timestamp: new Date().toISOString()
        };
        
        if (!userData.burnHistory) {
            userData.burnHistory = [];
        }
        
        userData.burnHistory.unshift(burnRecord);
        
        if (userData.burnHistory.length > 100) {
            userData.burnHistory = userData.burnHistory.slice(0, 100);
        }
    }

    logTax(userData, amount, source) {
        const taxRecord = {
            id: this.generateId(),
            amount: Math.round(amount * 100) / 100,
            source,
            timestamp: new Date().toISOString()
        };
        
        if (!userData.taxHistory) {
            userData.taxHistory = [];
        }
        
        userData.taxHistory.unshift(taxRecord);
        
        if (userData.taxHistory.length > 100) {
            userData.taxHistory = userData.taxHistory.slice(0, 100);
        }
    }

    async addToTreasury(amount, source) {
        try {
            const treasuryPath = path.join(this.dataPath, 'treasury.json');
            let treasury = { balance: constants.TREASURY.INITIAL_BALANCE, transactions: [] };
            
            if (fs.existsSync(treasuryPath)) {
                treasury = JSON.parse(fs.readFileSync(treasuryPath, 'utf8'));
            }
            
            treasury.balance += Math.round(amount * 100) / 100;
            treasury.transactions.unshift({
                id: this.generateId(),
                amount: Math.round(amount * 100) / 100,
                source,
                timestamp: new Date().toISOString(),
                balanceAfter: Math.round(treasury.balance * 100) / 100
            });
            
            if (treasury.transactions.length > 1000) {
                treasury.transactions = treasury.transactions.slice(0, 1000);
            }
            
            fs.writeFileSync(treasuryPath, JSON.stringify(treasury, null, 2));
        } catch (error) {
            console.error('Error updating treasury:', error);
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static async getLeaderboard(type = 'networth', limit = 10) {
        try {
            const dataPath = path.join(__dirname, '../data');
            if (!fs.existsSync(dataPath)) {
                return [];
            }

            const files = fs.readdirSync(dataPath).filter(file => 
                file.endsWith('.json') && file !== 'treasury.json' && file !== 'config.json'
            );
            const users = [];

            for (const file of files) {
                try {
                    const userData = JSON.parse(fs.readFileSync(path.join(dataPath, file), 'utf8'));
                    users.push(userData);
                } catch (error) {
                    console.error(`Error reading user file ${file}:`, error);
                }
            }

            users.sort((a, b) => {
                switch (type) {
                    case 'networth':
                        return (b.networth || 0) - (a.networth || 0);
                    case 'level':
                        return (b.level || 0) - (a.level || 0);
                    case 'vexBalance':
                        return (b.vexBalance || 0) - (a.vexBalance || 0);
                    case 'bankBalance':
                        return (b.bankBalance || 0) - (a.bankBalance || 0);
                    case 'totalEarned':
                        return (b.stats?.totalEarned || 0) - (a.stats?.totalEarned || 0);
                    case 'totalEntertainmentPlayed':
                        return (b.stats?.totalEntertainmentPlayed || 0) - (a.stats?.totalEntertainmentPlayed || 0);
                    case 'totalInvested':
                        return (b.stats?.totalInvested || 0) - (a.stats?.totalInvested || 0);
                    default:
                        return (b.networth || 0) - (a.networth || 0);
                }
            });

            return users.slice(0, limit);
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return [];
        }
    }

    static async getTreasuryData() {
        try {
            const treasuryPath = path.join(__dirname, '../data/treasury.json');
            if (fs.existsSync(treasuryPath)) {
                return JSON.parse(fs.readFileSync(treasuryPath, 'utf8'));
            }
            return { balance: constants.TREASURY.INITIAL_BALANCE, transactions: [] };
        } catch (error) {
            console.error('Error getting treasury data:', error);
            return { balance: constants.TREASURY.INITIAL_BALANCE, transactions: [] };
        }
    }
}

module.exports = User;
