const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('milestones')
        .setDescription(`🏆 View your achievements and unlock exclusive rewards!`)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('View another user\'s achievements')
                .setRequired(false)),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const isOwnAchievements = targetUser.id === interaction.user.id;
        
        const user = new User(targetUser.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine && isOwnAchievements) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'achievements', true);
        }
        
        if (interaction.client.psychologyEngine && isOwnAchievements) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                achievementHunting: true,
                progressTracking: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'achievements',
                behaviorContext
            );
        }
        
        if (!isOwnAchievements && userData.settings.privacy === 'private') {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Private Profile`)
                .setDescription(`🔒 ${targetUser.username}'s achievements are private.\n\n${fomoMessage}\n✨ **Unlock your own achi...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const unlockedAchievements = userData.achievements || [];
        const totalAchievements = constants.ACHIEVEMENTS.length;
        const completionRate = (unlockedAchievements.length / totalAchievements * 100);
        const isAchievementHunter = completionRate >= 75;
        const isCompletionist = completionRate >= 90;
        const recentUnlocks = unlockedAchievements.slice(-3);
        
        let title = `🏆 ${isOwnAchievements ? 'Your' : targetUser.username + "'s"} Achievement Collection`;
        let description = `🎉 **${unlockedAchievements.length}** out of **${totalAchievements}** achievements unlocked!`;
        
        if (isOwnAchievements) {
            if (isCompletionist) {
                title = `👑 COMPLETIONIST LEGEND!`;
                description = `🏆 **INCREDIBLE!** ${unlockedAchievements.length}/${totalAchievements} achievements!\n💎 **You're in the top 1% of players!**`;
            } else if (isAchievementHunter) {
                title = `🔥 ACHIEVEMENT MASTER!`;
                description = `🏆 **AMAZING PROGRESS!** ${unlockedAchievements.length}/${totalAchievements} achievements!\n⭐ **You're almost a completionist!**`;
            }
            
            const dailyAchievementBonus = Math.random() < 0.3;
            if (dailyAchievementBonus && completionRate < 100) {
                description += `\n\n🔥 **TODAY ONLY:** Double XP for achievement unlocks!`;
            }
        }
        
        description += `\n\n📊 **${completionRate.toFixed(1)}%** completion rate`;
        
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 75) + 25);
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        const milestoneMessage = isCompletionist ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        
        if (isOwnAchievements) {
            description += `\n\n${socialProofMessage}`;
            if (variableReward) description += `\n${variableReward}`;
            if (milestoneMessage) description += `\n${milestoneMessage}`;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`${description}\n\n📈 **Achievement hunters earn 2x more VEX!**\n🔥 **${Math.floor(Math.random() * 50) + 25} players** are hunting achievements right now!`)
            .setColor(isCompletionist ? constants.COLORS.VEX : isAchievementHunter ? constants.COLORS.SUCCESS : constants.COLORS.GOLD)
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();
        
        const rarityGroups = {
            mythic: [],
            legendary: [],
            epic: [],
            rare: [],
            uncommon: [],
            common: []
        };
        
        let totalRewards = 0;
        
        for (const achievement of constants.ACHIEVEMENTS) {
            const isUnlocked = unlockedAchievements.includes(achievement.id);
            const rarity = achievement.rarity || 'common';
            
            if (isUnlocked) {
                totalRewards += achievement.reward;
                rarityGroups[rarity].push(`${achievement.icon} **${achievement.name}** - $${achievement.reward.toFixed(2)} VEX`);
            }
        }
        
        const rarityColors = {
            mythic: '🌟',
            legendary: '🏆',
            epic: '💜',
            rare: '💙',
            uncommon: '💚',
            common: '⚪'
        };
        
        for (const [rarity, achievements] of Object.entries(rarityGroups)) {
            if (achievements.length > 0) {
                embed.addFields({
                    name: `${rarityColors[rarity]} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)} (${achievements.length})`,
                    value: achievements.join('\n'),
                    inline: false
                });
            }
        }
        
        if (unlockedAchievements.length === 0) {
            embed.addFields({
                name: '🎯 Get Started',
                value: 'Complete your first command to unlock your first achievement!',
                inline: false
            });
        } else {
            embed.addFields({
                name: '💰 Total Rewards Earned',
                value: `$${totalRewards.toFixed(2)} VEX`,
                inline: true
            });
        }
        
        const lockedAchievements = constants.ACHIEVEMENTS.filter(a => !unlockedAchievements.includes(a.id));
        if (lockedAchievements.length > 0 && isOwnAchievements) {
            const nextAchievements = lockedAchievements.slice(0, 3).map(a => 
                `${a.icon} **${a.name}** - ${a.description} ($${a.reward.toFixed(2)} VEX)`
            ).join('\n');
            
            embed.addFields({
                name: '🔒 Next Achievements',
                value: nextAchievements,
                inline: false
            });
        }
        
        embed.setFooter({ 
            text: isOwnAchievements ? 
                'Keep playing to unlock more achievements!' : 
                `Achievements viewed by ${interaction.user.username}` 
        });
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Achievement Progress: ${unlockedAchievements.length}/${totalAchievements}`,
            completionRate / 100,
            constants.COLORS.GOLD
        );

        embed.setImage('attachment://progress.png');

        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
        
        if (isOwnAchievements) {
            userData.stats.commandsUsed++;
            await user.save(userData);
        }
    }
};
