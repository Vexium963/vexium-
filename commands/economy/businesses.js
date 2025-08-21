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
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const businessType = interaction.options.getString('type');
        const businessCosts = {
            tech: Economics.getPeggedVEXPrice(500),
            restaurant: Economics.getPeggedVEXPrice(300),
            retail: Economics.getPeggedVEXPrice(200),
            consulting: Economics.getPeggedVEXPrice(100)
        };
        
        const cost = businessCosts[businessType];
        
        if (userData.vexBalance < cost) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`You need ${cost.toFixed(2)} VEX (~$${(cost * Economics.getCurrentVEXPrice()).toFixed(2)}) to start this business but only have ${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)}).`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (!userData.businesses) userData.businesses = [];
        
        const business = {
            id: Date.now().toString(),
            type: businessType,
            level: 1,
            startDate: new Date().toISOString(),
            totalInvested: cost,
            dailyProfit: cost * 0.05,
            lastCollection: new Date().toISOString()
        };
        
        userData.businesses.push(business);
        
        await user.removeVEX(cost, 'business_investment');
        Economics.updateVEXMarket('investment', cost);
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`🏢 Business Started Successfully!`)
            .setDescription(`**${businessType.charAt(0).toUpperCase() + businessType.slice(1)} Business** is now operational!\n\n💰 **Investment:** ${cost.toFixed(2)} VEX (~$${(cost * Economics.getCurrentVEXPrice()).toFixed(2)})\n📈 **Daily Profit:** ${business.dailyProfit.toFixed(2)} VEX (~$${(business.dailyProfit * Economics.getCurrentVEXPrice()).toFixed(2)})`)
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
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
    }
};
