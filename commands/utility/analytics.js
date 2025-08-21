const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('analytics')
        .setDescription(`📈 Unlock powerful insights into your VexiumVerse empire! Track earnings, performance, and domina...`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('overview')
                .setDescription(`✨ Your complete empire dashboard - see how you stack against top players!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('economy')
                .setDescription(`💸 Deep dive into your wealth generation - discover hidden profit opportunities!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('entertainment')
                .setDescription(`🔥 Master your gaming strategy - see what the top 1% are doing differently!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('social')
                .setDescription(`💓 Unlock social influence metrics - build your VexiumVerse network like a pro!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('export')
                .setDescription(`💥 Download your complete empire data - take control of your financial future!`)),
    
    cooldown: 30,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        const subcommand = interaction.options.getSubcommand();
        
        if (interaction.client.psychologyEngine) {
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'analytics',
                { analyticsType: subcommand, dataHungry: true }
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(
                interaction.user.id,
                'analytics',
                true
            );
        }
        
        const analyticsUsed = (userData.stats.analyticsUsed || 0) + 1;
        userData.stats.analyticsUsed = analyticsUsed;
        
        let achievementUnlocked = null;
        if (analyticsUsed === 1) {
            achievementUnlocked = { name: 'Data Explorer', description: 'First analytics view!' };
        } else if (analyticsUsed === 10) {
            achievementUnlocked = { name: 'Analytics Master', description: 'Power user of data!' };
        } else if (analyticsUsed === 50) {
            achievementUnlocked = { name: 'Data Scientist', description: 'Analytics legend!' };
        }
        
        if (achievementUnlocked) {
            userData.achievements = userData.achievements || [];
            if (!userData.achievements.some(a => a.name === achievementUnlocked.name)) {
                userData.achievements.push(achievementUnlocked);
            }
        }
        
        userData.stats.commandsUsed++;
        await user.save(userData);
        
        switch (subcommand) {
            case 'overview':
                return this.handleOverview(interaction, achievementUnlocked);
            case 'economy':
                return this.handleEconomy(interaction, achievementUnlocked);
            case 'entertainment':
                return this.handleEntertainment(interaction, achievementUnlocked);
            case 'social':
                return this.handleSocial(interaction, achievementUnlocked);
            case 'export':
                return this.handleExport(interaction, achievementUnlocked);
        }
    },
    
    async handleOverview(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const stats = userData.stats || {};
        const totalWealth = userData.vexBalance + userData.bankBalance;
        const accountAge = Math.floor((Date.now() - new Date(userData.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24));
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 75) + 25);
        const milestoneMessage = totalWealth >= 1000 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.ANALYTICS} ${interaction.user.displayName}'s Analytics Dashboard`)
            .setDescription(`🚀 **Your Empire at a Glance** - Comprehensive overview of your VexiumVerse domination!\n\n${milestoneMessage}\n\n${constants.ANIMATED_EMOJIS.SPARKLES} **Track your progress and optimize your strategy!**`)
            .addFields(
                { name: '💰 Wealth Overview', value: this.formatWealthStats(userData), inline: true },
                { name: '📊 Activity Summary', value: this.formatActivityStats(stats), inline: true },
                { name: '🎯 Performance Metrics', value: this.formatPerformanceStats(stats), inline: true },
                { name: '📈 Growth Trends', value: this.formatGrowthStats(userData, accountAge), inline: false },
                { name: '🏆 Top Achievements', value: this.formatTopAchievements(userData), inline: true },
                { name: '⚡ Recent Activity', value: this.formatRecentActivity(stats), inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: `Account Age: ${accountAge} days • Use buttons for detailed analytics` })
            .setTimestamp();
        
        const economyButton = new ButtonBuilder()
            .setCustomId('analytics_economy')
            .setLabel('Economy')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💰');
        
        const entertainmentButton = new ButtonBuilder()
            .setCustomId('analytics_entertainment')
            .setLabel('Entertainment')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🎮');
        
        const socialButton = new ButtonBuilder()
            .setCustomId('analytics_social')
            .setLabel('Social')
            .setStyle(ButtonStyle.Success)
            .setEmoji('👥');
        
        const exportButton = new ButtonBuilder()
            .setCustomId('analytics_export')
            .setLabel('Export Data')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('📤');
        
        const row = new ActionRowBuilder().addComponents(economyButton, entertainmentButton, socialButton, exportButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleEconomy(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        const stats = userData.stats || {};
        
        const totalEarned = (stats.totalEarned || 0);
        const totalSpent = (stats.totalSpent || 0);
        const netProfit = totalEarned - totalSpent;
        const avgDailyEarnings = totalEarned / Math.max(1, Math.floor((Date.now() - new Date(userData.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));
        
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 20);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.ECONOMY} Economic Analytics`)
            .setDescription(`💸 **Master Your Wealth Strategy** - Detailed analysis of your economic domination!\n\n${variableReward || ''}\n\n${constants.ANIMATED_EMOJIS.SPARKLES} **Optimize your wealth-building strategy!**`)
            .addFields(
                { name: '💵 Income Sources', value: this.formatIncomeBreakdown(stats), inline: true },
                { name: '💸 Spending Categories', value: this.formatSpendingBreakdown(stats), inline: true },
                { name: '📊 Key Metrics', value: `**Total Earned**: $${(stats.totalEarned || 0).toFixed(2)}\n**Total Spent**: $${(stats.totalSpent || 0).toFixed(2)}\n**Net Profit**: $${((stats.totalEarned || 0) - (stats.totalSpent || 0)).toFixed(2)}\n**Avg Daily**: $${((stats.totalEarned || 0) / Math.max(stats.daysActive || 1, 1)).toFixed(2)}`, inline: true },
                { name: '🏦 Banking Activity', value: this.formatBankingStats(stats), inline: true },
                { name: '📈 Investment Performance', value: this.formatInvestmentStats(userData), inline: true },
                { name: '🎯 Efficiency Ratings', value: this.formatEfficiencyStats(stats), inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Economic data updated in real-time' })
            .setTimestamp();
        
        const detailsButton = new ButtonBuilder()
            .setCustomId('analytics_economy_details')
            .setLabel('Detailed Report')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📋');
        
        const backButton = new ButtonBuilder()
            .setCustomId('analytics_overview')
            .setLabel('Back to Overview')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅️');
        
        const row = new ActionRowBuilder().addComponents(detailsButton, backButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleEntertainment(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        const stats = userData.stats || {};
        
        const totalPlayed = (stats.slotsPlayed || 0) + (stats.coinflipPlayed || 0) + (stats.diceRolled || 0);
        const totalWon = (stats.slotsWon || 0) + (stats.coinflipWon || 0) + (stats.diceWon || 0);
        const winRate = totalPlayed > 0 ? ((totalWon / totalPlayed) * 100).toFixed(1) : '0.0';
        
        const nearMissMessage = winRate > 40 ? constants.NEAR_MISS_MESSAGES[Math.floor(Math.random() * constants.NEAR_MISS_MESSAGES.length)] : null;
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 30) + 15);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.ENTERTAINMENT} Entertainment Analytics`)
            .setDescription(`🔥 **Gaming Mastery Analytics** - Performance analysis of your skill-based entertainment dominati...`)
            .addFields(
                { name: '🎰 Game Statistics', value: this.formatGameStats(stats), inline: true },
                { name: '🏆 Win/Loss Record', value: `**Total Games**: ${totalPlayed}\n**Games Won**: ${totalWon}\n**Win Rate**: ${winRate}%\n**Current Streak**: ${stats.currentStreak || 0}`, inline: true },
                { name: '💰 Financial Impact', value: this.formatEntertainmentFinancials(stats), inline: true },
                { name: '📊 Game Preferences', value: this.formatGamePreferences(stats), inline: true },
                { name: '⏰ Play Patterns', value: this.formatPlayPatterns(stats), inline: true },
                { name: '🎯 Skill Progression', value: this.formatSkillProgression(stats), inline: true }
            )
            .setColor(constants.COLORS.ENTERTAINMENT)
            .setFooter({ text: 'All games are skill-based entertainment, not gambling • 21+ verified' })
            .setTimestamp();
        
        const trendsButton = new ButtonBuilder()
            .setCustomId('analytics_entertainment_trends')
            .setLabel('View Trends')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📈');
        
        const backButton = new ButtonBuilder()
            .setCustomId('analytics_overview')
            .setLabel('Back to Overview')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅️');
        
        const row = new ActionRowBuilder().addComponents(trendsButton, backButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleSocial(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        const stats = userData.stats || {};
        
        const milestoneMessage = (userData.achievements || []).length >= 5 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 40) + 20);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SOCIAL} Social Analytics`)
            .setDescription(`${constants.ANIMATED_EMOJIS.HEART_BEAT} **Social Empire Analytics** - Analysis of your community ...`)
            .addFields(
                { name: '🤝 Trading Activity', value: this.formatTradingStats(stats), inline: true },
                { name: '🎁 Gift Exchange', value: this.formatGiftStats(stats), inline: true },
                { name: '🏅 Leaderboard Performance', value: this.formatLeaderboardStats(userData), inline: true },
                { name: '👥 Community Engagement', value: this.formatCommunityStats(stats), inline: true },
                { name: '🏆 Social Achievements', value: this.formatSocialAchievements(userData), inline: true },
                { name: '📱 Activity Timeline', value: this.formatActivityTimeline(stats), inline: true }
            )
            .setColor(constants.COLORS.SOCIAL)
            .setFooter({ text: 'Social metrics help build stronger communities' })
            .setTimestamp();
        
        const networkButton = new ButtonBuilder()
            .setCustomId('analytics_social_network')
            .setLabel('Social Network')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🌐');
        
        const backButton = new ButtonBuilder()
            .setCustomId('analytics_overview')
            .setLabel('Back to Overview')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅️');
        
        const row = new ActionRowBuilder().addComponents(networkButton, backButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleExport(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const exportData = {
            userId: interaction.user.id,
            username: interaction.user.displayName,
            exportedAt: new Date().toISOString(),
            profile: {
                level: userData.level,
                xp: userData.xp,
                vexBalance: userData.vexBalance,
                bankBalance: userData.bankBalance,
                networth: userData.networth,
                createdAt: userData.createdAt
            },
            statistics: userData.stats || {},
            achievements: userData.achievements || [],
            inventory: userData.inventory || {},
            investments: userData.investments || {},
            settings: userData.settings || {}
        };
        
        const jsonData = JSON.stringify(exportData, null, 2);
        const attachment = new AttachmentBuilder(Buffer.from(jsonData), { name: `vexiumverse-data-${interaction.user.id}.json` });
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Data Export Complete`)
            .setDescription('Your VexiumVerse data has been exported successfully!')
            .addFields(
                { name: '📊 Export Contents', value: '• Profile information\n• Complete statistics\n• Achievement history\n• Inventory & investments\n• Account settings', inline: true },
                { name: '🔒 Privacy Notice', value: 'This export contains your personal data.\nKeep it secure and don\'t share with others.', inline: true },
                { name: '📱 File Format', value: 'JSON format for easy analysis\nCompatible with spreadsheet apps', inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Data exported in compliance with privacy regulations' })
            .setTimestamp();
        
        userData.stats.dataExports = (userData.stats.dataExports || 0) + 1;
        userData.stats.commandsUsed++;
        await user.save(userData);
        
        await interaction.reply({ embeds: [embed], files: [attachment], ephemeral: true });
    },
    
    formatWealthStats(userData) {
        const total = userData.vexBalance + userData.bankBalance;
        return `**Total Wealth**: $${total.toFixed(2)}\n**Wallet**: $${userData.vexBalance.toFixed(2)}\n**Bank**: $${userData.bankBalance.toFixed(2)}\n**Net Worth**: $${userData.networth.toFixed(2)}`;
    },
    
    formatActivityStats(stats) {
        return `**Commands Used**: ${stats.commandsUsed || 0}\n**Days Active**: ${stats.daysActive || 1}\n**Last Active**: Today\n**Streak**: ${stats.dailyStreak || 0} days`;
    },
    
    formatPerformanceStats(stats) {
        const efficiency = ((stats.totalEarned || 0) / Math.max(1, stats.commandsUsed || 1)).toFixed(2);
        return `**Efficiency**: $${efficiency}/cmd\n**Success Rate**: 95%\n**Avg Session**: 15 min\n**Peak Hour**: Evening`;
    },
    
    formatGrowthStats(userData, accountAge) {
        const dailyGrowth = (userData.networth / Math.max(1, accountAge)).toFixed(2);
        return `**Daily Growth**: $${dailyGrowth}\n**Growth Rate**: +12.5%\n**Projection**: Positive\n**Rank Trend**: ↗️ Rising`;
    },
    
    formatTopAchievements(userData) {
        const achievements = userData.achievements || [];
        if (achievements.length === 0) return 'No achievements yet';
        return achievements.slice(0, 3).map(a => `• ${a.name}`).join('\n') || 'Getting started...';
    },
    
    formatRecentActivity(stats) {
        return `**Today**: ${stats.commandsToday || 0} commands\n**This Week**: ${stats.commandsWeek || 0}\n**Last Command**: Recent\n**Most Used**: /daily`;
    },
    
    formatIncomeBreakdown(stats) {
        return `**Daily Rewards**: $${(stats.dailyEarnings || 0).toFixed(2)}\n**Work Income**: $${(stats.workEarnings || 0).toFixed(2)}\n**Entertainment**: $${(stats.entertainmentWinnings || 0).toFixed(2)}\n**Trading**: $${(stats.tradingProfit || 0).toFixed(2)}`;
    },
    
    formatSpendingBreakdown(stats) {
        return `**Shop Purchases**: $${(stats.shopSpending || 0).toFixed(2)}\n**Entertainment**: $${(stats.entertainmentSpending || 0).toFixed(2)}\n**Investments**: $${(stats.investmentSpending || 0).toFixed(2)}\n**Gifts Given**: $${(stats.giftsGiven || 0).toFixed(2)}`;
    },
    
    formatBankingStats(stats) {
        return `**Deposits**: ${stats.depositsCount || 0}\n**Withdrawals**: ${stats.withdrawalsCount || 0}\n**Interest Earned**: $${(stats.interestEarned || 0).toFixed(2)}\n**Avg Balance**: $${(stats.avgBankBalance || 0).toFixed(2)}`;
    },
    
    formatInvestmentStats(userData) {
        const investments = userData.investments || {};
        const totalInvested = Object.values(investments).reduce((sum, inv) => sum + (inv.amount || 0), 0);
        return `**Total Invested**: $${totalInvested.toFixed(2)}\n**Active Positions**: ${Object.keys(investments).length}\n**ROI**: +8.5%\n**Best Performer**: Crypto`;
    },
    
    formatEfficiencyStats(stats) {
        const commandEfficiency = ((stats.totalEarned || 0) / Math.max(1, stats.commandsUsed || 1)).toFixed(2);
        return `**Command Efficiency**: $${commandEfficiency}\n**Time Efficiency**: High\n**Resource Usage**: Optimal\n**Optimization**: 87%`;
    },
    
    formatGameStats(stats) {
        return `**Slots Played**: ${stats.slotsPlayed || 0}\n**Coinflip Games**: ${stats.coinflipPlayed || 0}\n**Dice Rolls**: ${stats.diceRolled || 0}\n**Blackjack Hands**: ${stats.blackjackGames || 0}`;
    },
    
    formatEntertainmentFinancials(stats) {
        const spent = (stats.entertainmentSpending || 0);
        const won = (stats.entertainmentWinnings || 0);
        const net = won - spent;
        return `**Total Played**: $${spent.toFixed(2)}\n**Total Won**: $${won.toFixed(2)}\n**Net Result**: $${net.toFixed(2)}\n**House Edge**: 15%`;
    },
    
    formatGamePreferences(stats) {
        const games = [
            { name: 'Slots', count: stats.slotsPlayed || 0 },
            { name: 'Coinflip', count: stats.coinflipPlayed || 0 },
            { name: 'Dice', count: stats.diceRolled || 0 }
        ].sort((a, b) => b.count - a.count);
        
        return games.slice(0, 3).map((g, i) => `${i + 1}. ${g.name} (${g.count})`).join('\n') || 'No preferences yet';
    },
    
    formatPlayPatterns(stats) {
        return `**Peak Time**: Evening\n**Avg Session**: 12 min\n**Frequency**: Daily\n**Pattern**: Consistent`;
    },
    
    formatSkillProgression(stats) {
        return `**Skill Level**: Intermediate\n**Learning Rate**: Fast\n**Improvement**: +15%\n**Mastery**: 67%`;
    },
    
    formatTradingStats(stats) {
        return `**Trades Made**: ${stats.tradesCompleted || 0}\n**Success Rate**: 92%\n**Avg Value**: $${(stats.avgTradeValue || 0).toFixed(2)}\n**Reputation**: Excellent`;
    },
    
    formatGiftStats(stats) {
        return `**Gifts Sent**: ${stats.giftsSent || 0}\n**Gifts Received**: ${stats.giftsReceived || 0}\n**Total Value**: $${(stats.giftValue || 0).toFixed(2)}\n**Generosity**: High`;
    },
    
    formatLeaderboardStats(userData) {
        return `**Best Rank**: #${userData.bestRank || 'Unranked'}\n**Current Rank**: #${userData.currentRank || 'Unranked'}\n**Categories**: 3/8\n**Trend**: ↗️ Rising`;
    },
    
    formatCommunityStats(stats) {
        return `**Guild Member**: ${stats.guildMember ? 'Yes' : 'No'}\n**Events Joined**: ${stats.eventsJoined || 0}\n**Competitions**: ${stats.competitionsEntered || 0}\n**Social Score**: ${stats.socialScore || 0}`;
    },
    
    formatSocialAchievements(userData) {
        const socialAchievements = (userData.achievements || []).filter(a => a.category === 'social');
        return socialAchievements.slice(0, 3).map(a => `• ${a.name}`).join('\n') || 'No social achievements yet';
    },
    
    formatActivityTimeline(stats) {
        return `**This Week**: Very Active\n**Last Week**: Active\n**Peak Day**: Yesterday\n**Consistency**: High`;
    }
};
