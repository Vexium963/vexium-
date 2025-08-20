const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
        const category = interaction.options.getString('category') || 'networth';
        const page = interaction.options.getInteger('page') || 1;
        const usersPerPage = 10;
        const startIndex = (page - 1) * usersPerPage;
        
        const allUsers = await User.getLeaderboard(category, 100);
        
        if (allUsers.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.TROPHY} Leaderboard`)
                .setDescription('No users found for this leaderboard.')
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const pageUsers = allUsers.slice(startIndex, startIndex + usersPerPage);
        const totalPages = Math.ceil(allUsers.length / usersPerPage);
        
        if (pageUsers.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Page Not Found`)
                .setDescription(`Page ${page} doesn't exist. There are only ${totalPages} pages.`)
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
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.TROPHY} ${categoryNames[category]} Leaderboard`)
            .setDescription(`Top performers in VexiumVerse - Page ${page}/${totalPages}`)
            .setColor(constants.COLORS.GOLD)
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
        
        if (totalPages > 1) {
            embed.setFooter({ text: `Page ${page}/${totalPages} • Use /leaderboard category:${category} page:${page + 1} for next page` });
        }
        
        await interaction.reply({ embeds: [embed] });
        
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
