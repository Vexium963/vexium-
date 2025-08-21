const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription(`✨ Configure your VexiumVerse preferences and unlock optimization bonuses!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription(`📈 View current settings and optimization score`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('privacy')
                .setDescription(`🔒 Configure privacy settings and protect your empire`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('display')
                .setDescription(`🌈 Configure display preferences for maximum immersion`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription(`💥 Reset all settings to default and get a fresh start bonus`)),
    
    cooldown: 10,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        const subcommand = interaction.options.getSubcommand();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'settings', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                settingsOptimization: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'settings',
                behaviorContext
            );
        }
        
        const settingsUsage = userData.stats.settingsOptimized || 0;
        const isSettingsPro = settingsUsage >= 10;
        const isFirstTime = settingsUsage === 0;
        const optimizationStreak = userData.stats.settingsStreak || 0;
        const surpriseBonus = Math.random() < 0.2 ? Math.floor(settingsUsage * 5) : 0;
        
        if (isFirstTime) {
            userData.stats.settingsOptimized = 1;
            userData.stats.settingsStreak = 1;
            if (surpriseBonus > 0) {
                await user.addVEX(surpriseBonus, 'settings_optimization_bonus');
                const Economics = require('../../utils/economics');
                Economics.updateVEXMarket('reward', surpriseBonus);
            }
            await user.save(userData);
        } else {
            userData.stats.settingsOptimized = settingsUsage + 1;
            userData.stats.settingsStreak = optimizationStreak + 1;
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
            title = `🌟 SETTINGS UNLOCKED! Welcome to Power!`;
            description = `✨ **FIRST TIME BONUS!** You're taking control of your empire!${surpriseBonus > 0 ? `\n💰 **SURPRISE REWARD: +${surpriseBonus} VEX** for being proactive!` : ''}`;
        } else if (isSettingsPro) {
            title = `👑 SETTINGS MASTER! Ultimate Control!`;
            description = `💎 **OPTIMIZATION LEGEND!** ${settingsUsage} customizations completed!\n🔥 **${optimizationStreak}-session streak** - You're unstoppable!`;
        } else {
            description += `\n🎯 **${settingsUsage} optimizations completed** - Building your perfect setup!`;
        }
        
        const activeOptimizers = Math.floor(Math.random() * 25) + 10;
        description += `\n📊 **${activeOptimizers} players optimizing right now!** Join the efficiency revolution!`;
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', activeOptimizers);
        const variableReward = Math.random() < 0.15 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 3 + 1).toFixed(2)) : null;
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description + `\n\n📈 **Optimization Score:** ${optimizationScore}%\n\n🔥 ${fomoMessage}\n✨ ${socialProofMessage}${variableReward ? `\n💸 ${variableReward}` : ''}`)
            .addFields(
                { name: '🔒 Privacy Fortress', value: this.formatPrivacySettings(settings.privacy) + '\n💡 *Control your digital footprint*', inline: false },
                { name: '🎨 Visual Experience', value: this.formatDisplaySettings(settings.display) + '\n🎯 *Personalize your interface*', inline: false },
                { name: '🔔 Smart Notifications', value: this.formatNotificationSettings(settings.notifications) + '\n⚡ *Stay informed, stay ahead*', inline: false },
                { name: '📈 Your Progress', value: `🎛️ **Settings Optimized:** ${settingsUsage} times\n🏆 **Status:** ${isSettingsPro ? '👑 Master' : settingsUsage >= 5 ? '⭐ Expert' : '🌟 Learning'}\n💡 **Tip:** ${this.getOptimizationTip(optimizationScore)}`, inline: false }
            )
            .setColor(isSettingsPro ? constants.COLORS.VEX : isFirstTime ? constants.COLORS.SUCCESS : constants.COLORS.PRIMARY)
            .setImage('attachment://progress.png')
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
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Optimization Score: ${optimizationScore}%`,
            optimizationScore / 100,
            constants.COLORS.VEX
        );

        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handlePrivacy(interaction, user, userData) {
        const settings = userData.settings || this.getDefaultSettings();
        const privacy = settings.privacy;
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofCount = Math.floor(Math.random() * 30) + 15;
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', socialProofCount);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.LOCK} Privacy Settings`)
            .setDescription(`🔒 Control who can see your information and interact with you\n\n🔥 ${fomoMessage}\n✨ ${socialProofMessage}\n\n${constants.ANIMATED_EMOJIS.SPARKLES} **Customize your VexiumVerse experience!**`)
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
        
        const milestoneMessage = constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)];
        const socialProofCount = Math.floor(Math.random() * 40) + 20;
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', socialProofCount);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.PALETTE} Display Settings`)
            .setDescription(`🌈 Customize how information is displayed to you\n\n⬆️ ${milestoneMessage}\n✨ ${socialProofMessage}\n\n${constants.ANIMATED_EMOJIS.SPARKLES} **Personalize your VexiumVerse interface!**`)
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
        
        const comebackMessage = constants.COMEBACK_MESSAGES[Math.floor(Math.random() * constants.COMEBACK_MESSAGES.length)];
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 2 + 1).toFixed(2)) : null;
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            'Settings Reset Complete',
            1.0,
            constants.COLORS.SUCCESS
        );

        const embed = new EmbedBuilder()
            .setTitle(`✨ Settings Reset`)
            .setDescription(`🎉 All settings have been reset to their default values.\n\n${comebackMessage}${variableReward ? `\n${variableReward}` : ''}`)
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
