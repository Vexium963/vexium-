const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notifications')
        .setDescription(`🔔 Master your empire's intelligence network - Stay ahead of every opportunity!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('settings')
                .setDescription(`⚙️ Optimize your alert system for maximum profit potential`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription(`📈 Review your empire's intelligence feed and missed opportunities`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription(`💥 Wipe your intelligence slate clean - Fresh start for new alerts`)),
    
    cooldown: 5,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        const subcommand = interaction.options.getSubcommand();
        
        if (interaction.client.psychologyEngine) {
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'notifications',
                { consecutiveUse: false, quickReturn: false, timeSinceLastUse: Date.now() }
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'notifications', true);
        }
        
        const notificationUsage = userData.stats.notificationsOptimized || 0;
        const isNotificationExpert = notificationUsage >= 20;
        const hasUnreadNotifications = (userData.notifications || []).length > 0;
        const urgencyBonus = Math.random() < 0.15 ? 5 : 0;
        
        if (urgencyBonus > 0) {
            await user.addVEX(urgencyBonus, 'notification_optimization_bonus');
            const Economics = require('../../utils/economics');
            Economics.updateVEXMarket('reward', urgencyBonus);
            userData.stats.notificationsOptimized = notificationUsage + 1;
        }
        
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
        const notificationUsage = userData.stats.notificationsOptimized || 0;
        const isNotificationExpert = notificationUsage >= 20;
        const activeUsers = Math.floor(Math.random() * 200) + 50;
        
        let title = `${constants.EMOJIS.SETTINGS} Notification Command Center`;
        let description = `🔧 **Optimize your empire's intelligence network!**\n📊 **${activeUsers} players are fine-tuning their notifications right now!**`;
        
        if (isNotificationExpert) {
            title = `👑 NOTIFICATION MASTER CONTROL`;
            description = `💎 **Expert Status Detected!** You've optimized notifications ${notificationUsage} times!\n🏆 **You know the secrets of staying ahead!**`;
        }
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', activeUsers);
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', '2.5') : null;
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`🚀 ${description}${variableReward ? `\n\n💸 ${variableReward}` : ''}\n\n🔥 ${fomoMessage}\n✨ ${socialProofMessage}`)
            .addFields(
                { name: '🔔 Daily Rewards', value: settings.dailyRewards ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '💰 Economy Updates', value: settings.economyUpdates ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '🎮 Game Results', value: settings.gameResults ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '👥 Social Activity', value: settings.socialActivity ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '🏆 Achievements', value: settings.achievements ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '📊 Leaderboard', value: settings.leaderboard ? '✅ Enabled' : '❌ Disabled', inline: true }
            )
            .setColor(isNotificationExpert ? constants.COLORS.VEX : constants.COLORS.PRIMARY)
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
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Notification Settings: ${Object.values(settings).filter(Boolean).length}/6 enabled`,
            Object.values(settings).filter(Boolean).length / 6,
            constants.COLORS.VEX
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row1, row2],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleList(interaction, user, userData) {
        const notifications = userData.notifications || [];
        const recentNotifications = notifications.slice(-15);
        const notificationCount = notifications.length;
        const isActiveUser = notificationCount >= 50;
        
        if (recentNotifications.length === 0) {
            const comebackMessage = constants.COMEBACK_MESSAGES[Math.floor(Math.random() * constants.COMEBACK_MESSAGES.length)];
            const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 100) + 25);
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.INFO} Your Intelligence Network is Quiet`)
                .setDescription(`✨ **No recent notifications - you're all caught up!**\n🔥 **Pro Tip:** Active players get more op...`)
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        let title = `${constants.EMOJIS.BELL} Your Intelligence Feed`;
        let description = `📊 **${recentNotifications.length} recent updates** from your empire!`;
        
        if (isActiveUser) {
            title = `🔥 HIGH-ACTIVITY INTELLIGENCE CENTER`;
            description = `💎 **${notificationCount} total notifications!** You're a true empire builder!\n⚡ **Showing your ${recentNotifications.length} most recent updates**`;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`⏳ ${description}\n\n🔥 **Stay informed, stay profitable!** 📈`)
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
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Notification History: ${recentNotifications.length} recent alerts`,
            Math.min(recentNotifications.length / 15, 1.0),
            constants.COLORS.PRIMARY
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleClear(interaction, user, userData) {
        const notificationCount = (userData.notifications || []).length;
        
        userData.notifications = [];
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Notifications Cleared: ${notificationCount} removed`,
            1.0,
            constants.COLORS.SUCCESS
        );
        
        const embed = new EmbedBuilder()
            .setTitle(`✨ Notifications Cleared`)
            .setDescription(`🎉 Cleared ${notificationCount} notification(s).\n\n🔥 Your intelligence network is now clean and...`)
            .setColor(constants.COLORS.SUCCESS)
            .setImage('attachment://progress.png')
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
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
