const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('Play European roulette for VEX rewards')
        .addNumberOption(option =>
            option.setName('bet')
                .setDescription('Amount of VEX to bet')
                .setRequired(true)
                .setMinValue(0.01))
        .addStringOption(option =>
            option.setName('bet_type')
                .setDescription('Type of bet to place')
                .setRequired(true)
                .addChoices(
                    { name: 'Red', value: 'red' },
                    { name: 'Black', value: 'black' },
                    { name: 'Even', value: 'even' },
                    { name: 'Odd', value: 'odd' },
                    { name: 'Low (1-18)', value: 'low' },
                    { name: 'High (19-36)', value: 'high' },
                    { name: 'Single Number', value: 'single' }
                ))
        .addIntegerOption(option =>
            option.setName('number')
                .setDescription('Specific number to bet on (0-36, required for single number bets)')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(36)),
    
    cooldown: 3,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const betAmount = interaction.options.getNumber('bet');
        const betType = interaction.options.getString('bet_type');
        const number = interaction.options.getInteger('number');
        
        if (betType === 'single' && number === null) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Number Required`)
                .setDescription('You must specify a number (0-36) for single number bets.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (betAmount > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`You need $${betAmount.toFixed(2)} VEX but only have $${userData.vexBalance.toFixed(2)}.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(betAmount, 'roulette_bet', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Bet Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const winningNumber = Math.floor(Math.random() * 37);
        const isWin = this.checkWin(betType, number, winningNumber);
        const payout = this.calculatePayout(betType, betAmount);
        
        let winnings = 0;
        if (isWin) {
            winnings = payout;
            await user.addVEX(winnings, 'roulette_win');
        }
        
        const burnAmount = betAmount * constants.TAX_SYSTEM.GAMBLING.HOUSE_EDGE;
        await user.burnVEX(burnAmount, 'roulette_house_edge');
        
        userData.stats.rouletteSpins = (userData.stats.rouletteSpins || 0) + 1;
        if (isWin) {
            userData.stats.rouletteWins = (userData.stats.rouletteWins || 0) + 1;
        }
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const numberColor = this.getNumberColor(winningNumber);
        const numberEmoji = this.getNumberEmoji(winningNumber);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.DICE} Roulette Result`)
            .setDescription(`The ball landed on **${winningNumber}** ${numberEmoji}`)
            .addFields(
                { name: '🎯 Winning Number', value: `${winningNumber} (${numberColor})`, inline: true },
                { name: '🎲 Your Bet', value: this.formatBet(betType, number), inline: true },
                { name: '💰 Bet Amount', value: `$${betAmount.toFixed(2)} VEX`, inline: true },
                { name: '🏆 Result', value: isWin ? '✅ WIN!' : '❌ LOSE', inline: true },
                { name: '💎 Winnings', value: `$${(winnings - betAmount).toFixed(2)} VEX`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(isWin ? constants.COLORS.SUCCESS : constants.COLORS.ERROR)
            .setFooter({ text: 'The house edge ensures fair play for all!' })
            .setTimestamp();
        
        const playAgainButton = new ButtonBuilder()
            .setCustomId(`roulette_again_${interaction.user.id}`)
            .setLabel('Play Again')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎲');
        
        const statsButton = new ButtonBuilder()
            .setCustomId(`roulette_stats_${interaction.user.id}`)
            .setLabel('View Stats')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📊');
        
        const row = new ActionRowBuilder().addComponents(playAgainButton, statsButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    checkWin(betType, number, winningNumber) {
        switch (betType) {
            case 'red':
                return this.isRed(winningNumber);
            case 'black':
                return this.isBlack(winningNumber);
            case 'even':
                return winningNumber !== 0 && winningNumber % 2 === 0;
            case 'odd':
                return winningNumber !== 0 && winningNumber % 2 === 1;
            case 'low':
                return winningNumber >= 1 && winningNumber <= 18;
            case 'high':
                return winningNumber >= 19 && winningNumber <= 36;
            case 'single':
                return winningNumber === number;
            default:
                return false;
        }
    },
    
    calculatePayout(betType, betAmount) {
        const payouts = {
            red: 2,
            black: 2,
            even: 2,
            odd: 2,
            low: 2,
            high: 2,
            single: 36
        };
        
        return betAmount * (payouts[betType] || 0);
    },
    
    isRed(number) {
        const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        return redNumbers.includes(number);
    },
    
    isBlack(number) {
        return number !== 0 && !this.isRed(number);
    },
    
    getNumberColor(number) {
        if (number === 0) return 'Green';
        return this.isRed(number) ? 'Red' : 'Black';
    },
    
    getNumberEmoji(number) {
        if (number === 0) return '💚';
        return this.isRed(number) ? '❤️' : '🖤';
    },
    
    formatBet(betType, number) {
        const betNames = {
            red: 'Red',
            black: 'Black',
            even: 'Even',
            odd: 'Odd',
            low: 'Low (1-18)',
            high: 'High (19-36)',
            single: `Number ${number}`
        };
        
        return betNames[betType] || 'Unknown';
    },
    
    async handleStats(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const stats = userData.stats;
        const spins = stats.rouletteSpins || 0;
        const wins = stats.rouletteWins || 0;
        const winRate = spins > 0 ? (wins / spins * 100).toFixed(1) : '0.0';
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.DICE} Your Roulette Statistics`)
            .setDescription('Your roulette gaming performance')
            .addFields(
                { name: '🎲 Total Spins', value: `${spins}`, inline: true },
                { name: '🏆 Wins', value: `${wins}`, inline: true },
                { name: '📊 Win Rate', value: `${winRate}%`, inline: true },
                { name: '💰 Total Winnings', value: `$${(stats.rouletteWinnings || 0).toFixed(2)} VEX`, inline: true },
                { name: '🔥 Current Streak', value: `${stats.rouletteStreak || 0}`, inline: true },
                { name: '🎯 Favorite Bet', value: stats.rouletteFavoriteBet || 'None', inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();
        
        if (spins === 0) {
            embed.setDescription('You haven\'t played roulette yet. Use `/roulette` to get started!');
        }
        
        await interaction.reply({ embeds: [embed] });
    }
};
