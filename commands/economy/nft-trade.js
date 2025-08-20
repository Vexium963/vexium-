const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nft-trade')
        .setDescription('Trade NFTs with other players')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List your NFT for trade')
                .addStringOption(option =>
                    option.setName('nft_id')
                        .setDescription('ID of the NFT to list')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('price')
                        .setDescription('Price in VEX tokens')
                        .setRequired(true)
                        .setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Buy an NFT from the marketplace')
                .addStringOption(option =>
                    option.setName('listing_id')
                        .setDescription('ID of the listing to purchase')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription('Cancel your NFT listing')
                .addStringOption(option =>
                    option.setName('listing_id')
                        .setDescription('ID of the listing to cancel')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('browse')
                .setDescription('Browse available NFTs for sale'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('offer')
                .setDescription('Make an offer on an NFT')
                .addStringOption(option =>
                    option.setName('nft_id')
                        .setDescription('ID of the NFT to make an offer on')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('offer_amount')
                        .setDescription('Your offer in VEX tokens')
                        .setRequired(true)
                        .setMinValue(1))),
    
    cooldown: 5,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'list':
                return this.handleList(interaction);
            case 'buy':
                return this.handleBuy(interaction);
            case 'cancel':
                return this.handleCancel(interaction);
            case 'browse':
                return this.handleBrowse(interaction);
            case 'offer':
                return this.handleOffer(interaction);
        }
    },
    
    async handleList(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const nftId = interaction.options.getString('nft_id');
        const price = interaction.options.getNumber('price');
        
        if (!userData.nfts || userData.nfts.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} No NFTs Found`)
                .setDescription('You don\'t own any NFTs to trade.\n\nUse `/nft-mint create` to mint your first NFT!')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const nft = userData.nfts.find(n => n.id === nftId);
        if (!nft) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} NFT Not Found`)
                .setDescription(`You don't own an NFT with ID #${nftId}.\n\nUse \`/nft-mint collection\` to view your NFTs.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (price > constants.LIMITS.MAX_NFT_PRICE) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Price Too High`)
                .setDescription(`Maximum NFT price is $${constants.LIMITS.MAX_NFT_PRICE.toFixed(2)} VEX.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const listingId = this.generateListingId();
        const listing = {
            id: listingId,
            nftId: nft.id,
            sellerId: interaction.user.id,
            sellerName: interaction.user.displayName,
            price: price,
            listedAt: new Date().toISOString(),
            status: 'active'
        };
        
        if (!global.nftListings) global.nftListings = [];
        global.nftListings.push(listing);
        
        nft.status = 'listed';
        nft.listingId = listingId;
        
        userData.stats.nftsListed = (userData.stats.nftsListed || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const rarityEmojis = {
            common: '⚪',
            rare: '🔵',
            epic: '🟣',
            legendary: '🟡'
        };
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.NFT} NFT Listed for Trade!`)
            .setDescription(`**${nft.name}** is now available for purchase`)
            .addFields(
                { name: '🏷️ NFT Name', value: nft.name, inline: true },
                { name: '✨ Rarity', value: `${rarityEmojis[nft.rarity]} ${nft.rarity.charAt(0).toUpperCase() + nft.rarity.slice(1)}`, inline: true },
                { name: '💰 Price', value: `$${price.toFixed(2)} VEX`, inline: true },
                { name: '🆔 NFT ID', value: `#${nft.id}`, inline: true },
                { name: '📋 Listing ID', value: `#${listingId}`, inline: true },
                { name: '📈 Est. Value', value: `$${nft.marketValue.toFixed(2)} VEX`, inline: true },
                { name: '📝 Description', value: nft.description, inline: false },
                { name: '🎨 Traits', value: this.formatTraits(nft.traits), inline: false }
            )
            .setColor(this.getRarityColor(nft.rarity))
            .setFooter({ text: `Listing #${listingId} • 2% trading fee applies` })
            .setTimestamp();
        
        const cancelButton = new ButtonBuilder()
            .setCustomId(`nft_cancel_${listingId}`)
            .setLabel('Cancel Listing')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌');
        
        const viewButton = new ButtonBuilder()
            .setCustomId(`nft_view_marketplace`)
            .setLabel('View Marketplace')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🛒');
        
        const row = new ActionRowBuilder().addComponents(cancelButton, viewButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleBuy(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const listingId = interaction.options.getString('listing_id');
        
        if (!global.nftListings) global.nftListings = [];
        const listing = global.nftListings.find(l => l.id === listingId && l.status === 'active');
        
        if (!listing) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Listing Not Found`)
                .setDescription(`No active listing found with ID #${listingId}.\n\nUse \`/nft-trade browse\` to see available NFTs.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (listing.sellerId === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Cannot Buy Own NFT`)
                .setDescription('You cannot purchase your own NFT listing.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const tradingFee = listing.price * constants.TAX_SYSTEM.TRADING.TRANSACTION_FEE;
        const totalCost = listing.price + tradingFee;
        
        if (userData.vexBalance < totalCost) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`You need $${totalCost.toFixed(2)} VEX (including 2% trading fee).\nYour balance: $${userData.vexBalance.toFixed(2)} VEX`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const seller = new User(listing.sellerId);
        const sellerData = await seller.load();
        
        const nft = sellerData.nfts.find(n => n.id === listing.nftId);
        if (!nft) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} NFT No Longer Available`)
                .setDescription('This NFT is no longer available for purchase.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const buyResult = await user.removeVEX(totalCost, 'nft_purchase');
        if (!buyResult.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Purchase Failed`)
                .setDescription(buyResult.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        await seller.addVEX(listing.price, 'nft_sale');
        await user.burnVEX(tradingFee, 'nft_trading_fee');
        
        sellerData.nfts = sellerData.nfts.filter(n => n.id !== listing.nftId);
        if (!userData.nfts) userData.nfts = [];
        
        nft.status = 'owned';
        nft.listingId = null;
        nft.previousOwner = listing.sellerId;
        nft.purchasedAt = new Date().toISOString();
        nft.purchasePrice = listing.price;
        
        userData.nfts.push(nft);
        
        userData.stats.nftsPurchased = (userData.stats.nftsPurchased || 0) + 1;
        sellerData.stats.nftsSold = (sellerData.stats.nftsSold || 0) + 1;
        userData.stats.commandsUsed++;
        
        listing.status = 'sold';
        listing.buyerId = interaction.user.id;
        listing.soldAt = new Date().toISOString();
        
        await user.save(userData);
        await seller.save(sellerData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} NFT Purchase Successful!`)
            .setDescription(`You've successfully purchased **${nft.name}**!`)
            .addFields(
                { name: '🏷️ NFT Name', value: nft.name, inline: true },
                { name: '✨ Rarity', value: nft.rarity.charAt(0).toUpperCase() + nft.rarity.slice(1), inline: true },
                { name: '🆔 NFT ID', value: `#${nft.id}`, inline: true },
                { name: '💰 Purchase Price', value: `$${listing.price.toFixed(2)} VEX`, inline: true },
                { name: '💸 Trading Fee', value: `$${tradingFee.toFixed(2)} VEX`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '👤 Previous Owner', value: listing.sellerName, inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `NFT #${nft.id} • Now in your collection` })
            .setTimestamp();
        
        const viewButton = new ButtonBuilder()
            .setCustomId(`nft_view_${nft.id}`)
            .setLabel('View NFT')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔍');
        
        const collectionButton = new ButtonBuilder()
            .setCustomId('nft_my_collection')
            .setLabel('My Collection')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋');
        
        const row = new ActionRowBuilder().addComponents(viewButton, collectionButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleBrowse(interaction) {
        if (!global.nftListings) global.nftListings = [];
        const activeListings = global.nftListings.filter(l => l.status === 'active');
        
        if (activeListings.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.NFT} NFT Marketplace`)
                .setDescription('No NFTs are currently listed for sale.\n\nBe the first to list your NFT!')
                .addFields(
                    { name: '💡 How to List', value: 'Use `/nft-trade list` to put your NFT up for sale', inline: false },
                    { name: '🎨 Need NFTs?', value: 'Use `/nft-mint create` to mint new NFTs', inline: false }
                )
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const sortedListings = activeListings
            .sort((a, b) => new Date(b.listedAt) - new Date(a.listedAt))
            .slice(0, 10);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.NFT} NFT Marketplace`)
            .setDescription(`**${activeListings.length}** NFTs available for purchase`)
            .setColor(constants.COLORS.PRIMARY)
            .setFooter({ text: 'Use /nft-trade buy <listing_id> to purchase' });
        
        for (const listing of sortedListings.slice(0, 5)) {
            const seller = new User(listing.sellerId);
            const sellerData = await seller.load();
            const nft = sellerData.nfts?.find(n => n.id === listing.nftId);
            
            if (nft) {
                const rarityEmoji = this.getRarityEmoji(nft.rarity);
                embed.addFields({
                    name: `${rarityEmoji} ${nft.name} - $${listing.price.toFixed(2)} VEX`,
                    value: `**ID**: #${listing.id}\n**Rarity**: ${nft.rarity}\n**Seller**: ${listing.sellerName}`,
                    inline: true
                });
            }
        }
        
        const buyButton = new ButtonBuilder()
            .setCustomId('nft_buy_prompt')
            .setLabel('Buy NFT')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💰');
        
        const refreshButton = new ButtonBuilder()
            .setCustomId('nft_refresh_marketplace')
            .setLabel('Refresh')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔄');
        
        const row = new ActionRowBuilder().addComponents(buyButton, refreshButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    generateListingId() {
        return Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    },
    
    formatTraits(traits) {
        return Object.entries(traits)
            .map(([key, value]) => `**${key}**: ${value}`)
            .join('\n');
    },
    
    getRarityColor(rarity) {
        const colors = {
            common: '#FFFFFF',
            rare: '#0099FF',
            epic: '#9933FF',
            legendary: '#FFD700'
        };
        return colors[rarity] || constants.COLORS.PRIMARY;
    },
    
    getRarityEmoji(rarity) {
        const emojis = {
            common: '⚪',
            rare: '🔵',
            epic: '🟣',
            legendary: '🟡'
        };
        return emojis[rarity] || '⚪';
    }
};
