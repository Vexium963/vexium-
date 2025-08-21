const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('businesses')
        .setDescription(`🏢 Start and manage profitable business ventures - Build your business empire!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a new business venture')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Choose your business type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Tech Startup', value: 'tech' },
                            { name: 'Restaurant', value: 'restaurant' },
                            { name: 'Retail Store', value: 'retail' },
                            { name: 'Consulting Firm', value: 'consulting' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('manage')
                .setDescription('Manage your existing businesses'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('portfolio')
                .setDescription('View your business portfolio and profits'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('upgrade')
                .setDescription('Upgrade your businesses for higher profits')),
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'businesses', true);
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'start':
                return this.handleStart(interaction);
            case 'manage':
                return this.handleManage(interaction);
            case 'portfolio':
                return this.handlePortfolio(interaction);
            case 'upgrade':
                return this.handleUpgrade(interaction);
        }
    },
    
    async handleStart(interaction) {
        return this.handleMarket(interaction);
    },
    
    async handleManage(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.businesses || userData.businesses.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`🏢 No Businesses Found`)
                .setDescription('You don\'t have any businesses yet. Use `/businesses start` to begin your entrepreneurial journey!')
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`🏢 Business Management Dashboard`)
            .setDescription('Manage your business empire:')
            .setColor(constants.COLORS.PRIMARY);
        
        userData.businesses.forEach((business, index) => {
            const daysSinceStart = Math.floor((Date.now() - new Date(business.startDate).getTime()) / (1000 * 60 * 60 * 24));
            embed.addFields({
                name: `${business.type.charAt(0).toUpperCase() + business.type.slice(1)} Business #${index + 1}`,
                value: `Level ${business.level} | ${daysSinceStart} days old\nDaily Profit: ${business.dailyProfit.toFixed(2)} VEX (~$${(business.dailyProfit * Economics.getCurrentVEXPrice()).toFixed(2)})`,
                inline: true
            });
        });
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handlePortfolio(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.businesses || userData.businesses.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`📊 Business Portfolio`)
                .setDescription('No businesses in your portfolio yet.')
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const totalInvested = userData.businesses.reduce((sum, business) => sum + business.totalInvested, 0);
        const totalDailyProfit = userData.businesses.reduce((sum, business) => sum + business.dailyProfit, 0);
        
        const embed = new EmbedBuilder()
            .setTitle(`📊 Business Portfolio`)
            .setDescription(`**${userData.businesses.length} Active Businesses**`)
            .addFields(
                { name: '💰 Total Invested', value: `${totalInvested.toFixed(2)} VEX (~$${(totalInvested * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '📈 Daily Profit', value: `${totalDailyProfit.toFixed(2)} VEX (~$${(totalDailyProfit * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '📊 ROI', value: `${((totalDailyProfit / totalInvested) * 100).toFixed(2)}% daily`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleUpgrade(interaction) {
        const embed = new EmbedBuilder()
            .setTitle(`🔧 Business Upgrades`)
            .setDescription('Business upgrade system coming soon! Upgrade your businesses to increase profits.')
            .setColor(constants.COLORS.INFO);
        
        await interaction.reply({ embeds: [embed] });
    },

    async handleMarket(interaction) {
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setTitle('🏢 **BUSINESS MARKETPLACE** - Build Your Empire')
            .setDescription('```ansi\n\u001b[1;33m╔══════════════════════════════════════╗\n║    💼 START YOUR BUSINESS EMPIRE 💼    ║\n╚══════════════════════════════════════╝\u001b[0m\n```\n\n🚀 **Choose from diverse business opportunities!**\n💰 **Financing available with 25% down payment**\n📈 **Sustainable ROI designed for long-term growth**')
            .addFields(
                { 
                    name: '💻 **TECH STARTUP**', 
                    value: '```diff\n+ High Growth Potential\n+ Scalable Business Model\n+ Innovation Focused\n```\n💰 **Price**: $50,000 VEX\n📊 **Daily ROI**: 0.15% (~5.5% annual)\n🏦 **Financing**: $12,500 down', 
                    inline: true 
                },
                { 
                    name: '🍕 **RESTAURANT CHAIN**', 
                    value: '```diff\n+ Steady Customer Base\n+ Multiple Revenue Streams\n+ Brand Recognition\n```\n💰 **Price**: $30,000 VEX\n📊 **Daily ROI**: 0.16% (~5.8% annual)\n🏦 **Financing**: $7,500 down', 
                    inline: true 
                },
                { 
                    name: '🛍️ **RETAIL EMPIRE**', 
                    value: '```diff\n+ Physical & Online Sales\n+ Inventory Management\n+ Market Expansion\n```\n💰 **Price**: $20,000 VEX\n📊 **Daily ROI**: 0.18% (~6.6% annual)\n🏦 **Financing**: $5,000 down', 
                    inline: true 
                },
                { 
                    name: '💼 **CONSULTING FIRM**', 
                    value: '```diff\n+ Low Overhead Costs\n+ High Profit Margins\n+ Expertise Based\n```\n💰 **Price**: $10,000 VEX\n📊 **Daily ROI**: 0.20% (~7.3% annual)\n🏦 **Financing**: $2,500 down', 
                    inline: true 
                },
                { 
                    name: '🏭 **MANUFACTURING**', 
                    value: '```diff\n+ Production Efficiency\n+ Supply Chain Control\n+ Export Opportunities\n```\n💰 **Price**: $75,000 VEX\n📊 **Daily ROI**: 0.14% (~5.1% annual)\n🏦 **Financing**: $18,750 down', 
                    inline: true 
                },
                { 
                    name: '🎯 **MARKETING AGENCY**', 
                    value: '```diff\n+ Creative Services\n+ Digital Marketing\n+ Client Retention\n```\n💰 **Price**: $15,000 VEX\n📊 **Daily ROI**: 0.19% (~6.9% annual)\n🏦 **Financing**: $3,750 down', 
                    inline: true 
                }
            )
            .setColor('#FFD700')
            .setFooter({ text: '💡 Financing Terms: 25% down • 12% APR • 12 or 24 month terms available' })
            .setTimestamp();

        const businessSelect = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('business_purchase_select')
                    .setPlaceholder('🎯 Select Your Business Venture')
                    .addOptions([
                        {
                            label: '💻 Tech Startup',
                            description: '$50,000 • 5.5% annual ROI • $12,500 down',
                            value: 'tech_startup',
                            emoji: '💻'
                        },
                        {
                            label: '🍕 Restaurant Chain',
                            description: '$30,000 • 5.8% annual ROI • $7,500 down',
                            value: 'restaurant_chain',
                            emoji: '🍕'
                        },
                        {
                            label: '🛍️ Retail Empire',
                            description: '$20,000 • 6.6% annual ROI • $5,000 down',
                            value: 'retail_empire',
                            emoji: '🛍️'
                        },
                        {
                            label: '💼 Consulting Firm',
                            description: '$10,000 • 7.3% annual ROI • $2,500 down',
                            value: 'consulting_firm',
                            emoji: '💼'
                        },
                        {
                            label: '🏭 Manufacturing',
                            description: '$75,000 • 5.1% annual ROI • $18,750 down',
                            value: 'manufacturing',
                            emoji: '🏭'
                        },
                        {
                            label: '🎯 Marketing Agency',
                            description: '$15,000 • 6.9% annual ROI • $3,750 down',
                            value: 'marketing_agency',
                            emoji: '🎯'
                        }
                    ])
            );

        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('business_portfolio_overview')
                    .setLabel('📊 My Businesses')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('business_financing_calculator')
                    .setLabel('🧮 Financing Calculator')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('business_market_trends')
                    .setLabel('📈 Market Trends')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({ 
            embeds: [embed], 
            components: [businessSelect, actionButtons] 
        });
    },

    calculateFinancing(totalPrice, termMonths) {
        const downPayment = totalPrice * 0.25;
        const loanAmount = totalPrice - downPayment;
        const monthlyInterestRate = 0.12 / 12;
        
        const monthlyPayment = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, termMonths)) / 
                              (Math.pow(1 + monthlyInterestRate, termMonths) - 1);
        
        const totalInterest = (monthlyPayment * termMonths) - loanAmount;
        const totalCost = totalPrice + totalInterest;
        
        return {
            downPayment,
            loanAmount,
            monthlyPayment,
            totalInterest,
            totalCost,
            termMonths
        };
    },

    async handleFinancingCalculator(interaction) {
        const { EmbedBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setTitle('🧮 Business Financing Calculator')
            .setDescription('**Calculate your financing options for any business investment**\n\n💡 **Terms Available:**\n• 25% down payment required\n• 12% APR fixed rate\n• 12 or 24 month terms\n• No prepayment penalties')
            .addFields(
                { name: '📊 Example: $50,000 Tech Startup', value: '**12 Month Term:**\n• Down Payment: $12,500\n• Monthly Payment: $3,347\n• Total Interest: $2,664\n• Total Cost: $52,664', inline: true },
                { name: '📊 Example: $50,000 Tech Startup', value: '**24 Month Term:**\n• Down Payment: $12,500\n• Monthly Payment: $1,766\n• Total Interest: $4,884\n• Total Cost: $54,884', inline: true }
            )
            .setColor('#4169E1')
            .setFooter({ text: 'Select a business from the marketplace to see exact financing terms' });
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handlePurchaseFlow(interaction, businessType) {
        const User = require('../../database/models/User');
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const businessTypes = this.getBusinessTypes();
        const business = businessTypes[businessType];
        
        if (!business) {
            return interaction.reply({ content: '❌ Invalid business type selected.', ephemeral: true });
        }
        
        const financing12 = this.calculateFinancing(business.price, 12);
        const financing24 = this.calculateFinancing(business.price, 24);
        
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setTitle(`🏢 ${business.name} - Purchase Options`)
            .setDescription(`**${business.description}**\n\n💰 **Full Price**: ${business.price.toFixed(2)} VEX (~$${(business.price * Economics.getCurrentVEXPrice()).toFixed(2)})\n📊 **Daily ROI**: ${(business.dailyROI * 100).toFixed(2)}% (${((business.dailyROI * 365) * 100).toFixed(1)}% annual)`)
            .addFields(
                { 
                    name: '💸 Cash Purchase', 
                    value: `**Total Cost**: ${business.price.toFixed(2)} VEX\n**Immediate Ownership**: Yes\n**Monthly Payments**: None`, 
                    inline: true 
                },
                { 
                    name: '🏦 12-Month Financing', 
                    value: `**Down Payment**: ${financing12.downPayment.toFixed(2)} VEX\n**Monthly Payment**: ${financing12.monthlyPayment.toFixed(2)} VEX\n**Total Cost**: ${financing12.totalCost.toFixed(2)} VEX`, 
                    inline: true 
                },
                { 
                    name: '🏦 24-Month Financing', 
                    value: `**Down Payment**: ${financing24.downPayment.toFixed(2)} VEX\n**Monthly Payment**: ${financing24.monthlyPayment.toFixed(2)} VEX\n**Total Cost**: ${financing24.totalCost.toFixed(2)} VEX`, 
                    inline: true 
                }
            )
            .setColor('#FFD700')
            .setFooter({ text: 'Choose your preferred payment method below' });
        
        const purchaseButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`business_buy_cash_${businessType}`)
                    .setLabel('💸 Buy with Cash')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`business_finance_12_${businessType}`)
                    .setLabel('🏦 12-Month Financing')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`business_finance_24_${businessType}`)
                    .setLabel('🏦 24-Month Financing')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        await interaction.update({ embeds: [embed], components: [purchaseButtons] });
    },

    getBusinessTypes() {
        const Economics = require('../../utils/economics');
        return {
            tech_startup: { 
                name: 'Tech Startup', 
                price: Economics.getPeggedVEXPrice(50000), 
                dailyROI: 0.0015,
                description: 'High growth potential with scalable business model'
            },
            restaurant_chain: { 
                name: 'Restaurant Chain', 
                price: Economics.getPeggedVEXPrice(30000), 
                dailyROI: 0.0016,
                description: 'Steady customer base with multiple revenue streams'
            },
            retail_empire: { 
                name: 'Retail Empire', 
                price: Economics.getPeggedVEXPrice(20000), 
                dailyROI: 0.0018,
                description: 'Physical and online sales with market expansion'
            },
            consulting_firm: { 
                name: 'Consulting Firm', 
                price: Economics.getPeggedVEXPrice(10000), 
                dailyROI: 0.002,
                description: 'Low overhead costs with high profit margins'
            },
            manufacturing: { 
                name: 'Manufacturing', 
                price: Economics.getPeggedVEXPrice(75000), 
                dailyROI: 0.0014,
                description: 'Production efficiency with supply chain control'
            },
            marketing_agency: { 
                name: 'Marketing Agency', 
                price: Economics.getPeggedVEXPrice(15000), 
                dailyROI: 0.0019,
                description: 'Creative services with digital marketing focus'
            }
        };
    }
};
