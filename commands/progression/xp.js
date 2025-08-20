const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xp')
        .setDescription('View detailed XP information and level requirements'),
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const currentLevelXP = user.getXPForLevel(userData.level);
        const nextLevelXP = user.getXPForLevel(userData.level + 1);
        const xpForNextLevel = nextLevelXP - currentLevelXP;
        const progress = userData.xp / xpForNextLevel;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CHART} XP Information`)
            .setDescription('Detailed experience point breakdown and progression')
            .setColor(constants.COLORS.INFO)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();
        
        const progressBar = this.createProgressBar(progress);
        
        embed.addFields(
            { name: '🎯 Current Level', value: userData.level.toString(), inline: true },
            { name: '📊 Current XP', value: userData.xp.toString(), inline: true },
            { name: '🎯 Next Level', value: (userData.level + 1).toString(), inline: true },
            { name: '📈 XP for Next Level', value: xpForNextLevel.toString(), inline: true },
            { name: '⏳ XP Remaining', value: (xpForNextLevel - userData.xp).toString(), inline: true },
            { name: '📊 Progress', value: `${Math.floor(progress * 100)}%`, inline: true }
        );
        
        embed.addFields({
            name: '📊 Progress Bar',
            value: progressBar,
            inline: false
        });
        
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
            const reward = level * 0.50;
            levelRewards.push(`**Level ${level}**: $${reward.toFixed(2)} VEX`);
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
        
        embed.setFooter({ text: 'XP is gained through various activities in VexiumVerse' });
        
        await interaction.reply({ embeds: [embed] });
        
        userData.stats.commandsUsed++;
        await user.save(userData);
    },
    
    createProgressBar(progress, length = 20) {
        const filled = Math.floor(progress * length);
        const empty = length - filled;
        
        return '█'.repeat(filled) + '░'.repeat(empty) + ` ${Math.floor(progress * 100)}%`;
    }
};
