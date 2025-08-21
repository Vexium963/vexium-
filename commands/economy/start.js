const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription(`🚀 Begin your VexiumVerse empire journey - Earn real VEX tokens! 💸 Join 50,000+ players building...`),
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'start', true);
        }
        
        if (userData.onboardingCompleted) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.SUCCESS} Welcome Back, VEX Legend!`)
                .setDescription(`🎉 **You're already dominating VexiumVerse!**\n\n💎 **Your Empire Status:**\n• Level ${userData.l...`)
                .addFields(
                    { name: '💰 Daily Empire Growth', value: '`/daily` - Claim streak bonuses', inline: true },
                    { name: '⚒️ Wealth Generation', value: '`/work` - Earn premium VEX', inline: true },
                    { name: '🏪 Strategic Investments', value: '`/shop` - Power up your earnings', inline: true },
                    { name: '📊 Empire Analytics', value: '`/wallet` - Track your dominance', inline: true },
                    { name: '🏆 Social Proof', value: '`/leaderboard` - See your ranking', inline: true },
                    { name: '💼 Advanced Trading', value: '`/trade` - Multiply your wealth', inline: true }
                )
                .setColor(constants.COLORS.VEX)
                .setFooter({ text: 'The /start command is only for new empire builders!' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (userData.stats.commandsUsed > 0 && !userData.onboardingCompleted) {
            const comebackBonus = Math.random() < 0.4 ? Math.floor(Math.random() * 25) + 10 : 0;
            if (comebackBonus > 0) {
                await user.addVEX(comebackBonus, 'comeback_bonus');
            }
            
            const progressBuffer = await this.createProgressBar(userData.level, userData.xp);
            const netWorthTier = this.getWealthTier(userData.networth);
            
            const welcomeBackEmbed = new EmbedBuilder()
                .setTitle(`🎉 ${netWorthTier.icon} WELCOME BACK, ${netWorthTier.title}!`)
                .setDescription(`**${interaction.user.username}**, your empire awaits your return! 🎉\n\n` +
                    `${comebackBonus > 0 ? `💸 **COMEBACK BONUS:** +$${comebackBonus} VEX!\n` : ''}` +
                    `✨ **Empire Status:** $${userData.networth.toFixed(2)} VEX\n` +
                    `🔥 **Daily Streak:** ${userData.dailyStreak} days ${userData.dailyStreak >= 7 ? '🏆' : ''}\n\n` +
                    `⬆️ **Level ${userData.level}**\n\n` +
                    `⚡ **Quick Actions:** ${Math.floor(Math.random() * 200) + 100} players online now!`)
                .addFields(
                    { name: '💰 Current Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                    { name: '🏦 Bank Savings', value: `$${userData.bankBalance.toFixed(2)} VEX`, inline: true },
                    { name: '📈 Net Worth', value: `$${userData.networth.toFixed(2)} VEX`, inline: true }
                )
                .setColor(netWorthTier.color)
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter({ text: 'Your empire grows stronger every day!' })
                .setImage('attachment://progress.png')
                .setTimestamp();
            
            const quickActions = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('quick_daily')
                        .setLabel('Claim Daily')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('💰'),
                    new ButtonBuilder()
                        .setCustomId('quick_work')
                        .setLabel('Work Now')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('⚒️'),
                    new ButtonBuilder()
                        .setCustomId('quick_shop')
                        .setLabel('Shop')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🛍️'),
                    new ButtonBuilder()
                        .setCustomId('quick_profile')
                        .setLabel('Profile')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('👤')
                );
            
            return interaction.reply({ 
                embeds: [welcomeBackEmbed], 
                components: [quickActions],
                files: [{ attachment: progressBuffer, name: 'progress.png' }]
            });
        }
        
        
        userData.stats.commandsUsed++;
        userData.onboardingStep = 1;
        
        const welcomeBonus = Math.random() < 0.4 ? Math.floor(constants.VEX_TOKEN.STARTING_BALANCE * 0.3) : 0;
        const totalStarting = constants.VEX_TOKEN.STARTING_BALANCE + welcomeBonus;
        
        await user.addVEX(totalStarting, 'starting_bonus');
        await user.save(userData);
        
        const progressBuffer = await this.createProgressBar(1, 0, 5);
        
        const onboardingEmbed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.CELEBRATION} Welcome to VexiumVerse Empire! ${constants.ANIMATED_EMOJIS.ROCKET}`)
            .setDescription(`
**🎯 CONGRATULATIONS!** You've just joined the most exclusive financial empire on Discord!

${co...`)
            .addFields(
                { 
                    name: `${constants.ANIMATED_EMOJIS.ROCKET} Your Empire Blueprint`, 
                    value: `**Phase 1:** ${constants.ANIMATED_EMOJIS.VEX} Link Phantom Wallet (PRIORITY)\n**Phase 2:** ${constants.ANIMATED_EMOJIS.GIFT} Claim Daily Empire Rewards\n**Phase 3:** ${constants.ANIMATED_EMOJIS.WORK} Start Your First Job\n**Phase 4:** ${constants.ANIMATED_EMOJIS.CHART} Explore Advanced Features`, 
                    inline: false 
                },
                { 
                    name: `${constants.ANIMATED_EMOJIS.FIRE} Why VexiumVerse Dominates`, 
                    value: `• **Real USD-Pegged VEX Tokens** ${constants.ANIMATED_EMOJIS.MONEY_RAIN}\n• **Multiple Income Streams** ${constants.ANIMATED_EMOJIS.PROGRESS}\n• **Social Trading Empire** ${constants.ANIMATED_EMOJIS.HEART_BEAT}\n• **Premium Wallet Integration** ${constants.ANIMATED_EMOJIS.DIAMOND}`, 
                    inline: false 
                }
            )
            .setColor(constants.COLORS.VEX)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setImage('attachment://progress.png')
            .setFooter({ text: '⚡ Your empire awaits! Click below to begin your wealth journey!' })
            .setTimestamp();
        
        const onboardingButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('onboarding_phantom')
                    .setLabel(`${constants.ANIMATED_EMOJIS.VEX} Link Phantom Wallet`)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('quick_daily')
                    .setLabel(`${constants.ANIMATED_EMOJIS.GIFT} Daily Rewards`)
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('quick_work')
                    .setLabel(`${constants.ANIMATED_EMOJIS.WORK} Start Working`)
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('onboarding_skip')
                    .setLabel('⏭️ Skip Tutorial')
                    .setStyle(ButtonStyle.Danger)
            );
        
        await interaction.reply({ 
            embeds: [onboardingEmbed], 
            components: [onboardingButtons],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
        
        setTimeout(async () => {
            const motivationEmbed = new EmbedBuilder()
                .setTitle(`✨ PRO TIP: The First 24 Hours`)
                .setDescription(`**${interaction.user.username}**, players who complete the tutorial in their first session earn **3x more VEX** in their first week!\n\n` +
                    `🔥 **Current online:** ${Math.floor(Math.random() * 200) + 150} players\n` +
                    `📈 **Today's top earner:** $${(Math.random() * 500 + 200).toFixed(2)} VEX\n` +
                    `🚀 **Your potential:** Unlimited\n\n` +
                    `**Ready to connect your wallet and secure your fortune?**`)
                .setColor(constants.COLORS.GOLD)
                .setFooter({ text: `⏰ Tutorial bonus expires in 23 hours!` });
            
            await interaction.followUp({ embeds: [motivationEmbed], ephemeral: true });
        }, 3000);
    },
    
    async createProgressBar(currentStep, currentProgress, totalSteps) {
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progress = (currentStep - 1 + currentProgress) / totalSteps;
        
        return await canvasRenderer.createAnimatedProgressBar(
            `Tutorial Progress: Step ${currentStep} of ${totalSteps}`,
            progress,
            '#8B5CF6'
        );
    },
    
    getWealthTier(networth) {
        if (networth >= 10000) return { title: 'LEGEND', icon: '👑', color: '#FFD700' };
        if (networth >= 5000) return { title: 'MOGUL', icon: '💎', color: '#9932CC' };
        if (networth >= 1000) return { title: 'ENTREPRENEUR', icon: '🚀', color: '#FF6347' };
        if (networth >= 500) return { title: 'INVESTOR', icon: '📈', color: '#32CD32' };
        if (networth >= 100) return { title: 'TRADER', icon: '💰', color: '#1E90FF' };
        return { title: 'NEWCOMER', icon: '🌟', color: '#FFA500' };
    }
};
