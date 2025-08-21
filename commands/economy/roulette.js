const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription(`🎲 Play skill-based European roulette entertainment game for VEX rewards (21+ verification required)`)
        .addNumberOption(option =>
            option.setName('play_amount')
                .setDescription(`💸 Amount of VEX to play with`)
                .setRequired(true)
                .setMinValue(0.01))
        .addStringOption(option =>
            option.setName('play_type')
                .setDescription(`✨ Type of play to make`)
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
                .setDescription(`🔥 Specific number to play on (0-36, required for single number plays)`)
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(36)),
    
    cooldown: 3,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'roulette', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                riskTaking: true,
                entertainmentSeeking: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'roulette',
                behaviorContext
            );
        }
        
        if (!userData.ageVerified) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 20);
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.WARNING} Age Verification Required`)
                .setDescription(`⚠️ **LEGAL COMPLIANCE**: You must verify you are 21+ to play cryptocurrency entertainment games.\...`)
                .addFields({
                    name: '🔞 Verification Required',
                    value: 'Use `/verify-age` to confirm you are 21 or older for legal compliance.',
                    inline: false
                })
                .setColor(constants.COLORS.WARNING)
                .setFooter({ text: 'Age verification required by cryptocurrency gaming regulations' });
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const playAmount = interaction.options.getNumber('play_amount');
        const playType = interaction.options.getString('play_type');
        const number = interaction.options.getInteger('number');
        
        if (playType === 'single' && number === null) {
            const nearMiss = constants.NEAR_MISS_MESSAGES[Math.floor(Math.random() * constants.NEAR_MISS_MESSAGES.length)];
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Number Required`)
                .setDescription(`⚠️ You must specify a number (0-36) for single number plays.\n\n✨ ${nearMiss}\n\n🔥 **Pro tip:** ...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (playAmount > userData.vexBalance) {
            const comeback = constants.COMEBACK_MESSAGES[Math.floor(Math.random() * constants.COMEBACK_MESSAGES.length)];
            const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 30) + 15);
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`💸 You need ${playAmount.toFixed(2)} VEX (~$${(playAmount * Economics.getCurrentVEXPrice()).toFixed(2)}) but only have ${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)}).\n\n✨ **Quick Fix:** Use \`/work\` or \`/daily\` to earn more VEX!\n\n🔥 ${comeback}\n📈 ${socialProof}\n\n🚀 **${Math.floor(Math.random() * 20) + 10} players** just earned VEX in the last hour!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(playAmount, 'roulette_play', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Play Failed`)
                .setDescription(`⚠️ ${result.reason}\n\n✨ Try again in a moment!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        Economics.apply({ event: 'sell', amountVEX: playAmount, userId: interaction.user.id, meta: { command: 'roulette' } });
        
        const winningNumber = Math.floor(Math.random() * 37);
        const isWin = this.checkWin(playType, number, winningNumber);
        const payout = this.calculatePayout(playType, playAmount);
        
        const currentStreak = userData.stats.rouletteStreak || 0;
        const totalSpins = userData.stats.rouletteSpins || 0;
        const winRate = totalSpins > 0 ? (userData.stats.rouletteWins || 0) / totalSpins : 0;
        const isNearMiss = this.checkNearMiss(playType, number, winningNumber);
        const hotStreak = currentStreak >= 3;
        const jackpotChance = isWin && Math.random() < 0.08;
        const comebackBonus = !isWin && currentStreak === 0 && totalSpins > 5 ? Math.floor(playAmount * 0.15) : 0;
        
        const isRouletteExpert = totalSpins >= 100;
        const isRouletteNovice = totalSpins < 10;
        const isHighRoller = playAmount >= 50;
        const surpriseMultiplier = Math.random() < 0.12 ? (1.5 + Math.random() * 0.5) : 1;
        const activeSpinners = Math.floor(Math.random() * 25) + 8;
        const urgencyBonus = Math.random() < 0.18 ? Math.floor(playAmount * 0.08) : 0;
        
        let winnings = 0;
        if (isWin) {
            winnings = payout;
            if (jackpotChance) {
                const jackpotBonus = Math.floor(winnings * 0.4);
                winnings += jackpotBonus;
            }
            await user.addVEX(winnings, 'roulette_win');
            Economics.apply({ event: 'reward', amountVEX: winnings, userId: interaction.user.id, meta: { command: 'roulette' } });
            userData.stats.rouletteStreak = currentStreak + 1;
        } else {
            userData.stats.rouletteStreak = 0;
            if (comebackBonus > 0) {
                await user.addVEX(comebackBonus, 'roulette_comeback');
                Economics.apply({ event: 'reward', amountVEX: comebackBonus, userId: interaction.user.id, meta: { command: 'roulette' } });
            }
        }
        
        const burnAmount = playAmount * constants.TAX_SYSTEM.ENTERTAINMENT.HOUSE_EDGE;
        await user.burnVEX(burnAmount, 'roulette_house_edge');
        
        userData.stats.rouletteSpins = (userData.stats.rouletteSpins || 0) + 1;
        if (isWin) {
            userData.stats.rouletteWins = (userData.stats.rouletteWins || 0) + 1;
            userData.stats.rouletteWinnings = (userData.stats.rouletteWinnings || 0) + (winnings - playAmount);
        }
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const numberColor = this.getNumberColor(winningNumber);
        const numberEmoji = this.getNumberEmoji(winningNumber);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.DICE} Roulette Result`)
            .setDescription(`${constants.ANIMATED_EMOJIS.DICE_ROLL} The ball landed on **${winningNumber}** ${numberEmoji}\n\n${isWin ? `${constants.ANIMATED_EMOJIS.CELEBRATION} **WINNER!** You beat the odds!` : `${constants.ANIMATED_EMOJIS.FIRE} So close! Try again for your comeback!`}\n\n${constants.ANIMATED_EMOJIS.CHART} **${Math.floor(Math.random() * 15) + 5} players** are spinning right now!`)
            .addFields(
                { name: '🎯 Winning Number', value: `${winningNumber} (${numberColor})`, inline: true },
                { name: '🎲 Your Play', value: this.formatPlay(playType, number), inline: true },
                { name: '💰 Play Amount', value: `${playAmount.toFixed(2)} VEX (~$${(playAmount * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '🏆 Result', value: isWin ? '✅ WIN!' : '❌ LOSE', inline: true },
                { name: '💎 Winnings', value: `${(winnings - playAmount).toFixed(2)} VEX (~$${((winnings - playAmount) * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '💼 New Balance', value: `${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true }
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
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Roulette Spin Result: ${isWin ? 'WIN' : 'LOSE'}`,
            isWin ? 1.0 : 0.0,
            isWin ? constants.COLORS.SUCCESS : constants.COLORS.ERROR
        );

        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    checkWin(playType, number, winningNumber) {
        switch (playType) {
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
    
    calculatePayout(playType, playAmount) {
        const payouts = {
            red: 2,
            black: 2,
            even: 2,
            odd: 2,
            low: 2,
            high: 2,
            single: 36
        };
        
        return playAmount * (payouts[playType] || 0);
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
    
    formatPlay(playType, number) {
        const playNames = {
            red: 'Red',
            black: 'Black',
            even: 'Even',
            odd: 'Odd',
            low: 'Low (1-18)',
            high: 'High (19-36)',
            single: `Number ${number}`
        };
        
        return playNames[playType] || 'Unknown';
    },
    
    async handleStats(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const stats = userData.stats;
        const spins = stats.rouletteSpins || 0;
        const wins = stats.rouletteWins || 0;
        const winRate = spins > 0 ? (wins / spins * 100).toFixed(1) : '0.0';
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Roulette Win Rate: ${winRate}%`,
            Math.min(parseFloat(winRate) / 100, 1),
            constants.COLORS.PRIMARY
        );
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.DICE_ROLL} Your Roulette Statistics`)
            .setDescription(`${constants.ANIMATED_EMOJIS.SPARKLES} Your roulette gaming performance`)
            .addFields(
                { name: '🎲 Total Spins', value: `${spins}`, inline: true },
                { name: '🏆 Wins', value: `${wins}`, inline: true },
                { name: '📊 Win Rate', value: `${winRate}%`, inline: true },
                { name: '💰 Total Winnings', value: `${(stats.rouletteWinnings || 0).toFixed(2)} VEX (~$${((stats.rouletteWinnings || 0) * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '🔥 Current Streak', value: `${stats.rouletteStreak || 0}`, inline: true },
                { name: '🎯 Favorite Play', value: stats.rouletteFavoritePlay || 'None', inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setImage('attachment://progress.png')
            .setTimestamp();
        
        if (spins === 0) {
            embed.setDescription(`${constants.ANIMATED_EMOJIS.SPARKLES} You haven't played roulette yet. Use \`/roulette\` to get started!`);
        }
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    }
};
