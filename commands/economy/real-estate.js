const { SlashCommandBuilder } = require('discord.js');
const User = require('../../database/models/User');
const { route } = require('../../utils/router');
const ui = require('../../utils/ui');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('realestate')
        .setDescription('Real estate operations')
        .addSubcommand(s => s.setName('list').setDescription('View available properties'))
        .addSubcommand(s => s.setName('buy').setDescription('Purchase property').addStringOption(o => o.setName('id').setRequired(true)))
        .addSubcommand(s => s.setName('income').setDescription('Collect property income'))
        .addSubcommand(s => s.setName('sell').setDescription('Sell property').addStringOption(o => o.setName('id').setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        return route(interaction, {
            list: this.handleList,
            buy: this.handleBuy,
            income: this.handleIncome,
            sell: this.handleSell,
            _fallback: (i) => i.editReply({ embeds: [ui.err('Unknown subcommand', 'Please use a valid real estate operation.')] })
        });
    },

    async handleList(interaction) {
        const properties = {
            apartment: { name: 'Small Apartment', price: 2500, yield: 0.032 },
            condo: { name: 'City Condo', price: 7500, yield: 0.028 },
            house: { name: 'Suburban House', price: 15000, yield: 0.025 },
            villa: { name: 'Luxury Villa', price: 35000, yield: 0.022 },
            commercial: { name: 'Commercial Building', price: 75000, yield: 0.020 },
            skyscraper: { name: 'Skyscraper', price: 200000, yield: 0.018 }
        };

        const propertyList = Object.entries(properties).map(([id, p]) => 
            `**${p.name}** (${id})\n` +
            `Price: ${ui.formatCurrency(p.price)}\n` +
            `Yield: ${(p.yield * 100).toFixed(1)}% weekly`
        ).join('\n\n');

        const embed = ui.info('Available Properties', propertyList);
        await interaction.editReply({ embeds: [embed] });
    },

    async handleBuy(interaction) {
        const TransactionManager = require('../../utils/TransactionManager');
        const Economics = require('../../utils/economics');
        
        const propertyId = interaction.options.getString('id');
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const properties = {
            apartment: { name: 'Small Apartment', price: 2500, yield: 0.032 },
            condo: { name: 'City Condo', price: 7500, yield: 0.028 },
            house: { name: 'Suburban House', price: 15000, yield: 0.025 },
            villa: { name: 'Luxury Villa', price: 35000, yield: 0.022 },
            commercial: { name: 'Commercial Building', price: 75000, yield: 0.020 },
            skyscraper: { name: 'Skyscraper', price: 200000, yield: 0.018 }
        };
        
        const property = properties[propertyId];
        if (!property) {
            return interaction.editReply({ embeds: [ui.err('Invalid property', 'Use /realestate list to see available properties.')] });
        }
        
        if (userData.vexBalance < property.price) {
            return interaction.editReply({ embeds: [ui.err('Insufficient funds', `Need ${ui.formatCurrency(property.price)}.`)] });
        }
        
        let txId;
        try {
            txId = await TransactionManager.begin(interaction.user.id, 'real_estate_purchase', property.price);
            
            if (!userData.realEstate) userData.realEstate = [];
            
            const newProperty = {
                id: `${propertyId}_${Date.now()}`,
                type: propertyId,
                name: property.name,
                price: property.price,
                yield: property.yield,
                purchasedAt: new Date().toISOString(),
                lastIncomeCollected: new Date().toISOString()
            };
            
            userData.realEstate.push(newProperty);
            await user.save(userData);
            
            await TransactionManager.commit(txId);
            Economics.apply({ event: 'real_estate_purchase', amountVEX: property.price, userId: interaction.user.id, meta: { command: 'realestate' } });
            
            const embed = ui.ok('Property purchased', 
                `**${property.name}**\n` +
                `Cost: ${ui.formatCurrency(property.price)}\n` +
                `Yield: ${(property.yield * 100).toFixed(1)}% weekly\n` +
                `Next income: 7 days`
            );
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            if (txId) await TransactionManager.rollback(txId);
            await interaction.editReply({ embeds: [ui.err('Purchase failed', error.message)] });
        }
    },

    async handleIncome(interaction) {
        const Economics = require('../../utils/economics');
        
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.realEstate || userData.realEstate.length === 0) {
            return interaction.editReply({ embeds: [ui.err('No properties', 'Purchase properties to earn income.')] });
        }
        
        const cooldownKey = `realestate_income:${interaction.user.id}`;
        const DailyCapsManager = require('../../utils/DailyCapsManager');
        const lastCollection = await DailyCapsManager.redis.get(cooldownKey);
        
        if (lastCollection) {
            const nextCollection = new Date(parseInt(lastCollection) + 7 * 24 * 60 * 60 * 1000);
            if (Date.now() < nextCollection.getTime()) {
                return interaction.editReply({ 
                    embeds: [ui.warn('Income not ready', `Next collection: <t:${Math.floor(nextCollection.getTime() / 1000)}:R>`)] 
                });
            }
        }
        
        let totalIncome = 0;
        for (const property of userData.realEstate) {
            const weeklyIncome = property.price * property.yield;
            totalIncome += weeklyIncome;
        }
        
        if (totalIncome > 0) {
            await user.addVEX(totalIncome, 'real_estate_income');
            await DailyCapsManager.redis.set(cooldownKey, Date.now().toString(), 7 * 24 * 60 * 60);
            
            Economics.apply({ event: 'real_estate_income', amountVEX: totalIncome, userId: interaction.user.id, meta: { command: 'realestate' } });
            
            const embed = ui.ok('Income collected', 
                `+${ui.formatCurrency(totalIncome)}\n` +
                `Properties: ${userData.realEstate.length}\n` +
                `Next collection: 7 days`
            );
            
            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.editReply({ embeds: [ui.err('No income', 'No properties generating income.')] });
        }
    },

    async handleSell(interaction) {
        const Economics = require('../../utils/economics');
        
        const propertyId = interaction.options.getString('id');
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.realEstate || userData.realEstate.length === 0) {
            return interaction.editReply({ embeds: [ui.err('No properties', 'You don\'t own any properties to sell.')] });
        }
        
        const propertyIndex = userData.realEstate.findIndex(p => p.id === propertyId);
        if (propertyIndex === -1) {
            return interaction.editReply({ embeds: [ui.err('Property not found', 'Invalid property ID.')] });
        }
        
        const property = userData.realEstate[propertyIndex];
        const marketCondition = Math.random();
        let saleMultiplier = marketCondition < 0.2 ? 1.1 : marketCondition < 0.8 ? 1.0 : 0.9;
        const salePrice = property.price * saleMultiplier;
        
        try {
            await user.addVEX(salePrice, 'real_estate_sale');
            userData.realEstate.splice(propertyIndex, 1);
            await user.save(userData);
            
            Economics.apply({ event: 'real_estate_sale', amountVEX: salePrice, userId: interaction.user.id, meta: { command: 'realestate' } });
            
            const profit = salePrice - property.price;
            const embed = ui.ok('Property sold', 
                `**${property.name}**\n` +
                `Sale price: ${ui.formatCurrency(salePrice)}\n` +
                `Profit: ${profit >= 0 ? '+' : ''}${ui.formatCurrency(Math.abs(profit))}\n` +
                `Remaining: ${userData.realEstate.length} properties`
            );
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await interaction.editReply({ embeds: [ui.err('Sale failed', error.message)] });
        }
    }
};
