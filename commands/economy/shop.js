const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Browse and purchase items, tools, and cosmetics')
        .addSubcommand(subcommand =>
            subcommand
                .setName('browse')
                .setDescription('Browse shop categories')
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('Shop category to browse')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Tools', value: 'tools' },
                            { name: 'Consumables', value: 'consumables' },
                            { name: 'Cosmetics', value: 'cosmetics' },
                            { name: 'NFTs', value: 'nft' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Purchase an item from the shop')
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('Item ID to purchase')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('quantity')
                        .setDescription('Quantity to purchase')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(10)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('inventory')
                .setDescription('View your inventory')),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'browse':
                return this.handleBrowse(interaction);
            case 'buy':
                return this.handleBuy(interaction);
            case 'inventory':
                return this.handleInventory(interaction);
        }
    },
    
    async handleBrowse(interaction) {
        const category = interaction.options.getString('category');
        
        if (!category) {
            return this.showCategories(interaction);
        }
        
        const items = constants.SHOP_ITEMS[category.toUpperCase()];
        if (!items) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Category Not Found`)
                .setDescription('Invalid shop category.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SHOP} ${category.charAt(0).toUpperCase() + category.slice(1)} Shop`)
            .setDescription(`Browse ${category} available for purchase`)
            .setColor(constants.COLORS.PRIMARY);
        
        for (const [itemId, item] of Object.entries(items)) {
            let fieldValue = `**Price**: $${item.price.toFixed(2)} VEX\n${item.description}`;
            
            if (item.effect) {
                fieldValue += `\n**Effect**: ${item.effect}`;
            }
            
            if (item.burnRate) {
                fieldValue += `\n**Burn Rate**: ${(item.burnRate * 100).toFixed(0)}%`;
            }
            
            if (item.supply) {
                fieldValue += `\n**Limited Supply**: ${item.supply} available`;
            }
            
            embed.addFields({
                name: `${item.name} (${itemId})`,
                value: fieldValue,
                inline: false
            });
        }
        
        embed.setFooter({ text: 'Use /shop buy <item_id> to purchase' });
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleBuy(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const itemId = interaction.options.getString('item');
        const quantity = interaction.options.getInteger('quantity') || 1;
        
        const item = this.findItem(itemId);
        if (!item) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Item Not Found`)
                .setDescription(`The item **${itemId}** doesn't exist in the shop.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const totalCost = item.price * quantity;
        
        if (totalCost > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`You need $${totalCost.toFixed(2)} VEX but only have $${userData.vexBalance.toFixed(2)}.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (item.supply && quantity > item.supply) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Supply`)
                .setDescription(`Only ${item.supply} ${item.name}(s) available.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(totalCost, 'shop_purchase', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Purchase Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const burnAmount = totalCost * (item.burnRate || constants.TAX_SYSTEM.PURCHASE.ITEM_BURN_RATE);
        await user.burnVEX(burnAmount, 'item_purchase');
        
        await user.addItem(itemId, quantity);
        
        if (item.supply) {
            item.supply -= quantity;
        }
        
        userData.stats.commandsUsed++;
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Purchase Successful!`)
            .setDescription(`You bought **${quantity}x ${item.name}**!`)
            .addFields(
                { name: '💰 Total Cost', value: `$${totalCost.toFixed(2)} VEX`, inline: true },
                { name: '🔥 Burned', value: `$${burnAmount.toFixed(2)} VEX`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        if (item.effect) {
            embed.addFields({
                name: '✨ Item Effect',
                value: item.description,
                inline: false
            });
        }
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleInventory(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.inventory || Object.keys(userData.inventory).length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.SHOP} Your Inventory`)
                .setDescription('Your inventory is empty. Visit `/shop browse` to purchase items!')
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SHOP} Your Inventory`)
            .setDescription('Items you own and can use')
            .setColor(constants.COLORS.PRIMARY);
        
        const categories = {
            tools: [],
            consumables: [],
            cosmetics: [],
            nft: []
        };
        
        for (const [itemId, quantity] of Object.entries(userData.inventory)) {
            const item = this.findItem(itemId);
            if (item) {
                const category = this.getItemCategory(itemId);
                if (category) {
                    categories[category].push(`**${item.name}**: ${quantity}x`);
                }
            }
        }
        
        for (const [category, items] of Object.entries(categories)) {
            if (items.length > 0) {
                embed.addFields({
                    name: category.charAt(0).toUpperCase() + category.slice(1),
                    value: items.join('\n'),
                    inline: true
                });
            }
        }
        
        embed.setFooter({ text: 'Use /use <item> to consume items' });
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async showCategories(interaction) {
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SHOP} VexiumVerse Shop`)
            .setDescription('Welcome to the VexiumVerse marketplace! Choose a category to browse.')
            .addFields(
                {
                    name: '🔧 Tools',
                    value: 'Permanent upgrades that improve your earning potential',
                    inline: true
                },
                {
                    name: '⚡ Consumables',
                    value: 'Temporary boosts and instant effects',
                    inline: true
                },
                {
                    name: '🎨 Cosmetics',
                    value: 'Profile customization and visual upgrades',
                    inline: true
                },
                {
                    name: '🖼️ NFTs',
                    value: 'Limited edition collectibles with special perks',
                    inline: true
                }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setFooter({ text: 'Use /shop browse <category> to view items' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    findItem(itemId) {
        for (const category of Object.values(constants.SHOP_ITEMS)) {
            if (category[itemId]) {
                return { id: itemId, ...category[itemId] };
            }
        }
        return null;
    },
    
    getItemCategory(itemId) {
        for (const [categoryName, items] of Object.entries(constants.SHOP_ITEMS)) {
            if (items[itemId]) {
                return categoryName.toLowerCase();
            }
        }
        return null;
    }
};
