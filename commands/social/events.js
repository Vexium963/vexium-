const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('events')
        .setDescription(`🔥 Join epic community events with massive rewards! Compete with thousands of players!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('active')
                .setDescription(`✨ See live events with limited-time rewards!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription(`🚀 Jump into the action and start earning exclusive rewards!`)
                .addStringOption(option =>
                    option.setName('event_id')
                        .setDescription('Event ID to join')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('progress')
                .setDescription(`📈 Track your domination across all active events!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription(`🏆 See who's crushing the competition and claim your spot!`)
                .addStringOption(option =>
                    option.setName('event_id')
                        .setDescription('Event ID to view leaderboard for')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('rewards')
                .setDescription(`💸 Cash in your hard-earned event victories!`)),
    
    cooldown: 5,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const eventUsage = userData.stats.eventsUsed || 0;
        const isEventExpert = eventUsage >= 20;
        const isEventNovice = eventUsage < 3;
        const recentEventActivity = Date.now() - (userData.lastEventActivity || 0) < 3600000;
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: recentEventActivity,
                quickReturn: eventUsage > 0 && Date.now() - (userData.lastEventActivity || 0) < 300000,
                timeSinceLastUse: userData.lastEventActivity || Date.now(),
                eventExpertise: isEventExpert,
                socialEngagement: true,
                competitiveSpirit: true
            };
            
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'events',
                behaviorContext
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(
                interaction.user.id,
                'events',
                true
            );
        }
        
        userData.stats.eventsUsed = eventUsage + 1;
        userData.lastEventActivity = Date.now();
        await user.save(userData);
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'active':
                return this.handleActive(interaction);
            case 'join':
                return this.handleJoin(interaction);
            case 'progress':
                return this.handleProgress(interaction);
            case 'leaderboard':
                return this.handleLeaderboard(interaction);
            case 'rewards':
                return this.handleRewards(interaction);
        }
    },
    
    async handleActive(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        const activeEvents = this.getActiveEvents();
        
        const totalParticipants = activeEvents.reduce((sum, event) => sum + event.participants, 0);
        const urgentEvents = activeEvents.filter(event => (event.endTime - Date.now()) < (24 * 60 * 60 * 1000));
        const isEventVeteran = (userData.stats?.eventsCompleted || 0) >= 5;
        
        let title = `${constants.EMOJIS.STAR} 🔥 LIVE EVENTS - ${totalParticipants.toLocaleString()} PLAYERS COMPETING!`;
        let description = '⚡ **MASSIVE REWARDS AVAILABLE!** Join thousands of players in epic challenges!';
        
        if (urgentEvents.length > 0) {
            title = `🚨 URGENT! ${urgentEvents.length} Events Ending Soon!`;
            description = '⏰ **LAST CHANCE!** These events end in less than 24 hours - don\'t miss out!';
        }
        
        if (isEventVeteran) {
            description += `\n👑 **VETERAN DETECTED!** You get priority access to exclusive rewards!`;
        }
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 300) + 100);
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 25 + 10).toFixed(2)) : null;
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`🔥 ${description}\n\n⏳ ${fomoMessage}\n🎉 ${socialProofMessage}${variableReward ? `\n💸 ${variableReward}` : ''}`)
            .setColor(urgentEvents.length > 0 ? constants.COLORS.ERROR : constants.COLORS.VEX);
        
        if (activeEvents.length === 0) {
            embed.setDescription(`⏳ No active events right now. ✨ Check back soon for new events with massive rewards!`);
        } else {
            for (const event of activeEvents) {
                const timeLeft = event.endTime - Date.now();
                const timeLeftStr = this.formatTimeLeft(timeLeft);
                
                embed.addFields({
                    name: `${event.icon} ${event.name} (${event.id})`,
                    value: `**Description**: ${event.description}\n` +
                           `**Type**: ${event.type}\n` +
                           `**Participants**: ${event.participants}\n` +
                           `**Time Left**: ${timeLeftStr}\n` +
                           `**Rewards**: ${event.rewards}`,
                    inline: false
                });
            }
        }
        
        const joinButton = new ButtonBuilder()
            .setCustomId(`events_join_${interaction.user.id}`)
            .setLabel('Join Event')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎯');
        
        const progressButton = new ButtonBuilder()
            .setCustomId(`events_progress_${interaction.user.id}`)
            .setLabel('My Progress')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📊');
        
        const row = new ActionRowBuilder().addComponents(joinButton, progressButton);
        
        embed.setFooter({ text: 'Use /events join <event_id> to participate!' });
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Active Events: ${activeEvents.length} Live`,
            activeEvents.length > 0 ? 0.8 : 0.2,
            urgentEvents.length > 0 ? constants.COLORS.ERROR : constants.COLORS.VEX
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
        
        const eventId = interaction.options.getString('event_id');
        const event = this.getEvent(eventId);
        
        if (!event) {
            const nearMissMessage = constants.NEAR_MISS_MESSAGES[Math.floor(Math.random() * constants.NEAR_MISS_MESSAGES.length)];
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Event Not Found`)
                .setDescription(`💥 Event **${eventId}** doesn't exist or has ended.\n\n🔥 ${nearMissMessage}`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (!userData.events) userData.events = {};
        
        if (userData.events[eventId]) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Already Participating`)
                .setDescription(`🎉 You're already dominating **${event.name}**! Keep pushing for those rewards!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (event.requirements && !this.meetsRequirements(userData, event.requirements)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Requirements Not Met`)
                .setDescription(`🔥 You don't meet the requirements for **${event.name}** yet. 🚀 Level up and come back stronger!`)
                .addFields({
                    name: '📋 Requirements',
                    value: this.formatRequirements(event.requirements),
                    inline: false
                })
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        userData.events[eventId] = {
            joinedAt: Date.now(),
            progress: 0,
            completed: false,
            rewardsClaimed: false
        };
        
        userData.stats.eventsJoined = (userData.stats.eventsJoined || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const milestoneMessage = constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 20);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Event Joined!`)
            .setDescription(`${constants.ANIMATED_EMOJIS.CELEBRATION} Successfully joined **${event.name}**!\n\n${constants.ANIMATED_EMOJIS.SPARKLES} **Get ready for an amazing experience!**\n\n${constants.ANIMATED_EMOJIS.FIRE} Event starts soon!`)
            .addFields(
                { name: '🎯 Event', value: event.name, inline: true },
                { name: '📝 Objective', value: event.objective, inline: true },
                { name: '🏆 Rewards', value: event.rewards, inline: true },
                { name: '⏰ Time Left', value: this.formatTimeLeft(event.endTime - Date.now()), inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Good luck! Check your progress with /events progress' })
            .setTimestamp();
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Event Progress: ${event.name}`,
            0.8,
            constants.COLORS.SUCCESS
        );

        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleProgress(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.events || Object.keys(userData.events).length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.STAR} Event Progress`)
                .setDescription('You\'re not participating in any events. Use `/events active` to see available events!')
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.STAR} Your Event Progress`)
            .setDescription('Track your progress across all active events')
            .setColor(constants.COLORS.PRIMARY);
        
        for (const [eventId, eventData] of Object.entries(userData.events)) {
            const event = this.getEvent(eventId);
            if (!event) continue;
            
            const progressPercent = Math.min((eventData.progress / event.target) * 100, 100);
            
            const status = eventData.completed ? '✅ Completed' : 
                          eventData.rewardsClaimed ? '🎁 Rewards Claimed' : 
                          '🔄 In Progress';
            
            embed.addFields({
                name: `${event.icon} ${event.name}`,
                value: `**Progress**: ${eventData.progress}/${event.target}\n` +
                       `**Completion**: ${progressPercent.toFixed(1)}%\n` +
                       `**Status**: ${status}\n` +
                       `**Time Left**: ${this.formatTimeLeft(event.endTime - Date.now())}`,
                inline: false
            });
        }
        
        embed.setFooter({ text: 'Keep participating to complete events and earn rewards!' });
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const totalEvents = Object.keys(userData.events).length;
        const completedEvents = Object.values(userData.events).filter(e => e.completed).length;
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Events Completed: ${completedEvents}/${totalEvents}`,
            totalEvents > 0 ? completedEvents / totalEvents : 0,
            constants.COLORS.PRIMARY
        );
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleLeaderboard(interaction) {
        const eventId = interaction.options.getString('event_id');
        const leaderboard = this.getEventLeaderboard(eventId);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.TROPHY} Event Leaderboard`)
            .setColor(constants.COLORS.GOLD);
        
        if (eventId) {
            const event = this.getEvent(eventId);
            if (!event) {
                embed.setDescription(`Event **${eventId}** not found.`);
            } else {
                embed.setDescription(`Leaderboard for **${event.name}**`);
                
                if (leaderboard.length === 0) {
                    embed.addFields({
                        name: '📊 No Participants Yet',
                        value: 'Be the first to join this event!',
                        inline: false
                    });
                } else {
                    const leaderboardText = leaderboard.slice(0, 10).map((entry, index) => {
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                        return `${medal} **${entry.username}** - ${entry.progress}/${event.target}`;
                    }).join('\n');
                    
                    embed.addFields({
                        name: '🏆 Top Participants',
                        value: leaderboardText,
                        inline: false
                    });
                }
            }
        } else {
            embed.setDescription('Overall event participation leaderboard');
            
            const overallLeaderboard = this.getOverallEventLeaderboard();
            if (overallLeaderboard.length === 0) {
                embed.addFields({
                    name: '📊 No Event Participants',
                    value: 'No one has participated in events yet!',
                    inline: false
                });
            } else {
                const leaderboardText = overallLeaderboard.slice(0, 10).map((entry, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                    return `${medal} **${entry.username}** - ${entry.eventsCompleted} events completed`;
                }).join('\n');
                
                embed.addFields({
                    name: '🏆 Top Event Participants',
                    value: leaderboardText,
                    inline: false
                });
            }
        }
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Event Leaderboard Rankings`,
            0.9,
            constants.COLORS.GOLD
        );
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleRewards(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.events) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.STAR} Event Rewards`)
                .setDescription('You haven\'t participated in any events yet.')
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        let totalRewards = 0;
        let claimedEvents = 0;
        const rewardDetails = [];
        
        for (const [eventId, eventData] of Object.entries(userData.events)) {
            const event = this.getEvent(eventId);
            if (!event || !eventData.completed || eventData.rewardsClaimed) continue;
            
            const reward = event.rewardAmount || Economics.getPeggedVEXPrice(5);
            totalRewards += reward;
            claimedEvents++;
            rewardDetails.push(`${event.icon} **${event.name}**: ${reward.toFixed(2)} VEX (~$${(reward * Economics.getCurrentVEXPrice()).toFixed(2)})`);
            
            eventData.rewardsClaimed = true;
        }
        
        if (totalRewards === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.STAR} Event Rewards`)
                .setDescription('No rewards available to claim. Complete events to earn rewards!')
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        await user.addVEX(totalRewards, 'event_rewards');
        Economics.apply({ event: 'reward', amountVEX: totalRewards, userId: interaction.user.id, meta: { command: 'events' } });
        
        userData.stats.eventRewardsClaimed = (userData.stats.eventRewardsClaimed || 0) + totalRewards;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const milestoneMessage = constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)];
        const variableReward = Math.random() < 0.3 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (totalRewards * 0.1).toFixed(2)) : null;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Event Rewards Claimed!`)
            .setDescription(`Successfully claimed rewards from ${claimedEvents} completed event${claimedEvents > 1 ? 's' : ''}!\n\n${milestoneMessage}${variableReward ? `\n${variableReward}` : ''}`)
            .addFields(
                { name: '🎁 Rewards Claimed', value: rewardDetails.join('\n'), inline: false },
                { name: '💰 Total Earned', value: `${totalRewards.toFixed(2)} VEX (~$${(totalRewards * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '💼 New Balance', value: `${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Keep participating in events for more rewards!' })
            .setTimestamp();
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Rewards Claimed: ${totalRewards.toFixed(2)} VEX (~$${(totalRewards * Economics.getCurrentVEXPrice()).toFixed(2)})`,
            1.0,
            constants.COLORS.SUCCESS
        );
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    getActiveEvents() {
        return [
            {
                id: 'daily_grind',
                name: 'Daily Grind Challenge',
                description: 'Complete 50 work sessions this week',
                type: 'Weekly',
                icon: '⚒️',
                participants: 1247,
                endTime: Date.now() + (5 * 24 * 60 * 60 * 1000),
                target: 50,
                objective: 'Complete work sessions',
                rewards: '$100 VEX + Exclusive Badge',
                rewardAmount: 100
            },
            {
                id: 'lucky_streak',
                name: 'Lucky Streak',
                description: 'Win 10 skill-based entertainment games in a row',
                type: 'Challenge',
                icon: '🎲',
                participants: 892,
                endTime: Date.now() + (3 * 24 * 60 * 60 * 1000),
                target: 10,
                objective: 'Win consecutive skill-based entertainment games',
                rewards: '$250 VEX + Lucky Charm',
                rewardAmount: 250
            }
        ];
    },
    
    getEvent(eventId) {
        const events = this.getActiveEvents();
        return events.find(event => event.id === eventId);
    },
    
    getEventLeaderboard(eventId) {
        return [];
    },
    
    getOverallEventLeaderboard() {
        return [];
    },
    
    meetsRequirements(userData, requirements) {
        if (requirements.minLevel && userData.level < requirements.minLevel) return false;
        if (requirements.minBalance && userData.vexBalance < requirements.minBalance) return false;
        return true;
    },
    
    formatRequirements(requirements) {
        const reqs = [];
        if (requirements.minLevel) reqs.push(`Level ${requirements.minLevel}+`);
        if (requirements.minBalance) reqs.push(`${requirements.minBalance.toFixed(2)} VEX (~$${(requirements.minBalance * Economics.getCurrentVEXPrice()).toFixed(2)}) balance`);
        return reqs.join('\n') || 'None';
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
    },
    
    createProgressBar(progress, length = 10) {
        const filled = Math.floor(progress * length);
        const empty = length - filled;
        
        return '█'.repeat(filled) + '░'.repeat(empty);
    }
};
