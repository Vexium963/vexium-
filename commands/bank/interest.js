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
        
        const amount = interaction.options.getNumber('amount');
        const days = interaction.options.getInteger('days') || 30;
        
        const rates = constants.BANK_INTEREST_RATES;
        let premiumBonus = 0;
        
        if (userData.premiumTier) {
            premiumBonus = rates.PREMIUM_BONUS;
        }
        
        const calculations = [
            {
                name: 'No Lock',
                rate: rates.DAILY + premiumBonus,
                term: 'No minimum term'
            },
            {
                name: '1 Week Lock',
                rate: rates.WEEKLY + premiumBonus,
                term: 'Locked for 7 days'
            },
            {
                name: '1 Month Lock',
                rate: rates.MONTHLY + premiumBonus,
                term: 'Locked for 30 days'
            },
            {
                name: '1 Year Lock',
                rate: rates.YEARLY + premiumBonus,
                term: 'Locked for 365 days'
            }
        ];
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CHART} Interest Calculator`)
            .setDescription(`Interest projections for **$${amount.toFixed(2)} VEX** over **${days} days**`)
            .setColor(constants.COLORS.PRIMARY);
        
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
