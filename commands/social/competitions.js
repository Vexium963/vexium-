const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('competitions')
        .setDescription(`🔥 Dominate epic tournaments and claim massive VEX rewards!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('active')
                .setDescription(`🏆 See live tournaments with massive prize pools!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription(`🚀 Enter the arena and compete for glory!`)
                .addStringOption(option =>
                    option.setName('competition_id')
                        .setDescription('Competition ID to join')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('bracket')
                .setDescription(`📈 Track your path to victory in the tournament bracket!`)
                .addStringOption(option =>
                    option.setName('competition_id')
                        .setDescription('Competition ID to view bracket for')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription(`👑 See who dominates the competitive scene!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription(`🏅 Review your legendary tournament achievements!`)),
    
    cooldown: 5,
    
    async execute(interaction) {
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now()
            };
            
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'competitions',
                behaviorContext
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(
                interaction.user.id,
                'competitions',
                true
            );
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'active':
                return this.handleActive(interaction);
            case 'join':
                return this.handleJoin(interaction);
            case 'bracket':
                return this.handleBracket(interaction);
            case 'leaderboard':
                return this.handleLeaderboard(interaction);
            case 'history':
                return this.handleHistory(interaction);
        }
    },
    
    async handleActive(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        const activeCompetitions = this.getActiveCompetitions();
        
        const totalParticipants = activeCompetitions.reduce((sum, comp) => sum + comp.participants, 0);
        const isCompetitive = (userData.stats?.competitionsJoined || 0) >= 5;
        const hasWins = (userData.stats?.competitionWins || 0) > 0;
        const urgencyCount = activeCompetitions.filter(comp => 
            (comp.registrationEnd - Date.now()) < (24 * 60 * 60 * 1000)
        ).length;
        
        let title = `${constants.EMOJIS.TROPHY} LIVE TOURNAMENTS!`;
        let description = `🔥 **${totalParticipants} players competing RIGHT NOW!**\n⚡ **Join the battle and claim your glory!**`;
        
        if (urgencyCount > 0) {
            title = `🚨 URGENT: ${urgencyCount} Tournaments Closing Soon!`;
            description = `⏰ **LAST CHANCE!** ${urgencyCount} tournaments closing within 24 hours!\n💎 **Don't miss out on massive prize pools!**`;
        }
        
        if (isCompetitive) {
            title = `👑 CHAMPION'S ARENA - Active Tournaments`;
            description = `🏆 **Welcome back, competitor!** ${hasWins ? 'Defend your legacy!' : 'Time to claim your first victory!'}\n🔥 **${totalParticipants} rivals await your challenge!**`;
        }
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 20);
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        
        const enhancedDescription = description + `\n\n${fomoMessage}\n${socialProofMessage}` + (variableReward ? `\n${variableReward}` : '');
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`🔥 ${enhancedDescription} 🏆`)
            .setColor(urgencyCount > 0 ? constants.COLORS.ERROR : isCompetitive ? constants.COLORS.VEX : constants.COLORS.GOLD);
        
        if (activeCompetitions.length === 0) {
            embed.setDescription(`⏳ No active competitions right now. ✨ Check back soon for epic new tournaments with massive rewards!`);
        } else {
            for (const comp of activeCompetitions) {
                const timeLeft = comp.registrationEnd - Date.now();
                const timeLeftStr = this.formatTimeLeft(timeLeft);
                
                embed.addFields({
                    name: `${comp.icon} ${comp.name} (${comp.id})`,
                    value: `**Type**: ${comp.type}\n` +
                           `**Entry Fee**: $${comp.entryFee.toFixed(2)} VEX\n` +
                           `**Prize Pool**: $${comp.prizePool.toFixed(2)} VEX\n` +
                           `**Participants**: ${comp.participants}/${comp.maxParticipants}\n` +
                           `**Registration Ends**: ${timeLeftStr}`,
                    inline: true
                });
            }
        }
        
        const joinButton = new ButtonBuilder()
            .setCustomId(`competitions_join_${interaction.user.id}`)
            .setLabel('Join Competition')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🏆');
        
        const leaderboardButton = new ButtonBuilder()
            .setCustomId(`competitions_leaderboard_${interaction.user.id}`)
            .setLabel('Leaderboards')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📊');
        
        const row = new ActionRowBuilder().addComponents(joinButton, leaderboardButton);
        
        embed.setFooter({ text: 'Use /competitions join <competition_id> to enter!' });
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Active Tournaments: ${activeCompetitions.length} competitions`,
            activeCompetitions.length / 10,
            constants.COLORS.GOLD
        );

        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleJoin(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const competitionId = interaction.options.getString('competition_id');
        const competition = this.getCompetition(competitionId);
        
        if (!competition) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Competition Not Found`)
                .setDescription(`❌ Competition **${competitionId}** doesn't exist. 🔍 Use \`/competitions active\` to see available tournaments!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (Date.now() > competition.registrationEnd) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Registration Closed`)
                .setDescription(`⏰ Registration for **${competition.name}** has ended. 🔥 Don't miss the next tournament - stay al...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (competition.participants >= competition.maxParticipants) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Competition Full`)
                .setDescription(`🚫 **${competition.name}** is at maximum capacity! 🚀 Join the next tournament faster to secure y...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (!userData.competitions) userData.competitions = {};
        
        if (userData.competitions[competitionId]) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Already Registered`)
                .setDescription(`✅ You're already registered for **${competition.name}**! 🏆 Get ready to dominate the competition!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (competition.entryFee > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`💰 Entry fee is $${competition.entryFee.toFixed(2)} VEX but you only have $${userData.vexBalance.toFixed(2)}. ⚒️ Earn more VEX with \`/work\` or \`/daily\` to join this epic tournament!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(competition.entryFee, 'competition_entry', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Registration Failed`)
                .setDescription(`❌ ${result.reason} 🔄 Please try again or contact support!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        userData.competitions[competitionId] = {
            registeredAt: Date.now(),
            entryFeePaid: competition.entryFee,
            status: 'registered',
            score: 0,
            placement: null
        };
        
        userData.stats.competitionsJoined = (userData.stats.competitionsJoined || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const milestoneMessage = constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)];
        const competitorCount = Math.floor(Math.random() * 30) + 15;
        const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', competitorCount);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Competition Progress: Registered for ${competition.name}`,
            0.25,
            constants.COLORS.SUCCESS
        );

        const embed = new EmbedBuilder()
            .setTitle(`🎉 Registration Successful!`)
            .setDescription(`🎉 Successfully registered for **${competition.name}**! 🔥\n\n${milestoneMessage}\n${socialProof} 🚀`)
            .addFields(
                { name: '🏆 Competition', value: competition.name, inline: true },
                { name: '💰 Entry Fee', value: `$${competition.entryFee.toFixed(2)} VEX`, inline: true },
                { name: '🎁 Prize Pool', value: `$${competition.prizePool.toFixed(2)} VEX`, inline: true },
                { name: '📅 Start Date', value: `<t:${Math.floor(competition.startTime / 1000)}:F>`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setImage('attachment://progress.png')
            .setFooter({ text: 'Good luck in the competition!' })
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleBracket(interaction) {
        const competitionId = interaction.options.getString('competition_id');
        const competition = this.getCompetition(competitionId);
        
        if (!competition) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Competition Not Found`)
                .setDescription(`❌ Competition **${competitionId}** doesn't exist. 🔍 Use \`/competitions active\` to see available tournaments!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const bracket = this.getCompetitionBracket(competitionId);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.TROPHY} ${competition.name} - Tournament Bracket`)
            .setDescription(`📈 Current tournament bracket and epic matchups! 🔥 Track your path to victory!`)
            .setColor(constants.COLORS.GOLD);
        
        if (bracket.length === 0) {
            embed.addFields({
                name: '📋 Bracket Status',
                value: 'Tournament bracket will be generated when registration closes.',
                inline: false
            });
        } else {
            for (const round of bracket) {
                const matchups = round.matches.map(match => 
                    `**${match.player1}** vs **${match.player2}** ${match.winner ? `(Winner: ${match.winner})` : '(Pending)'}`
                ).join('\n');
                
                embed.addFields({
                    name: `🏆 ${round.name}`,
                    value: matchups,
                    inline: false
                });
            }
        }
        
        embed.setFooter({ text: 'Brackets update as matches are completed' });
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Tournament Bracket: ${competition.name}`,
            bracket.length > 0 ? 0.75 : 0.25,
            constants.COLORS.GOLD
        );

        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleLeaderboard(interaction) {
        const leaderboard = this.getCompetitionLeaderboard();
        
        const activeCompetitors = Math.floor(Math.random() * 100) + 50;
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', activeCompetitors);
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.TROPHY} Competition Leaderboard`)
            .setDescription(`👑 Top competitive legends across all tournaments! 🏆\n\n${socialProofMessage}\n${fomoMessage} 🔥`)
            .setColor(constants.COLORS.GOLD);
        
        if (leaderboard.length === 0) {
            embed.setDescription(`🚀 No competition data yet. 👑 Be the first legend to join a tournament and claim your place in h...`);
        } else {
            const leaderboardText = leaderboard.slice(0, 10).map((player, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                return `${medal} **${player.username}** - ${player.wins} wins, ${player.totalEarnings.toFixed(2)} VEX earned`;
            }).join('\n');
            
            embed.addFields({
                name: '🏆 Top Competitors',
                value: leaderboardText,
                inline: false
            });
        }
        
        embed.setFooter({ text: 'Rankings based on tournament wins and earnings' });
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Competition Leaderboard: Top ${leaderboard.length} players`,
            Math.min(leaderboard.length / 50, 1),
            constants.COLORS.GOLD
        );

        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleHistory(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.competitions || Object.keys(userData.competitions).length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.TROPHY} Competition History`)
                .setDescription(`🚀 You haven't participated in any competitions yet! 🔥 Use \`/competitions active\` to see epic tournaments and start your legendary journey!`)
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.TROPHY} Your Competition History`)
            .setDescription(`🏅 Your legendary performance across all epic competitions! 📈 Track your rise to greatness!`)
            .setColor(constants.COLORS.PRIMARY)
            .setThumbnail(interaction.user.displayAvatarURL());
        
        const stats = userData.stats;
        const totalCompetitions = stats.competitionsJoined || 0;
        const totalWins = stats.competitionWins || 0;
        const totalEarnings = stats.competitionEarnings || 0;
        const winRate = totalCompetitions > 0 ? (totalWins / totalCompetitions * 100).toFixed(1) : '0.0';
        
        embed.addFields(
            { name: '🏆 Competitions Joined', value: `${totalCompetitions}`, inline: true },
            { name: '🥇 Wins', value: `${totalWins}`, inline: true },
            { name: '📊 Win Rate', value: `${winRate}%`, inline: true },
            { name: '💰 Total Earnings', value: `$${totalEarnings.toFixed(2)} VEX`, inline: true },
            { name: '🏅 Best Placement', value: stats.bestCompetitionPlacement || 'N/A', inline: true },
            { name: '🔥 Current Streak', value: `${stats.competitionStreak || 0}`, inline: true }
        );
        
        const recentCompetitions = Object.entries(userData.competitions).slice(-3).map(([compId, compData]) => {
            const competition = this.getCompetition(compId);
            const placementText = compData.placement ? `#${compData.placement}` : 'In Progress';
            return `**${competition?.name || compId}** - ${placementText}`;
        }).join('\n');
        
        if (recentCompetitions) {
            embed.addFields({
                name: '📋 Recent Competitions',
                value: recentCompetitions,
                inline: false
            });
        }
        
        embed.setFooter({ text: 'Keep competing to improve your stats!' });
        
        await interaction.reply({ embeds: [embed] });
    },
    
    getActiveCompetitions() {
        return [
            {
                id: 'weekly_grind',
                name: 'Weekly Grind Championship',
                type: 'Work Competition',
                icon: '⚒️',
                entryFee: 25.0,
                prizePool: 1000.0,
                participants: 47,
                maxParticipants: 64,
                registrationEnd: Date.now() + (2 * 24 * 60 * 60 * 1000),
                startTime: Date.now() + (3 * 24 * 60 * 60 * 1000)
            },
            {
                id: 'poker_masters',
                name: 'Poker Masters Tournament',
                type: 'Poker Tournament',
                icon: '🃏',
                entryFee: 100.0,
                prizePool: 2500.0,
                participants: 23,
                maxParticipants: 32,
                registrationEnd: Date.now() + (1 * 24 * 60 * 60 * 1000),
                startTime: Date.now() + (2 * 24 * 60 * 60 * 1000)
            }
        ];
    },
    
    getCompetition(competitionId) {
        const competitions = this.getActiveCompetitions();
        return competitions.find(comp => comp.id === competitionId);
    },
    
    getCompetitionBracket(competitionId) {
        return [];
    },
    
    getCompetitionLeaderboard() {
        return [];
    },
    
    formatTimeLeft(milliseconds) {
        if (milliseconds <= 0) return 'Ended';
        
        const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
        const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) {
            return `${days}d ${hours}h`;
        } else {
            return `${hours}h`;
        }
    }
};
