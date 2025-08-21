const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Progression = require('../../utils/progression');
const CanvasRenderer = require('../../utils/canvasRenderer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('progression')
        .setDescription(`⬆️ Track your epic journey and unlock exclusive rewards! See how you rank against other players a...`),
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const currentLevel = userData.level;
        const currentXP = userData.xp;
        const xpForCurrentLevel = this.getXPForLevel(currentLevel);
        const xpForNextLevel = this.getXPForLevel(currentLevel + 1);
        const xpProgress = currentXP - xpForCurrentLevel;
        const xpNeeded = xpForNextLevel - xpForCurrentLevel;
        const progressPercentage = (xpProgress / xpNeeded) * 100;
        
        const progressBar = this.createProgressBar(progressPercentage);
        const streakBonus = this.calculateStreakBonus(userData.dailyStreak);
        const levelUpRewards = this.getLevelUpRewards(currentLevel + 1);
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 75) + 25);
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(0)) : null;
        const milestoneMessage = progressPercentage >= 90 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        
        const embed = new EmbedBuilder()
            .setTitle(`⬆️ ${interaction.user.username}'s Epic Journey`)
            .setDescription(`✨ **You're ${progressPercentage.toFixed(1)}% to your next breakthrough!**\n${this.getMotivationalMessage(progressPercentage)}\n\n🔥 ${socialProofMessage}${milestoneMessage ? `\n🏆 ${milestoneMessage}` : ''}${variableReward ? `\n💸 ${variableReward}` : ''}\n\n⏳ ${fomoMessage}`)
            .addFields(
                { name: '🎯 Current Level', value: `**${currentLevel}** ${this.getLevelEmoji(currentLevel)}`, inline: true },
                { name: '⭐ Current XP', value: `**${currentXP.toLocaleString()}** XP`, inline: true },
                { name: '🚀 Next Level', value: `**${currentLevel + 1}** ${this.getLevelEmoji(currentLevel + 1)}`, inline: true },
                { name: '📊 Progress to Next Level', value: `${progressBar}\n**${xpProgress.toLocaleString()}** / **${xpNeeded.toLocaleString()}** XP (${progressPercentage.toFixed(1)}%)`, inline: false },
                { name: '💎 XP Needed', value: `**${(xpForNextLevel - currentXP).toLocaleString()}** XP`, inline: true },
                { name: '🏆 Achievements', value: `**${userData.achievements?.length || 0}**/${constants.ACHIEVEMENTS.length} unlocked`, inline: true },
                { name: '🔥 Daily Streak', value: `**${userData.dailyStreak || 0}** days ${streakBonus > 0 ? `(+${streakBonus}% bonus!)` : ''}`, inline: true }
            )
            .setColor(this.getProgressColor(progressPercentage))
            .setTimestamp();
        
        if (userData.job) {
            const jobProgress = this.getJobProgress(userData);
            embed.addFields({
                name: '💼 Career Progression',
                value: `**${userData.job}** (Level ${userData.jobLevel || 1})\n${jobProgress.bar}\n*${jobProgress.nextPromotion}*`,
                inline: false
            });
        }
        
        if (userData.premiumTier) {
            const tier = constants.PREMIUM_TIERS[userData.premiumTier.toUpperCase()];
            embed.addFields({
                name: `${constants.EMOJIS.PREMIUM} VIP Benefits Active`,
                value: `${tier.badge} **${tier.name}**\n🚀 **+${(tier.benefits.workBonus * 100 - 100).toFixed(0)}%** earnings boost\n💰 **${(tier.benefits.withdrawalTaxReduction * 100).toFixed(0)}%** tax reduction`,
                inline: false
            });
        }
        
        if (levelUpRewards.length > 0) {
            embed.addFields({
                name: '🎁 Next Level Rewards',
                value: levelUpRewards.map(reward => `${reward.emoji} **${reward.name}**: ${reward.description}`).join('\n'),
                inline: false
            });
        }
        
        const milestones = this.getUpcomingMilestones(currentLevel);
        if (milestones.length > 0) {
            embed.addFields({
                name: '🎯 Upcoming Milestones',
                value: milestones.map(m => `**Level ${m.level}**: ${m.reward} ${m.special ? '✨' : ''}`).join('\n'),
                inline: false
            });
        }

        const competitiveRank = this.getCompetitiveRank(userData);
        embed.addFields({
            name: '🏅 Your Ranking',
            value: `**${competitiveRank.position}** out of all players\n${competitiveRank.badge} **${competitiveRank.title}**\n*${competitiveRank.nextRankProgress}*`,
            inline: false
        });
        
        const actionRow = new ActionRowBuilder();
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`progression_goals_${interaction.user.id}`)
                .setLabel('Set Goals')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎯'),
            new ButtonBuilder()
                .setCustomId(`progression_achievements_${interaction.user.id}`)
                .setLabel('View Achievements')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🏆'),
            new ButtonBuilder()
                .setCustomId(`progression_compare_${interaction.user.id}`)
                .setLabel('Compare Progress')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📊')
        );

        const boostRow = new ActionRowBuilder();
        boostRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`progression_boost_${interaction.user.id}`)
                .setLabel('🚀 XP Boost')
                .setStyle(ButtonStyle.Success)
                .setEmoji('⚡'),
            new ButtonBuilder()
                .setCustomId(`progression_streak_${interaction.user.id}`)
                .setLabel('🔥 Streak Rewards')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🎁'),
            new ButtonBuilder()
                .setCustomId(`progression_leaderboard_${interaction.user.id}`)
                .setLabel('🏆 Leaderboard')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('👑')
        );
        
        try {
            const canvasRenderer = new CanvasRenderer();
            const progressBuffer = await canvasRenderer.createProgressCard(
                `Level ${currentLevel} → ${currentLevel + 1} (${progressPercentage.toFixed(1)}%)`,
                progressPercentage / 100,
                this.getProgressColor(progressPercentage)
            );
            const attachment = new AttachmentBuilder(progressBuffer, { name: 'progression.png' });
            
            embed.setImage('attachment://progression.png');
            
            await interaction.reply({ 
                embeds: [embed], 
                files: [attachment],
                components: [actionRow, boostRow]
            });
        } catch (error) {
            console.warn('Canvas rendering failed, using fallback:', error);
            embed.setThumbnail(interaction.user.displayAvatarURL());
            await interaction.reply({ 
                embeds: [embed],
                components: [actionRow, boostRow]
            });
        }
        
        userData.stats.commandsUsed++;
        await user.save(userData);
    },
    
    createProgressBar(progress, length = 20) {
        const filled = Math.floor(progress * length);
        const empty = length - filled;
        const percentage = Math.floor(progress * 100);
        
        let progressEmoji = '🟩';
        if (percentage < 25) progressEmoji = '🟥';
        else if (percentage < 50) progressEmoji = '🟨';
        else if (percentage < 75) progressEmoji = '🟧';
        
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        return `${progressEmoji} ${bar} **${percentage}%**`;
    },

    getXPForLevel(level) {
        const base = 1000;
        const multiplier = 1.2;
        return Math.floor(base * Math.pow(multiplier, level - 1));
    },

    getUpcomingMilestones(currentLevel) {
        const milestones = [
            { level: 5, reward: 'Unlock Premium Jobs', special: false },
            { level: 10, reward: 'Daily Bonus Increase (+50%)', special: true },
            { level: 15, reward: 'Advanced Investment Options', special: false },
            { level: 20, reward: 'VIP Shop Access', special: true },
            { level: 25, reward: 'Exclusive Commands', special: false },
            { level: 30, reward: 'Prestige System Unlock', special: true },
            { level: 50, reward: 'Legendary Status + Crown Badge', special: true }
        ];
        
        return milestones.filter(m => m.level > currentLevel).slice(0, 3);
    },

    getMotivationalMessage(progressPercentage) {
        if (progressPercentage >= 90) return "🔥 **SO CLOSE!** You're almost there - don't stop now!";
        if (progressPercentage >= 75) return "💪 **AMAZING PROGRESS!** You're in the final stretch!";
        if (progressPercentage >= 50) return "🚀 **HALFWAY THERE!** Keep up the momentum!";
        if (progressPercentage >= 25) return "⭐ **GREAT START!** You're building something incredible!";
        return "🌟 **BEGIN YOUR LEGEND!** Every expert was once a beginner!";
    },

    getLevelEmoji(level) {
        if (level >= 50) return '👑';
        if (level >= 30) return '💎';
        if (level >= 20) return '🏆';
        if (level >= 10) return '⭐';
        if (level >= 5) return '🌟';
        return '✨';
    },

    getProgressColor(progressPercentage) {
        if (progressPercentage >= 90) return '#FF6B6B';
        if (progressPercentage >= 75) return '#FF8E53';
        if (progressPercentage >= 50) return '#4ECDC4';
        if (progressPercentage >= 25) return '#45B7D1';
        return '#96CEB4';
    },

    calculateStreakBonus(streak) {
        if (streak >= 30) return 50;
        if (streak >= 14) return 25;
        if (streak >= 7) return 15;
        if (streak >= 3) return 10;
        return 0;
    },

    getLevelUpRewards(nextLevel) {
        const rewards = [];
        
        if (nextLevel % 5 === 0) {
            rewards.push({
                emoji: '💰',
                name: 'VEX Bonus',
                description: `${nextLevel * 10} VEX reward`
            });
        }
        
        if (nextLevel % 10 === 0) {
            rewards.push({
                emoji: '🎁',
                name: 'Mystery Box',
                description: 'Contains rare items and bonuses'
            });
        }
        
        if ([5, 10, 15, 20, 25, 30, 50].includes(nextLevel)) {
            rewards.push({
                emoji: '🔓',
                name: 'Feature Unlock',
                description: 'New commands and abilities'
            });
        }
        
        return rewards;
    },

    getJobProgress(userData) {
        const currentJobLevel = userData.jobLevel || 1;
        const maxJobLevel = 10;
        const progress = (currentJobLevel / maxJobLevel) * 100;
        
        const bar = this.createProgressBar(progress);
        const nextPromotion = currentJobLevel < maxJobLevel 
            ? `Next promotion at level ${currentJobLevel + 1}`
            : 'Maximum job level reached!';
            
        return { bar, nextPromotion };
    },

    getCompetitiveRank(userData) {
        const networth = userData.networth || 0;
        
        let position, badge, title, nextRankProgress;
        
        if (networth >= 10000) {
            position = 'Top 1%';
            badge = '👑';
            title = 'VEX Royalty';
            nextRankProgress = 'You\'ve reached the highest tier!';
        } else if (networth >= 5000) {
            position = 'Top 5%';
            badge = '💎';
            title = 'Diamond Elite';
            nextRankProgress = `${(10000 - networth).toFixed(0)} VEX to VEX Royalty`;
        } else if (networth >= 1000) {
            position = 'Top 20%';
            badge = '🏆';
            title = 'Gold Achiever';
            nextRankProgress = `${(5000 - networth).toFixed(0)} VEX to Diamond Elite`;
        } else if (networth >= 500) {
            position = 'Top 50%';
            badge = '🥈';
            title = 'Silver Climber';
            nextRankProgress = `${(1000 - networth).toFixed(0)} VEX to Gold Achiever`;
        } else {
            position = 'Rising Star';
            badge = '🥉';
            title = 'Bronze Beginner';
            nextRankProgress = `${(500 - networth).toFixed(0)} VEX to Silver Climber`;
        }
        
        return { position, badge, title, nextRankProgress };
    }
};
