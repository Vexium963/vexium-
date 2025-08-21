const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('marketplace')
        .setDescription(`💸 Trade with players worldwide! Buy low, sell high, build your empire!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('browse')
                .setDescription(`✨ Discover amazing deals and rare items from the community!`)
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
                .setDescription(`🔥 Turn your items into VEX! List now and start earning!`)
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
                .setDescription(`🎉 Grab that perfect item before someone else does!`)
                .addStringOption(option =>
                    option.setName('listing_id')
                        .setDescription('ID of the listing to purchase')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('my-listings')
                .setDescription(`📈 Track your sales empire and optimize your profits!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('search')
                .setDescription(`⏳ Find exactly what you need with lightning-fast search!`)
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('Search term')
                        .setRequired(true))),
    
    cooldown: 5,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: (userData.stats.lastMarketplaceUse && (Date.now() - userData.stats.lastMarketplaceUse) < 300000),
                quickReturn: (userData.stats.lastMarketplaceUse && (Date.now() - userData.stats.lastMarketplaceUse) < 60000),
                timeSinceLastUse: userData.stats.lastMarketplaceUse || 0,
                marketplaceExpertise: (userData.stats.itemsPurchased || 0) + (userData.stats.itemsListed || 0),
                tradingStreak: userData.stats.tradingStreak || 0
            };
            
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'marketplace',
                behaviorContext
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(
                interaction.user.id,
                'marketplace',
                true
            );
        }
        
        userData.stats.lastMarketplaceUse = Date.now();
        userData.stats.marketplaceVisits = (userData.stats.marketplaceVisits || 0) + 1;
        
        const surpriseBonus = Math.random() < 0.1 ? Math.floor(Math.random() * 50) + 10 : 0;
        if (surpriseBonus > 0) {
            await user.addVEX(surpriseBonus, 'marketplace_surprise_bonus');
            
            const bonusEmbed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.GIFT} SURPRISE MARKETPLACE BONUS!`)
                .setDescription(`🎉 **Lucky you!** You found a hidden marketplace bonus!\n💸 **+${surpriseBonus} VEX** added to your wallet!`)
                .setColor(constants.COLORS.VEX)
                .setFooter({ text: '✨ Random bonuses reward active traders!' });
            
            await interaction.followUp({ embeds: [bonusEmbed], ephemeral: true });
        }
        
        const totalTransactions = (userData.stats.itemsPurchased || 0) + (userData.stats.itemsListed || 0);
        if (totalTransactions === 10 || totalTransactions === 50 || totalTransactions === 100) {
            const achievementEmbed = new EmbedBuilder()
                .setTitle(`🏆 TRADING MILESTONE ACHIEVED!`)
                .setDescription(`🏆 **${totalTransactions} Total Transactions!**\n✨ You're becoming a marketplace legend!\n\n🔥 Le...`)
                .addFields({
                    name: '🎁 Milestone Reward',
                    value: `${totalTransactions * 2} VEX bonus!`,
                    inline: true
                })
                .setColor(constants.COLORS.GOLD);
            
            await user.addVEX(totalTransactions * 2, 'marketplace_milestone');
            await interaction.followUp({ embeds: [achievementEmbed] });
        }
        
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
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const category = interaction.options.getString('category') || 'all';
        const listings = this.getMarketplaceListings(category);
        
        const totalTransactions = userData.stats.itemsPurchased || 0;
        const isActiveTrader = totalTransactions >= 10;
        const marketActivity = Math.floor(Math.random() * 50) + 20; // Simulate market activity
        const hotDeals = listings.filter(l => Math.random() > 0.7);
        const flashSale = Math.random() > 0.8;
        
        let title = `${constants.EMOJIS.MARKETPLACE} VexiumVerse Marketplace`;
        let description = '🛒 **Buy and sell with the community!**';
        
        if (flashSale) {
            title = `🔥 FLASH SALE ACTIVE! Marketplace`;
            description = '⚡ **LIMITED TIME DEALS!** Prices won\'t last long!';
        }
        
        if (isActiveTrader) {
            title = `💎 VIP TRADER ACCESS - Marketplace`;
            description = '👑 **Welcome back, trading legend!** Exclusive deals await!';
        }
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', marketActivity);
        const variableReward = Math.random() < 0.15 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description + `\n\n${socialProofMessage}\n🔥 **${hotDeals.length} hot deals**${variableReward ? `\n${variableReward}` : ''}\n\n⏳ ${fomoMessage}`)
            .setColor(flashSale ? constants.COLORS.VEX : isActiveTrader ? constants.COLORS.SUCCESS : constants.COLORS.MARKETPLACE)
            .setFooter({ text: `💡 Pro tip: ${isActiveTrader ? 'You get priority on rare items!' : 'Buy low, sell high!'}` })
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
                    value: `**Price**: ${listing.price.toFixed(2)} VEX\n**Seller**: ${listing.sellerName}\n**ID**: ${listing.id}\n**Expires**: ${timeLeft}`,
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
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const marketActivityBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Market Activity: ${marketActivity} active traders`,
            Math.min(marketActivity / 100, 1.0),
            constants.COLORS.SUCCESS
        );

        await interaction.reply({ 
            embeds: [embed], 
            components: [row1, row2],
            files: [{ attachment: marketActivityBuffer, name: 'market-activity.png' }]
        });
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
                .setDescription(`⏳ You don't have **${itemName}** in your inventory.\n\n✨ Use \`/wallet\` to check your inventory and find items to sell!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (userData.inventory[itemName] < quantity) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Quantity`)
                .setDescription(`${constants.ANIMATED_EMOJIS.LOADING} You only have ${userData.inventory[itemName]} **${itemName}*...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (price > constants.LIMITS.MAX_MARKETPLACE_PRICE) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Price Too High`)
                .setDescription(`Maximum listing price is ${constants.LIMITS.MAX_MARKETPLACE_PRICE.toFixed(2)} VEX.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const listingFee = price * 0.05; // 5% listing fee
        
        if (userData.vexBalance < listingFee) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds for Listing Fee`)
                .setDescription(`Listing fee (5%): ${listingFee.toFixed(2)} VEX\nYour balance: ${userData.vexBalance.toFixed(2)} VEX\n\n💡 **Tip:** Earn more VEX with /daily or /work!`)
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
        
        const milestoneMessage = (userData.stats.itemsListed || 0) >= 10 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 30) + 15);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Item Listed Successfully!`)
            .setDescription(`**${itemName}** is now available in the marketplace!${milestoneMessage ? `\n\n${milestoneMessage}` : ''}\n\n${socialProofMessage}`)
            .addFields(
                { name: '📦 Item', value: itemName, inline: true },
                { name: '💰 Price', value: `${price.toFixed(2)} VEX`, inline: true },
                { name: '🔢 Quantity', value: `${quantity}`, inline: true },
                { name: '🆔 Listing ID', value: listingId, inline: true },
                { name: '💸 Listing Fee', value: `${listingFee.toFixed(2)} VEX`, inline: true },
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
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const listingProgressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Listing Success: ${itemName} now live!`,
            1.0,
            constants.COLORS.SUCCESS
        );

        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: listingProgressBuffer, name: 'listing-success.png' }]
        });
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
                .setDescription(`Total cost: ${totalCost.toFixed(2)} VEX (including 2% fee)\nYour balance: ${userData.vexBalance.toFixed(2)} VEX\n\n💡 **Tip:** Earn more VEX with /daily or /work!`)
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
        
        const milestoneMessage = (userData.stats.itemsPurchased || 0) >= 5 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 5 + 2).toFixed(2)) : null;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Purchase Successful!`)
            .setDescription(`You've successfully purchased **${listing.itemName}**!${milestoneMessage ? `\n\n${milestoneMessage}` : ''}${variableReward ? `\n${variableReward}` : ''}`)
            .addFields(
                { name: '📦 Item', value: listing.itemName, inline: true },
                { name: '🔢 Quantity', value: `${listing.quantity}`, inline: true },
                { name: '💰 Price', value: `${listing.price.toFixed(2)} VEX`, inline: true },
                { name: '💸 Transaction Fee', value: `${transactionFee.toFixed(2)} VEX`, inline: true },
                { name: '💼 New Balance', value: `${userData.vexBalance.toFixed(2)} VEX`, inline: true },
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
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const purchaseProgressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Purchase Complete: ${listing.itemName} acquired!`,
            1.0,
            constants.COLORS.VEX
        );

        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: purchaseProgressBuffer, name: 'purchase-success.png' }]
        });
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
