const constants = require('./constants');

class Economics {
    static calculateWorkPay(job, level, items = {}) {
        const jobData = this.getJobData(job);
        if (!jobData) return 0;

        let basePay = Math.floor(Math.random() * (jobData.maxPay - jobData.minPay + 1)) + jobData.minPay;
        
        let multiplier = 1 + (level * 0.05);
        
        if (items.laptop) multiplier += 0.15;
        if (items.car && job === 'delivery') multiplier += 0.25;
        
        return Math.floor(basePay * multiplier);
    }

    static getJobData(jobId) {
        const allJobs = [
            ...constants.JOBS.BEGINNER,
            ...constants.JOBS.INTERMEDIATE,
            ...constants.JOBS.ADVANCED,
            ...constants.JOBS.EXPERT
        ];
        
        return allJobs.find(job => job.id === jobId);
    }

    static getAvailableJobs(level) {
        const jobs = [];
        
        if (level >= 1) jobs.push(...constants.JOBS.BEGINNER);
        if (level >= 5) jobs.push(...constants.JOBS.INTERMEDIATE);
        if (level >= 15) jobs.push(...constants.JOBS.ADVANCED);
        if (level >= 30) jobs.push(...constants.JOBS.EXPERT);
        
        return jobs;
    }

    static calculateDailyReward(streak) {
        const baseReward = 500;
        const streakBonus = Math.min(streak * 50, 1000);
        const randomBonus = Math.floor(Math.random() * 200);
        
        return baseReward + streakBonus + randomBonus;
    }

    static calculateBankInterest(amount, duration) {
        const rates = constants.BANK_INTEREST_RATES;
        let rate = 0;
        
        switch (duration) {
            case 'daily':
                rate = rates.DAILY;
                break;
            case 'weekly':
                rate = rates.WEEKLY;
                break;
            case 'monthly':
                rate = rates.MONTHLY;
                break;
            case 'yearly':
                rate = rates.YEARLY;
                break;
            default:
                rate = rates.DAILY;
        }
        
        return Math.floor(amount * rate);
    }

    static calculateEntertainmentPayout(game, amount, result) {
        switch (game) {
            case 'slots':
                return this.calculateSlotsPayout(amount, result);
            case 'dice':
                return this.calculateDicePayout(amount, result);
            case 'coinflip':
                return this.calculateCoinflipPayout(amount, result);
            default:
                return 0;
        }
    }

    static calculateSlotsPayout(amount, symbols) {
        const payouts = constants.ENTERTAINMENT_GAMES.SLOTS.payouts;
        const symbolString = symbols.join('');
        
        if (payouts[symbolString]) {
            return amount * payouts[symbolString];
        }
        
        const uniqueSymbols = [...new Set(symbols)];
        if (uniqueSymbols.length === 2) {
            return amount * payouts.any_two;
        }
        
        return 0;
    }

    static calculateDicePayout(amount, playerRoll, targetRoll) {
        if (playerRoll === targetRoll) {
            return amount * constants.ENTERTAINMENT_GAMES.DICE.winMultiplier;
        }
        return 0;
    }

    static calculateCoinflipPayout(amount, playerChoice, result) {
        if (playerChoice === result) {
            return amount * constants.ENTERTAINMENT_GAMES.COINFLIP.winMultiplier;
        }
        return 0;
    }

    static generateSlotsResult() {
        const symbols = constants.ENTERTAINMENT_GAMES.SLOTS.symbols;
        return [
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)]
        ];
    }

    static rollDice() {
        const { minRoll, maxRoll } = constants.ENTERTAINMENT_GAMES.DICE;
        return Math.floor(Math.random() * (maxRoll - minRoll + 1)) + minRoll;
    }

    static flipCoin() {
        const sides = constants.ENTERTAINMENT_GAMES.COINFLIP.sides;
        return sides[Math.floor(Math.random() * sides.length)];
    }

    static calculateInvestmentReturn(type, symbol, amount, days) {
        const investment = constants.INVESTMENT_TYPES[type.toUpperCase()][symbol];
        if (!investment) return 0;

        const { volatility, baseReturn } = investment;
        
        const dailyReturn = baseReturn / 365;
        const volatilityFactor = (Math.random() - 0.5) * volatility * 2;
        const actualReturn = dailyReturn + volatilityFactor;
        
        const totalReturn = Math.pow(1 + actualReturn, days) - 1;
        
        return Math.floor(amount * totalReturn);
    }

    static calculateLevelXP(level) {
        const { BASE, MULTIPLIER } = constants.LEVEL_XP_REQUIREMENTS;
        return Math.floor(BASE * Math.pow(MULTIPLIER, level - 1));
    }

    static calculateNetworth(wallet, bank, investments = {}) {
        let total = wallet + bank;
        
        Object.values(investments).forEach(category => {
            Object.values(category).forEach(investment => {
                if (investment.amount) {
                    total += investment.amount;
                }
            });
        });
        
        return total;
    }

    static formatMoney(amount) {
        if (amount >= 1000000000) {
            return `${(amount / 1000000000).toFixed(1)}B`;
        } else if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `${(amount / 1000).toFixed(1)}K`;
        }
        return amount.toLocaleString();
    }

    static validateBet(amount, userBalance, gameType = 'general') {
        if (amount <= 0) {
            return { valid: false, reason: 'Bet amount must be positive' };
        }
        
        if (amount > userBalance) {
            return { valid: false, reason: 'Insufficient funds' };
        }
        
        if (amount > constants.LIMITS.MAX_BET) {
            return { valid: false, reason: `Maximum bet is ${this.formatMoney(constants.LIMITS.MAX_BET)}` };
        }
        
        return { valid: true };
    }

    static calculateTradeTax(amount) {
        const taxRate = 0.05;
        return Math.floor(amount * taxRate);
    }

    static calculateGiftTax(amount) {
        if (amount > 10000) {
            const taxRate = 0.02;
            return Math.floor(amount * taxRate);
        }
        return 0;
    }

    static getRandomShopItem(category = null) {
        const items = category ? 
            constants.SHOP_ITEMS[category.toUpperCase()] : 
            Object.values(constants.SHOP_ITEMS).flat();
        
        const itemKeys = Object.keys(items);
        const randomKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
        
        return { id: randomKey, ...items[randomKey] };
    }

    static calculateItemEffect(itemId, userData) {
        const item = this.findItemInShop(itemId);
        if (!item || !userData.inventory[itemId]) return null;

        switch (item.effect) {
            case 'work_boost':
                return { type: 'multiplier', value: item.value, duration: 'permanent' };
            case 'cooldown_reduction':
                return { type: 'cooldown', value: item.value, duration: 'permanent' };
            case 'luck_boost':
                return { type: 'luck', value: item.value, duration: 3600000 };
            case 'xp_boost':
                return { type: 'xp', value: item.value, duration: 1800000 };
            default:
                return null;
        }
    }

    static findItemInShop(itemId) {
        for (const category of Object.values(constants.SHOP_ITEMS)) {
            if (category[itemId]) {
                return { id: itemId, ...category[itemId] };
            }
        }
        return null;
    }
}

module.exports = Economics;
