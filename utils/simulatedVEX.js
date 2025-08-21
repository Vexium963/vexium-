const fs = require('fs');
const path = require('path');

class SimulatedVEX {
    constructor() {
        this.dataFile = path.join(__dirname, '../database/data/vex-tokenomics.json');
        this.loadTokenomicsData();
        this.setupPeriodicUpdates();
    }

    loadTokenomicsData() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
                this.tokenomics = data;
            } else {
                this.initializeTokenomics();
            }
        } catch (error) {
            console.error('Error loading tokenomics data:', error);
            this.initializeTokenomics();
        }
    }

    initializeTokenomics() {
        this.tokenomics = {
            currentPrice: 0.01,
            totalSupply: 1000000000,
            circulatingSupply: 500000000,
            treasuryReserve: 100000000,
            burnedTokens: 0,
            dailyVolume: 0,
            priceHistory: [],
            lastUpdate: Date.now(),
            volatilityFactor: 0.0001,
            burnRate: 0.02,
            treasuryTaxRate: 0.03,
            priceFloor: 0.001,
            priceCeiling: 100.0,
            marketEvents: [],
            liquidityPool: 50000000
        };
        this.saveTokenomicsData();
    }

    saveTokenomicsData() {
        try {
            const dir = path.dirname(this.dataFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.dataFile, JSON.stringify(this.tokenomics, null, 2));
        } catch (error) {
            console.error('Error saving tokenomics data:', error);
        }
    }

    getCurrentPrice() {
        return this.tokenomics.currentPrice;
    }

    getMarketCap() {
        return this.tokenomics.currentPrice * this.tokenomics.circulatingSupply;
    }

    getPeggedPrice(usdAmount) {
        return Math.max(1, Math.round(usdAmount / this.tokenomics.currentPrice));
    }

    updateVEXPrice(activityType, amount, userId = null) {
        const now = Date.now();
        const timeSinceLastUpdate = now - this.tokenomics.lastUpdate;
        
        let priceImpact = 0;
        const baseVolatility = this.tokenomics.volatilityFactor;
        
        switch (activityType) {
            case 'buy':
            case 'deposit':
            case 'invest':
            case 'stake':
            case 'shop_purchase':
                priceImpact = amount * baseVolatility * 1.2;
                break;
                
            case 'sell':
            case 'withdraw':
            case 'cash_out':
            case 'unstake':
                priceImpact = -amount * baseVolatility * 0.8;
                break;
                
            case 'work':
            case 'daily':
            case 'quest_reward':
                priceImpact = -amount * baseVolatility * 0.3;
                break;
                
            case 'burn':
                priceImpact = amount * baseVolatility * 2.0;
                this.tokenomics.burnedTokens += amount;
                this.tokenomics.circulatingSupply -= amount;
                break;
                
            case 'whale_activity':
                priceImpact = amount * baseVolatility * 5.0;
                break;
                
            default:
                priceImpact = 0;
        }

        const marketSentiment = this.calculateMarketSentiment();
        priceImpact *= marketSentiment;

        const timeDecay = Math.min(1, timeSinceLastUpdate / (1000 * 60 * 60));
        priceImpact *= (1 + timeDecay * 0.1);

        this.tokenomics.currentPrice += priceImpact;
        this.tokenomics.currentPrice = Math.max(
            this.tokenomics.priceFloor,
            Math.min(this.tokenomics.currentPrice, this.tokenomics.priceCeiling)
        );

        this.tokenomics.dailyVolume += Math.abs(amount);
        this.tokenomics.lastUpdate = now;

        this.addPriceHistory();
        this.processTransactionTaxes(amount, activityType);
        this.saveTokenomicsData();

        return this.tokenomics.currentPrice;
    }

    calculateMarketSentiment() {
        const recentHistory = this.tokenomics.priceHistory.slice(-24);
        if (recentHistory.length < 2) return 1.0;

        const priceChange = recentHistory[recentHistory.length - 1].price - recentHistory[0].price;
        const percentChange = priceChange / recentHistory[0].price;

        if (percentChange > 0.1) return 1.3;
        if (percentChange > 0.05) return 1.15;
        if (percentChange < -0.1) return 0.7;
        if (percentChange < -0.05) return 0.85;
        
        return 1.0;
    }

    addPriceHistory() {
        const now = Date.now();
        this.tokenomics.priceHistory.push({
            timestamp: now,
            price: this.tokenomics.currentPrice,
            volume: this.tokenomics.dailyVolume,
            marketCap: this.getMarketCap()
        });

        if (this.tokenomics.priceHistory.length > 168) {
            this.tokenomics.priceHistory = this.tokenomics.priceHistory.slice(-168);
        }
    }

    processTransactionTaxes(amount, activityType) {
        if (['buy', 'sell', 'trade', 'shop_purchase'].includes(activityType)) {
            const burnAmount = Math.floor(amount * this.tokenomics.burnRate);
            const treasuryAmount = Math.floor(amount * this.tokenomics.treasuryTaxRate);

            if (burnAmount > 0) {
                this.tokenomics.burnedTokens += burnAmount;
                this.tokenomics.circulatingSupply -= burnAmount;
            }

            if (treasuryAmount > 0) {
                this.tokenomics.treasuryReserve += treasuryAmount;
            }
        }
    }

    simulateWhaleActivity() {
        const whaleActions = ['massive_buy', 'massive_sell', 'liquidity_add', 'liquidity_remove'];
        const action = whaleActions[Math.floor(Math.random() * whaleActions.length)];
        const amount = Math.floor(Math.random() * 1000000) + 500000;

        switch (action) {
            case 'massive_buy':
                this.updateVEXPrice('whale_activity', amount);
                this.addMarketEvent('🐋 Whale bought ' + this.formatTokens(amount) + ' VEX');
                break;
            case 'massive_sell':
                this.updateVEXPrice('whale_activity', -amount);
                this.addMarketEvent('🐋 Whale sold ' + this.formatTokens(amount) + ' VEX');
                break;
            case 'liquidity_add':
                this.tokenomics.liquidityPool += amount;
                this.updateVEXPrice('buy', amount * 0.1);
                this.addMarketEvent('💧 Liquidity added: ' + this.formatTokens(amount) + ' VEX');
                break;
            case 'liquidity_remove':
                this.tokenomics.liquidityPool = Math.max(0, this.tokenomics.liquidityPool - amount);
                this.updateVEXPrice('sell', amount * 0.1);
                this.addMarketEvent('💧 Liquidity removed: ' + this.formatTokens(amount) + ' VEX');
                break;
        }
    }

    addMarketEvent(description) {
        this.tokenomics.marketEvents.push({
            timestamp: Date.now(),
            description: description,
            price: this.tokenomics.currentPrice
        });

        if (this.tokenomics.marketEvents.length > 50) {
            this.tokenomics.marketEvents = this.tokenomics.marketEvents.slice(-50);
        }
    }

    forcePriceOverride(newPrice, reason = 'Manual override') {
        const oldPrice = this.tokenomics.currentPrice;
        this.tokenomics.currentPrice = Math.max(
            this.tokenomics.priceFloor,
            Math.min(newPrice, this.tokenomics.priceCeiling)
        );
        
        this.addMarketEvent(`⚡ Price override: $${oldPrice.toFixed(4)} → $${this.tokenomics.currentPrice.toFixed(4)} (${reason})`);
        this.addPriceHistory();
        this.saveTokenomicsData();
        
        return this.tokenomics.currentPrice;
    }

    simulateMarketCrash(severity = 0.3) {
        const crashAmount = this.tokenomics.currentPrice * severity;
        this.tokenomics.currentPrice = Math.max(
            this.tokenomics.priceFloor,
            this.tokenomics.currentPrice - crashAmount
        );
        
        this.addMarketEvent(`📉 Market crash! Price dropped ${(severity * 100).toFixed(1)}%`);
        this.addPriceHistory();
        this.saveTokenomicsData();
    }

    simulateMarketPump(multiplier = 1.5) {
        const pumpAmount = this.tokenomics.currentPrice * (multiplier - 1);
        this.tokenomics.currentPrice = Math.min(
            this.tokenomics.priceCeiling,
            this.tokenomics.currentPrice + pumpAmount
        );
        
        this.addMarketEvent(`📈 Market pump! Price increased ${((multiplier - 1) * 100).toFixed(1)}%`);
        this.addPriceHistory();
        this.saveTokenomicsData();
    }

    getMarketStats() {
        const priceChange24h = this.calculate24hPriceChange();
        const volumeChange24h = this.calculate24hVolumeChange();
        
        return {
            currentPrice: this.tokenomics.currentPrice,
            priceChange24h: priceChange24h,
            marketCap: this.getMarketCap(),
            totalSupply: this.tokenomics.totalSupply,
            circulatingSupply: this.tokenomics.circulatingSupply,
            burnedTokens: this.tokenomics.burnedTokens,
            treasuryReserve: this.tokenomics.treasuryReserve,
            dailyVolume: this.tokenomics.dailyVolume,
            volumeChange24h: volumeChange24h,
            liquidityPool: this.tokenomics.liquidityPool,
            burnRate: this.tokenomics.burnRate,
            treasuryTaxRate: this.tokenomics.treasuryTaxRate
        };
    }

    calculate24hPriceChange() {
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        
        const historicalPrice = this.tokenomics.priceHistory.find(entry => 
            entry.timestamp >= oneDayAgo
        );
        
        if (!historicalPrice) return 0;
        
        const change = this.tokenomics.currentPrice - historicalPrice.price;
        return (change / historicalPrice.price) * 100;
    }

    calculate24hVolumeChange() {
        const recentHistory = this.tokenomics.priceHistory.slice(-24);
        if (recentHistory.length < 12) return 0;
        
        const recent12h = recentHistory.slice(-12);
        const previous12h = recentHistory.slice(-24, -12);
        
        const recentVolume = recent12h.reduce((sum, entry) => sum + (entry.volume || 0), 0);
        const previousVolume = previous12h.reduce((sum, entry) => sum + (entry.volume || 0), 0);
        
        if (previousVolume === 0) return 0;
        return ((recentVolume - previousVolume) / previousVolume) * 100;
    }

    formatTokens(amount) {
        if (amount >= 1000000000) {
            return `${(amount / 1000000000).toFixed(1)}B`;
        } else if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `${(amount / 1000).toFixed(1)}K`;
        }
        return amount.toLocaleString();
    }

    formatPrice(price) {
        if (price >= 1) {
            return `$${price.toFixed(2)}`;
        } else if (price >= 0.01) {
            return `$${price.toFixed(4)}`;
        } else {
            return `$${price.toFixed(6)}`;
        }
    }

    setupPeriodicUpdates() {
        setInterval(() => {
            this.performPeriodicUpdate();
        }, 5 * 60 * 1000);

        setInterval(() => {
            if (Math.random() < 0.1) {
                this.simulateWhaleActivity();
            }
        }, 30 * 60 * 1000);
    }

    performPeriodicUpdate() {
        const now = Date.now();
        const timeSinceLastUpdate = now - this.tokenomics.lastUpdate;
        
        if (timeSinceLastUpdate > 24 * 60 * 60 * 1000) {
            this.tokenomics.dailyVolume = 0;
        }

        const naturalVolatility = (Math.random() - 0.5) * 0.0001;
        this.tokenomics.currentPrice += naturalVolatility;
        this.tokenomics.currentPrice = Math.max(
            this.tokenomics.priceFloor,
            Math.min(this.tokenomics.currentPrice, this.tokenomics.priceCeiling)
        );

        this.addPriceHistory();
        this.saveTokenomicsData();
    }

    getRecentMarketEvents(limit = 10) {
        return this.tokenomics.marketEvents
            .slice(-limit)
            .reverse()
            .map(event => ({
                ...event,
                timeAgo: this.getTimeAgo(event.timestamp),
                formattedPrice: this.formatPrice(event.price)
            }));
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    getPriceChart(hours = 24) {
        const targetEntries = Math.min(hours, this.tokenomics.priceHistory.length);
        const chartData = this.tokenomics.priceHistory.slice(-targetEntries);
        
        return chartData.map(entry => ({
            timestamp: entry.timestamp,
            price: entry.price,
            volume: entry.volume || 0,
            formattedTime: new Date(entry.timestamp).toLocaleTimeString(),
            formattedPrice: this.formatPrice(entry.price)
        }));
    }
}

module.exports = new SimulatedVEX();
