const { SlashCommandBuilder } = require('discord.js');
const { route } = require('../../utils/router');
const ui = require('../../utils/ui');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('achievements')
        .setDescription('Achievement operations')
        .addSubcommand(s => s.setName('view').setDescription('View achievement progress'))
        .addSubcommand(s => s.setName('claim').setDescription('Claim achievement rewards'))
        .addSubcommand(s => s.setName('progress').setDescription('Check specific progress'))
        .addSubcommand(s => s.setName('leaderboard').setDescription('View achievement leaderboard')),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        return route(interaction, {
            view: this.handleView,
            claim: this.handleClaim,
            progress: this.handleProgress,
            leaderboard: this.handleLeaderboard,
            _fallback: (i) => i.editReply({ embeds: [ui.err('Unknown subcommand', 'Please use a valid achievements operation.')] })
        });
    },

    async handleView(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.settings) userData.settings = {};
        
        const userAchievements = userData.achievements || [];
        const totalAchievements = constants.ACHIEVEMENTS?.length || 0;
        const completionRate = totalAchievements > 0 ? (userAchievements.length / totalAchievements * 100).toFixed(1) : '0.0';
        
        const recentAchievements = userAchievements.slice(-3);
        const nextTargets = constants.ACHIEVEMENTS?.filter(a => !userAchievements.includes(a.id)).slice(0, 3) || [];
        
        let achievementText = `Unlocked: ${userAchievements.length}/${totalAchievements} (${completionRate}%)\n\n`;
        
        if (recentAchievements.length > 0) {
            achievementText += '**Recent:**\n';
            recentAchievements.forEach(id => {
                const achievement = constants.ACHIEVEMENTS?.find(a => a.id === id);
                if (achievement) {
                    achievementText += `${achievement.icon} ${achievement.name}\n`;
                }
            });
            achievementText += '\n';
        }
        
        if (nextTargets.length > 0) {
            achievementText += '**Next Targets:**\n';
            nextTargets.forEach(achievement => {
                achievementText += `${achievement.icon} ${achievement.name}\n`;
            });
        }
        
        const embed = ui.info('Achievement Progress', achievementText);
        await interaction.editReply({ embeds: [embed] });
    },

    async handleClaim(interaction) {
        const embed = ui.info('Claim rewards', 'No unclaimed achievements available.');
        await interaction.editReply({ embeds: [embed] });
    },

    async handleProgress(interaction) {
        const embed = ui.info('Progress tracking', 'Achievement progress tracking coming soon.');
        await interaction.editReply({ embeds: [embed] });
    },

    async handleLeaderboard(interaction) {
        const embed = ui.info('Achievement leaderboard', 'Leaderboard feature coming soon.');
        await interaction.editReply({ embeds: [embed] });
    }
};
