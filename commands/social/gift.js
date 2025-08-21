const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gift')
        .setDescription(`🎁 Spread joy and build community! Send VEX tokens or items to friends and earn karma rewards!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('send')
                .setDescription(`✨ Send a thoughtful gift to a friend - generosity is always rewarded in VexiumVerse!`)
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
                .setDescription(`💓 Spread anonymous kindness! Send VEX to a random player and earn community karma!`)
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription('Amount of VEX to send anonymously')
                        .setRequired(true)
                        .setMinValue(1.00)
                        .setMaxValue(100.00))),
    
    cooldown: 60,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'gift', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                socialEngagement: true,
                generosity: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'gift',
                behaviorContext
            );
        }
        
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
        
        const totalGifts = userData.stats.giftsSent || 0;
        const isGenerous = totalGifts >= 10;
        const isGiftMaster = totalGifts >= 50;
        const recentGifts = userData.stats.giftsToday || 0;
        
        const targetUser = interaction.options.getUser('user');
        const vexAmount = interaction.options.getNumber('vex_amount') || 0;
        const itemId = interaction.options.getString('item');
        const itemQuantity = interaction.options.getInteger('item_quantity') || 1;
        const message = interaction.options.getString('message') || '';
        
        if (targetUser.id === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Invalid Gift`)
                .setDescription(`🤔 Nice try, but self-gifting isn't allowed! Share the love with other VexiumVerse players instead!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (targetUser.bot) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Invalid Gift`)
                .setDescription(`🤖 Bots don't need gifts! Save your VEX for real players who'll appreciate your generosity!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (vexAmount === 0 && !itemId) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Empty Gift`)
                .setDescription(`😕 Empty gifts aren't very thoughtful! Add some VEX or an item to spread the joy!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (vexAmount > constants.LIMITS.MAX_GIFT) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Gift Too Large`)
                .setDescription(`💸 Whoa there, big spender! Maximum gift is $${constants.LIMITS.MAX_GIFT.toFixed(2)} VEX. Save so...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (vexAmount > 0 && vexAmount > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient VEX`)
                .setDescription(`💳 Your heart is bigger than your wallet! You only have $${userData.vexBalance.toFixed(2)} VEX. E...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (itemId && (!userData.inventory[itemId] || userData.inventory[itemId] < itemQuantity)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Items`)
                .setDescription(`🔍 You don't have ${itemQuantity}x **${itemId}** in your inventory! Check /shop to buy more items!`)
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
        userData.stats.giftsToday = (userData.stats.giftsToday || 0) + 1;
        targetData.stats.giftsReceived++;
        userData.stats.commandsUsed++;
        
        const surpriseBonus = Math.random() < 0.1 ? Math.floor(vexAmount * 0.2) : 0;
        if (surpriseBonus > 0) {
            await user.addVEX(surpriseBonus, 'generosity_bonus');
        }
        
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
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 20);
        const variableReward = surpriseBonus > 0 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', surpriseBonus.toFixed(2)) : null;
        
        let title = `${constants.EMOJIS.GIFT} Gift Sent!`;
        let description = `Your gift has been sent to ${targetUser.username}!`;
        
        if (isGiftMaster) {
            title = `👑 GIFT MASTER! Legendary Generosity!`;
            description = `🎉 **GIFT MASTER STATUS!** You've sent ${totalGifts} gifts and spread LEGENDARY generosity!\n💎 Your gift to ${targetUser.username} shows true VexiumVerse spirit!`;
        } else if (isGenerous) {
            title = `🌟 GENEROUS SOUL! Gift Champion!`;
            description = `⭐ **GENEROUS CHAMPION!** ${totalGifts} gifts sent - you're building an amazing community!\n🎁 Your gift to ${targetUser.username} makes VexiumVerse better!`;
        }
        
        if (surpriseBonus > 0) {
            description += `\n${variableReward}`;
        }
        
        description += `\n\n${socialProofMessage}`;
        
        if (Math.random() < 0.3) {
            description += `\n${fomoMessage}`;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .addFields(
                { name: '🎁 Gift Contents', value: giftDescription, inline: false }
            )
            .setColor(isGiftMaster ? constants.COLORS.VEX : isGenerous ? constants.COLORS.GOLD : constants.COLORS.SUCCESS)
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
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const giftProgress = Math.min(userData.stats.giftsSent / 50, 1);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Gifts Sent: ${userData.stats.giftsSent}`,
            giftProgress,
            constants.COLORS.SUCCESS
        );

        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
        
        const giftEmbed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.GIFT} You Received a Gift!`)
            .setDescription(`🎉 ${interaction.user.username} sent you a thoughtful gift! The VexiumVerse community is amazing!`)
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
                .setDescription(`${constants.ANIMATED_EMOJIS.EMPTY_WALLET} Your generous spirit exceeds your balance! You only hav...`)
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
                .setDescription(`${constants.ANIMATED_EMOJIS.LONELY} No active players found for random gifting! Try again when mo...`)
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
        
        const milestoneMessage = constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 30) + 15);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const communityProgress = Math.min(userData.stats.giftsSent / 25, 1);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Community Impact: ${userData.stats.giftsSent} gifts sent`,
            communityProgress,
            constants.COLORS.SUCCESS
        );

        const embed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.CELEBRATION} Random Gift Sent!`)
            .setDescription(`You anonymously sent **$${amount.toFixed(2)} VEX** to a random active user!\n\n${milestoneMessage...`)
            .addFields(
                { name: '🎯 Impact', value: 'Your kindness helps build the VexiumVerse community!', inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setImage('attachment://progress.png')
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
        
        try {
            const targetUser = await interaction.client.users.fetch(randomUser.userId);
            const anonymousEmbed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.GIFT} Anonymous Gift Received!`)
                .setDescription(`${constants.ANIMATED_EMOJIS.MYSTERY} Someone in the VexiumVerse community sent you **$${amount.to...`)
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
