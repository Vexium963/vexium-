const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('duel')
        .setDescription(`🔥 Challenge players to EPIC VEX duels! Prove your dominance and earn massive rewards!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('challenge')
                .setDescription(`💥 Challenge another player to an EPIC duel for VEX supremacy!`)
                .addUserOption(option =>
                    option.setName('opponent')
                        .setDescription('Player to challenge')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('prize_amount')
                        .setDescription('VEX amount to compete for')
                        .setRequired(true)
                        .setMinValue(1))
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Type of duel')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Rock Paper Scissors', value: 'rps' },
                            { name: 'Number Guessing', value: 'guess' },
                            { name: 'Coin Flip', value: 'coinflip' },
                            { name: 'Dice Roll', value: 'dice' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('accept')
                .setDescription(`🔥 Accept the challenge and prove your worth in combat!`)
                .addStringOption(option =>
                    option.setName('duel_id')
                        .setDescription('Duel ID to accept')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('decline')
                .setDescription(`✨ Decline a duel challenge (but glory awaits the brave!)`)
                .addStringOption(option =>
                    option.setName('duel_id')
                        .setDescription('Duel ID to decline')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('pending')
                .setDescription(`⏳ View your active duel challenges - time is running out!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription(`📈 View your legendary duel history and battle statistics!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription(`🏆 See the ultimate duel champions - will you join their ranks?`)),
    
    cooldown: 5,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: (userData.stats?.lastDuelTime && (Date.now() - userData.stats.lastDuelTime) < 300000),
                quickReturn: (userData.stats?.lastDuelTime && (Date.now() - userData.stats.lastDuelTime) < 60000),
                timeSinceLastUse: userData.stats?.lastDuelTime || 0,
                competitiveSpirit: true,
                socialEngagement: true,
                riskTaking: true
            };
            
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'duel',
                behaviorContext
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(
                interaction.user.id,
                'duel',
                true
            );
        }
        
        userData.stats.lastDuelTime = Date.now();
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'challenge':
                return this.handleChallenge(interaction);
            case 'accept':
                return this.handleAccept(interaction);
            case 'decline':
                return this.handleDecline(interaction);
            case 'pending':
                return this.handlePending(interaction);
            case 'history':
                return this.handleHistory(interaction);
            case 'leaderboard':
                return this.handleLeaderboard(interaction);
        }
    },
    
    async handleChallenge(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const opponent = interaction.options.getUser('opponent');
        const prizeAmount = interaction.options.getNumber('prize_amount');
        const duelType = interaction.options.getString('type') || 'rps';
        
        if (opponent.id === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Cannot Duel Yourself`)
                .setDescription(`✨ You cannot challenge yourself to a duel! Find a worthy opponent to test your skills against!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (opponent.bot) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Cannot Duel Bots`)
                .setDescription(`🔥 Bots are not worthy opponents! Challenge real players for true glory and VEX rewards!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (prizeAmount > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`💸 You need ${prizeAmount.toFixed(2)} VEX but only have ${userData.vexBalance.toFixed(2)} VEX! Earn more VEX with /work or /daily to afford this epic duel!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const opponentUser = new User(opponent.id);
        const opponentData = await opponentUser.load();
        
        if (prizeAmount > opponentData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Opponent Insufficient Funds`)
                .setDescription(`✨ **${opponent.username}** doesn't have enough VEX for this epic competition! Choose a smaller pr...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const duelId = this.generateDuelId();
        const duel = {
            id: duelId,
            challenger: interaction.user.id,
            opponent: opponent.id,
            prizeAmount,
            type: duelType,
            status: 'pending',
            createdAt: Date.now(),
            expiresAt: Date.now() + (5 * 60 * 1000)
        };
        
        this.saveDuel(duel);
        
        userData.stats.duelsInitiated = (userData.stats.duelsInitiated || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const duelTypeNames = {
            rps: 'Rock Paper Scissors',
            guess: 'Number Guessing',
            coinflip: 'Coin Flip',
            dice: 'Dice Roll'
        };
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 25) + 10);
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 2 + 1).toFixed(2)) : null;
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Duel Power: ${userData.level} vs ${opponentData.level}`,
            Math.min(userData.level / 50, 1),
            constants.COLORS.PRIMARY
        );

        const embed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.FIRE} DUEL CHALLENGE SENT!`)
            .setDescription(`${constants.ANIMATED_EMOJIS.EXPLOSION} **You've challenged ${opponent.username} to EPIC COMBAT!**\n\n${fomoMessage}\n${socialProofMessage}${variableReward ? `\n${variableReward}` : ''}`)
            .addFields(
                { name: '⚔️ Duel Type', value: duelTypeNames[duelType], inline: true },
                { name: '💰 Prize Pool', value: `${prizeAmount.toFixed(2)} VEX`, inline: true },
                { name: '🆔 Duel ID', value: duelId, inline: true },
                { name: '⏰ Expires', value: `<t:${Math.floor(duel.expiresAt / 1000)}:R>`, inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setThumbnail(opponent.displayAvatarURL())
            .setImage('attachment://progress.png')
            .setFooter({ text: '⚡ Your opponent has 5 minutes to respond - GLORY AWAITS!' })
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
        
        try {
            const challengeEmbed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.SWORD} Duel Challenge!`)
                .setDescription(`${constants.ANIMATED_EMOJIS.EXPLOSION} **${interaction.user.username}** has challenged you to an ...`)
                .addFields(
                    { name: '⚔️ Duel Type', value: duelTypeNames[duelType], inline: true },
                    { name: '💰 Prize Pool', value: `${prizeAmount.toFixed(2)} VEX`, inline: true },
                    { name: '🆔 Duel ID', value: duelId, inline: true }
                )
                .setColor(constants.COLORS.WARNING)
                .setFooter({ text: 'Use /duel accept or /duel decline to respond.' });
            
            await opponent.send({ embeds: [challengeEmbed] });
        } catch (error) {
            console.log('Could not DM opponent about duel challenge');
        }
    },
    
    async handleAccept(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const duelId = interaction.options.getString('duel_id');
        const duel = this.getDuel(duelId);
        
        if (!duel) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Duel Not Found`)
                .setDescription(`Duel **${duelId}** doesn't exist or has expired.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (duel.opponent !== interaction.user.id) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Not Your Duel`)
                .setDescription('You can only accept duels that were sent to you.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (Date.now() > duel.expiresAt) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Duel Expired`)
                .setDescription('This duel challenge has expired.')
                .setColor(constants.COLORS.ERROR);
            
            this.deleteDuel(duelId);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (duel.prizeAmount > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`You need ${duel.prizeAmount.toFixed(2)} VEX but only have ${userData.vexBalance.toFixed(2)} VEX.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const challenger = new User(duel.challenger);
        const challengerData = await challenger.load();
        
        if (duel.prizeAmount > challengerData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Challenger Insufficient Funds`)
                .setDescription('The challenger no longer has enough VEX for this competition.')
                .setColor(constants.COLORS.ERROR);
            
            this.deleteDuel(duelId);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await this.executeDuel(duel, interaction);
        
        userData.stats.duelsAccepted = (userData.stats.duelsAccepted || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        this.deleteDuel(duelId);
        
        await interaction.reply({ embeds: [result.embed], components: result.components || [] });
    },
    
    async handleDecline(interaction) {
        const duelId = interaction.options.getString('duel_id');
        const duel = this.getDuel(duelId);
        
        if (!duel) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Duel Not Found`)
                .setDescription(`Duel **${duelId}** doesn't exist or has expired.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (duel.opponent !== interaction.user.id) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Not Your Duel`)
                .setDescription('You can only decline duels that were sent to you.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        this.deleteDuel(duelId);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            'Duel Status: Declined',
            0.3,
            constants.COLORS.WARNING
        );

        const embed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.SPARKLES} Duel Declined`)
            .setDescription(`You've declined the duel challenge.`)
            .setColor(constants.COLORS.WARNING)
            .setImage('attachment://progress.png')
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handlePending(interaction) {
        const pendingDuels = this.getUserPendingDuels(interaction.user.id);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SWORD} Pending Duels`)
            .setDescription(`${constants.ANIMATED_EMOJIS.FIRE} Your active duel challenges - glory and VEX await the victorious!`)
            .setColor(constants.COLORS.PRIMARY);
        
        if (pendingDuels.length === 0) {
            embed.setDescription('No pending duels. Use `/duel challenge` to start a duel!');
        } else {
            const duelList = pendingDuels.map(duel => {
                const isChallenger = duel.challenger === interaction.user.id;
                const otherPlayer = isChallenger ? 'Opponent' : 'Challenger';
                const timeLeft = this.formatTimeLeft(duel.expiresAt - Date.now());
                
                return `**${duel.id}** - ${otherPlayer}: <@${isChallenger ? duel.opponent : duel.challenger}>\n` +
                       `Type: ${duel.type} | Prize: ${duel.prizeAmount.toFixed(2)} VEX | Expires: ${timeLeft}`;
            }).join('\n\n');
            
            embed.addFields({
                name: '⚔️ Active Duels',
                value: duelList,
                inline: false
            });
        }
        
        embed.setFooter({ text: 'Use /duel accept or /duel decline to respond to challenges' });
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            'Pending Duels Status',
            pendingDuels.length / 10,
            constants.COLORS.PRIMARY
        );

        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleHistory(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const stats = userData.stats;
        const duelsInitiated = stats.duelsInitiated || 0;
        const duelsAccepted = stats.duelsAccepted || 0;
        const duelsWon = stats.duelsWon || 0;
        const duelsLost = stats.duelsLost || 0;
        const totalDuels = duelsWon + duelsLost;
        const winRate = totalDuels > 0 ? (duelsWon / totalDuels * 100).toFixed(1) : '0.0';
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SWORD} Your Duel History`)
            .setDescription('Your dueling statistics and performance')
            .addFields(
                { name: '⚔️ Duels Initiated', value: `${duelsInitiated}`, inline: true },
                { name: '🤝 Duels Accepted', value: `${duelsAccepted}`, inline: true },
                { name: '🏆 Duels Won', value: `${duelsWon}`, inline: true },
                { name: '💀 Duels Lost', value: `${duelsLost}`, inline: true },
                { name: '📊 Win Rate', value: `${winRate}%`, inline: true },
                { name: '💰 Net Earnings', value: `${(stats.duelEarnings || 0).toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();
        
        if (totalDuels === 0) {
            embed.setDescription('You haven\'t completed any duels yet. Use `/duel challenge` to start dueling!');
        }
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Win Rate: ${winRate}%`,
            parseFloat(winRate) / 100,
            constants.COLORS.SUCCESS
        );

        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleLeaderboard(interaction) {
        const leaderboard = this.getDuelLeaderboard();
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.TROPHY} Duel Leaderboard`)
            .setDescription('Top duelists in VexiumVerse')
            .setColor(constants.COLORS.GOLD);
        
        if (leaderboard.length === 0) {
            embed.setDescription('No duel data yet. Be the first to start dueling!');
        } else {
            const leaderboardText = leaderboard.slice(0, 10).map((player, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                return `${medal} **${player.username}** - ${player.wins} wins (${player.winRate}%)`;
            }).join('\n');
            
            embed.addFields({
                name: '🏆 Top Duelists',
                value: leaderboardText,
                inline: false
            });
        }
        
        embed.setFooter({ text: 'Rankings based on wins and win rate' });
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async executeDuel(duel, interaction) {
        const challenger = new User(duel.challenger);
        const opponent = new User(duel.opponent);
        const challengerData = await challenger.load();
        const opponentData = await opponent.load();
        
        await challenger.removeVEX(duel.prizeAmount, 'duel_entry', false);
        await opponent.removeVEX(duel.prizeAmount, 'duel_entry', false);
        
        const result = this.playDuelGame(duel.type);
        const winner = result.winner === 'challenger' ? challenger : opponent;
        const loser = result.winner === 'challenger' ? opponent : challenger;
        const winnerData = result.winner === 'challenger' ? challengerData : opponentData;
        const loserData = result.winner === 'challenger' ? opponentData : challengerData;
        
        const totalPot = duel.prizeAmount * 2;
        const houseEdge = totalPot * 0.05;
        const winnings = totalPot - houseEdge;
        
        await winner.addVEX(winnings, 'duel_win');
        await winner.burnVEX(houseEdge, 'duel_house_edge');
        
        winnerData.stats.duelsWon = (winnerData.stats.duelsWon || 0) + 1;
        loserData.stats.duelsLost = (loserData.stats.duelsLost || 0) + 1;
        winnerData.stats.duelEarnings = (winnerData.stats.duelEarnings || 0) + (winnings - duel.prizeAmount);
        loserData.stats.duelEarnings = (loserData.stats.duelEarnings || 0) - duel.prizeAmount;
        
        await challenger.save(challengerData);
        await opponent.save(opponentData);
        
        const winnerUser = await interaction.client.users.fetch(winner.userId);
        const loserUser = await interaction.client.users.fetch(loser.userId);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SWORD} Duel Complete!`)
            .setDescription(result.description)
            .addFields(
                { name: '🏆 Winner', value: winnerUser.username, inline: true },
                { name: '💀 Loser', value: loserUser.username, inline: true },
                { name: '💰 Winnings', value: `${winnings.toFixed(2)} VEX`, inline: true },
                { name: '🎮 Game Result', value: result.details, inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        return { embed };
    },
    
    playDuelGame(type) {
        switch (type) {
            case 'rps':
                return this.playRockPaperScissors();
            case 'guess':
                return this.playNumberGuessing();
            case 'coinflip':
                return this.playCoinFlip();
            case 'dice':
                return this.playDiceRoll();
            default:
                return this.playRockPaperScissors();
        }
    },
    
    playRockPaperScissors() {
        const choices = ['rock', 'paper', 'scissors'];
        const challengerChoice = choices[Math.floor(Math.random() * 3)];
        const opponentChoice = choices[Math.floor(Math.random() * 3)];
        
        let winner;
        if (challengerChoice === opponentChoice) {
            winner = Math.random() < 0.5 ? 'challenger' : 'opponent';
        } else if (
            (challengerChoice === 'rock' && opponentChoice === 'scissors') ||
            (challengerChoice === 'paper' && opponentChoice === 'rock') ||
            (challengerChoice === 'scissors' && opponentChoice === 'paper')
        ) {
            winner = 'challenger';
        } else {
            winner = 'opponent';
        }
        
        return {
            winner,
            description: 'Rock Paper Scissors duel completed!',
            details: `Challenger: ${challengerChoice} | Opponent: ${opponentChoice}`
        };
    },
    
    playNumberGuessing() {
        const targetNumber = Math.floor(Math.random() * 100) + 1;
        const challengerGuess = Math.floor(Math.random() * 100) + 1;
        const opponentGuess = Math.floor(Math.random() * 100) + 1;
        
        const challengerDiff = Math.abs(targetNumber - challengerGuess);
        const opponentDiff = Math.abs(targetNumber - opponentGuess);
        
        const winner = challengerDiff < opponentDiff ? 'challenger' : 
                      opponentDiff < challengerDiff ? 'opponent' : 
                      Math.random() < 0.5 ? 'challenger' : 'opponent';
        
        return {
            winner,
            description: 'Number guessing duel completed!',
            details: `Target: ${targetNumber} | Challenger: ${challengerGuess} | Opponent: ${opponentGuess}`
        };
    },
    
    playCoinFlip() {
        const challengerCall = Math.random() < 0.5 ? 'heads' : 'tails';
        const opponentCall = challengerCall === 'heads' ? 'tails' : 'heads';
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        
        const winner = challengerCall === result ? 'challenger' : 'opponent';
        
        return {
            winner,
            description: 'Coin flip duel completed!',
            details: `Result: ${result} | Challenger called: ${challengerCall} | Opponent called: ${opponentCall}`
        };
    },
    
    playDiceRoll() {
        const challengerRoll = Math.floor(Math.random() * 6) + 1;
        const opponentRoll = Math.floor(Math.random() * 6) + 1;
        
        const winner = challengerRoll > opponentRoll ? 'challenger' : 
                      opponentRoll > challengerRoll ? 'opponent' : 
                      Math.random() < 0.5 ? 'challenger' : 'opponent';
        
        return {
            winner,
            description: 'Dice roll duel completed!',
            details: `Challenger rolled: ${challengerRoll} | Opponent rolled: ${opponentRoll}`
        };
    },
    
    generateDuelId() {
        return 'DUEL-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    },
    
    saveDuel(duel) {
        console.log('Duel saved:', duel.id);
    },
    
    getDuel(duelId) {
        return null;
    },
    
    deleteDuel(duelId) {
        console.log('Duel deleted:', duelId);
    },
    
    getUserPendingDuels(userId) {
        return [];
    },
    
    getDuelLeaderboard() {
        return [];
    },
    
    formatTimeLeft(milliseconds) {
        if (milliseconds <= 0) return 'Expired';
        
        const minutes = Math.floor(milliseconds / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
        
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }
};
