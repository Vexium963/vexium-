const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bank')
        .setDescription('View your bank account details and deposit information'),
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.BANK} Your Bank Account`)
            .setDescription('Complete overview of your VexiumVerse banking')
            .addFields(
                { name: '💰 Total Bank Balance', value: `$${userData.bankBalance.toFixed(2)} VEX`, inline: true },
                { name: '💼 Wallet Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '📊 Combined Total', value: `$${(userData.bankBalance + userData.vexBalance).toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.VEX)
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
                { name: '🔓 Available Funds', value: `$${totalUnlocked.toFixed(2)} VEX`, inline: true },
                { name: '🔒 Locked Funds', value: `$${totalLocked.toFixed(2)} VEX`, inline: true },
                { name: '💵 Daily Interest', value: `$${totalDailyInterest.toFixed(4)} VEX`, inline: true }
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
                value: `$${yearlyProjection.toFixed(2)} VEX`,
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
        
        await interaction.reply({ embeds: [embed] });
        
        userData.stats.commandsUsed++;
        await user.save(userData);
    }
};
