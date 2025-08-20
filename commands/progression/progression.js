const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Progression = require('../../utils/progression');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('progression')
        .setDescription('View your level progression and unlock information'),
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const levelProgress = Progression.calculateLevelProgress(userData);
        const jobProgress = Progression.getJobProgression(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CHART} Your Progression`)
            .setDescription('Complete overview of your VexiumVerse advancement')
            .setColor(constants.COLORS.PRIMARY)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();
        
        const levelProgressBar = this.createProgressBar(levelProgress.progress);
        embed.addFields({
            name: '🎯 Level Progress',
            value: `**Level ${levelProgress.currentLevel}** (${userData.xp}/${levelProgress.xpForNext} XP)\n${levelProgressBar}\n${levelProgress.xpToNext} XP to next level`,
            inline: false
        });
        
        if (jobProgress.hasJob) {
            const jobProgressBar = this.createProgressBar(jobProgress.progress);
            embed.addFields({
                name: '💼 Job Progress',
                value: `**${jobProgress.currentJob.name}** (Level ${jobProgress.jobLevel})\n${jobProgressBar}\n${jobProgress.xpToNext} XP to next level`,
                inline: false
            });
        } else {
            embed.addFields({
                name: '💼 Job Progress',
                value: 'No job selected\nUse `/work` to choose a job and start earning!',
                inline: false
            });
        }
        
        const unlockedJobs = Progression.getAvailableJobs(userData.level);
        const jobsByTier = {
            'Beginner (Level 1+)': unlockedJobs.filter(j => j.requiredLevel <= 4),
            'Intermediate (Level 5+)': unlockedJobs.filter(j => j.requiredLevel >= 5 && j.requiredLevel <= 14),
            'Advanced (Level 15+)': unlockedJobs.filter(j => j.requiredLevel >= 15 && j.requiredLevel <= 29),
            'Expert (Level 30+)': unlockedJobs.filter(j => j.requiredLevel >= 30)
        };
        
        for (const [tier, jobs] of Object.entries(jobsByTier)) {
            if (jobs.length > 0) {
                const jobList = jobs.map(job => 
                    `**${job.name}** - $${job.minPay.toFixed(2)}-$${job.maxPay.toFixed(2)} VEX`
                ).join('\n');
                
                embed.addFields({
                    name: `🔓 ${tier}`,
                    value: jobList,
                    inline: true
                });
            }
        }
        
        const nextLevelUnlocks = Progression.getUnlockedJobsForLevel(userData.level + 1);
        if (nextLevelUnlocks.length > 0) {
            const unlockList = nextLevelUnlocks.map(job => 
                `**${job.name}** - $${job.minPay.toFixed(2)}-$${job.maxPay.toFixed(2)} VEX`
            ).join('\n');
            
            embed.addFields({
                name: `🔒 Unlocks at Level ${userData.level + 1}`,
                value: unlockList,
                inline: false
            });
        }
        
        const prestigeInfo = Progression.calculatePrestige(userData);
        if (prestigeInfo.canPrestige) {
            embed.addFields({
                name: '👑 Prestige Available',
                value: `Reset to Level 1 for $${prestigeInfo.bonus.toFixed(2)} VEX bonus!`,
                inline: false
            });
        } else {
            embed.addFields({
                name: '👑 Prestige',
                value: `Available at Level ${prestigeInfo.requirement} (Currently ${prestigeInfo.current})`,
                inline: true
            });
        }
        
        embed.addFields(
            { name: '🏆 Achievements', value: `${userData.achievements.length}/${constants.ACHIEVEMENTS.length}`, inline: true },
            { name: '💰 Net Worth', value: `$${userData.networth.toFixed(2)} VEX`, inline: true }
        );
        
        const progressButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('progression_jobs')
                    .setLabel('🔍 View All Jobs')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('progression_achievements')
                    .setLabel('🏆 Achievements')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('progression_prestige')
                    .setLabel('👑 Prestige Info')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(!prestigeInfo.canPrestige)
            );

        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('progression_refresh')
                    .setLabel('🔄 Refresh')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('progression_compare')
                    .setLabel('📊 Compare Stats')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('progression_goals')
                    .setLabel('🎯 Set Goals')
                    .setStyle(ButtonStyle.Primary)
            );

        embed.setFooter({ text: 'Keep playing to unlock new features and higher-paying jobs!' });
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [progressButtons, actionButtons] 
        });
        
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
    }
};
