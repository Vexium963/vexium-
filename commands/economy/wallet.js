const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wallet')
        .setDescription(`💸 Check your VEX wallet balance and statistics - Track your growing empire!`)
        .addUserOption(option =>
            option.setName('user')
                .setDescription(`✨ Check another user's wallet (if public) - Get inspired by their success!`)
                .setRequired(false)),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const isOwnWallet = targetUser.id === interaction.user.id;
        
        const user = new User(targetUser.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'wallet', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                wealthTracking: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'wallet',
                behaviorContext
            );
        }
        
        if (!isOwnWallet && userData.settings.privacy === 'private') {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Private Wallet`)
                .setDescription(`⏳ ${targetUser.username}'s wallet is set to private.\n\n${fomoMessage}\n\n✨ **Tip:** Make your wa...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const walletViews = userData.stats.walletViews || 0;
        const isWealthyUser = userData.networth >= 1000;
        const isRisingStar = userData.networth >= 100 && userData.networth < 1000;
        const recentGrowth = this.calculateRecentGrowth(userData);
        const wealthRank = this.getWealthRank(userData.networth);
        
        let title = `${constants.EMOJIS.WALLET} ${isOwnWallet ? 'Your' : targetUser.username + "'s"} VEX Wallet`;
        let description = `💸 **USD-Pegged VEX Token Balance**\n🔥 1 VEX = $${Economics.getCurrentVEXPrice().toFixed(4)} USD - Real money, real power!`;
        
        if (isOwnWallet) {
            if (isWealthyUser) {
                title = `💎 YOUR WEALTH EMPIRE!`;
                description = `🔥 **You're in the TOP ${wealthRank}%!** Your empire is worth **${userData.networth.toFixed(2)} VEX (~$${(userData.networth * Economics.getCurrentVEXPrice()).toFixed(2)})**!\n💸 **1 VEX = $${Economics.getCurrentVEXPrice().toFixed(4)} USD** - Real money, real power!`;
            } else if (isRisingStar) {
                title = `🚀 RISING WEALTH STAR!`;
                description = `✨ **You're building something AMAZING!** ${userData.networth.toFixed(2)} VEX (~$${(userData.networth * Economics.getCurrentVEXPrice()).toFixed(2)}) and climbing!\n🔥 **Next milestone: 1,000 VEX (~$${(1000 * Economics.getCurrentVEXPrice()).toFixed(2)})** for Wealth Elite status!`;
            } else {
                title = `🌟 YOUR GROWING EMPIRE!`;
                description = `✨ **Every legend starts somewhere!** You're at ${userData.networth.toFixed(2)} VEX (~$${(userData.networth * Economics.getCurrentVEXPrice()).toFixed(2)})!\n🚀 **Next goal: 100 VEX (~$${(100 * Economics.getCurrentVEXPrice()).toFixed(2)})** for Rising Star status!`;
            }
            
            if (recentGrowth > 0) {
                description += `\n📈 **+${recentGrowth.toFixed(2)} VEX (~$${(recentGrowth * Economics.getCurrentVEXPrice()).toFixed(2)}) growth** in recent activity!`;
            }
        } else {
            if (isWealthyUser) {
                title = `👑 ${targetUser.username}'s WEALTH EMPIRE`;
                description = `✨ **This player is in the TOP ${wealthRank}%!** Net worth: ${userData.networth.toFixed(2)} VEX (~$${(userData.networth * Economics.getCurrentVEXPrice()).toFixed(2)})\n🏆 **Wealth Elite Status** - A true VexiumVerse legend!`;
            }
        }
        
        const activeUsers = Math.floor(Math.random() * 200) + 50;
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', activeUsers);
        const variableReward = Math.random() < 0.15 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        const milestoneMessage = isWealthyUser ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        
        if (Math.random() < 0.4) {
            description += `\n${socialProofMessage}`;
        }
        
        if (variableReward && isOwnWallet) {
            description += `\n${variableReward}`;
        }
        
        if (milestoneMessage && isOwnWallet) {
            description += `\n${milestoneMessage}`;
        }
        
        const walletEmbed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .addFields(
                { 
                    name: `${constants.EMOJIS.VEX} VEX Balance`, 
                    value: `${userData.vexBalance.toFixed(2)} VEX`, 
                    inline: true 
                },
                { 
                    name: `${constants.EMOJIS.BANK} Bank Balance`, 
                    value: `${userData.bankBalance.toFixed(2)} VEX`, 
                    inline: true 
                },
                { 
                    name: `${constants.EMOJIS.DIAMOND} Net Worth`, 
                    value: `${userData.networth.toFixed(2)} VEX`, 
                    inline: true 
                },
                { 
                    name: `${constants.EMOJIS.CHART} Level`, 
                    value: `${userData.level} (${userData.xp} XP)`, 
                    inline: true 
                },
                { 
                    name: `🔥 Daily Streak`, 
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
                    value: `${userData.stats.totalEarned.toFixed(2)} VEX`, 
                    inline: true 
                },
                { 
                    name: `${constants.EMOJIS.TAX} Taxes Paid`, 
                    value: `${userData.stats.totalTaxesPaid.toFixed(2)} VEX`, 
                    inline: true 
                },
                { 
                    name: `${constants.EMOJIS.BURN} Total Burned`, 
                    value: `${userData.stats.totalBurned.toFixed(2)} VEX`, 
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
                name: `${constants.ANIMATED_EMOJIS.ACHIEVEMENT} Achievements`,
                value: `${userData.achievements.length}/${constants.ACHIEVEMENTS.length} unlocked`,
                inline: true
            });
        }
        
        walletEmbed.setFooter({ 
            text: isOwnWallet ? 
                'Use /daily, /work, /invest to earn more VEX!' : 
                `Wallet viewed by ${interaction.user.username}` 
        });
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        
        const nextLevelXP = user.getXPForLevel(userData.level + 1);
        const xpProgress = userData.xp / nextLevelXP;
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Level ${userData.level} Progress`,
            xpProgress,
            constants.COLORS.VEX
        );
        
        walletEmbed.setImage('attachment://progress.png');
        
        await interaction.reply({ 
            embeds: [walletEmbed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
        
        if (isOwnWallet) {
            userData.stats.commandsUsed++;
            await user.save(userData);
        }
    },
};
