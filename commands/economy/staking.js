const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staking')
        .setDescription('Stake your VEX tokens to earn passive rewards')
        .addSubcommand(subcommand =>
            subcommand
                .setName('stake')
                .setDescription('Stake VEX tokens for rewards')
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription('Amount of VEX to stake')
                        .setRequired(true)
                        .setMinValue(0.01))
                .addStringOption(option =>
                    option.setName('pool')
                        .setDescription('Staking pool to join')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Flexible (3% APY)', value: 'flexible' },
                            { name: '30 Days (5% APY)', value: 'thirty_days' },
                            { name: '90 Days (8% APY)', value: 'ninety_days' },
                            { name: '365 Days (12% APY)', value: 'one_year' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unstake')
                .setDescription('Unstake your VEX tokens')
                .addStringOption(option =>
                    option.setName('stake_id')
                        .setDescription('Stake ID to unstake')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('rewards')
                .setDescription('Claim your staking rewards'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('portfolio')
                .setDescription('View your staking portfolio'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('pools')
                .setDescription('View available staking pools')),
    
    cooldown: 3,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'stake':
                return this.handleStake(interaction);
            case 'unstake':
                return this.handleUnstake(interaction);
            case 'rewards':
                return this.handleRewards(interaction);
            case 'portfolio':
                return this.handlePortfolio(interaction);
            case 'pools':
                return this.handlePools(interaction);
        }
    },
    
    async handleStake(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const amount = interaction.options.getNumber('amount');
        const poolType = interaction.options.getString('pool') || 'flexible';
        const pool = constants.STAKING_POOLS[poolType.toUpperCase()];
        
        if (!pool) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Invalid Pool`)
                .setDescription('Please select a valid staking pool.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (amount < pool.minStake) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Minimum Stake Required`)
                .setDescription(`The minimum stake for **${pool.name}** is $${pool.minStake.toFixed(2)} VEX.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (amount > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`You need $${amount.toFixed(2)} VEX but only have $${userData.vexBalance.toFixed(2)}.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(amount, 'staking', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Staking Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const stakeId = this.generateStakeId();
        const startTime = Date.now();
        const endTime = pool.lockPeriod ? startTime + (pool.lockPeriod * 24 * 60 * 60 * 1000) : null;
        
        if (!userData.stakes) userData.stakes = {};
        
        userData.stakes[stakeId] = {
            amount,
            poolType,
            startTime,
            endTime,
            lastRewardClaim: startTime,
            totalRewardsClaimed: 0
        };
        
        userData.stats.totalStaked = (userData.stats.totalStaked || 0) + amount;
        userData.stats.stakingTransactions = (userData.stats.stakingTransactions || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Staking Successful!`)
            .setDescription(`Successfully staked $${amount.toFixed(2)} VEX in **${pool.name}**!`)
            .addFields(
                { name: '🆔 Stake ID', value: stakeId, inline: true },
                { name: '💰 Amount Staked', value: `$${amount.toFixed(2)} VEX`, inline: true },
                { name: '📈 APY', value: `${(pool.apy * 100).toFixed(1)}%`, inline: true },
                { name: '⏰ Lock Period', value: pool.lockPeriod ? `${pool.lockPeriod} days` : 'Flexible', inline: true },
                { name: '💎 Daily Rewards', value: `~$${this.calculateDailyRewards(amount, pool.apy).toFixed(4)} VEX`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        if (endTime) {
            embed.addFields({
                name: '🔓 Unlock Date',
                value: `<t:${Math.floor(endTime / 1000)}:F>`,
                inline: false
            });
        }
        
        embed.setFooter({ text: 'Use /staking rewards to claim your earnings!' });
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleUnstake(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const stakeId = interaction.options.getString('stake_id');
        
        if (!userData.stakes || !userData.stakes[stakeId]) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Stake Not Found`)
                .setDescription(`Stake **${stakeId}** doesn't exist.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const stake = userData.stakes[stakeId];
        const pool = constants.STAKING_POOLS[stake.poolType.toUpperCase()];
        
        if (stake.endTime && Date.now() < stake.endTime) {
            const timeLeft = stake.endTime - Date.now();
            const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Stake Locked`)
                .setDescription(`This stake is locked for ${daysLeft} more day${daysLeft > 1 ? 's' : ''}.`)
                .addFields({
                    name: '🔓 Unlock Date',
                    value: `<t:${Math.floor(stake.endTime / 1000)}:F>`,
                    inline: true
                })
                .setColor(constants.COLORS.WARNING);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const pendingRewards = this.calculatePendingRewards(stake, pool);
        const earlyWithdrawalPenalty = stake.endTime && Date.now() < stake.endTime ? 
            stake.amount * constants.STAKING.EARLY_WITHDRAWAL_PENALTY : 0;
        
        const totalReturn = stake.amount + pendingRewards - earlyWithdrawalPenalty;
        
        await user.addVEX(totalReturn, 'unstaking');
        
        if (pendingRewards > 0) {
            const rewardTax = pendingRewards * constants.TAX_SYSTEM.STAKING.REWARD_TAX_RATE;
            await user.burnVEX(rewardTax, 'staking_reward_tax');
        }
        
        delete userData.stakes[stakeId];
        
        userData.stats.stakingTransactions = (userData.stats.stakingTransactions || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Unstaking Complete!`)
            .setDescription(`Successfully unstaked from **${pool.name}**!`)
            .addFields(
                { name: '💰 Principal', value: `$${stake.amount.toFixed(2)} VEX`, inline: true },
                { name: '💎 Rewards', value: `$${pendingRewards.toFixed(4)} VEX`, inline: true },
                { name: '💸 Penalty', value: `$${earlyWithdrawalPenalty.toFixed(2)} VEX`, inline: true },
                { name: '💵 Total Received', value: `$${totalReturn.toFixed(2)} VEX`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '⏰ Staking Duration', value: this.formatDuration(Date.now() - stake.startTime), inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleRewards(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.stakes || Object.keys(userData.stakes).length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.STAKING} No Active Stakes`)
                .setDescription('You don\'t have any active stakes. Use `/staking stake` to start earning rewards!')
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        let totalRewards = 0;
        let claimedStakes = 0;
        
        for (const [stakeId, stake] of Object.entries(userData.stakes)) {
            const pool = constants.STAKING_POOLS[stake.poolType.toUpperCase()];
            const pendingRewards = this.calculatePendingRewards(stake, pool);
            
            if (pendingRewards >= constants.STAKING.MIN_CLAIM_AMOUNT) {
                totalRewards += pendingRewards;
                claimedStakes++;
                
                stake.lastRewardClaim = Date.now();
                stake.totalRewardsClaimed += pendingRewards;
            }
        }
        
        if (totalRewards === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.STAKING} No Rewards Available`)
                .setDescription(`Minimum claim amount: $${constants.STAKING.MIN_CLAIM_AMOUNT.toFixed(4)} VEX`)
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const taxAmount = totalRewards * constants.TAX_SYSTEM.STAKING.REWARD_TAX_RATE;
        const netRewards = totalRewards - taxAmount;
        
        await user.addVEX(netRewards, 'staking_rewards');
        await user.burnVEX(taxAmount, 'staking_reward_tax');
        
        userData.stats.stakingRewardsClaimed = (userData.stats.stakingRewardsClaimed || 0) + totalRewards;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Rewards Claimed!`)
            .setDescription(`Successfully claimed rewards from ${claimedStakes} stake${claimedStakes > 1 ? 's' : ''}!`)
            .addFields(
                { name: '💎 Total Rewards', value: `$${totalRewards.toFixed(4)} VEX`, inline: true },
                { name: '💸 Tax (10%)', value: `$${taxAmount.toFixed(4)} VEX`, inline: true },
                { name: '💰 Net Received', value: `$${netRewards.toFixed(4)} VEX`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Keep staking to earn more rewards!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handlePortfolio(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.stakes || Object.keys(userData.stakes).length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.STAKING} Staking Portfolio`)
                .setDescription('You don\'t have any active stakes. Use `/staking pools` to see available options!')
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        let totalStaked = 0;
        let totalPendingRewards = 0;
        const stakeFields = [];
        
        for (const [stakeId, stake] of Object.entries(userData.stakes)) {
            const pool = constants.STAKING_POOLS[stake.poolType.toUpperCase()];
            const pendingRewards = this.calculatePendingRewards(stake, pool);
            const stakingDuration = Date.now() - stake.startTime;
            
            totalStaked += stake.amount;
            totalPendingRewards += pendingRewards;
            
            const timeInfo = stake.endTime ? 
                `Unlocks <t:${Math.floor(stake.endTime / 1000)}:R>` : 
                'Flexible (can unstake anytime)';
            
            stakeFields.push({
                name: `${pool.name} (${stakeId})`,
                value: `**Staked**: $${stake.amount.toFixed(2)} VEX\n` +
                       `**Pending**: $${pendingRewards.toFixed(4)} VEX\n` +
                       `**Duration**: ${this.formatDuration(stakingDuration)}\n` +
                       `**Status**: ${timeInfo}`,
                inline: true
            });
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.STAKING} Your Staking Portfolio`)
            .setDescription(`Managing ${Object.keys(userData.stakes).length} active stake${Object.keys(userData.stakes).length > 1 ? 's' : ''}`)
            .addFields(
                { name: '💰 Total Staked', value: `$${totalStaked.toFixed(2)} VEX`, inline: true },
                { name: '💎 Pending Rewards', value: `$${totalPendingRewards.toFixed(4)} VEX`, inline: true },
                { name: '📊 Total Value', value: `$${(totalStaked + totalPendingRewards).toFixed(2)} VEX`, inline: true },
                ...stakeFields
            )
            .setColor(constants.COLORS.PRIMARY)
            .setFooter({ text: 'Use /staking rewards to claim pending rewards' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handlePools(interaction) {
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.STAKING} Staking Pools`)
            .setDescription('Choose from our variety of staking pools to earn passive rewards!')
            .setColor(constants.COLORS.PRIMARY);
        
        for (const [poolId, pool] of Object.entries(constants.STAKING_POOLS)) {
            const dailyRate = this.calculateDailyRewards(100, pool.apy);
            
            embed.addFields({
                name: `${pool.name}`,
                value: `**APY**: ${(pool.apy * 100).toFixed(1)}%\n` +
                       `**Lock Period**: ${pool.lockPeriod ? `${pool.lockPeriod} days` : 'Flexible'}\n` +
                       `**Min Stake**: $${pool.minStake.toFixed(2)} VEX\n` +
                       `**Daily Rate**: ${dailyRate.toFixed(4)} VEX per 100 VEX\n` +
                       `**Risk Level**: ${pool.riskLevel || 'Low'}`,
                inline: true
            });
        }
        
        embed.setFooter({ text: 'Use /staking stake <amount> <pool> to start earning!' });
        
        await interaction.reply({ embeds: [embed] });
    },
    
    calculatePendingRewards(stake, pool) {
        const timeSinceLastClaim = Date.now() - stake.lastRewardClaim;
        const daysElapsed = timeSinceLastClaim / (1000 * 60 * 60 * 24);
        
        return this.calculateDailyRewards(stake.amount, pool.apy) * daysElapsed;
    },
    
    calculateDailyRewards(amount, apy) {
        return (amount * apy) / 365;
    },
    
    generateStakeId() {
        return 'STK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    },
    
    formatDuration(milliseconds) {
        const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
        const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) {
            return `${days}d ${hours}h`;
        } else {
            return `${hours}h`;
        }
    }
};
