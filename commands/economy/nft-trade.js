const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nft-trade')
        .setDescription(`🎨 Trade exclusive NFTs with other players - Build your digital empire!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription(`💸 List your NFT for trade - Turn art into profit!`)
                .addStringOption(option =>
                    option.setName('nft_id')
                        .setDescription(`✨ ID of the NFT to list for maximum profit`)
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('price')
                        .setDescription(`🔥 Set your price in VEX tokens - Aim high!`)
                        .setRequired(true)
                        .setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription(`🎉 Buy exclusive NFTs - Rare finds disappear fast!`)
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
                .setDescription(`🌈 Browse premium NFT marketplace - Discover hidden gems!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('offer')
                .setDescription(`🔥 Make competitive offers on NFTs - Negotiate like a pro!`)
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
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'nft-trade', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                nftTradingActivity: true,
                marketplaceEngagement: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'nft-trade',
                behaviorContext
            );
        }
        
        const totalNFTTrades = (userData.stats?.nftsPurchased || 0) + (userData.stats?.nftsSold || 0);
        const isNFTTrader = totalNFTTrades >= 10;
        const isNFTWhale = totalNFTTrades >= 50;
        const recentActivity = Date.now() - (userData.lastActive || Date.now()) < 1800000; // 30 minutes
        
        const surpriseBonus = Math.random() < 0.15 ? Math.floor(Math.random() * 50) + 10 : 0;
        if (surpriseBonus > 0) {
            await user.addVEX(surpriseBonus, 'nft_trading_bonus');
            Economics.apply({ event: 'buy', amountVEX: surpriseBonus, userId: interaction.user.id, meta: { command: 'nft-trade' } });
            userData.stats.surpriseBonuses = (userData.stats.surpriseBonuses || 0) + 1;
        }
        
        const activeTraders = Math.floor(Math.random() * 25) + 10;
        const recentSales = Math.floor(Math.random() * 8) + 3;
        
        const milestoneRewards = this.checkTradingMilestones(totalNFTTrades);
        if (milestoneRewards.length > 0) {
            for (const reward of milestoneRewards) {
                await user.addVEX(reward.amount, 'nft_milestone_reward');
                Economics.apply({ event: 'buy', amountVEX: reward.amount, userId: interaction.user.id, meta: { command: 'nft-trade' } });
                userData.achievements = userData.achievements || [];
                if (!userData.achievements.includes(reward.achievementId)) {
                    userData.achievements.push(reward.achievementId);
                }
            }
        }
        
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
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} No NFTs Found`)
                .setDescription(`✨ **${interaction.user.username}**, you don't own any NFTs yet!\n\n🎨 **Start your collection:** Use \`/nft-mint create\` to mint your first exclusive NFT!\n💎 **Pro tip:** Early minters often see 10x returns!\n\n${fomoMessage}\n\n🔥 **${Math.floor(Math.random() * 15) + 5} players** minted NFTs in the last hour!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const nft = userData.nfts.find(n => n.id === nftId);
        if (!nft) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} NFT Not Found`)
                .setDescription(`💥 **NFT #${nftId} not found!**\n\n📋 **Check your collection:** Use \`/nft-mint collection\` to view all your NFTs\n💡 **Tip:** Double-check the NFT ID for accuracy\n\n🎯 **${Math.floor(Math.random() * 8) + 3} traders** are actively listing NFTs right now!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (price > constants.LIMITS.MAX_NFT_PRICE) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Price Too High`)
                .setDescription(`Maximum NFT price is ${Economics.getPeggedVEXPrice(constants.LIMITS.MAX_NFT_PRICE_USD || 1000).toFixed(2)} VEX (~$${(constants.LIMITS.MAX_NFT_PRICE_USD || 1000).toFixed(2)}).`)
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
        
        const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 30) + 15);
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.NFT} NFT Listed for Trade!`)
            .setDescription(`${constants.ANIMATED_EMOJIS.CELEBRATION || '🎉'} **${nft.name}** is now live on the marketplace!\n\n🔥 **Hot listing:** Your NFT is featured prominently!\n📈 **Market activity:** ${Math.floor(Math.random() * 12) + 8} buyers are browsing right now\n\n${socialProof}${variableReward ? `\n${variableReward}` : ''}\n\n💎 **Pro tip:** Rare NFTs often sell within the first hour!`)
            .addFields(
                { name: '🏷️ NFT Name', value: nft.name, inline: true },
                { name: '✨ Rarity', value: `${rarityEmojis[nft.rarity]} ${nft.rarity.charAt(0).toUpperCase() + nft.rarity.slice(1)}`, inline: true },
                { name: '💰 Price', value: `${price.toFixed(2)} VEX (~$${(price * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '🆔 NFT ID', value: `#${nft.id}`, inline: true },
                { name: '📋 Listing ID', value: `#${listingId}`, inline: true },
                { name: '📈 Est. Value', value: `${nft.marketValue.toFixed(2)} VEX (~$${(nft.marketValue * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
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
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `NFT Listed: ${nft.name}`,
            1.0,
            this.getRarityColor(nft.rarity)
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
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
                .setDescription(`You need ${totalCost.toFixed(2)} VEX (~$${(totalCost * Economics.getCurrentVEXPrice()).toFixed(2)}) including 2% trading fee.\nYour balance: ${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})\n\n💡 **Tip:** Earn more VEX with /daily or /work!`)
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
        
        Economics.apply({ event: 'buy', amountVEX: totalCost, userId: interaction.user.id, meta: { command: 'nft-trade' } });
        await seller.addVEX(listing.price, 'nft_sale');
        Economics.apply({ event: 'buy', amountVEX: listing.price, userId: listing.sellerId, meta: { command: 'nft-trade' } });
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
        
        const milestoneMessage = (userData.stats.nftsPurchased || 0) >= 10 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 20) + 8);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} NFT Purchase Successful!`)
            .setDescription(`${constants.ANIMATED_EMOJIS.MONEY_RAIN || '💰'} **CONGRATULATIONS!** You've acquired **${nft.name}**!\n\n🎯 **Smart purchase:** This NFT could appreciate in value!\n📈 **Collection growth:** You're building an impressive portfolio!\n\n${socialProof}${milestoneMessage ? `\n${milestoneMessage}` : ''}\n\n🔥 **Market insight:** ${Math.floor(Math.random() * 6) + 3} similar NFTs sold today!`)
            .addFields(
                { name: '🏷️ NFT Name', value: nft.name, inline: true },
                { name: '✨ Rarity', value: nft.rarity.charAt(0).toUpperCase() + nft.rarity.slice(1), inline: true },
                { name: '🆔 NFT ID', value: `#${nft.id}`, inline: true },
                { name: '💰 Purchase Price', value: `${listing.price.toFixed(2)} VEX (~$${(listing.price * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '💸 Trading Fee', value: `${tradingFee.toFixed(2)} VEX (~$${(tradingFee * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '💼 New Balance', value: `${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
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
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `NFT Purchased: ${nft.name}`,
            1.0,
            constants.COLORS.SUCCESS
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleBrowse(interaction) {
        if (!global.nftListings) global.nftListings = [];
        const activeListings = global.nftListings.filter(l => l.status === 'active');
        
        if (activeListings.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.NFT} NFT Marketplace`)
                .setDescription(`${constants.ANIMATED_EMOJIS.SPARKLES || '✨'} **Empty marketplace = HUGE opportunity!**\n\n🚀 **Be...`)
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
        
        const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 40) + 20);
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.NFT} NFT Marketplace`)
            .setDescription(`${constants.ANIMATED_EMOJIS.FIRE || '🔥'} **${activeListings.length} EXCLUSIVE NFTs** available f...`)
            .setColor(constants.COLORS.PRIMARY)
            .setFooter({ text: 'Use /nft-trade buy <listing_id> to purchase' });
        
        for (const listing of sortedListings.slice(0, 5)) {
            const seller = new User(listing.sellerId);
            const sellerData = await seller.load();
            const nft = sellerData.nfts?.find(n => n.id === listing.nftId);
            
            if (nft) {
                const rarityEmoji = this.getRarityEmoji(nft.rarity);
                embed.addFields({
                    name: `${rarityEmoji} ${nft.name} - ${listing.price.toFixed(2)} VEX (~$${(listing.price * Economics.getCurrentVEXPrice()).toFixed(2)})`,
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
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `NFT Marketplace: ${activeListings.length} listings`,
            Math.min(activeListings.length / 20, 1.0),
            constants.COLORS.VEX
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
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
