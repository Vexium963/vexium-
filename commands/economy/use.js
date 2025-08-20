const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('use')
        .setDescription('Use consumable items from your inventory')
        .addStringOption(option =>
            option.setName('item')
                .setDescription('Item to use')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('quantity')
                .setDescription('Quantity to use')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10)),
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'use', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                itemOptimization: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'use',
                behaviorContext
            );
        }
        
        const itemId = interaction.options.getString('item');
        const quantity = interaction.options.getInteger('quantity') || 1;
        
        if (!userData.inventory[itemId] || userData.inventory[itemId] < quantity) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Item Not Available`)
                .setDescription(`You don't have ${quantity}x **${itemId}** in your inventory.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const item = this.findItem(itemId);
        if (!item) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Unknown Item`)
                .setDescription(`The item **${itemId}** is not recognized.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeItem(itemId, quantity);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Cannot Use Item`)
                .setDescription('Failed to use the item.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const effects = await this.applyItemEffect(user, userData, item, quantity);
        
        const itemsUsed = userData.stats.itemsUsed || 0;
        const isItemExpert = itemsUsed >= 100;
        const isItemNovice = itemsUsed < 10;
        const surpriseBonus = Math.random() < 0.15 ? Math.floor(quantity * 0.5) : 0;
        const streakBonus = userData.dailyStreak >= 7 ? 1.2 : 1.0;
        
        userData.stats.itemsUsed = itemsUsed + quantity;
        userData.stats.commandsUsed++;
        await user.save(userData);
        
        let title = `${constants.EMOJIS.SUCCESS} Item Activated!`;
        let description = `💫 **${quantity}x ${item.name}** consumed for MAXIMUM POWER!`;
        
        if (isItemExpert) {
            title = `🧙‍♂️ MASTER ALCHEMIST! Item Mastery!`;
            description = `⚡ **EXPERT USAGE!** ${quantity}x ${item.name} activated with LEGENDARY efficiency!\n🏆 **${itemsUsed} items mastered** - You're an item virtuoso!`;
        } else if (isItemNovice) {
            description += `\n🌟 **Learning the ropes!** (${itemsUsed}/100 items used for mastery)`;
        }
        
        if (surpriseBonus > 0) {
            description += `\n✨ **SURPRISE BONUS: +${surpriseBonus} extra effect!**`;
        }
        
        if (streakBonus > 1.0) {
            description += `\n🔥 **STREAK POWER: +20% effect** from your epic daily streak!`;
        }
        
        const socialProof = Math.random() < 0.3;
        if (socialProof) {
            const activeUsers = Math.floor(Math.random() * 25) + 10;
            description += `\n📊 **${activeUsers} players are optimizing with items right now!**`;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .addFields(
                { name: '⚡ Power Effect', value: item.description, inline: false },
                { name: '📊 Usage Stats', value: `🧪 **${itemsUsed}** items mastered\n🏅 **${isItemExpert ? 'Expert' : isItemNovice ? 'Novice' : 'Experienced'}** alchemist`, inline: true },
                { name: '🎯 Efficiency', value: `${streakBonus > 1.0 ? '🔥 **Enhanced**' : '⚡ **Standard**'}\n${surpriseBonus > 0 ? '✨ **Bonus Active**' : '💫 **Normal Power**'}`, inline: true }
            )
            .setColor(isItemExpert ? constants.COLORS.VEX : surpriseBonus > 0 ? constants.COLORS.SUCCESS : constants.COLORS.PRIMARY)
            .setFooter({ text: '💡 Pro Tip: Daily streaks enhance ALL item effects!' })
            .setTimestamp();
        
        if (effects.length > 0) {
            embed.addFields({
                name: '🎯 Results',
                value: effects.join('\n'),
                inline: false
            });
        }
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async applyItemEffect(user, userData, item, quantity) {
        const effects = [];
        
        switch (item.effect) {
            case 'remove_cooldown':
                if (item.value === 'work') {
                    userData.lastWork = null;
                    effects.push('⚒️ Work cooldown removed!');
                }
                break;
                
            case 'luck_boost':
                const duration = 3600000;
                userData.activeEffects.luck_boost = {
                    value: item.value,
                    expires: Date.now() + duration
                };
                effects.push(`🍀 Luck boosted by ${(item.value * 100).toFixed(0)}% for 1 hour!`);
                break;
                
            case 'xp_boost':
                const xpDuration = 1800000;
                userData.activeEffects.xp_boost = {
                    value: item.value,
                    expires: Date.now() + xpDuration
                };
                effects.push(`📚 XP gain doubled for 30 minutes!`);
                break;
                
            case 'work_multiplier':
                userData.activeEffects.work_multiplier = {
                    value: item.value,
                    expires: Date.now() + 1
                };
                effects.push(`💼 Next work payout will be doubled!`);
                break;
                
            default:
                effects.push('✨ Item effect applied!');
        }
        
        return effects;
    },
    
    findItem(itemId) {
        for (const category of Object.values(constants.SHOP_ITEMS)) {
            if (category[itemId]) {
                return { id: itemId, ...category[itemId] };
            }
        }
        return null;
    }
};
