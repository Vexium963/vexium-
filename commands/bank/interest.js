const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('interest')
        .setDescription('Calculate potential interest earnings for different deposit terms')
        .addNumberOption(option =>
            option.setName('amount')
                .setDescription('Amount to calculate interest for')
                .setRequired(true)
                .setMinValue(0.01))
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Number of days to calculate (default: 30)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(365)),
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'interest', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                financialPlanning: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'interest',
                behaviorContext
            );
        }
        
        const amount = interaction.options.getNumber('amount');
        const days = interaction.options.getInteger('days') || 30;
        
        const rates = constants.BANK_INTEREST_RATES;
        let premiumBonus = 0;
        
        if (userData.premiumTier) {
            premiumBonus = rates.PREMIUM_BONUS;
        }
        
        const totalSavings = userData.bankBalance || 0;
        const isWhale = totalSavings >= 50000;
        const isSaver = totalSavings >= 5000;
        const calculationStreak = userData.stats.calculationsUsed || 0;
        const isAnalyst = calculationStreak >= 20;
        const isFirstTime = calculationStreak === 0;
        const recentCalculations = userData.stats.recentCalculations || 0;
        const isHotStreak = recentCalculations >= 3;
        
        userData.stats.calculationsUsed = calculationStreak + 1;
        userData.stats.recentCalculations = recentCalculations + 1;
        
        const surpriseBonus = Math.random() < 0.15 ? Math.floor(amount * 0.01) : 0;
        const urgencyFactor = Math.random() < 0.3;
        const socialProof = Math.floor(Math.random() * 25) + 15;
        
        const calculations = [
            {
                name: 'No Lock',
                rate: rates.DAILY + premiumBonus,
                term: 'No minimum term',
                emoji: '⚡'
            },
            {
                name: '1 Week Lock',
                rate: rates.WEEKLY + premiumBonus,
                term: 'Locked for 7 days',
                emoji: '📅'
            },
            {
                name: '1 Month Lock',
                rate: rates.MONTHLY + premiumBonus,
                term: 'Locked for 30 days',
                emoji: '📈'
            },
            {
                name: '1 Year Lock',
                rate: rates.YEARLY + premiumBonus,
                term: 'Locked for 365 days',
                emoji: '💎'
            }
        ];
        
        let title = `${constants.EMOJIS.CHART} Smart Money Calculator`;
        let description = `💰 **Interest projections for $${amount.toFixed(2)} VEX** over **${days} days**`;
        
        if (isWhale) {
            title = `🐋 WHALE INVESTOR CALCULATOR!`;
            description = `💎 **MASSIVE WEALTH PROJECTION!** $${amount.toFixed(2)} VEX over **${days} days**\n👑 **Elite investor status detected!**`;
        } else if (isAnalyst) {
            title = `🧠 FINANCIAL ANALYST MODE!`;
            description = `📊 **EXPERT ANALYSIS!** $${amount.toFixed(2)} VEX over **${days} days**\n⭐ **You're a calculation master!**`;
        }
        
        const fomoMessage = urgencyFactor ? constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)] : null;
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', socialProof);
        const variableReward = surpriseBonus > 0 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', surpriseBonus.toFixed(2)) : null;
        const milestoneMessage = isAnalyst ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        
        let psychologyText = `\n\n🎯 **"Compound interest is the 8th wonder of the world!"**`;
        if (fomoMessage) psychologyText += `\n${fomoMessage}`;
        if (socialProofMessage) psychologyText += `\n${socialProofMessage}`;
        if (variableReward) psychologyText += `\n${variableReward}`;
        if (milestoneMessage) psychologyText += `\n${milestoneMessage}`;
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description + psychologyText)
            .setColor(isWhale ? constants.COLORS.VEX : constants.COLORS.PRIMARY);
        
        for (const calc of calculations) {
            const dailyInterest = amount * calc.rate;
            const totalInterest = dailyInterest * days;
            const finalAmount = amount + totalInterest;
            const annualizedReturn = (calc.rate * 365 * 100).toFixed(2);
            
            embed.addFields({
                name: `${calc.name} (${annualizedReturn}% APY)`,
                value: `**Daily**: $${dailyInterest.toFixed(4)} VEX\n` +
                       `**${days} Days**: $${totalInterest.toFixed(2)} VEX\n` +
                       `**Final Amount**: $${finalAmount.toFixed(2)} VEX\n` +
                       `*${calc.term}*`,
                inline: true
            });
        }
        
        if (userData.premiumTier) {
            const tier = constants.PREMIUM_TIERS[userData.premiumTier.toUpperCase()];
            embed.addFields({
                name: `${constants.EMOJIS.PREMIUM} Premium Bonus`,
                value: `${tier.badge} ${tier.name}\n+${(premiumBonus * 100).toFixed(3)}% daily interest bonus applied`,
                inline: false
            });
        } else {
            embed.addFields({
                name: '💡 Premium Benefits',
                value: `Upgrade to Premium for +${(rates.PREMIUM_BONUS * 100).toFixed(3)}% bonus interest on all deposits!`,
                inline: false
            });
        }
        
        const compoundExample = amount * Math.pow(1 + (rates.YEARLY + premiumBonus), 365);
        embed.addFields({
            name: '🚀 1-Year Compound Growth',
            value: `$${amount.toFixed(2)} → $${compoundExample.toFixed(2)} VEX\n` +
                   `Total gain: $${(compoundExample - amount).toFixed(2)} VEX`,
            inline: false
        });
        
        embed.setFooter({ text: 'Use /deposit to start earning interest today!' });
        embed.setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        
        userData.stats.commandsUsed++;
        await user.save(userData);
    }
};
