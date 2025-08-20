const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get the VexiumVerse bot invite link and support server'),
    
    async execute(interaction) {
        const botId = interaction.client.user.id;
        const permissions = '274877906944';
        const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${botId}&permissions=${permissions}&scope=bot%20applications.commands`;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.ROCKET} Invite VexiumVerse to Your Server!`)
            .setDescription('Bring the ultimate Discord economy experience to your community!')
            .addFields(
                {
                    name: '🎯 What VexiumVerse Offers',
                    value: '• **USD-Pegged VEX Tokens** - Real value economy\n' +
                           '• **Advanced Banking** - Earn interest on deposits\n' +
                           '• **Investment Platform** - Crypto, stocks, bonds, real estate\n' +
                           '• **Gambling Games** - Slots, coinflip, dice with fair odds\n' +
                           '• **Social Features** - Profiles, gifts, leaderboards\n' +
                           '• **Premium Tiers** - Reduced taxes and exclusive perks',
                    inline: false
                },
                {
                    name: '🔧 Required Permissions',
                    value: '• Send Messages & Embeds\n• Use Slash Commands\n• Read Message History\n• Add Reactions',
                    inline: true
                },
                {
                    name: '📊 Bot Statistics',
                    value: `• **Servers**: ${interaction.client.guilds.cache.size}\n• **Users**: ${interaction.client.users.cache.size}\n• **Commands**: 64+`,
                    inline: true
                }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
            .setFooter({ text: 'VexiumVerse - Where Virtual Meets Reality' })
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
