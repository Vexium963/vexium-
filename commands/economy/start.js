const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Begin your VexiumVerse journey and create your VEX wallet'),
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (userData.stats.commandsUsed > 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.VEX} Welcome Back to VexiumVerse!`)
                .setDescription(`You already have an account with **$${userData.vexBalance.toFixed(2)} VEX**`)
                .addFields(
                    { name: '💰 VEX Balance', value: `$${userData.vexBalance.toFixed(2)}`, inline: true },
                    { name: '🏦 Bank Balance', value: `$${userData.bankBalance.toFixed(2)}`, inline: true },
                    { name: '📊 Net Worth', value: `$${userData.networth.toFixed(2)}`, inline: true },
                    { name: '🎯 Level', value: userData.level.toString(), inline: true },
                    { name: '🔥 Daily Streak', value: userData.dailyStreak.toString(), inline: true },
                    { name: '⚒️ Job', value: userData.job || 'None', inline: true }
                )
                .setColor(constants.COLORS.VEX)
                .setFooter({ text: 'Use /help to see all available commands' })
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed] });
        }
        
        userData.stats.commandsUsed++;
        await user.save(userData);
        
        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.ROCKET} Welcome to VexiumVerse!`)
            .setDescription(`**The Ultimate Discord Economy with Real USD-Pegged VEX Tokens**\n\n` +
                `You've been given **$${constants.VEX_TOKEN.STARTING_BALANCE.toFixed(2)} VEX** to start your journey!\n\n` +
                `${constants.EMOJIS.VEX} **VEX Token**: 1 VEX = $1 USD (pegged)\n` +
                `${constants.EMOJIS.MONEY} **Earn Real Value**: Work, invest, trade, and play skill-based entertainment games\n` +
                `${constants.EMOJIS.BANK} **Banking System**: Deposit for interest and security\n` +
                `${constants.EMOJIS.CHART} **Investments**: Crypto, stocks, bonds, real estate\n` +
                `${constants.EMOJIS.TROPHY} **Achievements**: Unlock rewards and bonuses\n` +
                `${constants.EMOJIS.PREMIUM} **Premium Tiers**: Reduce taxes and unlock perks`)
            .addFields(
                { 
                    name: '🚀 Quick Start Commands', 
                    value: '`/daily` - Claim daily VEX\n`/work` - Choose a job and earn\n`/wallet` - Check your balance\n`/shop` - Buy items and upgrades', 
                    inline: false 
                },
                { 
                    name: '💡 Pro Tips', 
                    value: '• Bank your VEX to earn interest\n• Invest for long-term growth\n• Complete achievements for bonuses\n• Upgrade to Premium for tax benefits', 
                    inline: false 
                }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: 'VexiumVerse - Where Virtual Meets Reality' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [welcomeEmbed] });
        
        setTimeout(async () => {
            const helpEmbed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.INFO} Getting Started Guide`)
                .setDescription('Here are the essential commands to begin earning VEX:')
                .addFields(
                    { name: '💰 Economy', value: '`/daily` `/work` `/invest` `/entertainment`', inline: true },
                    { name: '🏦 Banking', value: '`/deposit` `/withdraw` `/bank`', inline: true },
                    { name: '👥 Social', value: '`/profile` `/gift` `/leaderboard`', inline: true },
                    { name: '🛍️ Shopping', value: '`/shop` `/use` `/trade`', inline: true },
                    { name: '🎯 Progress', value: '`/progression` `/achievements`', inline: true },
                    { name: '🔗 Wallet', value: '`/linkwallet` `/history`', inline: true }
                )
                .setColor(constants.COLORS.INFO)
                .setFooter({ text: 'Use /help for a complete command list' });
            
            await interaction.followUp({ embeds: [helpEmbed], ephemeral: true });
        }, 2000);
    },
};
