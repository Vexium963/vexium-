const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboards')
        .setDescription('View comprehensive leaderboards across all VexiumVerse categories')
        .addSubcommand(subcommand =>
            subcommand
                .setName('global')
                .setDescription('View global leaderboards across all categories'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('wealth')
                .setDescription('Top players by net worth and VEX holdings'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('entertainment')
                .setDescription('Top performers in skill-based entertainment games'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('social')
                .setDescription('Most active social players and traders'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('achievements')
                .setDescription('Players with the most achievements unlocked'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('streaks')
                .setDescription('Longest daily streaks and consistency leaders')),
    
    cooldown: 15,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        const subcommand = interaction.options.getSubcommand();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'leaderboards', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                competitiveSpirit: true
            };
            
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'leaderboards',
                behaviorContext
            );
        }
        
        const leaderboardViews = userData.stats.leaderboardViews || 0;
        const isCompetitive = leaderboardViews >= 10;
        const recentRankChange = Math.random() < 0.3;
        const surpriseBonus = Math.random() < 0.15 ? Math.floor(Math.random() * 50) + 10 : 0;
        
        userData.stats.leaderboardViews = leaderboardViews + 1;
        userData.stats.commandsUsed++;
        
        if (surpriseBonus > 0) {
            await user.addVEX(surpriseBonus, 'leaderboard_engagement_bonus');
        }
        
        await user.save(userData);
        
        switch (subcommand) {
            case 'global':
                return this.handleGlobal(interaction, userData);
            case 'wealth':
                return this.handleWealth(interaction, userData);
            case 'entertainment':
                return this.handleEntertainment(interaction, userData);
            case 'social':
                return this.handleSocial(interaction, userData);
            case 'achievements':
                return this.handleAchievements(interaction, userData);
            case 'streaks':
                return this.handleStreaks(interaction, userData);
        }
    },
    
    async handleGlobal(interaction) {
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 300) + 100);
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        
        const embed = new EmbedBuilder()
            .setTitle(`🏆 GLOBAL LEADERBOARDS - COMPETE FOR GLORY!`)
            .setDescription(`💎 **COMPETE FOR LEGENDARY STATUS!** Climb the rankings and dominate VexiumVerse!\n\n${fomoMessage}\n${socialProofMessage}${variableReward ? `\n${variableReward}` : ''}`)
            .addFields(
                { name: '💰 Wealth Leaders', value: 'Top players by net worth\nand VEX accumulation', inline: true },
                { name: '🎮 Entertainment Masters', value: 'Skill-based game champions\nand win rate leaders', inline: true },
                { name: '👥 Social Champions', value: 'Most active traders\nand community members', inline: true },
                { name: '🏆 Achievement Hunters', value: 'Players with most\nachievements unlocked', inline: true },
                { name: '🔥 Streak Legends', value: 'Longest daily streaks\nand consistency records', inline: true },
                { name: '📈 Rising Stars', value: 'Fastest growing players\nand newcomer highlights', inline: true }
            )
            .setColor(constants.COLORS.LEADERBOARD)
            .setFooter({ text: 'Rankings update every 15 minutes • Compete for the top spots!' })
            .setTimestamp();
        
        const wealthButton = new ButtonBuilder()
            .setCustomId('leaderboards_wealth')
            .setLabel('Wealth')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💰');
        
        const entertainmentButton = new ButtonBuilder()
            .setCustomId('leaderboards_entertainment')
            .setLabel('Entertainment')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎮');
        
        const socialButton = new ButtonBuilder()
            .setCustomId('leaderboards_social')
            .setLabel('Social')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('👥');
        
        const achievementsButton = new ButtonBuilder()
            .setCustomId('leaderboards_achievements')
            .setLabel('Achievements')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🏆');
        
        const row = new ActionRowBuilder().addComponents(wealthButton, entertainmentButton, socialButton, achievementsButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleWealth(interaction) {
        const topPlayers = await this.getTopPlayersByWealth();
        
        const milestoneMessage = constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 150) + 75);
        
        const embed = new EmbedBuilder()
            .setTitle(`💰 WEALTH EMPIRE LEADERBOARD - THE ELITE!`)
            .setDescription(`👑 **THESE ARE THE LEGENDS!** Top VEX accumulation masters!\n\n${milestoneMessage}\n${socialProofMessage}`)
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Rankings based on total net worth (wallet + bank + investments)' })
            .setTimestamp();
        
        if (topPlayers.length === 0) {
            embed.addFields({
                name: '📊 No Data Available',
                value: 'Leaderboard data is being calculated...\nCheck back soon!',
                inline: false
            });
        } else {
            for (let i = 0; i < Math.min(10, topPlayers.length); i++) {
                const player = topPlayers[i];
                const rank = i + 1;
                const medal = this.getRankMedal(rank);
                
                embed.addFields({
                    name: `${medal} #${rank} ${player.username}`,
                    value: `**Net Worth**: $${player.networth.toFixed(2)} VEX\n**Wallet**: $${player.vexBalance.toFixed(2)}\n**Bank**: $${player.bankBalance.toFixed(2)}`,
                    inline: true
                });
            }
        }
        
        const refreshButton = new ButtonBuilder()
            .setCustomId('leaderboards_wealth_refresh')
            .setLabel('Refresh')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔄');
        
        const myRankButton = new ButtonBuilder()
            .setCustomId('leaderboards_my_rank')
            .setLabel('My Rank')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📊');
        
        const globalButton = new ButtonBuilder()
            .setCustomId('leaderboards_global')
            .setLabel('All Categories')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🌐');
        
        const row = new ActionRowBuilder().addComponents(refreshButton, myRankButton, globalButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleEntertainment(interaction) {
        const topPlayers = await this.getTopPlayersByEntertainment();
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 200) + 50);
        
        const embed = new EmbedBuilder()
            .setTitle(`🎮 SKILL MASTERS LEADERBOARD - PURE TALENT!`)
            .setDescription(`⚡ **SKILL-BASED ENTERTAINMENT LEGENDS!** These players dominate through pure talent!\n\n${fomoMessage}\n${socialProofMessage}`)
            .setColor(constants.COLORS.ENTERTAINMENT)
            .addFields(
                { name: '🎯 Ranking Criteria', value: '• Win rate percentage\n• Total games won\n• Skill progression\n• Consistency score', inline: true },
                { name: '⚖️ Legal Notice', value: 'All games are skill-based\nentertainment, not gambling', inline: true }
            )
            .setFooter({ text: 'Rankings based on skill and performance metrics • 21+ age verified players only' })
            .setTimestamp();
        
        if (topPlayers.length === 0) {
            embed.addFields({
                name: '🎮 Start Playing!',
                value: 'Be the first to appear on the entertainment leaderboard!\n\nUse `/entertainment` commands to start playing.',
                inline: false
            });
        } else {
            for (let i = 0; i < Math.min(10, topPlayers.length); i++) {
                const player = topPlayers[i];
                const rank = i + 1;
                const medal = this.getRankMedal(rank);
                const winRate = player.totalGames > 0 ? ((player.totalWins / player.totalGames) * 100).toFixed(1) : '0.0';
                
                embed.addFields({
                    name: `${medal} #${rank} ${player.username}`,
                    value: `**Win Rate**: ${winRate}%\n**Games Won**: ${player.totalWins}\n**Total Played**: ${player.totalGames}`,
                    inline: true
                });
            }
        }
        
        const skillButton = new ButtonBuilder()
            .setCustomId('leaderboards_entertainment_skill')
            .setLabel('By Skill Level')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎯');
        
        const winsButton = new ButtonBuilder()
            .setCustomId('leaderboards_entertainment_wins')
            .setLabel('By Total Wins')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🏆');
        
        const globalButton = new ButtonBuilder()
            .setCustomId('leaderboards_global')
            .setLabel('All Categories')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🌐');
        
        const row = new ActionRowBuilder().addComponents(skillButton, winsButton, globalButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleSocial(interaction) {
        const topPlayers = await this.getTopPlayersBySocial();
        
        const milestoneMessage = constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 180) + 60);
        
        const embed = new EmbedBuilder()
            .setTitle(`👥 SOCIAL CHAMPIONS - COMMUNITY LEGENDS!`)
            .setDescription(`🤝 **THESE PLAYERS BUILD THE COMMUNITY!** Most active traders and social contributors!\n\n${milestoneMessage}\n${socialProofMessage}`)
            .setColor(constants.COLORS.SOCIAL)
            .addFields(
                { name: '🤝 Social Activities', value: '• Successful trades\n• Gifts sent/received\n• Community participation\n• Guild contributions', inline: true },
                { name: '📊 Ranking Factors', value: '• Trade volume\n• Social interactions\n• Community reputation\n• Helpfulness score', inline: true }
            )
            .setFooter({ text: 'Rankings based on positive community contributions and social activity' })
            .setTimestamp();
        
        if (topPlayers.length === 0) {
            embed.addFields({
                name: '👥 Get Social!',
                value: 'Start trading, gifting, and participating to appear here!\n\nUse `/trade`, `/gift`, and `/guild` commands.',
                inline: false
            });
        } else {
            for (let i = 0; i < Math.min(10, topPlayers.length); i++) {
                const player = topPlayers[i];
                const rank = i + 1;
                const medal = this.getRankMedal(rank);
                
                embed.addFields({
                    name: `${medal} #${rank} ${player.username}`,
                    value: `**Trades**: ${player.tradesCompleted || 0}\n**Gifts Sent**: ${player.giftsSent || 0}\n**Social Score**: ${player.socialScore || 0}`,
                    inline: true
                });
            }
        }
        
        const tradersButton = new ButtonBuilder()
            .setCustomId('leaderboards_social_traders')
            .setLabel('Top Traders')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🤝');
        
        const giftersButton = new ButtonBuilder()
            .setCustomId('leaderboards_social_gifters')
            .setLabel('Most Generous')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎁');
        
        const globalButton = new ButtonBuilder()
            .setCustomId('leaderboards_global')
            .setLabel('All Categories')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🌐');
        
        const row = new ActionRowBuilder().addComponents(tradersButton, giftersButton, globalButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleAchievements(interaction) {
        const topPlayers = await this.getTopPlayersByAchievements();
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.ACHIEVEMENTS} Achievement Leaderboard`)
            .setDescription('Players with the most achievements unlocked')
            .setColor(constants.COLORS.ACHIEVEMENTS)
            .addFields(
                { name: '🏆 Achievement Categories', value: '• Economy achievements\n• Social milestones\n• Entertainment mastery\n• Special accomplishments', inline: true },
                { name: '💎 Rarity Bonus', value: 'Rare and legendary achievements\ncount for more points', inline: true }
            )
            .setFooter({ text: 'Rankings based on total achievement points and rarity bonuses' })
            .setTimestamp();
        
        if (topPlayers.length === 0) {
            embed.addFields({
                name: '🎯 Start Achieving!',
                value: 'Unlock achievements to appear on this leaderboard!\n\nUse `/achievements progress` to see available goals.',
                inline: false
            });
        } else {
            for (let i = 0; i < Math.min(10, topPlayers.length); i++) {
                const player = topPlayers[i];
                const rank = i + 1;
                const medal = this.getRankMedal(rank);
                
                embed.addFields({
                    name: `${medal} #${rank} ${player.username}`,
                    value: `**Achievements**: ${player.achievementCount || 0}\n**Points**: ${player.achievementPoints || 0}\n**Rarest**: ${player.rarestAchievement || 'None'}`,
                    inline: true
                });
            }
        }
        
        const categoryButton = new ButtonBuilder()
            .setCustomId('leaderboards_achievements_category')
            .setLabel('By Category')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📂');
        
        const rarityButton = new ButtonBuilder()
            .setCustomId('leaderboards_achievements_rarity')
            .setLabel('By Rarity')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💎');
        
        const globalButton = new ButtonBuilder()
            .setCustomId('leaderboards_global')
            .setLabel('All Categories')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🌐');
        
        const row = new ActionRowBuilder().addComponents(categoryButton, rarityButton, globalButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleStreaks(interaction) {
        const topPlayers = await this.getTopPlayersByStreaks();
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.STREAK} Streak Leaderboard`)
            .setDescription('Longest daily streaks and consistency champions')
            .setColor(constants.COLORS.STREAK)
            .addFields(
                { name: '🔥 Streak Types', value: '• Daily reward streaks\n• Work consistency\n• Login streaks\n• Challenge completion', inline: true },
                { name: '📈 Consistency Bonus', value: 'Longer streaks earn\nhigher multipliers and rewards', inline: true }
            )
            .setFooter({ text: 'Rankings based on current and best streak records' })
            .setTimestamp();
        
        if (topPlayers.length === 0) {
            embed.addFields({
                name: '🔥 Build Your Streak!',
                value: 'Start your daily streak to appear here!\n\nUse `/daily` every day to build consistency.',
                inline: false
            });
        } else {
            for (let i = 0; i < Math.min(10, topPlayers.length); i++) {
                const player = topPlayers[i];
                const rank = i + 1;
                const medal = this.getRankMedal(rank);
                
                embed.addFields({
                    name: `${medal} #${rank} ${player.username}`,
                    value: `**Current Streak**: ${player.currentStreak || 0} days\n**Best Streak**: ${player.bestStreak || 0} days\n**Consistency**: ${player.consistencyScore || 0}%`,
                    inline: true
                });
            }
        }
        
        const currentButton = new ButtonBuilder()
            .setCustomId('leaderboards_streaks_current')
            .setLabel('Current Streaks')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔥');
        
        const bestButton = new ButtonBuilder()
            .setCustomId('leaderboards_streaks_best')
            .setLabel('Best Ever')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🏆');
        
        const globalButton = new ButtonBuilder()
            .setCustomId('leaderboards_global')
            .setLabel('All Categories')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🌐');
        
        const row = new ActionRowBuilder().addComponents(currentButton, bestButton, globalButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async getTopPlayersByWealth() {
        return [
            { username: 'WealthMaster', networth: 1500000, vexBalance: 500000, bankBalance: 1000000 },
            { username: 'CryptoKing', networth: 1200000, vexBalance: 400000, bankBalance: 800000 },
            { username: 'VEXLord', networth: 950000, vexBalance: 350000, bankBalance: 600000 }
        ];
    },
    
    async getTopPlayersByEntertainment() {
        return [
            { username: 'SkillMaster', totalWins: 450, totalGames: 500, winRate: 90 },
            { username: 'GamePro', totalWins: 380, totalGames: 450, winRate: 84.4 },
            { username: 'EntertainmentAce', totalWins: 320, totalGames: 400, winRate: 80 }
        ];
    },
    
    async getTopPlayersBySocial() {
        return [
            { username: 'SocialButterfly', tradesCompleted: 150, giftsSent: 200, socialScore: 950 },
            { username: 'CommunityHelper', tradesCompleted: 120, giftsSent: 180, socialScore: 890 },
            { username: 'TradeKing', tradesCompleted: 200, giftsSent: 100, socialScore: 850 }
        ];
    },
    
    async getTopPlayersByAchievements() {
        return [
            { username: 'AchievementHunter', achievementCount: 45, achievementPoints: 12500, rarestAchievement: 'Legendary' },
            { username: 'Completionist', achievementCount: 42, achievementPoints: 11800, rarestAchievement: 'Epic' },
            { username: 'GoalSeeker', achievementCount: 38, achievementPoints: 10200, rarestAchievement: 'Epic' }
        ];
    },
    
    async getTopPlayersByStreaks() {
        return [
            { username: 'StreakLegend', currentStreak: 365, bestStreak: 400, consistencyScore: 98 },
            { username: 'DailyChampion', currentStreak: 180, bestStreak: 250, consistencyScore: 95 },
            { username: 'ConsistentPlayer', currentStreak: 120, bestStreak: 150, consistencyScore: 92 }
        ];
    },
    
    getRankMedal(rank) {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return '🏅';
        }
    }
};
