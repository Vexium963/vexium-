const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Administrative commands for VexiumVerse management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('balance')
                .setDescription('Modify user VEX balance')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to modify')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Action to perform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Add', value: 'add' },
                            { name: 'Remove', value: 'remove' },
                            { name: 'Set', value: 'set' }
                        ))
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription('Amount of VEX')
                        .setRequired(true)
                        .setMinValue(0.01)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('level')
                .setDescription('Modify user level')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to modify')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Action to perform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Add', value: 'add' },
                            { name: 'Remove', value: 'remove' },
                            { name: 'Set', value: 'set' }
                        ))
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Number of levels')
                        .setRequired(true)
                        .setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset user account')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to reset')
                        .setRequired(true))
                .addBooleanOption(option =>
                    option.setName('confirm')
                        .setDescription('Confirm the reset action')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('treasury')
                .setDescription('View treasury information'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View bot statistics')),
    
    async execute(interaction) {
        if (!this.isAdmin(interaction.user.id)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Access Denied`)
                .setDescription('You do not have permission to use admin commands.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'balance':
                return this.handleBalance(interaction);
            case 'level':
                return this.handleLevel(interaction);
            case 'reset':
                return this.handleReset(interaction);
            case 'treasury':
                return this.handleTreasury(interaction);
            case 'stats':
                return this.handleStats(interaction);
        }
    },
    
    async handleBalance(interaction) {
        const targetUser = interaction.options.getUser('user');
        const action = interaction.options.getString('action');
        const amount = interaction.options.getNumber('amount');
        
        const user = new User(targetUser.id);
        const userData = await user.load();
        
        let newBalance = userData.vexBalance;
        
        switch (action) {
            case 'add':
                await user.addVEX(amount, 'admin_add');
                newBalance = userData.vexBalance + amount;
                break;
            case 'remove':
                const result = await user.removeVEX(amount, 'admin_remove', false);
                if (!result.success) {
                    const embed = new EmbedBuilder()
                        .setTitle(`${constants.EMOJIS.ERROR} Operation Failed`)
                        .setDescription(result.reason)
                        .setColor(constants.COLORS.ERROR);
                    
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }
                newBalance = userData.vexBalance - amount;
                break;
            case 'set':
                const currentBalance = userData.vexBalance;
                if (amount > currentBalance) {
                    await user.addVEX(amount - currentBalance, 'admin_set');
                } else if (amount < currentBalance) {
                    await user.removeVEX(currentBalance - amount, 'admin_set', false);
                }
                newBalance = amount;
                break;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Balance Modified`)
            .setDescription(`Successfully ${action}ed VEX for ${targetUser.username}`)
            .addFields(
                { name: '👤 User', value: targetUser.username, inline: true },
                { name: '⚙️ Action', value: action.charAt(0).toUpperCase() + action.slice(1), inline: true },
                { name: '💰 Amount', value: `$${amount.toFixed(2)} VEX`, inline: true },
                { name: '📊 New Balance', value: `$${newBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleLevel(interaction) {
        const targetUser = interaction.options.getUser('user');
        const action = interaction.options.getString('action');
        const amount = interaction.options.getInteger('amount');
        
        const user = new User(targetUser.id);
        const userData = await user.load();
        
        let newLevel = userData.level;
        
        switch (action) {
            case 'add':
                newLevel = userData.level + amount;
                break;
            case 'remove':
                newLevel = Math.max(1, userData.level - amount);
                break;
            case 'set':
                newLevel = Math.max(1, amount);
                break;
        }
        
        userData.level = newLevel;
        userData.xp = 0;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Level Modified`)
            .setDescription(`Successfully ${action}ed level for ${targetUser.username}`)
            .addFields(
                { name: '👤 User', value: targetUser.username, inline: true },
                { name: '⚙️ Action', value: action.charAt(0).toUpperCase() + action.slice(1), inline: true },
                { name: '📊 New Level', value: newLevel.toString(), inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleReset(interaction) {
        const targetUser = interaction.options.getUser('user');
        const confirm = interaction.options.getBoolean('confirm');
        
        if (!confirm) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.WARNING} Confirmation Required`)
                .setDescription('You must set confirm to true to reset a user account.')
                .setColor(constants.COLORS.WARNING);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const user = new User(targetUser.id);
        const userData = await user.load();
        
        const backupData = {
            oldBalance: userData.vexBalance,
            oldLevel: userData.level,
            oldNetworth: userData.networth,
            resetBy: interaction.user.id,
            resetAt: new Date().toISOString()
        };
        
        const newUserData = user.getDefaultData();
        newUserData.userId = targetUser.id;
        newUserData.resetHistory = userData.resetHistory || [];
        newUserData.resetHistory.push(backupData);
        
        await user.save(newUserData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Account Reset`)
            .setDescription(`Successfully reset account for ${targetUser.username}`)
            .addFields(
                { name: '👤 User', value: targetUser.username, inline: true },
                { name: '💰 Previous Balance', value: `$${backupData.oldBalance.toFixed(2)} VEX`, inline: true },
                { name: '🎯 Previous Level', value: backupData.oldLevel.toString(), inline: true },
                { name: '📊 New Balance', value: `$${constants.VEX_TOKEN.STARTING_BALANCE.toFixed(2)} VEX`, inline: true },
                { name: '🎯 New Level', value: '1', inline: true }
            )
            .setColor(constants.COLORS.WARNING)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleTreasury(interaction) {
        const treasuryData = await User.getTreasuryData();
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.TREASURY} VexiumVerse Treasury`)
            .setDescription('Current treasury status and recent transactions')
            .addFields(
                { name: '💰 Current Balance', value: `$${treasuryData.balance.toFixed(2)} VEX`, inline: true },
                { name: '📊 Total Transactions', value: treasuryData.transactions.length.toString(), inline: true }
            )
            .setColor(constants.COLORS.TREASURY)
            .setTimestamp();
        
        if (treasuryData.transactions.length > 0) {
            const recentTransactions = treasuryData.transactions.slice(0, 5).map(tx => {
                const date = new Date(tx.timestamp).toLocaleDateString();
                return `**+$${tx.amount.toFixed(2)}** from ${tx.source} (${date})`;
            }).join('\n');
            
            embed.addFields({
                name: '📋 Recent Transactions',
                value: recentTransactions,
                inline: false
            });
        }
        
        const allocations = constants.TREASURY;
        embed.addFields(
            { name: '🎁 Reward Pool', value: `${(allocations.REWARD_POOL_ALLOCATION * 100)}%`, inline: true },
            { name: '🔧 Development', value: `${(allocations.DEVELOPMENT_ALLOCATION * 100)}%`, inline: true },
            { name: '📢 Marketing', value: `${(allocations.MARKETING_ALLOCATION * 100)}%`, inline: true }
        );
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleStats(interaction) {
        const allUsers = await User.getLeaderboard('networth', 1000);
        const totalUsers = allUsers.length;
        const totalVEX = allUsers.reduce((sum, user) => sum + (user.networth || 0), 0);
        const totalEntertainmentPlayed = allUsers.reduce((sum, user) => sum + (user.stats?.totalGambled || 0), 0);
        const totalInvested = allUsers.reduce((sum, user) => sum + (user.stats?.totalInvested || 0), 0);
        const activeUsers = allUsers.filter(user => 
            new Date(user.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length;
        
        const treasuryData = await User.getTreasuryData();
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CHART} VexiumVerse Statistics`)
            .setDescription('Complete bot and economy statistics')
            .addFields(
                { name: '👥 Total Users', value: totalUsers.toString(), inline: true },
                { name: '🟢 Active Users (7d)', value: activeUsers.toString(), inline: true },
                { name: '🏛️ Servers', value: interaction.client.guilds.cache.size.toString(), inline: true },
                { name: '💰 Total VEX in Circulation', value: `$${totalVEX.toFixed(2)}`, inline: true },
                { name: '🎮 Total Entertainment Games', value: `$${totalEntertainmentPlayed.toFixed(2)}`, inline: true },
                { name: '📈 Total Invested', value: `$${totalInvested.toFixed(2)}`, inline: true },
                { name: '🏛️ Treasury Balance', value: `$${treasuryData.balance.toFixed(2)}`, inline: true },
                { name: '⏰ Bot Uptime', value: this.formatUptime(interaction.client.uptime), inline: true },
                { name: '📊 Commands Available', value: '64+', inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    isAdmin(userId) {
        const adminIds = (process.env.BOT_ADMIN_IDS || '').split(',');
        return adminIds.includes(userId);
    },
    
    formatUptime(uptime) {
        const seconds = Math.floor(uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else {
            return `${minutes}m ${seconds % 60}s`;
        }
    }
};
