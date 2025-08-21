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
            .setDescription('```ansi\n\u001b[1;33m╔══════════════════════════════════════╗\n║    💼 START YOUR BUSINESS EMPIRE 💼    ║\n╚══════════════════════════════════════╝\u001b[0m\n```\n\n🚀 **10 Business Tiers - From $500 to $50,000!**\n💰 **Financing: 25% down • 12% APR • 12/24/36 months**\n📈 **Variable performance creates emotional attachment**')
            .addFields(
                { 
                    name: '🍋 **LEMONADE STAND**', 
                    value: '```diff\n+ Low Startup Cost\n+ Quick ROI\n+ Learn Business Basics\n```\n💰 **Price**: $500 VEX\n📊 **Monthly Income**: $15-$25\n🏦 **Financing**: $125 down', 
                    inline: true 
                },
                { 
                    name: '🚚 **FOOD TRUCK**', 
                    value: '```diff\n+ Mobile Business\n+ Flexible Locations\n+ Growing Market\n```\n💰 **Price**: $1,500 VEX\n📊 **Monthly Income**: $45-$75\n🏦 **Financing**: $375 down', 
                    inline: true 
                },
                { 
                    name: '💼 **CONSULTING FIRM**', 
                    value: '```diff\n+ Low Overhead Costs\n+ High Profit Margins\n+ Expertise Based\n```\n💰 **Price**: $3,000 VEX\n📊 **Monthly Income**: $80-$120\n🏦 **Financing**: $750 down', 
                    inline: true 
                },
                { 
                    name: '🛍️ **RETAIL STORE**', 
                    value: '```diff\n+ Physical Storefront\n+ Inventory Management\n+ Customer Base\n```\n💰 **Price**: $5,000 VEX\n📊 **Monthly Income**: $125-$175\n🏦 **Financing**: $1,250 down', 
                    inline: true 
                },
                { 
                    name: '💻 **TECH STARTUP**', 
                    value: '```diff\n+ High Growth Potential\n+ Scalable Business Model\n+ Innovation Focused\n```\n💰 **Price**: $8,000 VEX\n📊 **Monthly Income**: $200-$280\n🏦 **Financing**: $2,000 down', 
                    inline: true 
                },
                { 
                    name: '🍕 **RESTAURANT CHAIN**', 
                    value: '```diff\n+ Multiple Locations\n+ Brand Recognition\n+ Steady Revenue\n```\n💰 **Price**: $12,000 VEX\n📊 **Monthly Income**: $300-$420\n🏦 **Financing**: $3,000 down', 
                    inline: true 
                },
                { 
                    name: '🏭 **MANUFACTURING PLANT**', 
                    value: '```diff\n+ Production Facility\n+ Supply Chain Control\n+ Export Opportunities\n```\n💰 **Price**: $18,000 VEX\n📊 **Monthly Income**: $450-$630\n🏦 **Financing**: $4,500 down', 
                    inline: true 
                },
                { 
                    name: '🏢 **REAL ESTATE FIRM**', 
                    value: '```diff\n+ Property Investment\n+ Management Services\n+ Passive Income\n```\n💰 **Price**: $25,000 VEX\n📊 **Monthly Income**: $625-$875\n🏦 **Financing**: $6,250 down', 
                    inline: true 
                },
                { 
                    name: '🏦 **INVESTMENT BANK**', 
                    value: '```diff\n+ Financial Services\n+ High-Value Transactions\n+ Premium Clients\n```\n💰 **Price**: $35,000 VEX\n📊 **Monthly Income**: $875-$1,225\n🏦 **Financing**: $8,750 down', 
                    inline: true 
                },
                { 
                    name: '🌍 **MULTINATIONAL CORP**', 
                    value: '```diff\n+ Global Enterprise\n+ Diverse Revenue Streams\n+ Market Dominance\n```\n💰 **Price**: $50,000 VEX\n📊 **Monthly Income**: $1,250-$1,750\n🏦 **Financing**: $12,500 down', 
                    inline: true 
                }
            )
            .setColor('#FFD700')
            .setFooter({ text: '💡 Financing Terms: 25% down • 12% APR • 12, 24, or 36 month terms • Variable performance creates attachment' })
            .setTimestamp();

        const businessSelect = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('business_purchase_select')
                    .setPlaceholder('🎯 Select Your Business Venture')
                    .addOptions([
                        {
                            label: '🍋 Lemonade Stand',
                            description: '$500 • $15-$25/month • $125 down',
                            value: 'lemonade_stand',
                            emoji: '🍋'
                        },
                        {
                            label: '🚚 Food Truck',
                            description: '$1,500 • $45-$75/month • $375 down',
                            value: 'food_truck',
                            emoji: '🚚'
                        },
                        {
                            label: '💼 Consulting Firm',
                            description: '$3,000 • $80-$120/month • $750 down',
                            value: 'consulting_firm',
                            emoji: '💼'
                        },
                        {
                            label: '🛍️ Retail Store',
                            description: '$5,000 • $125-$175/month • $1,250 down',
                            value: 'retail_store',
                            emoji: '🛍️'
                        },
                        {
                            label: '💻 Tech Startup',
                            description: '$8,000 • $200-$280/month • $2,000 down',
                            value: 'tech_startup',
                            emoji: '💻'
                        },
                        {
                            label: '🍕 Restaurant Chain',
                            description: '$12,000 • $300-$420/month • $3,000 down',
                            value: 'restaurant_chain',
                            emoji: '🍕'
                        },
                        {
                            label: '🏭 Manufacturing Plant',
                            description: '$18,000 • $450-$630/month • $4,500 down',
                            value: 'manufacturing',
                            emoji: '🏭'
                        },
                        {
                            label: '🏢 Real Estate Firm',
                            description: '$25,000 • $625-$875/month • $6,250 down',
                            value: 'real_estate_firm',
                            emoji: '🏢'
                        },
                        {
                            label: '🏦 Investment Bank',
                            description: '$35,000 • $875-$1,225/month • $8,750 down',
                            value: 'investment_bank',
                            emoji: '🏦'
                        },
                        {
                            label: '🌍 Multinational Corp',
                            description: '$50,000 • $1,250-$1,750/month • $12,500 down',
                            value: 'multinational_corp',
                            emoji: '🌍'
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
            .setDescription('**Calculate your financing options for any business investment**\n\n💡 **Terms Available:**\n• 25% down payment required\n• 12% APR fixed rate\n• 12, 24, or 36 month terms\n• No prepayment penalties')
            .addFields(
                { name: '📊 Example: $5,000 Business', value: '**12 Month Term:**\n• Down Payment: $1,250\n• Monthly Payment: $334\n• Total Interest: $258\n• Total Cost: $5,258', inline: true },
                { name: '📊 Example: $5,000 Business', value: '**24 Month Term:**\n• Down Payment: $1,250\n• Monthly Payment: $177\n• Total Interest: $498\n• Total Cost: $5,498', inline: true },
                { name: '📊 Example: $5,000 Business', value: '**36 Month Term:**\n• Down Payment: $1,250\n• Monthly Payment: $125\n• Total Interest: $750\n• Total Cost: $5,750', inline: true }
            )
            .setColor('#4169E1')
            .setFooter({ text: 'Business income: $125-$140/month avg • Some months may have losses' });
        
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
            lemonade_stand: { 
                name: 'Lemonade Stand', 
                price: Economics.getPeggedVEXPrice(500), 
                monthlyIncomeRange: { min: 15, max: 25 },
                description: 'Small neighborhood business with low startup costs'
            },
            food_truck: { 
                name: 'Food Truck', 
                price: Economics.getPeggedVEXPrice(1500), 
                monthlyIncomeRange: { min: 45, max: 75 },
                description: 'Mobile food service with flexible locations'
            },
            consulting_firm: { 
                name: 'Consulting Firm', 
                price: Economics.getPeggedVEXPrice(3000), 
                monthlyIncomeRange: { min: 80, max: 120 },
                description: 'Low overhead costs with high profit margins'
            },
            retail_store: { 
                name: 'Retail Store', 
                price: Economics.getPeggedVEXPrice(5000), 
                monthlyIncomeRange: { min: 125, max: 175 },
                description: 'Physical storefront with inventory management'
            },
            tech_startup: { 
                name: 'Tech Startup', 
                price: Economics.getPeggedVEXPrice(8000), 
                monthlyIncomeRange: { min: 200, max: 280 },
                description: 'High growth potential with scalable business model'
            },
            restaurant_chain: { 
                name: 'Restaurant Chain', 
                price: Economics.getPeggedVEXPrice(12000), 
                monthlyIncomeRange: { min: 300, max: 420 },
                description: 'Multiple locations with brand recognition'
            },
            manufacturing: { 
                name: 'Manufacturing Plant', 
                price: Economics.getPeggedVEXPrice(18000), 
                monthlyIncomeRange: { min: 450, max: 630 },
                description: 'Production facility with supply chain control'
            },
            real_estate_firm: { 
                name: 'Real Estate Firm', 
                price: Economics.getPeggedVEXPrice(25000), 
                monthlyIncomeRange: { min: 625, max: 875 },
                description: 'Property investment and management company'
            },
            investment_bank: { 
                name: 'Investment Bank', 
                price: Economics.getPeggedVEXPrice(35000), 
                monthlyIncomeRange: { min: 875, max: 1225 },
                description: 'Financial services with high-value transactions'
            },
            multinational_corp: { 
                name: 'Multinational Corporation', 
                price: Economics.getPeggedVEXPrice(50000), 
                monthlyIncomeRange: { min: 1250, max: 1750 },
                description: 'Global enterprise with diverse revenue streams'
            }
        };
    },

    async handlePerformancePreview(interaction, businessType) {
        const { EmbedBuilder } = require('discord.js');
        
        const months = [];
        let totalIncome = 0;
        
        for (let i = 1; i <= 6; i++) {
            const performance = this.calculateBusinessPerformance(businessType, i);
            months.push({
                month: i,
                income: performance.income,
                performance: performance.performance,
                isLoss: performance.isLoss
            });
            totalIncome += performance.income;
        }
        
        const avgMonthlyIncome = totalIncome / 6;
        const businessTypes = this.getBusinessTypes();
        const business = businessTypes[businessType];
        const loanPayment = this.calculateFinancing(business.price, 36).monthlyPayment;
        const avgProfit = avgMonthlyIncome - loanPayment;
        
        const embed = new EmbedBuilder()
            .setTitle(`📊 ${businessType.replace('_', ' ').toUpperCase()} - 6-Month Performance Preview`)
            .setDescription('**Simulated business performance showing realistic variability**\n\n*This preview shows how your business might perform over 6 months*')
            .addFields(
                ...months.map(month => ({
                    name: `Month ${month.month} ${month.performance === 'poor' ? '📉' : month.performance === 'exceptional' ? '📈' : '📊'}`,
                    value: `${month.isLoss ? '❌' : '✅'} $${month.income.toFixed(2)} ${month.performance}`,
                    inline: true
                })),
                { 
                    name: '📈 6-Month Summary', 
                    value: `**Total Income**: $${totalIncome.toFixed(2)}\n**Avg Monthly**: $${avgMonthlyIncome.toFixed(2)}\n**Loan Payment**: $${loanPayment.toFixed(2)}\n**Avg Profit**: $${avgProfit.toFixed(2)}`, 
                    inline: false 
                },
                { 
                    name: '⚠️ Risk Factors', 
                    value: `• 15% chance of monthly losses\n• Variable market conditions\n• Emotional investment required\n• Success depends on your engagement`, 
                    inline: false 
                }
            )
            .setColor(avgProfit > 0 ? '#00FF00' : '#FF6B6B')
            .setFooter({ text: 'Actual performance will vary • Past performance does not guarantee future results' });
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
