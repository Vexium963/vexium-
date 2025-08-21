const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deposit')
        .setDescription(`💸 Deposit VEX tokens to earn compound interest - Build wealth while you sleep!`)
        .addNumberOption(option =>
            option.setName('amount')
                .setDescription('Amount of VEX to deposit')
                .setRequired(true)
                .setMinValue(0.01))
        .addStringOption(option =>
            option.setName('term')
                .setDescription(`🔥 Choose your deposit term for MASSIVE interest rates - Higher risk, higher rewards!`)
                .setRequired(false)
                .addChoices(
                    { name: 'No Lock (0.1% daily)', value: 'none' },
                    { name: '1 Week (0.5% daily)', value: 'weekly' },
                    { name: '1 Month (1.5% daily)', value: 'monthly' },
                    { name: '1 Year (6% daily)', value: 'yearly' }
                )),
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'deposit', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                wealthBuilding: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'deposit',
                behaviorContext
            );
        }
        
        const amount = interaction.options.getNumber('amount');
        const term = interaction.options.getString('term') || 'none';
        
        if (amount > userData.vexBalance) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`⏳ You need ${amount.toFixed(2)} VEX but only have ${userData.vexBalance.toFixed(2)} VEX.\n\n${fomoMessage}\n\n🚀 **Quick tip:** Use \`/work\` or \`/daily\` to earn more VEX!\n🔥 **FOMO Alert:** ${Math.floor(Math.random() * 50) + 20} players just made deposits in the last hour!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(amount, 'bank_deposit', false);
        if (!result.success) {
            const nearMissMessage = constants.NEAR_MISS_MESSAGES[Math.floor(Math.random() * constants.NEAR_MISS_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Deposit Failed`)
                .setDescription(`💥 ${result.reason}\n\n${nearMissMessage}\n\n✨ **Don't give up!** Every successful investor faces...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        userData.bankBalance += amount;
        
        let interestRate = constants.BANK_INTEREST_RATES.DAILY;
        let lockDuration = 0;
        let termName = 'No Lock';
        
        switch (term) {
            case 'weekly':
                interestRate = constants.BANK_INTEREST_RATES.WEEKLY;
                lockDuration = 7 * 24 * 60 * 60 * 1000;
                termName = '1 Week';
                break;
            case 'monthly':
                interestRate = constants.BANK_INTEREST_RATES.MONTHLY;
                lockDuration = 30 * 24 * 60 * 60 * 1000;
                termName = '1 Month';
                break;
            case 'yearly':
                interestRate = constants.BANK_INTEREST_RATES.YEARLY;
                lockDuration = 365 * 24 * 60 * 60 * 1000;
                termName = '1 Year';
                break;
        }
        
        if (userData.premiumTier) {
            interestRate += constants.BANK_INTEREST_RATES.PREMIUM_BONUS;
        }
        
        if (!userData.bankDeposits) {
            userData.bankDeposits = [];
        }
        
        const deposit = {
            id: this.generateDepositId(),
            amount: amount,
            interestRate: interestRate,
            term: term,
            termName: termName,
            depositDate: new Date().toISOString(),
            unlockDate: lockDuration > 0 ? new Date(Date.now() + lockDuration).toISOString() : null,
            locked: lockDuration > 0
        };
        
        userData.bankDeposits.push(deposit);
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const dailyInterest = amount * interestRate;
        const projectedYearly = dailyInterest * 365;
        
        const totalDeposits = userData.bankDeposits.length;
        const isSmartInvestor = totalDeposits >= 10;
        const isHighRoller = amount >= 1000;
        const surpriseBonus = Math.random() < 0.15 ? Math.floor(amount * 0.02) : 0;
        const compoundingPower = projectedYearly > amount ? ((projectedYearly / amount - 1) * 100).toFixed(0) : 0;
        
        if (surpriseBonus > 0) {
            await user.addVEX(surpriseBonus, 'deposit_surprise_bonus');
        }
        
        let title = `${constants.EMOJIS.BANK} WEALTH SECURED!`;
        let description = `💰 **${amount.toFixed(2)} VEX** locked and loaded for compound growth!`;
        
        if (isHighRoller) {
            title = `💎 HIGH-ROLLER DEPOSIT CONFIRMED!`;
            description = `🔥 **MASSIVE DEPOSIT!** ${amount.toFixed(2)} VEX is now working for you!\n💪 **You're building serious wealth!**`;
        }
        
        if (isSmartInvestor) {
            title = `🧠 INVESTMENT GENIUS AT WORK!`;
            description += `\n👑 **${totalDeposits} deposits** - You understand compound interest!`;
        }
        
        if (surpriseBonus > 0) {
            description += `\n✨ **SURPRISE BONUS: +${surpriseBonus} VEX!** Lucky you!`;
        }
        
        const socialProof = Math.random() < 0.3;
        if (socialProof) {
            const activeDepositors = Math.floor(Math.random() * 200) + 50;
            description += `\n📈 **${activeDepositors} players are banking VEX right now!** Smart money moves!`;
        }
        
        const motivationalMessages = [
            "🚀 Your money is working while you sleep!",
            "💎 Compound interest is the 8th wonder of the world!",
            "⚡ Every day your wealth grows automatically!",
            "🌟 You're building generational wealth!",
            "🔥 Smart investors always win in the long run!"
        ];
        
        const randomMotivation = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (amount * 0.01).toFixed(2)) : null;
        const milestoneMessage = amount >= 1000 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        
        description += `\n\n${randomMotivation}`;
        if (variableReward) description += `\n${variableReward}`;
        if (milestoneMessage) description += `\n${milestoneMessage}`;
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`🎉 ${description}\n\n📈 **Compound Interest Magic:** Your money grows ${compoundingPower}% annual...`)
            .addFields(
                { name: '💰 Deposited Amount', value: `${amount.toFixed(2)} VEX`, inline: true },
                { name: '📊 Interest Rate', value: `${(interestRate * 100).toFixed(3)}% daily`, inline: true },
                { name: '🔒 Term', value: termName, inline: true },
                { name: '💵 Daily Interest', value: `${dailyInterest.toFixed(4)} VEX`, inline: true },
                { name: '📈 Yearly Projection', value: `${projectedYearly.toFixed(2)} VEX`, inline: true },
                { name: '🏦 Total Bank Balance', value: `${userData.bankBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        if (deposit.unlockDate) {
            const unlockTimestamp = Math.floor(new Date(deposit.unlockDate).getTime() / 1000);
            embed.addFields({
                name: '🔓 Unlock Date',
                value: `<t:${unlockTimestamp}:F>`,
                inline: false
            });
        }
        
        if (userData.premiumTier) {
            embed.addFields({
                name: `${constants.EMOJIS.PREMIUM} Premium Bonus`,
                value: `+${(constants.BANK_INTEREST_RATES.PREMIUM_BONUS * 100).toFixed(3)}% daily interest`,
                inline: false
            });
        }
        
        embed.setFooter({ text: 'Interest is calculated and paid daily at midnight UTC' });
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const depositProgress = Math.min(userData.bankBalance / 10000, 1);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Bank Balance: ${userData.bankBalance.toFixed(2)} VEX`,
            depositProgress,
            constants.COLORS.SUCCESS
        );
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    generateDepositId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
};
