const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('credit')
        .setDescription('💳 Check your credit score and financial health'),

    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'credit', true);
        }

        userData.stats = userData.stats || {};
        userData.stats.commandsUsed = (userData.stats.commandsUsed || 0) + 1;
        userData.stats.creditChecked = (userData.stats.creditChecked || 0) + 1;
        await user.save(userData);

        const netWorth = await user.getNetWorth();
        const vexPrice = Economics.getCurrentVEXPrice();
        
        let creditScore = 300;
        
        if (netWorth > 10000) creditScore += 100;
        if (netWorth > 50000) creditScore += 100;
        if (netWorth > 100000) creditScore += 100;
        if (userData.dailyStreak > 7) creditScore += 50;
        if (userData.dailyStreak > 30) creditScore += 50;
        if (userData.stats?.workSessions > 10) creditScore += 50;
        if (userData.stats?.investmentReturns > 0) creditScore += 50;
        
        creditScore = Math.min(850, creditScore);
        
        let creditRating = 'Poor';
        let creditColor = constants.COLORS.ERROR;
        
        if (creditScore >= 800) {
            creditRating = 'Excellent';
            creditColor = constants.COLORS.SUCCESS;
        } else if (creditScore >= 740) {
            creditRating = 'Very Good';
            creditColor = '#00FF7F';
        } else if (creditScore >= 670) {
            creditRating = 'Good';
            creditColor = constants.COLORS.WARNING;
        } else if (creditScore >= 580) {
            creditRating = 'Fair';
            creditColor = '#FFA500';
        }

        const embed = new EmbedBuilder()
            .setTitle('💳 Credit Score Report')
            .setDescription(`**Your Financial Health Overview**\n\n🎯 **Credit Score:** ${creditScore}/850 (${creditRating})`)
            .setColor(creditColor)
            .addFields(
                { 
                    name: '💰 Net Worth Impact', 
                    value: `${netWorth.toFixed(2)} VEX (~$${(netWorth * vexPrice).toFixed(2)})`, 
                    inline: true 
                },
                { 
                    name: '📅 Daily Streak', 
                    value: `${userData.dailyStreak} days`, 
                    inline: true 
                },
                { 
                    name: '💼 Work Sessions', 
                    value: `${userData.stats?.workSessions || 0} completed`, 
                    inline: true 
                },
                { 
                    name: '📈 Investment Returns', 
                    value: `${(userData.stats?.investmentReturns || 0).toFixed(2)} VEX`, 
                    inline: true 
                },
                { 
                    name: '🏦 Bank Balance', 
                    value: `${userData.bankBalance.toFixed(2)} VEX`, 
                    inline: true 
                },
                { 
                    name: '💎 Wallet Balance', 
                    value: `${userData.vexBalance.toFixed(2)} VEX`, 
                    inline: true 
                }
            )
            .setFooter({ text: 'Improve your credit by maintaining streaks and growing wealth' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
