const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invest')
        .setDescription('Invest your VEX in various assets for potential returns')
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Buy an investment')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Investment type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Crypto', value: 'crypto' },
                            { name: 'Stocks', value: 'stocks' },
                            { name: 'Bonds', value: 'bonds' },
                            { name: 'Real Estate', value: 'real_estate' }
                        ))
                .addStringOption(option =>
                    option.setName('asset')
                        .setDescription('Specific asset to invest in')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription('Amount of VEX to invest')
                        .setRequired(true)
                        .setMinValue(0.01)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sell')
                .setDescription('Sell an investment')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Investment type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Crypto', value: 'crypto' },
                            { name: 'Stocks', value: 'stocks' },
                            { name: 'Bonds', value: 'bonds' },
                            { name: 'Real Estate', value: 'real_estate' }
                        ))
                .addStringOption(option =>
                    option.setName('asset')
                        .setDescription('Specific asset to sell')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('percentage')
                        .setDescription('Percentage of investment to sell (1-100)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(100)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('portfolio')
                .setDescription('View your investment portfolio'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('market')
                .setDescription('View available investments and market data')),
    
    cooldown: 5,
    
    async execute(interaction) {
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
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`You need $${amount.toFixed(2)} VEX but only have $${userData.vexBalance.toFixed(2)}.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const investmentData = constants.INVESTMENT_TYPES[type.toUpperCase()];
        if (!investmentData || !investmentData[asset]) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Invalid Investment`)
                .setDescription(`The asset **${asset}** is not available in the **${type}** category.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const assetData = investmentData[asset];
        
        if (amount < assetData.minInvestment) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Minimum Investment Required`)
                .setDescription(`The minimum investment for **${assetData.name}** is $${assetData.minInvestment.toFixed(2)} VEX.`)
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
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CHART} Investment Purchased!`)
            .setDescription(`Successfully invested in **${assetData.name}**`)
            .addFields(
                { name: '💰 Amount Invested', value: `$${amount.toFixed(2)} VEX`, inline: true },
                { name: '📊 Asset', value: `${assetData.name} (${assetData.symbol})`, inline: true },
                { name: '📈 Expected Return', value: `${(assetData.baseReturn * 100).toFixed(1)}% annually`, inline: true },
                { name: '⚠️ Volatility', value: `${(assetData.volatility * 100).toFixed(1)}%`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '📊 Total Invested', value: `$${userData.stats.totalInvested.toFixed(2)}`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Investments carry risk. Past performance doesn\'t guarantee future results.' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
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
                .setDescription(`You don't have any investments in **${asset}** in the **${type}** category.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const investment = userData.investments[type][asset];
        const daysSincePurchase = Math.floor((Date.now() - new Date(investment.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSincePurchase < 1) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Investment Locked`)
                .setDescription('Investments must be held for at least 24 hours before selling.')
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
            .setDescription(`Successfully sold ${percentage}% of your **${assetData.name}** investment`)
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
        
        await interaction.reply({ embeds: [embed] });
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
        
        await interaction.reply({ embeds: [embed] });
    }
};
