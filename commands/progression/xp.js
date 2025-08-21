const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xp')
        .setDescription(`📈 Track your legendary progression and unlock massive rewards!`),
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'xp', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                progressTracking: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'xp',
                behaviorContext
            );
        }
        
        const currentLevelXP = user.getXPForLevel(userData.level);
        const nextLevelXP = user.getXPForLevel(userData.level + 1);
        const xpForNextLevel = nextLevelXP - currentLevelXP;
        const progress = userData.xp / xpForNextLevel;
        
        const xpChecks = userData.stats.xpChecked || 0;
        const isXpExpert = xpChecks >= 20;
        const isCloseToLevel = progress >= 0.8;
        const surpriseBonus = Math.random() < 0.1 ? Math.floor(userData.level * 2) : 0;
        const activeOptimizers = Math.floor(Math.random() * 25) + 10;
        
        let title = `${constants.EMOJIS.CHART} XP Progress Tracker`;
        let description = `📊 **Track your legendary journey to greatness!**\n🎯 **${(progress * 100).toFixed(1)}% to your next breakthrough!**`;
        
        if (isCloseToLevel) {
            title = `🔥 LEVEL UP IMMINENT!`;
            description = `⚡ **SO CLOSE!** You're ${(100 - progress * 100).toFixed(1)}% away from leveling up!\n🚀 **Keep grinding - glory awaits!**`;
        }
        
        if (isXpExpert) {
            title = `🧠 XP OPTIMIZATION MASTER!`;
            description += `\n👑 **${xpChecks} XP checks** - You're a true progression strategist!`;
        }
        
        if (surpriseBonus > 0) {
            description += `\n✨ **SURPRISE XP BONUS: +${surpriseBonus} XP** for checking your progress!`;
            await user.addXP(surpriseBonus, 'progress_check_bonus');
        }
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', activeOptimizers);
        const variableReward = Math.random() < 0.15 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(0)) : null;
        
        description += `\n${socialProofMessage}`;
        if (isCloseToLevel) {
            description += `\n${fomoMessage}`;
        }
        if (variableReward) {
            description += `\n${variableReward}`;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`✨ ${description}\n\n🔥 **${activeOptimizers} players** are optimizing their XP right now!\n🚀 **D...`)
            .setColor(isCloseToLevel ? constants.COLORS.VEX : isXpExpert ? constants.COLORS.SUCCESS : constants.COLORS.INFO)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();
        
        
        embed.addFields(
            { name: '🎯 Current Level', value: userData.level.toString(), inline: true },
            { name: '📊 Current XP', value: userData.xp.toString(), inline: true },
            { name: '🎯 Next Level', value: (userData.level + 1).toString(), inline: true },
            { name: '📈 XP for Next Level', value: xpForNextLevel.toString(), inline: true },
            { name: '⏳ XP Remaining', value: (xpForNextLevel - userData.xp).toString(), inline: true },
            { name: '📊 Progress', value: `${Math.floor(progress * 100)}%`, inline: true }
        );
        
        
        const xpSources = [
            { name: 'Daily Reward', xp: '25 + (streak × 2)', description: 'Claim daily rewards' },
            { name: 'Work', xp: '10-120', description: 'Based on job tier and level' },
            { name: 'Level Up', xp: '0', description: 'Rewards VEX instead' },
            { name: 'Achievements', xp: 'Varies', description: 'One-time bonuses' }
        ];
        
        const xpSourceText = xpSources.map(source => 
            `**${source.name}**: ${source.xp} XP\n*${source.description}*`
        ).join('\n\n');
        
        embed.addFields({
            name: '💡 XP Sources',
            value: xpSourceText,
            inline: false
        });
        
        const levelRewards = [];
        for (let level = userData.level + 1; level <= Math.min(userData.level + 5, 100); level++) {
            const rewardUSD = level * 0.01; // $0.01 per level
            const reward = Economics.getPeggedVEXPrice(rewardUSD);
            const currentVEXPrice = Economics.getCurrentVEXPrice();
            levelRewards.push(`**Level ${level}**: ${reward.toFixed(2)} VEX (~$${(reward * currentVEXPrice).toFixed(2)})`);
        }
        
        if (levelRewards.length > 0) {
            embed.addFields({
                name: '🎁 Upcoming Level Rewards',
                value: levelRewards.join('\n'),
                inline: false
            });
        }
        
        if (userData.level >= 100) {
            embed.addFields({
                name: '👑 Prestige Available',
                value: 'You can prestige to reset your level and gain massive bonuses!',
                inline: false
            });
        }
        
        const motivationalMessages = [
            "🚀 Every XP point brings you closer to legendary status!",
            "💎 Consistent progress = Exponential rewards!",
            "⚡ You're building something incredible!",
            "🌟 Each level unlocks new possibilities!",
            "🔥 Your dedication is your superpower!"
        ];
        
        const randomMotivation = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        embed.setFooter({ text: `${randomMotivation} | XP gained through VexiumVerse activities` });
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Level ${userData.level} Progress: ${Math.floor(progress * 100)}%`,
            progress,
            constants.COLORS.VEX
        );
        
        embed.setImage('attachment://progress.png');
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
        
        userData.stats.commandsUsed++;
        userData.stats.xpChecked = xpChecks + 1;
        await user.save(userData);
        
        if (surpriseBonus > 0) {
            const bonusEmbed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.STAR} Progress Check Bonus!`)
                .setDescription(`🎉 **+${surpriseBonus} XP** for staying engaged with your progression!\n💸 **Bonus XP rain activa...`)
                .setColor(constants.COLORS.GOLD)
                .setTimestamp();
            
            await interaction.followUp({ embeds: [bonusEmbed] });
        }
    },
    
};
