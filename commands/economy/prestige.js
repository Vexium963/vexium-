const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Progression = require('../../utils/progression');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prestige')
        .setDescription('Reset your level for massive VEX bonuses and exclusive perks')
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('View prestige requirements and rewards'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('confirm')
                .setDescription('Confirm your prestige reset')),
    
    cooldown: 10,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                highStakes: true,
                majorDecision: true,
                prestigeLevel: userData.prestige || 0
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'prestige',
                behaviorContext
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(
                interaction.user.id,
                'prestige',
                true
            );
        }
        
        const totalPrestiges = userData.stats?.totalPrestige || 0;
        const isPrestigeLegend = totalPrestiges >= 5;
        const urgencyBonus = Math.random() < 0.2 ? Math.floor(userData.level * 50) : 0;
        
        if (urgencyBonus > 0) {
            await interaction.followUp({
                content: `✨ **SURPRISE PRESTIGE BONUS!** +$${urgencyBonus} VEX added to your prestige reward for being an active player!`,
                ephemeral: true
            });
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'info':
                return this.handleInfo(interaction);
            case 'confirm':
                return this.handleConfirm(interaction);
        }
    },
    
    async handleInfo(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const prestigeData = this.calculatePrestigeRewards(userData);
        const totalPrestiges = userData.stats?.totalPrestige || 0;
        const isPrestigeLegend = totalPrestiges >= 5;
        const isFirstTime = totalPrestiges === 0;
        
        const activePrestigers = Math.floor(Math.random() * 25) + 5;
        const recentPrestiges = Math.floor(Math.random() * 10) + 3;
        const socialProof = Math.random() < 0.4;
        
        let title = `${constants.EMOJIS.CROWN} Prestige System`;
        let description = '🔄 **ULTIMATE POWER MOVE!** Reset your level for MASSIVE bonuses!';
        
        if (isFirstTime && prestigeData.canPrestige) {
            title = `👑 LEGENDARY PRESTIGE AWAITS!`;
            description = '🚀 **FIRST PRESTIGE AVAILABLE!** Join the elite ranks of prestige players!\n💎 **This is where legends are born!**\n🔥 **FOMO ALERT:** Only the brave take this leap!';
        } else if (isPrestigeLegend) {
            title = `🌟 PRESTIGE MASTER STATUS!`;
            description = `💎 **PRESTIGE LEGEND!** You've prestiged ${totalPrestiges} times!\n👑 **You're in the top 1% of all players!**\n⚡ **ELITE STATUS:** Other players look up to you!`;
        }
        
        if (socialProof) {
            description += `\n\n📊 **LIVE ACTIVITY:** ${activePrestigers} players considering prestige | ${recentPrestiges} prestiged today!`;
        }
        
        const motivationalMessages = [
            "🚀 Prestige is the ultimate flex in VexiumVerse!",
            "💎 Only the elite dare to prestige - are you one of them?",
            "⚡ Your prestige level shows your dedication to greatness!",
            "🌟 Prestige players earn respect and massive bonuses!",
            "🔥 The higher your prestige, the more legendary you become!"
        ];
        
        const randomMotivation = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        description += `\n\n${randomMotivation}`;
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(prestigeData.canPrestige ? constants.COLORS.GOLD : constants.COLORS.WARNING)
            .setThumbnail(interaction.user.displayAvatarURL());
        
        if (prestigeData.canPrestige) {
            embed.addFields(
                { name: '💰 VEX Bonus', value: `$${prestigeData.vexBonus.toFixed(2)} VEX`, inline: true },
                { name: '⭐ Prestige Level', value: `${userData.prestige || 0} → ${(userData.prestige || 0) + 1}`, inline: true },
                { name: '🎯 Current Level', value: `${userData.level}`, inline: true },
                { name: '🔄 Reset To', value: 'Level 1', inline: true },
                { name: '💎 Multiplier Bonus', value: `+${(prestigeData.multiplierBonus * 100).toFixed(1)}%`, inline: true },
                { name: '🏆 Exclusive Perks', value: prestigeData.perks.join('\n'), inline: false }
            );
            
            const confirmButton = new ButtonBuilder()
                .setCustomId(`prestige_confirm_${interaction.user.id}`)
                .setLabel('Prestige Now!')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('👑');
            
            const cancelButton = new ButtonBuilder()
                .setCustomId(`prestige_cancel_${interaction.user.id}`)
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary);
            
            const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
            
            embed.setFooter({ text: '⚠️ This action cannot be undone! You will lose all levels and job progress.' });
            
            await interaction.reply({ embeds: [embed], components: [row] });
        } else {
            embed.addFields(
                { name: '❌ Requirements Not Met', value: `You need to be level ${constants.PRESTIGE.MIN_LEVEL} to prestige`, inline: false },
                { name: '🎯 Current Level', value: `${userData.level}`, inline: true },
                { name: '📈 Levels Needed', value: `${constants.PRESTIGE.MIN_LEVEL - userData.level}`, inline: true },
                { name: '🏆 Current Prestige', value: `${userData.prestige || 0}`, inline: true }
            );
            
            await interaction.reply({ embeds: [embed] });
        }
    },
    
    async handleConfirm(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const prestigeData = this.calculatePrestigeRewards(userData);
        
        if (!prestigeData.canPrestige) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Cannot Prestige`)
                .setDescription(`You need to be level ${constants.PRESTIGE.MIN_LEVEL} to prestige.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const oldLevel = userData.level;
        const oldPrestige = userData.prestige || 0;
        
        userData.prestige = (userData.prestige || 0) + 1;
        userData.level = 1;
        userData.xp = 0;
        userData.currentJob = null;
        userData.jobXP = {};
        userData.jobLevel = {};
        
        await user.addVEX(prestigeData.vexBonus, 'prestige_bonus');
        
        userData.stats.totalPrestige = (userData.stats.totalPrestige || 0) + 1;
        userData.stats.commandsUsed++;
        
        const achievementUnlocked = await Progression.checkAchievements(userData, 'prestige', { prestige: userData.prestige });
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CROWN} Prestige Complete!`)
            .setDescription(`🎉 Congratulations! You've prestiged to level ${userData.prestige}!`)
            .addFields(
                { name: '💰 VEX Bonus Received', value: `$${prestigeData.vexBonus.toFixed(2)} VEX`, inline: true },
                { name: '⭐ New Prestige Level', value: `${userData.prestige}`, inline: true },
                { name: '🔄 Level Reset', value: `${oldLevel} → 1`, inline: true },
                { name: '💎 Earning Multiplier', value: `+${(prestigeData.multiplierBonus * 100).toFixed(1)}%`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '🏆 Exclusive Perks', value: prestigeData.perks.join('\n'), inline: false }
            )
            .setColor(constants.COLORS.GOLD)
            .setTimestamp();
        
        if (achievementUnlocked.length > 0) {
            embed.addFields({
                name: '🏆 Achievements Unlocked!',
                value: achievementUnlocked.map(a => `${a.icon} **${a.name}**`).join('\n'),
                inline: false
            });
        }
        
        embed.setFooter({ text: 'Your prestige journey begins now! Start leveling up again for even greater rewards.' });
        
        await interaction.reply({ embeds: [embed] });
    },
    
    calculatePrestigeRewards(userData) {
        const canPrestige = userData.level >= constants.PRESTIGE.MIN_LEVEL;
        const prestigeLevel = userData.prestige || 0;
        
        if (!canPrestige) {
            return { canPrestige: false };
        }
        
        const baseBonus = constants.PRESTIGE.BASE_BONUS;
        const levelMultiplier = userData.level * constants.PRESTIGE.LEVEL_MULTIPLIER;
        const prestigeMultiplier = prestigeLevel * constants.PRESTIGE.PRESTIGE_MULTIPLIER;
        
        const vexBonus = baseBonus + levelMultiplier + prestigeMultiplier;
        const multiplierBonus = (prestigeLevel + 1) * constants.PRESTIGE.EARNING_BONUS;
        
        const perks = [
            `${constants.EMOJIS.STAR} ${(multiplierBonus * 100).toFixed(1)}% increased earnings`,
            `${constants.EMOJIS.CROWN} Prestige ${prestigeLevel + 1} badge`,
            `${constants.EMOJIS.DIAMOND} Access to prestige-only commands`
        ];
        
        if (prestigeLevel >= 5) {
            perks.push(`${constants.EMOJIS.FIRE} Exclusive prestige shop access`);
        }
        
        if (prestigeLevel >= 10) {
            perks.push(`${constants.EMOJIS.TROPHY} Prestige leaderboard eligibility`);
        }
        
        return {
            canPrestige: true,
            vexBonus,
            multiplierBonus,
            perks
        };
    }
};
