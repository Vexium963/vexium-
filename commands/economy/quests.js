const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quests')
        .setDescription('Complete daily and weekly quests for rewards and progression')
        .addSubcommand(subcommand =>
            subcommand
                .setName('active')
                .setDescription('View your active quests and progress'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('complete')
                .setDescription('Complete a finished quest and claim rewards')
                .addStringOption(option =>
                    option.setName('quest_id')
                        .setDescription('ID of the quest to complete')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('abandon')
                .setDescription('Abandon an active quest')
                .addStringOption(option =>
                    option.setName('quest_id')
                        .setDescription('ID of the quest to abandon')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription('View your completed quest history'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('View quest completion leaderboard')),
    
    cooldown: 10,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'quests', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                questProgress: true,
                achievementHunting: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'quests',
                behaviorContext
            );
        }
        
        const questsCompleted = userData.stats?.questsCompleted || 0;
        const questStreak = userData.stats?.questStreak || 0;
        const isQuestMaster = questsCompleted >= 50;
        const isNewbie = questsCompleted < 5;
        const urgencyBonus = Math.random() < 0.2 ? Math.floor(questsCompleted * 10) : 0;
        
        if (urgencyBonus > 0) {
            await user.addVEX(urgencyBonus, 'quest_urgency_bonus');
            
            const bonusEmbed = new EmbedBuilder()
                .setTitle(`✨ SURPRISE QUEST BONUS!`)
                .setDescription(`🎉 **Lucky you!** Random quest bonus activated!\n💰 **+$${urgencyBonus} VEX** for being an active adventurer!`)
                .setColor(constants.COLORS.VEX)
                .setFooter({ text: 'Random bonuses reward dedicated questers!' });
            
            await interaction.followUp({ embeds: [bonusEmbed], ephemeral: true });
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'active':
                return this.handleActive(interaction);
            case 'complete':
                return this.handleComplete(interaction);
            case 'abandon':
                return this.handleAbandon(interaction);
            case 'history':
                return this.handleHistory(interaction);
            case 'leaderboard':
                return this.handleLeaderboard(interaction);
        }
    },
    
    async handleActive(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.quests) userData.quests = {};
        
        const activeQuests = this.getActiveQuests(userData);
        const completedCount = activeQuests.filter(q => q.completed).length;
        const totalRewards = activeQuests.reduce((sum, q) => sum + (q.completed && !q.claimed ? q.reward : 0), 0);
        const questStreak = userData.stats.questStreak || 0;
        const isQuestMaster = (userData.stats.questsCompleted || 0) >= 50;
        const hasUrgentQuests = activeQuests.some(q => q.completed && !q.claimed);
        
        let title = `${constants.EMOJIS.QUESTS} Epic Quest Board`;
        let description = `🎯 **Complete quests to unlock legendary rewards!**\n\n📊 **Progress**: ${completedCount}/${activeQuests.length} completed`;
        
        if (isQuestMaster) {
            title = `👑 QUEST MASTER'S BOARD`;
            description = `💎 **LEGENDARY ADVENTURER!** You've mastered the art of questing!\n\n🏆 **Progress**: ${completedCount}/${activeQuests.length} completed`;
        }
        
        if (hasUrgentQuests) {
            title = `🔥 URGENT! Rewards Ready!`;
            description = `⚡ **CLAIM YOUR REWARDS NOW!** Don't let them expire!\n\n💰 **$${totalRewards.toFixed(2)} VEX** waiting for you!`;
        }
        
        if (questStreak >= 7) {
            description += `\n🔥 **QUEST STREAK: ${questStreak} days!** You're unstoppable!`;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(hasUrgentQuests ? constants.COLORS.VEX : isQuestMaster ? constants.COLORS.SUCCESS : constants.COLORS.PRIMARY)
            .setFooter({ text: 'New legendary quests unlock as you level up!' })
            .setTimestamp();
        
        if (activeQuests.length === 0) {
            embed.addFields({
                name: '🎯 No Active Quests',
                value: 'New quests will appear as you play!\n\nTry using various commands to unlock quest opportunities.',
                inline: false
            });
        } else {
            for (const quest of activeQuests) {
                const status = quest.completed ? (quest.claimed ? '✅ Claimed' : '🎁 Ready to Claim') : `📊 ${quest.progress}/${quest.target}`;
                const progressBar = this.createProgressBar(quest.progress, quest.target);
                const reward = `$${quest.reward.toFixed(2)} VEX + ${quest.xp} XP`;
                
                embed.addFields({
                    name: `${quest.emoji} ${quest.name}`,
                    value: `${quest.description}\n${progressBar}\n**Reward**: ${reward}\n**Status**: ${status}`,
                    inline: true
                });
            }
        }
        
        if (totalRewards > 0) {
            embed.addFields({
                name: '💰 Unclaimed Rewards',
                value: `$${totalRewards.toFixed(2)} VEX + bonus XP available!`,
                inline: false
            });
        }
        
        const completeButton = new ButtonBuilder()
            .setCustomId('quests_complete_menu')
            .setLabel(`Complete Quests`)
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎁')
            .setDisabled(completedCount === 0);
        
        const historyButton = new ButtonBuilder()
            .setCustomId('quests_history')
            .setLabel('Quest History')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📜');
        
        const leaderboardButton = new ButtonBuilder()
            .setCustomId('quests_leaderboard')
            .setLabel('Leaderboard')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🏅');
        
        const row = new ActionRowBuilder().addComponents(completeButton, historyButton, leaderboardButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleComplete(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const questId = interaction.options.getString('quest_id');
        const activeQuests = this.getActiveQuests(userData);
        const quest = activeQuests.find(q => q.id === questId);
        
        if (!quest) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Quest Not Found`)
                .setDescription(`No active quest found with ID: ${questId}\n\nUse \`/quests active\` to see your quests.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (!quest.completed) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Quest Not Completed`)
                .setDescription(`**${quest.name}** is not yet completed!\n\n**Progress**: ${quest.progress}/${quest.target}`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (quest.claimed) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Already Claimed`)
                .setDescription('You have already claimed this quest reward.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        await user.addVEX(quest.reward, 'quest_reward');
        userData.xp += quest.xp;
        
        quest.claimed = true;
        quest.completedAt = new Date().toISOString();
        
        if (!userData.completedQuests) userData.completedQuests = [];
        userData.completedQuests.push({
            ...quest,
            completedAt: new Date().toISOString()
        });
        
        userData.stats.questsCompleted = (userData.stats.questsCompleted || 0) + 1;
        userData.stats.totalQuestRewards = (userData.stats.totalQuestRewards || 0) + quest.reward;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Quest Completed!`)
            .setDescription(`**${quest.name}** has been completed successfully!`)
            .addFields(
                { name: '🎯 Quest', value: quest.name, inline: true },
                { name: '💰 VEX Reward', value: `$${quest.reward.toFixed(2)}`, inline: true },
                { name: '⭐ XP Reward', value: `${quest.xp} XP`, inline: true },
                { name: '📊 Progress', value: `${quest.progress}/${quest.target} (100%)`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)}`, inline: true },
                { name: '🏆 Total Completed', value: `${userData.stats.questsCompleted}`, inline: true },
                { name: '📝 Description', value: quest.description, inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `Quest #${questId} • Keep exploring to unlock more quests!` })
            .setTimestamp();
        
        const moreButton = new ButtonBuilder()
            .setCustomId('quests_active')
            .setLabel('More Quests')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎯');
        
        const historyButton = new ButtonBuilder()
            .setCustomId('quests_history')
            .setLabel('Quest History')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📜');
        
        const row = new ActionRowBuilder().addComponents(moreButton, historyButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleHistory(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const completedQuests = userData.completedQuests || [];
        const totalRewards = userData.stats.totalQuestRewards || 0;
        const questsCompleted = userData.stats.questsCompleted || 0;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.HISTORY} ${interaction.user.displayName}'s Quest History`)
            .setDescription('Your quest completion achievements and rewards')
            .addFields(
                { name: '📊 Quest Statistics', value: `**Completed**: ${questsCompleted}\n**Total Rewards**: $${totalRewards.toFixed(2)} VEX\n**Average Reward**: $${questsCompleted > 0 ? (totalRewards / questsCompleted).toFixed(2) : '0.00'}`, inline: true },
                { name: '🏆 Quest Mastery', value: `**Completion Rate**: ${this.getCompletionRate(userData)}%\n**Quest Rank**: ${this.getQuestRank(questsCompleted)}\n**Streak**: ${userData.stats.questStreak || 0}`, inline: true },
                { name: '🎯 Categories', value: this.getQuestCategories(completedQuests), inline: true }
            )
            .setColor(constants.COLORS.INFO)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: 'Quest history and achievements' })
            .setTimestamp();
        
        if (completedQuests.length === 0) {
            embed.addFields({
                name: '🎯 Get Started!',
                value: 'Complete your first quest to start building your history!\n\nUse `/quests active` to see available quests.',
                inline: false
            });
        } else {
            const recentQuests = completedQuests
                .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                .slice(0, 5);
            
            for (const quest of recentQuests) {
                embed.addFields({
                    name: `${quest.emoji} ${quest.name}`,
                    value: `**Reward**: $${quest.reward.toFixed(2)} VEX + ${quest.xp} XP\n**Completed**: <t:${Math.floor(new Date(quest.completedAt).getTime() / 1000)}:R>`,
                    inline: true
                });
            }
        }
        
        const activeButton = new ButtonBuilder()
            .setCustomId('quests_active')
            .setLabel('Active Quests')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎯');
        
        const leaderboardButton = new ButtonBuilder()
            .setCustomId('quests_leaderboard')
            .setLabel('Leaderboard')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🏅');
        
        const row = new ActionRowBuilder().addComponents(activeButton, leaderboardButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    getActiveQuests(userData) {
        const stats = userData.stats || {};
        const level = userData.level || 1;
        
        const baseQuests = [
            {
                id: 'daily_worker',
                name: 'Daily Worker',
                description: 'Complete 5 work sessions',
                emoji: '💼',
                target: 5,
                progress: Math.min(stats.workToday || 0, 5),
                completed: (stats.workToday || 0) >= 5,
                claimed: userData.quests?.daily_worker?.claimed || false,
                reward: 200,
                xp: 100,
                category: 'economy'
            },
            {
                id: 'social_connector',
                name: 'Social Connector',
                description: 'Send 3 gifts or complete 2 trades',
                emoji: '🤝',
                target: 1,
                progress: Math.min(((stats.giftsToday || 0) >= 3 || (stats.tradesToday || 0) >= 2) ? 1 : 0, 1),
                completed: (stats.giftsToday || 0) >= 3 || (stats.tradesToday || 0) >= 2,
                claimed: userData.quests?.social_connector?.claimed || false,
                reward: 300,
                xp: 150,
                category: 'social'
            },
            {
                id: 'entertainment_enthusiast',
                name: 'Entertainment Enthusiast',
                description: 'Play 10 skill-based entertainment games',
                emoji: '🎮',
                target: 10,
                progress: Math.min(stats.entertainmentToday || 0, 10),
                completed: (stats.entertainmentToday || 0) >= 10,
                claimed: userData.quests?.entertainment_enthusiast?.claimed || false,
                reward: 250,
                xp: 125,
                category: 'entertainment'
            }
        ];
        
        if (level >= 10) {
            baseQuests.push({
                id: 'wealth_builder',
                name: 'Wealth Builder',
                description: 'Accumulate 5,000 VEX net worth',
                emoji: '💎',
                target: 5000,
                progress: Math.min(userData.networth || 0, 5000),
                completed: (userData.networth || 0) >= 5000,
                claimed: userData.quests?.wealth_builder?.claimed || false,
                reward: 500,
                xp: 250,
                category: 'progression'
            });
        }
        
        if (level >= 25) {
            baseQuests.push({
                id: 'achievement_hunter',
                name: 'Achievement Hunter',
                description: 'Unlock 10 achievements',
                emoji: '🏆',
                target: 10,
                progress: Math.min((userData.achievements || []).length, 10),
                completed: (userData.achievements || []).length >= 10,
                claimed: userData.quests?.achievement_hunter?.claimed || false,
                reward: 750,
                xp: 400,
                category: 'achievements'
            });
        }
        
        return baseQuests;
    },
    
    createProgressBar(current, max, length = 10) {
        const percentage = Math.min(current / max, 1);
        const filled = Math.floor(percentage * length);
        const empty = length - filled;
        
        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${current}/${max}`;
    },
    
    getCompletionRate(userData) {
        const completed = userData.stats.questsCompleted || 0;
        const attempted = Math.max(completed, 1);
        return Math.round((completed / attempted) * 100);
    },
    
    getQuestRank(completed) {
        if (completed >= 100) return 'Quest Master';
        if (completed >= 50) return 'Quest Expert';
        if (completed >= 25) return 'Quest Veteran';
        if (completed >= 10) return 'Quest Adept';
        if (completed >= 5) return 'Quest Novice';
        return 'Beginner';
    },
    
    getQuestCategories(completedQuests) {
        const categories = {};
        completedQuests.forEach(quest => {
            categories[quest.category] = (categories[quest.category] || 0) + 1;
        });
        
        const sorted = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        return sorted.length > 0 ? 
            sorted.map(([cat, count]) => `${cat}: ${count}`).join('\n') : 
            'No categories yet';
    }
};
