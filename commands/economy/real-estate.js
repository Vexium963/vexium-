const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('real-estate')
        .setDescription('Invest in virtual real estate properties for passive income')
        .addSubcommand(subcommand =>
            subcommand
                .setName('market')
                .setDescription('Browse available properties for purchase'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Purchase a real estate property')
                .addStringOption(option =>
                    option.setName('property_id')
                        .setDescription('ID of the property to purchase')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('portfolio')
                .setDescription('View your real estate portfolio and income'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('collect')
                .setDescription('Collect rental income from your properties'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('upgrade')
                .setDescription('Upgrade a property to increase rental income')
                .addStringOption(option =>
                    option.setName('property_id')
                        .setDescription('ID of the property to upgrade')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sell')
                .setDescription('Sell a property from your portfolio')
                .addStringOption(option =>
                    option.setName('property_id')
                        .setDescription('ID of the property to sell')
                        .setRequired(true))),
    
    cooldown: 30,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'market':
                return this.handleMarket(interaction);
            case 'buy':
                return this.handleBuy(interaction);
            case 'portfolio':
                return this.handlePortfolio(interaction);
            case 'collect':
                return this.handleCollect(interaction);
            case 'upgrade':
                return this.handleUpgrade(interaction);
            case 'sell':
                return this.handleSell(interaction);
        }
    },
    
    async handleMarket(interaction) {
        const availableProperties = this.getAvailableProperties();
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.REAL_ESTATE} VexiumVerse Real Estate Market`)
            .setDescription('Invest in virtual properties for passive rental income!')
            .addFields(
                { name: '🏘️ Market Overview', value: `**${availableProperties.length}** properties available\n**Market Status**: Active\n**Average ROI**: 12-25% annually`, inline: false }
            )
            .setColor(constants.COLORS.REAL_ESTATE)
            .setFooter({ text: 'Properties generate passive income every 24 hours' })
            .setTimestamp();
        
        for (const property of availableProperties.slice(0, 8)) {
            const roi = ((property.dailyIncome * 365) / property.price * 100).toFixed(1);
            
            embed.addFields({
                name: `${property.emoji} ${property.name}`,
                value: `**Price**: $${property.price.toFixed(2)} VEX\n**Daily Income**: $${property.dailyIncome.toFixed(2)} VEX\n**ROI**: ${roi}% annually\n**ID**: ${property.id}`,
                inline: true
            });
        }
        
        const buyButton = new ButtonBuilder()
            .setCustomId('real_estate_buy_menu')
            .setLabel('Buy Property')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🏠');
        
        const portfolioButton = new ButtonBuilder()
            .setCustomId('real_estate_portfolio')
            .setLabel('My Portfolio')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊');
        
        const calculatorButton = new ButtonBuilder()
            .setCustomId('real_estate_calculator')
            .setLabel('ROI Calculator')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🧮');
        
        const row = new ActionRowBuilder().addComponents(buyButton, portfolioButton, calculatorButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleBuy(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const propertyId = interaction.options.getString('property_id');
        const availableProperties = this.getAvailableProperties();
        const property = availableProperties.find(p => p.id === propertyId);
        
        if (!property) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Property Not Found`)
                .setDescription(`No property found with ID: ${propertyId}\n\nUse \`/real-estate market\` to see available properties.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (!userData.realEstate) userData.realEstate = [];
        
        if (userData.realEstate.some(p => p.id === propertyId)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Property Already Owned`)
                .setDescription(`You already own **${property.name}**.\n\nEach property can only be owned once per user.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (userData.vexBalance < property.price) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`Property price: $${property.price.toFixed(2)} VEX\nYour balance: $${userData.vexBalance.toFixed(2)} VEX`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(property.price, 'real_estate_purchase');
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Purchase Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const ownedProperty = {
            ...property,
            purchaseDate: new Date().toISOString(),
            lastCollected: new Date().toISOString(),
            level: 1,
            totalEarned: 0
        };
        
        userData.realEstate.push(ownedProperty);
        userData.stats.propertiesOwned = (userData.stats.propertiesOwned || 0) + 1;
        userData.stats.totalRealEstateInvestment = (userData.stats.totalRealEstateInvestment || 0) + property.price;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const annualROI = ((property.dailyIncome * 365) / property.price * 100).toFixed(1);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Property Purchased Successfully!`)
            .setDescription(`Congratulations! You now own **${property.name}**!`)
            .addFields(
                { name: '🏠 Property', value: `${property.emoji} ${property.name}`, inline: true },
                { name: '💰 Purchase Price', value: `$${property.price.toFixed(2)} VEX`, inline: true },
                { name: '📈 Daily Income', value: `$${property.dailyIncome.toFixed(2)} VEX`, inline: true },
                { name: '📊 Annual ROI', value: `${annualROI}%`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '🏆 Properties Owned', value: `${userData.stats.propertiesOwned}`, inline: true },
                { name: '💡 Rental Income', value: 'Collect rental income every 24 hours\nUpgrade properties to increase income', inline: false },
                { name: '📅 Next Collection', value: '<t:' + Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000) + ':R>', inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `Property #${propertyId} • Passive income starts immediately` })
            .setTimestamp();
        
        const portfolioButton = new ButtonBuilder()
            .setCustomId('real_estate_portfolio')
            .setLabel('View Portfolio')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊');
        
        const marketButton = new ButtonBuilder()
            .setCustomId('real_estate_market')
            .setLabel('Buy More Properties')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🏠');
        
        const row = new ActionRowBuilder().addComponents(portfolioButton, marketButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handlePortfolio(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const properties = userData.realEstate || [];
        const totalValue = properties.reduce((sum, p) => sum + p.price, 0);
        const dailyIncome = properties.reduce((sum, p) => sum + (p.dailyIncome * p.level), 0);
        const totalEarned = properties.reduce((sum, p) => sum + p.totalEarned, 0);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.REAL_ESTATE} ${interaction.user.displayName}'s Real Estate Portfolio`)
            .setDescription('Your virtual property investments and rental income')
            .addFields(
                { name: '🏘️ Portfolio Summary', value: `**Properties Owned**: ${properties.length}\n**Total Value**: $${totalValue.toFixed(2)} VEX\n**Daily Income**: $${dailyIncome.toFixed(2)} VEX`, inline: true },
                { name: '💰 Income Stats', value: `**Total Earned**: $${totalEarned.toFixed(2)} VEX\n**Monthly Income**: $${(dailyIncome * 30).toFixed(2)} VEX\n**Annual ROI**: ${totalValue > 0 ? ((dailyIncome * 365 / totalValue) * 100).toFixed(1) : '0.0'}%`, inline: true },
                { name: '📊 Performance', value: `**Avg Property Value**: $${properties.length > 0 ? (totalValue / properties.length).toFixed(2) : '0.00'}\n**Avg Daily Income**: $${properties.length > 0 ? (dailyIncome / properties.length).toFixed(2) : '0.00'}\n**Portfolio Growth**: +${this.getPortfolioGrowth(userData)}%`, inline: true }
            )
            .setColor(constants.COLORS.REAL_ESTATE)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: 'Real estate provides stable passive income' })
            .setTimestamp();
        
        if (properties.length === 0) {
            embed.addFields({
                name: '🏠 No Properties Owned',
                value: 'You don\'t own any properties yet!\n\nUse `/real-estate market` to start building your portfolio.',
                inline: false
            });
        } else {
            const availableIncome = this.calculateAvailableIncome(properties);
            
            if (availableIncome > 0) {
                embed.addFields({
                    name: '💰 Income Ready to Collect',
                    value: `$${availableIncome.toFixed(2)} VEX available!\nUse \`/real-estate collect\` to claim your rental income.`,
                    inline: false
                });
            }
            
            for (const property of properties.slice(0, 6)) {
                const canCollect = this.canCollectIncome(property);
                const status = canCollect ? '💰 Income Ready' : '⏳ Generating Income';
                const nextCollection = canCollect ? 'Now' : `<t:${Math.floor((new Date(property.lastCollected).getTime() + 24 * 60 * 60 * 1000) / 1000)}:R>`;
                
                embed.addFields({
                    name: `${property.emoji} ${property.name} (Lv.${property.level})`,
                    value: `**Daily Income**: $${(property.dailyIncome * property.level).toFixed(2)} VEX\n**Status**: ${status}\n**Next**: ${nextCollection}`,
                    inline: true
                });
            }
        }
        
        const collectButton = new ButtonBuilder()
            .setCustomId('real_estate_collect')
            .setLabel('Collect Income')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💰')
            .setDisabled(this.calculateAvailableIncome(properties) === 0);
        
        const upgradeButton = new ButtonBuilder()
            .setCustomId('real_estate_upgrade_menu')
            .setLabel('Upgrade Properties')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⬆️')
            .setDisabled(properties.length === 0);
        
        const marketButton = new ButtonBuilder()
            .setCustomId('real_estate_market')
            .setLabel('Buy More')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🏠');
        
        const row = new ActionRowBuilder().addComponents(collectButton, upgradeButton, marketButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleCollect(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const properties = userData.realEstate || [];
        
        if (properties.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} No Properties Owned`)
                .setDescription('You don\'t own any properties to collect income from.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const availableIncome = this.calculateAvailableIncome(properties);
        
        if (availableIncome === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} No Income Available`)
                .setDescription('No rental income is ready to collect yet.\n\nIncome is generated every 24 hours per property.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        await user.addVEX(availableIncome, 'real_estate_income');
        
        const now = new Date().toISOString();
        let propertiesCollected = 0;
        
        for (const property of properties) {
            if (this.canCollectIncome(property)) {
                property.lastCollected = now;
                property.totalEarned += property.dailyIncome * property.level;
                propertiesCollected++;
            }
        }
        
        userData.stats.totalRealEstateIncome = (userData.stats.totalRealEstateIncome || 0) + availableIncome;
        userData.stats.incomeCollections = (userData.stats.incomeCollections || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Rental Income Collected!`)
            .setDescription(`Successfully collected rental income from your properties!`)
            .addFields(
                { name: '💰 Income Collected', value: `$${availableIncome.toFixed(2)} VEX`, inline: true },
                { name: '🏠 Properties', value: `${propertiesCollected} properties`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '📊 Total Real Estate Income', value: `$${userData.stats.totalRealEstateIncome.toFixed(2)} VEX`, inline: true },
                { name: '🏆 Collections', value: `${userData.stats.incomeCollections}`, inline: true },
                { name: '📅 Next Collection', value: '<t:' + Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000) + ':R>', inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Passive income • Properties continue generating income' })
            .setTimestamp();
        
        const portfolioButton = new ButtonBuilder()
            .setCustomId('real_estate_portfolio')
            .setLabel('View Portfolio')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊');
        
        const upgradeButton = new ButtonBuilder()
            .setCustomId('real_estate_upgrade_menu')
            .setLabel('Upgrade Properties')
            .setStyle(ButtonStyle.Success)
            .setEmoji('⬆️');
        
        const row = new ActionRowBuilder().addComponents(portfolioButton, upgradeButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    getAvailableProperties() {
        return [
            { id: 'STUDIO_01', name: 'Downtown Studio', emoji: '🏢', price: 2500, dailyIncome: 25, type: 'residential' },
            { id: 'HOUSE_01', name: 'Suburban House', emoji: '🏠', price: 5000, dailyIncome: 60, type: 'residential' },
            { id: 'CONDO_01', name: 'Luxury Condo', emoji: '🏙️', price: 8000, dailyIncome: 100, type: 'residential' },
            { id: 'SHOP_01', name: 'Corner Shop', emoji: '🏪', price: 10000, dailyIncome: 150, type: 'commercial' },
            { id: 'OFFICE_01', name: 'Office Building', emoji: '🏢', price: 15000, dailyIncome: 250, type: 'commercial' },
            { id: 'MALL_01', name: 'Shopping Mall', emoji: '🏬', price: 25000, dailyIncome: 450, type: 'commercial' },
            { id: 'HOTEL_01', name: 'Boutique Hotel', emoji: '🏨', price: 35000, dailyIncome: 650, type: 'hospitality' },
            { id: 'RESORT_01', name: 'Beach Resort', emoji: '🏖️', price: 50000, dailyIncome: 1000, type: 'hospitality' }
        ];
    },
    
    canCollectIncome(property) {
        const lastCollected = new Date(property.lastCollected);
        const now = new Date();
        const timeDiff = now - lastCollected;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        return hoursDiff >= 24;
    },
    
    calculateAvailableIncome(properties) {
        return properties.reduce((total, property) => {
            if (this.canCollectIncome(property)) {
                return total + (property.dailyIncome * property.level);
            }
            return total;
        }, 0);
    },
    
    getPortfolioGrowth(userData) {
        const totalInvestment = userData.stats.totalRealEstateInvestment || 0;
        const totalIncome = userData.stats.totalRealEstateIncome || 0;
        
        if (totalInvestment === 0) return 0;
        
        return ((totalIncome / totalInvestment) * 100).toFixed(1);
    }
};
