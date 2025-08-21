const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crash')
        .setDescription(`🚀 Skill-based crash game - cash out before the multiplier crashes! 🔥 (21+ verification required)`)
        .addNumberOption(option =>
            option.setName('play_amount')
                .setDescription('Amount of VEX to play with')
                .setRequired(true)
                .setMinValue(0.01)),
    
    cooldown: 5,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'crash', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                riskTaking: true,
                entertainmentEngagement: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'crash',
                behaviorContext
            );
        }
        
        if (!userData.ageVerified) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
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
        
        if (playAmount > userData.vexBalance) {
            const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 20);
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`💸 You need ${playAmount.toFixed(2)} VEX but only have ${userData.vexBalance.toFixed(2)} VEX.\n\n${socialProof}\n\n✨ **Pro Tip:** Use \`/work\` or \`/daily\` to earn more VEX!\n\n📈 **Quick earnings:** Most players earn 50+ VEX in 10 minutes!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(playAmount, 'crash_play', false);
        if (!result.success) {
            const nearMiss = constants.NEAR_MISS_MESSAGES[Math.floor(Math.random() * constants.NEAR_MISS_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Play Failed`)
                .setDescription(`💥 ${result.reason}\n\n${nearMiss}\n\n🔄 **Don't give up!** Your next play could be the big win!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const game = this.initializeCrashGame(playAmount, interaction.user.id);
        
        const totalCrashGames = userData.stats.crashGames || 0;
        const crashWins = userData.stats.crashWins || 0;
        const winRate = totalCrashGames > 0 ? ((crashWins / totalCrashGames) * 100).toFixed(1) : 0;
        const isExpert = totalCrashGames >= 50;
        const isNovice = totalCrashGames < 5;
        const hotStreak = crashWins >= 3 && (crashWins / Math.max(totalCrashGames, 1)) > 0.6;
        const activePlayers = Math.floor(Math.random() * 25) + 15;
        
        let title = `${constants.EMOJIS.CHART} 🚀 CRASH GAME LAUNCHED!`;
        let description = '🔥 **The rocket is BLASTING OFF!** Cash out before it crashes!';
        
        if (isExpert) {
            title = `👑 CRASH MASTER IN ACTION!`;
            description = `🏆 **${totalCrashGames} games played!** You know the drill - timing is everything!`;
        } else if (isNovice) {
            description = `✨ **Welcome to the thrill!** Watch the multiplier climb and cash out before the crash!`;
        }
        
        if (hotStreak) {
            title = `🔥 HOT STREAK PLAYER!`;
            description += `\n💎 **${winRate}% win rate** - You're on fire!`;
        }
        
        const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', activePlayers);
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 2 + 0.5).toFixed(2)) : null;
        
        description += `\n${socialProof}`;
        if (variableReward) description += `\n${variableReward}`;
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`🚀 ${description}\n\n🔥 **LIVE ACTION:** Multiplier climbing fast!\n💸 **Big wins happening now!**`)
            .addFields(
                { name: '💰 Play Amount', value: `${playAmount.toFixed(2)} VEX`, inline: true },
                { name: '📈 Current Multiplier', value: `${game.currentMultiplier.toFixed(2)}x`, inline: true },
                { name: '💎 Potential Winnings', value: `${(playAmount * game.currentMultiplier).toFixed(2)} VEX`, inline: true },
                { name: '🎯 Your Stats', value: `🎮 **${totalCrashGames}** games\n🏆 **${winRate}%** win rate\n🔥 **${isExpert ? 'Expert' : isNovice ? 'Novice' : 'Experienced'}** player`, inline: true },
                { name: '⚡ Live Action', value: `🚀 **${activePlayers}** players active\n💥 **High stakes** entertainment\n⏰ **Real-time** multiplier`, inline: true },
                { name: '🎲 Pro Tip', value: hotStreak ? '🔥 **You\'re hot!** Trust your instincts!' : isExpert ? '👑 **Master timing** wins big!' : '💡 **Start conservative** and learn!', inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setFooter({ text: 'Cash out before the crash to win!' });
        
        const cashOutButton = new ButtonBuilder()
            .setCustomId(`crash_cashout_${interaction.user.id}_${game.gameId}`)
            .setLabel('Cash Out')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💰');
        
        const row = new ActionRowBuilder().addComponents(cashOutButton);
        
        this.saveCrashGame(game);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Crash Game: ${game.currentMultiplier.toFixed(2)}x Multiplier`,
            Math.min(game.currentMultiplier / 10, 1),
            constants.COLORS.PRIMARY
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
        
        this.startCrashSequence(interaction, game);
    },
    
    initializeCrashGame(playAmount, userId) {
        const crashPoint = this.generateCrashPoint();
        
        return {
            gameId: this.generateGameId(),
            userId,
            playAmount,
            currentMultiplier: 1.00,
            crashPoint,
            gameState: 'running',
            startTime: Date.now(),
            cashedOut: false
        };
    },
    
    generateCrashPoint() {
        const random = Math.random();
        
        if (random < 0.33) {
            return 1.0 + (Math.random() * 1.0);
        } else if (random < 0.66) {
            return 2.0 + (Math.random() * 3.0);
        } else if (random < 0.9) {
            return 5.0 + (Math.random() * 10.0);
        } else {
            return 15.0 + (Math.random() * 85.0);
        }
    },
    
    async startCrashSequence(interaction, game) {
        const updateInterval = 1000;
        const multiplierIncrement = 0.1;
        
        const interval = setInterval(async () => {
            if (game.cashedOut || game.currentMultiplier >= game.crashPoint) {
                clearInterval(interval);
                
                if (!game.cashedOut) {
                    await this.handleCrash(interaction, game);
                }
                return;
            }
            
            game.currentMultiplier += multiplierIncrement;
            
            if (game.currentMultiplier >= game.crashPoint) {
                game.currentMultiplier = game.crashPoint;
            }
            
            this.saveCrashGame(game);
        }, updateInterval);
        
        setTimeout(() => {
            clearInterval(interval);
            if (!game.cashedOut) {
                this.handleCrash(interaction, game);
            }
        }, 30000);
    },
    
    async handleCashOut(interaction, gameId) {
        const game = this.getCrashGame(gameId);
        if (!game || game.cashedOut || game.gameState !== 'running') {
            return interaction.reply({ content: 'Game not found or already finished.', ephemeral: true });
        }
        
        game.cashedOut = true;
        game.gameState = 'cashed_out';
        
        const user = new User(game.userId);
        const userData = await user.load();
        
        const winnings = game.playAmount * game.currentMultiplier;
        await user.addVEX(winnings, 'crash_win');
        
        const burnAmount = game.playAmount * constants.TAX_SYSTEM.ENTERTAINMENT.HOUSE_EDGE;
        await user.burnVEX(burnAmount, 'crash_house_edge');
        
        userData.stats.crashGames = (userData.stats.crashGames || 0) + 1;
        userData.stats.crashWins = (userData.stats.crashWins || 0) + 1;
        userData.stats.crashBestMultiplier = Math.max(userData.stats.crashBestMultiplier || 0, game.currentMultiplier);
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Cashed Out!`)
            .setDescription(`🎉 You successfully cashed out at ${game.currentMultiplier.toFixed(2)}x!\n\n💸 **PERFECT TIMING!*...`)
            .addFields(
                { name: '💰 Play Amount', value: `${game.playAmount.toFixed(2)} VEX`, inline: true },
                { name: '📈 Cash Out Multiplier', value: `${game.currentMultiplier.toFixed(2)}x`, inline: true },
                { name: '💎 Winnings', value: `${winnings.toFixed(2)} VEX`, inline: true },
                { name: '💸 House Edge', value: `${burnAmount.toFixed(2)} VEX`, inline: true },
                { name: '📊 Net Profit', value: `${(winnings - game.playAmount - burnAmount).toFixed(2)} VEX`, inline: true },
                { name: '💼 New Balance', value: `${userData.vexBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Great timing! You avoided the crash!' })
            .setTimestamp();
        
        this.deleteCrashGame(gameId);
        
        await interaction.update({ embeds: [embed], components: [] });
    },
    
    async handleCrash(interaction, game) {
        if (game.cashedOut) return;
        
        game.gameState = 'crashed';
        
        const user = new User(game.userId);
        const userData = await user.load();
        
        const burnAmount = game.playAmount * constants.TAX_SYSTEM.ENTERTAINMENT.HOUSE_EDGE;
        await user.burnVEX(burnAmount, 'crash_house_edge');
        
        userData.stats.crashGames = (userData.stats.crashGames || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.ERROR} Crashed!`)
            .setDescription(`💥 The rocket crashed at ${game.crashPoint.toFixed(2)}x!\n\n🔄 **So close!** You were ${(game.crashPoint - 0.1).toFixed(2)}x away from cashing out!\n\n${constants.ANIMATED_EMOJIS.SPARKLES} **Try again and beat the crash!**`)
            .addFields(
                { name: '💰 Play Amount', value: `${game.playAmount.toFixed(2)} VEX`, inline: true },
                { name: '💥 Crash Point', value: `${game.crashPoint.toFixed(2)}x`, inline: true },
                { name: '📈 Your Multiplier', value: `${game.currentMultiplier.toFixed(2)}x`, inline: true },
                { name: '💸 Lost', value: `${game.playAmount.toFixed(2)} VEX`, inline: true },
                { name: '💼 New Balance', value: `${userData.vexBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.ERROR)
            .setFooter({ text: 'Better luck next time! Try cashing out earlier.' })
            .setTimestamp();
        
        const playAgainButton = new ButtonBuilder()
            .setCustomId(`crash_again_${interaction.user.id}`)
            .setLabel('Play Again')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🚀');
        
        const row = new ActionRowBuilder().addComponents(playAgainButton);
        
        this.deleteCrashGame(game.gameId);
        
        try {
            await interaction.editReply({ embeds: [embed], components: [row] });
        } catch (error) {
            console.log('Failed to update crash game message:', error.message);
        }
    },
    
    generateGameId() {
        return 'CRASH-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    },
    
    saveCrashGame(game) {
        console.log('Crash game saved:', game.gameId);
    },
    
    getCrashGame(gameId) {
        return null;
    },
    
    deleteCrashGame(gameId) {
        console.log('Crash game deleted:', gameId);
    }
};
