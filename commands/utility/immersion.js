const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const CanvasRenderer = require('../../utils/canvasRenderer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('immersion')
        .setDescription('View your immersion status, challenges, and achievement chains')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check your current immersion level and active challenges'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('challenges')
                .setDescription('View and manage daily challenges'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('chains')
                .setDescription('View active achievement chains'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('comeback')
                .setDescription('Check for comeback bonuses')),
    
    cooldown: 5,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'status':
                await this.handleStatus(interaction);
                break;
            case 'challenges':
                await this.handleChallenges(interaction);
                break;
            case 'chains':
                await this.handleChains(interaction);
                break;
            case 'comeback':
                await this.handleComeback(interaction);
                break;
        }
    },
    
    async handleStatus(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!interaction.client.immersionEngine) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Immersion Engine Unavailable`)
                .setDescription(`The immersion system is currently unavailable.\n\n${fomoMessage}`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const immersionReport = interaction.client.immersionEngine.generateImmersionReport(interaction.user.id);
        const immersionLevel = immersionReport.immersionLevel;
        const session = immersionReport.sessionData;
        
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 200) + 100);
        const milestoneMessage = immersionLevel === 'highly_immersed' ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.DIAMOND} Your Immersion Status`)
            .setDescription(`🎮 **Immersion Level:** ${this.getImmersionEmoji(immersionLevel)} **${immersionLevel.toUpperCase()}**\n${this.getImmersionMessage(immersionLevel)}\n\n${socialProofMessage}${milestoneMessage ? `\n${milestoneMessage}` : ''}${variableReward ? `\n${variableReward}` : ''}`)
            .setColor(this.getImmersionColor(immersionLevel))
            .setTimestamp();
        
        if (session) {
            const sessionDuration = Math.floor((Date.now() - session.startTime) / 60000);
            embed.addFields(
                { name: '⏱️ Session Duration', value: `${sessionDuration} minutes`, inline: true },
                { name: '🎯 Commands Used', value: `${session.commandsUsed}`, inline: true },
                { name: '📊 Immersion Score', value: `${session.immersionScore}/100`, inline: true },
                { name: '🤝 Social Activity', value: `${session.socialInteractions} interactions`, inline: true },
                { name: '💰 Economic Activity', value: `${session.economicActivity} transactions`, inline: true },
                { name: '🏆 Achievements', value: `${session.achievementsUnlocked} unlocked`, inline: true }
            );
        }
        
        if (immersionReport.activeChallenges.length > 0) {
            const challengeText = immersionReport.activeChallenges
                .slice(0, 3)
                .map(c => `🎯 **${c.type.replace('_', ' ')}**: ${c.progress}/${c.maxProgress}`)
                .join('\n');
            
            embed.addFields({
                name: '🎮 Active Challenges',
                value: challengeText,
                inline: false
            });
        }
        
        if (immersionReport.activeChains.length > 0) {
            const chainText = immersionReport.activeChains
                .slice(0, 2)
                .map(c => `⛓️ **${c.baseAchievement}**: Step ${c.currentStep}/${c.totalSteps}`)
                .join('\n');
            
            embed.addFields({
                name: '🏆 Achievement Chains',
                value: chainText,
                inline: false
            });
        }
        
        if (immersionReport.recommendations.length > 0) {
            const recText = immersionReport.recommendations
                .slice(0, 2)
                .map(r => `💡 **${r.type}**: ${r.message}`)
                .join('\n');
            
            embed.addFields({
                name: '💡 Recommendations',
                value: recText,
                inline: false
            });
        }
        
        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`immersion_challenges_${interaction.user.id}`)
                .setLabel('View Challenges')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎯'),
            new ButtonBuilder()
                .setCustomId(`immersion_chains_${interaction.user.id}`)
                .setLabel('Achievement Chains')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⛓️'),
            new ButtonBuilder()
                .setCustomId(`immersion_boost_${interaction.user.id}`)
                .setLabel('Boost Immersion')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🚀')
        );
        
        try {
            const canvasRenderer = new CanvasRenderer();
            const immersionBuffer = await canvasRenderer.createProgressCard(
                `Immersion Level: ${immersionLevel.toUpperCase()}`,
                session ? session.immersionScore / 100 : 0,
                this.getImmersionColor(immersionLevel)
            );
            const attachment = new AttachmentBuilder(immersionBuffer, { name: 'immersion-status.png' });
            
            await interaction.reply({ 
                embeds: [embed], 
                files: [attachment],
                components: [actionRow]
            });
        } catch (error) {
            console.warn('Canvas rendering failed, using fallback:', error);
            await interaction.reply({ 
                embeds: [embed],
                components: [actionRow]
            });
        }
    },
    
    async handleChallenges(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!interaction.client.immersionEngine) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Immersion Engine Unavailable`)
                .setDescription(`The challenge system is currently unavailable.\n\n${fomoMessage}`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const immersionReport = interaction.client.immersionEngine.generateImmersionReport(interaction.user.id);
        const activeChallenges = immersionReport.activeChallenges;
        const completedChallenges = immersionReport.completedChallenges;
        
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 150) + 75);
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.TARGET} Daily Challenges`)
            .setDescription(`Complete challenges to earn massive rewards and boost your immersion!\n\n${fomoMessage}\n${socialProofMessage}`)
            .setColor(constants.COLORS.PRIMARY)
            .setTimestamp();
        
        if (activeChallenges.length > 0) {
            const activeText = activeChallenges.map(challenge => {
                const progressPercent = (challenge.progress / challenge.maxProgress * 100).toFixed(1);
                const progressBar = this.createMiniProgressBar(challenge.progress / challenge.maxProgress);
                const timeLeft = this.getTimeLeft(challenge.timeLimit);
                
                return `🎯 **${challenge.type.replace('_', ' ').toUpperCase()}**\n` +
                       `📝 ${challenge.description}\n` +
                       `${progressBar} ${progressPercent}%\n` +
                       `⏰ ${timeLeft} remaining\n` +
                       `🎁 Reward: ${challenge.rewards.vex} VEX + ${challenge.rewards.xp} XP`;
            }).join('\n\n');
            
            embed.addFields({
                name: '🔥 Active Challenges',
                value: activeText,
                inline: false
            });
        } else {
            embed.addFields({
                name: '🔥 Active Challenges',
                value: 'No active challenges. New challenges will be available tomorrow!',
                inline: false
            });
        }
        
        if (completedChallenges.length > 0) {
            const completedText = completedChallenges
                .slice(-3)
                .map(c => `✅ **${c.type.replace('_', ' ')}** - ${c.rewards.vex} VEX earned`)
                .join('\n');
            
            embed.addFields({
                name: '✅ Recently Completed',
                value: completedText,
                inline: false
            });
        }
        
        const totalCompleted = completedChallenges.length;
        const challengeStreak = this.calculateChallengeStreak(completedChallenges);
        
        embed.addFields(
            { name: '📊 Total Completed', value: `${totalCompleted} challenges`, inline: true },
            { name: '🔥 Challenge Streak', value: `${challengeStreak} days`, inline: true },
            { name: '🏆 Challenge Rank', value: this.getChallengeRank(totalCompleted), inline: true }
        );
        
        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`challenges_refresh_${interaction.user.id}`)
                .setLabel('Refresh')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔄'),
            new ButtonBuilder()
                .setCustomId(`challenges_history_${interaction.user.id}`)
                .setLabel('View History')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📜'),
            new ButtonBuilder()
                .setCustomId(`challenges_create_${interaction.user.id}`)
                .setLabel('Generate New')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('✨')
        );
        
        await interaction.reply({ embeds: [embed], components: [actionRow] });
    },
    
    async handleChains(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!interaction.client.immersionEngine) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Immersion Engine Unavailable`)
                .setDescription('The achievement chain system is currently unavailable.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const immersionReport = interaction.client.immersionEngine.generateImmersionReport(interaction.user.id);
        const activeChains = immersionReport.activeChains;
        const completedChains = immersionReport.completedChains;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CHAIN} Achievement Chains`)
            .setDescription('⛓️ **Chain together achievements for MASSIVE rewards!**\nComplete sequential achievements to unlock legendary bonuses!')
            .setColor(constants.COLORS.VEX)
            .setTimestamp();
        
        if (activeChains.length > 0) {
            const activeText = activeChains.map(chain => {
                const progressPercent = (chain.currentStep / chain.totalSteps * 100).toFixed(1);
                const progressBar = this.createMiniProgressBar(chain.currentStep / chain.totalSteps);
                const timeLeft = this.getTimeLeft(chain.timeLimit);
                const nextReward = chain.rewards[chain.currentStep];
                
                return `⛓️ **${chain.baseAchievement.toUpperCase()} CHAIN**\n` +
                       `${progressBar} Step ${chain.currentStep}/${chain.totalSteps} (${progressPercent}%)\n` +
                       `⏰ ${timeLeft} remaining\n` +
                       `🎁 Next: ${nextReward?.vex || 0} VEX + ${nextReward?.xp || 0} XP` +
                       (nextReward?.special ? ` + ${nextReward.special}` : '');
            }).join('\n\n');
            
            embed.addFields({
                name: '🔥 Active Chains',
                value: activeText,
                inline: false
            });
        } else {
            embed.addFields({
                name: '🔥 Active Chains',
                value: 'No active chains. Complete achievements to start new chains!',
                inline: false
            });
        }
        
        if (completedChains.length > 0) {
            const completedText = completedChains
                .slice(-2)
                .map(c => `✅ **${c.baseAchievement}** - ${c.totalSteps} steps completed`)
                .join('\n');
            
            embed.addFields({
                name: '🏆 Completed Chains',
                value: completedText,
                inline: false
            });
        }
        
        const totalChains = completedChains.length;
        const chainMaster = totalChains >= 5;
        
        embed.addFields(
            { name: '⛓️ Chains Completed', value: `${totalChains}`, inline: true },
            { name: '🏅 Chain Master', value: chainMaster ? '👑 YES' : '❌ NO', inline: true },
            { name: '💎 Legendary Rewards', value: `${completedChains.filter(c => c.rewards.some(r => r.special)).length}`, inline: true }
        );
        
        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`chains_create_${interaction.user.id}`)
                .setLabel('Start New Chain')
                .setStyle(ButtonStyle.Success)
                .setEmoji('⛓️'),
            new ButtonBuilder()
                .setCustomId(`chains_progress_${interaction.user.id}`)
                .setLabel('Check Progress')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📊'),
            new ButtonBuilder()
                .setCustomId(`chains_rewards_${interaction.user.id}`)
                .setLabel('View Rewards')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🎁')
        );
        
        await interaction.reply({ embeds: [embed], components: [actionRow] });
    },
    
    async handleComeback(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!interaction.client.immersionEngine) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Immersion Engine Unavailable`)
                .setDescription('The comeback bonus system is currently unavailable.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const lastActive = userData.lastActive || Date.now();
        const comebackBonus = interaction.client.immersionEngine.calculateComebackBonus(interaction.user.id, lastActive);
        
        if (!comebackBonus) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.INFO} No Comeback Bonus`)
                .setDescription('You\'ve been active recently! Comeback bonuses are for players who return after being away.')
                .addFields({
                    name: '💡 Tip',
                    value: 'Keep playing daily to maintain your streak and earn consistent rewards!',
                    inline: false
                })
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.GIFT} Welcome Back Bonus!`)
            .setDescription(`${comebackBonus.message}\n\n🎉 **You've been away for ${comebackBonus.daysAway} days!**`)
            .addFields(
                { name: '💰 Comeback Bonus', value: `${comebackBonus.bonusAmount.toFixed(0)} VEX`, inline: true },
                { name: '📈 Bonus Multiplier', value: `${comebackBonus.bonusMultiplier.toFixed(1)}x`, inline: true },
                { name: '⏰ Expires In', value: this.getTimeLeft(comebackBonus.expires), inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        if (comebackBonus.specialOffers.length > 0) {
            const offersText = comebackBonus.specialOffers.map(offer => {
                if (offer.type === 'xp_boost') {
                    return `🚀 **XP Boost**: ${offer.multiplier}x XP for 24 hours`;
                } else if (offer.type === 'shop_discount') {
                    return `🛍️ **Shop Discount**: ${(offer.discount * 100).toFixed(0)}% off all items`;
                }
                return `✨ **${offer.type}**: Special bonus active`;
            }).join('\n');
            
            embed.addFields({
                name: '🎁 Special Offers',
                value: offersText,
                inline: false
            });
        }
        
        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`comeback_claim_${interaction.user.id}`)
                .setLabel('Claim Bonus')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🎁'),
            new ButtonBuilder()
                .setCustomId(`comeback_offers_${interaction.user.id}`)
                .setLabel('View Offers')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('✨'),
            new ButtonBuilder()
                .setCustomId(`comeback_dismiss_${interaction.user.id}`)
                .setLabel('Maybe Later')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⏰')
        );
        
        await interaction.reply({ embeds: [embed], components: [actionRow] });
    },
    
    getImmersionEmoji(level) {
        const emojis = {
            highly_immersed: '🔥',
            immersed: '⭐',
            engaged: '💫',
            casual: '🌟',
            disconnected: '😴',
            new: '✨'
        };
        return emojis[level] || '❓';
    },
    
    getImmersionMessage(level) {
        const messages = {
            highly_immersed: '🔥 **YOU\'RE ON FIRE!** Maximum immersion achieved!',
            immersed: '⭐ **FULLY ENGAGED!** You\'re in the zone!',
            engaged: '💫 **GETTING HOOKED!** Keep up the momentum!',
            casual: '🌟 **WARMING UP!** More activities await!',
            disconnected: '😴 **WAKE UP!** Time to dive back in!',
            new: '✨ **WELCOME!** Your journey begins now!'
        };
        return messages[level] || 'Status unknown';
    },
    
    getImmersionColor(level) {
        const colors = {
            highly_immersed: '#FF4444',
            immersed: '#FF8800',
            engaged: '#FFAA00',
            casual: '#44AA44',
            disconnected: '#888888',
            new: '#4488FF'
        };
        return colors[level] || constants.COLORS.INFO;
    },
    
    createMiniProgressBar(progress, length = 10) {
        const filled = Math.floor(progress * length);
        const empty = length - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    },
    
    getTimeLeft(timestamp) {
        const diff = timestamp - Date.now();
        if (diff <= 0) return 'Expired';
        
        const hours = Math.floor(diff / (60 * 60 * 1000));
        const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
        
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    },
    
    calculateChallengeStreak(completedChallenges) {
        if (completedChallenges.length === 0) return 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let streak = 0;
        let checkDate = new Date(today);
        
        for (let i = 0; i < 30; i++) {
            const dayStart = checkDate.getTime();
            const dayEnd = dayStart + (24 * 60 * 60 * 1000);
            
            const hasChallenge = completedChallenges.some(c => 
                c.timestamp >= dayStart && c.timestamp < dayEnd
            );
            
            if (hasChallenge) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    },
    
    getChallengeRank(totalCompleted) {
        if (totalCompleted >= 100) return '🏆 Legendary';
        if (totalCompleted >= 50) return '💎 Master';
        if (totalCompleted >= 25) return '🥇 Expert';
        if (totalCompleted >= 10) return '🥈 Advanced';
        if (totalCompleted >= 5) return '🥉 Intermediate';
        return '🌟 Beginner';
    }
};
