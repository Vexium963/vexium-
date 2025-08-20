const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('insurance')
        .setDescription('Protect your VEX with insurance policies against losses')
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Purchase insurance coverage')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Type of insurance coverage')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Basic - 25% coverage, 50 VEX/month', value: 'basic' },
                            { name: 'Premium - 50% coverage, 100 VEX/month', value: 'premium' },
                            { name: 'Elite - 75% coverage, 200 VEX/month', value: 'elite' }))
                .addIntegerOption(option =>
                    option.setName('months')
                        .setDescription('Number of months to purchase')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(12)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('File an insurance claim for losses')
                .addNumberOption(option =>
                    option.setName('loss_amount')
                        .setDescription('Amount of VEX lost')
                        .setRequired(true)
                        .setMinValue(1))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for the loss')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Entertainment game losses', value: 'entertainment' },
                            { name: 'Investment losses', value: 'investment' },
                            { name: 'Trading losses', value: 'trading' },
                            { name: 'System error', value: 'system' })))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check your insurance coverage status'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription('Cancel your insurance policy')),
    
    cooldown: 30,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'insurance', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                riskManagement: true,
                wealthProtection: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'insurance',
                behaviorContext
            );
        }
        
        const insuranceUsage = userData.stats.insurancePurchases || 0;
        const isInsuranceExpert = insuranceUsage >= 5;
        const isInsuranceNovice = insuranceUsage === 0;
        const hasActiveClaims = userData.insurance?.claimsUsed > 0;
        const urgencyBonus = Math.random() < 0.15 ? Math.floor(userData.networth * 0.02) : 0;
        
        if (isInsuranceNovice && Math.random() < 0.3) {
            const embed = new EmbedBuilder()
                .setTitle(`🚨 WEALTH PROTECTION ALERT!`)
                .setDescription(`💰 **Your $${userData.networth.toFixed(2)} VEX empire is UNPROTECTED!**\n\n⚠️ **${Math.floor(Math.random() * 20) + 10} players lost VEX today** without insurance!\n🛡️ **Smart investors protect their wealth** - don't be the next victim!`)
                .addFields(
                    { name: '🔥 URGENT PROTECTION NEEDED', value: `💎 **Net Worth**: $${userData.networth.toFixed(2)} VEX\n⚡ **Risk Level**: ${userData.networth >= 1000 ? 'HIGH' : 'MODERATE'}\n🎯 **Recommended**: ${userData.networth >= 5000 ? 'Elite' : userData.networth >= 1000 ? 'Premium' : 'Basic'} Coverage`, inline: false },
                    { name: '📊 LIVE STATS', value: `🔥 **${Math.floor(Math.random() * 50) + 30} claims processed today**\n💰 **$${(Math.random() * 50000 + 10000).toFixed(0)} VEX protected this week**\n⚡ **${Math.floor(Math.random() * 15) + 5} players buying insurance now!**`, inline: false }
                )
                .setColor(constants.COLORS.ERROR)
                .setFooter({ text: '⏰ Don\'t wait until it\'s too late! Protect your empire NOW!' })
                .setTimestamp();
            
            await interaction.followUp({ embeds: [embed], ephemeral: true });
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'buy':
                return this.handleBuy(interaction);
            case 'claim':
                return this.handleClaim(interaction);
            case 'status':
                return this.handleStatus(interaction);
            case 'cancel':
                return this.handleCancel(interaction);
        }
    },
    
    async handleBuy(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const type = interaction.options.getString('type');
        const months = interaction.options.getInteger('months');
        
        const policies = {
            basic: { coverage: 0.25, monthlyCost: 50, name: 'Basic Protection' },
            premium: { coverage: 0.50, monthlyCost: 100, name: 'Premium Shield' },
            elite: { coverage: 0.75, monthlyCost: 200, name: 'Elite Guardian' }
        };
        
        const policy = policies[type];
        const totalCost = policy.monthlyCost * months;
        
        if (userData.insurance && userData.insurance.active) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Active Policy Exists`)
                .setDescription('You already have an active insurance policy.\n\nCancel your current policy first or wait for it to expire.')
                .addFields(
                    { name: '📋 Current Policy', value: `${userData.insurance.type.charAt(0).toUpperCase() + userData.insurance.type.slice(1)}`, inline: true },
                    { name: '📅 Expires', value: `<t:${Math.floor(new Date(userData.insurance.expiresAt).getTime() / 1000)}:R>`, inline: true }
                )
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (userData.vexBalance < totalCost) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`Insurance cost: $${totalCost.toFixed(2)} VEX\nYour balance: $${userData.vexBalance.toFixed(2)} VEX`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(totalCost, 'insurance_purchase');
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Purchase Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const expiresAt = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
        
        userData.insurance = {
            type: type,
            coverage: policy.coverage,
            active: true,
            purchasedAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
            claimsUsed: 0,
            maxClaims: months * 2, // 2 claims per month
            totalPaid: totalCost
        };
        
        userData.stats.insurancePurchases = (userData.stats.insurancePurchases || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Insurance Policy Activated!`)
            .setDescription(`**${policy.name}** is now protecting your VEX!`)
            .addFields(
                { name: '🛡️ Policy Type', value: policy.name, inline: true },
                { name: '📊 Coverage', value: `${(policy.coverage * 100)}% of losses`, inline: true },
                { name: '💰 Total Cost', value: `$${totalCost.toFixed(2)} VEX`, inline: true },
                { name: '📅 Duration', value: `${months} month${months > 1 ? 's' : ''}`, inline: true },
                { name: '📋 Claims Available', value: `${userData.insurance.maxClaims} claims`, inline: true },
                { name: '⏰ Expires', value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`, inline: true },
                { name: '🔒 What\'s Covered', value: '• Entertainment game losses\n• Investment losses\n• Trading losses\n• System errors', inline: false },
                { name: '💡 How to Claim', value: 'Use `/insurance claim` when you experience covered losses', inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Insurance policy terms and conditions apply' })
            .setTimestamp();
        
        const claimButton = new ButtonBuilder()
            .setCustomId('insurance_claim_guide')
            .setLabel('Claim Guide')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📋');
        
        const statusButton = new ButtonBuilder()
            .setCustomId('insurance_status')
            .setLabel('Policy Status')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📊');
        
        const row = new ActionRowBuilder().addComponents(claimButton, statusButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleClaim(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.insurance || !userData.insurance.active) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} No Active Policy`)
                .setDescription('You don\'t have an active insurance policy.\n\nPurchase insurance first to file claims.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (new Date() > new Date(userData.insurance.expiresAt)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Policy Expired`)
                .setDescription('Your insurance policy has expired.\n\nPurchase a new policy to continue coverage.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (userData.insurance.claimsUsed >= userData.insurance.maxClaims) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Claims Exhausted`)
                .setDescription('You have used all available claims for this policy period.\n\nWait for renewal or purchase additional coverage.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const lossAmount = interaction.options.getNumber('loss_amount');
        const reason = interaction.options.getString('reason');
        
        const maxClaimAmount = 10000; // Maximum claim per incident
        
        if (lossAmount > maxClaimAmount) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Claim Too Large`)
                .setDescription(`Maximum claim amount is $${maxClaimAmount.toFixed(2)} VEX per incident.\n\nFor larger losses, file multiple claims over time.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const coverageAmount = lossAmount * userData.insurance.coverage;
        const claimId = this.generateClaimId();
        
        await user.addVEX(coverageAmount, 'insurance_claim');
        
        userData.insurance.claimsUsed++;
        
        if (!userData.insurance.claims) userData.insurance.claims = [];
        userData.insurance.claims.push({
            id: claimId,
            amount: lossAmount,
            coverage: coverageAmount,
            reason: reason,
            filedAt: new Date().toISOString(),
            status: 'approved'
        });
        
        userData.stats.insuranceClaims = (userData.stats.insuranceClaims || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Insurance Claim Approved!`)
            .setDescription(`Your claim has been processed and approved.`)
            .addFields(
                { name: '🆔 Claim ID', value: claimId, inline: true },
                { name: '💸 Loss Amount', value: `$${lossAmount.toFixed(2)} VEX`, inline: true },
                { name: '💰 Coverage Paid', value: `$${coverageAmount.toFixed(2)} VEX`, inline: true },
                { name: '📋 Reason', value: reason.charAt(0).toUpperCase() + reason.slice(1), inline: true },
                { name: '📊 Coverage Rate', value: `${(userData.insurance.coverage * 100)}%`, inline: true },
                { name: '🔢 Claims Remaining', value: `${userData.insurance.maxClaims - userData.insurance.claimsUsed}`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `Claim #${claimId} • Funds have been added to your wallet` })
            .setTimestamp();
        
        const statusButton = new ButtonBuilder()
            .setCustomId('insurance_status')
            .setLabel('Policy Status')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊');
        
        const historyButton = new ButtonBuilder()
            .setCustomId('insurance_claim_history')
            .setLabel('Claim History')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋');
        
        const row = new ActionRowBuilder().addComponents(statusButton, historyButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleStatus(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.insurance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.INSURANCE} Insurance Status`)
                .setDescription('You don\'t have any insurance coverage.\n\nProtect your VEX with an insurance policy!')
                .addFields(
                    { name: '🛡️ Available Policies', value: '**Basic**: 25% coverage - $50/month\n**Premium**: 50% coverage - $100/month\n**Elite**: 75% coverage - $200/month', inline: false },
                    { name: '💡 Benefits', value: '• Protection against losses\n• Peace of mind\n• Quick claim processing\n• Multiple coverage options', inline: false }
                )
                .setColor(constants.COLORS.INFO);
            
            const buyButton = new ButtonBuilder()
                .setCustomId('insurance_buy_menu')
                .setLabel('Buy Insurance')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🛡️');
            
            const row = new ActionRowBuilder().addComponents(buyButton);
            
            return interaction.reply({ embeds: [embed], components: [row] });
        }
        
        const isActive = userData.insurance.active && new Date() < new Date(userData.insurance.expiresAt);
        const statusEmoji = isActive ? '✅' : '❌';
        const statusText = isActive ? 'Active' : 'Expired';
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.INSURANCE} Insurance Policy Status`)
            .setDescription(`Your insurance policy overview`)
            .addFields(
                { name: '📊 Policy Status', value: `${statusEmoji} ${statusText}`, inline: true },
                { name: '🛡️ Policy Type', value: userData.insurance.type.charAt(0).toUpperCase() + userData.insurance.type.slice(1), inline: true },
                { name: '📈 Coverage Rate', value: `${(userData.insurance.coverage * 100)}%`, inline: true },
                { name: '📅 Purchased', value: `<t:${Math.floor(new Date(userData.insurance.purchasedAt).getTime() / 1000)}:R>`, inline: true },
                { name: '⏰ Expires', value: `<t:${Math.floor(new Date(userData.insurance.expiresAt).getTime() / 1000)}:R>`, inline: true },
                { name: '💰 Total Paid', value: `$${userData.insurance.totalPaid.toFixed(2)} VEX`, inline: true },
                { name: '🔢 Claims Used', value: `${userData.insurance.claimsUsed}/${userData.insurance.maxClaims}`, inline: true },
                { name: '💸 Total Claims', value: `$${this.getTotalClaims(userData.insurance.claims || []).toFixed(2)} VEX`, inline: true },
                { name: '📊 Claim Success Rate', value: '100%', inline: true }
            )
            .setColor(isActive ? constants.COLORS.SUCCESS : constants.COLORS.ERROR)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: 'Insurance protects your VEX investments' })
            .setTimestamp();
        
        if (userData.insurance.claims && userData.insurance.claims.length > 0) {
            const recentClaims = userData.insurance.claims
                .sort((a, b) => new Date(b.filedAt) - new Date(a.filedAt))
                .slice(0, 3)
                .map(claim => `• $${claim.coverage.toFixed(2)} VEX - ${claim.reason}`)
                .join('\n');
            
            embed.addFields({
                name: '📋 Recent Claims',
                value: recentClaims,
                inline: false
            });
        }
        
        const renewButton = new ButtonBuilder()
            .setCustomId('insurance_renew')
            .setLabel('Renew Policy')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🔄')
            .setDisabled(isActive);
        
        const claimButton = new ButtonBuilder()
            .setCustomId('insurance_claim_menu')
            .setLabel('File Claim')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📋')
            .setDisabled(!isActive || userData.insurance.claimsUsed >= userData.insurance.maxClaims);
        
        const cancelButton = new ButtonBuilder()
            .setCustomId('insurance_cancel')
            .setLabel('Cancel Policy')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
            .setDisabled(!isActive);
        
        const row = new ActionRowBuilder().addComponents(renewButton, claimButton, cancelButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    generateClaimId() {
        return 'CLM' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    },
    
    getTotalClaims(claims) {
        return claims.reduce((total, claim) => total + claim.coverage, 0);
    }
};
