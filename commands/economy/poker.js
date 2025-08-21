const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poker')
        .setDescription(`🃏 Play skill-based Texas Hold'em poker tournaments for VEX prizes! 🔥 High-stakes competition aw...`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription(`🚀 Join a high-stakes poker tournament and compete for massive VEX prizes!`)
                .addStringOption(option =>
                    option.setName('tournament')
                        .setDescription(`✨ Choose your tournament level - bigger risks, bigger rewards!`)
                        .setRequired(true)
                        .addChoices(
                            { name: 'Micro Stakes ($10 buy-in)', value: 'micro' },
                            { name: 'Low Stakes ($50 buy-in)', value: 'low' },
                            { name: 'Mid Stakes ($200 buy-in)', value: 'mid' },
                            { name: 'High Stakes ($1000 buy-in)', value: 'high' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('tournaments')
                .setDescription(`📈 View active tournaments with live prize pools and player counts!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription(`🏆 View your poker performance stats and track your rise to the top!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription(`👑 See who dominates the poker tables - will you be next?`)),
    
    cooldown: 5,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'poker', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                pokerSkillLevel: userData.stats?.pokerWins || 0,
                competitiveSpirit: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'poker',
                behaviorContext
            );
        }
        
        const pokerStats = userData.stats || {};
        const tournamentsPlayed = pokerStats.pokerTournaments || 0;
        const isPokerPro = tournamentsPlayed >= 50;
        const isPokerNovice = tournamentsPlayed < 5;
        const recentWins = pokerStats.pokerWins || 0;
        const hotStreak = pokerStats.pokerStreak >= 3;
        
        const surpriseBonus = Math.random() < 0.1 ? Math.floor(Math.random() * 50) + 10 : 0;
        if (surpriseBonus > 0) {
            await user.addVEX(surpriseBonus, 'poker_engagement_bonus');
            Economics.updateVEXMarket('reward', surpriseBonus);
            userData.stats.surpriseBonuses = (userData.stats.surpriseBonuses || 0) + 1;
        }
        
        const activePlayers = Math.floor(Math.random() * 25) + 15;
        const bigWinnerToday = Math.floor(Math.random() * 5000) + 1000;
        
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
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'join':
                return this.handleJoin(interaction);
            case 'tournaments':
                return this.handleTournaments(interaction);
            case 'stats':
                return this.handleStats(interaction);
            case 'leaderboard':
                return this.handleLeaderboard(interaction);
        }
    },
    
    async handleJoin(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const tournamentType = interaction.options.getString('tournament');
        const tournament = constants.POKER_TOURNAMENTS[tournamentType.toUpperCase()];
        
        if (!tournament) {
            const nearMiss = constants.NEAR_MISS_MESSAGES[Math.floor(Math.random() * constants.NEAR_MISS_MESSAGES.length)];
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Invalid Tournament`)
                .setDescription(`❌ Please select a valid tournament type.\n\n🤔 **ALMOST THERE**: ${nearMiss}\n\n🚀 Try again - yo...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const pokerStats = userData.stats || {};
        const tournamentsPlayed = pokerStats.pokerTournaments || 0;
        const isPokerPro = tournamentsPlayed >= 50;
        const recentWins = pokerStats.pokerWins || 0;
        const hotStreak = pokerStats.pokerStreak >= 3;
        const urgencyBonus = Math.random() < 0.2 ? Math.floor(tournament.buyIn * 0.1) : 0;
        
        if (tournament.buyIn > userData.vexBalance) {
            const nearMiss = constants.NEAR_MISS_MESSAGES[Math.floor(Math.random() * constants.NEAR_MISS_MESSAGES.length)];
            const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 30) + 10);
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`💰 You need ${tournament.buyIn.toFixed(2)} VEX (~$${(tournament.buyIn * Economics.getCurrentVEXPrice()).toFixed(2)}) but only have ${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})....`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(tournament.buyIn, 'poker_tournament', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Registration Failed`)
                .setDescription(`${constants.ANIMATED_EMOJIS.ERROR} ${result.reason}\n\n${constants.ANIMATED_EMOJIS.THINKING} Don'...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        Economics.updateVEXMarket('buy', tournament.buyIn, interaction.user.id);
        
        const burnAmount = tournament.buyIn * constants.TAX_SYSTEM.POKER.RAKE_RATE;
        await user.burnVEX(burnAmount, 'poker_rake');
        
        const placement = this.simulateTournament(tournament);
        const prize = this.calculatePrize(tournament, placement);
        
        if (prize > 0) {
            await user.addVEX(prize, 'poker_prize');
            Economics.updateVEXMarket('reward', prize);
        }
        
        userData.stats.pokerTournaments = (userData.stats.pokerTournaments || 0) + 1;
        if (placement <= 3) {
            userData.stats.pokerWins = (userData.stats.pokerWins || 0) + 1;
        }
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Tournament Performance: ${placement}/${tournament.maxPlayers}`,
            Math.max(0, 1 - (placement / tournament.maxPlayers)),
            placement <= 3 ? constants.COLORS.SUCCESS : constants.COLORS.ERROR
        );

        const embed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.CELEBRATION} Poker Tournament Result`)
            .setDescription(`**${tournament.name}** tournament completed!`)
            .addFields(
                { name: '🏆 Final Placement', value: `${placement}/${tournament.maxPlayers}`, inline: true },
                { name: '💰 Buy-in', value: `${tournament.buyIn.toFixed(2)} VEX (~$${(tournament.buyIn * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '🎁 Prize Won', value: `${prize.toFixed(2)} VEX (~$${(prize * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '💸 Rake', value: `${burnAmount.toFixed(2)} VEX (~$${(burnAmount * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '📊 Net Result', value: `${prize - tournament.buyIn >= 0 ? '+' : ''}${(prize - tournament.buyIn).toFixed(2)} VEX (~$${((prize - tournament.buyIn) * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '💼 New Balance', value: `${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true }
            )
            .setColor(placement <= 3 ? constants.COLORS.SUCCESS : constants.COLORS.ERROR)
            .setImage('attachment://progress.png')
            .setFooter({ text: this.getPlacementMessage(placement) })
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleTournaments(interaction) {
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CARDS} Active Poker Tournaments`)
            .setDescription('Join a tournament and compete for VEX prizes!')
            .setColor(constants.COLORS.PRIMARY);
        
        for (const [tournamentId, tournament] of Object.entries(constants.POKER_TOURNAMENTS)) {
            const prizePool = tournament.buyIn * tournament.maxPlayers * (1 - constants.TAX_SYSTEM.POKER.RAKE_RATE);
            const firstPlace = prizePool * 0.5;
            
            embed.addFields({
                name: `${tournament.name}`,
                value: `**Buy-in**: ${tournament.buyIn.toFixed(2)} VEX (~$${(tournament.buyIn * Economics.getCurrentVEXPrice()).toFixed(2)})\n` +
                       `**Players**: ${tournament.maxPlayers}\n` +
                       `**Prize Pool**: ${prizePool.toFixed(2)} VEX (~$${(prizePool * Economics.getCurrentVEXPrice()).toFixed(2)})\n` +
                       `**1st Place**: ${firstPlace.toFixed(2)} VEX (~$${(firstPlace * Economics.getCurrentVEXPrice()).toFixed(2)})\n` +
                       `**Skill Level**: ${tournament.skillLevel}`,
                inline: true
            });
        }
        
        embed.setFooter({ text: 'Use /poker join <tournament> to enter!' });
        
        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('poker_join_micro')
                    .setLabel('Join Micro Stakes')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🎯'),
                new ButtonBuilder()
                    .setCustomId('poker_join_low')
                    .setLabel('Join Low Stakes')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🚀'),
                new ButtonBuilder()
                    .setCustomId('poker_join_high')
                    .setLabel('Join High Stakes')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('💎')
            );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [actionButtons] 
        });
    },
    
    async handleStats(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const stats = userData.stats;
        const tournaments = stats.pokerTournaments || 0;
        const wins = stats.pokerWins || 0;
        const winRate = tournaments > 0 ? (wins / tournaments * 100).toFixed(1) : '0.0';
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CARDS} Your Poker Statistics`)
            .setDescription('Your poker tournament performance')
            .addFields(
                { name: '🎯 Tournaments Played', value: `${tournaments}`, inline: true },
                { name: '🏆 Top 3 Finishes', value: `${wins}`, inline: true },
                { name: '📊 Win Rate', value: `${winRate}%`, inline: true },
                { name: '💰 Total Winnings', value: `${(stats.pokerWinnings || 0).toFixed(2)} VEX (~$${((stats.pokerWinnings || 0) * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '🎲 Best Finish', value: stats.pokerBestFinish ? `${stats.pokerBestFinish}` : 'N/A', inline: true },
                { name: '🔥 Current Streak', value: `${stats.pokerStreak || 0}`, inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();
        
        if (tournaments === 0) {
            embed.setDescription('You haven\'t played any poker tournaments yet. Use `/poker join` to get started!');
        }
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Poker Performance: ${winRate}% Win Rate`,
            Math.min(parseFloat(winRate) / 100, 1),
            constants.COLORS.VEX
        );
        
        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('poker_tournaments')
                    .setLabel('View Tournaments')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎯'),
                new ButtonBuilder()
                    .setCustomId('poker_leaderboard')
                    .setLabel('Leaderboard')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🏆')
            );
        
        await interaction.reply({ 
            embeds: [embed.setImage('attachment://progress.png')], 
            components: [actionButtons],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleLeaderboard(interaction) {
        const topPlayers = this.getTopPokerPlayers();
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.TROPHY} Poker Leaderboard`)
            .setDescription('Top poker tournament players')
            .setColor(constants.COLORS.GOLD);
        
        if (topPlayers.length === 0) {
            embed.setDescription('No poker players yet. Be the first to join a tournament!');
        } else {
            const leaderboardText = topPlayers.map((player, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                return `${medal} **${player.username}** - ${player.wins} wins (${player.winRate}%)`;
            }).join('\n');
            
            embed.addFields({
                name: '🏆 Top Players',
                value: leaderboardText,
                inline: false
            });
        }
        
        embed.setFooter({ text: 'Rankings based on tournament wins and win rate' });
        
        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('poker_tournaments')
                    .setLabel('View Tournaments')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎯'),
                new ButtonBuilder()
                    .setCustomId('poker_stats')
                    .setLabel('My Stats')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊')
            );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [actionButtons] 
        });
    },
    
    simulateTournament(tournament) {
        const skillFactor = Math.random();
        const luckFactor = Math.random();
        const combinedScore = (skillFactor * 0.7) + (luckFactor * 0.3);
        
        const placement = Math.floor((1 - combinedScore) * tournament.maxPlayers) + 1;
        return Math.min(placement, tournament.maxPlayers);
    },
    
    calculatePrize(tournament, placement) {
        const prizePool = tournament.buyIn * tournament.maxPlayers * (1 - constants.TAX_SYSTEM.POKER.RAKE_RATE);
        
        const prizeStructure = {
            1: 0.5,
            2: 0.3,
            3: 0.2
        };
        
        return prizePool * (prizeStructure[placement] || 0);
    },
    
    getPlacementMessage(placement) {
        if (placement === 1) return '🥇 Champion! Excellent play!';
        if (placement === 2) return '🥈 Runner-up! Great performance!';
        if (placement === 3) return '🥉 Third place! Well done!';
        if (placement <= 10) return '💪 Top 10 finish! Keep improving!';
        return '🎯 Better luck next time!';
    },
    
    getTopPokerPlayers() {
        return [];
    }
};
