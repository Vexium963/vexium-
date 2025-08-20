const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View VexiumVerse leaderboards and rankings')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Leaderboard category')
                .setRequired(false)
                .addChoices(
                    { name: 'Net Worth', value: 'networth' },
                    { name: 'Level', value: 'level' },
                    { name: 'VEX Balance', value: 'vexBalance' },
                    { name: 'Bank Balance', value: 'bankBalance' },
                    { name: 'Total Earned', value: 'totalEarned' },
                    { name: 'Total Entertainment Played', value: 'totalEntertainmentPlayed' },
                    { name: 'Total Invested', value: 'totalInvested' },
                    { name: 'Games Played', value: 'gamesPlayed' },
                    { name: 'Trades Completed', value: 'tradesCompleted' }
                ))
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number (10 users per page)')
                .setRequired(false)
                .setMinValue(1)),
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'leaderboard', true);
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
                'leaderboard',
                behaviorContext
            );
        }
        
        const category = interaction.options.getString('category') || 'networth';
        const page = interaction.options.getInteger('page') || 1;
        const usersPerPage = 10;
        const startIndex = (page - 1) * usersPerPage;
        
        const leaderboardViews = userData.stats.leaderboardViews || 0;
        const isCompetitive = leaderboardViews >= 10;
        const hasClimbed = userData.stats.rankImprovement || 0;
        
        userData.stats.leaderboardViews = leaderboardViews + 1;
        
        const allUsers = await User.getLeaderboard(category, 100);
        
        if (allUsers.length === 0) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.TROPHY} Leaderboard`)
                .setDescription(`No users found for this leaderboard.\n\n${fomoMessage}\n🚀 **Be the FIRST to dominate this category!**`)
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const pageUsers = allUsers.slice(startIndex, startIndex + usersPerPage);
        const totalPages = Math.ceil(allUsers.length / usersPerPage);
        
        if (pageUsers.length === 0) {
            const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 20);
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Page Not Found`)
                .setDescription(`Page ${page} doesn't exist. There are only ${totalPages} pages.\n\n${socialProofMessage}`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const categoryNames = {
            networth: 'Net Worth',
            level: 'Level',
            vexBalance: 'VEX Balance',
            bankBalance: 'Bank Balance',
            totalEarned: 'Total Earned',
            totalEntertainmentPlayed: 'Total Entertainment Played',
            totalInvested: 'Total Invested',
            gamesPlayed: 'Games Played',
            tradesCompleted: 'Trades Completed'
        };
        
        const activeCompetitors = Math.floor(Math.random() * 200) + 50;
        const recentChanges = Math.floor(Math.random() * 15) + 5;
        const urgencyBonus = Math.random() < 0.2 ? Math.floor(Math.random() * 100) + 50 : 0;
        
        let title = `${constants.EMOJIS.TROPHY} ${categoryNames[category]} Leaderboard`;
        let description = `🔥 **${activeCompetitors} players competing RIGHT NOW!**\n⚡ **${recentChanges} rank changes in the last hour!**`;
        
        if (isCompetitive) {
            title = `👑 COMPETITIVE WARRIOR: ${categoryNames[category]} Rankings`;
            description = `🏆 **You've checked leaderboards ${leaderboardViews} times!**\n💪 **True competitor spirit detected!**\n${description}`;
        }
        
        if (urgencyBonus > 0) {
            description += `\n✨ **ACTIVE BONUS: +${urgencyBonus} VEX** for checking rankings during peak hours!`;
        }
        
        if (hasClimbed > 0) {
            description += `\n📈 **RANK CLIMBER!** You've improved ${hasClimbed} positions recently!`;
        }
        
        const socialProof = Math.random() < 0.3;
        if (socialProof) {
            const topPlayers = Math.floor(Math.random() * 5) + 3;
            description += `\n👑 **${topPlayers} legendary players online now!** Can you join their ranks?`;
        }
        
        const variableReward = Math.random() < 0.15 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        const milestoneMessage = leaderboardViews % 10 === 0 && leaderboardViews > 0 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        
        if (variableReward) {
            description += `\n${variableReward}`;
        }
        if (milestoneMessage) {
            description += `\n${milestoneMessage}`;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(isCompetitive ? constants.COLORS.VEX : urgencyBonus > 0 ? constants.COLORS.SUCCESS : constants.COLORS.GOLD)
            .setTimestamp();
        
        const leaderboardText = await this.formatLeaderboard(interaction.client, pageUsers, category, startIndex);
        
        embed.addFields({
            name: `🏆 Rankings ${startIndex + 1}-${startIndex + pageUsers.length}`,
            value: leaderboardText,
            inline: false
        });
        
        const currentUser = new User(interaction.user.id);
        const currentUserData = await currentUser.load();
        const userRank = allUsers.findIndex(u => u.userId === interaction.user.id) + 1;
        
        if (userRank > 0) {
            const userValue = this.getUserValue(currentUserData, category);
            embed.addFields({
                name: '📊 Your Ranking',
                value: `**#${userRank}** - ${userValue}`,
                inline: true
            });
        }
        
        const categorySelect = new StringSelectMenuBuilder()
            .setCustomId('leaderboard_category_select')
            .setPlaceholder('📊 Switch leaderboard category')
            .addOptions([
                { label: 'Net Worth', description: 'Total VEX value owned', value: 'networth', emoji: '💰' },
                { label: 'Level', description: 'User experience level', value: 'level', emoji: '🎯' },
                { label: 'VEX Balance', description: 'Current wallet balance', value: 'vexBalance', emoji: '💳' },
                { label: 'Bank Balance', description: 'Banked VEX amount', value: 'bankBalance', emoji: '🏦' },
                { label: 'Total Earned', description: 'Lifetime VEX earned', value: 'totalEarned', emoji: '📈' },
                { label: 'Entertainment Played', description: 'VEX spent on games', value: 'totalEntertainmentPlayed', emoji: '🎮' },
                { label: 'Total Invested', description: 'Investment portfolio value', value: 'totalInvested', emoji: '📊' },
                { label: 'Games Played', description: 'Entertainment games count', value: 'gamesPlayed', emoji: '🎲' },
                { label: 'Trades Completed', description: 'Successful trade count', value: 'tradesCompleted', emoji: '🤝' }
            ]);

        const navigationButtons = new ActionRowBuilder();
        if (totalPages > 1) {
            navigationButtons.addComponents(
                new ButtonBuilder()
                    .setCustomId(`leaderboard_page_${category}_${Math.max(1, page - 1)}`)
                    .setLabel('◀️ Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 1),
                new ButtonBuilder()
                    .setCustomId(`leaderboard_page_info`)
                    .setLabel(`Page ${page}/${totalPages}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId(`leaderboard_page_${category}_${Math.min(totalPages, page + 1)}`)
                    .setLabel('Next ▶️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === totalPages)
            );
        }

        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`leaderboard_refresh_${category}_${page}`)
                    .setLabel('🔄 Refresh')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('leaderboard_my_stats')
                    .setLabel('📊 My Stats')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('leaderboard_top_10')
                    .setLabel('🏆 Top 10')
                    .setStyle(ButtonStyle.Success)
            );

        const components = [new ActionRowBuilder().addComponents(categorySelect), actionButtons];
        if (totalPages > 1) {
            components.splice(1, 0, navigationButtons);
        }

        if (totalPages > 1) {
            embed.setFooter({ text: `Page ${page}/${totalPages} • Use the buttons below to navigate` });
        } else {
            embed.setFooter({ text: 'Select a different category to view other rankings' });
        }
        
        await interaction.reply({ embeds: [embed], components });
        
        currentUserData.stats.commandsUsed++;
        await currentUser.save(currentUserData);
    },
    
    async formatLeaderboard(client, users, category, startIndex) {
        const rankings = [];
        
        for (let i = 0; i < users.length; i++) {
            const userData = users[i];
            const rank = startIndex + i + 1;
            const medal = this.getRankMedal(rank);
            
            let username = 'Unknown User';
            try {
                const discordUser = await client.users.fetch(userData.userId);
                username = discordUser.username;
            } catch (error) {
                username = `User ${userData.userId.slice(-4)}`;
            }
            
            const value = this.getUserValue(userData, category);
            
            let premiumBadge = '';
            if (userData.premiumTier) {
                const tier = constants.PREMIUM_TIERS[userData.premiumTier.toUpperCase()];
                if (tier) {
                    premiumBadge = ` ${tier.badge}`;
                }
            }
            
            rankings.push(`${medal} **#${rank}** ${username}${premiumBadge}\n${value}`);
        }
        
        return rankings.join('\n\n');
    },
    
    getUserValue(userData, category) {
        switch (category) {
            case 'networth':
                return `$${userData.networth.toFixed(2)} VEX`;
            case 'level':
                return `Level ${userData.level} (${userData.xp} XP)`;
            case 'vexBalance':
                return `$${userData.vexBalance.toFixed(2)} VEX`;
            case 'bankBalance':
                return `$${userData.bankBalance.toFixed(2)} VEX`;
            case 'totalEarned':
                return `$${(userData.stats?.totalEarned || 0).toFixed(2)} VEX`;
            case 'totalEntertainmentPlayed':
                return `$${(userData.stats?.totalEntertainmentPlayed || 0).toFixed(2)} VEX`;
            case 'totalInvested':
                return `$${(userData.stats?.totalInvested || 0).toFixed(2)} VEX`;
            case 'gamesPlayed':
                return `${userData.stats?.gamesPlayed || 0} games`;
            case 'tradesCompleted':
                return `${userData.stats?.tradesCompleted || 0} trades`;
            default:
                return 'N/A';
        }
    },
    
    getRankMedal(rank) {
        switch (rank) {
            case 1:
                return '🥇';
            case 2:
                return '🥈';
            case 3:
                return '🥉';
            default:
                return '🏅';
        }
    }
};
