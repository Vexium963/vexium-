const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stocks')
        .setDescription('Trade virtual stocks and build your investment portfolio')
        .addSubcommand(subcommand =>
            subcommand
                .setName('market')
                .setDescription('View the stock market and available stocks'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Purchase shares of a stock')
                .addStringOption(option =>
                    option.setName('symbol')
                        .setDescription('Stock symbol to purchase')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('shares')
                        .setDescription('Number of shares to buy')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(1000)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sell')
                .setDescription('Sell shares from your portfolio')
                .addStringOption(option =>
                    option.setName('symbol')
                        .setDescription('Stock symbol to sell')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('shares')
                        .setDescription('Number of shares to sell')
                        .setRequired(true)
                        .setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('portfolio')
                .setDescription('View your stock portfolio and performance'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('watchlist')
                .setDescription('Manage your stock watchlist')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Action to perform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'View Watchlist', value: 'view' },
                            { name: 'Add Stock', value: 'add' },
                            { name: 'Remove Stock', value: 'remove' }))
                .addStringOption(option =>
                    option.setName('symbol')
                        .setDescription('Stock symbol (required for add/remove)')
                        .setRequired(false))),
    
    cooldown: 15,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: (userData.stats.lastCommand === 'stocks'),
                quickReturn: (Date.now() - (userData.stats.lastStocksUse || 0)) < 300000,
                timeSinceLastUse: Date.now() - (userData.stats.lastStocksUse || 0),
                investmentExpertise: (userData.stats.stocksPurchased || 0) >= 100,
                portfolioValue: this.calculatePortfolioValue(userData)
            };
            
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'stocks',
                behaviorContext
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(
                interaction.user.id,
                'stocks',
                true
            );
        }
        
        userData.stats.lastStocksUse = Date.now();
        userData.stats.lastCommand = 'stocks';
        await user.save(userData);
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'market':
                return this.handleMarket(interaction);
            case 'buy':
                return this.handleBuy(interaction);
            case 'sell':
                return this.handleSell(interaction);
            case 'portfolio':
                return this.handlePortfolio(interaction);
            case 'watchlist':
                return this.handleWatchlist(interaction);
        }
    },
    
    async handleMarket(interaction) {
        const stocks = this.getStockData();
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.STOCKS} VexiumVerse Stock Market`)
            .setDescription('Trade virtual stocks and build your investment portfolio!')
            .addFields(
                { name: '📊 Market Status', value: '**Status**: Open\n**Stocks Available**: 12\n**Market Cap**: $2.5M VEX', inline: true },
                { name: '📈 Market Performance', value: '**Daily Change**: +2.3%\n**Volume**: $125K VEX\n**Active Traders**: 1,247', inline: true },
                { name: '💡 Trading Tips', value: '• Diversify your portfolio\n• Research before investing\n• Consider long-term growth\n• Monitor market trends', inline: true }
            )
            .setColor(constants.COLORS.STOCKS)
            .setFooter({ text: 'Virtual stock market • Educational purposes only' })
            .setTimestamp();
        
        for (const stock of stocks.slice(0, 8)) {
            const changeEmoji = stock.change >= 0 ? '📈' : '📉';
            const changeColor = stock.change >= 0 ? '+' : '';
            
            embed.addFields({
                name: `${stock.emoji} ${stock.symbol}`,
                value: `**${stock.name}**\n**Price**: $${stock.price.toFixed(2)}\n**Change**: ${changeEmoji} ${changeColor}${stock.change.toFixed(2)}%`,
                inline: true
            });
        }
        
        const buyButton = new ButtonBuilder()
            .setCustomId('stocks_buy_menu')
            .setLabel('Buy Stocks')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💰');
        
        const portfolioButton = new ButtonBuilder()
            .setCustomId('stocks_portfolio')
            .setLabel('My Portfolio')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊');
        
        const watchlistButton = new ButtonBuilder()
            .setCustomId('stocks_watchlist')
            .setLabel('Watchlist')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('👁️');
        
        const row = new ActionRowBuilder().addComponents(buyButton, portfolioButton, watchlistButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleBuy(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const symbol = interaction.options.getString('symbol').toUpperCase();
        const shares = interaction.options.getInteger('shares');
        
        const stocks = this.getStockData();
        const stock = stocks.find(s => s.symbol === symbol);
        
        if (!stock) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Stock Not Found`)
                .setDescription(`No stock found with symbol: ${symbol}\n\nUse \`/stocks market\` to see available stocks.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const totalCost = stock.price * shares;
        const transactionFee = totalCost * 0.01; // 1% transaction fee
        const totalWithFees = totalCost + transactionFee;
        
        if (userData.vexBalance < totalWithFees) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`Total cost: $${totalWithFees.toFixed(2)} VEX (including 1% fee)\nYour balance: $${userData.vexBalance.toFixed(2)} VEX`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(totalWithFees, 'stock_purchase');
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Purchase Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        await user.burnVEX(transactionFee, 'stock_transaction_fee');
        
        if (!userData.stocks) userData.stocks = {};
        if (!userData.stocks[symbol]) {
            userData.stocks[symbol] = {
                shares: 0,
                avgPrice: 0,
                totalInvested: 0
            };
        }
        
        const currentShares = userData.stocks[symbol].shares;
        const currentInvested = userData.stocks[symbol].totalInvested;
        const newTotalShares = currentShares + shares;
        const newTotalInvested = currentInvested + totalCost;
        
        userData.stocks[symbol].shares = newTotalShares;
        userData.stocks[symbol].totalInvested = newTotalInvested;
        userData.stocks[symbol].avgPrice = newTotalInvested / newTotalShares;
        
        userData.stats.stocksPurchased = (userData.stats.stocksPurchased || 0) + shares;
        userData.stats.totalStockInvestment = (userData.stats.totalStockInvestment || 0) + totalCost;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Stock Purchase Successful!`)
            .setDescription(`Successfully purchased **${shares}** shares of **${stock.name}**!`)
            .addFields(
                { name: '📊 Stock', value: `${stock.emoji} ${symbol} - ${stock.name}`, inline: true },
                { name: '🔢 Shares', value: `${shares}`, inline: true },
                { name: '💰 Price per Share', value: `$${stock.price.toFixed(2)}`, inline: true },
                { name: '💸 Total Cost', value: `$${totalCost.toFixed(2)}`, inline: true },
                { name: '💳 Transaction Fee', value: `$${transactionFee.toFixed(2)}`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)}`, inline: true },
                { name: '📈 Portfolio Position', value: `**Total Shares**: ${userData.stocks[symbol].shares}\n**Avg Price**: $${userData.stocks[symbol].avgPrice.toFixed(2)}`, inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `${symbol} • Virtual stock trading for educational purposes` })
            .setTimestamp();
        
        const portfolioButton = new ButtonBuilder()
            .setCustomId('stocks_portfolio')
            .setLabel('View Portfolio')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊');
        
        const marketButton = new ButtonBuilder()
            .setCustomId('stocks_market')
            .setLabel('Stock Market')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📈');
        
        const row = new ActionRowBuilder().addComponents(portfolioButton, marketButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handlePortfolio(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const stocks = userData.stocks || {};
        const stockData = this.getStockData();
        
        if (Object.keys(stocks).length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.STOCKS} ${interaction.user.displayName}'s Stock Portfolio`)
                .setDescription('You don\'t have any stocks in your portfolio yet!\n\nUse `/stocks market` to start investing.')
                .setColor(constants.COLORS.STOCKS);
            
            const marketButton = new ButtonBuilder()
                .setCustomId('stocks_market')
                .setLabel('Browse Market')
                .setStyle(ButtonStyle.Success)
                .setEmoji('📈');
            
            const row = new ActionRowBuilder().addComponents(marketButton);
            
            return interaction.reply({ embeds: [embed], components: [row] });
        }
        
        let totalValue = 0;
        let totalInvested = 0;
        const positions = [];
        
        for (const [symbol, position] of Object.entries(stocks)) {
            const currentStock = stockData.find(s => s.symbol === symbol);
            if (currentStock) {
                const currentValue = position.shares * currentStock.price;
                const gainLoss = currentValue - position.totalInvested;
                const gainLossPercent = (gainLoss / position.totalInvested) * 100;
                
                totalValue += currentValue;
                totalInvested += position.totalInvested;
                
                positions.push({
                    symbol,
                    stock: currentStock,
                    position,
                    currentValue,
                    gainLoss,
                    gainLossPercent
                });
            }
        }
        
        const totalGainLoss = totalValue - totalInvested;
        const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.STOCKS} ${interaction.user.displayName}'s Stock Portfolio`)
            .setDescription('Your virtual stock investments and performance')
            .addFields(
                { name: '💼 Portfolio Summary', value: `**Total Value**: $${totalValue.toFixed(2)} VEX\n**Total Invested**: $${totalInvested.toFixed(2)} VEX\n**Positions**: ${positions.length}`, inline: true },
                { name: '📊 Performance', value: `**Gain/Loss**: ${totalGainLoss >= 0 ? '+' : ''}$${totalGainLoss.toFixed(2)} VEX\n**Return**: ${totalGainLossPercent >= 0 ? '+' : ''}${totalGainLossPercent.toFixed(2)}%\n**Stocks Owned**: ${userData.stats.stocksPurchased || 0}`, inline: true }
            )
            .setColor(totalGainLoss >= 0 ? constants.COLORS.SUCCESS : constants.COLORS.ERROR)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: 'Virtual portfolio • Educational trading simulation' })
            .setTimestamp();
        
        for (const pos of positions.slice(0, 6)) {
            const gainLossEmoji = pos.gainLoss >= 0 ? '📈' : '📉';
            const gainLossSign = pos.gainLoss >= 0 ? '+' : '';
            
            embed.addFields({
                name: `${pos.stock.emoji} ${pos.symbol}`,
                value: `**Shares**: ${pos.position.shares}\n**Value**: $${pos.currentValue.toFixed(2)}\n**P&L**: ${gainLossEmoji} ${gainLossSign}$${pos.gainLoss.toFixed(2)} (${gainLossSign}${pos.gainLossPercent.toFixed(1)}%)`,
                inline: true
            });
        }
        
        const sellButton = new ButtonBuilder()
            .setCustomId('stocks_sell_menu')
            .setLabel('Sell Stocks')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('💸');
        
        const buyButton = new ButtonBuilder()
            .setCustomId('stocks_buy_menu')
            .setLabel('Buy More')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💰');
        
        const marketButton = new ButtonBuilder()
            .setCustomId('stocks_market')
            .setLabel('Market')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📈');
        
        const row = new ActionRowBuilder().addComponents(sellButton, buyButton, marketButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    getStockData() {
        const baseTime = Date.now();
        const dayOffset = Math.floor(baseTime / (1000 * 60 * 60 * 24));
        
        return [
            { symbol: 'VTECH', name: 'VexTech Industries', emoji: '💻', price: this.simulatePrice(150, dayOffset, 'VTECH'), change: this.simulateChange('VTECH') },
            { symbol: 'VCORP', name: 'Vexium Corporation', emoji: '🏢', price: this.simulatePrice(85, dayOffset, 'VCORP'), change: this.simulateChange('VCORP') },
            { symbol: 'VBANK', name: 'VexBank Financial', emoji: '🏦', price: this.simulatePrice(120, dayOffset, 'VBANK'), change: this.simulateChange('VBANK') },
            { symbol: 'VENERGY', name: 'Vex Energy Solutions', emoji: '⚡', price: this.simulatePrice(95, dayOffset, 'VENERGY'), change: this.simulateChange('VENERGY') },
            { symbol: 'VGAMING', name: 'VexGaming Entertainment', emoji: '🎮', price: this.simulatePrice(200, dayOffset, 'VGAMING'), change: this.simulateChange('VGAMING') },
            { symbol: 'VREAL', name: 'Vex Real Estate', emoji: '🏠', price: this.simulatePrice(75, dayOffset, 'VREAL'), change: this.simulateChange('VREAL') },
            { symbol: 'VHEALTH', name: 'VexHealth Systems', emoji: '🏥', price: this.simulatePrice(110, dayOffset, 'VHEALTH'), change: this.simulateChange('VHEALTH') },
            { symbol: 'VTRANS', name: 'Vex Transportation', emoji: '🚗', price: this.simulatePrice(65, dayOffset, 'VTRANS'), change: this.simulateChange('VTRANS') },
            { symbol: 'VFOOD', name: 'VexFood Industries', emoji: '🍔', price: this.simulatePrice(45, dayOffset, 'VFOOD'), change: this.simulateChange('VFOOD') },
            { symbol: 'VSPACE', name: 'Vex Aerospace', emoji: '🚀', price: this.simulatePrice(300, dayOffset, 'VSPACE'), change: this.simulateChange('VSPACE') },
            { symbol: 'VBIO', name: 'VexBio Research', emoji: '🧬', price: this.simulatePrice(180, dayOffset, 'VBIO'), change: this.simulateChange('VBIO') },
            { symbol: 'VMINE', name: 'Vex Mining Corp', emoji: '⛏️', price: this.simulatePrice(55, dayOffset, 'VMINE'), change: this.simulateChange('VMINE') }
        ];
    },
    
    simulatePrice(basePrice, dayOffset, symbol) {
        const seed = this.hashCode(symbol + dayOffset);
        const random = Math.abs(Math.sin(seed)) * 1000;
        const volatility = 0.15; // 15% daily volatility
        const change = (random % (volatility * 2)) - volatility;
        
        return Math.max(basePrice * (1 + change), 1);
    },
    
    simulateChange(symbol) {
        const seed = this.hashCode(symbol + Date.now().toString().slice(0, -5));
        const random = Math.abs(Math.sin(seed)) * 1000;
        return ((random % 20) - 10); // -10% to +10% change
    },
    
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }
};
