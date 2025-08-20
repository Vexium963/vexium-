const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bonds')
        .setDescription('Purchase government bonds for guaranteed returns over time')
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Purchase a government bond')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Type of bond to purchase')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Short-term (30 days, 3% return)', value: 'short' },
                            { name: 'Medium-term (90 days, 8% return)', value: 'medium' },
                            { name: 'Long-term (180 days, 18% return)', value: 'long' },
                            { name: 'Premium (365 days, 40% return)', value: 'premium' }))
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription('Amount of VEX to invest in bonds')
                        .setRequired(true)
                        .setMinValue(100)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('portfolio')
                .setDescription('View your bond portfolio and returns'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('redeem')
                .setDescription('Redeem a matured bond')
                .addStringOption(option =>
                    option.setName('bond_id')
                        .setDescription('ID of the bond to redeem')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('market')
                .setDescription('View bond market information and rates')),
    
    cooldown: 30,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                subcommand,
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                investmentFocus: true,
                wealthBuilding: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'bonds',
                behaviorContext
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(
                interaction.user.id,
                'bonds',
                true
            );
        }
        
        switch (subcommand) {
            case 'buy':
                return this.handleBuy(interaction);
            case 'portfolio':
                return this.handlePortfolio(interaction);
            case 'redeem':
                return this.handleRedeem(interaction);
            case 'market':
                return this.handleMarket(interaction);
        }
    },
    
    async handleBuy(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const bondType = interaction.options.getString('type');
        const amount = interaction.options.getNumber('amount');
        
        const totalBonds = userData.stats.bondsOwned || 0;
        const isBondExpert = totalBonds >= 10;
        const isBondNovice = totalBonds < 3;
        const totalInvested = userData.stats.totalBondInvestment || 0;
        const isHighValueInvestor = totalInvested >= 10000;
        
        const bondTypes = {
            short: { name: 'Short-term Bond', days: 30, returnRate: 0.03, minAmount: 100 },
            medium: { name: 'Medium-term Bond', days: 90, returnRate: 0.08, minAmount: 500 },
            long: { name: 'Long-term Bond', days: 180, returnRate: 0.18, minAmount: 1000 },
            premium: { name: 'Premium Bond', days: 365, returnRate: 0.40, minAmount: 5000 }
        };
        
        const bond = bondTypes[bondType];
        
        if (amount < bond.minAmount) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Minimum Investment Required`)
                .setDescription(`${bond.name} requires a minimum investment of $${bond.minAmount.toFixed(2)} VEX.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (userData.vexBalance < amount) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`Investment amount: $${amount.toFixed(2)} VEX\nYour balance: $${userData.vexBalance.toFixed(2)} VEX`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(amount, 'bond_purchase');
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Purchase Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const bondId = this.generateBondId();
        const maturityDate = new Date(Date.now() + bond.days * 24 * 60 * 60 * 1000);
        const maturityValue = amount * (1 + bond.returnRate);
        
        if (!userData.bonds) userData.bonds = [];
        
        const newBond = {
            id: bondId,
            type: bondType,
            name: bond.name,
            principal: amount,
            returnRate: bond.returnRate,
            maturityValue: maturityValue,
            purchaseDate: new Date().toISOString(),
            maturityDate: maturityDate.toISOString(),
            status: 'active',
            days: bond.days
        };
        
        userData.bonds.push(newBond);
        userData.stats.bondsOwned = (userData.stats.bondsOwned || 0) + 1;
        userData.stats.totalBondInvestment = (userData.stats.totalBondInvestment || 0) + amount;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const surpriseBonus = Math.random() < 0.15 ? Math.floor(amount * 0.02) : 0;
        if (surpriseBonus > 0) {
            await user.addVEX(surpriseBonus, 'bond_purchase_bonus');
        }
        
        let title = `${constants.EMOJIS.SUCCESS} Bond Purchased Successfully!`;
        let description = `Your **${bond.name}** has been issued!`;
        
        if (isBondExpert) {
            title = `👑 BOND MASTER STRIKES AGAIN!`;
            description = `🏆 **${totalBonds + 1} bonds owned!** Your **${bond.name}** shows your investment expertise!`;
        } else if (isBondNovice) {
            title = `🌟 SMART INVESTMENT CHOICE!`;
            description = `💡 **Building wealth wisely!** Your **${bond.name}** is a great start to your investment journey!`;
        }
        
        if (isHighValueInvestor) {
            description += `\n💎 **HIGH-VALUE INVESTOR STATUS** - You're in the top 5% of bond investors!`;
        }
        
        if (surpriseBonus > 0) {
            description += `\n✨ **SURPRISE BONUS: +$${surpriseBonus} VEX!** Lucky investment timing!`;
        }
        
        const socialProof = Math.random() < 0.3;
        if (socialProof) {
            const activeBondInvestors = Math.floor(Math.random() * 25) + 15;
            description += `\n📈 **${activeBondInvestors} investors** bought bonds in the last hour!`;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .addFields(
                { name: '🆔 Bond ID', value: bondId, inline: true },
                { name: '📊 Bond Type', value: bond.name, inline: true },
                { name: '💰 Principal', value: `$${amount.toFixed(2)} VEX`, inline: true },
                { name: '📈 Return Rate', value: `${(bond.returnRate * 100).toFixed(1)}%`, inline: true },
                { name: '💎 Maturity Value', value: `$${maturityValue.toFixed(2)} VEX`, inline: true },
                { name: '📅 Maturity Date', value: `<t:${Math.floor(maturityDate.getTime() / 1000)}:F>`, inline: true },
                { name: '⏰ Time to Maturity', value: `${bond.days} days`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '📊 Expected Profit', value: `$${(maturityValue - amount).toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `Bond #${bondId} • Government guaranteed returns` })
            .setTimestamp();
        
        const portfolioButton = new ButtonBuilder()
            .setCustomId('bonds_portfolio')
            .setLabel('View Portfolio')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊');
        
        const marketButton = new ButtonBuilder()
            .setCustomId('bonds_market')
            .setLabel('Bond Market')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📈');
        
        const row = new ActionRowBuilder().addComponents(portfolioButton, marketButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handlePortfolio(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const bonds = userData.bonds || [];
        const activeBonds = bonds.filter(b => b.status === 'active');
        const maturedBonds = bonds.filter(b => b.status === 'active' && new Date() >= new Date(b.maturityDate));
        
        const totalInvested = bonds.reduce((sum, bond) => sum + bond.principal, 0);
        const totalValue = activeBonds.reduce((sum, bond) => sum + bond.maturityValue, 0);
        const totalReturns = userData.stats.totalBondReturns || 0;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.BONDS} ${interaction.user.displayName}'s Bond Portfolio`)
            .setDescription('Your government bond investments and returns')
            .addFields(
                { name: '📊 Portfolio Summary', value: `**Active Bonds**: ${activeBonds.length}\n**Total Invested**: $${totalInvested.toFixed(2)} VEX\n**Portfolio Value**: $${totalValue.toFixed(2)} VEX`, inline: true },
                { name: '💰 Returns', value: `**Lifetime Returns**: $${totalReturns.toFixed(2)} VEX\n**Matured Bonds**: ${maturedBonds.length}\n**Bonds Owned**: ${userData.stats.bondsOwned || 0}`, inline: true },
                { name: '📈 Performance', value: `**ROI**: ${totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(1) : '0.0'}%\n**Avg Return**: $${activeBonds.length > 0 ? (totalReturns / activeBonds.length).toFixed(2) : '0.00'}\n**Success Rate**: 100%`, inline: true }
            )
            .setColor(constants.COLORS.BONDS)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: 'Government bonds provide guaranteed returns' })
            .setTimestamp();
        
        if (activeBonds.length === 0) {
            embed.addFields({
                name: '📦 No Active Bonds',
                value: 'You don\'t have any active bonds.\n\nUse `/bonds buy` to start investing in government bonds!',
                inline: false
            });
        } else {
            for (const bond of activeBonds.slice(0, 6)) {
                const isMatured = new Date() >= new Date(bond.maturityDate);
                const status = isMatured ? '🎁 Ready to Redeem' : '⏳ Maturing';
                const timeLeft = isMatured ? 'Matured' : `<t:${Math.floor(new Date(bond.maturityDate).getTime() / 1000)}:R>`;
                
                embed.addFields({
                    name: `💎 ${bond.name}`,
                    value: `**ID**: ${bond.id}\n**Value**: $${bond.maturityValue.toFixed(2)} VEX\n**Status**: ${status}\n**${isMatured ? 'Matured' : 'Matures'}**: ${timeLeft}`,
                    inline: true
                });
            }
        }
        
        if (maturedBonds.length > 0) {
            embed.addFields({
                name: '🎁 Matured Bonds Ready',
                value: `${maturedBonds.length} bond${maturedBonds.length > 1 ? 's' : ''} ready to redeem!\nUse \`/bonds redeem <bond_id>\` to claim returns.`,
                inline: false
            });
        }
        
        const redeemButton = new ButtonBuilder()
            .setCustomId('bonds_redeem_menu')
            .setLabel('Redeem Bonds')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💰')
            .setDisabled(maturedBonds.length === 0);
        
        const buyButton = new ButtonBuilder()
            .setCustomId('bonds_buy_menu')
            .setLabel('Buy More Bonds')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📈');
        
        const row = new ActionRowBuilder().addComponents(redeemButton, buyButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleRedeem(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const bondId = interaction.options.getString('bond_id');
        
        if (!userData.bonds || userData.bonds.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} No Bonds Found`)
                .setDescription('You don\'t have any bonds to redeem.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const bond = userData.bonds.find(b => b.id === bondId && b.status === 'active');
        
        if (!bond) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Bond Not Found`)
                .setDescription(`No active bond found with ID: ${bondId}\n\nUse \`/bonds portfolio\` to see your bonds.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (new Date() < new Date(bond.maturityDate)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Bond Not Matured`)
                .setDescription(`This bond hasn't matured yet!\n\n**Matures**: <t:${Math.floor(new Date(bond.maturityDate).getTime() / 1000)}:R>`)
                .addFields(
                    { name: '⚠️ Early Redemption', value: 'Government bonds cannot be redeemed before maturity.\nThis ensures guaranteed returns for all investors.', inline: false }
                )
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const returns = bond.maturityValue - bond.principal;
        
        await user.addVEX(bond.maturityValue, 'bond_redemption');
        
        bond.status = 'redeemed';
        bond.redeemedAt = new Date().toISOString();
        
        userData.stats.bondsRedeemed = (userData.stats.bondsRedeemed || 0) + 1;
        userData.stats.totalBondReturns = (userData.stats.totalBondReturns || 0) + returns;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Bond Redeemed Successfully!`)
            .setDescription(`**${bond.name}** has been redeemed with full returns!`)
            .addFields(
                { name: '🆔 Bond ID', value: bond.id, inline: true },
                { name: '💰 Principal', value: `$${bond.principal.toFixed(2)} VEX`, inline: true },
                { name: '📈 Returns', value: `$${returns.toFixed(2)} VEX`, inline: true },
                { name: '💎 Total Received', value: `$${bond.maturityValue.toFixed(2)} VEX`, inline: true },
                { name: '📊 Return Rate', value: `${(bond.returnRate * 100).toFixed(1)}%`, inline: true },
                { name: '⏰ Investment Period', value: `${bond.days} days`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '🏆 Total Returns', value: `$${userData.stats.totalBondReturns.toFixed(2)} VEX`, inline: true },
                { name: '📅 Redeemed', value: 'Just now', inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `Bond #${bondId} • Government guaranteed returns delivered` })
            .setTimestamp();
        
        const portfolioButton = new ButtonBuilder()
            .setCustomId('bonds_portfolio')
            .setLabel('View Portfolio')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊');
        
        const buyButton = new ButtonBuilder()
            .setCustomId('bonds_buy_menu')
            .setLabel('Buy More Bonds')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📈');
        
        const row = new ActionRowBuilder().addComponents(portfolioButton, buyButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleMarket(interaction) {
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.MARKET} Government Bond Market`)
            .setDescription('Secure, guaranteed returns backed by the VexiumVerse Treasury')
            .addFields(
                { name: '📊 Market Overview', value: '**Status**: Open for Trading\n**Backed By**: VexiumVerse Treasury\n**Risk Level**: Zero Risk\n**Guarantee**: 100% Principal + Returns', inline: false },
                { name: '💎 Short-term Bond (30 days)', value: '**Return**: 3.0% guaranteed\n**Min Investment**: $100 VEX\n**Best For**: Quick returns', inline: true },
                { name: '📈 Medium-term Bond (90 days)', value: '**Return**: 8.0% guaranteed\n**Min Investment**: $500 VEX\n**Best For**: Balanced growth', inline: true },
                { name: '🚀 Long-term Bond (180 days)', value: '**Return**: 18.0% guaranteed\n**Min Investment**: $1,000 VEX\n**Best For**: Serious investors', inline: true },
                { name: '👑 Premium Bond (365 days)', value: '**Return**: 40.0% guaranteed\n**Min Investment**: $5,000 VEX\n**Best For**: Maximum returns', inline: true },
                { name: '🏛️ Government Backing', value: 'All bonds are backed by the VexiumVerse Treasury with 100% guarantee of principal and returns. No risk of default.', inline: false },
                { name: '💡 Investment Tips', value: '• Diversify across different terms\n• Reinvest returns for compound growth\n• Bonds cannot be redeemed early\n• Perfect for risk-free growth', inline: false }
            )
            .setColor(constants.COLORS.MARKET)
            .setFooter({ text: 'Government bonds • Zero risk • Guaranteed returns' })
            .setTimestamp();
        
        const buyButton = new ButtonBuilder()
            .setCustomId('bonds_buy_menu')
            .setLabel('Purchase Bonds')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💰');
        
        const portfolioButton = new ButtonBuilder()
            .setCustomId('bonds_portfolio')
            .setLabel('My Portfolio')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊');
        
        const calculatorButton = new ButtonBuilder()
            .setCustomId('bonds_calculator')
            .setLabel('Return Calculator')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🧮');
        
        const row = new ActionRowBuilder().addComponents(buyButton, portfolioButton, calculatorButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    generateBondId() {
        return 'BOND' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    }
};
