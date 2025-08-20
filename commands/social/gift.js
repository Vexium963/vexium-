const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gift')
        .setDescription('Send VEX tokens or items to other users')
        .addSubcommand(subcommand =>
            subcommand
                .setName('send')
                .setDescription('Send a gift to another user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to send gift to')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('vex_amount')
                        .setDescription('Amount of VEX to send')
                        .setRequired(false)
                        .setMinValue(0.01))
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('Item to send')
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('item_quantity')
                        .setDescription('Quantity of item to send')
                        .setRequired(false)
                        .setMinValue(1))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Optional message with your gift')
                        .setRequired(false)
                        .setMaxLength(200)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('random')
                .setDescription('Send an anonymous gift to a random active user')
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription('Amount of VEX to send anonymously')
                        .setRequired(true)
                        .setMinValue(1.00)
                        .setMaxValue(100.00))),
    
    cooldown: 60,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'send':
                return this.handleSend(interaction);
            case 'random':
                return this.handleRandom(interaction);
        }
    },
    
    async handleSend(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const targetUser = interaction.options.getUser('user');
        const vexAmount = interaction.options.getNumber('vex_amount') || 0;
        const itemId = interaction.options.getString('item');
        const itemQuantity = interaction.options.getInteger('item_quantity') || 1;
        const message = interaction.options.getString('message') || '';
        
        if (targetUser.id === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Invalid Gift`)
                .setDescription('You cannot send gifts to yourself!')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (targetUser.bot) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Invalid Gift`)
                .setDescription('You cannot send gifts to bots!')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (vexAmount === 0 && !itemId) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Empty Gift`)
                .setDescription('You must send either VEX tokens or an item!')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (vexAmount > constants.LIMITS.MAX_GIFT) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Gift Too Large`)
                .setDescription(`Maximum gift amount is $${constants.LIMITS.MAX_GIFT.toFixed(2)} VEX.`)
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
        
        const targetUserData = new User(targetUser.id);
        const targetData = await targetUserData.load();
        
        let giftTax = 0;
        if (vexAmount > 0) {
            giftTax = Math.max(0, vexAmount * 0.02);
            
            const result = await user.removeVEX(vexAmount + giftTax, 'gift_sent', false);
            if (!result.success) {
                const embed = new EmbedBuilder()
                    .setTitle(`${constants.EMOJIS.ERROR} Gift Failed`)
                    .setDescription(result.reason)
                    .setColor(constants.COLORS.ERROR);
                
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            await targetUserData.addVEX(vexAmount, 'gift_received');
            
            if (giftTax > 0) {
                await user.burnVEX(giftTax, 'gift_tax');
            }
        }
        
        if (itemId) {
            const removeResult = await user.removeItem(itemId, itemQuantity);
            if (!removeResult.success) {
                const embed = new EmbedBuilder()
                    .setTitle(`${constants.EMOJIS.ERROR} Gift Failed`)
                    .setDescription('Failed to send item.')
                    .setColor(constants.COLORS.ERROR);
                
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            await targetUserData.addItem(itemId, itemQuantity);
        }
        
        userData.stats.giftsSent++;
        targetData.stats.giftsReceived++;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        await targetUserData.save(targetData);
        
        let giftDescription = '';
        if (vexAmount > 0) {
            giftDescription += `💰 $${vexAmount.toFixed(2)} VEX`;
        }
        if (itemId) {
            if (giftDescription) giftDescription += '\n';
            giftDescription += `📦 ${itemQuantity}x ${itemId}`;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.GIFT} Gift Sent!`)
            .setDescription(`Your gift has been sent to ${targetUser.username}!`)
            .addFields(
                { name: '🎁 Gift Contents', value: giftDescription, inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        if (giftTax > 0) {
            embed.addFields({
                name: '💸 Gift Tax',
                value: `$${giftTax.toFixed(2)} VEX (2%)`,
                inline: true
            });
        }
        
        if (message) {
            embed.addFields({
                name: '💌 Your Message',
                value: message,
                inline: false
            });
        }
        
        await interaction.reply({ embeds: [embed] });
        
        const giftEmbed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.GIFT} You Received a Gift!`)
            .setDescription(`${interaction.user.username} sent you a gift!`)
            .addFields(
                { name: '🎁 Gift Contents', value: giftDescription, inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();
        
        if (message) {
            giftEmbed.addFields({
                name: '💌 Message',
                value: message,
                inline: false
            });
        }
        
        try {
            await targetUser.send({ embeds: [giftEmbed] });
        } catch (error) {
            await interaction.followUp({
                content: `⚠️ Could not send DM to ${targetUser.username}, but they received the gift!`,
                ephemeral: true
            });
        }
    },
    
    async handleRandom(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const amount = interaction.options.getNumber('amount');
        
        if (amount > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient VEX`)
                .setDescription(`You only have $${userData.vexBalance.toFixed(2)} VEX.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const allUsers = await User.getLeaderboard('networth', 100);
        const eligibleUsers = allUsers.filter(u => 
            u.userId !== interaction.user.id && 
            u.stats.commandsUsed > 5 &&
            new Date(u.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        
        if (eligibleUsers.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} No Eligible Users`)
                .setDescription('No active users found for random gifting.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const randomUser = eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)];
        const targetUserData = new User(randomUser.userId);
        
        const result = await user.removeVEX(amount, 'random_gift_sent', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Gift Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        await targetUserData.addVEX(amount, 'random_gift_received');
        
        userData.stats.giftsSent++;
        userData.stats.commandsUsed++;
        
        const targetData = await targetUserData.load();
        targetData.stats.giftsReceived++;
        
        await user.save(userData);
        await targetUserData.save(targetData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.GIFT} Random Gift Sent!`)
            .setDescription(`You anonymously sent **$${amount.toFixed(2)} VEX** to a random active user!`)
            .addFields(
                { name: '🎯 Impact', value: 'Your kindness helps build the VexiumVerse community!', inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        
        try {
            const targetUser = await interaction.client.users.fetch(randomUser.userId);
            const anonymousEmbed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.GIFT} Anonymous Gift Received!`)
                .setDescription(`Someone in the VexiumVerse community sent you **$${amount.toFixed(2)} VEX**!`)
                .addFields(
                    { name: '💝 Message', value: 'A kind soul wanted to brighten your day!', inline: false }
                )
                .setColor(constants.COLORS.SUCCESS)
                .setTimestamp();
            
            await targetUser.send({ embeds: [anonymousEmbed] });
        } catch (error) {
            console.log('Could not send anonymous gift notification');
        }
    }
};
