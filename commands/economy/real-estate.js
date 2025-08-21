const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('real-estate')
        .setDescription(`🔥 Build your property empire! Earn passive VEX income 24/7!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('market')
                .setDescription(`✨ Discover premium properties with guaranteed ROI!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription(`💸 Secure your financial future with property investment!`)
                .addStringOption(option =>
                    option.setName('property_id')
                        .setDescription('ID of the property to purchase')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('portfolio')
                .setDescription(`📈 Track your growing empire and passive income streams!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('collect')
                .setDescription(`🎉 Claim your hard-earned rental profits!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('upgrade')
                .setDescription(`⬆️ Boost your property's earning potential!`)
                .addStringOption(option =>
                    option.setName('property_id')
                        .setDescription('ID of the property to upgrade')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sell')
                .setDescription(`💥 Cash out your investment for instant VEX!`)
                .addStringOption(option =>
                    option.setName('property_id')
                        .setDescription('ID of the property to sell')
                        .setRequired(true))),
    
    cooldown: 30,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: (userData.stats.lastCommand === 'real-estate'),
                quickReturn: (Date.now() - (userData.stats.lastRealEstateUse || 0)) < 300000, // 5 minutes
                timeSinceLastUse: Date.now() - (userData.stats.lastRealEstateUse || 0),
                investmentLevel: (userData.realEstate || []).length,
                portfolioValue: (userData.realEstate || []).reduce((sum, p) => sum + p.price, 0),
                isWhaleInvestor: (userData.realEstate || []).reduce((sum, p) => sum + p.price, 0) >= 100000
            };
            
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'real-estate',
                behaviorContext
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(
                interaction.user.id,
                'real-estate',
                true
            );
        }
        
        userData.stats.lastRealEstateUse = Date.now();
        userData.stats.realEstateUsageCount = (userData.stats.realEstateUsageCount || 0) + 1;
        
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
        const user = new User(interaction.user.id);
        const userData = await user.load();
        const availableProperties = this.getAvailableProperties();
        
        const marketTrend = Math.random() > 0.6 ? 'bullish' : 'bearish';
        const hotProperty = availableProperties[Math.floor(Math.random() * availableProperties.length)];
        const isFlashSale = Math.random() < 0.25; // Increased chance for FOMO
        const userPortfolioValue = (userData.realEstate || []).reduce((sum, p) => sum + p.price, 0);
        const isWhale = userPortfolioValue >= 100000;
        const isNewInvestor = (userData.realEstate || []).length === 0;
        const isExperienced = (userData.realEstate || []).length >= 5;
        const hasRecentActivity = (Date.now() - (userData.stats.lastRealEstateUse || 0)) < 3600000; // 1 hour
        const surpriseBonus = Math.random() < 0.15 ? Math.floor(Math.random() * 1000) + 500 : 0;
        const activeInvestors = Math.floor(Math.random() * 25) + 15; // Social proof
        const propertiesSoldToday = Math.floor(Math.random() * 8) + 3;
        
        let title = `${constants.EMOJIS.REAL_ESTATE} VexiumVerse Real Estate Market`;
        let description = '🏠 **BUILD YOUR PROPERTY EMPIRE!** Passive income awaits!';
        
        if (isFlashSale) {
            title = `🔥 FLASH SALE! Real Estate Market`;
            description = '⚡ **LIMITED TIME!** 15% off select properties! Act fast!';
        }
        
        if (isWhale) {
            title = `🐋 WHALE INVESTOR! Premium Real Estate Market`;
            description = '👑 **ELITE ACCESS!** Exclusive properties for top investors!';
        }
        
        const marketEmoji = marketTrend === 'bullish' ? '📈' : '📉';
        const marketMessage = marketTrend === 'bullish' ? 'PERFECT TIMING! Prices rising!' : 'BUY THE DIP! Great deals available!';
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', activeInvestors);
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', surpriseBonus) : null;
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description + `\n\n${marketEmoji} **Market Status:** ${marketMessage}\n\n🔥 ${fomoMessage}\n✨ ${socialProofMessage}${variableReward ? `\n💸 ${variableReward}` : ''}`)
            .addFields(
                { 
                    name: '🏘️ Market Intelligence', 
                    value: `**${availableProperties.length}** prime properties available\n🔥 **Hot Property:** ${hotProperty.name}\n📊 **Average ROI:** 12-25% annually\n💰 **Your Portfolio:** ${userPortfolioValue.toFixed(0)} VEX\n📈 **${propertiesSoldToday} properties** sold today!`, 
                    inline: false 
                }
            )
            .setColor(isFlashSale ? constants.COLORS.VEX : constants.COLORS.REAL_ESTATE)
            .setFooter({ text: isFlashSale ? '⚡ Flash sale ends soon! Properties generate 24/7 income' : 'Properties generate passive income every 24 hours' })
            .setTimestamp();
        
        for (const property of availableProperties.slice(0, 8)) {
            const roi = ((property.dailyIncome * 365) / property.price * 100).toFixed(1);
            
            const priceUSD = (property.price * Economics.getCurrentVEXPrice()).toFixed(2);
            const incomeUSD = (property.dailyIncome * Economics.getCurrentVEXPrice()).toFixed(2);
            
            embed.addFields({
                name: `${property.emoji} ${property.name}`,
                value: `**Price**: ${property.price.toFixed(2)} VEX (~$${priceUSD})\n**Daily Income**: ${property.dailyIncome.toFixed(2)} VEX (~$${incomeUSD})\n**ROI**: ${roi}% annually\n**ID**: ${property.id}`,
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
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const marketProgress = marketTrend === 'bullish' ? 0.75 : 0.35;
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Market Trend: ${marketTrend.toUpperCase()}`,
            marketProgress,
            marketTrend === 'bullish' ? constants.COLORS.SUCCESS : constants.COLORS.WARNING
        );

        embed.setImage('attachment://market-trend.png');

        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'market-trend.png' }]
        });
    },
    
    async handleBuy(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const propertyId = interaction.options.getString('property_id');
        const availableProperties = this.getAvailableProperties();
        const property = availableProperties.find(p => p.id === propertyId);
        
        if (!property) {
            const nearMissMessage = constants.NEAR_MISS_MESSAGES[Math.floor(Math.random() * constants.NEAR_MISS_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Property Not Found`)
                .setDescription(`💥 No property found with ID: ${propertyId}\n\n✨ ${nearMissMessage}\n\n🔥 Use \`/real-estate market\` to discover amazing properties!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (!userData.realEstate) userData.realEstate = [];
        
        if (userData.realEstate.some(p => p.id === propertyId)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Property Already Owned`)
                .setDescription(`🎉 You already own **${property.name}**!\n\n✨ Each property can only be owned once. Try upgrading...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (userData.vexBalance < property.price) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`${constants.ANIMATED_EMOJIS.MONEY_RAIN} Property price: ${property.price.toFixed(2)} VEX (~$${(property.price * Economics.getCurrentVEXPrice()).toFixed(2)})\n${constants.ANIMATED_EMOJIS.SPARKLES} **Your balance:** ${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})\n\n💡 **Tip:** Earn more VEX with /daily or /work!`)
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
        
        Economics.apply({ event: 'buy', amountVEX: property.price, userId: interaction.user.id, meta: { command: 'real-estate' } });
        
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
        
        const milestoneMessage = userData.stats.propertiesOwned >= 5 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 30) + 10);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Property Purchased Successfully!`)
            .setDescription(`Congratulations! You now own **${property.name}**!${milestoneMessage ? `\n\n${milestoneMessage}` : ''}\n\n${socialProofMessage}`)
            .addFields(
                { name: '🏠 Property', value: `${property.emoji} ${property.name}`, inline: true },
                { name: '💰 Purchase Price', value: `${property.price.toFixed(2)} VEX (~$${(property.price * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '📈 Daily Income', value: `${property.dailyIncome.toFixed(2)} VEX (~$${(property.dailyIncome * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '📊 Annual ROI', value: `${annualROI}%`, inline: true },
                { name: '💼 New Balance', value: `${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
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
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const roiProgress = Math.min(parseFloat(annualROI) / 30, 1); // Cap at 30% for visualization
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Annual ROI: ${annualROI}%`,
            roiProgress,
            constants.COLORS.SUCCESS
        );

        embed.setImage('attachment://roi-progress.png');

        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'roi-progress.png' }]
        });
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
                { name: '🏘️ Portfolio Summary', value: `**Properties Owned**: ${properties.length}\n**Total Value**: ${totalValue.toFixed(2)} VEX\n**Daily Income**: ${dailyIncome.toFixed(2)} VEX`, inline: true },
                { name: '💰 Income Stats', value: `**Total Earned**: ${totalEarned.toFixed(2)} VEX\n**Monthly Income**: ${(dailyIncome * 30).toFixed(2)} VEX\n**Annual ROI**: ${totalValue > 0 ? ((dailyIncome * 365 / totalValue) * 100).toFixed(1) : '0.0'}%`, inline: true },
                { name: '📊 Performance', value: `**Avg Property Value**: ${properties.length > 0 ? (totalValue / properties.length).toFixed(2) : '0.00'} VEX\n**Avg Daily Income**: ${properties.length > 0 ? (dailyIncome / properties.length).toFixed(2) : '0.00'} VEX\n**Portfolio Growth**: +${this.getPortfolioGrowth(userData)}%`, inline: true }
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
                    value: `${availableIncome.toFixed(2)} VEX available!\nUse \`/real-estate collect\` to claim your rental income.`,
                    inline: false
                });
            }
            
            for (const property of properties.slice(0, 6)) {
                const canCollect = this.canCollectIncome(property);
                const status = canCollect ? '💰 Income Ready' : '⏳ Generating Income';
                const nextCollection = canCollect ? 'Now' : `<t:${Math.floor((new Date(property.lastCollected).getTime() + 24 * 60 * 60 * 1000) / 1000)}:R>`;
                
                embed.addFields({
                    name: `${property.emoji} ${property.name} (Lv.${property.level})`,
                    value: `**Daily Income**: ${(property.dailyIncome * property.level).toFixed(2)} VEX\n**Status**: ${status}\n**Next**: ${nextCollection}`,
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
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const portfolioProgress = Math.min(totalValue / 50000, 1); // Progress towards 50k portfolio
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Portfolio Value: ${totalValue.toFixed(0)} VEX`,
            portfolioProgress,
            constants.COLORS.REAL_ESTATE
        );

        embed.setImage('attachment://portfolio-progress.png');

        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'portfolio-progress.png' }]
        });
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
        Economics.apply({ event: 'reward', amountVEX: availableIncome, userId: interaction.user.id, meta: { command: 'real-estate' } });
        
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
                { name: '💰 Income Collected', value: `${availableIncome.toFixed(2)} VEX`, inline: true },
                { name: '🏠 Properties', value: `${propertiesCollected} properties`, inline: true },
                { name: '💼 New Balance', value: `${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '📊 Total Real Estate Income', value: `${userData.stats.totalRealEstateIncome.toFixed(2)} VEX`, inline: true },
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
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const incomeProgress = Math.min(totalIncome / 1000, 1); // Progress visualization
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Income Collected: ${totalIncome.toFixed(2)} VEX`,
            incomeProgress,
            constants.COLORS.SUCCESS
        );

        embed.setImage('attachment://income-progress.png');

        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'income-progress.png' }]
        });
    },
    
    getAvailableProperties() {
        return [
            { id: 'STUDIO_01', name: 'Downtown Studio', emoji: '🏢', price: Economics.getPeggedVEXPrice(25), dailyIncome: Economics.getPeggedVEXPrice(0.05), type: 'residential' },
            { id: 'HOUSE_01', name: 'Suburban House', emoji: '🏠', price: Economics.getPeggedVEXPrice(50), dailyIncome: Economics.getPeggedVEXPrice(0.08), type: 'residential' },
            { id: 'CONDO_01', name: 'Luxury Condo', emoji: '🏙️', price: Economics.getPeggedVEXPrice(80), dailyIncome: Economics.getPeggedVEXPrice(0.12), type: 'residential' },
            { id: 'SHOP_01', name: 'Corner Shop', emoji: '🏪', price: Economics.getPeggedVEXPrice(100), dailyIncome: Economics.getPeggedVEXPrice(0.15), type: 'commercial' },
            { id: 'OFFICE_01', name: 'Office Building', emoji: '🏢', price: Economics.getPeggedVEXPrice(150), dailyIncome: Economics.getPeggedVEXPrice(0.25), type: 'commercial' },
            { id: 'MALL_01', name: 'Shopping Mall', emoji: '🏬', price: Economics.getPeggedVEXPrice(250), dailyIncome: Economics.getPeggedVEXPrice(0.40), type: 'commercial' },
            { id: 'HOTEL_01', name: 'Boutique Hotel', emoji: '🏨', price: Economics.getPeggedVEXPrice(350), dailyIncome: Economics.getPeggedVEXPrice(0.55), type: 'hospitality' },
            { id: 'RESORT_01', name: 'Beach Resort', emoji: '🏖️', price: Economics.getPeggedVEXPrice(500), dailyIncome: Economics.getPeggedVEXPrice(0.80), type: 'hospitality' }
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
