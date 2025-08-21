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
        
        if (isOwnWallet) {
            userData.stats = userData.stats || {};
            userData.stats.walletChecked = (userData.stats.walletChecked || 0) + 1;
            await user.save(userData);
        }
        
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
        const isWealthyUser = userData.vexBalance >= 1000;
        const isRisingStar = userData.vexBalance >= 100 && userData.vexBalance < 1000;
        const recentGrowth = this.calculateRecentGrowth ? this.calculateRecentGrowth(userData) : 0;
        const wealthRank = this.getWealthRank ? this.getWealthRank(userData.vexBalance) : Math.floor(Math.random() * 20) + 1;
        
        let title = `${constants.EMOJIS.WALLET} ${isOwnWallet ? 'Your' : targetUser.username + "'s"} VEX Wallet`;
        let description = `💸 **USD-Pegged VEX Token Balance**\n🔥 1 VEX = $${Economics.getCurrentVEXPrice().toFixed(4)} USD - Real money, real power!`;
        
        if (isOwnWallet) {
            if (isWealthyUser) {
                title = `💎 YOUR WALLET EMPIRE!`;
                description = `🔥 **You're in the TOP ${wealthRank}%!** Your wallet holds **${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})**!\n💸 **1 VEX = $${Economics.getCurrentVEXPrice().toFixed(4)} USD** - Real money, real power!`;
            } else if (isRisingStar) {
                title = `🚀 RISING WALLET STAR!`;
                description = `✨ **You're building something AMAZING!** ${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)}) and climbing!\n🔥 **Next milestone: 1,000 VEX (~$${(1000 * Economics.getCurrentVEXPrice()).toFixed(2)})** for Wallet Elite status!`;
            } else {
                title = `🌟 YOUR GROWING WALLET!`;
                description = `✨ **Every legend starts somewhere!** You're at ${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})!\n🚀 **Next goal: 100 VEX (~$${(100 * Economics.getCurrentVEXPrice()).toFixed(2)})** for Rising Star status!`;
            }
            
            if (recentGrowth > 0) {
                description += `\n📈 **+${recentGrowth.toFixed(2)} VEX (~$${(recentGrowth * Economics.getCurrentVEXPrice()).toFixed(2)}) growth** in recent activity!`;
            }
        } else {
            if (isWealthyUser) {
                title = `👑 ${targetUser.username}'s WALLET EMPIRE`;
                description = `✨ **This player is in the TOP ${wealthRank}%!** Wallet balance: ${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})\n🏆 **Wallet Elite Status** - A true VexiumVerse legend!`;
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
        
        const xpNeeded = user.getXPForLevel(userData.level + 1);
        
        const walletEmbed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .addFields(
                { 
                    name: `💼 Wallet Balance`, 
                    value: `${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})`, 
                    inline: true 
                },
                { 
                    name: `📊 Level Progress`, 
                    value: `Level ${userData.level} (${userData.xp}/${xpNeeded} XP)`, 
                    inline: true 
                },
                { 
                    name: `🎯 Net Worth Rank`, 
                    value: `#${Math.floor(Math.random() * 1000) + 1} globally`, 
                    inline: true 
                },
                { 
                    name: `⚡ Daily Streak`, 
                    value: `${userData.dailyStreak || 0} days`, 
                    inline: true 
                },
                { 
                    name: `🏆 Total Commands`, 
                    value: `${userData.stats?.commandsUsed || 0} used`, 
                    inline: true 
                },
                { 
                    name: `💎 VEX Price`, 
                    value: `$${Economics.getCurrentVEXPrice().toFixed(4)} USD`, 
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
        
        const walletProgress = Math.min(userData.vexBalance / 50000, 1);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Wallet Progress: ${userData.vexBalance.toFixed(0)} VEX`,
            walletProgress,
            isWealthyUser ? constants.COLORS.VEX : isRisingStar ? constants.COLORS.SUCCESS : constants.COLORS.PRIMARY
        );
        
        walletEmbed.setImage('attachment://progress.png');
        
        await interaction.reply({ 
            embeds: [walletEmbed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
        
        if (isOwnWallet) {
            userData.stats.commandsUsed = (userData.stats.commandsUsed || 0) + 1;
            userData.stats.walletChecked = (userData.stats.walletChecked || 0) + 1;
            await user.save(userData);
        }
    },

    calculateRecentGrowth(userData) {
        const recentTransactions = userData.transactions?.slice(-10) || [];
        const recentEarnings = recentTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        return recentEarnings * 0.1;
    },

    getWealthRank(balance) {
        if (balance >= 100000) return Math.floor(Math.random() * 5) + 1;
        if (balance >= 50000) return Math.floor(Math.random() * 10) + 5;
        if (balance >= 10000) return Math.floor(Math.random() * 15) + 15;
        return Math.floor(Math.random() * 70) + 30;
    }
};
