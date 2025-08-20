const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crypto')
        .setDescription('Trade virtual cryptocurrencies and manage your crypto portfolio')
        .addSubcommand(subcommand =>
            subcommand
                .setName('market')
                .setDescription('View cryptocurrency market prices and trends'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Purchase cryptocurrency with VEX')
                .addStringOption(option =>
                    option.setName('currency')
                        .setDescription('Cryptocurrency to purchase')
                        .setRequired(true)
                        .addChoices(
                            { name: 'VexCoin (VXC)', value: 'VXC' },
                            { name: 'EtherVex (EVX)', value: 'EVX' },
                            { name: 'VexBit (VBT)', value: 'VBT' },
                            { name: 'SolarVex (SVX)', value: 'SVX' },
                            { name: 'QuantumVex (QVX)', value: 'QVX' }))
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription('Amount of VEX to spend')
                        .setRequired(true)
                        .setMinValue(10)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sell')
                .setDescription('Sell cryptocurrency for VEX')
                .addStringOption(option =>
                    option.setName('currency')
                        .setDescription('Cryptocurrency to sell')
                        .setRequired(true)
                        .addChoices(
                            { name: 'VexCoin (VXC)', value: 'VXC' },
                            { name: 'EtherVex (EVX)', value: 'EVX' },
                            { name: 'VexBit (VBT)', value: 'VBT' },
                            { name: 'SolarVex (SVX)', value: 'SVX' },
                            { name: 'QuantumVex (QVX)', value: 'QVX' }))
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription('Amount of cryptocurrency to sell')
                        .setRequired(true)
                        .setMinValue(0.001)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('portfolio')
                .setDescription('View your cryptocurrency portfolio and performance'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stake')
                .setDescription('Stake cryptocurrency for rewards')
                .addStringOption(option =>
                    option.setName('currency')
                        .setDescription('Cryptocurrency to stake')
                        .setRequired(true)
                        .addChoices(
                            { name: 'VexCoin (VXC)', value: 'VXC' },
                            { name: 'EtherVex (EVX)', value: 'EVX' },
                            { name: 'QuantumVex (QVX)', value: 'QVX' }))
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription('Amount to stake')
                        .setRequired(true)
                        .setMinValue(1))),
    
    cooldown: 20,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'crypto', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                cryptoTrading: true,
                wealthBuilding: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'crypto',
                behaviorContext
            );
        }
        
        const cryptoTrades = userData.stats?.cryptoPurchases || 0;
        const isCryptoExpert = cryptoTrades >= 25;
        const isCryptoNovice = cryptoTrades < 5;
        const totalCryptoValue = this.calculateTotalCryptoValue(userData);
        const isWhale = totalCryptoValue >= 5000;
        
        if (isCryptoExpert) {
            const expertBonus = Math.floor(Math.random() * 50) + 25;
            userData.stats.expertBonusEarned = (userData.stats.expertBonusEarned || 0) + expertBonus;
        }
        
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
            case 'stake':
                return this.handleStake(interaction);
        }
    },
    
    async handleMarket(interaction) {
        const cryptoData = this.getCryptoData();
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 300) + 100);
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        
        const embed = new EmbedBuilder()
            .setTitle(`🚀 CRYPTO EMPIRE AWAITS!`)
            .setDescription(`💎 **EXPLOSIVE CRYPTO OPPORTUNITIES!** Trade virtual cryptocurrencies and build your digital fortune!\n\n${fomoMessage}\n${socialProofMessage}${variableReward ? `\n${variableReward}` : ''}`)
            .addFields(
                { name: '📊 Market Overview', value: '**Total Market Cap**: $1.2M VEX\n**24h Volume**: $85K VEX\n**Active Traders**: 892', inline: true },
                { name: '📈 Market Trends', value: '**Trending**: VexCoin (+15.2%)\n**Top Gainer**: QuantumVex (+28.7%)\n**Most Traded**: EtherVex', inline: true },
                { name: '💡 Trading Info', value: '**Trading Fee**: 2%\n**Staking Available**: Yes\n**Min Trade**: $10 VEX', inline: true }
            )
            .setColor(constants.COLORS.CRYPTO)
            .setFooter({ text: '⚡ Virtual cryptocurrency market • Fortunes are made HERE!' })
            .setTimestamp();
        
        for (const crypto of cryptoData) {
            const changeEmoji = crypto.change >= 0 ? '📈' : '📉';
            const changeSign = crypto.change >= 0 ? '+' : '';
            
            embed.addFields({
                name: `${crypto.emoji} ${crypto.symbol}`,
                value: `**${crypto.name}**\n**Price**: $${crypto.price.toFixed(4)} VEX\n**24h**: ${changeEmoji} ${changeSign}${crypto.change.toFixed(2)}%`,
                inline: true
            });
        }
        
        const buyButton = new ButtonBuilder()
            .setCustomId('crypto_buy_menu')
            .setLabel('Buy Crypto')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💰');
        
        const portfolioButton = new ButtonBuilder()
            .setCustomId('crypto_portfolio')
            .setLabel('My Portfolio')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊');
        
        const stakeButton = new ButtonBuilder()
            .setCustomId('crypto_stake_menu')
            .setLabel('Stake Crypto')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔒');
        
        const row = new ActionRowBuilder().addComponents(buyButton, portfolioButton, stakeButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleBuy(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const currency = interaction.options.getString('currency');
        const vexAmount = interaction.options.getNumber('amount');
        
        const cryptoData = this.getCryptoData();
        const crypto = cryptoData.find(c => c.symbol === currency);
        
        if (!crypto) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Cryptocurrency Not Found`)
                .setDescription('Invalid cryptocurrency selection.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const tradingFee = vexAmount * 0.02; // 2% trading fee
        const totalCost = vexAmount + tradingFee;
        
        if (userData.vexBalance < totalCost) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`Total cost: $${totalCost.toFixed(2)} VEX (including 2% fee)\nYour balance: $${userData.vexBalance.toFixed(2)} VEX`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(totalCost, 'crypto_purchase');
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Purchase Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        await user.burnVEX(tradingFee, 'crypto_trading_fee');
        
        const cryptoAmount = vexAmount / crypto.price;
        
        if (!userData.crypto) userData.crypto = {};
        if (!userData.crypto[currency]) {
            userData.crypto[currency] = {
                amount: 0,
                totalInvested: 0,
                avgPrice: 0
            };
        }
        
        const currentAmount = userData.crypto[currency].amount;
        const currentInvested = userData.crypto[currency].totalInvested;
        const newTotalAmount = currentAmount + cryptoAmount;
        const newTotalInvested = currentInvested + vexAmount;
        
        userData.crypto[currency].amount = newTotalAmount;
        userData.crypto[currency].totalInvested = newTotalInvested;
        userData.crypto[currency].avgPrice = newTotalInvested / newTotalAmount;
        
        userData.stats.cryptoPurchases = (userData.stats.cryptoPurchases || 0) + 1;
        userData.stats.totalCryptoInvestment = (userData.stats.totalCryptoInvestment || 0) + vexAmount;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Cryptocurrency Purchase Successful!`)
            .setDescription(`Successfully purchased **${crypto.name}**!`)
            .addFields(
                { name: '💎 Cryptocurrency', value: `${crypto.emoji} ${crypto.name} (${currency})`, inline: true },
                { name: '🔢 Amount Purchased', value: `${cryptoAmount.toFixed(6)} ${currency}`, inline: true },
                { name: '💰 Price per Unit', value: `$${crypto.price.toFixed(4)} VEX`, inline: true },
                { name: '💸 VEX Spent', value: `$${vexAmount.toFixed(2)}`, inline: true },
                { name: '💳 Trading Fee', value: `$${tradingFee.toFixed(2)}`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '📊 Portfolio Position', value: `**Total ${currency}**: ${userData.crypto[currency].amount.toFixed(6)}\n**Avg Price**: $${userData.crypto[currency].avgPrice.toFixed(4)}`, inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `${currency} • Virtual cryptocurrency trading` })
            .setTimestamp();
        
        const portfolioButton = new ButtonBuilder()
            .setCustomId('crypto_portfolio')
            .setLabel('View Portfolio')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊');
        
        const marketButton = new ButtonBuilder()
            .setCustomId('crypto_market')
            .setLabel('Crypto Market')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📈');
        
        const row = new ActionRowBuilder().addComponents(portfolioButton, marketButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handlePortfolio(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const cryptoHoldings = userData.crypto || {};
        const cryptoData = this.getCryptoData();
        
        if (Object.keys(cryptoHoldings).length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.CRYPTO} ${interaction.user.displayName}'s Crypto Portfolio`)
                .setDescription('You don\'t have any cryptocurrency yet!\n\nUse `/crypto market` to start trading.')
                .setColor(constants.COLORS.CRYPTO);
            
            const marketButton = new ButtonBuilder()
                .setCustomId('crypto_market')
                .setLabel('Browse Market')
                .setStyle(ButtonStyle.Success)
                .setEmoji('📈');
            
            const row = new ActionRowBuilder().addComponents(marketButton);
            
            return interaction.reply({ embeds: [embed], components: [row] });
        }
        
        let totalValue = 0;
        let totalInvested = 0;
        const positions = [];
        
        for (const [symbol, holding] of Object.entries(cryptoHoldings)) {
            const currentCrypto = cryptoData.find(c => c.symbol === symbol);
            if (currentCrypto && holding.amount > 0) {
                const currentValue = holding.amount * currentCrypto.price;
                const gainLoss = currentValue - holding.totalInvested;
                const gainLossPercent = (gainLoss / holding.totalInvested) * 100;
                
                totalValue += currentValue;
                totalInvested += holding.totalInvested;
                
                positions.push({
                    symbol,
                    crypto: currentCrypto,
                    holding,
                    currentValue,
                    gainLoss,
                    gainLossPercent
                });
            }
        }
        
        const totalGainLoss = totalValue - totalInvested;
        const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CRYPTO} ${interaction.user.displayName}'s Crypto Portfolio`)
            .setDescription('Your virtual cryptocurrency investments and performance')
            .addFields(
                { name: '💼 Portfolio Summary', value: `**Total Value**: $${totalValue.toFixed(2)} VEX\n**Total Invested**: $${totalInvested.toFixed(2)} VEX\n**Holdings**: ${positions.length}`, inline: true },
                { name: '📊 Performance', value: `**Gain/Loss**: ${totalGainLoss >= 0 ? '+' : ''}$${totalGainLoss.toFixed(2)} VEX\n**Return**: ${totalGainLossPercent >= 0 ? '+' : ''}${totalGainLossPercent.toFixed(2)}%\n**Trades**: ${userData.stats.cryptoPurchases || 0}`, inline: true }
            )
            .setColor(totalGainLoss >= 0 ? constants.COLORS.SUCCESS : constants.COLORS.ERROR)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: 'Virtual crypto portfolio • Educational trading simulation' })
            .setTimestamp();
        
        for (const pos of positions.slice(0, 5)) {
            const gainLossEmoji = pos.gainLoss >= 0 ? '📈' : '📉';
            const gainLossSign = pos.gainLoss >= 0 ? '+' : '';
            
            embed.addFields({
                name: `${pos.crypto.emoji} ${pos.symbol}`,
                value: `**Amount**: ${pos.holding.amount.toFixed(6)}\n**Value**: $${pos.currentValue.toFixed(2)}\n**P&L**: ${gainLossEmoji} ${gainLossSign}$${pos.gainLoss.toFixed(2)} (${gainLossSign}${pos.gainLossPercent.toFixed(1)}%)`,
                inline: true
            });
        }
        
        const sellButton = new ButtonBuilder()
            .setCustomId('crypto_sell_menu')
            .setLabel('Sell Crypto')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('💸');
        
        const buyButton = new ButtonBuilder()
            .setCustomId('crypto_buy_menu')
            .setLabel('Buy More')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💰');
        
        const stakeButton = new ButtonBuilder()
            .setCustomId('crypto_stake_menu')
            .setLabel('Stake Crypto')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔒');
        
        const row = new ActionRowBuilder().addComponents(sellButton, buyButton, stakeButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    getCryptoData() {
        const baseTime = Date.now();
        const dayOffset = Math.floor(baseTime / (1000 * 60 * 60 * 24));
        
        return [
            { symbol: 'VXC', name: 'VexCoin', emoji: '🪙', price: this.simulatePrice(1.25, dayOffset, 'VXC'), change: this.simulateChange('VXC') },
            { symbol: 'EVX', name: 'EtherVex', emoji: '💎', price: this.simulatePrice(2.85, dayOffset, 'EVX'), change: this.simulateChange('EVX') },
            { symbol: 'VBT', name: 'VexBit', emoji: '₿', price: this.simulatePrice(0.75, dayOffset, 'VBT'), change: this.simulateChange('VBT') },
            { symbol: 'SVX', name: 'SolarVex', emoji: '☀️', price: this.simulatePrice(0.45, dayOffset, 'SVX'), change: this.simulateChange('SVX') },
            { symbol: 'QVX', name: 'QuantumVex', emoji: '⚛️', price: this.simulatePrice(5.20, dayOffset, 'QVX'), change: this.simulateChange('QVX') }
        ];
    },
    
    simulatePrice(basePrice, dayOffset, symbol) {
        const seed = this.hashCode(symbol + dayOffset);
        const random = Math.abs(Math.sin(seed)) * 1000;
        const volatility = 0.25; // 25% daily volatility for crypto
        const change = (random % (volatility * 2)) - volatility;
        
        return Math.max(basePrice * (1 + change), 0.01);
    },
    
    simulateChange(symbol) {
        const seed = this.hashCode(symbol + Date.now().toString().slice(0, -5));
        const random = Math.abs(Math.sin(seed)) * 1000;
        return ((random % 40) - 20); // -20% to +20% change for crypto volatility
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
