const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Configure your VexiumVerse preferences')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current settings'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('privacy')
                .setDescription('Configure privacy settings'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('display')
                .setDescription('Configure display preferences'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset all settings to default')),
    
    cooldown: 10,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        const subcommand = interaction.options.getSubcommand();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'settings', true);
        }
        
        const settingsUsage = userData.stats.settingsOptimized || 0;
        const isSettingsPro = settingsUsage >= 10;
        const isFirstTime = settingsUsage === 0;
        
        if (isFirstTime) {
            userData.stats.settingsOptimized = 1;
            await user.save(userData);
        }
        
        switch (subcommand) {
            case 'view':
                await this.handleView(interaction, user, userData, isSettingsPro, isFirstTime);
                break;
            case 'privacy':
                await this.handlePrivacy(interaction, user, userData, isSettingsPro);
                break;
            case 'display':
                await this.handleDisplay(interaction, user, userData, isSettingsPro);
                break;
            case 'reset':
                await this.handleReset(interaction, user, userData);
                break;
        }
    },
    
    async handleView(interaction, user, userData, isSettingsPro, isFirstTime) {
        const settings = userData.settings || this.getDefaultSettings();
        const optimizationScore = this.calculateOptimizationScore(settings);
        const settingsUsage = userData.stats.settingsOptimized || 0;
        
        let title = `${constants.EMOJIS.SETTINGS} Your Control Center`;
        let description = '⚙️ **Master your VexiumVerse experience!**';
        
        if (isFirstTime) {
            title = `🌟 Welcome to Settings!`;
            description = '✨ **NEW FEATURE UNLOCKED!** Customize your empire to perfection!';
        } else if (isSettingsPro) {
            title = `👑 Settings Master Dashboard`;
            description = '💎 **OPTIMIZATION EXPERT!** Your setup is legendary!';
        }
        
        const progressBar = '█'.repeat(Math.floor(optimizationScore / 5)) + '░'.repeat(20 - Math.floor(optimizationScore / 5));
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description + `\n\n📊 **Optimization Score:** ${progressBar} ${optimizationScore}%`)
            .addFields(
                { name: '🔒 Privacy Fortress', value: this.formatPrivacySettings(settings.privacy) + '\n💡 *Control your digital footprint*', inline: false },
                { name: '🎨 Visual Experience', value: this.formatDisplaySettings(settings.display) + '\n🎯 *Personalize your interface*', inline: false },
                { name: '🔔 Smart Notifications', value: this.formatNotificationSettings(settings.notifications) + '\n⚡ *Stay informed, stay ahead*', inline: false },
                { name: '📈 Your Progress', value: `🎛️ **Settings Optimized:** ${settingsUsage} times\n🏆 **Status:** ${isSettingsPro ? '👑 Master' : settingsUsage >= 5 ? '⭐ Expert' : '🌟 Learning'}\n💡 **Tip:** ${this.getOptimizationTip(optimizationScore)}`, inline: false }
            )
            .setColor(isSettingsPro ? constants.COLORS.VEX : isFirstTime ? constants.COLORS.SUCCESS : constants.COLORS.PRIMARY)
            .setTimestamp();
        
        const buttons = [
            new ButtonBuilder()
                .setCustomId(`settings_privacy_${interaction.user.id}`)
                .setLabel('Privacy')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔒'),
            new ButtonBuilder()
                .setCustomId(`settings_display_${interaction.user.id}`)
                .setLabel('Display')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🎨'),
            new ButtonBuilder()
                .setCustomId(`settings_notifications_${interaction.user.id}`)
                .setLabel('Notifications')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔔')
        ];
        
        const row = new ActionRowBuilder().addComponents(buttons);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handlePrivacy(interaction, user, userData) {
        const settings = userData.settings || this.getDefaultSettings();
        const privacy = settings.privacy;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.LOCK} Privacy Settings`)
            .setDescription('Control who can see your information and interact with you')
            .addFields(
                { name: '👁️ Profile Visibility', value: privacy.profilePublic ? '🌐 Public' : '🔒 Private', inline: true },
                { name: '💰 Balance Visibility', value: privacy.balancePublic ? '🌐 Public' : '🔒 Private', inline: true },
                { name: '📊 Stats Visibility', value: privacy.statsPublic ? '🌐 Public' : '🔒 Private', inline: true },
                { name: '🎁 Allow Gifts', value: privacy.allowGifts ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '🤝 Allow Trades', value: privacy.allowTrades ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '📧 Allow DMs', value: privacy.allowDMs ? '✅ Enabled' : '❌ Disabled', inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setTimestamp();
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`privacy_setting_${interaction.user.id}`)
            .setPlaceholder('Choose a privacy setting to toggle')
            .addOptions([
                {
                    label: 'Profile Visibility',
                    description: 'Control who can view your profile',
                    value: 'profilePublic',
                    emoji: '👁️'
                },
                {
                    label: 'Balance Visibility',
                    description: 'Control who can see your VEX balance',
                    value: 'balancePublic',
                    emoji: '💰'
                },
                {
                    label: 'Stats Visibility',
                    description: 'Control who can view your statistics',
                    value: 'statsPublic',
                    emoji: '📊'
                },
                {
                    label: 'Allow Gifts',
                    description: 'Allow others to send you gifts',
                    value: 'allowGifts',
                    emoji: '🎁'
                },
                {
                    label: 'Allow Trades',
                    description: 'Allow others to trade with you',
                    value: 'allowTrades',
                    emoji: '🤝'
                },
                {
                    label: 'Allow DMs',
                    description: 'Allow bot DMs for notifications',
                    value: 'allowDMs',
                    emoji: '📧'
                }
            ]);
        
        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleDisplay(interaction, user, userData) {
        const settings = userData.settings || this.getDefaultSettings();
        const display = settings.display;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.PALETTE} Display Settings`)
            .setDescription('Customize how information is displayed to you')
            .addFields(
                { name: '🎨 Theme', value: display.theme || 'Default', inline: true },
                { name: '🌍 Timezone', value: display.timezone || 'UTC', inline: true },
                { name: '💱 Currency Format', value: display.currencyFormat || 'USD', inline: true },
                { name: '📊 Compact Mode', value: display.compactMode ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '🔢 Show Decimals', value: display.showDecimals ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '📈 Animations', value: display.animations ? '✅ Enabled' : '❌ Disabled', inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setTimestamp();
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`display_setting_${interaction.user.id}`)
            .setPlaceholder('Choose a display setting to modify')
            .addOptions([
                {
                    label: 'Theme',
                    description: 'Change color theme',
                    value: 'theme',
                    emoji: '🎨'
                },
                {
                    label: 'Timezone',
                    description: 'Set your timezone',
                    value: 'timezone',
                    emoji: '🌍'
                },
                {
                    label: 'Currency Format',
                    description: 'Change currency display format',
                    value: 'currencyFormat',
                    emoji: '💱'
                },
                {
                    label: 'Compact Mode',
                    description: 'Toggle compact display mode',
                    value: 'compactMode',
                    emoji: '📊'
                },
                {
                    label: 'Show Decimals',
                    description: 'Toggle decimal places in amounts',
                    value: 'showDecimals',
                    emoji: '🔢'
                },
                {
                    label: 'Animations',
                    description: 'Toggle animated elements',
                    value: 'animations',
                    emoji: '📈'
                }
            ]);
        
        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleReset(interaction, user, userData) {
        userData.settings = this.getDefaultSettings();
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Settings Reset`)
            .setDescription('🔄 All settings have been reset to their default values.')
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    getDefaultSettings() {
        return {
            privacy: {
                profilePublic: true,
                balancePublic: false,
                statsPublic: true,
                allowGifts: true,
                allowTrades: true,
                allowDMs: true
            },
            display: {
                theme: 'default',
                timezone: 'UTC',
                currencyFormat: 'USD',
                compactMode: false,
                showDecimals: true,
                animations: true
            },
            notifications: {
                dailyRewards: true,
                economyUpdates: true,
                gameResults: true,
                socialActivity: true,
                achievements: true,
                leaderboard: false
            }
        };
    },
    
    formatPrivacySettings(privacy) {
        return [
            `Profile: ${privacy.profilePublic ? 'Public' : 'Private'}`,
            `Balance: ${privacy.balancePublic ? 'Public' : 'Private'}`,
            `Stats: ${privacy.statsPublic ? 'Public' : 'Private'}`,
            `Gifts: ${privacy.allowGifts ? 'Allowed' : 'Blocked'}`,
            `Trades: ${privacy.allowTrades ? 'Allowed' : 'Blocked'}`,
            `DMs: ${privacy.allowDMs ? 'Allowed' : 'Blocked'}`
        ].join('\n');
    },
    
    formatDisplaySettings(display) {
        return [
            `Theme: ${display.theme || 'Default'}`,
            `Timezone: ${display.timezone || 'UTC'}`,
            `Currency: ${display.currencyFormat || 'USD'}`,
            `Compact: ${display.compactMode ? 'On' : 'Off'}`,
            `Decimals: ${display.showDecimals ? 'On' : 'Off'}`,
            `Animations: ${display.animations ? 'On' : 'Off'}`
        ].join('\n');
    },
    
    formatNotificationSettings(notifications) {
        return [
            `Daily: ${notifications.dailyRewards ? 'On' : 'Off'}`,
            `Economy: ${notifications.economyUpdates ? 'On' : 'Off'}`,
            `Games: ${notifications.gameResults ? 'On' : 'Off'}`,
            `Social: ${notifications.socialActivity ? 'On' : 'Off'}`,
            `Achievements: ${notifications.achievements ? 'On' : 'Off'}`,
            `Leaderboard: ${notifications.leaderboard ? 'On' : 'Off'}`
        ].join('\n');
    }
};
