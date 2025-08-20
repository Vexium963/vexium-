const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const CanvasRenderer = require('../../utils/canvasRenderer');

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
        const user = new User(interaction.user.id);
        const userData = await user.load();
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

        const dailyDeals = this.getDailyDeals(Object.entries(items).map(([id, item]) => ({ id, ...item })));
        const featuredItems = this.getFeaturedItems(Object.entries(items).map(([id, item]) => ({ id, ...item })), userData);
        const limitedOffers = this.getLimitedTimeOffers(Object.entries(items).map(([id, item]) => ({ id, ...item })));
        
        const embed = this.createPsychologicalShopEmbed(items, category, userData, dailyDeals, featuredItems, limitedOffers);
        const components = this.createAdvancedShopComponents(items, category, interaction.user.id, userData);
        
        try {
            const canvasRenderer = new CanvasRenderer();
            const progressBuffer = await canvasRenderer.createProgressCard(
                `🛍️ Shopping Spree Progress`,
                Math.min(userData.stats.itemsPurchased || 0, 50) / 50,
                constants.COLORS.VEX
            );
            const attachment = new AttachmentBuilder(progressBuffer, { name: 'shop-progress.png' });
            
            await interaction.reply({ embeds: [embed], components, files: [attachment] });
        } catch (error) {
            console.warn('Canvas rendering failed, using fallback:', error);
            await interaction.reply({ embeds: [embed], components });
        }
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
            .setFooter({ text: 'Select a category below to browse items' })
            .setTimestamp();

        const categorySelect = new StringSelectMenuBuilder()
            .setCustomId('shop_category_select')
            .setPlaceholder('🛍️ Choose a shop category')
            .addOptions([
                {
                    label: 'Tools',
                    description: 'Permanent upgrades and equipment',
                    value: 'tools',
                    emoji: '🔧'
                },
                {
                    label: 'Consumables',
                    description: 'Temporary boosts and effects',
                    value: 'consumables',
                    emoji: '⚡'
                },
                {
                    label: 'Cosmetics',
                    description: 'Profile customization items',
                    value: 'cosmetics',
                    emoji: '🎨'
                },
                {
                    label: 'NFTs',
                    description: 'Limited edition collectibles',
                    value: 'nft',
                    emoji: '🖼️'
                }
            ]);

        const quickActionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('shop_inventory')
                    .setLabel('My Inventory')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📦'),
                new ButtonBuilder()
                    .setCustomId('shop_featured')
                    .setLabel('Featured Items')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⭐'),
                new ButtonBuilder()
                    .setCustomId('shop_deals')
                    .setLabel('Daily Deals')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('💰')
            );

        const selectRow = new ActionRowBuilder().addComponents(categorySelect);
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [selectRow, quickActionButtons] 
        });
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
    },

    createPsychologicalShopEmbed(items, category, userData, dailyDeals, featuredItems, limitedOffers) {
        const itemEntries = Object.entries(items);
        const itemsPerPage = 5;
        const totalPages = Math.ceil(itemEntries.length / itemsPerPage);
        const currentPage = 1;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const pageItems = itemEntries.slice(startIndex, startIndex + itemsPerPage);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SHOP} VexiumVerse Marketplace - ${category.charAt(0).toUpperCase() + category.slice(1)}`)
            .setDescription(`💰 **Your Balance:** $${userData.vexBalance.toFixed(2)} VEX\n🔥 **Limited Time Offers Active!** Don't miss out!`)
            .setColor(constants.COLORS.VEX)
            .setTimestamp();

        if (limitedOffers.length > 0) {
            const timeLeft = this.getTimeUntilMidnight();
            embed.addFields({
                name: '⏰ FLASH SALE - ENDS IN ' + timeLeft,
                value: limitedOffers.map(item => `🔥 **${item.name}** - ~~$${item.originalPrice}~~ **$${item.price.toFixed(2)} VEX** (${item.discount}% OFF!)`).join('\n'),
                inline: false
            });
        }

        if (featuredItems.length > 0) {
            embed.addFields({
                name: '⭐ RECOMMENDED FOR YOU',
                value: featuredItems.map(item => `${this.getCategoryEmoji(category)} **${item.name}** - $${item.price.toFixed(2)} VEX\n*${item.personalizedReason}*`).join('\n\n'),
                inline: false
            });
        }

        let itemsText = '';
        pageItems.forEach(([itemId, item], index) => {
            const globalIndex = startIndex + index + 1;
            const affordableEmoji = userData.vexBalance >= item.price ? '✅' : '❌';
            const popularityEmoji = this.getPopularityIndicator(item);
            
            itemsText += `**${globalIndex}.** ${this.getCategoryEmoji(category)} **${item.name}** ${popularityEmoji}\n`;
            itemsText += `💰 $${item.price.toFixed(2)} VEX ${affordableEmoji}\n`;
            itemsText += `📝 *${item.description}*\n`;
            
            if (item.effect === 'work_boost') {
                itemsText += `🚀 **+${(item.value * 100).toFixed(0)}% earnings boost!**\n`;
            }
            
            itemsText += '\n';
        });

        embed.addFields({
            name: `🛍️ Available Items (Page ${currentPage}/${totalPages})`,
            value: itemsText || 'No items available',
            inline: false
        });

        const purchaseStats = userData.stats.itemsPurchased || 0;
        const nextMilestone = this.getNextPurchaseMilestone(purchaseStats);
        
        embed.addFields({
            name: '📊 Your Shopping Progress',
            value: `🛒 Items Purchased: **${purchaseStats}**\n🎯 Next Milestone: **${nextMilestone.count}** items (${nextMilestone.reward})\n💎 VIP Status: ${userData.premiumTier ? '👑 Active' : '❌ Inactive'}`,
            inline: false
        });

        embed.setFooter({ 
            text: `💡 Tip: VIP members get exclusive discounts! | Items refresh daily at midnight` 
        });

        return embed;
    },

    createAdvancedShopComponents(items, category, userId, userData) {
        const components = [];
        const itemEntries = Object.entries(items);
        
        if (itemEntries.length > 0) {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`shop_select_${userId}`)
                .setPlaceholder('🛍️ Choose an item to purchase (Quick Buy)')
                .setMaxValues(1);
            
            const pageItems = itemEntries.slice(0, 5);
            
            pageItems.forEach(([itemId, item]) => {
                const affordableEmoji = userData.vexBalance >= item.price ? '✅' : '❌';
                const urgencyText = this.isLimitedOffer(item) ? ' ⏰ LIMITED!' : '';
                
                selectMenu.addOptions({
                    label: `${item.name} - $${item.price.toFixed(2)} VEX ${affordableEmoji}${urgencyText}`,
                    description: `${item.description.substring(0, 80)}...`,
                    value: itemId,
                    emoji: this.getCategoryEmoji(category)
                });
            });
            
            components.push(new ActionRowBuilder().addComponents(selectMenu));
        }
        
        const quickActionsRow = new ActionRowBuilder();
        quickActionsRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`shop_cart_${userId}`)
                .setLabel('Shopping Cart')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🛒'),
            new ButtonBuilder()
                .setCustomId(`shop_wishlist_${userId}`)
                .setLabel('Wishlist')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⭐'),
            new ButtonBuilder()
                .setCustomId(`shop_compare_${userId}`)
                .setLabel('Compare Items')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⚖️')
        );
        
        components.push(quickActionsRow);
        
        const specialOffersRow = new ActionRowBuilder();
        specialOffersRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`shop_flash_${userId}`)
                .setLabel('⚡ Flash Deals')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔥'),
            new ButtonBuilder()
                .setCustomId(`shop_bundle_${userId}`)
                .setLabel('💎 Bundles')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📦'),
            new ButtonBuilder()
                .setCustomId(`shop_vip_${userId}`)
                .setLabel('👑 VIP Exclusive')
                .setStyle(ButtonStyle.Premium)
                .setEmoji('⭐')
        );
        
        components.push(specialOffersRow);
        
        return components;
    },

    getDailyDeals(items) {
        const today = new Date().getDate();
        const dealCount = 3;
        const shuffled = items.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, dealCount).map(item => ({
            ...item,
            originalPrice: item.price,
            price: item.price * 0.8,
            discount: 20
        }));
    },

    getFeaturedItems(items, userData) {
        const recommendations = [];
        
        if (userData.level < 10) {
            const beginnerItems = items.filter(item => item.price < 50);
            if (beginnerItems.length > 0) {
                recommendations.push({
                    ...beginnerItems[0],
                    personalizedReason: "Perfect for new players like you!"
                });
            }
        }
        
        if (userData.stats.gamesPlayed > 20) {
            const gamingItems = items.filter(item => item.effect === 'luck_boost');
            if (gamingItems.length > 0) {
                recommendations.push({
                    ...gamingItems[0],
                    personalizedReason: "Boost your gaming success rate!"
                });
            }
        }
        
        if (userData.vexBalance > 100) {
            const premiumItems = items.filter(item => item.category === 'cosmetics');
            if (premiumItems.length > 0) {
                recommendations.push({
                    ...premiumItems[0],
                    personalizedReason: "Show off your wealth with style!"
                });
            }
        }
        
        return recommendations.slice(0, 2);
    },

    getLimitedTimeOffers(items) {
        const hour = new Date().getHours();
        if (hour >= 18 && hour <= 23) {
            return items.slice(0, 2).map(item => ({
                ...item,
                originalPrice: item.price,
                price: item.price * 0.75,
                discount: 25
            }));
        }
        return [];
    },

    getTimeUntilMidnight() {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    },

    getPopularityIndicator(item) {
        const popularity = Math.random();
        if (popularity > 0.8) return '🔥 HOT';
        if (popularity > 0.6) return '📈 TRENDING';
        if (popularity > 0.4) return '⭐ POPULAR';
        return '';
    },

    getNextPurchaseMilestone(currentPurchases) {
        const milestones = [
            { count: 5, reward: 'Bronze Shopper Badge' },
            { count: 15, reward: 'Silver Shopper Badge + 5% discount' },
            { count: 30, reward: 'Gold Shopper Badge + 10% discount' },
            { count: 50, reward: 'Diamond Shopper Badge + 15% discount' },
            { count: 100, reward: 'Legendary Shopper Status + VIP perks' }
        ];
        
        return milestones.find(m => m.count > currentPurchases) || { count: '∞', reward: 'Maximum level reached!' };
    },

    isLimitedOffer(item) {
        const hour = new Date().getHours();
        return (hour >= 18 && hour <= 23);
    },

    getCategoryEmoji(category) {
        const emojis = {
            tools: '🔧',
            consumables: '🧪',
            cosmetics: '✨',
            nft: '🖼️'
        };
        return emojis[category] || '📦';
    }
};
