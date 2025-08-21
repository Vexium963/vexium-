const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forecast')
        .setDescription(`📊 Advanced VEX market analytics and predictions - See the future of the economy!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('price')
                .setDescription(`📈 View VEX price predictions and trend analysis`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('analytics')
                .setDescription(`🔍 Deep dive into market metrics and tokenomics`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sentiment')
                .setDescription(`🧠 Analyze market sentiment and user behavior patterns`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('overview')
                .setDescription(`🌟 Complete market overview with all key metrics`)),
    
    cooldown: 30,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'forecast', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                analyticalThinking: true,
                marketInterest: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'forecast',
                behaviorContext
            );
        }
        
        userData.stats.commandsUsed++;
        await user.save(userData);
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'price':
                return this.handlePrice(interaction);
            case 'analytics':
                return this.handleAnalytics(interaction);
            case 'sentiment':
                return this.handleSentiment(interaction);
            case 'overview':
                return this.handleOverview(interaction);
        }
    },
    
    async handlePrice(interaction) {
        const simulatedVEX = require('../../utils/simulatedVEX');
        const currentPrice = simulatedVEX.getCurrentPrice();
        const priceHistory = simulatedVEX.getPriceHistory();
        const marketStats = simulatedVEX.getMarketStats();
        
        const recentPrices = priceHistory.slice(-24);
        const priceChange24h = recentPrices.length >= 2 ? 
            ((currentPrice - recentPrices[0].price) / recentPrices[0].price) * 100 : 0;
        
        const predictedPrice1h = this.predictPrice(recentPrices, 1);
        const predictedPrice24h = this.predictPrice(recentPrices, 24);
        const predictedPrice7d = this.predictPrice(recentPrices, 168);
        
        const volatility = this.calculateVolatility(recentPrices);
        const trend = this.analyzeTrend(recentPrices);
        
        const embed = new EmbedBuilder()
            .setTitle(`📈 VEX Price Forecast & Predictions`)
            .setDescription(`🔮 **AI-Powered Market Analysis**\n\n💰 **Current Price:** $${currentPrice.toFixed(6)}\n📊 **24h Change:** ${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%\n📈 **Trend:** ${trend.direction} (${trend.strength})`)
            .addFields(
                { name: '🕐 1 Hour Prediction', value: `$${predictedPrice1h.toFixed(6)}\n${this.getPredictionConfidence(1)}% confidence`, inline: true },
                { name: '📅 24 Hour Prediction', value: `$${predictedPrice24h.toFixed(6)}\n${this.getPredictionConfidence(24)}% confidence`, inline: true },
                { name: '📆 7 Day Prediction', value: `$${predictedPrice7d.toFixed(6)}\n${this.getPredictionConfidence(168)}% confidence`, inline: true },
                { name: '⚡ Volatility Index', value: `${(volatility * 100).toFixed(2)}%\n${this.getVolatilityRating(volatility)}`, inline: true },
                { name: '📊 Market Cap', value: `$${marketStats.marketCap.toLocaleString()}\n${marketStats.circulatingSupply.toLocaleString()} VEX`, inline: true },
                { name: '💹 24h Volume', value: `${marketStats.dailyVolume.toLocaleString()} VEX\n$${(marketStats.dailyVolume * currentPrice).toLocaleString()}`, inline: true }
            )
            .setColor(priceChange24h >= 0 ? constants.COLORS.SUCCESS : constants.COLORS.ERROR)
            .setTimestamp();
        
        const supportLevel = this.calculateSupport(recentPrices);
        const resistanceLevel = this.calculateResistance(recentPrices);
        
        embed.addFields(
            { name: '🛡️ Support Level', value: `$${supportLevel.toFixed(6)}\n${((currentPrice - supportLevel) / currentPrice * 100).toFixed(1)}% below current`, inline: true },
            { name: '⚔️ Resistance Level', value: `$${resistanceLevel.toFixed(6)}\n${((resistanceLevel - currentPrice) / currentPrice * 100).toFixed(1)}% above current`, inline: true },
            { name: '🎯 Trading Signals', value: this.generateTradingSignals(currentPrice, supportLevel, resistanceLevel, trend), inline: false }
        );
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const chartBuffer = await canvasRenderer.createPriceChart(recentPrices, predictedPrice24h);
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: chartBuffer, name: 'price-chart.png' }]
        });
    },
    
    async handleAnalytics(interaction) {
        const simulatedVEX = require('../../utils/simulatedVEX');
        const marketStats = simulatedVEX.getMarketStats();
        const currentPrice = simulatedVEX.getCurrentPrice();
        
        const burnRate = marketStats.totalBurned / (Date.now() - marketStats.launchTime) * 86400000;
        const inflationRate = this.calculateInflationRate(marketStats);
        const liquidityRatio = marketStats.liquidityPool / marketStats.circulatingSupply;
        const velocityOfMoney = marketStats.dailyVolume / marketStats.circulatingSupply;
        
        const embed = new EmbedBuilder()
            .setTitle(`🔍 VEX Tokenomics Deep Analytics`)
            .setDescription(`📊 **Comprehensive Market Analysis**\n\n🏛️ **Treasury Health:** $${(marketStats.treasuryReserve * currentPrice).toLocaleString()}\n💰 **Market Efficiency:** ${this.calculateMarketEfficiency(marketStats)}%`)
            .addFields(
                { name: '🔥 Daily Burn Rate', value: `${burnRate.toFixed(2)} VEX/day\n${((burnRate / marketStats.circulatingSupply) * 100).toFixed(4)}% of supply`, inline: true },
                { name: '📈 Inflation Rate', value: `${(inflationRate * 100).toFixed(2)}% annually\n${inflationRate > 0 ? 'Inflationary' : 'Deflationary'}`, inline: true },
                { name: '💧 Liquidity Ratio', value: `${(liquidityRatio * 100).toFixed(2)}%\n${this.getLiquidityHealth(liquidityRatio)}`, inline: true },
                { name: '🌊 Money Velocity', value: `${velocityOfMoney.toFixed(2)}x daily\n${this.getVelocityRating(velocityOfMoney)}`, inline: true },
                { name: '⚖️ Supply Metrics', value: `Total: ${marketStats.totalSupply.toLocaleString()}\nCirculating: ${marketStats.circulatingSupply.toLocaleString()}\nBurned: ${marketStats.totalBurned.toLocaleString()}`, inline: true },
                { name: '🎯 Price Stability', value: `${this.calculatePriceStability(simulatedVEX.getPriceHistory())}%\n${this.getStabilityRating(this.calculatePriceStability(simulatedVEX.getPriceHistory()))}`, inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setTimestamp();
        
        const healthScore = this.calculateEconomyHealth(marketStats, currentPrice);
        const riskLevel = this.assessRiskLevel(marketStats);
        
        embed.addFields(
            { name: '🏥 Economy Health Score', value: `${healthScore}/100\n${this.getHealthRating(healthScore)}`, inline: true },
            { name: '⚠️ Risk Assessment', value: `${riskLevel.level}\n${riskLevel.description}`, inline: true },
            { name: '📋 Recommendations', value: this.generateRecommendations(marketStats, healthScore), inline: false }
        );
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleSentiment(interaction) {
        const simulatedVEX = require('../../utils/simulatedVEX');
        const marketEvents = simulatedVEX.getMarketEvents();
        const priceHistory = simulatedVEX.getPriceHistory();
        
        const sentiment = this.analyzeSentiment(marketEvents, priceHistory);
        const fearGreedIndex = this.calculateFearGreedIndex(priceHistory, simulatedVEX.getMarketStats());
        const socialMetrics = this.generateSocialMetrics();
        
        const embed = new EmbedBuilder()
            .setTitle(`🧠 Market Sentiment Analysis`)
            .setDescription(`📊 **Community Psychology & Behavior**\n\n${sentiment.emoji} **Overall Sentiment:** ${sentiment.rating}\n🎭 **Fear & Greed Index:** ${fearGreedIndex.score}/100 (${fearGreedIndex.label})`)
            .addFields(
                { name: '📈 Bullish Indicators', value: sentiment.bullish.join('\n') || 'None detected', inline: true },
                { name: '📉 Bearish Indicators', value: sentiment.bearish.join('\n') || 'None detected', inline: true },
                { name: '⚖️ Neutral Factors', value: sentiment.neutral.join('\n') || 'Market balanced', inline: true },
                { name: '👥 Social Activity', value: `Active Users: ${socialMetrics.activeUsers}\nDaily Transactions: ${socialMetrics.dailyTx}\nEngagement Score: ${socialMetrics.engagement}%`, inline: true },
                { name: '🔥 FOMO Level', value: `${socialMetrics.fomoLevel}/10\n${this.getFOMODescription(socialMetrics.fomoLevel)}`, inline: true },
                { name: '💎 Diamond Hands', value: `${socialMetrics.diamondHands}%\n${this.getDiamondHandsDescription(socialMetrics.diamondHands)}`, inline: true }
            )
            .setColor(this.getSentimentColor(sentiment.score))
            .setTimestamp();
        
        const predictions = this.generateSentimentPredictions(sentiment, fearGreedIndex);
        embed.addFields({
            name: '🔮 Sentiment-Based Predictions',
            value: predictions.join('\n'),
            inline: false
        });
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleOverview(interaction) {
        const simulatedVEX = require('../../utils/simulatedVEX');
        const currentPrice = simulatedVEX.getCurrentPrice();
        const marketStats = simulatedVEX.getMarketStats();
        const priceHistory = simulatedVEX.getPriceHistory();
        
        const recentPrices = priceHistory.slice(-24);
        const priceChange24h = recentPrices.length >= 2 ? 
            ((currentPrice - recentPrices[0].price) / recentPrices[0].price) * 100 : 0;
        
        const healthScore = this.calculateEconomyHealth(marketStats, currentPrice);
        const sentiment = this.analyzeSentiment(simulatedVEX.getMarketEvents(), priceHistory);
        const predictedPrice24h = this.predictPrice(recentPrices, 24);
        
        const embed = new EmbedBuilder()
            .setTitle(`🌟 VEX Market Overview`)
            .setDescription(`📊 **Complete Market Dashboard**\n\n💰 **Current Price:** $${currentPrice.toFixed(6)} (${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%)\n🏥 **Economy Health:** ${healthScore}/100\n${sentiment.emoji} **Sentiment:** ${sentiment.rating}`)
            .addFields(
                { name: '📈 Price Metrics', value: `Current: $${currentPrice.toFixed(6)}\n24h Prediction: $${predictedPrice24h.toFixed(6)}\nVolatility: ${(this.calculateVolatility(recentPrices) * 100).toFixed(2)}%`, inline: true },
                { name: '💹 Market Stats', value: `Market Cap: $${marketStats.marketCap.toLocaleString()}\nVolume: ${marketStats.dailyVolume.toLocaleString()} VEX\nLiquidity: ${((marketStats.liquidityPool / marketStats.circulatingSupply) * 100).toFixed(2)}%`, inline: true },
                { name: '🔥 Supply Info', value: `Total: ${marketStats.totalSupply.toLocaleString()}\nCirculating: ${marketStats.circulatingSupply.toLocaleString()}\nBurned: ${marketStats.totalBurned.toLocaleString()}`, inline: true },
                { name: '🎯 Key Levels', value: `Support: $${this.calculateSupport(recentPrices).toFixed(6)}\nResistance: $${this.calculateResistance(recentPrices).toFixed(6)}\nTrend: ${this.analyzeTrend(recentPrices).direction}`, inline: true },
                { name: '⚠️ Risk Assessment', value: `Level: ${this.assessRiskLevel(marketStats).level}\nStability: ${this.calculatePriceStability(priceHistory)}%\nConfidence: ${this.getPredictionConfidence(24)}%`, inline: true },
                { name: '🚀 Opportunities', value: this.generateOpportunities(marketStats, sentiment, currentPrice).join('\n'), inline: true }
            )
            .setColor(healthScore >= 80 ? constants.COLORS.SUCCESS : healthScore >= 60 ? constants.COLORS.WARNING : constants.COLORS.ERROR)
            .setTimestamp();
        
        const quickActions = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('forecast_price_detail')
                    .setLabel('Price Analysis')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📈'),
                new ButtonBuilder()
                    .setCustomId('forecast_analytics_detail')
                    .setLabel('Deep Analytics')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔍'),
                new ButtonBuilder()
                    .setCustomId('forecast_sentiment_detail')
                    .setLabel('Sentiment')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🧠')
            );
        
        await interaction.reply({ 
            embeds: [embed],
            components: [quickActions]
        });
    },
    
    predictPrice(priceHistory, hoursAhead) {
        if (priceHistory.length < 3) return priceHistory[priceHistory.length - 1]?.price || 0.01;
        
        const prices = priceHistory.map(p => p.price);
        const trend = this.calculateLinearTrend(prices);
        const volatility = this.calculateVolatility(priceHistory);
        const currentPrice = prices[prices.length - 1];
        
        const trendComponent = trend * hoursAhead;
        const volatilityComponent = (Math.random() - 0.5) * volatility * Math.sqrt(hoursAhead);
        
        return Math.max(0.001, currentPrice + trendComponent + volatilityComponent);
    },
    
    calculateVolatility(priceHistory) {
        if (priceHistory.length < 2) return 0;
        
        const returns = [];
        for (let i = 1; i < priceHistory.length; i++) {
            const returnRate = (priceHistory[i].price - priceHistory[i-1].price) / priceHistory[i-1].price;
            returns.push(returnRate);
        }
        
        const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
        
        return Math.sqrt(variance);
    },
    
    analyzeTrend(priceHistory) {
        if (priceHistory.length < 3) return { direction: 'Sideways', strength: 'Weak' };
        
        const trend = this.calculateLinearTrend(priceHistory.map(p => p.price));
        const strength = Math.abs(trend) > 0.001 ? 'Strong' : Math.abs(trend) > 0.0005 ? 'Moderate' : 'Weak';
        
        return {
            direction: trend > 0 ? 'Bullish' : trend < 0 ? 'Bearish' : 'Sideways',
            strength
        };
    },
    
    calculateLinearTrend(prices) {
        const n = prices.length;
        const x = Array.from({length: n}, (_, i) => i);
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = prices.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * prices[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    },
    
    calculateSupport(priceHistory) {
        const prices = priceHistory.map(p => p.price);
        return Math.min(...prices) * 0.98;
    },
    
    calculateResistance(priceHistory) {
        const prices = priceHistory.map(p => p.price);
        return Math.max(...prices) * 1.02;
    },
    
    getPredictionConfidence(hoursAhead) {
        return Math.max(50, 95 - hoursAhead * 0.5);
    },
    
    getVolatilityRating(volatility) {
        if (volatility < 0.02) return 'Very Low';
        if (volatility < 0.05) return 'Low';
        if (volatility < 0.1) return 'Moderate';
        if (volatility < 0.2) return 'High';
        return 'Very High';
    },
    
    generateTradingSignals(currentPrice, support, resistance, trend) {
        const signals = [];
        
        if (currentPrice <= support * 1.02) {
            signals.push('🟢 **BUY SIGNAL** - Near support level');
        }
        if (currentPrice >= resistance * 0.98) {
            signals.push('🔴 **SELL SIGNAL** - Near resistance level');
        }
        if (trend.direction === 'Bullish' && trend.strength === 'Strong') {
            signals.push('📈 **BULLISH TREND** - Consider long position');
        }
        if (trend.direction === 'Bearish' && trend.strength === 'Strong') {
            signals.push('📉 **BEARISH TREND** - Consider short position');
        }
        
        return signals.length > 0 ? signals.join('\n') : '⚖️ **NEUTRAL** - Wait for clearer signals';
    },
    
    calculateInflationRate(marketStats) {
        const timeElapsed = (Date.now() - marketStats.launchTime) / (365.25 * 24 * 60 * 60 * 1000);
        const supplyGrowth = (marketStats.totalSupply - 1000000000) / 1000000000;
        return supplyGrowth / Math.max(timeElapsed, 0.001);
    },
    
    getLiquidityHealth(ratio) {
        if (ratio > 0.3) return 'Excellent';
        if (ratio > 0.2) return 'Good';
        if (ratio > 0.1) return 'Fair';
        return 'Poor';
    },
    
    getVelocityRating(velocity) {
        if (velocity > 2) return 'Very Active';
        if (velocity > 1) return 'Active';
        if (velocity > 0.5) return 'Moderate';
        return 'Low Activity';
    },
    
    calculatePriceStability(priceHistory) {
        if (priceHistory.length < 24) return 50;
        
        const recent = priceHistory.slice(-24);
        const volatility = this.calculateVolatility(recent);
        return Math.max(0, Math.min(100, 100 - volatility * 1000));
    },
    
    getStabilityRating(stability) {
        if (stability > 80) return 'Very Stable';
        if (stability > 60) return 'Stable';
        if (stability > 40) return 'Moderate';
        return 'Volatile';
    },
    
    calculateEconomyHealth(marketStats, currentPrice) {
        const liquidityScore = Math.min(100, (marketStats.liquidityPool / marketStats.circulatingSupply) * 500);
        const volumeScore = Math.min(100, (marketStats.dailyVolume / marketStats.circulatingSupply) * 200);
        const treasuryScore = Math.min(100, (marketStats.treasuryReserve * currentPrice / (marketStats.circulatingSupply * currentPrice)) * 1000);
        const burnScore = Math.min(100, (marketStats.totalBurned / marketStats.totalSupply) * 200);
        
        return Math.round((liquidityScore + volumeScore + treasuryScore + burnScore) / 4);
    },
    
    getHealthRating(score) {
        if (score >= 90) return 'Excellent 🟢';
        if (score >= 80) return 'Very Good 🟢';
        if (score >= 70) return 'Good 🟡';
        if (score >= 60) return 'Fair 🟡';
        if (score >= 50) return 'Poor 🟠';
        return 'Critical 🔴';
    },
    
    assessRiskLevel(marketStats) {
        const liquidityRisk = marketStats.liquidityPool / marketStats.circulatingSupply < 0.1;
        const concentrationRisk = marketStats.treasuryReserve / marketStats.circulatingSupply > 0.5;
        const volumeRisk = marketStats.dailyVolume / marketStats.circulatingSupply < 0.01;
        
        const riskCount = [liquidityRisk, concentrationRisk, volumeRisk].filter(Boolean).length;
        
        if (riskCount === 0) return { level: 'Low Risk 🟢', description: 'Market conditions are stable' };
        if (riskCount === 1) return { level: 'Medium Risk 🟡', description: 'Some risk factors present' };
        return { level: 'High Risk 🔴', description: 'Multiple risk factors detected' };
    },
    
    generateRecommendations(marketStats, healthScore) {
        const recommendations = [];
        
        if (marketStats.liquidityPool / marketStats.circulatingSupply < 0.1) {
            recommendations.push('💧 Increase liquidity pool');
        }
        if (marketStats.dailyVolume / marketStats.circulatingSupply < 0.01) {
            recommendations.push('📈 Encourage more trading activity');
        }
        if (healthScore < 60) {
            recommendations.push('🏥 Focus on economy health improvements');
        }
        if (marketStats.totalBurned / marketStats.totalSupply < 0.01) {
            recommendations.push('🔥 Consider burn mechanisms');
        }
        
        return recommendations.length > 0 ? recommendations.join('\n') : '✅ Economy is performing well';
    },
    
    analyzeSentiment(marketEvents, priceHistory) {
        const bullish = [];
        const bearish = [];
        const neutral = [];
        
        const recentEvents = marketEvents.slice(-10);
        let score = 50;
        
        recentEvents.forEach(event => {
            if (event.description.includes('bought') || event.description.includes('Liquidity added')) {
                bullish.push('🐋 Large buy activity detected');
                score += 5;
            } else if (event.description.includes('sold') || event.description.includes('removed')) {
                bearish.push('📉 Selling pressure observed');
                score -= 5;
            }
        });
        
        const recentPrices = priceHistory.slice(-24);
        if (recentPrices.length >= 2) {
            const priceChange = (recentPrices[recentPrices.length - 1].price - recentPrices[0].price) / recentPrices[0].price;
            if (priceChange > 0.05) {
                bullish.push('📈 Strong price momentum');
                score += 10;
            } else if (priceChange < -0.05) {
                bearish.push('📉 Negative price action');
                score -= 10;
            } else {
                neutral.push('⚖️ Price stability maintained');
            }
        }
        
        score = Math.max(0, Math.min(100, score));
        
        let rating, emoji;
        if (score >= 80) { rating = 'Extremely Bullish'; emoji = '🚀'; }
        else if (score >= 65) { rating = 'Bullish'; emoji = '📈'; }
        else if (score >= 35) { rating = 'Neutral'; emoji = '⚖️'; }
        else if (score >= 20) { rating = 'Bearish'; emoji = '📉'; }
        else { rating = 'Extremely Bearish'; emoji = '💥'; }
        
        return { score, rating, emoji, bullish, bearish, neutral };
    },
    
    calculateFearGreedIndex(priceHistory, marketStats) {
        let score = 50;
        
        const volatility = this.calculateVolatility(priceHistory.slice(-24));
        score += (0.1 - volatility) * 500;
        
        const volume = marketStats.dailyVolume / marketStats.circulatingSupply;
        score += volume * 100;
        
        const momentum = priceHistory.length >= 7 ? 
            (priceHistory[priceHistory.length - 1].price - priceHistory[priceHistory.length - 7].price) / priceHistory[priceHistory.length - 7].price * 1000 : 0;
        score += momentum;
        
        score = Math.max(0, Math.min(100, score));
        
        let label;
        if (score >= 80) label = 'Extreme Greed';
        else if (score >= 60) label = 'Greed';
        else if (score >= 40) label = 'Neutral';
        else if (score >= 20) label = 'Fear';
        else label = 'Extreme Fear';
        
        return { score: Math.round(score), label };
    },
    
    generateSocialMetrics() {
        return {
            activeUsers: Math.floor(Math.random() * 500) + 200,
            dailyTx: Math.floor(Math.random() * 2000) + 1000,
            engagement: Math.floor(Math.random() * 40) + 60,
            fomoLevel: Math.floor(Math.random() * 5) + 3,
            diamondHands: Math.floor(Math.random() * 30) + 60
        };
    },
    
    getFOMODescription(level) {
        if (level >= 8) return 'Extreme FOMO 🔥';
        if (level >= 6) return 'High FOMO 📈';
        if (level >= 4) return 'Moderate FOMO ⚡';
        return 'Low FOMO 😴';
    },
    
    getDiamondHandsDescription(percentage) {
        if (percentage >= 80) return 'Diamond Hands 💎';
        if (percentage >= 60) return 'Strong Holders 🤝';
        if (percentage >= 40) return 'Paper Hands 📄';
        return 'Weak Hands 🧻';
    },
    
    getSentimentColor(score) {
        if (score >= 70) return constants.COLORS.SUCCESS;
        if (score >= 30) return constants.COLORS.WARNING;
        return constants.COLORS.ERROR;
    },
    
    generateSentimentPredictions(sentiment, fearGreedIndex) {
        const predictions = [];
        
        if (sentiment.score >= 70) {
            predictions.push('📈 Bullish sentiment may drive prices higher');
        } else if (sentiment.score <= 30) {
            predictions.push('📉 Bearish sentiment could pressure prices');
        }
        
        if (fearGreedIndex.score >= 80) {
            predictions.push('⚠️ Extreme greed suggests potential correction');
        } else if (fearGreedIndex.score <= 20) {
            predictions.push('🚀 Extreme fear often signals buying opportunity');
        }
        
        if (predictions.length === 0) {
            predictions.push('⚖️ Balanced sentiment suggests sideways movement');
        }
        
        return predictions;
    },
    
    generateOpportunities(marketStats, sentiment, currentPrice) {
        const opportunities = [];
        
        if (sentiment.score <= 30) {
            opportunities.push('🛒 Potential buying opportunity');
        }
        if (marketStats.dailyVolume / marketStats.circulatingSupply > 0.05) {
            opportunities.push('📊 High volume trading window');
        }
        if (marketStats.liquidityPool / marketStats.circulatingSupply > 0.2) {
            opportunities.push('💧 Strong liquidity for large trades');
        }
        
        return opportunities.length > 0 ? opportunities : ['⏳ Wait for better opportunities'];
    },
    
    calculateMarketEfficiency(marketStats) {
        const liquidityScore = Math.min(100, (marketStats.liquidityPool / marketStats.circulatingSupply) * 500);
        const volumeScore = Math.min(100, (marketStats.dailyVolume / marketStats.circulatingSupply) * 200);
        return Math.round((liquidityScore + volumeScore) / 2);
    }
};
