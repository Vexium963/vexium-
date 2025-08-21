const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invest')
        .setDescription(`📈 Build wealth through strategic investments - Join successful investors earning passive income!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription(`💸 Purchase high-yield assets - Limited-time market opportunities!`)
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription(`${constants.ANIMATED_EMOJIS.FIRE} Choose your wealth-building strategy - Crypto, stocks, bonds, o...`)
                        .setRequired(true)
                        .addChoices(
                            { name: 'Crypto', value: 'crypto' },
                            { name: 'Stocks', value: 'stocks' },
                            { name: 'Bonds', value: 'bonds' },
                            { name: 'Real Estate', value: 'real_estate' }
                        ))
                .addStringOption(option =>
                    option.setName('asset')
                        .setDescription(`✨ Select your target asset - Research shows diversification increases returns by 40%`)
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription(`🚀 Investment amount - Start small, think big! Every dollar counts toward financial freedom`)
                        .setRequired(true)
                        .setMinValue(0.01)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sell')
                .setDescription(`💥 Liquidate assets for instant VEX - Secure your profits before market volatility!`)
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription(`${constants.ANIMATED_EMOJIS.FIRE} Choose your wealth-building strategy - Crypto, stocks, bonds, o...`)
                        .setRequired(true)
                        .addChoices(
                            { name: 'Crypto', value: 'crypto' },
                            { name: 'Stocks', value: 'stocks' },
                            { name: 'Bonds', value: 'bonds' },
                            { name: 'Real Estate', value: 'real_estate' }
                        ))
                .addStringOption(option =>
                    option.setName('asset')
                        .setDescription(`📈 Target asset for liquidation - Smart investors take profits at peaks`)
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('percentage')
                        .setDescription(`📊 Sell percentage (1-100%) - Partial sales preserve long-term growth potential`)
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(100)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('portfolio')
                .setDescription(`🏆 Track your wealth empire - See real-time returns and portfolio performance`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('market')
                .setDescription(`🌈 Explore market opportunities - Discover trending assets before they moon!`)),
    
    cooldown: 5,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                investmentActivity: true,
                wealthBuilding: true
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
        
        const totalInvestments = userData.stats.totalInvested || 0;
        const isInvestmentNovice = totalInvestments < 100;
        const isInvestmentExpert = totalInvestments >= 5000;
        const portfolioValue = this.calculatePortfolioValue(userData);
        const isHighRoller = portfolioValue >= 10000;
        
        if (isInvestmentNovice && Math.random() < 0.3) {
            const bonusAmount = Math.floor(Math.random() * 50) + 25;
            await user.addVEX(bonusAmount, 'investment_newbie_bonus');
            
            const bonusEmbed = new EmbedBuilder()
                .setTitle(`🎉 INVESTMENT NEWBIE BONUS!`)
                .setDescription(`🎉 **Welcome to wealth building!** Here's $${bonusAmount} VEX to boost your first investments!\n\...`)
                .setColor(constants.COLORS.SUCCESS)
                .setTimestamp();
            
            await interaction.followUp({ embeds: [bonusEmbed], ephemeral: true });
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'buy':
                return this.handleBuy(interaction);
            case 'sell':
                return this.handleSell(interaction);
            case 'portfolio':
                return this.handlePortfolio(interaction);
            case 'market':
                return this.handleMarket(interaction);
        }
    },
    
    async handleBuy(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const type = interaction.options.getString('type');
        const asset = interaction.options.getString('asset');
        const amount = interaction.options.getNumber('amount');
        
        if (amount > userData.vexBalance) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`💥 **Investment opportunity slipping away!** You need $${amount.toFixed(2)} VEX but only have $${userData.vexBalance.toFixed(2)}.\n\n${fomoMessage}\n\n🚀 **Quick fix:** Use \`/work\` or \`/daily\` to earn more VEX!\n🔥 **Hurry:** Market conditions change every hour!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const investmentData = constants.INVESTMENT_TYPES[type.toUpperCase()];
        if (!investmentData || !investmentData[asset]) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Invalid Investment`)
                .setDescription(`💥 **Asset not found!** The asset **${asset}** is not available in the **${type}** category.\n\n✨ **Pro tip:** Use \`/invest market\` to see all available opportunities!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const assetData = investmentData[asset];
        
        if (amount < assetData.minInvestment) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Minimum Investment Required`)
                .setDescription(`📈 **Minimum investment required!** The minimum investment for **${assetData.name}** is $${assetD...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(amount, 'investment', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Transaction Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (!userData.investments[type]) {
            userData.investments[type] = {};
        }
        
        if (!userData.investments[type][asset]) {
            userData.investments[type][asset] = {
                totalInvested: 0,
                currentValue: 0,
                purchaseDate: new Date().toISOString(),
                lastUpdate: new Date().toISOString()
            };
        }
        
        userData.investments[type][asset].totalInvested += amount;
        userData.investments[type][asset].currentValue += amount;
        userData.investments[type][asset].lastUpdate = new Date().toISOString();
        
        userData.stats.totalInvested += amount;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 75) + 25);
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        const milestoneMessage = userData.stats.totalInvested >= 1000 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const investmentProgress = Math.min(userData.stats.totalInvested / 10000, 1);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Investment Portfolio: $${userData.stats.totalInvested.toFixed(0)} VEX`,
            investmentProgress,
            constants.COLORS.SUCCESS
        );

        const embed = new EmbedBuilder()
            .setTitle(`📈 Investment Purchased!`)
            .setDescription(`🎉 **Investment secured!** Successfully invested in **${assetData.name}**${variableReward ? `\n\n✨ ${variableReward}` : ''}${milestoneMessage ? `\n\n🏆 ${milestoneMessage}` : ''}\n\n🔥 ${socialProof}\n\n🚀 **Your wealth empire grows stronger!**`)
            .addFields(
                { name: '💰 Amount Invested', value: `$${amount.toFixed(2)} VEX`, inline: true },
                { name: '📊 Asset', value: `${assetData.name} (${assetData.symbol})`, inline: true },
                { name: '📈 Expected Return', value: `${(assetData.baseReturn * 100).toFixed(1)}% annually`, inline: true },
                { name: '⚠️ Volatility', value: `${(assetData.volatility * 100).toFixed(1)}%`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '📊 Total Invested', value: `$${userData.stats.totalInvested.toFixed(2)}`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setImage('attachment://progress.png')
            .setFooter({ text: 'Investments carry risk. Past performance doesn\'t guarantee future results.' })
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleSell(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const type = interaction.options.getString('type');
        const asset = interaction.options.getString('asset');
        const percentage = interaction.options.getNumber('percentage') || 100;
        
        if (!userData.investments[type] || !userData.investments[type][asset]) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Investment Not Found`)
                .setDescription(`${constants.ANIMATED_EMOJIS.EXPLOSION} **Investment not found!** You don't have any investments in **${asset}** in the **${type}** category.\n\n${constants.ANIMATED_EMOJIS.CHART} **Build your portfolio:** Use \`/invest buy\` to start investing!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const investment = userData.investments[type][asset];
        const daysSincePurchase = Math.floor((Date.now() - new Date(investment.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSincePurchase < 1) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Investment Locked`)
                .setDescription(`${constants.ANIMATED_EMOJIS.LOADING} **Investment locked for your protection!** Investments must ...`)
                .addFields(
                    { name: '⏰ Time Remaining', value: `${24 - Math.floor((Date.now() - new Date(investment.purchaseDate).getTime()) / (1000 * 60 * 60))} hours`, inline: true }
                )
                .setColor(constants.COLORS.WARNING);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const assetData = constants.INVESTMENT_TYPES[type.toUpperCase()][asset];
        const currentValue = Economics.calculateInvestmentReturn(
            type, 
            asset, 
            investment.totalInvested, 
            daysSincePurchase
        );
        
        const sellAmount = (currentValue * percentage) / 100;
        const sellPortion = percentage / 100;
        
        const taxAmount = sellAmount * 0.02;
        const netAmount = sellAmount - taxAmount;
        
        await user.addVEX(netAmount, 'investment_sale');
        await user.burnVEX(taxAmount, 'investment_tax');
        
        investment.totalInvested *= (1 - sellPortion);
        investment.currentValue *= (1 - sellPortion);
        
        if (investment.totalInvested < 0.01) {
            delete userData.investments[type][asset];
        }
        
        const profit = sellAmount - (investment.totalInvested * sellPortion);
        userData.stats.investmentReturns += profit;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.MONEY} Investment Sold!`)
            .setDescription(`${constants.ANIMATED_EMOJIS.MONEY_RAIN} **Profits secured!** Successfully sold ${percentage}% of ...`)
            .addFields(
                { name: '💰 Gross Sale', value: `$${sellAmount.toFixed(2)} VEX`, inline: true },
                { name: '💸 Tax (2%)', value: `$${taxAmount.toFixed(2)} VEX`, inline: true },
                { name: '💵 Net Received', value: `$${netAmount.toFixed(2)} VEX`, inline: true },
                { name: '📈 Profit/Loss', value: `${profit >= 0 ? '+' : ''}$${profit.toFixed(2)} VEX`, inline: true },
                { name: '📊 Days Held', value: `${daysSincePurchase} days`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(profit >= 0 ? constants.COLORS.SUCCESS : constants.COLORS.ERROR)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handlePortfolio(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        let totalInvestmentValue = 0;
        let totalInvested = 0;
        const portfolioFields = [];
        
        for (const [type, investments] of Object.entries(userData.investments)) {
            if (Object.keys(investments).length === 0) continue;
            
            let categoryValue = 0;
            let categoryInvested = 0;
            const assets = [];
            
            for (const [asset, investment] of Object.entries(investments)) {
                const daysSincePurchase = Math.floor((Date.now() - new Date(investment.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
                const currentValue = Economics.calculateInvestmentReturn(type, asset, investment.totalInvested, daysSincePurchase);
                const profit = currentValue - investment.totalInvested;
                const profitPercent = (profit / investment.totalInvested) * 100;
                
                categoryValue += currentValue;
                categoryInvested += investment.totalInvested;
                
                const assetData = constants.INVESTMENT_TYPES[type.toUpperCase()][asset];
                assets.push(`**${assetData.name}**: $${currentValue.toFixed(2)} (${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(1)}%)`);
            }
            
            if (assets.length > 0) {
                totalInvestmentValue += categoryValue;
                totalInvested += categoryInvested;
                
                portfolioFields.push({
                    name: `${type.charAt(0).toUpperCase() + type.slice(1)} - $${categoryValue.toFixed(2)}`,
                    value: assets.join('\n'),
                    inline: false
                });
            }
        }
        
        if (portfolioFields.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.CHART} Investment Portfolio`)
                .setDescription('You don\'t have any investments yet. Use `/invest market` to see available options!')
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const totalProfit = totalInvestmentValue - totalInvested;
        const totalProfitPercent = (totalProfit / totalInvested) * 100;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CHART} Your Investment Portfolio`)
            .setDescription(`**Total Portfolio Value**: $${totalInvestmentValue.toFixed(2)} VEX`)
            .addFields(
                { name: '💰 Total Invested', value: `$${totalInvested.toFixed(2)}`, inline: true },
                { name: '📈 Total Profit/Loss', value: `${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`, inline: true },
                { name: '📊 Return %', value: `${totalProfitPercent >= 0 ? '+' : ''}${totalProfitPercent.toFixed(2)}%`, inline: true },
                ...portfolioFields
            )
            .setColor(totalProfit >= 0 ? constants.COLORS.SUCCESS : constants.COLORS.ERROR)
            .setFooter({ text: 'Use /invest sell to liquidate investments' })
            .setTimestamp();
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const portfolioProgress = Math.min(totalInvestmentValue / 50000, 1);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Portfolio Value: $${totalInvestmentValue.toFixed(0)} VEX`,
            portfolioProgress,
            totalProfit >= 0 ? constants.COLORS.SUCCESS : constants.COLORS.ERROR
        );

        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleMarket(interaction) {
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CHART} Investment Market`)
            .setDescription('Available investment opportunities in VexiumVerse')
            .setColor(constants.COLORS.PRIMARY);
        
        for (const [category, assets] of Object.entries(constants.INVESTMENT_TYPES)) {
            const assetList = Object.entries(assets).map(([key, asset]) => 
                `**${asset.name}** (${asset.symbol})\n` +
                `Expected: ${(asset.baseReturn * 100).toFixed(1)}% | Risk: ${(asset.volatility * 100).toFixed(1)}%\n` +
                `Min: $${asset.minInvestment.toFixed(2)}`
            ).join('\n\n');
            
            embed.addFields({
                name: `${category.charAt(0) + category.slice(1).toLowerCase().replace('_', ' ')}`,
                value: assetList,
                inline: false
            });
        }
        
        embed.setFooter({ text: 'Use /invest buy <type> <asset> <amount> to invest' });
        
        await interaction.reply({ 
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('invest_quick_buy')
                    .setPlaceholder('🚀 Quick invest in trending assets')
                    .addOptions([
                        { label: 'Bitcoin (BTC)', value: 'crypto_bitcoin', emoji: '₿' },
                        { label: 'Tesla Stock (TSLA)', value: 'stocks_tesla', emoji: '🚗' },
                        { label: 'US Treasury Bonds', value: 'bonds_us_treasury', emoji: '🏛️' },
                        { label: 'Manhattan Real Estate', value: 'real_estate_manhattan', emoji: '🏢' }
                    ])
            )]
        });
    }
};
