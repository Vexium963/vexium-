const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deposit')
        .setDescription('Deposit VEX tokens into your bank account to earn interest')
        .addNumberOption(option =>
            option.setName('amount')
                .setDescription('Amount of VEX to deposit')
                .setRequired(true)
                .setMinValue(0.01))
        .addStringOption(option =>
            option.setName('term')
                .setDescription('Deposit term for higher interest rates')
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
        
        const amount = interaction.options.getNumber('amount');
        const term = interaction.options.getString('term') || 'none';
        
        if (amount > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`You need $${amount.toFixed(2)} VEX but only have $${userData.vexBalance.toFixed(2)}.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(amount, 'bank_deposit', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Deposit Failed`)
                .setDescription(result.reason)
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
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.BANK} Deposit Successful!`)
            .setDescription(`You've deposited **$${amount.toFixed(2)} VEX** into your bank account!`)
            .addFields(
                { name: '💰 Deposited Amount', value: `$${amount.toFixed(2)} VEX`, inline: true },
                { name: '📊 Interest Rate', value: `${(interestRate * 100).toFixed(3)}% daily`, inline: true },
                { name: '🔒 Term', value: termName, inline: true },
                { name: '💵 Daily Interest', value: `$${dailyInterest.toFixed(4)} VEX`, inline: true },
                { name: '📈 Yearly Projection', value: `$${projectedYearly.toFixed(2)} VEX`, inline: true },
                { name: '🏦 Total Bank Balance', value: `$${userData.bankBalance.toFixed(2)} VEX`, inline: true }
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
        
        await interaction.reply({ embeds: [embed] });
    },
    
    generateDepositId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
};
