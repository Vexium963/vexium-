const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('referral')
        .setDescription('Invite friends and earn VEX rewards through the referral program')
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('View your referral information and stats'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('code')
                .setDescription('Get your unique referral code'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('Claim your referral rewards'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('View the top referrers'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('redeem')
                .setDescription('Redeem a referral code (new users only)')
                .addStringOption(option =>
                    option.setName('code')
                        .setDescription('Referral code to redeem')
                        .setRequired(true))),
    
    cooldown: 5,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'info':
                return this.handleInfo(interaction);
            case 'code':
                return this.handleCode(interaction);
            case 'claim':
                return this.handleClaim(interaction);
            case 'leaderboard':
                return this.handleLeaderboard(interaction);
            case 'redeem':
                return this.handleRedeem(interaction);
        }
    },
    
    async handleInfo(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const referralStats = userData.referral || {
            code: null,
            referredBy: null,
            referrals: [],
            totalEarned: 0,
            pendingRewards: 0
        };
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.REFERRAL} Your Referral Program`)
            .setDescription('Invite friends to VexiumVerse and earn rewards together!')
            .setColor(constants.COLORS.PRIMARY)
            .setThumbnail(interaction.user.displayAvatarURL());
        
        if (!referralStats.code) {
            referralStats.code = this.generateReferralCode(interaction.user.id);
            userData.referral = referralStats;
            await user.save(userData);
        }
        
        embed.addFields(
            { name: '🔗 Your Referral Code', value: `\`${referralStats.code}\``, inline: true },
            { name: '👥 Total Referrals', value: `${referralStats.referrals.length}`, inline: true },
            { name: '💰 Total Earned', value: `$${referralStats.totalEarned.toFixed(2)} VEX`, inline: true },
            { name: '💎 Pending Rewards', value: `$${referralStats.pendingRewards.toFixed(2)} VEX`, inline: true }
        );
        
        if (referralStats.referredBy) {
            embed.addFields({
                name: '🤝 Referred By',
                value: `${referralStats.referredBy}`,
                inline: true
            });
        }
        
        const rewardTiers = this.getRewardTiers();
        const tierInfo = rewardTiers.map(tier => 
            `**${tier.referrals} referrals**: $${tier.bonus.toFixed(2)} VEX bonus`
        ).join('\n');
        
        embed.addFields({
            name: '🏆 Reward Tiers',
            value: tierInfo,
            inline: false
        });
        
        if (referralStats.referrals.length > 0) {
            const recentReferrals = referralStats.referrals.slice(-3).map(ref => 
                `${ref.username} - $${ref.earned.toFixed(2)} VEX earned`
            ).join('\n');
            
            embed.addFields({
                name: '📋 Recent Referrals',
                value: recentReferrals,
                inline: false
            });
        }
        
        const shareButton = new ButtonBuilder()
            .setCustomId(`referral_share_${interaction.user.id}`)
            .setLabel('Share Code')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📤');
        
        const claimButton = new ButtonBuilder()
            .setCustomId(`referral_claim_${interaction.user.id}`)
            .setLabel('Claim Rewards')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💰')
            .setDisabled(referralStats.pendingRewards < constants.REFERRAL.MIN_CLAIM_AMOUNT);
        
        const row = new ActionRowBuilder().addComponents(shareButton, claimButton);
        
        embed.setFooter({ text: 'Share your code and start earning!' });
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleCode(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.referral) {
            userData.referral = {
                code: this.generateReferralCode(interaction.user.id),
                referredBy: null,
                referrals: [],
                totalEarned: 0,
                pendingRewards: 0
            };
            await user.save(userData);
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.REFERRAL} Your Referral Code`)
            .setDescription(`Share this code with friends to earn rewards!`)
            .addFields(
                { name: '🔗 Referral Code', value: `\`${userData.referral.code}\``, inline: false },
                { name: '💰 Reward per Referral', value: `$${constants.REFERRAL.REFERRER_REWARD.toFixed(2)} VEX`, inline: true },
                { name: '🎁 Friend Bonus', value: `$${constants.REFERRAL.REFEREE_BONUS.toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Your friends get a bonus too when they use your code!' });
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleClaim(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const referralStats = userData.referral || { pendingRewards: 0 };
        
        if (referralStats.pendingRewards < constants.REFERRAL.MIN_CLAIM_AMOUNT) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Rewards`)
                .setDescription(`You need at least $${constants.REFERRAL.MIN_CLAIM_AMOUNT.toFixed(2)} VEX to claim. Current pending: $${referralStats.pendingRewards.toFixed(2)} VEX`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const claimAmount = referralStats.pendingRewards;
        const taxAmount = claimAmount * constants.TAX_SYSTEM.REFERRAL.REWARD_TAX_RATE;
        const netAmount = claimAmount - taxAmount;
        
        await user.addVEX(netAmount, 'referral_rewards');
        await user.burnVEX(taxAmount, 'referral_tax');
        
        referralStats.totalEarned += claimAmount;
        referralStats.pendingRewards = 0;
        userData.referral = referralStats;
        
        userData.stats.referralRewardsClaimed = (userData.stats.referralRewardsClaimed || 0) + claimAmount;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Referral Rewards Claimed!`)
            .setDescription('Successfully claimed your referral rewards!')
            .addFields(
                { name: '💎 Gross Rewards', value: `$${claimAmount.toFixed(2)} VEX`, inline: true },
                { name: '💸 Tax (5%)', value: `$${taxAmount.toFixed(2)} VEX`, inline: true },
                { name: '💰 Net Received', value: `$${netAmount.toFixed(2)} VEX`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '📊 Total Lifetime Earned', value: `$${referralStats.totalEarned.toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Keep referring friends to earn more!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleLeaderboard(interaction) {
        const topReferrers = this.getTopReferrers();
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.TROPHY} Referral Leaderboard`)
            .setDescription('Top referrers in VexiumVerse!')
            .setColor(constants.COLORS.GOLD);
        
        if (topReferrers.length === 0) {
            embed.setDescription('No referrers yet. Be the first to start referring friends!');
        } else {
            const leaderboardText = topReferrers.map((referrer, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                return `${medal} **${referrer.username}** - ${referrer.referrals} referrals ($${referrer.earned.toFixed(2)} VEX)`;
            }).join('\n');
            
            embed.addFields({
                name: '🏆 Top Referrers',
                value: leaderboardText,
                inline: false
            });
        }
        
        embed.setFooter({ text: 'Start referring friends to climb the leaderboard!' });
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleRedeem(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const code = interaction.options.getString('code').toUpperCase();
        
        if (userData.referral && userData.referral.referredBy) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Already Referred`)
                .setDescription('You\'ve already been referred by someone else.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (userData.level > 5) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Level Too High`)
                .setDescription('Referral codes can only be redeemed by users below level 5.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const referrerId = this.findReferrerByCode(code);
        if (!referrerId || referrerId === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Invalid Code`)
                .setDescription('Invalid referral code or you cannot refer yourself.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const referrer = new User(referrerId);
        const referrerData = await referrer.load();
        
        await user.addVEX(constants.REFERRAL.REFEREE_BONUS, 'referral_bonus');
        
        if (!userData.referral) {
            userData.referral = {
                code: this.generateReferralCode(interaction.user.id),
                referrals: [],
                totalEarned: 0,
                pendingRewards: 0
            };
        }
        userData.referral.referredBy = referrerData.username || 'Unknown';
        
        if (!referrerData.referral) {
            referrerData.referral = {
                code: this.generateReferralCode(referrerId),
                referrals: [],
                totalEarned: 0,
                pendingRewards: 0
            };
        }
        
        referrerData.referral.referrals.push({
            userId: interaction.user.id,
            username: interaction.user.username,
            joinDate: Date.now(),
            earned: constants.REFERRAL.REFERRER_REWARD
        });
        referrerData.referral.pendingRewards += constants.REFERRAL.REFERRER_REWARD;
        
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        await referrer.save(referrerData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Referral Code Redeemed!`)
            .setDescription(`Welcome to VexiumVerse! You've been referred by **${referrerData.username}**!`)
            .addFields(
                { name: '🎁 Welcome Bonus', value: `$${constants.REFERRAL.REFEREE_BONUS.toFixed(2)} VEX`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '🤝 Referred By', value: referrerData.username, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Get your own referral code with /referral code!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    generateReferralCode(userId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const userHash = userId.slice(-4).toUpperCase();
        return `VEX${timestamp}${userHash}`;
    },
    
    findReferrerByCode(code) {
        return null;
    },
    
    getTopReferrers() {
        return [];
    },
    
    getRewardTiers() {
        return [
            { referrals: 5, bonus: 50 },
            { referrals: 10, bonus: 150 },
            { referrals: 25, bonus: 500 },
            { referrals: 50, bonus: 1500 },
            { referrals: 100, bonus: 5000 }
        ];
    }
};
