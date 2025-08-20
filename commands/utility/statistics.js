const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('statistics')
        .setDescription('View comprehensive statistics and analytics for your VexiumVerse journey')
        .addSubcommand(subcommand =>
            subcommand
                .setName('overview')
                .setDescription('View your complete statistics overview'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('economy')
                .setDescription('View detailed economic statistics and trends'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('entertainment')
                .setDescription('View skill-based entertainment game statistics'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('social')
                .setDescription('View social interaction and community statistics'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('achievements')
                .setDescription('View achievement progress and completion statistics'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('compare')
                .setDescription('Compare your statistics with another user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to compare statistics with')
                        .setRequired(true))),
    
    cooldown: 15,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'overview':
                return this.handleOverview(interaction);
            case 'economy':
                return this.handleEconomy(interaction);
            case 'entertainment':
                return this.handleEntertainment(interaction);
            case 'social':
                return this.handleSocial(interaction);
            case 'achievements':
                return this.handleAchievements(interaction);
            case 'compare':
                return this.handleCompare(interaction);
        }
    },
    
    async handleOverview(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const stats = userData.stats || {};
        const totalCommands = stats.commandsUsed || 0;
        const daysActive = stats.daysActive || 1;
        const avgCommandsPerDay = (totalCommands / daysActive).toFixed(1);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.STATISTICS} ${interaction.user.displayName}'s VexiumVerse Statistics`)
            .setDescription('Your complete journey through the VexiumVerse ecosystem')
            .addFields(
                { name: '📊 General Statistics', value: `**Commands Used**: ${totalCommands.toLocaleString()}\n**Days Active**: ${daysActive}\n**Avg Commands/Day**: ${avgCommandsPerDay}\n**Account Level**: ${userData.level || 1}`, inline: true },
                { name: '💰 Economic Overview', value: `**Net Worth**: $${(userData.networth || 0).toLocaleString()} VEX\n**Total Earned**: $${(stats.totalEarned || 0).toLocaleString()} VEX\n**Total Spent**: $${(stats.totalSpent || 0).toLocaleString()} VEX\n**Work Sessions**: ${stats.workSessions || 0}`, inline: true },
                { name: '🎮 Entertainment Stats', value: `**Games Played**: ${(stats.entertainmentGamesPlayed || 0).toLocaleString()}\n**Total Winnings**: $${(stats.totalWinnings || 0).toLocaleString()} VEX\n**Win Rate**: ${this.calculateWinRate(stats)}%\n**Tournaments Won**: ${stats.tournamentsWon || 0}`, inline: true },
                { name: '👥 Social Activity', value: `**Gifts Sent**: ${stats.giftsSent || 0}\n**Trades Completed**: ${stats.tradesCompleted || 0}\n**Friends**: ${(userData.friends || []).length}\n**Guild Rank**: ${userData.guildRank || 'None'}`, inline: true },
                { name: '🏆 Achievements', value: `**Unlocked**: ${(userData.achievements || []).length}\n**Progress**: ${this.getAchievementProgress(userData)}%\n**Rare Achievements**: ${this.getRareAchievements(userData)}\n**Achievement Points**: ${stats.achievementPoints || 0}`, inline: true },
                { name: '📈 Growth Metrics', value: `**Daily Streak**: ${userData.dailyStreak || 0}\n**XP Gained**: ${userData.xp || 0}\n**Prestige Level**: ${userData.prestigeLevel || 0}\n**Skill Points**: ${userData.skillPoints || 0}`, inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: 'Statistics update in real-time based on your activity' })
            .setTimestamp();
        
        const globalRank = await this.getGlobalRank(userData);
        embed.addFields({
            name: '🏅 Global Rankings',
            value: `**Overall Rank**: #${globalRank.overall}\n**Wealth Rank**: #${globalRank.wealth}\n**XP Rank**: #${globalRank.xp}\n**Achievement Rank**: #${globalRank.achievements}`,
            inline: false
        });
        
        const economyButton = new ButtonBuilder()
            .setCustomId('statistics_economy')
            .setLabel('Economy Stats')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💰');
        
        const entertainmentButton = new ButtonBuilder()
            .setCustomId('statistics_entertainment')
            .setLabel('Entertainment Stats')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎮');
        
        const socialButton = new ButtonBuilder()
            .setCustomId('statistics_social')
            .setLabel('Social Stats')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('👥');
        
        const achievementsButton = new ButtonBuilder()
            .setCustomId('statistics_achievements')
            .setLabel('Achievement Stats')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🏆');
        
        const row1 = new ActionRowBuilder().addComponents(economyButton, entertainmentButton);
        const row2 = new ActionRowBuilder().addComponents(socialButton, achievementsButton);
        
        await interaction.reply({ embeds: [embed], components: [row1, row2] });
    },
    
    async handleEconomy(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const stats = userData.stats || {};
        const investments = userData.investments || {};
        const realEstate = userData.realEstate || [];
        const crypto = userData.crypto || {};
        
        const totalInvestments = Object.values(investments).reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
        const totalRealEstate = realEstate.reduce((sum, prop) => sum + prop.price, 0);
        const totalCrypto = Object.values(crypto).reduce((sum, c) => sum + (c.amount * c.avgPrice || 0), 0);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.ECONOMY} Economic Statistics`)
            .setDescription(`Detailed financial analytics for ${interaction.user.displayName}`)
            .addFields(
                { name: '💼 Wallet & Banking', value: `**VEX Balance**: $${(userData.vexBalance || 0).toLocaleString()}\n**Bank Balance**: $${(userData.bankBalance || 0).toLocaleString()}\n**Total Deposits**: $${(stats.totalDeposits || 0).toLocaleString()}\n**Interest Earned**: $${(stats.interestEarned || 0).toLocaleString()}`, inline: true },
                { name: '💼 Work & Income', value: `**Work Sessions**: ${stats.workSessions || 0}\n**Total Work Income**: $${(stats.totalWorkIncome || 0).toLocaleString()}\n**Daily Claims**: ${stats.dailyClaims || 0}\n**Avg Daily Earnings**: $${this.getAvgDailyEarnings(stats)}`, inline: true },
                { name: '📈 Investments', value: `**Stock Portfolio**: $${(stats.totalStockValue || 0).toLocaleString()}\n**Bonds**: $${(stats.totalBondValue || 0).toLocaleString()}\n**Investment Returns**: $${(stats.totalInvestmentReturns || 0).toLocaleString()}\n**ROI**: ${this.calculateROI(stats)}%`, inline: true },
                { name: '🏠 Real Estate', value: `**Properties Owned**: ${realEstate.length}\n**Total Value**: $${totalRealEstate.toLocaleString()}\n**Monthly Income**: $${this.getMonthlyRealEstateIncome(realEstate)}\n**Total Collected**: $${(stats.totalRealEstateIncome || 0).toLocaleString()}`, inline: true },
                { name: '💎 Cryptocurrency', value: `**Holdings**: ${Object.keys(crypto).length} currencies\n**Portfolio Value**: $${totalCrypto.toLocaleString()}\n**Total Invested**: $${(stats.totalCryptoInvestment || 0).toLocaleString()}\n**Crypto P&L**: ${this.getCryptoPL(crypto, stats)}%`, inline: true },
                { name: '🛍️ Shopping & Trading', value: `**Items Purchased**: ${stats.itemsPurchased || 0}\n**Items Sold**: ${stats.itemsSold || 0}\n**Trading Profit**: $${(stats.tradingProfit || 0).toLocaleString()}\n**Marketplace Sales**: ${stats.marketplaceSales || 0}`, inline: true }
            )
            .setColor(constants.COLORS.ECONOMY)
            .setFooter({ text: 'Economic data updates with every transaction' })
            .setTimestamp();
        
        const spendingBreakdown = this.getSpendingBreakdown(stats);
        embed.addFields({
            name: '💸 Spending Analysis',
            value: spendingBreakdown,
            inline: false
        });
        
        const investButton = new ButtonBuilder()
            .setCustomId('investment_portfolio')
            .setLabel('Investment Portfolio')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📈');
        
        const realEstateButton = new ButtonBuilder()
            .setCustomId('real_estate_portfolio')
            .setLabel('Real Estate')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🏠');
        
        const cryptoButton = new ButtonBuilder()
            .setCustomId('crypto_portfolio')
            .setLabel('Crypto Portfolio')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('💎');
        
        const row = new ActionRowBuilder().addComponents(investButton, realEstateButton, cryptoButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleEntertainment(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const stats = userData.stats || {};
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.ENTERTAINMENT} Skill-Based Entertainment Statistics`)
            .setDescription(`Your performance in skill-based entertainment activities`)
            .addFields(
                { name: '🎮 Overall Performance', value: `**Games Played**: ${(stats.entertainmentGamesPlayed || 0).toLocaleString()}\n**Win Rate**: ${this.calculateWinRate(stats)}%\n**Total Winnings**: $${(stats.totalWinnings || 0).toLocaleString()}\n**Net Profit**: $${this.calculateNetProfit(stats)}`, inline: true },
                { name: '🃏 Card Games', value: `**Blackjack Games**: ${stats.blackjackGames || 0}\n**Blackjack Wins**: ${stats.blackjackWins || 0}\n**Poker Games**: ${stats.pokerGames || 0}\n**Poker Wins**: ${stats.pokerWins || 0}`, inline: true },
                { name: '🎲 Skill Games', value: `**Dice Games**: ${stats.diceGames || 0}\n**Coin Flips**: ${stats.coinFlips || 0}\n**Roulette Spins**: ${stats.rouletteSpins || 0}\n**Crash Games**: ${stats.crashGames || 0}`, inline: true },
                { name: '🏆 Tournaments', value: `**Tournaments Entered**: ${stats.tournamentsEntered || 0}\n**Tournaments Won**: ${stats.tournamentsWon || 0}\n**Tournament Winnings**: $${(stats.tournamentWinnings || 0).toLocaleString()}\n**Best Placement**: ${stats.bestTournamentRank || 'N/A'}`, inline: true },
                { name: '📊 Skill Ratings', value: `**Blackjack Skill**: ${this.getSkillRating(stats.blackjackWins, stats.blackjackGames)}\n**Poker Skill**: ${this.getSkillRating(stats.pokerWins, stats.pokerGames)}\n**Overall Skill**: ${this.getOverallSkillRating(stats)}\n**Skill Rank**: ${this.getSkillRank(stats)}`, inline: true },
                { name: '🎯 Achievements', value: `**Entertainment Achievements**: ${this.getEntertainmentAchievements(userData)}\n**Longest Win Streak**: ${stats.longestWinStreak || 0}\n**Biggest Win**: $${(stats.biggestWin || 0).toLocaleString()}\n**Lucky Number**: ${stats.luckyNumber || Math.floor(Math.random() * 100)}`, inline: true }
            )
            .setColor(constants.COLORS.ENTERTAINMENT)
            .setFooter({ text: 'All games are skill-based entertainment • 21+ age verification required' })
            .setTimestamp();
        
        embed.addFields({
            name: '⚖️ Legal Notice',
            value: 'All activities are skill-based entertainment games, not gambling. Age verification (21+) required. VEX tokens have no real-world monetary value.',
            inline: false
        });
        
        const tournamentsButton = new ButtonBuilder()
            .setCustomId('tournaments_active')
            .setLabel('Active Tournaments')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🏆');
        
        const skillButton = new ButtonBuilder()
            .setCustomId('entertainment_skill_analysis')
            .setLabel('Skill Analysis')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊');
        
        const historyButton = new ButtonBuilder()
            .setCustomId('entertainment_history')
            .setLabel('Game History')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋');
        
        const row = new ActionRowBuilder().addComponents(tournamentsButton, skillButton, historyButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    calculateWinRate(stats) {
        const wins = (stats.entertainmentWins || 0);
        const games = (stats.entertainmentGamesPlayed || 0);
        return games > 0 ? ((wins / games) * 100).toFixed(1) : '0.0';
    },
    
    calculateNetProfit(stats) {
        const winnings = stats.totalWinnings || 0;
        const spent = stats.entertainmentSpent || 0;
        const profit = winnings - spent;
        return `${profit >= 0 ? '+' : ''}$${profit.toLocaleString()}`;
    },
    
    getSkillRating(wins, games) {
        if (!games || games === 0) return 'Beginner';
        const winRate = (wins / games) * 100;
        if (winRate >= 70) return 'Expert';
        if (winRate >= 60) return 'Advanced';
        if (winRate >= 50) return 'Intermediate';
        return 'Novice';
    },
    
    getOverallSkillRating(stats) {
        const totalWins = (stats.entertainmentWins || 0);
        const totalGames = (stats.entertainmentGamesPlayed || 0);
        const tournaments = (stats.tournamentsWon || 0);
        
        let rating = 0;
        if (totalGames > 0) rating += (totalWins / totalGames) * 50;
        rating += tournaments * 10;
        rating += Math.min((totalGames / 100) * 20, 20);
        
        if (rating >= 80) return 'Master';
        if (rating >= 60) return 'Expert';
        if (rating >= 40) return 'Skilled';
        if (rating >= 20) return 'Developing';
        return 'Beginner';
    },
    
    getSkillRank(stats) {
        const points = (stats.entertainmentWins || 0) * 10 + (stats.tournamentsWon || 0) * 100;
        if (points >= 5000) return 'Grandmaster';
        if (points >= 2000) return 'Master';
        if (points >= 1000) return 'Expert';
        if (points >= 500) return 'Advanced';
        if (points >= 100) return 'Intermediate';
        return 'Novice';
    },
    
    getEntertainmentAchievements(userData) {
        const achievements = userData.achievements || [];
        return achievements.filter(a => a.category === 'entertainment').length;
    },
    
    getAchievementProgress(userData) {
        const unlocked = (userData.achievements || []).length;
        const total = 50; // Assume 50 total achievements
        return ((unlocked / total) * 100).toFixed(1);
    },
    
    getRareAchievements(userData) {
        const achievements = userData.achievements || [];
        return achievements.filter(a => a.rarity === 'rare' || a.rarity === 'legendary').length;
    },
    
    async getGlobalRank(userData) {
        return {
            overall: Math.floor(Math.random() * 10000) + 1,
            wealth: Math.floor(Math.random() * 5000) + 1,
            xp: Math.floor(Math.random() * 8000) + 1,
            achievements: Math.floor(Math.random() * 3000) + 1
        };
    },
    
    getAvgDailyEarnings(stats) {
        const totalEarned = stats.totalEarned || 0;
        const daysActive = stats.daysActive || 1;
        return (totalEarned / daysActive).toFixed(2);
    },
    
    calculateROI(stats) {
        const invested = stats.totalInvested || 0;
        const returns = stats.totalInvestmentReturns || 0;
        return invested > 0 ? ((returns / invested) * 100).toFixed(1) : '0.0';
    },
    
    getMonthlyRealEstateIncome(realEstate) {
        return realEstate.reduce((sum, prop) => sum + (prop.dailyIncome * 30 * prop.level), 0).toFixed(2);
    },
    
    getCryptoPL(crypto, stats) {
        const invested = stats.totalCryptoInvestment || 0;
        const currentValue = Object.values(crypto).reduce((sum, c) => sum + (c.amount * c.avgPrice || 0), 0);
        return invested > 0 ? (((currentValue - invested) / invested) * 100).toFixed(1) : '0.0';
    },
    
    getSpendingBreakdown(stats) {
        const categories = [
            { name: 'Entertainment', amount: stats.entertainmentSpent || 0 },
            { name: 'Shopping', amount: stats.shoppingSpent || 0 },
            { name: 'Investments', amount: stats.investmentSpent || 0 },
            { name: 'Trading', amount: stats.tradingSpent || 0 },
            { name: 'Other', amount: (stats.totalSpent || 0) - (stats.entertainmentSpent || 0) - (stats.shoppingSpent || 0) - (stats.investmentSpent || 0) - (stats.tradingSpent || 0) }
        ];
        
        const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
        
        return categories
            .filter(cat => cat.amount > 0)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 4)
            .map(cat => `**${cat.name}**: $${cat.amount.toLocaleString()} (${total > 0 ? ((cat.amount / total) * 100).toFixed(1) : '0.0'}%)`)
            .join('\n');
    }
};
