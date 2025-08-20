const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notifications')
        .setDescription('Manage your notification preferences')
        .addSubcommand(subcommand =>
            subcommand
                .setName('settings')
                .setDescription('Configure notification settings'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('View recent notifications'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear all notifications')),
    
    cooldown: 5,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'settings':
                await this.handleSettings(interaction, user, userData);
                break;
            case 'list':
                await this.handleList(interaction, user, userData);
                break;
            case 'clear':
                await this.handleClear(interaction, user, userData);
                break;
        }
    },
    
    async handleSettings(interaction, user, userData) {
        const settings = userData.notificationSettings || this.getDefaultSettings();
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SETTINGS} Notification Settings`)
            .setDescription('Configure your notification preferences')
            .addFields(
                { name: '🔔 Daily Rewards', value: settings.dailyRewards ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '💰 Economy Updates', value: settings.economyUpdates ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '🎮 Game Results', value: settings.gameResults ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '👥 Social Activity', value: settings.socialActivity ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '🏆 Achievements', value: settings.achievements ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '📊 Leaderboard', value: settings.leaderboard ? '✅ Enabled' : '❌ Disabled', inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setTimestamp();
        
        const buttons = [
            new ButtonBuilder()
                .setCustomId(`notif_toggle_dailyRewards_${interaction.user.id}`)
                .setLabel('Daily Rewards')
                .setStyle(settings.dailyRewards ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji('🔔'),
            new ButtonBuilder()
                .setCustomId(`notif_toggle_economyUpdates_${interaction.user.id}`)
                .setLabel('Economy')
                .setStyle(settings.economyUpdates ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji('💰'),
            new ButtonBuilder()
                .setCustomId(`notif_toggle_gameResults_${interaction.user.id}`)
                .setLabel('Games')
                .setStyle(settings.gameResults ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji('🎮')
        ];
        
        const buttons2 = [
            new ButtonBuilder()
                .setCustomId(`notif_toggle_socialActivity_${interaction.user.id}`)
                .setLabel('Social')
                .setStyle(settings.socialActivity ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji('👥'),
            new ButtonBuilder()
                .setCustomId(`notif_toggle_achievements_${interaction.user.id}`)
                .setLabel('Achievements')
                .setStyle(settings.achievements ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji('🏆'),
            new ButtonBuilder()
                .setCustomId(`notif_toggle_leaderboard_${interaction.user.id}`)
                .setLabel('Leaderboard')
                .setStyle(settings.leaderboard ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji('📊')
        ];
        
        const row1 = new ActionRowBuilder().addComponents(buttons);
        const row2 = new ActionRowBuilder().addComponents(buttons2);
        
        await interaction.reply({ embeds: [embed], components: [row1, row2] });
    },
    
    async handleList(interaction, user, userData) {
        const notifications = userData.notifications || [];
        const recentNotifications = notifications.slice(-15);
        
        if (recentNotifications.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.INFO} No Notifications`)
                .setDescription('You have no recent notifications.')
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.BELL} Recent Notifications`)
            .setDescription(`Showing your ${recentNotifications.length} most recent notifications`)
            .addFields(
                recentNotifications.reverse().map(notif => ({
                    name: `${this.getNotificationIcon(notif.type)} ${notif.title}`,
                    value: `${notif.message}\n*${new Date(notif.timestamp).toLocaleString()}*`,
                    inline: false
                }))
            )
            .setColor(constants.COLORS.PRIMARY)
            .setTimestamp();
        
        const clearButton = new ButtonBuilder()
            .setCustomId(`notif_clear_${interaction.user.id}`)
            .setLabel('Clear All')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🗑️');
        
        const row = new ActionRowBuilder().addComponents(clearButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleClear(interaction, user, userData) {
        const notificationCount = (userData.notifications || []).length;
        
        userData.notifications = [];
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Notifications Cleared`)
            .setDescription(`🗑️ Cleared ${notificationCount} notification(s).`)
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    getDefaultSettings() {
        return {
            dailyRewards: true,
            economyUpdates: true,
            gameResults: true,
            socialActivity: true,
            achievements: true,
            leaderboard: false
        };
    },
    
    getNotificationIcon(type) {
        const icons = {
            daily: '🔔',
            economy: '💰',
            game: '🎮',
            social: '👥',
            achievement: '🏆',
            leaderboard: '📊',
            system: '⚙️'
        };
        return icons[type] || '📢';
    }
};
