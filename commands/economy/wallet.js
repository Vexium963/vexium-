const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wallet')
        .setDescription('Check your VEX wallet balance and statistics')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Check another user\'s wallet (if public)')
                .setRequired(false)),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const isOwnWallet = targetUser.id === interaction.user.id;
        
        const user = new User(targetUser.id);
        const userData = await user.load();
        
        if (!isOwnWallet && userData.settings.privacy === 'private') {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Private Wallet`)
                .setDescription(`${targetUser.username}'s wallet is set to private.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const walletEmbed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.WALLET} ${isOwnWallet ? 'Your' : targetUser.username + "'s"} VEX Wallet`)
            .setDescription(`**USD-Pegged VEX Token Balance**\n1 VEX = $1.00 USD`)
            .addFields(
                { 
                    name: `${constants.EMOJIS.VEX} VEX Balance`, 
                    value: `$${userData.vexBalance.toFixed(2)}`, 
                    inline: true 
                },
                { 
                    name: `${constants.EMOJIS.BANK} Bank Balance`, 
                    value: `$${userData.bankBalance.toFixed(2)}`, 
                    inline: true 
                },
                { 
                    name: `${constants.EMOJIS.DIAMOND} Net Worth`, 
                    value: `$${userData.networth.toFixed(2)}`, 
                    inline: true 
                },
                { 
                    name: `${constants.EMOJIS.CHART} Level`, 
                    value: `${userData.level} (${userData.xp} XP)`, 
                    inline: true 
                },
                { 
                    name: `${constants.EMOJIS.FIRE} Daily Streak`, 
                    value: `${userData.dailyStreak} days`, 
                    inline: true 
                },
                { 
                    name: `${constants.EMOJIS.WORK} Current Job`, 
                    value: userData.job ? `${userData.job} (Lv.${userData.jobLevel})` : 'None', 
                    inline: true 
                }
            )
            .setColor(constants.COLORS.VEX)
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();
        
        if (userData.premiumTier) {
            const tier = constants.PREMIUM_TIERS[userData.premiumTier.toUpperCase()];
            walletEmbed.addFields({
                name: `${constants.EMOJIS.PREMIUM} Premium Status`,
                value: `${tier.badge} ${tier.name}`,
                inline: true
            });
        }
        
        if (isOwnWallet) {
            walletEmbed.addFields(
                { 
                    name: `${constants.EMOJIS.MONEY} Lifetime Earned`, 
                    value: `$${userData.stats.totalEarned.toFixed(2)}`, 
                    inline: true 
                },
                { 
                    name: `${constants.EMOJIS.TAX} Taxes Paid`, 
                    value: `$${userData.stats.totalTaxesPaid.toFixed(2)}`, 
                    inline: true 
                },
                { 
                    name: `${constants.EMOJIS.BURN} Total Burned`, 
                    value: `$${userData.stats.totalBurned.toFixed(2)}`, 
                    inline: true 
                }
            );
            
            if (userData.linkedWallets && Object.keys(userData.linkedWallets).length > 0) {
                const linkedWallets = Object.keys(userData.linkedWallets).join(', ');
                walletEmbed.addFields({
                    name: '🔗 Linked Wallets',
                    value: linkedWallets,
                    inline: false
                });
            }
            
            const nextLevelXP = user.getXPForLevel(userData.level + 1);
            const xpProgress = Math.floor((userData.xp / nextLevelXP) * 100);
            
            walletEmbed.addFields({
                name: '📈 Level Progress',
                value: `${userData.xp}/${nextLevelXP} XP (${xpProgress}%)`,
                inline: false
            });
        }
        
        if (userData.achievements.length > 0) {
            walletEmbed.addFields({
                name: `${constants.EMOJIS.ACHIEVEMENT} Achievements`,
                value: `${userData.achievements.length}/${constants.ACHIEVEMENTS.length} unlocked`,
                inline: true
            });
        }
        
        walletEmbed.setFooter({ 
            text: isOwnWallet ? 
                'Use /daily, /work, /invest to earn more VEX!' : 
                `Wallet viewed by ${interaction.user.username}` 
        });
        
        await interaction.reply({ embeds: [walletEmbed] });
        
        if (isOwnWallet) {
            userData.stats.commandsUsed++;
            await user.save(userData);
        }
    },
};
