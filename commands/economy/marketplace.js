const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('marketplace')
        .setDescription('Buy and sell items, services, and assets with other players')
        .addSubcommand(subcommand =>
            subcommand
                .setName('browse')
                .setDescription('Browse available items and services')
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('Category to browse')
                        .setRequired(false)
                        .addChoices(
                            { name: 'All Items', value: 'all' },
                            { name: 'Tools & Equipment', value: 'tools' },
                            { name: 'Consumables', value: 'consumables' },
                            { name: 'Services', value: 'services' },
                            { name: 'Rare Items', value: 'rare' })))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sell')
                .setDescription('List an item or service for sale')
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('Item to sell from your inventory')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('price')
                        .setDescription('Price in VEX tokens')
                        .setRequired(true)
                        .setMinValue(1))
                .addIntegerOption(option =>
                    option.setName('quantity')
                        .setDescription('Quantity to sell')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(100)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Purchase an item from the marketplace')
                .addStringOption(option =>
                    option.setName('listing_id')
                        .setDescription('ID of the listing to purchase')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('my-listings')
                .setDescription('View and manage your active listings'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('search')
                .setDescription('Search for specific items or services')
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('Search term')
                        .setRequired(true))),
    
    cooldown: 5,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'browse':
                return this.handleBrowse(interaction);
            case 'sell':
                return this.handleSell(interaction);
            case 'buy':
                return this.handleBuy(interaction);
            case 'my-listings':
                return this.handleMyListings(interaction);
            case 'search':
                return this.handleSearch(interaction);
        }
    },
    
    async handleBrowse(interaction) {
        const category = interaction.options.getString('category') || 'all';
        const listings = this.getMarketplaceListings(category);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.MARKETPLACE} VexiumVerse Marketplace`)
            .setDescription('Buy and sell items, services, and assets with the community!')
            .setColor(constants.COLORS.MARKETPLACE)
            .setFooter({ text: 'Use /marketplace buy <listing_id> to purchase items' })
            .setTimestamp();
        
        if (listings.length === 0) {
            embed.addFields({
                name: '📦 No Items Available',
                value: `No items found in the ${category} category.\n\nBe the first to list something for sale!`,
                inline: false
            });
        } else {
            embed.addFields({
                name: '📊 Market Overview',
                value: `**${listings.length}** items available\n**Category**: ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                inline: false
            });
            
            for (const listing of listings.slice(0, 8)) {
                const timeLeft = this.getTimeLeft(listing.expiresAt);
                embed.addFields({
                    name: `${listing.emoji} ${listing.name}`,
                    value: `**Price**: $${listing.price.toFixed(2)} VEX\n**Seller**: ${listing.sellerName}\n**ID**: ${listing.id}\n**Expires**: ${timeLeft}`,
                    inline: true
                });
            }
        }
        
        const categorySelect = new StringSelectMenuBuilder()
            .setCustomId('marketplace_category')
            .setPlaceholder('Select category to browse')
            .addOptions([
                { label: 'All Items', value: 'all', emoji: '📦' },
                { label: 'Tools & Equipment', value: 'tools', emoji: '🔧' },
                { label: 'Consumables', value: 'consumables', emoji: '🧪' },
                { label: 'Services', value: 'services', emoji: '⚙️' },
                { label: 'Rare Items', value: 'rare', emoji: '💎' }
            ]);
        
        const buyButton = new ButtonBuilder()
            .setCustomId('marketplace_buy_menu')
            .setLabel('Buy Item')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💰');
        
        const sellButton = new ButtonBuilder()
            .setCustomId('marketplace_sell_menu')
            .setLabel('Sell Item')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📤');
        
        const myListingsButton = new ButtonBuilder()
            .setCustomId('marketplace_my_listings')
            .setLabel('My Listings')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋');
        
        const row1 = new ActionRowBuilder().addComponents(categorySelect);
        const row2 = new ActionRowBuilder().addComponents(buyButton, sellButton, myListingsButton);
        
        await interaction.reply({ embeds: [embed], components: [row1, row2] });
    },
    
    async handleSell(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const itemName = interaction.options.getString('item');
        const price = interaction.options.getNumber('price');
        const quantity = interaction.options.getInteger('quantity') || 1;
        
        if (!userData.inventory || !userData.inventory[itemName]) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Item Not Found`)
                .setDescription(`You don't have **${itemName}** in your inventory.\n\nUse \`/wallet\` to check your inventory.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (userData.inventory[itemName] < quantity) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Quantity`)
                .setDescription(`You only have ${userData.inventory[itemName]} **${itemName}** but want to sell ${quantity}.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (price > constants.LIMITS.MAX_MARKETPLACE_PRICE) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Price Too High`)
                .setDescription(`Maximum listing price is $${constants.LIMITS.MAX_MARKETPLACE_PRICE.toFixed(2)} VEX.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const listingFee = price * 0.05; // 5% listing fee
        
        if (userData.vexBalance < listingFee) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds for Listing Fee`)
                .setDescription(`Listing fee (5%): $${listingFee.toFixed(2)} VEX\nYour balance: $${userData.vexBalance.toFixed(2)} VEX`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(listingFee, 'marketplace_listing_fee');
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Listing Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        userData.inventory[itemName] -= quantity;
        if (userData.inventory[itemName] <= 0) {
            delete userData.inventory[itemName];
        }
        
        const listingId = this.generateListingId();
        const listing = {
            id: listingId,
            itemName: itemName,
            price: price,
            quantity: quantity,
            sellerId: interaction.user.id,
            sellerName: interaction.user.displayName,
            listedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            status: 'active'
        };
        
        if (!global.marketplaceListings) global.marketplaceListings = [];
        global.marketplaceListings.push(listing);
        
        userData.stats.itemsListed = (userData.stats.itemsListed || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Item Listed Successfully!`)
            .setDescription(`**${itemName}** is now available in the marketplace!`)
            .addFields(
                { name: '📦 Item', value: itemName, inline: true },
                { name: '💰 Price', value: `$${price.toFixed(2)} VEX`, inline: true },
                { name: '🔢 Quantity', value: `${quantity}`, inline: true },
                { name: '🆔 Listing ID', value: listingId, inline: true },
                { name: '💸 Listing Fee', value: `$${listingFee.toFixed(2)} VEX`, inline: true },
                { name: '⏰ Expires', value: '<t:' + Math.floor(new Date(listing.expiresAt).getTime() / 1000) + ':R>', inline: true },
                { name: '📢 Share Listing', value: `Tell others to use:\n\`/marketplace buy ${listingId}\``, inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `Listing #${listingId} • 2% transaction fee applies to sales` })
            .setTimestamp();
        
        const viewButton = new ButtonBuilder()
            .setCustomId(`marketplace_view_${listingId}`)
            .setLabel('View Listing')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('👁️');
        
        const browseButton = new ButtonBuilder()
            .setCustomId('marketplace_browse')
            .setLabel('Browse Marketplace')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🛒');
        
        const row = new ActionRowBuilder().addComponents(viewButton, browseButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleBuy(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const listingId = interaction.options.getString('listing_id');
        
        if (!global.marketplaceListings) global.marketplaceListings = [];
        const listing = global.marketplaceListings.find(l => l.id === listingId && l.status === 'active');
        
        if (!listing) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Listing Not Found`)
                .setDescription(`No active listing found with ID: ${listingId}\n\nUse \`/marketplace browse\` to see available items.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (listing.sellerId === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Cannot Buy Own Item`)
                .setDescription('You cannot purchase your own listing.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (new Date() > new Date(listing.expiresAt)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Listing Expired`)
                .setDescription('This listing has expired and is no longer available.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const transactionFee = listing.price * constants.TAX_SYSTEM.TRADING.TRANSACTION_FEE;
        const totalCost = listing.price + transactionFee;
        
        if (userData.vexBalance < totalCost) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`Total cost: $${totalCost.toFixed(2)} VEX (including 2% fee)\nYour balance: $${userData.vexBalance.toFixed(2)} VEX`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const buyResult = await user.removeVEX(totalCost, 'marketplace_purchase');
        if (!buyResult.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Purchase Failed`)
                .setDescription(buyResult.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const seller = new User(listing.sellerId);
        await seller.addVEX(listing.price, 'marketplace_sale');
        
        await user.burnVEX(transactionFee, 'marketplace_transaction_fee');
        
        if (!userData.inventory) userData.inventory = {};
        userData.inventory[listing.itemName] = (userData.inventory[listing.itemName] || 0) + listing.quantity;
        
        listing.status = 'sold';
        listing.buyerId = interaction.user.id;
        listing.soldAt = new Date().toISOString();
        
        userData.stats.itemsPurchased = (userData.stats.itemsPurchased || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Purchase Successful!`)
            .setDescription(`You've successfully purchased **${listing.itemName}**!`)
            .addFields(
                { name: '📦 Item', value: listing.itemName, inline: true },
                { name: '🔢 Quantity', value: `${listing.quantity}`, inline: true },
                { name: '💰 Price', value: `$${listing.price.toFixed(2)} VEX`, inline: true },
                { name: '💸 Transaction Fee', value: `$${transactionFee.toFixed(2)} VEX`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '👤 Seller', value: listing.sellerName, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `Purchase #${listingId} • Item added to your inventory` })
            .setTimestamp();
        
        const inventoryButton = new ButtonBuilder()
            .setCustomId('wallet_inventory')
            .setLabel('View Inventory')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎒');
        
        const browseButton = new ButtonBuilder()
            .setCustomId('marketplace_browse')
            .setLabel('Browse More')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🛒');
        
        const row = new ActionRowBuilder().addComponents(inventoryButton, browseButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    getMarketplaceListings(category) {
        const allListings = [
            { id: 'MKT001', name: 'Energy Drink', price: 25, sellerName: 'PowerSeller', emoji: '⚡', category: 'consumables', expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'MKT002', name: 'Mining Pickaxe', price: 500, sellerName: 'ToolMaster', emoji: '⛏️', category: 'tools', expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'MKT003', name: 'Luck Potion', price: 100, sellerName: 'AlchemyPro', emoji: '🍀', category: 'consumables', expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() },
            { id: 'MKT004', name: 'Trading Bot Service', price: 1000, sellerName: 'BotExpert', emoji: '🤖', category: 'services', expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() }
        ];
        
        if (category === 'all') return allListings;
        return allListings.filter(listing => listing.category === category);
    },
    
    getTimeLeft(endTime) {
        const now = new Date();
        const end = new Date(endTime);
        const diff = end - now;
        
        if (diff <= 0) return 'Expired';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h`;
    },
    
    generateListingId() {
        return 'MKT' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    }
};
