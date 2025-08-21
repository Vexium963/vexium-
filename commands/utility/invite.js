const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription(`🚀 Transform your server into a wealth empire! Get VexiumVerse bot invite link and support server`),
    
    async execute(interaction) {
        const botId = interaction.client.user.id;
        const permissions = '274877906944';
        const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${botId}&permissions=${permissions}&scope=bot%20applications.commands`;
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 500) + 100);
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', '50') : null;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.ROCKET} EXPLOSIVE GROWTH OPPORTUNITY!`)
            .setDescription(`🔥 **Transform your server into a WEALTH EMPIRE!**\n\n${fomoMessage}\n${socialProofMessage}${variableReward ? `\n${variableReward}` : ''}\n\n✨ **FOMO Alert:** Only ${Math.floor(Math.random() * 50) + 20} server slots left for premium features!`)
            .addFields(
                {
                    name: '💎 EXCLUSIVE SERVER BENEFITS',
                    value: '• **USD-Pegged VEX Tokens** - Real value economy that EXPLODES growth!\n' +
                           '• **Advanced Banking** - Members earn 5% DAILY interest!\n' +
                           '• **Investment Platform** - Crypto, stocks, bonds, real estate EMPIRE!\n' +
                           '• **Entertainment Games** - Skill-based slots, coinflip, dice (21+ verified)\n' +
                           '• **Social Competition** - Leaderboards drive INSANE engagement!\n' +
                           '• **Premium Tiers** - VIP members get exclusive perks!',
                    inline: false
                },
                {
                    name: '⚡ INSTANT SETUP',
                    value: '• Send Messages & Embeds\n• Use Slash Commands\n• Read Message History\n• Add Reactions\n\n🚀 **Ready in 30 seconds!**',
                    inline: true
                },
                {
                    name: '🏆 PROVEN SUCCESS',
                    value: `• **${interaction.client.guilds.cache.size}** thriving servers\n• **${interaction.client.users.cache.size}** active wealth builders\n• **68+** addictive commands\n\n💰 **Average 300% engagement boost!**`,
                    inline: true
                }
            )
            .setColor(constants.COLORS.VEX)
            .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
            .setFooter({ text: '⏰ Limited time: First 1000 servers get premium features FREE!' })
            .setTimestamp();
        
        const inviteButton = new ButtonBuilder()
            .setLabel('🤖 Invite Bot')
            .setStyle(ButtonStyle.Link)
            .setURL(inviteUrl);
        
        const supportButton = new ButtonBuilder()
            .setLabel('💬 Support Server')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.gg/vexiumverse');
        
        const websiteButton = new ButtonBuilder()
            .setLabel('🌐 Website')
            .setStyle(ButtonStyle.Link)
            .setURL('https://vexiumverse.com');
        
        const row = new ActionRowBuilder().addComponents(inviteButton, supportButton, websiteButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
