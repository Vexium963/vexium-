const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const simulatedVEX = require('../../utils/simulatedVEX');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('🏛️ View VEX token market data and controls')
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('📊 View current VEX market statistics'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('chart')
                .setDescription('📈 View VEX price chart')
                .addIntegerOption(option =>
                    option
                        .setName('hours')
                        .setDescription('Hours of price history to display')
                        .setMinValue(1)
                        .setMaxValue(168)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('events')
                .setDescription('📰 View recent market events'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('override')
                .setDescription('⚡ Override VEX price (Admin only)')
                .addNumberOption(option =>
                    option
                        .setName('price')
                        .setDescription('New VEX price in USD')
                        .setMinValue(0.001)
                        .setMaxValue(100)
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Reason for price override')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('simulate')
                .setDescription('🎭 Simulate market events (Admin only)')
                .addStringOption(option =>
                    option
                        .setName('event')
                        .setDescription('Type of market event to simulate')
                        .setRequired(true)
                        .addChoices(
                            { name: '🐋 Whale Buy', value: 'whale_buy' },
                            { name: '🐋 Whale Sell', value: 'whale_sell' },
                            { name: '📈 Market Pump', value: 'pump' },
                            { name: '📉 Market Crash', value: 'crash' },
                            { name: '💧 Liquidity Event', value: 'liquidity' }
                        ))
                .addNumberOption(option =>
                    option
                        .setName('intensity')
                        .setDescription('Event intensity (0.1 to 5.0)')
                        .setMinValue(0.1)
                        .setMaxValue(5.0)
                        .setRequired(false))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'stats':
                    await this.handleStats(interaction);
                    break;
                case 'chart':
                    await this.handleChart(interaction);
                    break;
                case 'events':
                    await this.handleEvents(interaction);
                    break;
                case 'override':
                    await this.handleOverride(interaction);
                    break;
                case 'simulate':
                    await this.handleSimulate(interaction);
                    break;
                default:
                    await interaction.reply({
                        content: '❌ Unknown subcommand.',
                        ephemeral: true
                    });
            }
        } catch (error) {
            console.error('Market command error:', error);
            await interaction.reply({
                content: '❌ An error occurred while processing the market command.',
                ephemeral: true
            });
        }
    },

    async handleStats(interaction) {
        const stats = simulatedVEX.getMarketStats();
        
        const embed = new EmbedBuilder()
            .setTitle('🏛️ VEX Token Market Statistics')
            .setColor('#00D4AA')
            .setTimestamp()
            .addFields(
                {
                    name: '💰 Current Price',
                    value: `${simulatedVEX.formatPrice(stats.currentPrice)}`,
                    inline: true
                },
                {
                    name: '📊 24h Change',
                    value: `${stats.priceChange24h >= 0 ? '📈' : '📉'} ${stats.priceChange24h.toFixed(2)}%`,
                    inline: true
                },
                {
                    name: '🏦 Market Cap',
                    value: `$${Economics.formatMoney(stats.marketCap)}`,
                    inline: true
                },
                {
                    name: '🪙 Total Supply',
                    value: `${simulatedVEX.formatTokens(stats.totalSupply)} VEX`,
                    inline: true
                },
                {
                    name: '💫 Circulating Supply',
                    value: `${simulatedVEX.formatTokens(stats.circulatingSupply)} VEX`,
                    inline: true
                },
                {
                    name: '🔥 Burned Tokens',
                    value: `${simulatedVEX.formatTokens(stats.burnedTokens)} VEX`,
                    inline: true
                },
                {
                    name: '🏛️ Treasury Reserve',
                    value: `${simulatedVEX.formatTokens(stats.treasuryReserve)} VEX`,
                    inline: true
                },
                {
                    name: '📈 24h Volume',
                    value: `${simulatedVEX.formatTokens(stats.dailyVolume)} VEX`,
                    inline: true
                },
                {
                    name: '💧 Liquidity Pool',
                    value: `${simulatedVEX.formatTokens(stats.liquidityPool)} VEX`,
                    inline: true
                },
                {
                    name: '🔥 Burn Rate',
                    value: `${(stats.burnRate * 100).toFixed(1)}%`,
                    inline: true
                },
                {
                    name: '🏛️ Treasury Tax',
                    value: `${(stats.treasuryTaxRate * 100).toFixed(1)}%`,
                    inline: true
                },
                {
                    name: '📊 Volume Change',
                    value: `${stats.volumeChange24h >= 0 ? '📈' : '📉'} ${stats.volumeChange24h.toFixed(1)}%`,
                    inline: true
                }
            )
            .setFooter({ text: 'VEX Tokenomics • Live Market Data' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('market_refresh')
                    .setLabel('🔄 Refresh')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('market_chart')
                    .setLabel('📈 View Chart')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('market_events')
                    .setLabel('📰 Recent Events')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    },

    async handleChart(interaction) {
        const hours = interaction.options.getInteger('hours') || 24;
        const chartData = simulatedVEX.getPriceChart(hours);
        
        if (chartData.length === 0) {
            await interaction.reply({
                content: '❌ No price data available for the specified timeframe.',
                ephemeral: true
            });
            return;
        }

        const minPrice = Math.min(...chartData.map(d => d.price));
        const maxPrice = Math.max(...chartData.map(d => d.price));
        const priceRange = maxPrice - minPrice;
        
        let chartDisplay = '```\n';
        chartDisplay += `VEX Price Chart (${hours}h)\n`;
        chartDisplay += `High: ${simulatedVEX.formatPrice(maxPrice)} | Low: ${simulatedVEX.formatPrice(minPrice)}\n`;
        chartDisplay += '─'.repeat(50) + '\n';
        
        const displayPoints = Math.min(20, chartData.length);
        const step = Math.max(1, Math.floor(chartData.length / displayPoints));
        
        for (let i = 0; i < chartData.length; i += step) {
            const point = chartData[i];
            const normalizedPrice = priceRange > 0 ? (point.price - minPrice) / priceRange : 0.5;
            const barLength = Math.floor(normalizedPrice * 30);
            
            const bar = '█'.repeat(barLength) + '░'.repeat(30 - barLength);
            const timeStr = new Date(point.timestamp).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            chartDisplay += `${timeStr} │${bar}│ ${simulatedVEX.formatPrice(point.price)}\n`;
        }
        
        chartDisplay += '```';

        const embed = new EmbedBuilder()
            .setTitle(`📈 VEX Price Chart (${hours} hours)`)
            .setDescription(chartDisplay)
            .setColor('#00D4AA')
            .setTimestamp()
            .addFields(
                {
                    name: '📊 Current Price',
                    value: simulatedVEX.formatPrice(chartData[chartData.length - 1].price),
                    inline: true
                },
                {
                    name: '📈 24h High',
                    value: simulatedVEX.formatPrice(maxPrice),
                    inline: true
                },
                {
                    name: '📉 24h Low',
                    value: simulatedVEX.formatPrice(minPrice),
                    inline: true
                }
            );

        await interaction.reply({ embeds: [embed] });
    },

    async handleEvents(interaction) {
        const events = simulatedVEX.getRecentMarketEvents(15);
        
        if (events.length === 0) {
            await interaction.reply({
                content: '📰 No recent market events to display.',
                ephemeral: true
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('📰 Recent Market Events')
            .setColor('#FFD700')
            .setTimestamp();

        let description = '';
        events.forEach(event => {
            description += `**${event.timeAgo}** - ${event.description} (${event.formattedPrice})\n`;
        });

        embed.setDescription(description || 'No recent events');

        await interaction.reply({ embeds: [embed] });
    },

    async handleOverride(interaction) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            await interaction.reply({
                content: '❌ You need Administrator permissions to use this command.',
                ephemeral: true
            });
            return;
        }

        const newPrice = interaction.options.getNumber('price');
        const reason = interaction.options.getString('reason') || 'Admin override';
        
        const oldPrice = simulatedVEX.getCurrentPrice();
        const finalPrice = simulatedVEX.forcePriceOverride(newPrice, reason);
        
        const embed = new EmbedBuilder()
            .setTitle('⚡ VEX Price Override')
            .setColor('#FF6B6B')
            .addFields(
                {
                    name: '📊 Old Price',
                    value: simulatedVEX.formatPrice(oldPrice),
                    inline: true
                },
                {
                    name: '📊 New Price',
                    value: simulatedVEX.formatPrice(finalPrice),
                    inline: true
                },
                {
                    name: '📝 Reason',
                    value: reason,
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ text: `Override by ${interaction.user.tag}` });

        await interaction.reply({ embeds: [embed] });
    },

    async handleSimulate(interaction) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            await interaction.reply({
                content: '❌ You need Administrator permissions to use this command.',
                ephemeral: true
            });
            return;
        }

        const eventType = interaction.options.getString('event');
        const intensity = interaction.options.getNumber('intensity') || 1.0;
        
        const oldPrice = simulatedVEX.getCurrentPrice();
        let eventDescription = '';

        switch (eventType) {
            case 'whale_buy':
                simulatedVEX.updateVEXPrice('whale_activity', 1000000 * intensity);
                eventDescription = `🐋 Simulated whale buy (${intensity}x intensity)`;
                break;
            case 'whale_sell':
                simulatedVEX.updateVEXPrice('whale_activity', -1000000 * intensity);
                eventDescription = `🐋 Simulated whale sell (${intensity}x intensity)`;
                break;
            case 'pump':
                simulatedVEX.simulateMarketPump(1 + (intensity * 0.5));
                eventDescription = `📈 Simulated market pump (${intensity}x intensity)`;
                break;
            case 'crash':
                simulatedVEX.simulateMarketCrash(intensity * 0.3);
                eventDescription = `📉 Simulated market crash (${intensity}x intensity)`;
                break;
            case 'liquidity':
                simulatedVEX.simulateWhaleActivity();
                eventDescription = `💧 Simulated liquidity event (${intensity}x intensity)`;
                break;
        }

        const newPrice = simulatedVEX.getCurrentPrice();
        const priceChange = ((newPrice - oldPrice) / oldPrice) * 100;

        const embed = new EmbedBuilder()
            .setTitle('🎭 Market Event Simulation')
            .setColor('#9B59B6')
            .addFields(
                {
                    name: '📊 Price Before',
                    value: simulatedVEX.formatPrice(oldPrice),
                    inline: true
                },
                {
                    name: '📊 Price After',
                    value: simulatedVEX.formatPrice(newPrice),
                    inline: true
                },
                {
                    name: '📈 Change',
                    value: `${priceChange >= 0 ? '📈' : '📉'} ${priceChange.toFixed(2)}%`,
                    inline: true
                },
                {
                    name: '🎭 Event',
                    value: eventDescription,
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ text: `Simulation by ${interaction.user.tag}` });

        await interaction.reply({ embeds: [embed] });
    }
};
