const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bank')
        .setDescription(`💸 Master your financial empire - Track wealth, earn interest, dominate leaderboards!`),
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'bank', true);
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
                'bank',
                behaviorContext
            );
        }
        
        const totalWealth = userData.bankBalance + userData.vexBalance;
        const isWealthy = totalWealth >= 10000;
        const isMillionaire = totalWealth >= 100000;
        const savingsRate = userData.bankBalance / Math.max(totalWealth, 1);
        const isSmartSaver = savingsRate >= 0.5;
        
        const bankingCommand = require('../economy/banking');
        const creditScore = bankingCommand.calculateCreditScore(userData);
        const creditRating = bankingCommand.getCreditRating(creditScore);
        const maxLoanAmount = bankingCommand.getMaxLoanAmount(creditScore, userData);
        const currentLoans = userData.loans || [];
        const totalLoanAmount = currentLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
        const availableWithdrawAmount = userData.bankBalance; // Full amount available without penalty for no-lock deposits
        
        const bankChecks = userData.stats.bankChecks || 0;
        const isObsessiveTracker = bankChecks >= 50;
        const recentGrowth = this.calculateRecentGrowth(userData);
        const surpriseBonus = Math.random() < 0.1 ? Math.floor(totalWealth * 0.001) : 0;
        
        const wealthGrowth = userData.stats.wealthGrowthRate || 0;
        const nextMilestone = Math.ceil(totalWealth / 10000) * 10000;
        const progressToMilestone = (totalWealth / nextMilestone) * 100;
        
        let title = `${constants.EMOJIS.BANK} Your Financial Empire`;
        let description = '💰 **Complete overview of your VexiumVerse wealth**';
        
        if (isMillionaire) {
            title = `👑 MILLIONAIRE STATUS! Your Empire`;
            description = '💎 **LEGENDARY WEALTH!** You\'ve achieved millionaire status!\n🏆 **You\'re in the top 0.1% of all players!**\n🔥 **Other players are watching your success!**';
        } else if (isWealthy) {
            title = `💎 WEALTH MASTER! Your Empire`;
            description = '🚀 **IMPRESSIVE PORTFOLIO!** You\'re building serious wealth!\n⭐ **Keep climbing to millionaire status!**\n📈 **You\'re outperforming 95% of players!**';
        }
        
        if (isSmartSaver) {
            description += `\n🧠 **SMART SAVER DETECTED!** ${(savingsRate * 100).toFixed(0)}% savings rate!`;
        }
        
        if (isObsessiveTracker) {
            description += `\n📊 **WEALTH TRACKER MASTER!** ${bankChecks} bank checks - you\'re obsessed with growth!`;
        }
        
        if (recentGrowth > 0) {
            description += `\n📈 **MOMENTUM BUILDING!** +${recentGrowth.toFixed(1)}% wealth growth this week!`;
        }
        
        if (surpriseBonus > 0) {
            description += `\n✨ **SURPRISE INSPECTION BONUS: +${surpriseBonus} VEX (~$${(surpriseBonus * Economics.getCurrentVEXPrice()).toFixed(2)})!** Lucky you!`;
            await user.addVEX(surpriseBonus, 'bank_inspection_bonus');
            Economics.updateVEXMarket('reward', surpriseBonus);
        }
        
        const activeInvestors = Math.floor(Math.random() * 200) + 50;
        description += `\n🌐 **${activeInvestors} players are managing wealth right now!**`;
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 75) + 25);
        const variableReward = Math.random() < 0.15 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        
        if (isMillionaire || isWealthy) {
            const milestoneMessage = constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)];
            description += `\n${milestoneMessage}`;
        }
        
        if (variableReward) {
            description += `\n${variableReward}`;
        }
        
        description += `\n${fomoMessage}\n${socialProofMessage}`;
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`✨ ${description} 📈`)
            .addFields(
                { name: '🏦 Bank Vault', value: `${userData.bankBalance.toFixed(2)} VEX (~$${(userData.bankBalance * Economics.getCurrentVEXPrice()).toFixed(2)}) ${userData.bankBalance >= 50000 ? '🐋' : userData.bankBalance >= 10000 ? '🦈' : '🐟'}`, inline: true },
                { name: '💼 Active Wallet', value: `${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '💎 Total Empire', value: `${totalWealth.toFixed(2)} VEX (~$${(totalWealth * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '💳 Credit Score', value: `${creditScore}/850 (${creditRating})`, inline: true },
                { name: '💰 Max Loan Amount', value: `${maxLoanAmount.toFixed(2)} VEX (~$${(maxLoanAmount * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '📊 Current Loans', value: `${totalLoanAmount.toFixed(2)} VEX owed`, inline: true },
                { name: '🔓 Available Withdrawal', value: `${availableWithdrawAmount.toFixed(2)} VEX (no penalty)`, inline: true }
            )
            .setColor(isMillionaire ? constants.COLORS.VEX : isWealthy ? constants.COLORS.SUCCESS : constants.COLORS.PRIMARY)
            .setTimestamp();
        
        if (userData.bankDeposits && userData.bankDeposits.length > 0) {
            let totalLocked = 0;
            let totalUnlocked = 0;
            let totalDailyInterest = 0;
            const activeDeposits = [];
            
            for (const deposit of userData.bankDeposits) {
                const isLocked = deposit.locked && deposit.unlockDate && new Date(deposit.unlockDate) > new Date();
                const dailyInterest = deposit.amount * deposit.interestRate;
                
                if (isLocked) {
                    totalLocked += deposit.amount;
                } else {
                    totalUnlocked += deposit.amount;
                }
                
                totalDailyInterest += dailyInterest;
                
                if (activeDeposits.length < 5) {
                    const unlockText = isLocked ? 
                        `🔒 Locked until <t:${Math.floor(new Date(deposit.unlockDate).getTime() / 1000)}:d>` : 
                        '🔓 Available';
                    
                    activeDeposits.push(
                        `**${deposit.termName}**: $${deposit.amount.toFixed(2)} (${(deposit.interestRate * 100).toFixed(3)}% daily)\n${unlockText}`
                    );
                }
            }
            
            embed.addFields(
                { name: '🔓 Available Funds', value: `${totalUnlocked.toFixed(2)} VEX (~$${(totalUnlocked * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '🔒 Locked Funds', value: `${totalLocked.toFixed(2)} VEX (~$${(totalLocked * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '💵 Daily Interest', value: `${totalDailyInterest.toFixed(4)} VEX (~$${(totalDailyInterest * Economics.getCurrentVEXPrice()).toFixed(4)})`, inline: true }
            );
            
            if (activeDeposits.length > 0) {
                embed.addFields({
                    name: '📋 Active Deposits',
                    value: activeDeposits.join('\n\n'),
                    inline: false
                });
            }
            
            const yearlyProjection = totalDailyInterest * 365;
            embed.addFields({
                name: '📈 Yearly Interest Projection',
                value: `${yearlyProjection.toFixed(2)} VEX (~$${(yearlyProjection * Economics.getCurrentVEXPrice()).toFixed(2)})`,
                inline: true
            });
        } else {
            embed.addFields({
                name: '📋 Deposits',
                value: 'No active deposits. Use `/deposit` to start earning interest!',
                inline: false
            });
        }
        
        if (userData.premiumTier) {
            const tier = constants.PREMIUM_TIERS[userData.premiumTier.toUpperCase()];
            embed.addFields({
                name: `${constants.EMOJIS.PREMIUM} Premium Benefits`,
                value: `${tier.badge} ${tier.name}\n+${(constants.BANK_INTEREST_RATES.PREMIUM_BONUS * 100).toFixed(3)}% bonus interest`,
                inline: true
            });
        }
        
        const interestRates = [
            `**No Lock**: ${(constants.BANK_INTEREST_RATES.DAILY * 100).toFixed(3)}% daily`,
            `**1 Week**: ${(constants.BANK_INTEREST_RATES.WEEKLY * 100).toFixed(3)}% daily`,
            `**1 Month**: ${(constants.BANK_INTEREST_RATES.MONTHLY * 100).toFixed(3)}% daily`,
            `**1 Year**: ${(constants.BANK_INTEREST_RATES.YEARLY * 100).toFixed(3)}% daily`
        ];
        
        embed.addFields({
            name: '📊 Interest Rates',
            value: interestRates.join('\n'),
            inline: false
        });
        
        embed.setFooter({ text: 'Interest is calculated and paid daily at midnight UTC' });
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const wealthProgress = Math.min(totalWealth / 100000, 1);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Wealth Progress: ${totalWealth.toFixed(0)} VEX`,
            wealthProgress,
            isMillionaire ? constants.COLORS.VEX : isWealthy ? constants.COLORS.SUCCESS : constants.COLORS.PRIMARY
        );
        
        embed.setImage('attachment://progress.png');
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
        
        userData.stats.commandsUsed++;
        await user.save(userData);
    }
};
