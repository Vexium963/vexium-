const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Progression = require('../../utils/progression');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily VEX reward with streak bonuses'),
    
    cooldown: 5,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'daily', true);
        }
        
        const now = Date.now();
        const lastDaily = userData.lastDaily ? new Date(userData.lastDaily).getTime() : 0;
        const timeSinceLastDaily = now - lastDaily;
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        if (timeSinceLastDaily < oneDayMs) {
            const timeLeft = oneDayMs - timeSinceLastDaily;
            const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            
            const nextReward = this.calculateDailyReward(userData.dailyStreak + 1);
            const streakRisk = userData.dailyStreak >= 7 ? '⚠️ **STREAK AT RISK!**' : '';
            const urgencyMessage = hoursLeft <= 2 ? '🔥 **ALMOST READY!** Your reward is building up!' : '⏰ **PATIENCE PAYS OFF!** Your reward is growing!';
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.COOLDOWN} Daily Reward Charging Up!`)
                .setDescription(`${urgencyMessage}\n⏰ **${hoursLeft}h ${minutesLeft}m** until your next **$${nextReward.toFixed(2)} VEX** reward!\n${streakRisk}`)
                .addFields(
                    { name: '🔥 Epic Streak', value: `${userData.dailyStreak} days ${userData.dailyStreak >= 30 ? '👑 LEGENDARY' : userData.dailyStreak >= 7 ? '🏆 AMAZING' : ''}`, inline: true },
                    { name: '💰 Reward Building', value: `$${nextReward.toFixed(2)} VEX`, inline: true },
                    { name: '📊 Others Claiming', value: `${Math.floor(Math.random() * 50) + 20} players active now!`, inline: true }
                )
                .setColor(hoursLeft <= 2 ? constants.COLORS.VEX : constants.COLORS.WARNING)
                .setFooter({ text: '💡 Tip: Longer streaks = BIGGER rewards! Don\'t break the chain!' })
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const twoDaysMs = 48 * 60 * 60 * 1000;
        if (timeSinceLastDaily > twoDaysMs) {
            userData.dailyStreak = 0;
        }
        
        userData.dailyStreak++;
        userData.lastDaily = new Date().toISOString();
        
        let baseReward = constants.VEX_TOKEN.DAILY_REWARD_BASE;
        let streakBonus = Math.min(userData.dailyStreak * 0.25, 5.00);
        let randomBonus = Math.random() * 1.00;
        
        if (userData.premiumTier) {
            const tier = constants.PREMIUM_TIERS[userData.premiumTier.toUpperCase()];
            if (tier) {
                baseReward *= tier.benefits.dailyBonus;
            }
        }
        
        const totalReward = baseReward + streakBonus + randomBonus;
        const roundedReward = Math.round(totalReward * 100) / 100;
        
        await user.addVEX(roundedReward, 'daily_reward');
        
        const xpGained = 25 + (userData.dailyStreak * 2);
        const xpResult = await user.addXP(xpGained, 'daily');
        
        const achievements = Progression.checkAchievements(userData, 'daily_claimed', userData.dailyStreak);
        
        userData.stats.commandsUsed++;
        await user.save(userData);
        
        const isStreakMilestone = [7, 14, 30, 60, 100].includes(userData.dailyStreak);
        const surpriseBonus = Math.random() < 0.15 ? Math.floor(roundedReward * 0.5) : 0;
        const finalReward = roundedReward + surpriseBonus;
        
        let title = `${constants.EMOJIS.GIFT} Daily VEX Claimed!`;
        let description = `💰 **$${finalReward.toFixed(2)} VEX** earned for day ${userData.dailyStreak}!`;
        
        if (userData.dailyStreak >= 7) {
            title = `🔥 STREAK MASTER! Daily Reward Claimed!`;
            description = `💰 **$${finalReward.toFixed(2)} VEX** + **STREAK POWER BONUS**!`;
        }
        
        if (isStreakMilestone) {
            title = `🎉 MILESTONE ACHIEVED! ${userData.dailyStreak}-Day Streak!`;
            description += `\n🏆 **LEGENDARY STREAK BONUS UNLOCKED!**`;
        }
        
        if (surpriseBonus > 0) {
            description += `\n✨ **SURPRISE BONUS: +$${surpriseBonus} VEX!**`;
        }
        
        const progressToNext = Math.min(userData.dailyStreak, 30) / 30;
        const progressBar = '█'.repeat(Math.floor(progressToNext * 20)) + '░'.repeat(20 - Math.floor(progressToNext * 20));
        
        const motivationalMessages = [
            "🚀 Your empire grows stronger every day!",
            "💎 Consistency is the key to wealth!",
            "⚡ You're building legendary status!",
            "🌟 Every day brings you closer to dominance!",
            "🔥 Your dedication is paying off!"
        ];
        
        const randomMotivation = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        
        const dailyFomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const dailySocialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 200) + 100);
        const milestoneMessage = isStreakMilestone ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : '';
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description + `\n\n${randomMotivation}${milestoneMessage ? `\n${milestoneMessage}` : ''}\n\n${dailyFomoMessage}\n${dailySocialProof}`)
            .addFields(
                { name: '💰 Base Reward', value: `$${baseReward.toFixed(2)}`, inline: true },
                { name: '🔥 Streak Power', value: `$${streakBonus.toFixed(2)} ${userData.dailyStreak >= 30 ? '👑' : ''}`, inline: true },
                { name: '🎲 Lucky Bonus', value: `$${(randomBonus + surpriseBonus).toFixed(2)}`, inline: true },
                { name: '📊 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '🎯 XP Gained', value: `+${xpGained} XP ${xpResult.leveledUp ? '🆙' : ''}`, inline: true },
                { name: '🔥 Epic Streak', value: `${userData.dailyStreak} days ${userData.dailyStreak >= 30 ? '👑 LEGENDARY' : userData.dailyStreak >= 7 ? '🏆 AMAZING' : ''}`, inline: true },
                { name: '📊 Streak Progress', value: `${progressBar} ${Math.min(userData.dailyStreak, 30)}/30`, inline: false },
                { name: '⏰ Next Reward', value: `<t:${Math.floor((Date.now() + 86400000) / 1000)}:R> - Don't break the chain!`, inline: false }
            )
            .setColor(isStreakMilestone ? constants.COLORS.VEX : constants.COLORS.SUCCESS)
            .setFooter({ text: '💡 Pro Tip: Longer streaks = EXPONENTIALLY bigger rewards!' })
            .setTimestamp();
        
        if (userData.premiumTier) {
            embed.addFields({ 
                name: `${constants.EMOJIS.PREMIUM} Premium Bonus`, 
                value: `${userData.premiumTier} tier active`, 
                inline: true 
            });
        }
        
        await interaction.reply({ embeds: [embed] });
        
        if (xpResult.leveledUp) {
            const levelEmbed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.LEVEL_UP} Level Up!`)
                .setDescription(`Congratulations! You've reached **Level ${xpResult.newLevel}**!`)
                .addFields(
                    { name: '🎁 Level Reward', value: `$${xpResult.levelReward.toFixed(2)} VEX`, inline: true }
                )
                .setColor(constants.COLORS.GOLD)
                .setTimestamp();
            
            await interaction.followUp({ embeds: [levelEmbed] });
        }
        
        if (achievements.length > 0) {
            for (const achievement of achievements) {
                const achievementEmbed = new EmbedBuilder()
                    .setTitle(`${constants.EMOJIS.ACHIEVEMENT} Achievement Unlocked!`)
                    .setDescription(`**${achievement.name}**\n${achievement.description}`)
                    .addFields(
                        { name: '💰 Reward', value: `$${achievement.reward.toFixed(2)} VEX`, inline: true }
                    )
                    .setColor(constants.COLORS.GOLD)
                    .setTimestamp();
                
                await interaction.followUp({ embeds: [achievementEmbed] });
            }
        }
        
        if (userData.dailyStreak % 7 === 0) {
            const weeklyBonus = userData.dailyStreak * 0.50;
            await user.addVEX(weeklyBonus, 'weekly_bonus');
            
            const bonusEmbed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.STAR} Weekly Streak Bonus!`)
                .setDescription(`Amazing! You've maintained a ${userData.dailyStreak}-day streak!`)
                .addFields(
                    { name: '🎁 Bonus Reward', value: `$${weeklyBonus.toFixed(2)} VEX`, inline: true }
                )
                .setColor(constants.COLORS.GOLD)
                .setTimestamp();
            
            await interaction.followUp({ embeds: [bonusEmbed] });
        }
    },
    
    calculateDailyReward(streak) {
        const baseReward = constants.VEX_TOKEN.DAILY_REWARD_BASE;
        const streakBonus = Math.min(streak * 0.25, 5.00);
        const avgRandomBonus = 0.50;
        
        return baseReward + streakBonus + avgRandomBonus;
    }
};
