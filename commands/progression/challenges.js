const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('challenges')
        .setDescription('Complete daily and weekly challenges for bonus rewards')
        .addSubcommand(subcommand =>
            subcommand
                .setName('daily')
                .setDescription('View and complete daily challenges'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('weekly')
                .setDescription('View and complete weekly challenges'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('progress')
                .setDescription('Check your challenge completion progress'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('Claim rewards for completed challenges')
                .addStringOption(option =>
                    option.setName('challenge_id')
                        .setDescription('ID of the challenge to claim')
                        .setRequired(true))),
    
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
                interaction.commandName,
                behaviorContext
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(
                interaction.user.id,
                interaction.commandName,
                true
            );
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'daily':
                return this.handleDaily(interaction);
            case 'weekly':
                return this.handleWeekly(interaction);
            case 'progress':
                return this.handleProgress(interaction);
            case 'claim':
                return this.handleClaim(interaction);
        }
    },
    
    async handleDaily(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const dailyChallenges = this.getDailyChallenges(userData);
        const completedCount = dailyChallenges.filter(c => c.completed).length;
        const totalRewards = dailyChallenges.reduce((sum, c) => sum + (c.completed && !c.claimed ? c.reward : 0), 0);
        
        const completionRate = (completedCount / dailyChallenges.length) * 100;
        const isChallengeMaster = completionRate >= 75;
        const hasUnclaimed = totalRewards > 0;
        const streakBonus = userData.stats.challengeStreak >= 7 ? 1.5 : 1.0;
        
        let title = `${constants.EMOJIS.CHALLENGES} Daily Challenge Arena`;
        let description = `🎯 **Complete challenges to dominate the leaderboard!**\n\n📊 **Progress**: ${completedCount}/${dailyChallenges.length} completed (${completionRate.toFixed(1)}%)`;
        
        if (isChallengeMaster) {
            title = `🔥 CHALLENGE DOMINATOR!`;
            description = `👑 **INCREDIBLE!** You're crushing ${completionRate.toFixed(1)}% of today's challenges!\n🏆 **You're in the top 5% of challenge completers!**`;
        }
        
        if (hasUnclaimed) {
            description += `\n\n💰 **URGENT:** $${totalRewards.toFixed(2)} VEX waiting to be claimed!`;
        }
        
        const timeLeft = this.getTimeUntilMidnight();
        const urgencyMessage = timeLeft < 3 ? '⚠️ **HURRY!** Challenges reset soon!' : `⏰ **${timeLeft}h remaining** to complete!`;
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description + `\n\n${urgencyMessage}`)
            .setColor(isChallengeMaster ? constants.COLORS.VEX : hasUnclaimed ? constants.COLORS.SUCCESS : constants.COLORS.PRIMARY)
            .setFooter({ text: 'Daily challenges = Daily rewards! Don\'t miss out!' })
            .setTimestamp();
        
        for (const challenge of dailyChallenges) {
            const status = challenge.completed ? (challenge.claimed ? '✅ Claimed' : '🎁 Ready to Claim') : `📊 ${challenge.progress}/${challenge.target}`;
            const reward = `$${challenge.reward.toFixed(2)} VEX + ${challenge.xp} XP`;
            
            embed.addFields({
                name: `${challenge.emoji} ${challenge.name}`,
                value: `${challenge.description}\n**Reward**: ${reward}\n**Status**: ${status}`,
                inline: true
            });
        }
        
        if (totalRewards > 0) {
            embed.addFields({
                name: '💰 Unclaimed Rewards',
                value: `$${totalRewards.toFixed(2)} VEX available to claim!`,
                inline: false
            });
        }
        
        const claimButton = new ButtonBuilder()
            .setCustomId('challenges_claim_daily')
            .setLabel(`Claim All (${totalRewards.toFixed(0)} VEX)`)
            .setStyle(ButtonStyle.Success)
            .setEmoji('💰')
            .setDisabled(totalRewards === 0);
        
        const weeklyButton = new ButtonBuilder()
            .setCustomId('challenges_weekly')
            .setLabel('Weekly Challenges')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📅');
        
        const progressButton = new ButtonBuilder()
            .setCustomId('challenges_progress')
            .setLabel('View Progress')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📊');
        
        const row = new ActionRowBuilder().addComponents(claimButton, weeklyButton, progressButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleWeekly(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const weeklyChallenges = this.getWeeklyChallenges(userData);
        const completedCount = weeklyChallenges.filter(c => c.completed).length;
        const totalRewards = weeklyChallenges.reduce((sum, c) => sum + (c.completed && !c.claimed ? c.reward : 0), 0);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CHALLENGES} Weekly Challenges`)
            .setDescription(`Bigger challenges, bigger rewards!\n\n**Progress**: ${completedCount}/${weeklyChallenges.length} completed`)
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Weekly challenges reset every Monday • Higher difficulty, higher rewards!' })
            .setTimestamp();
        
        for (const challenge of weeklyChallenges) {
            const status = challenge.completed ? (challenge.claimed ? '✅ Claimed' : '🎁 Ready to Claim') : `📊 ${challenge.progress}/${challenge.target}`;
            const reward = `$${challenge.reward.toFixed(2)} VEX + ${challenge.xp} XP`;
            const progressBar = this.createProgressBar(challenge.progress, challenge.target);
            
            embed.addFields({
                name: `${challenge.emoji} ${challenge.name}`,
                value: `${challenge.description}\n${progressBar}\n**Reward**: ${reward}\n**Status**: ${status}`,
                inline: false
            });
        }
        
        if (totalRewards > 0) {
            embed.addFields({
                name: '💎 Unclaimed Weekly Rewards',
                value: `$${totalRewards.toFixed(2)} VEX + bonus XP available!`,
                inline: false
            });
        }
        
        const claimButton = new ButtonBuilder()
            .setCustomId('challenges_claim_weekly')
            .setLabel(`Claim All (${totalRewards.toFixed(0)} VEX)`)
            .setStyle(ButtonStyle.Success)
            .setEmoji('💎')
            .setDisabled(totalRewards === 0);
        
        const dailyButton = new ButtonBuilder()
            .setCustomId('challenges_daily')
            .setLabel('Daily Challenges')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📅');
        
        const row = new ActionRowBuilder().addComponents(claimButton, dailyButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleProgress(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const dailyChallenges = this.getDailyChallenges(userData);
        const weeklyChallenges = this.getWeeklyChallenges(userData);
        
        const dailyCompleted = dailyChallenges.filter(c => c.completed).length;
        const weeklyCompleted = weeklyChallenges.filter(c => c.completed).length;
        
        const totalChallengesCompleted = (userData.stats.challengesCompleted || 0);
        const challengeStreak = (userData.stats.challengeStreak || 0);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.PROGRESS} Challenge Progress`)
            .setDescription(`Track your challenge completion and streaks`)
            .addFields(
                { name: '📅 Daily Progress', value: `${dailyCompleted}/${dailyChallenges.length} completed\n${this.createProgressBar(dailyCompleted, dailyChallenges.length)}`, inline: true },
                { name: '📊 Weekly Progress', value: `${weeklyCompleted}/${weeklyChallenges.length} completed\n${this.createProgressBar(weeklyCompleted, weeklyChallenges.length)}`, inline: true },
                { name: '🏆 Overall Stats', value: `**Total Completed**: ${totalChallengesCompleted}\n**Current Streak**: ${challengeStreak} days\n**Best Streak**: ${userData.stats.bestChallengeStreak || 0}`, inline: true },
                { name: '💰 Rewards Earned', value: `**This Week**: $${(userData.stats.weeklyRewards || 0).toFixed(2)}\n**All Time**: $${(userData.stats.totalChallengeRewards || 0).toFixed(2)}`, inline: true },
                { name: '📈 Performance', value: `**Completion Rate**: ${this.getCompletionRate(userData)}%\n**Avg Daily**: ${this.getAvgDaily(userData)}\n**Rank**: ${this.getChallengeRank(userData)}`, inline: true },
                { name: '🎯 Next Milestone', value: this.getNextMilestone(totalChallengesCompleted), inline: true }
            )
            .setColor(constants.COLORS.INFO)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: 'Keep completing challenges to maintain your streak!' })
            .setTimestamp();
        
        const viewButton = new ButtonBuilder()
            .setCustomId('challenges_view_all')
            .setLabel('View All Challenges')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📋');
        
        const leaderboardButton = new ButtonBuilder()
            .setCustomId('challenges_leaderboard')
            .setLabel('Challenge Leaderboard')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🏅');
        
        const row = new ActionRowBuilder().addComponents(viewButton, leaderboardButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleClaim(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const challengeId = interaction.options.getString('challenge_id');
        const allChallenges = [...this.getDailyChallenges(userData), ...this.getWeeklyChallenges(userData)];
        const challenge = allChallenges.find(c => c.id === challengeId);
        
        if (!challenge) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Challenge Not Found`)
                .setDescription(`No challenge found with ID: ${challengeId}`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (!challenge.completed) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Challenge Not Completed`)
                .setDescription(`You haven't completed this challenge yet!\n\n**Progress**: ${challenge.progress}/${challenge.target}`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (challenge.claimed) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Already Claimed`)
                .setDescription('You have already claimed this challenge reward.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        await user.addVEX(challenge.reward, 'challenge_reward');
        userData.xp += challenge.xp;
        
        challenge.claimed = true;
        userData.stats.challengesCompleted = (userData.stats.challengesCompleted || 0) + 1;
        userData.stats.totalChallengeRewards = (userData.stats.totalChallengeRewards || 0) + challenge.reward;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Challenge Reward Claimed!`)
            .setDescription(`**${challenge.name}** reward claimed successfully!`)
            .addFields(
                { name: '💰 VEX Reward', value: `$${challenge.reward.toFixed(2)}`, inline: true },
                { name: '⭐ XP Reward', value: `${challenge.xp} XP`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)}`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Keep completing challenges for more rewards!' })
            .setTimestamp();
        
        const moreButton = new ButtonBuilder()
            .setCustomId('challenges_daily')
            .setLabel('More Challenges')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎯');
        
        const progressButton = new ButtonBuilder()
            .setCustomId('challenges_progress')
            .setLabel('View Progress')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📊');
        
        const row = new ActionRowBuilder().addComponents(moreButton, progressButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    getDailyChallenges(userData) {
        const stats = userData.stats || {};
        
        return [
            {
                id: 'daily_commands',
                name: 'Command Master',
                description: 'Use 10 different commands',
                emoji: '⚡',
                target: 10,
                progress: Math.min(stats.commandsToday || 0, 10),
                completed: (stats.commandsToday || 0) >= 10,
                claimed: userData.dailyChallenges?.daily_commands?.claimed || false,
                reward: 100,
                xp: 50
            },
            {
                id: 'daily_work',
                name: 'Hard Worker',
                description: 'Complete 3 work sessions',
                emoji: '💼',
                target: 3,
                progress: Math.min(stats.workToday || 0, 3),
                completed: (stats.workToday || 0) >= 3,
                claimed: userData.dailyChallenges?.daily_work?.claimed || false,
                reward: 150,
                xp: 75
            },
            {
                id: 'daily_entertainment',
                name: 'Entertainment Enthusiast',
                description: 'Play 5 entertainment games',
                emoji: '🎮',
                target: 5,
                progress: Math.min(stats.entertainmentToday || 0, 5),
                completed: (stats.entertainmentToday || 0) >= 5,
                claimed: userData.dailyChallenges?.daily_entertainment?.claimed || false,
                reward: 200,
                xp: 100
            },
            {
                id: 'daily_social',
                name: 'Social Butterfly',
                description: 'Send 2 gifts or complete 1 trade',
                emoji: '👥',
                target: 1,
                progress: Math.min((stats.giftsToday || 0) + (stats.tradesToday || 0), 1),
                completed: ((stats.giftsToday || 0) + (stats.tradesToday || 0)) >= 1,
                claimed: userData.dailyChallenges?.daily_social?.claimed || false,
                reward: 125,
                xp: 60
            }
        ];
    },
    
    getWeeklyChallenges(userData) {
        const stats = userData.stats || {};
        
        return [
            {
                id: 'weekly_wealth',
                name: 'Wealth Builder',
                description: 'Accumulate 10,000 VEX net worth',
                emoji: '💎',
                target: 10000,
                progress: Math.min(userData.networth || 0, 10000),
                completed: (userData.networth || 0) >= 10000,
                claimed: userData.weeklyChallenges?.weekly_wealth?.claimed || false,
                reward: 1000,
                xp: 500
            },
            {
                id: 'weekly_streak',
                name: 'Consistency King',
                description: 'Maintain 7-day daily reward streak',
                emoji: '🔥',
                target: 7,
                progress: Math.min(userData.dailyStreak || 0, 7),
                completed: (userData.dailyStreak || 0) >= 7,
                claimed: userData.weeklyChallenges?.weekly_streak?.claimed || false,
                reward: 750,
                xp: 400
            },
            {
                id: 'weekly_entertainment',
                name: 'Entertainment Master',
                description: 'Win 20 entertainment games',
                emoji: '🏆',
                target: 20,
                progress: Math.min(stats.entertainmentWinsWeek || 0, 20),
                completed: (stats.entertainmentWinsWeek || 0) >= 20,
                claimed: userData.weeklyChallenges?.weekly_entertainment?.claimed || false,
                reward: 1250,
                xp: 600
            }
        ];
    },
    
    createProgressBar(current, max, length = 10) {
        const percentage = Math.min(current / max, 1);
        const filled = Math.floor(percentage * length);
        const empty = length - filled;
        
        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${current}/${max}`;
    },
    
    getCompletionRate(userData) {
        const completed = userData.stats.challengesCompleted || 0;
        const attempted = Math.max(completed, 1);
        return Math.round((completed / attempted) * 100);
    },
    
    getAvgDaily(userData) {
        const days = Math.max(1, Math.floor((Date.now() - new Date(userData.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));
        const completed = userData.stats.challengesCompleted || 0;
        return (completed / days).toFixed(1);
    },
    
    getChallengeRank(userData) {
        const completed = userData.stats.challengesCompleted || 0;
        if (completed >= 100) return 'Master';
        if (completed >= 50) return 'Expert';
        if (completed >= 25) return 'Advanced';
        if (completed >= 10) return 'Intermediate';
        return 'Beginner';
    },
    
    getNextMilestone(completed) {
        const milestones = [10, 25, 50, 100, 250, 500, 1000];
        const next = milestones.find(m => m > completed);
        return next ? `${next} challenges (${next - completed} to go)` : 'All milestones reached!';
    }
};
