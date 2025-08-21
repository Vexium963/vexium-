const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('auction')
        .setDescription(`🔥 Dominate the auction house! Bid on rare items and create auctions for VEX profits!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription(`📈 Browse live auctions and find incredible deals before others do!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription(`💸 List your items and watch bidding wars drive up your profits!`)
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription(`✨ Choose your most valuable item to auction`)
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('starting_bid')
                        .setDescription(`🪙 Set your starting price - higher prices attract serious bidders!`)
                        .setRequired(true)
                        .setMinValue(0.01))
                .addIntegerOption(option =>
                    option.setName('duration')
                        .setDescription(`⏳ Longer auctions = more exposure = higher final bids!`)
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(72)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('bid')
                .setDescription(`💥 Strike fast! Outbid competitors and claim rare items!`)
                .addStringOption(option =>
                    option.setName('auction_id')
                        .setDescription(`🎯 Enter the auction ID you want to dominate`)
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription(`💸 Your bid amount - go big to secure the win!`)
                        .setRequired(true)
                        .setMinValue(0.01)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('my_auctions')
                .setDescription(`👑 Track your auction empire and see your winning bids!`)),
    
    cooldown: 3,
    
    async execute(interaction) {
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now()
            };
            
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'auction',
                behaviorContext
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(
                interaction.user.id,
                'auction',
                true
            );
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'list':
                return this.handleList(interaction);
            case 'create':
                return this.handleCreate(interaction);
            case 'bid':
                return this.handleBid(interaction);
            case 'my_auctions':
                return this.handleMyAuctions(interaction);
        }
    },
    
    async handleList(interaction) {
        const auctions = this.getActiveAuctions();
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const hotAuctions = auctions.filter(a => a.bids.length >= 3);
        const endingSoon = auctions.filter(a => (a.endTime - Date.now()) < 3600000); // 1 hour
        const userParticipation = auctions.filter(a => a.bids.some(b => b.bidderId === interaction.user.id));
        
        if (auctions.length === 0) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 20);
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.AUCTION} 🔥 AUCTION HOUSE - EMPTY!`)
                .setDescription(`✨ **GOLDEN OPPORTUNITY!** No active auctions right now!\n🚀 **BE THE FIRST** to create one and do...`)
                .addFields({
                    name: '💡 Pro Tip',
                    value: '🎯 **First movers get the most attention!** Create an auction now and watch the bidding wars begin!',
                    inline: false
                })
                .setColor(constants.COLORS.VEX);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        let title = `${constants.EMOJIS.AUCTION} 🔥 AUCTION HOUSE - ${auctions.length} LIVE AUCTIONS!`;
        let description = `💰 **${auctions.length} auction${auctions.length > 1 ? 's' : ''} with MASSIVE potential!**`;
        
        if (hotAuctions.length > 0) {
            title = `🔥 BIDDING WARS IN PROGRESS! ${auctions.length} Live Auctions!`;
            description = `⚡ **${hotAuctions.length} HOT AUCTIONS** with multiple bidders!\n💎 **Competition is FIERCE!** Don't miss out!`;
        }
        
        if (endingSoon.length > 0) {
            description += `\n⏰ **URGENT: ${endingSoon.length} auction${endingSoon.length > 1 ? 's' : ''} ending within 1 hour!**`;
        }
        
        if (userParticipation.length > 0) {
            description += `\n🎯 **You're actively bidding on ${userParticipation.length} auction${userParticipation.length > 1 ? 's' : ''}!**`;
        }
        
        const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 100) + 50);
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        
        description += `\n\n${socialProof}`;
        if (variableReward) {
            description += `\n${variableReward}`;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`🔥 ${description}\n\n⏳ **Live bidding happening NOW!** Don't let others steal your deals!`)
            .setColor(hotAuctions.length > 0 ? constants.COLORS.VEX : constants.COLORS.PRIMARY);
        
        for (const auction of auctions.slice(0, 5)) {
            const timeLeft = auction.endTime - Date.now();
            const timeLeftStr = this.formatTimeLeft(timeLeft);
            
            embed.addFields({
                name: `${auction.item.name} (ID: ${auction.id})`,
                value: `**Current Bid**: $${auction.currentBid.toFixed(2)} VEX\n` +
                       `**Bidder**: ${auction.highestBidder || 'None'}\n` +
                       `**Time Left**: ${timeLeftStr}\n` +
                       `**Seller**: ${auction.seller}`,
                inline: true
            });
        }
        
        if (auctions.length > 5) {
            embed.setFooter({ text: `Showing 5 of ${auctions.length} auctions. Use pagination to see more.` });
        }
        
        const bidButton = new ButtonBuilder()
            .setCustomId(`auction_bid_${interaction.user.id}`)
            .setLabel('Place Bid')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💰');
        
        const createButton = new ButtonBuilder()
            .setCustomId(`auction_create_${interaction.user.id}`)
            .setLabel('Create Auction')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🏷️');
        
        const row = new ActionRowBuilder().addComponents(bidButton, createButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleCreate(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const itemId = interaction.options.getString('item');
        const startingBid = interaction.options.getNumber('starting_bid');
        const duration = interaction.options.getInteger('duration');
        
        if (!userData.inventory || !userData.inventory[itemId] || userData.inventory[itemId] < 1) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Item Not Found`)
                .setDescription(`${constants.ANIMATED_EMOJIS.EXPLOSION} You don't have any **${itemId}** in your inventory!\n\n${constants.ANIMATED_EMOJIS.SPARKLES} **Pro tip:** Use \`/shop\` to buy items you can auction for profit!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const item = this.findItem(itemId);
        if (!item) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Invalid Item`)
                .setDescription(`The item **${itemId}** is not valid for auction.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const listingFee = Math.max(startingBid * constants.AUCTION.LISTING_FEE_RATE, constants.AUCTION.MIN_LISTING_FEE);
        
        if (listingFee > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`You need $${listingFee.toFixed(2)} VEX for the listing fee but only have $${userData.vexBalance.toFixed(2)} VEX`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(listingFee, 'auction_listing_fee', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Listing Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        await user.burnVEX(listingFee, 'auction_fee');
        await user.removeItem(itemId, 1);
        
        const auctionId = this.generateAuctionId();
        const endTime = Date.now() + (duration * 60 * 60 * 1000);
        
        const auction = {
            id: auctionId,
            seller: interaction.user.username,
            sellerId: interaction.user.id,
            item: { id: itemId, ...item },
            startingBid,
            currentBid: startingBid,
            highestBidder: null,
            highestBidderId: null,
            endTime,
            bids: []
        };
        
        this.saveAuction(auction);
        
        userData.stats.auctionsCreated = (userData.stats.auctionsCreated || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Auction Duration: ${duration} hours`,
            0.1,
            constants.COLORS.SUCCESS
        );

        const embed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.CELEBRATION} Auction Created!`)
            .setDescription(`${constants.ANIMATED_EMOJIS.SPARKLES} Your auction for **${item.name}** is now live!`)
            .addFields(
                { name: '🆔 Auction ID', value: auctionId, inline: true },
                { name: '💰 Starting Bid', value: `$${startingBid.toFixed(2)} VEX`, inline: true },
                { name: '⏰ Duration', value: `${duration} hours`, inline: true },
                { name: '💸 Listing Fee', value: `$${listingFee.toFixed(2)} VEX`, inline: true },
                { name: '📅 End Time', value: `<t:${Math.floor(endTime / 1000)}:F>`, inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setImage('attachment://progress.png')
            .setFooter({ text: 'Good luck with your auction!' })
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleBid(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const auctionId = interaction.options.getString('auction_id');
        const bidAmount = interaction.options.getNumber('amount');
        
        const auction = this.getAuction(auctionId);
        if (!auction) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Auction Not Found`)
                .setDescription(`Auction **${auctionId}** doesn't exist or has ended.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (auction.sellerId === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Cannot Bid`)
                .setDescription('You cannot bid on your own auction.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (Date.now() >= auction.endTime) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Auction Ended`)
                .setDescription('This auction has already ended.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const minBid = auction.currentBid + constants.AUCTION.MIN_BID_INCREMENT;
        if (bidAmount < minBid) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Bid Too Low`)
                .setDescription(`Minimum bid is $${minBid.toFixed(2)} VEX.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (bidAmount > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`You need $${bidAmount.toFixed(2)} VEX but only have $${userData.vexBalance.toFixed(2)}.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (auction.highestBidderId) {
            const previousBidder = new User(auction.highestBidderId);
            await previousBidder.addVEX(auction.currentBid, 'auction_refund');
        }
        
        const result = await user.removeVEX(bidAmount, 'auction_bid', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Bid Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        auction.currentBid = bidAmount;
        auction.highestBidder = interaction.user.username;
        auction.highestBidderId = interaction.user.id;
        auction.bids.push({
            bidder: interaction.user.username,
            bidderId: interaction.user.id,
            amount: bidAmount,
            timestamp: Date.now()
        });
        
        this.saveAuction(auction);
        
        userData.stats.auctionBids = (userData.stats.auctionBids || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const timeLeft = auction.endTime - Date.now();
        const timeLeftStr = this.formatTimeLeft(timeLeft);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Bid Placed!`)
            .setDescription(`You're now the highest bidder on **${auction.item.name}**!`)
            .addFields(
                { name: '💰 Your Bid', value: `$${bidAmount.toFixed(2)} VEX`, inline: true },
                { name: '🏆 Status', value: 'Highest Bidder', inline: true },
                { name: '⏰ Time Left', value: timeLeftStr, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'You\'ll be refunded if someone outbids you.' })
            .setTimestamp();
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Auction Progress: ${auction.bids.length} bids`,
            Math.min(auction.bids.length / 10, 1.0),
            constants.COLORS.SUCCESS
        );

        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleMyAuctions(interaction) {
        const userAuctions = this.getUserAuctions(interaction.user.id);
        const userBids = this.getUserBids(interaction.user.id);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.AUCTION} Your Auctions & Bids`)
            .setDescription('Overview of your auction activity')
            .setColor(constants.COLORS.PRIMARY);
        
        if (userAuctions.length > 0) {
            const auctionList = userAuctions.slice(0, 3).map(auction => {
                const timeLeft = this.formatTimeLeft(auction.endTime - Date.now());
                return `**${auction.item.name}** - $${auction.currentBid.toFixed(2)} VEX (${timeLeft})`;
            }).join('\n');
            
            embed.addFields({
                name: `🏷️ Your Auctions (${userAuctions.length})`,
                value: auctionList,
                inline: false
            });
        }
        
        if (userBids.length > 0) {
            const bidList = userBids.slice(0, 3).map(auction => {
                const isWinning = auction.highestBidderId === interaction.user.id;
                const status = isWinning ? '🏆 Winning' : '❌ Outbid';
                return `**${auction.item.name}** - $${auction.currentBid.toFixed(2)} VEX ${status}`;
            }).join('\n');
            
            embed.addFields({
                name: `💰 Your Bids (${userBids.length})`,
                value: bidList,
                inline: false
            });
        }
        
        if (userAuctions.length === 0 && userBids.length === 0) {
            embed.setDescription('You haven\'t created any auctions or placed any bids yet. Use `/auction list` to get started!');
        }
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Your Auction Activity: ${userAuctions.length + userBids.length} total`,
            Math.min((userAuctions.length + userBids.length) / 20, 1.0),
            constants.COLORS.VEX
        );

        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    getActiveAuctions() {
        return [];
    },
    
    getAuction(auctionId) {
        return null;
    },
    
    getUserAuctions(userId) {
        return [];
    },
    
    getUserBids(userId) {
        return [];
    },
    
    saveAuction(auction) {
        console.log('Auction saved:', auction.id);
    },
    
    generateAuctionId() {
        return 'AUC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    },
    
    findItem(itemId) {
        for (const category of Object.values(constants.SHOP_ITEMS)) {
            if (category[itemId]) {
                return { id: itemId, ...category[itemId] };
            }
        }
        return null;
    },
    
    formatTimeLeft(milliseconds) {
        if (milliseconds <= 0) return 'Ended';
        
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }
};
