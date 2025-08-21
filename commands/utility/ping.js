const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription(`⏳ Check bot latency and system status - See how fast VexiumVerse responds!`),
    
    async execute(interaction) {
        const sent = await interaction.reply({ 
            content: `⏳ Pinging...`, 
            fetchReply: true 
        });
        
        const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);
        
        let statusColor = constants.COLORS.SUCCESS;
        let statusText = 'Excellent';
        
        if (botLatency > 200 || apiLatency > 200) {
            statusColor = constants.COLORS.WARNING;
            statusText = 'Good';
        }
        
        if (botLatency > 500 || apiLatency > 500) {
            statusColor = constants.COLORS.ERROR;
            statusText = 'Poor';
        }
        
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 100) + 25);
        const variableReward = Math.random() < 0.15 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 2 + 0.5).toFixed(2)) : null;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} VexiumVerse Status - PEAK PERFORMANCE!`)
            .setDescription(`🚀 **Bot performance and connection status**\n\n${socialProofMessage}${variableReward ? `\n${variableReward}` : ''}\n\n🔥 **${Math.floor(Math.random() * 50) + 200} players** are actively earning VEX right now!`)
            .addFields(
                { name: '🤖 Bot Latency', value: `${botLatency}ms`, inline: true },
                { name: '🌐 API Latency', value: `${apiLatency}ms`, inline: true },
                { name: '📊 Status', value: statusText, inline: true },
                { name: '⏰ Uptime', value: this.formatUptime(interaction.client.uptime), inline: true },
                { name: '🏛️ Servers', value: interaction.client.guilds.cache.size.toString(), inline: true },
                { name: '👥 Users', value: interaction.client.users.cache.size.toString(), inline: true }
            )
            .setColor(statusColor)
            .setFooter({ text: 'VexiumVerse - Always Online, Always Earning!' })
            .setTimestamp();
        
        await interaction.editReply({ content: null, embeds: [embed] });
    },
    
    formatUptime(uptime) {
        const seconds = Math.floor(uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else {
            return `${minutes}m ${seconds % 60}s`;
        }
    }
};
