const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trade')
        .setDescription('Trade VEX tokens or items with other users')
        .addSubcommand(subcommand =>
            subcommand
                .setName('offer')
                .setDescription('Create a trade offer')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to trade with')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('vex_amount')
                        .setDescription('Amount of VEX to offer')
                        .setRequired(false)
                        .setMinValue(0.01))
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('Item to offer')
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('item_quantity')
                        .setDescription('Quantity of item to offer')
                        .setRequired(false)
                        .setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('request')
                .setDescription('Request specific items/VEX in return')
                .addNumberOption(option =>
                    option.setName('vex_amount')
                        .setDescription('Amount of VEX requested')
                        .setRequired(false)
                        .setMinValue(0.01))
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('Item requested')
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('item_quantity')
                        .setDescription('Quantity of item requested')
                        .setRequired(false)
                        .setMinValue(1))),
    
    cooldown: 10,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'trade', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now()
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'trade',
                behaviorContext
            );
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'offer':
                return this.handleOffer(interaction);
            case 'request':
                return this.handleRequest(interaction);
        }
    },
    
    async handleOffer(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const targetUser = interaction.options.getUser('user');
        const vexAmount = interaction.options.getNumber('vex_amount') || 0;
        const itemId = interaction.options.getString('item');
        const itemQuantity = interaction.options.getInteger('item_quantity') || 1;
        
        if (targetUser.id === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Invalid Trade`)
                .setDescription('You cannot trade with yourself!')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (targetUser.bot) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Invalid Trade`)
                .setDescription('You cannot trade with bots!')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (vexAmount === 0 && !itemId) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Empty Trade`)
                .setDescription('You must offer either VEX tokens or an item!')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (vexAmount > 0 && vexAmount > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient VEX`)
                .setDescription(`You only have $${userData.vexBalance.toFixed(2)} VEX.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (itemId && (!userData.inventory[itemId] || userData.inventory[itemId] < itemQuantity)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Items`)
                .setDescription(`You don't have ${itemQuantity}x **${itemId}**.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const tradeValue = vexAmount + (itemId ? this.getItemValue(itemId) * itemQuantity : 0);
        if (tradeValue > constants.LIMITS.MAX_TRADE) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Trade Value Too High`)
                .setDescription(`Maximum trade value is $${constants.LIMITS.MAX_TRADE.toFixed(2)} VEX.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const tradeId = this.generateTradeId();
        const tradeData = {
            id: tradeId,
            offerer: interaction.user.id,
            target: targetUser.id,
            offerVex: vexAmount,
            offerItem: itemId,
            offerItemQuantity: itemQuantity,
            requestVex: 0,
            requestItem: null,
            requestItemQuantity: 0,
            status: 'pending',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 300000).toISOString()
        };
        
        this.storeTrade(tradeData);
        
        let offerText = '';
        if (vexAmount > 0) {
            offerText += `💰 $${vexAmount.toFixed(2)} VEX`;
        }
        if (itemId) {
            if (offerText) offerText += '\n';
            offerText += `📦 ${itemQuantity}x ${itemId}`;
        }
        
        const totalTrades = userData.stats.tradesCompleted || 0;
        const isTradeExpert = totalTrades >= 50;
        const isTradeNovice = totalTrades < 5;
        const totalTradeValue = vexAmount + (itemId ? this.getItemValue(itemId) * itemQuantity : 0);
        const isHighValueTrade = totalTradeValue >= 1000;
        const urgencyBonus = Math.random() < 0.2 ? Math.floor(totalTradeValue * 0.05) : 0;
        
        let title = `${constants.EMOJIS.TRADE} Trade Offer Created!`;
        let description = `🤝 **Trade offer sent to ${targetUser.username}!**`;
        
        if (isHighValueTrade) {
            title = `💎 HIGH-VALUE TRADE INITIATED!`;
            description = `🔥 **MAJOR DEAL!** Trade offer sent to ${targetUser.username}!\n💰 **Value: $${totalTradeValue.toFixed(2)} VEX** - This is a big one!`;
        }
        
        if (isTradeExpert) {
            title = `🏆 TRADE MASTER IN ACTION!`;
            description += `\n👑 **${totalTrades} trades completed** - You're a trading legend!`;
        } else if (isTradeNovice) {
            description += `\n🌟 **Building your trading reputation!** (${totalTrades}/50 trades)`;
        }
        
        if (urgencyBonus > 0) {
            description += `\n✨ **TRADE BONUS ACTIVE: +$${urgencyBonus} VEX** if accepted within 2 minutes!`;
        }
        
        const socialProof = Math.random() < 0.3;
        if (socialProof) {
            const activeTraders = Math.floor(Math.random() * 15) + 5;
            description += `\n📈 **${activeTraders} players are trading right now!** Join the action!`;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .addFields(
                { name: '🎁 Your Epic Offer', value: offerText, inline: true },
                { name: '⏰ Expires Soon', value: '<t:' + Math.floor((Date.now() + 300000) / 1000) + ':R>', inline: true },
                { name: '🆔 Trade ID', value: `\`${tradeId}\``, inline: true },
                { name: '📊 Trade Stats', value: `🤝 **${totalTrades}** completed\n🏅 **${isTradeExpert ? 'Expert' : isTradeNovice ? 'Novice' : 'Experienced'}** trader`, inline: true },
                { name: '💎 Trade Value', value: `$${totalTradeValue.toFixed(2)} VEX`, inline: true },
                { name: '🎯 Success Tip', value: 'Fair trades build reputation!', inline: true }
            )
            .setColor(isHighValueTrade ? constants.COLORS.VEX : isTradeExpert ? constants.COLORS.SUCCESS : constants.COLORS.PRIMARY)
            .setFooter({ text: '⚡ Quick responses get better deals!' })
            .setTimestamp();
        
        const acceptButton = new ButtonBuilder()
            .setCustomId(`trade_accept_${tradeId}`)
            .setLabel('Accept Trade')
            .setStyle(ButtonStyle.Success);
        
        const declineButton = new ButtonBuilder()
            .setCustomId(`trade_decline_${tradeId}`)
            .setLabel('Decline Trade')
            .setStyle(ButtonStyle.Danger);
        
        const row = new ActionRowBuilder().addComponents(acceptButton, declineButton);
        
        await interaction.reply({ embeds: [embed] });
        
        const targetEmbed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.TRADE} Trade Offer Received`)
            .setDescription(`${interaction.user.username} wants to trade with you!`)
            .addFields(
                { name: '🎁 They Offer', value: offerText, inline: true },
                { name: '⏰ Expires', value: '<t:' + Math.floor((Date.now() + 300000) / 1000) + ':R>', inline: true }
            )
            .setColor(constants.COLORS.INFO)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();
        
        try {
            await targetUser.send({ embeds: [targetEmbed], components: [row] });
        } catch (error) {
            await interaction.followUp({ 
                content: `⚠️ Could not send DM to ${targetUser.username}. They need to accept the trade manually.`,
                ephemeral: true 
            });
        }
    },
    
    async handleRequest(interaction) {
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.INFO} Trade Requests`)
            .setDescription('This feature allows you to specify what you want in return for your trade offer.')
            .addFields(
                { name: '💡 How to Use', value: 'First create an offer with `/trade offer`, then use this command to specify what you want in return.', inline: false }
            )
            .setColor(constants.COLORS.INFO);
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
    
    generateTradeId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },
    
    storeTrade(tradeData) {
        
    },
    
    getItemValue(itemId) {
        for (const category of Object.values(constants.SHOP_ITEMS)) {
            if (category[itemId]) {
                return category[itemId].price;
            }
        }
        return 0;
    }
};
