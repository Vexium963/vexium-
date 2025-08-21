const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quests')
        .setDescription(`✨ Complete epic quests for massive VEX rewards and legendary progression!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('active')
                .setDescription(`⏳ View your active quests and track your legendary progress!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('complete')
                .setDescription(`🎉 Complete a finished quest and claim your epic rewards!`)
                .addStringOption(option =>
                    option.setName('quest_id')
                        .setDescription('ID of the quest to complete')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('abandon')
                .setDescription(`💥 Abandon an active quest (lose all progress!)`)
                .addStringOption(option =>
                    option.setName('quest_id')
                        .setDescription('ID of the quest to abandon')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription(`🏆 View your legendary quest completion history and achievements!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription(`🔥 View the quest completion leaderboard - compete with legends!`)),
    
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
            Economics.apply({ event: 'reward', amountVEX: urgencyBonus, userId: interaction.user.id, meta: { command: 'quests' } });
            
            const bonusEmbed = new EmbedBuilder()
                .setTitle(`✨ SURPRISE QUEST BONUS!`)
                .setDescription(`🎉 **Lucky you!** Random quest bonus activated!\n💸 **+${urgencyBonus} VEX** for being an active quester!`)
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
            description = `⚡ **CLAIM YOUR REWARDS NOW!** Don't let them expire!\n\n💰 **${totalRewards.toFixed(2)} VEX (~$${(totalRewards * Economics.getCurrentVEXPrice()).toFixed(2)})** waiting for you!`;
        }
        
        if (questStreak >= 7) {
            description += `\n🔥 **QUEST STREAK: ${questStreak} days!** You're unstoppable!`;
        }
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 75) + 25);
        const variableReward = Math.random() < 0.15 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        
        if (hasUrgentQuests) {
            description += `\n\n${fomoMessage}`;
        }
        
        if (Math.random() < 0.3) {
            description += `\n${socialProofMessage}`;
        }
        
        if (variableReward && isQuestMaster) {
            description += `\n${variableReward}`;
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`${description}\n\n🚀 **${Math.floor(Math.random() * 150) + 50} players** are completing quests ri...`)
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
                const reward = `${quest.reward.toFixed(2)} VEX (~$${(quest.reward * Economics.getCurrentVEXPrice()).toFixed(2)}) + ${quest.xp} XP`;
                
                embed.addFields({
                    name: `${quest.emoji} ${quest.name}`,
                    value: `${quest.description}\n**Progress**: ${quest.progress}/${quest.target}\n**Reward**: ${reward}\n**Status**: ${status}`,
                    inline: true
                });
            }
        }
        
        if (totalRewards > 0) {
            embed.addFields({
                name: '💰 Unclaimed Rewards',
                value: `${totalRewards.toFixed(2)} VEX (~$${(totalRewards * Economics.getCurrentVEXPrice()).toFixed(2)}) + bonus XP available!`,
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
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const overallProgress = activeQuests.length > 0 ? completedCount / activeQuests.length : 0;
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Quest Progress: ${completedCount}/${activeQuests.length} completed`,
            overallProgress,
            hasUrgentQuests ? constants.COLORS.VEX : constants.COLORS.SUCCESS
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleComplete(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const questId = interaction.options.getString('quest_id');
        const activeQuests = this.getActiveQuests(userData);
        const quest = activeQuests.find(q => q.id === questId);
        
        if (!quest) {
            const nearMissMessage = constants.NEAR_MISS_MESSAGES[Math.floor(Math.random() * constants.NEAR_MISS_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Quest Not Found`)
                .setDescription(`💥 No active quest found with ID: ${questId}\n\nUse \`/quests active\` to see your epic quests.\n\n${nearMissMessage}\n\n✨ **Pro tip:** Complete quests faster for bonus rewards!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (!quest.completed) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Quest Not Completed`)
                .setDescription(`⏳ **${quest.name}** is not yet completed!\n\n**Progress**: ${quest.progress}/${quest.target}\n\n�...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (quest.claimed) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Already Claimed`)
                .setDescription(`${constants.ANIMATED_EMOJIS.CELEBRATION} You have already claimed this quest reward!\n\n${constants.ANIMATED_EMOJIS.SPARKLES} Check out more epic quests with \`/quests active\`!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        await user.addVEX(quest.reward, 'quest_reward');
        Economics.apply({ event: 'reward', amountVEX: quest.reward, userId: interaction.user.id, meta: { command: 'quests' } });
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
        
        const milestoneMessage = constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 20);
        const variableBonus = Math.random() < 0.2 ? Math.floor(quest.reward * 0.25) : 0;
        
        if (variableBonus > 0) {
            await user.addVEX(variableBonus, 'quest_completion_bonus');
            Economics.apply({ event: 'reward', amountVEX: variableBonus, userId: interaction.user.id, meta: { command: 'quests' } });
        }
        
        let celebrationDescription = `**${quest.name}** has been completed successfully!\n\n${milestoneMessage}`;
        
        if (variableBonus > 0) {
            const bonusMessage = constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', variableBonus.toFixed(2));
            celebrationDescription += `\n${bonusMessage}`;
        }
        
        if (Math.random() < 0.4) {
            celebrationDescription += `\n${socialProofMessage}`;
        }

        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Quest Completed!`)
            .setDescription(celebrationDescription)
            .addFields(
                { name: '🎯 Quest', value: quest.name, inline: true },
                { name: '💰 VEX Reward', value: `${quest.reward.toFixed(2)} VEX (~$${(quest.reward * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '⭐ XP Reward', value: `${quest.xp} XP`, inline: true },
                { name: '📊 Progress', value: `${quest.progress}/${quest.target} (100%)`, inline: true },
                { name: '💼 New Balance', value: `${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
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
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `${quest.name} - COMPLETED!`,
            1.0, // 100% completion
            constants.COLORS.SUCCESS
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
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
                { name: '📊 Quest Statistics', value: `**Completed**: ${questsCompleted}\n**Total Rewards**: ${totalRewards.toFixed(2)} VEX (~$${(totalRewards * Economics.getCurrentVEXPrice()).toFixed(2)})\n**Average Reward**: ${questsCompleted > 0 ? (totalRewards / questsCompleted).toFixed(2) : '0.00'} VEX (~$${questsCompleted > 0 ? ((totalRewards / questsCompleted) * Economics.getCurrentVEXPrice()).toFixed(2) : '0.00'})`, inline: true },
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
                    value: `**Reward**: ${quest.reward.toFixed(2)} VEX (~$${(quest.reward * Economics.getCurrentVEXPrice()).toFixed(2)}) + ${quest.xp} XP\n**Completed**: <t:${Math.floor(new Date(quest.completedAt).getTime() / 1000)}:R>`,
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
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const completionRate = this.getCompletionRate(userData) / 100;
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Quest Mastery: ${this.getQuestRank(questsCompleted)}`,
            completionRate,
            constants.COLORS.INFO
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
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
        return `${Math.round(percentage * 100)}%`;
        
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
