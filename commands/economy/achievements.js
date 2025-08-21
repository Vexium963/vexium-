const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('achievements')
        .setDescription(`🏆 Unlock legendary achievements and become a VexiumVerse legend!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription(`✨ Browse all epic achievements waiting to be conquered!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('progress')
                .setDescription(`📊 Track your journey to becoming a VexiumVerse champion!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('showcase')
                .setDescription(`🎉 Show off your most prestigious achievements to the world!`)
                .addStringOption(option =>
                    option.setName('achievement_id')
                        .setDescription(`🔥 Choose your most impressive achievement to display!`)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription(`${constants.ANIMATED_EMOJIS.LEADERBOARD} See who dominates the achievement rankings!`)),
    
    cooldown: 10,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'achievements', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now()
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'achievements',
                behaviorContext
            );
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'list':
                return this.handleList(interaction);
            case 'progress':
                return this.handleProgress(interaction);
            case 'showcase':
                return this.handleShowcase(interaction);
            case 'leaderboard':
                return this.handleLeaderboard(interaction);
        }
    },
    
    async handleList(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const allAchievements = this.getAllAchievements();
        const userAchievements = userData.achievements || [];
        const completedIds = userAchievements.map(a => a.id);
        
        const categories = ['economy', 'social', 'entertainment', 'progression', 'special'];
        const completionRate = (completedIds.length / allAchievements.length) * 100;
        const isAchievementHunter = completionRate >= 75;
        const isCompletionist = completionRate >= 90;
        const recentUnlocks = userAchievements.slice(-3);
        const streakBonus = userData.dailyStreak >= 7 ? 1.5 : 1.0;
        
        let title = `🏆 Achievement Hunter`;
        let description = `🏆 **${completedIds.length}** out of **${allAchievements.length}** achievements unlocked!`;
        
        if (isCompletionist) {
            title = `👑 COMPLETIONIST LEGEND!`;
            description = `🏆 **INCREDIBLE!** ${completedIds.length}/${allAchievements.length} achievements!\n💎 **You're in the top 1% of players!**`;
        } else if (isAchievementHunter) {
            title = `🔥 ACHIEVEMENT MASTER!`;
            description = `🏆 **AMAZING PROGRESS!** ${completedIds.length}/${allAchievements.length} achievements!\n⭐ **You're almost a completionist!**`;
        }
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Achievement Progress: ${completedIds.length}/${allAchievements.length}`,
            completionRate / 100,
            constants.COLORS.VEX
        );
        const nextMilestone = Math.ceil(completedIds.length / 10) * 10;
        const toNextMilestone = nextMilestone - completedIds.length;
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 75) + 25);
        const milestoneMessage = completionRate >= 50 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description + `\n\n🔥 **"Collect them all and become legendary!"**\n\n${fomoMessage}\n${socialProofMessage}${milestoneMessage ? `\n${milestoneMessage}` : ''}\n\n🚀 **Limited time:** Double XP weekend active!`)
            .addFields({
                name: '📊 Completion Progress',
                value: `🎯 **Next Milestone:** ${toNextMilestone} achievements to ${nextMilestone}\n🔥 **Streak Bonus:** ${streakBonus > 1 ? `+${((streakBonus - 1) * 100).toFixed(0)}%` : 'None'}`,
                inline: false
            })
            .setImage('attachment://progress.png')
            .setColor(isCompletionist ? constants.COLORS.VEX : isAchievementHunter ? constants.COLORS.SUCCESS : constants.COLORS.PRIMARY)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: `🎮 ${completedIds.length >= 10 ? 'Achievement Master' : 'Rising Hunter'} | Use buttons to explore categories` });
        
        for (const category of categories) {
            const categoryAchievements = allAchievements.filter(a => a.category === category);
            const completed = categoryAchievements.filter(a => completedIds.includes(a.id)).length;
            
            const examples = categoryAchievements.slice(0, 3).map(a => {
                const status = completedIds.includes(a.id) ? '✅' : '⏳';
                return `${status} ${a.name}`;
            }).join('\n');
            
            embed.addFields({
                name: `${this.getCategoryEmoji(category)} ${category.charAt(0).toUpperCase() + category.slice(1)} (${completed}/${categoryAchievements.length})`,
                value: examples,
                inline: true
            });
        }
        
        const economyButton = new ButtonBuilder()
            .setCustomId('achievements_economy')
            .setLabel('Economy')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💰');
        
        const socialButton = new ButtonBuilder()
            .setCustomId('achievements_social')
            .setLabel('Social')
            .setStyle(ButtonStyle.Success)
            .setEmoji('👥');
        
        const entertainmentButton = new ButtonBuilder()
            .setCustomId('achievements_entertainment')
            .setLabel('Entertainment')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🎮');
        
        const progressButton = new ButtonBuilder()
            .setCustomId('achievements_progress')
            .setLabel('My Progress')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('📊');
        
        const row = new ActionRowBuilder().addComponents(economyButton, socialButton, entertainmentButton, progressButton);
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleProgress(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const allAchievements = this.getAllAchievements();
        const userAchievements = userData.achievements || [];
        const completedIds = userAchievements.map(a => a.id);
        
        const inProgressAchievements = allAchievements
            .filter(a => !completedIds.includes(a.id))
            .map(a => ({
                ...a,
                progress: this.calculateProgress(a, userData)
            }))
            .filter(a => a.progress.current > 0)
            .sort((a, b) => (b.progress.current / b.progress.target) - (a.progress.current / a.progress.target))
            .slice(0, 8);
        
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 15);
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(0)) : null;
        
        const embed = new EmbedBuilder()
            .setTitle(`📊 Achievement Progress`)
            .setDescription(`⏳ Track your progress toward unlocking new achievements!\n\n📈 **${Math.floor(Math.random() * 150) + 50} players** are hunting achievements right now!\n\n${socialProofMessage}${variableReward ? `\n${variableReward}` : ''}\n\n🔥 **Pro tip:** Complete daily streaks for bonus achievement progress!`)
            .setColor(constants.COLORS.INFO)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: 'Keep playing to unlock more achievements!' });
        
        if (inProgressAchievements.length === 0) {
            embed.addFields({
                name: '🎯 No Active Progress',
                value: 'Start playing to make progress on achievements!\n\nTry using `/daily`, `/work`, or `/entertainment` commands.',
                inline: false
            });
        } else {
            const CanvasRenderer = require('../../utils/canvasRenderer');
            const canvasRenderer = new CanvasRenderer();
            
            for (const achievement of inProgressAchievements) {
                const percentage = Math.round((achievement.progress.current / achievement.progress.target) * 100);
                const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                    `${achievement.name} Progress`,
                    achievement.progress.current / achievement.progress.target,
                    constants.COLORS.SUCCESS
                );
                
                embed.addFields({
                    name: `${achievement.emoji} ${achievement.name}`,
                    value: `${achievement.description}\n📊 **Progress:** ${percentage}%\n**Reward**: ${achievement.reward} VEX + ${achievement.xp} XP`,
                    inline: true
                });
            }
            
            if (inProgressAchievements.length > 0) {
                const firstAchievement = inProgressAchievements[0];
                const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                    `${firstAchievement.name} Progress`,
                    firstAchievement.progress.current / firstAchievement.progress.target,
                    constants.COLORS.SUCCESS
                );
                embed.setImage('attachment://progress.png');
                
                await interaction.reply({ 
                    embeds: [embed], 
                    components: [row],
                    files: [{ attachment: progressBuffer, name: 'progress.png' }]
                });
                return;
            }
        }
        
        const recentAchievements = userAchievements
            .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
            .slice(0, 3);
        
        if (recentAchievements.length > 0) {
            const recentText = recentAchievements
                .map(a => `${a.emoji} **${a.name}** - <t:${Math.floor(new Date(a.unlockedAt).getTime() / 1000)}:R>`)
                .join('\n');
            
            embed.addFields({
                name: '🏆 Recently Unlocked',
                value: recentText,
                inline: false
            });
        }
        
        const listButton = new ButtonBuilder()
            .setCustomId('achievements_list')
            .setLabel('All Achievements')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📋');
        
        const showcaseButton = new ButtonBuilder()
            .setCustomId('achievements_showcase_menu')
            .setLabel('Showcase Achievement')
            .setStyle(ButtonStyle.Success)
            .setEmoji('⭐');
        
        const row = new ActionRowBuilder().addComponents(listButton, showcaseButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleShowcase(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const achievementId = interaction.options.getString('achievement_id');
        const userAchievements = userData.achievements || [];
        const achievement = userAchievements.find(a => a.id === achievementId);
        
        if (!achievement) {
            const nearMissMessage = constants.NEAR_MISS_MESSAGES[Math.floor(Math.random() * constants.NEAR_MISS_MESSAGES.length)];
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Achievement Not Found`)
                .setDescription(`⏳ You haven't unlocked achievement ID: ${achievementId}\n\n✨ Use \`/achievements progress\` to see available achievements.\n\n${nearMissMessage}\n\n🔥 **Motivation:** You're closer than you think to your next achievement!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (!userData.showcasedAchievements) userData.showcasedAchievements = [];
        
        if (userData.showcasedAchievements.includes(achievementId)) {
            userData.showcasedAchievements = userData.showcasedAchievements.filter(id => id !== achievementId);
            await user.save(userData);
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.SUCCESS} Achievement Removed from Showcase`)
                .setDescription(`${constants.ANIMATED_EMOJIS.SPARKLES} **${achievement.name}** is no longer showcased on your prof...`)
                .setColor(constants.COLORS.WARNING);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (userData.showcasedAchievements.length >= 5) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Showcase Full`)
                .setDescription('You can only showcase 5 achievements at a time.\n\nRemove one first by using this command on a showcased achievement.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        userData.showcasedAchievements.push(achievementId);
        userData.stats.commandsUsed++;
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Achievement Showcased!`)
            .setDescription(`**${achievement.name}** is now showcased on your profile!`)
            .addFields(
                { name: '🏆 Achievement', value: `${achievement.emoji} **${achievement.name}**`, inline: true },
                { name: '📅 Unlocked', value: `<t:${Math.floor(new Date(achievement.unlockedAt).getTime() / 1000)}:R>`, inline: true },
                { name: '💎 Rarity', value: achievement.rarity || 'Common', inline: true },
                { name: '📝 Description', value: achievement.description, inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `Showcased achievements: ${userData.showcasedAchievements.length}/5` })
            .setTimestamp();
        
        const viewButton = new ButtonBuilder()
            .setCustomId('achievements_progress')
            .setLabel('View Progress')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊');
        
        const profileButton = new ButtonBuilder()
            .setCustomId('profile_view')
            .setLabel('View Profile')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('👤');
        
        const row = new ActionRowBuilder().addComponents(viewButton, profileButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleLeaderboard(interaction) {
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.LEADERBOARD} Achievement Leaderboard`)
            .setDescription('Top achievement hunters in VexiumVerse!')
            .addFields(
                { name: '🥇 Most Achievements', value: 'Coming soon - global leaderboard', inline: true },
                { name: '⚡ Fastest Unlocks', value: 'Track speed achievements', inline: true },
                { name: '🏆 Rare Collectors', value: 'Showcase rare achievements', inline: true },
                { name: '📊 Categories', value: '• Economy Masters\n• Social Butterflies\n• Entertainment Pros\n• Progression Leaders', inline: false }
            )
            .setColor(constants.COLORS.LEADERBOARD)
            .setFooter({ text: 'Achievement leaderboard system in development' });
        
        const myProgressButton = new ButtonBuilder()
            .setCustomId('achievements_progress')
            .setLabel('My Progress')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊');
        
        const allButton = new ButtonBuilder()
            .setCustomId('achievements_list')
            .setLabel('All Achievements')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋');
        
        const row = new ActionRowBuilder().addComponents(myProgressButton, allButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    getAllAchievements() {
        return [
            { id: 'first_vex', name: 'First VEX', description: 'Earn your first VEX token', category: 'economy', emoji: '💰', reward: 100, xp: 50, rarity: 'Common' },
            { id: 'millionaire', name: 'Millionaire', description: 'Accumulate 1,000,000 VEX net worth', category: 'economy', emoji: '💎', reward: 10000, xp: 5000, rarity: 'Legendary' },
            { id: 'daily_streak_7', name: 'Week Warrior', description: 'Maintain 7-day daily streak', category: 'economy', emoji: '🔥', reward: 500, xp: 250, rarity: 'Uncommon' },
            { id: 'daily_streak_30', name: 'Monthly Master', description: 'Maintain 30-day daily streak', category: 'economy', emoji: '🌟', reward: 2500, xp: 1000, rarity: 'Rare' },
            { id: 'work_master', name: 'Work Master', description: 'Complete 100 work sessions', category: 'economy', emoji: '💼', reward: 1000, xp: 500, rarity: 'Uncommon' },
            { id: 'investor', name: 'Smart Investor', description: 'Make profitable investments worth 50,000 VEX', category: 'economy', emoji: '📈', reward: 2000, xp: 750, rarity: 'Rare' },
            
            { id: 'first_gift', name: 'Generous Soul', description: 'Send your first gift', category: 'social', emoji: '🎁', reward: 200, xp: 100, rarity: 'Common' },
            { id: 'trade_master', name: 'Trade Master', description: 'Complete 50 successful trades', category: 'social', emoji: '🤝', reward: 1500, xp: 600, rarity: 'Rare' },
            { id: 'social_butterfly', name: 'Social Butterfly', description: 'Interact with 25 different users', category: 'social', emoji: '🦋', reward: 800, xp: 400, rarity: 'Uncommon' },
            { id: 'guild_leader', name: 'Guild Leader', description: 'Create and lead a successful guild', category: 'social', emoji: '👑', reward: 3000, xp: 1200, rarity: 'Epic' },
            
            { id: 'first_win', name: 'Lucky Start', description: 'Win your first entertainment game', category: 'entertainment', emoji: '🍀', reward: 150, xp: 75, rarity: 'Common' },
            { id: 'entertainment_master', name: 'Entertainment Master', description: 'Win 100 entertainment games', category: 'entertainment', emoji: '🎮', reward: 2000, xp: 800, rarity: 'Rare' },
            { id: 'jackpot_winner', name: 'Jackpot Winner', description: 'Win a jackpot in slots', category: 'entertainment', emoji: '🎰', reward: 5000, xp: 2000, rarity: 'Epic' },
            { id: 'skill_master', name: 'Skill Master', description: 'Achieve 80% win rate over 50 games', category: 'entertainment', emoji: '🎯', reward: 3000, xp: 1500, rarity: 'Epic' },
            
            { id: 'level_10', name: 'Rising Star', description: 'Reach level 10', category: 'progression', emoji: '⭐', reward: 500, xp: 0, rarity: 'Common' },
            { id: 'level_50', name: 'Veteran Player', description: 'Reach level 50', category: 'progression', emoji: '🏅', reward: 2500, xp: 0, rarity: 'Rare' },
            { id: 'level_100', name: 'Legend', description: 'Reach level 100', category: 'progression', emoji: '👑', reward: 10000, xp: 0, rarity: 'Legendary' },
            { id: 'command_master', name: 'Command Master', description: 'Use 1000 commands', category: 'progression', emoji: '⚡', reward: 1000, xp: 500, rarity: 'Uncommon' },
            
            { id: 'early_adopter', name: 'Early Adopter', description: 'Join VexiumVerse in the first month', category: 'special', emoji: '🚀', reward: 5000, xp: 2500, rarity: 'Legendary' },
            { id: 'bug_hunter', name: 'Bug Hunter', description: 'Report a valid bug', category: 'special', emoji: '🐛', reward: 1000, xp: 500, rarity: 'Rare' },
            { id: 'community_helper', name: 'Community Helper', description: 'Help 10 new users', category: 'special', emoji: '🤗', reward: 2000, xp: 1000, rarity: 'Epic' }
        ];
    },
    
    calculateProgress(achievement, userData) {
        const stats = userData.stats || {};
        
        switch (achievement.id) {
            case 'first_vex':
                return { current: userData.vexBalance > 0 ? 1 : 0, target: 1 };
            case 'millionaire':
                return { current: Math.min(userData.networth || 0, 1000000), target: 1000000 };
            case 'daily_streak_7':
                return { current: Math.min(userData.dailyStreak || 0, 7), target: 7 };
            case 'daily_streak_30':
                return { current: Math.min(userData.dailyStreak || 0, 30), target: 30 };
            case 'work_master':
                return { current: Math.min(stats.workSessions || 0, 100), target: 100 };
            case 'investor':
                return { current: Math.min(stats.investmentProfit || 0, 50000), target: 50000 };
            case 'first_gift':
                return { current: stats.giftsSent > 0 ? 1 : 0, target: 1 };
            case 'trade_master':
                return { current: Math.min(stats.tradesCompleted || 0, 50), target: 50 };
            case 'social_butterfly':
                return { current: Math.min(stats.uniqueInteractions || 0, 25), target: 25 };
            case 'first_win':
                return { current: stats.entertainmentWins > 0 ? 1 : 0, target: 1 };
            case 'entertainment_master':
                return { current: Math.min(stats.entertainmentWins || 0, 100), target: 100 };
            case 'level_10':
                return { current: Math.min(userData.level || 1, 10), target: 10 };
            case 'level_50':
                return { current: Math.min(userData.level || 1, 50), target: 50 };
            case 'level_100':
                return { current: Math.min(userData.level || 1, 100), target: 100 };
            case 'command_master':
                return { current: Math.min(stats.commandsUsed || 0, 1000), target: 1000 };
            default:
                return { current: 0, target: 1 };
        }
    },
    
    createProgressBar(current, max, length = 10) {
        const percentage = Math.min(current / max, 1);
        const filled = Math.floor(percentage * length);
        const empty = length - filled;
        
        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
    },
    
    getCategoryEmoji(category) {
        const emojis = {
            economy: '💰',
            social: '👥',
            entertainment: '🎮',
            progression: '📈',
            special: '⭐'
        };
        return emojis[category] || '🏆';
    }
};
