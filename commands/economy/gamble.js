const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gamble')
        .setDescription('Try your luck with various gambling games')
        .addSubcommand(subcommand =>
            subcommand
                .setName('slots')
                .setDescription('Play the VEX slot machine')
                .addNumberOption(option =>
                    option.setName('bet')
                        .setDescription('Amount of VEX to bet')
                        .setRequired(true)
                        .setMinValue(0.01)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('coinflip')
                .setDescription('Flip a coin and double your VEX')
                .addStringOption(option =>
                    option.setName('choice')
                        .setDescription('Choose heads or tails')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Heads', value: 'heads' },
                            { name: 'Tails', value: 'tails' }
                        ))
                .addNumberOption(option =>
                    option.setName('bet')
                        .setDescription('Amount of VEX to bet')
                        .setRequired(true)
                        .setMinValue(0.01)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('dice')
                .setDescription('Roll dice and predict the outcome')
                .addIntegerOption(option =>
                    option.setName('prediction')
                        .setDescription('Predict the dice roll (1-6)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(6))
                .addNumberOption(option =>
                    option.setName('bet')
                        .setDescription('Amount of VEX to bet')
                        .setRequired(true)
                        .setMinValue(0.01)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View your gambling statistics')),
    
    cooldown: 3,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'slots':
                return this.handleSlots(interaction);
            case 'coinflip':
                return this.handleCoinflip(interaction);
            case 'dice':
                return this.handleDice(interaction);
            case 'stats':
                return this.handleStats(interaction);
        }
    },
    
    async handleSlots(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const bet = interaction.options.getNumber('bet');
        const maxBet = constants.GAMBLING_GAMES.SLOTS.maxBet;
        
        if (bet > maxBet) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Bet Too High`)
                .setDescription(`Maximum bet for slots is $${maxBet.toFixed(2)} VEX.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (bet > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`You need $${bet.toFixed(2)} VEX but only have $${userData.vexBalance.toFixed(2)}.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const now = Date.now();
        const lastGamble = userData.lastGamble ? new Date(userData.lastGamble).getTime() : 0;
        const timeSinceLastGamble = now - lastGamble;
        
        if (timeSinceLastGamble < constants.COOLDOWNS.GAMBLE) {
            const timeLeft = constants.COOLDOWNS.GAMBLE - timeSinceLastGamble;
            const secondsLeft = Math.floor(timeLeft / 1000);
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.COOLDOWN} Gambling Cooldown`)
                .setDescription(`Please wait ${secondsLeft} seconds before gambling again.`)
                .setColor(constants.COLORS.WARNING);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(bet, 'gambling', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Transaction Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const symbols = Economics.generateSlotsResult();
        const payout = Economics.calculateGamblingPayout('slots', bet, symbols);
        
        let resultText = '';
        let color = constants.COLORS.ERROR;
        
        if (payout > 0) {
            await user.addVEX(payout, 'gambling_win');
            const profit = payout - bet;
            resultText = `🎉 **YOU WIN!** 🎉\nProfit: $${profit.toFixed(2)} VEX`;
            color = constants.COLORS.SUCCESS;
            userData.stats.totalWon += profit;
            
            const winTax = payout * constants.TAX_SYSTEM.GAMBLING.WIN_TAX_RATE;
            await user.burnVEX(winTax, 'gambling_win_tax');
        } else {
            resultText = `💸 **YOU LOSE!** 💸\nLoss: $${bet.toFixed(2)} VEX`;
            userData.stats.totalLost += bet;
            
            const lossBurn = bet * constants.TAX_SYSTEM.GAMBLING.LOSS_BURN_RATE;
            await user.burnVEX(lossBurn, 'gambling_loss');
        }
        
        userData.stats.totalGambled += bet;
        userData.stats.gamesPlayed++;
        userData.stats.commandsUsed++;
        userData.lastGamble = new Date().toISOString();
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SLOT} VEX Slots`)
            .setDescription(`**${symbols.join(' | ')}**\n\n${resultText}`)
            .addFields(
                { name: '💰 Bet Amount', value: `$${bet.toFixed(2)} VEX`, inline: true },
                { name: '🎰 Payout', value: `$${payout.toFixed(2)} VEX`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(color)
            .setFooter({ text: 'Gambling is risky! Only bet what you can afford to lose.' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleCoinflip(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const bet = interaction.options.getNumber('bet');
        const choice = interaction.options.getString('choice');
        const maxBet = constants.GAMBLING_GAMES.COINFLIP.maxBet;
        
        if (bet > maxBet) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Bet Too High`)
                .setDescription(`Maximum bet for coinflip is $${maxBet.toFixed(2)} VEX.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (bet > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`You need $${bet.toFixed(2)} VEX but only have $${userData.vexBalance.toFixed(2)}.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(bet, 'gambling', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Transaction Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const coinResult = Economics.flipCoin();
        const won = choice === coinResult;
        const payout = won ? bet * constants.GAMBLING_GAMES.COINFLIP.winMultiplier : 0;
        
        let resultText = '';
        let color = constants.COLORS.ERROR;
        let coinEmoji = coinResult === 'heads' ? '🪙' : '🔘';
        
        if (won) {
            await user.addVEX(payout, 'gambling_win');
            const profit = payout - bet;
            resultText = `🎉 **CORRECT!** 🎉\nProfit: $${profit.toFixed(2)} VEX`;
            color = constants.COLORS.SUCCESS;
            userData.stats.totalWon += profit;
        } else {
            resultText = `💸 **WRONG!** 💸\nLoss: $${bet.toFixed(2)} VEX`;
            userData.stats.totalLost += bet;
            
            const lossBurn = bet * constants.TAX_SYSTEM.GAMBLING.LOSS_BURN_RATE;
            await user.burnVEX(lossBurn, 'gambling_loss');
        }
        
        userData.stats.totalGambled += bet;
        userData.stats.gamesPlayed++;
        userData.stats.commandsUsed++;
        userData.lastGamble = new Date().toISOString();
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.COIN} Coinflip`)
            .setDescription(`${coinEmoji} **The coin landed on ${coinResult.toUpperCase()}!**\n\n${resultText}`)
            .addFields(
                { name: '🎯 Your Choice', value: choice.charAt(0).toUpperCase() + choice.slice(1), inline: true },
                { name: '🪙 Result', value: coinResult.charAt(0).toUpperCase() + coinResult.slice(1), inline: true },
                { name: '💰 Bet Amount', value: `$${bet.toFixed(2)} VEX`, inline: true },
                { name: '🎰 Payout', value: `$${payout.toFixed(2)} VEX`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(color)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleDice(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const bet = interaction.options.getNumber('bet');
        const prediction = interaction.options.getInteger('prediction');
        const maxBet = constants.GAMBLING_GAMES.DICE.maxBet;
        
        if (bet > maxBet) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Bet Too High`)
                .setDescription(`Maximum bet for dice is $${maxBet.toFixed(2)} VEX.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (bet > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`You need $${bet.toFixed(2)} VEX but only have $${userData.vexBalance.toFixed(2)}.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(bet, 'gambling', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Transaction Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const diceRoll = Economics.rollDice();
        const won = prediction === diceRoll;
        const payout = won ? bet * constants.GAMBLING_GAMES.DICE.winMultiplier : 0;
        
        let resultText = '';
        let color = constants.COLORS.ERROR;
        
        if (won) {
            await user.addVEX(payout, 'gambling_win');
            const profit = payout - bet;
            resultText = `🎉 **CORRECT!** 🎉\nProfit: $${profit.toFixed(2)} VEX`;
            color = constants.COLORS.SUCCESS;
            userData.stats.totalWon += profit;
        } else {
            resultText = `💸 **WRONG!** 💸\nLoss: $${bet.toFixed(2)} VEX`;
            userData.stats.totalLost += bet;
            
            const lossBurn = bet * constants.TAX_SYSTEM.GAMBLING.LOSS_BURN_RATE;
            await user.burnVEX(lossBurn, 'gambling_loss');
        }
        
        userData.stats.totalGambled += bet;
        userData.stats.gamesPlayed++;
        userData.stats.commandsUsed++;
        userData.lastGamble = new Date().toISOString();
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.DICE} Dice Roll`)
            .setDescription(`🎲 **The dice rolled ${diceRoll}!**\n\n${resultText}`)
            .addFields(
                { name: '🎯 Your Prediction', value: prediction.toString(), inline: true },
                { name: '🎲 Actual Roll', value: diceRoll.toString(), inline: true },
                { name: '💰 Bet Amount', value: `$${bet.toFixed(2)} VEX`, inline: true },
                { name: '🎰 Payout', value: `$${payout.toFixed(2)} VEX`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(color)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleStats(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (userData.stats.gamesPlayed === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.DICE} Gambling Statistics`)
                .setDescription('You haven\'t played any gambling games yet!')
                .addFields(
                    { name: '🎰 Available Games', value: 'Slots, Coinflip, Dice', inline: false }
                )
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const totalProfit = userData.stats.totalWon - userData.stats.totalLost;
        const winRate = userData.stats.totalWon > 0 ? 
            (userData.stats.totalWon / (userData.stats.totalWon + userData.stats.totalLost)) * 100 : 0;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.DICE} Your Gambling Statistics`)
            .setDescription('Your complete gambling history and performance')
            .addFields(
                { name: '🎮 Games Played', value: userData.stats.gamesPlayed.toString(), inline: true },
                { name: '💰 Total Gambled', value: `$${userData.stats.totalGambled.toFixed(2)}`, inline: true },
                { name: '🏆 Total Won', value: `$${userData.stats.totalWon.toFixed(2)}`, inline: true },
                { name: '💸 Total Lost', value: `$${userData.stats.totalLost.toFixed(2)}`, inline: true },
                { name: '📊 Net Profit/Loss', value: `${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`, inline: true },
                { name: '🎯 Win Rate', value: `${winRate.toFixed(1)}%`, inline: true }
            )
            .setColor(totalProfit >= 0 ? constants.COLORS.SUCCESS : constants.COLORS.ERROR)
            .setFooter({ text: 'Remember: Gambling is risky and should be done responsibly!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
