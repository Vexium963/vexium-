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
        
        const now = Date.now();
        const lastDaily = userData.lastDaily ? new Date(userData.lastDaily).getTime() : 0;
        const timeSinceLastDaily = now - lastDaily;
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        if (timeSinceLastDaily < oneDayMs) {
            const timeLeft = oneDayMs - timeSinceLastDaily;
            const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.COOLDOWN} Daily Reward on Cooldown`)
                .setDescription(`You can claim your next daily reward in **${hoursLeft}h ${minutesLeft}m**`)
                .addFields(
                    { name: '🔥 Current Streak', value: userData.dailyStreak.toString(), inline: true },
                    { name: '💰 Next Reward', value: `$${this.calculateDailyReward(userData.dailyStreak + 1).toFixed(2)} VEX`, inline: true }
                )
                .setColor(constants.COLORS.WARNING)
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
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.GIFT} Daily VEX Claimed!`)
            .setDescription(`You've earned **$${roundedReward.toFixed(2)} VEX** for day ${userData.dailyStreak}!`)
            .addFields(
                { name: '💰 Base Reward', value: `$${baseReward.toFixed(2)}`, inline: true },
                { name: '🔥 Streak Bonus', value: `$${streakBonus.toFixed(2)}`, inline: true },
                { name: '🎲 Random Bonus', value: `$${randomBonus.toFixed(2)}`, inline: true },
                { name: '📊 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '🎯 XP Gained', value: `+${xpGained} XP`, inline: true },
                { name: '🔥 Streak', value: `${userData.dailyStreak} days`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Come back tomorrow to continue your streak!' })
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
