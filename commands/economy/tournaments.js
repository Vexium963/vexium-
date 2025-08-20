const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tournaments')
        .setDescription('Participate in skill-based entertainment tournaments for prizes')
        .addSubcommand(subcommand =>
            subcommand
                .setName('active')
                .setDescription('View currently active tournaments'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription('Join a tournament')
                .addStringOption(option =>
                    option.setName('tournament_id')
                        .setDescription('ID of the tournament to join')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a private tournament (Premium feature)')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Tournament name')
                        .setRequired(true)
                        .setMaxLength(50))
                .addStringOption(option =>
                    option.setName('game_type')
                        .setDescription('Type of skill-based game')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Slots Tournament', value: 'slots' },
                            { name: 'Blackjack Championship', value: 'blackjack' },
                            { name: 'Mixed Games', value: 'mixed' }))
                .addIntegerOption(option =>
                    option.setName('entry_fee')
                        .setDescription('Entry fee in VEX (minimum 100)')
                        .setRequired(true)
                        .setMinValue(100)
                        .setMaxValue(10000)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('View tournament leaderboard')
                .addStringOption(option =>
                    option.setName('tournament_id')
                        .setDescription('ID of the tournament')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription('View your tournament history and achievements')),
    
    cooldown: 10,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'tournaments', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now()
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'tournaments',
                behaviorContext
            );
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'active':
                return this.handleActive(interaction);
            case 'join':
                return this.handleJoin(interaction);
            case 'create':
                return this.handleCreate(interaction);
            case 'leaderboard':
                return this.handleLeaderboard(interaction);
            case 'history':
                return this.handleHistory(interaction);
        }
    },
    
    async handleActive(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        const activeTournaments = this.getActiveTournaments();
        
        const totalPrizePool = activeTournaments.reduce((sum, t) => sum + (t.entryFee * t.participants.length), 0);
        const isCompetitor = (userData.stats.tournamentsJoined || 0) >= 5;
        const isChampion = (userData.stats.tournamentsWon || 0) >= 3;
        const hotTournament = activeTournaments.find(t => t.participants.length >= t.maxPlayers * 0.8);
        
        let title = `${constants.EMOJIS.TOURNAMENT} Tournament Arena`;
        let description = `🏆 **COMPETE FOR GLORY!** ${activeTournaments.length} tournaments active!\n💰 **Total Prize Pool: $${totalPrizePool.toLocaleString()} VEX**`;
        
        if (isChampion) {
            title = `👑 CHAMPION'S ARENA!`;
            description = `🏆 **WELCOME BACK, CHAMPION!** ${activeTournaments.length} tournaments await your dominance!\n💎 **Total Prize Pool: $${totalPrizePool.toLocaleString()} VEX**`;
        } else if (isCompetitor) {
            title = `🔥 COMPETITOR'S BATTLEGROUND!`;
            description = `🏆 **SEASONED WARRIOR!** ${activeTournaments.length} tournaments ready for battle!\n💰 **Total Prize Pool: $${totalPrizePool.toLocaleString()} VEX**`;
        }
        
        if (hotTournament) {
            description += `\n🔥 **HOT TOURNAMENT:** ${hotTournament.name} is almost full!`;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description + `\n\n⚡ **"Champions are made in tournaments!"**`)
            .addFields(
                { name: '⚖️ Legal Notice', value: 'All tournaments feature skill-based entertainment games, not gambling', inline: false },
                { name: '🔞 Age Requirement', value: 'Must be 21+ and age verified to participate', inline: true },
                { name: '🏆 Prize Structure', value: 'Winners receive VEX tokens and exclusive achievements', inline: true }
            )
            .setColor(isChampion ? constants.COLORS.VEX : constants.COLORS.TOURNAMENT)
            .setFooter({ text: 'Tournament results are based on skill and strategy, not chance' })
            .setTimestamp();
        
        if (activeTournaments.length === 0) {
            embed.addFields({
                name: '📅 No Active Tournaments',
                value: 'Check back soon for new tournaments!\n\nPremium users can create private tournaments.',
                inline: false
            });
        } else {
            for (const tournament of activeTournaments) {
                const timeLeft = this.getTimeLeft(tournament.endsAt);
                const prizePool = tournament.entryFee * tournament.participants.length;
                
                embed.addFields({
                    name: `🏆 ${tournament.name}`,
                    value: `**ID**: ${tournament.id}\n**Game**: ${tournament.gameType}\n**Entry**: $${tournament.entryFee} VEX\n**Players**: ${tournament.participants.length}/${tournament.maxPlayers}\n**Prize Pool**: $${prizePool} VEX\n**Ends**: ${timeLeft}`,
                    inline: true
                });
            }
        }
        
        const joinButton = new ButtonBuilder()
            .setCustomId('tournaments_join_menu')
            .setLabel('Join Tournament')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎯');
        
        const createButton = new ButtonBuilder()
            .setCustomId('tournaments_create_menu')
            .setLabel('Create Tournament')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⚡');
        
        const historyButton = new ButtonBuilder()
            .setCustomId('tournaments_history')
            .setLabel('My History')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📊');
        
        const row = new ActionRowBuilder().addComponents(joinButton, createButton, historyButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleJoin(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.ageVerified) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Age Verification Required`)
                .setDescription('You must be 21+ and age verified to participate in tournaments.\n\nUse `/verify-age` to complete verification.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const tournamentId = interaction.options.getString('tournament_id');
        const activeTournaments = this.getActiveTournaments();
        const tournament = activeTournaments.find(t => t.id === tournamentId);
        
        if (!tournament) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Tournament Not Found`)
                .setDescription(`No active tournament found with ID: ${tournamentId}\n\nUse \`/tournaments active\` to see available tournaments.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (tournament.participants.includes(interaction.user.id)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Already Joined`)
                .setDescription(`You're already registered for **${tournament.name}**!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (tournament.participants.length >= tournament.maxPlayers) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Tournament Full`)
                .setDescription(`**${tournament.name}** is already at maximum capacity.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (userData.vexBalance < tournament.entryFee) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`Entry fee: $${tournament.entryFee} VEX\nYour balance: $${userData.vexBalance.toFixed(2)} VEX`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(tournament.entryFee, 'tournament_entry');
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Entry Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        tournament.participants.push(interaction.user.id);
        tournament.playerData[interaction.user.id] = {
            username: interaction.user.displayName,
            score: 0,
            gamesPlayed: 0,
            joinedAt: new Date().toISOString()
        };
        
        userData.stats.tournamentsJoined = (userData.stats.tournamentsJoined || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const prizePool = tournament.entryFee * tournament.participants.length;
        const timeLeft = this.getTimeLeft(tournament.endsAt);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Tournament Joined!`)
            .setDescription(`Welcome to **${tournament.name}**!`)
            .addFields(
                { name: '🏆 Tournament', value: tournament.name, inline: true },
                { name: '🎮 Game Type', value: tournament.gameType.charAt(0).toUpperCase() + tournament.gameType.slice(1), inline: true },
                { name: '💰 Entry Fee', value: `$${tournament.entryFee} VEX`, inline: true },
                { name: '👥 Players', value: `${tournament.participants.length}/${tournament.maxPlayers}`, inline: true },
                { name: '🏆 Prize Pool', value: `$${prizePool} VEX`, inline: true },
                { name: '⏰ Time Left', value: timeLeft, inline: true },
                { name: '📋 How to Play', value: `Use entertainment commands to earn points\nHighest score wins the tournament!`, inline: false },
                { name: '🏅 Prize Distribution', value: '🥇 1st: 50% of pool\n🥈 2nd: 30% of pool\n🥉 3rd: 20% of pool', inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `Tournament #${tournamentId} • Good luck!` })
            .setTimestamp();
        
        const playButton = new ButtonBuilder()
            .setCustomId(`tournament_play_${tournamentId}`)
            .setLabel('Start Playing')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎮');
        
        const leaderboardButton = new ButtonBuilder()
            .setCustomId(`tournament_leaderboard_${tournamentId}`)
            .setLabel('Leaderboard')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊');
        
        const row = new ActionRowBuilder().addComponents(playButton, leaderboardButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleCreate(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.premiumTier) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Premium Feature`)
                .setDescription('Creating tournaments requires Premium membership.\n\nUpgrade to Premium to unlock this feature!')
                .addFields(
                    { name: '💎 Premium Benefits', value: '• Create private tournaments\n• Custom prize pools\n• Exclusive tournament types\n• Priority support', inline: false }
                )
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const name = interaction.options.getString('name');
        const gameType = interaction.options.getString('game_type');
        const entryFee = interaction.options.getInteger('entry_fee');
        
        const creationCost = entryFee * 0.1; // 10% of entry fee to create
        
        if (userData.vexBalance < creationCost) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`Tournament creation fee: $${creationCost.toFixed(2)} VEX\nYour balance: $${userData.vexBalance.toFixed(2)} VEX`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(creationCost, 'tournament_creation');
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Creation Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const tournamentId = this.generateTournamentId();
        const tournament = {
            id: tournamentId,
            name: name,
            gameType: gameType,
            entryFee: entryFee,
            maxPlayers: 20,
            creator: interaction.user.id,
            creatorName: interaction.user.displayName,
            createdAt: new Date().toISOString(),
            endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            status: 'active',
            participants: [],
            playerData: {}
        };
        
        if (!global.customTournaments) global.customTournaments = [];
        global.customTournaments.push(tournament);
        
        userData.stats.tournamentsCreated = (userData.stats.tournamentsCreated || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Tournament Created!`)
            .setDescription(`**${name}** is now live and accepting players!`)
            .addFields(
                { name: '🆔 Tournament ID', value: tournamentId, inline: true },
                { name: '🎮 Game Type', value: gameType.charAt(0).toUpperCase() + gameType.slice(1), inline: true },
                { name: '💰 Entry Fee', value: `$${entryFee} VEX`, inline: true },
                { name: '👥 Max Players', value: '20', inline: true },
                { name: '⏰ Duration', value: '24 hours', inline: true },
                { name: '💸 Creation Fee', value: `$${creationCost.toFixed(2)} VEX`, inline: true },
                { name: '📢 Share Tournament', value: `Tell others to use:\n\`/tournaments join ${tournamentId}\``, inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `Tournament #${tournamentId} • You are the host` })
            .setTimestamp();
        
        const shareButton = new ButtonBuilder()
            .setCustomId(`tournament_share_${tournamentId}`)
            .setLabel('Share Tournament')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📢');
        
        const manageButton = new ButtonBuilder()
            .setCustomId(`tournament_manage_${tournamentId}`)
            .setLabel('Manage')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⚙️');
        
        const row = new ActionRowBuilder().addComponents(shareButton, manageButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleHistory(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.HISTORY} ${interaction.user.displayName}'s Tournament History`)
            .setDescription('Your tournament participation and achievements')
            .addFields(
                { name: '📊 Tournament Stats', value: `**Joined**: ${userData.stats.tournamentsJoined || 0}\n**Created**: ${userData.stats.tournamentsCreated || 0}\n**Won**: ${userData.stats.tournamentsWon || 0}\n**Top 3 Finishes**: ${userData.stats.tournamentPodiums || 0}`, inline: true },
                { name: '🏆 Best Results', value: `**Highest Finish**: ${userData.stats.bestTournamentRank || 'N/A'}\n**Biggest Win**: $${(userData.stats.biggestTournamentWin || 0).toFixed(2)}\n**Total Winnings**: $${(userData.stats.totalTournamentWinnings || 0).toFixed(2)}`, inline: true },
                { name: '🎮 Preferred Games', value: this.getPreferredGames(userData), inline: true }
            )
            .setColor(constants.COLORS.INFO)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: 'Tournament history and achievements' })
            .setTimestamp();
        
        if ((userData.stats.tournamentsJoined || 0) === 0) {
            embed.addFields({
                name: '🎯 Get Started!',
                value: 'Join your first tournament to start building your history!\n\nUse `/tournaments active` to see available tournaments.',
                inline: false
            });
        }
        
        const activeButton = new ButtonBuilder()
            .setCustomId('tournaments_active')
            .setLabel('Active Tournaments')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🏆');
        
        const achievementsButton = new ButtonBuilder()
            .setCustomId('achievements_tournaments')
            .setLabel('Tournament Achievements')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🏅');
        
        const row = new ActionRowBuilder().addComponents(activeButton, achievementsButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    getActiveTournaments() {
        return [
            {
                id: 'SLOTS001',
                name: 'Weekly Slots Championship',
                gameType: 'slots',
                entryFee: 500,
                maxPlayers: 50,
                participants: ['user1', 'user2', 'user3'],
                playerData: {},
                endsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'BJ002',
                name: 'Blackjack Masters',
                gameType: 'blackjack',
                entryFee: 1000,
                maxPlayers: 30,
                participants: ['user4', 'user5'],
                playerData: {},
                endsAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    },
    
    getTimeLeft(endTime) {
        const now = new Date();
        const end = new Date(endTime);
        const diff = end - now;
        
        if (diff <= 0) return 'Ended';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h`;
        }
        
        return `${hours}h ${minutes}m`;
    },
    
    generateTournamentId() {
        const prefix = ['TOUR', 'CHAMP', 'SKILL', 'ELITE'][Math.floor(Math.random() * 4)];
        const number = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${number}`;
    },
    
    getPreferredGames(userData) {
        const games = userData.stats.tournamentGames || {};
        const sorted = Object.entries(games).sort((a, b) => b[1] - a[1]);
        
        if (sorted.length === 0) return 'No preferences yet';
        
        return sorted.slice(0, 3).map(([game, count]) => `${game}: ${count}`).join('\n') || 'Getting started...';
    }
};
