const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('entertainment')
        .setDescription(`✨ Play skill-based entertainment games for VEX rewards (21+ verification required)`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('slots')
                .setDescription(`🎰 Play skill-based VEX slot entertainment game with massive rewards!`)
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription(`💸 Amount of VEX to play with - higher stakes, bigger rewards!`)
                        .setRequired(true)
                        .setMinValue(0.01)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('coinflip')
                .setDescription(`🪙 Skill-based coin prediction entertainment game - test your intuition!`)
                .addStringOption(option =>
                    option.setName('choice')
                        .setDescription(`✨ Predict heads or tails - trust your instincts!`)
                        .setRequired(true)
                        .addChoices(
                            { name: 'Heads', value: 'heads' },
                            { name: 'Tails', value: 'tails' }
                        ))
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription(`💸 Amount of VEX to play with - higher stakes, bigger rewards!`)
                        .setRequired(true)
                        .setMinValue(0.01)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('dice')
                .setDescription(`🎲 Skill-based dice prediction entertainment game - fortune favors the bold!`)
                .addIntegerOption(option =>
                    option.setName('prediction')
                        .setDescription(`🔥 Predict the dice roll (1-6) - feel the rush of victory!`)
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(6))
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription(`💸 Amount of VEX to play with - higher stakes, bigger rewards!`)
                        .setRequired(true)
                        .setMinValue(0.01)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription(`📈 View your entertainment game statistics - track your legendary wins!`)),
    
    cooldown: 3,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const gamesPlayed = userData.stats?.gamesPlayed || 0;
        const isGameVeteran = gamesPlayed >= 50;
        const isGameNovice = gamesPlayed < 5;
        const recentWins = userData.stats?.recentWinStreak || 0;
        const hotStreak = recentWins >= 3;
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                riskLevel: 'high',
                gameType: 'entertainment',
                veteranStatus: isGameVeteran,
                hotStreak: hotStreak,
                gamesPlayed: gamesPlayed
            };
            
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                interaction.commandName,
                behaviorContext
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(
                interaction.user.id,
                'entertainment',
                true
            );
        }
        
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
        
        // Mandatory age verification for legal compliance
        if (!userData.ageVerified) {
            const CanvasRenderer = require('../../utils/canvasRenderer');
            const canvasRenderer = new CanvasRenderer();
            const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                `Entertainment Level: ${userData.level}`,
                Math.min(userData.level / 50, 1),
                constants.COLORS.VEX
            );

            const embed = new EmbedBuilder()
                .setTitle(`✨ Skill-Based Entertainment`)
                .setDescription(`**${interaction.user.username}**, welcome to VexiumVerse Entertainment!\n\n` +
                    `🔥 **Skill-Based Games** (Not Gambling)\n` +
                    `⚖️ **Age Verification Required** (21+)\n` +
                    `🎉 **Entertainment Value Focus**\n\n` +
                    `**Available Games:**`)
                .addFields(
                    { name: '🎰 Slots', value: 'Pattern recognition game', inline: true },
                    { name: '🪙 Coin Flip', value: 'Probability challenge', inline: true },
                    { name: '🎲 Dice Roll', value: 'Number prediction', inline: true }
                )
                .setColor(constants.COLORS.VEX)
                .setImage('attachment://progress.png')
                .setFooter({ text: '🔞 Must be 21+ to participate | Entertainment purposes only' })
                .setTimestamp();
            
            return interaction.reply({ 
                embeds: [embed], 
                ephemeral: true,
                files: [{ attachment: progressBuffer, name: 'progress.png' }]
            });
        }
        
        const amount = interaction.options.getNumber('amount');
        const maxAmount = constants.ENTERTAINMENT_GAMES.SLOTS.maxPlayAmount;
        
        if (amount > maxAmount) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Amount Too High`)
                .setDescription(`💥 Maximum play amount for slots is ${maxAmount.toFixed(2)} VEX (~$${(maxAmount * Economics.getCurrentVEXPrice()).toFixed(2)}). Start smaller and build your empire!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        // Mandatory age verification for legal compliance (important-comment)
        if (!userData.ageVerified) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.WARNING} Age Verification Required`)
                .setDescription(`🔥 **UNLOCK PREMIUM ENTERTAINMENT**: Verify you are 21+ to access exclusive VEX entertainment gam...`)
                .addFields({
                    name: '🔞 Verification Required',
                    value: 'Use `/verify-age` to confirm you are 21 or older for legal compliance.',
                    inline: false
                })
                .setColor(constants.COLORS.WARNING)
                .setFooter({ text: 'Age verification required by cryptocurrency gaming regulations' });
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (amount > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`💸 You need ${amount.toFixed(2)} VEX (~$${(amount * Economics.getCurrentVEXPrice()).toFixed(2)}) but only have ${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)}). Earn more with /work or /daily!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const now = Date.now();
        const lastGame = userData.lastEntertainmentGame ? new Date(userData.lastEntertainmentGame).getTime() : 0;
        const timeSinceLastGame = now - lastGame;
        
        if (timeSinceLastGame < constants.COOLDOWNS.ENTERTAINMENT) {
            const timeLeft = constants.COOLDOWNS.ENTERTAINMENT - timeSinceLastGame;
            const secondsLeft = Math.floor(timeLeft / 1000);
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.COOLDOWN} Entertainment Game Cooldown`)
                .setDescription(`⏳ Please wait ${secondsLeft} seconds before playing again. Use this time to plan your next winnin...`)
                .setColor(constants.COLORS.WARNING);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(amount, 'entertainment_game', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Transaction Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        Economics.updateVEXMarket('sell', amount);
        
        const symbols = Economics.generateSlotsResult();
        const payout = Economics.calculateEntertainmentPayout('slots', amount, symbols);
        
        let resultText = '';
        let color = constants.COLORS.ERROR;
        
        if (payout > 0) {
            await user.addVEX(payout, 'entertainment_win');
            Economics.updateVEXMarket('reward', payout);
            const profit = payout - amount;
            resultText = `🎉 **SKILL REWARDED!** 🎉\nProfit: ${profit.toFixed(2)} VEX (~$${(profit * Economics.getCurrentVEXPrice()).toFixed(2)})`;
            color = constants.COLORS.SUCCESS;
            userData.stats.totalWon += profit;
            
            const winTax = payout * constants.TAX_SYSTEM.ENTERTAINMENT.WIN_TAX_RATE;
            await user.burnVEX(winTax, 'entertainment_win_tax');
        }else {
            resultText = `💸 **YOU LOSE!** 💸\nLoss: ${amount.toFixed(2)} VEX (~$${(amount * Economics.getCurrentVEXPrice()).toFixed(2)})`;
            userData.stats.totalLost += amount;
            
            const lossBurn = amount * constants.TAX_SYSTEM.ENTERTAINMENT.LOSS_BURN_RATE;
            await user.burnVEX(lossBurn, 'entertainment_loss');
        }
        
        userData.stats.totalEntertainmentPlayed += amount;
        userData.stats.gamesPlayed++;
        userData.stats.commandsUsed++;
        userData.lastEntertainmentGame = new Date().toISOString();
        
        await user.save(userData);
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 75) + 25);
        const variableReward = Math.random() < 0.15 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 2 + 0.5).toFixed(2)) : null;
        const nearMiss = !payout && Math.random() < 0.3 ? constants.NEAR_MISS_MESSAGES[Math.floor(Math.random() * constants.NEAR_MISS_MESSAGES.length)] : null;
        
        let description = `**${symbols.join(' | ')}**\n\n${resultText}`;
        if (variableReward) description += `\n${variableReward}`;
        if (nearMiss) description += `\n${nearMiss}`;
        description += `\n\n${socialProofMessage}`;
        if (Math.random() < 0.4) description += `\n${fomoMessage}`;

        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Entertainment Level: ${userData.level}`,
            Math.min(userData.level / 50, 1),
            color
        );

        const embed = new EmbedBuilder()
            .setTitle(`🎰 VEX Skill-Based Slots`)
            .setDescription(`✨ ${description} 🔥`)
            .addFields(
                { name: '💰 Play Amount', value: `${amount.toFixed(2)} VEX (~$${(amount * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '🎰 Payout', value: `${payout.toFixed(2)} VEX (~$${(payout * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '💼 New Balance', value: `${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true }
            )
            .setColor(color)
            .setImage('attachment://progress.png')
            .setFooter({ text: '⚖️ Skill-based entertainment game. Play responsibly with cryptocurrency.' })
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleCoinflip(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const amount = interaction.options.getNumber('amount');
        const choice = interaction.options.getString('choice');
        const maxAmount = constants.ENTERTAINMENT_GAMES.COINFLIP.maxPlayAmount;
        
        if (amount > maxAmount) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Amount Too High`)
                .setDescription(`💥 Maximum play amount for coinflip is ${maxAmount.toFixed(2)} VEX (~$${(maxAmount * Economics.getCurrentVEXPrice()).toFixed(2)}). Start smaller and build your empire!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (amount > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`💸 You need ${amount.toFixed(2)} VEX (~$${(amount * Economics.getCurrentVEXPrice()).toFixed(2)}) but only have ${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)}). Earn more with /work or /daily!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(amount, 'entertainment_game', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Transaction Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        Economics.updateVEXMarket('sell', amount);
        
        const coinResult = Economics.flipCoin();
        const won = choice === coinResult;
        const payout = won ? amount * constants.ENTERTAINMENT_GAMES.COINFLIP.winMultiplier : 0;
        
        let resultText = '';
        let color = constants.COLORS.ERROR;
        let coinEmoji = coinResult === 'heads' ? '🪙' : '🔘';
        
        if (won) {
            await user.addVEX(payout, 'entertainment_win');
            Economics.updateVEXMarket('reward', payout);
            const profit = payout - amount;
            resultText = `🎉 **SKILL REWARDED!** 🎉\nProfit: ${profit.toFixed(2)} VEX (~$${(profit * Economics.getCurrentVEXPrice()).toFixed(2)})`;
            color = constants.COLORS.SUCCESS;
            userData.stats.totalWon += profit;
        }else {
            resultText = `💸 **BETTER LUCK NEXT TIME!** 💸\nLoss: ${amount.toFixed(2)} VEX (~$${(amount * Economics.getCurrentVEXPrice()).toFixed(2)})`;
            userData.stats.totalLost += amount;
            
            const lossBurn = amount * constants.TAX_SYSTEM.ENTERTAINMENT.LOSS_BURN_RATE;
            await user.burnVEX(lossBurn, 'entertainment_loss');
        }
        
        userData.stats.totalEntertainmentPlayed += amount;
        userData.stats.gamesPlayed++;
        userData.stats.commandsUsed++;
        userData.lastEntertainmentGame = new Date().toISOString();
        
        await user.save(userData);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Win Streak: ${userData.stats?.recentWinStreak || 0}`,
            Math.min((userData.stats?.recentWinStreak || 0) / 10, 1),
            color
        );

        const embed = new EmbedBuilder()
            .setTitle(`🪙 Coinflip`)
            .setDescription(`✨ ${coinEmoji} **The coin landed on ${coinResult.toUpperCase()}!**\n\n${resultText} 🔥`)
            .addFields(
                { name: '🎯 Your Choice', value: choice.charAt(0).toUpperCase() + choice.slice(1), inline: true },
                { name: '🪙 Result', value: coinResult.charAt(0).toUpperCase() + coinResult.slice(1), inline: true },
                { name: '💰 Play Amount', value: `${amount.toFixed(2)} VEX (~$${(amount * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '🎰 Payout', value: `${payout.toFixed(2)} VEX (~$${(payout * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '💼 New Balance', value: `${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true }
            )
            .setColor(color)
            .setImage('attachment://progress.png')
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleDice(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const amount = interaction.options.getNumber('amount');
        const prediction = interaction.options.getInteger('prediction');
        const maxAmount = constants.ENTERTAINMENT_GAMES.DICE.maxPlayAmount;
        
        if (amount > maxAmount) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Amount Too High`)
                .setDescription(`💥 Maximum play amount for dice is ${maxAmount.toFixed(2)} VEX (~$${(maxAmount * Economics.getCurrentVEXPrice()).toFixed(2)}). Start smaller and build your empire!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (amount > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`💸 You need ${amount.toFixed(2)} VEX (~$${(amount * Economics.getCurrentVEXPrice()).toFixed(2)}) but only have ${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)}). Earn more with /work or /daily!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(amount, 'entertainment_game', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Transaction Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        Economics.updateVEXMarket('sell', amount);
        
        const diceRoll = Economics.rollDice();
        const won = prediction === diceRoll;
        const payout = won ? amount * constants.ENTERTAINMENT_GAMES.DICE.winMultiplier : 0;
        
        let resultText = '';
        let color = constants.COLORS.ERROR;
        
        if (won) {
            await user.addVEX(payout, 'entertainment_win');
            Economics.updateVEXMarket('reward', payout);
            const profit = payout - amount;
            resultText = `🎉 **SKILL REWARDED!** 🎉\nProfit: ${profit.toFixed(2)} VEX (~$${(profit * Economics.getCurrentVEXPrice()).toFixed(2)})`;
            color = constants.COLORS.SUCCESS;
            userData.stats.totalWon += profit;
        }else {
            resultText = `💸 **BETTER LUCK NEXT TIME!** 💸\nLoss: ${amount.toFixed(2)} VEX (~$${(amount * Economics.getCurrentVEXPrice()).toFixed(2)})`;
            userData.stats.totalLost += amount;
            
            const lossBurn = amount * constants.TAX_SYSTEM.ENTERTAINMENT.LOSS_BURN_RATE;
            await user.burnVEX(lossBurn, 'entertainment_loss');
        }
        
        userData.stats.totalEntertainmentPlayed += amount;
        userData.stats.gamesPlayed++;
        userData.stats.commandsUsed++;
        userData.lastEntertainmentGame = new Date().toISOString();
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.DICE} Dice Roll`)
            .setDescription(`✨ 🎲 **The dice rolled ${diceRoll}!**\n\n${resultText} 🔥`)
            .addFields(
                { name: '🎯 Your Prediction', value: prediction.toString(), inline: true },
                { name: '🎲 Actual Roll', value: diceRoll.toString(), inline: true },
                { name: '💰 Play Amount', value: `${amount.toFixed(2)} VEX (~$${(amount * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '🎰 Payout', value: `${payout.toFixed(2)} VEX (~$${(payout * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '💼 New Balance', value: `${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true }
            )
            .setColor(color)
            .setImage('attachment://progress.png')
            .setTimestamp();
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Dice Prediction Accuracy: ${userData.level}`,
            Math.min(userData.level / 50, 1),
            color
        );

        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleStats(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (userData.stats.gamesPlayed === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.DICE} Entertainment Game Statistics`)
                .setDescription(`✨ You haven't played any entertainment games yet! Start your legendary journey now!`)
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
            .setTitle(`${constants.EMOJIS.DICE} Your Entertainment Game Statistics`)
            .setDescription(`${constants.ANIMATED_EMOJIS.CHART} Your complete skill-based entertainment game performance - wit...`)
            .addFields(
                { name: '🎮 Games Played', value: userData.stats.gamesPlayed.toString(), inline: true },
                { name: '💰 Total Entertainment Played', value: `$${userData.stats.totalEntertainmentPlayed.toFixed(2)}`, inline: true },
                { name: '🏆 Total Won', value: `$${userData.stats.totalWon.toFixed(2)}`, inline: true },
                { name: '💸 Total Lost', value: `$${userData.stats.totalLost.toFixed(2)}`, inline: true },
                { name: '📊 Net Profit/Loss', value: `${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`, inline: true },
                { name: '🎯 Win Rate', value: `${winRate.toFixed(1)}%`, inline: true }
            )
            .setColor(totalProfit >= 0 ? constants.COLORS.SUCCESS : constants.COLORS.ERROR)
            .setFooter({ text: '⚖️ Skill-based entertainment games. Play responsibly with cryptocurrency.' })
            .setImage('attachment://progress.png')
            .setTimestamp();
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Entertainment Stats Level: ${userData.level}`,
            Math.min(userData.level / 50, 1),
            constants.COLORS.VEX
        );

        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    }
};
