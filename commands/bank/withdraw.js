const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('withdraw')
        .setDescription(`💸 Withdraw VEX tokens from your bank account - Instant access to your wealth!`)
        .addNumberOption(option =>
            option.setName('amount')
                .setDescription('Amount of VEX to withdraw')
                .setRequired(true)
                .setMinValue(0.01))
        .addBooleanOption(option =>
            option.setName('force')
                .setDescription(`🔥 Force withdraw locked deposits (with penalty) - Emergency access available!`)
                .setRequired(false)),
    
    cooldown: 30,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'withdraw', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                financialDecision: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'withdraw',
                behaviorContext
            );
        }
        
        const amount = interaction.options.getNumber('amount');
        const force = interaction.options.getBoolean('force') || false;
        
        if (amount > userData.bankBalance) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Bank Funds`)
                .setDescription(`⏳ You only have $${userData.bankBalance.toFixed(2)} VEX in your bank account.\n\n${fomoMessage}\n\n✨ **Quick Fix:** Use \`/work\` or \`/daily\` to earn more VEX instantly!\n📈 **${Math.floor(Math.random() * 30) + 15} players** are earning VEX right now!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const now = Date.now();
        const lastWithdraw = userData.lastWithdraw ? new Date(userData.lastWithdraw).getTime() : 0;
        const timeSinceLastWithdraw = now - lastWithdraw;
        
        if (timeSinceLastWithdraw < constants.COOLDOWNS.WITHDRAW) {
            const timeLeft = constants.COOLDOWNS.WITHDRAW - timeSinceLastWithdraw;
            const minutesLeft = Math.floor(timeLeft / (60 * 1000));
            const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 20);
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.COOLDOWN} Withdrawal Cooldown`)
                .setDescription(`⏳ You can withdraw again in **${minutesLeft} minutes**.\n\n${socialProofMessage}\n\n✨ **Pro Tip:** Use this time to earn more with \`/work\` or \`/invest\`!\n🔥 **Limited time:** 2x work bonuses active for ${Math.floor(Math.random() * 3) + 1} more hours!`)
                .setColor(constants.COLORS.WARNING);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        let availableAmount = 0;
        let lockedAmount = 0;
        let earlyWithdrawalPenalty = 0;
        
        if (userData.bankDeposits) {
            for (const deposit of userData.bankDeposits) {
                if (deposit.locked && deposit.unlockDate && new Date(deposit.unlockDate) > new Date()) {
                    lockedAmount += deposit.amount;
                    if (force) {
                        earlyWithdrawalPenalty += deposit.amount * 0.10;
                    }
                } else {
                    availableAmount += deposit.amount;
                }
            }
        } else {
            availableAmount = userData.bankBalance;
        }
        
        if (amount > availableAmount && !force) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.WARNING} Funds Locked`)
                .setDescription(`⏳ Only $${availableAmount.toFixed(2)} VEX is available for withdrawal.\n🔥 $${lockedAmount.toFixe...`)
                .addFields(
                    { name: '💡 Options', value: 'Use `force: true` to withdraw locked funds with 10% penalty', inline: false }
                )
                .setColor(constants.COLORS.WARNING);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (amount > availableAmount + lockedAmount) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`⏳ You don't have enough funds in your bank account.\n\n✨ **Build your wealth:** Start with \`/daily\` and \`/work\` commands!\n📈 **${Math.floor(Math.random() * 20) + 10} players** just earned their first $100 VEX today!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const taxResult = user.calculateTax(userData, amount, 'withdrawal');
        const totalCost = amount + taxResult.taxAmount + earlyWithdrawalPenalty;
        
        if (totalCost > userData.bankBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds for Fees`)
                .setDescription(`${constants.ANIMATED_EMOJIS.LOADING} Total cost including taxes and penalties: $${totalCost.toFix...`)
                .addFields(
                    { name: '💰 Withdrawal', value: `$${amount.toFixed(2)}`, inline: true },
                    { name: '💸 Tax', value: `$${taxResult.taxAmount.toFixed(2)}`, inline: true },
                    { name: '⚠️ Penalty', value: `$${earlyWithdrawalPenalty.toFixed(2)}`, inline: true }
                )
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        userData.bankBalance -= totalCost;
        userData.vexBalance += amount;
        userData.lastWithdraw = new Date().toISOString();
        userData.stats.totalWithdrawn += amount;
        userData.stats.totalTaxesPaid += taxResult.taxAmount;
        userData.stats.withdrawalCount++;
        userData.stats.commandsUsed++;
        
        if (taxResult.taxAmount > 0) {
            await user.addToTreasury(taxResult.taxAmount, 'withdrawal_tax');
            user.logTax(userData, taxResult.taxAmount, 'withdrawal');
        }
        
        if (earlyWithdrawalPenalty > 0) {
            await user.addToTreasury(earlyWithdrawalPenalty, 'early_withdrawal_penalty');
            user.logBurn(userData, earlyWithdrawalPenalty, 'early_withdrawal');
        }
        
        if (userData.bankDeposits) {
            let remainingAmount = totalCost;
            userData.bankDeposits = userData.bankDeposits.filter(deposit => {
                if (remainingAmount <= 0) return true;
                
                if (deposit.amount <= remainingAmount) {
                    remainingAmount -= deposit.amount;
                    return false;
                } else {
                    deposit.amount -= remainingAmount;
                    remainingAmount = 0;
                    return true;
                }
            });
        }
        
        user.logTransaction(userData, 'withdrawal', amount, 'bank_withdrawal', taxResult.taxAmount);
        
        await user.save(userData);
        
        const withdrawalCount = userData.stats.withdrawalCount || 0;
        const isFrequentUser = withdrawalCount >= 10;
        const isNewUser = withdrawalCount <= 3;
        const surpriseBonus = Math.random() < 0.1 ? Math.floor(amount * 0.02) : 0;
        const socialProof = Math.random() < 0.3;
        
        let title = `${constants.EMOJIS.SUCCESS} Withdrawal Successful!`;
        let description = `💰 **$${amount.toFixed(2)} VEX** successfully moved to your wallet!`;
        
        if (isFrequentUser) {
            title = `🏆 VIP WITHDRAWAL COMPLETE!`;
            description = `💎 **Expert Trader Alert!** $${amount.toFixed(2)} VEX withdrawn!\n👑 **${withdrawalCount} withdrawals completed** - You're a financial master!`;
        } else if (isNewUser) {
            description += `\n🌟 **Building your financial empire!** (${withdrawalCount}/10 withdrawals)`;
        }
        
        if (surpriseBonus > 0) {
            await user.addVEX(surpriseBonus, 'withdrawal_loyalty_bonus');
            description += `\n✨ **LOYALTY BONUS: +$${surpriseBonus} VEX!** Thanks for being awesome!`;
        }
        
        if (socialProof) {
            const activeWithdrawers = Math.floor(Math.random() * 25) + 10;
            description += `\n📊 **${activeWithdrawers} players are managing their wealth right now!**`;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`${constants.ANIMATED_EMOJIS.CELEBRATION} ${description}\n\n${constants.ANIMATED_EMOJIS.CHART} **W...`)
            .addFields(
                { name: '💰 Withdrawn Amount', value: `$${amount.toFixed(2)} VEX`, inline: true },
                { name: '💸 Tax Paid', value: `$${taxResult.taxAmount.toFixed(2)} VEX`, inline: true },
                { name: '📊 Tax Rate', value: `${(taxResult.effectiveRate * 100).toFixed(2)}%`, inline: true },
                { name: '💼 New Wallet Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '🏦 Remaining Bank Balance', value: `$${userData.bankBalance.toFixed(2)} VEX`, inline: true },
                { name: '📈 Withdrawal Stats', value: `🤝 **${withdrawalCount}** completed\n🏅 **${isFrequentUser ? 'Expert' : isNewUser ? 'Beginner' : 'Experienced'}** trader`, inline: true }
            )
            .setColor(isFrequentUser ? constants.COLORS.VEX : constants.COLORS.SUCCESS)
            .setTimestamp();
        
        if (earlyWithdrawalPenalty > 0) {
            embed.addFields({
                name: '⚠️ Early Withdrawal Penalty',
                value: `$${earlyWithdrawalPenalty.toFixed(2)} VEX (10%)`,
                inline: true
            });
        }
        
        if (userData.premiumTier) {
            const tier = constants.PREMIUM_TIERS[userData.premiumTier.toUpperCase()];
            embed.addFields({
                name: `${constants.EMOJIS.PREMIUM} Premium Benefit`,
                value: `Tax reduced by ${(tier.benefits.withdrawalTaxReduction * 100).toFixed(1)}%`,
                inline: false
            });
        }
        
        embed.setFooter({ text: 'Taxes support the VexiumVerse treasury and ecosystem' });
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const withdrawalProgress = Math.min(withdrawalCount / 50, 1);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Withdrawal Experience: ${withdrawalCount}/50`,
            withdrawalProgress,
            constants.COLORS.SUCCESS
        );
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    }
};
