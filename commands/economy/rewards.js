const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rewards')
        .setDescription('Claim special rewards and bonuses')
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('Claim available rewards'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check reward status and availability'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription('View reward claim history')),
    
    cooldown: 10,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        const subcommand = interaction.options.getSubcommand();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'rewards', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: userData.stats.rewardsClaimed >= 5,
                quickReturn: false,
                timeSinceLastUse: Date.now() - (userData.lastRewardCheck || 0),
                rewardHunting: true,
                anticipationBuilding: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(interaction.user.id, 'rewards', behaviorContext);
        }
        
        const rewardStreak = userData.stats.rewardStreak || 0;
        const isRewardMaster = userData.stats.rewardsClaimed >= 50;
        const surpriseMultiplier = Math.random() < 0.15 ? (1.5 + Math.random() * 0.5) : 1;
        const urgencyBonus = this.getUrgencyBonus(userData);
        
        const activeRewardHunters = Math.floor(Math.random() * 25) + 10;
        const recentClaimers = Math.floor(Math.random() * 8) + 3;
        
        switch (subcommand) {
            case 'claim':
                await this.handleClaim(interaction, user, userData);
                break;
            case 'status':
                await this.handleStatus(interaction, user, userData);
                break;
            case 'history':
                await this.handleHistory(interaction, user, userData);
                break;
        }
        
        userData.lastRewardCheck = Date.now();
        await user.save(userData);
    },
    
    async handleClaim(interaction, user, userData) {
        const availableRewards = this.getAvailableRewards(userData);
        
        if (availableRewards.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.INFO} No Rewards Available`)
                .setDescription('You have no rewards available to claim at this time.')
                .addFields({
                    name: '⏰ Next Reward',
                    value: 'Check back later for new rewards!',
                    inline: false
                })
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const totalValue = availableRewards.reduce((sum, reward) => sum + reward.value, 0);
        
        await user.addVEX(totalValue, 'rewards_claim');
        
        userData.stats.rewardsClaimed = (userData.stats.rewardsClaimed || 0) + availableRewards.length;
        userData.stats.totalRewardsValue = (userData.stats.totalRewardsValue || 0) + totalValue;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Rewards Claimed!`)
            .setDescription(`🎉 You've claimed ${availableRewards.length} reward(s)!`)
            .addFields(
                { name: '💰 Total Value', value: `$${totalValue.toFixed(2)} VEX`, inline: true },
                { name: '🎁 Rewards Claimed', value: availableRewards.map(r => `• ${r.name}: $${r.value.toFixed(2)}`).join('\n'), inline: false },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleStatus(interaction, user, userData) {
        const availableRewards = this.getAvailableRewards(userData);
        const nextRewards = this.getUpcomingRewards(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.GIFT} Reward Status`)
            .setDescription('Your current reward status and upcoming opportunities')
            .addFields(
                { 
                    name: '🎁 Available Now', 
                    value: availableRewards.length > 0 
                        ? availableRewards.map(r => `• ${r.name}: $${r.value.toFixed(2)}`).join('\n')
                        : 'No rewards available',
                    inline: false 
                },
                { 
                    name: '⏰ Coming Soon', 
                    value: nextRewards.length > 0 
                        ? nextRewards.map(r => `• ${r.name}: ${r.timeLeft}`).join('\n')
                        : 'No upcoming rewards',
                    inline: false 
                },
                { name: '📊 Total Claimed', value: `${userData.stats.rewardsClaimed || 0} rewards`, inline: true },
                { name: '💎 Total Value', value: `$${(userData.stats.totalRewardsValue || 0).toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setTimestamp();
        
        const claimButton = new ButtonBuilder()
            .setCustomId(`rewards_claim_${interaction.user.id}`)
            .setLabel('Claim Available')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎁')
            .setDisabled(availableRewards.length === 0);
        
        const row = new ActionRowBuilder().addComponents(claimButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleHistory(interaction, user, userData) {
        const rewardHistory = userData.rewardHistory || [];
        const recentRewards = rewardHistory.slice(-10);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.HISTORY} Reward History`)
            .setDescription('Your recent reward claims')
            .addFields(
                { 
                    name: '📜 Recent Claims', 
                    value: recentRewards.length > 0 
                        ? recentRewards.map(r => `• ${r.name}: $${r.value.toFixed(2)} (${new Date(r.timestamp).toLocaleDateString()})`).join('\n')
                        : 'No reward history available',
                    inline: false 
                },
                { name: '🎁 Total Rewards', value: `${userData.stats.rewardsClaimed || 0}`, inline: true },
                { name: '💰 Total Value', value: `$${(userData.stats.totalRewardsValue || 0).toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.INFO)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    getAvailableRewards(userData) {
        const rewards = [];
        const now = Date.now();
        
        if (!userData.lastLoginReward || now - userData.lastLoginReward > 24 * 60 * 60 * 1000) {
            rewards.push({
                name: 'Daily Login Bonus',
                value: 50 + (userData.level || 1) * 5,
                type: 'login'
            });
        }
        
        if (userData.stats.commandsUsed && userData.stats.commandsUsed % 100 === 0 && !userData.lastMilestoneReward) {
            rewards.push({
                name: 'Command Milestone',
                value: 200,
                type: 'milestone'
            });
        }
        
        return rewards;
    },
    
    getUpcomingRewards(userData) {
        const upcoming = [];
        const now = Date.now();
        
        if (userData.lastLoginReward && now - userData.lastLoginReward < 24 * 60 * 60 * 1000) {
            const timeLeft = 24 * 60 * 60 * 1000 - (now - userData.lastLoginReward);
            const hoursLeft = Math.ceil(timeLeft / (60 * 60 * 1000));
            upcoming.push({
                name: 'Daily Login Bonus',
                timeLeft: `${hoursLeft} hours`
            });
        }
        
        return upcoming;
    }
};
