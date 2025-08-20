const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('achievements')
        .setDescription('View your achievements and progress')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('View another user\'s achievements')
                .setRequired(false)),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const isOwnAchievements = targetUser.id === interaction.user.id;
        
        const user = new User(targetUser.id);
        const userData = await user.load();
        
        if (!isOwnAchievements && userData.settings.privacy === 'private') {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Private Profile`)
                .setDescription(`${targetUser.username}'s achievements are private.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const unlockedAchievements = userData.achievements || [];
        const totalAchievements = constants.ACHIEVEMENTS.length;
        const completionRate = (unlockedAchievements.length / totalAchievements * 100).toFixed(1);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.TROPHY} ${isOwnAchievements ? 'Your' : targetUser.username + "'s"} Achievements`)
            .setDescription(`**${unlockedAchievements.length}/${totalAchievements}** achievements unlocked (${completionRate}%)`)
            .setColor(constants.COLORS.GOLD)
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
        
        await interaction.reply({ embeds: [embed] });
        
        if (isOwnAchievements) {
            userData.stats.commandsUsed++;
            await user.save(userData);
        }
    }
};
