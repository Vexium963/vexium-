const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Report bugs, issues, or submit feedback about VexiumVerse')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of report')
                .setRequired(true)
                .addChoices(
                    { name: 'Bug Report', value: 'bug' },
                    { name: 'Feature Request', value: 'feature' },
                    { name: 'User Report', value: 'user' },
                    { name: 'General Feedback', value: 'feedback' }
                )),
    
    async execute(interaction) {
        const reportType = interaction.options.getString('type');
        
        const modal = new ModalBuilder()
            .setCustomId(`report_${reportType}_${interaction.user.id}`)
            .setTitle(`${this.getReportTitle(reportType)}`);
        
        const titleInput = new TextInputBuilder()
            .setCustomId('report_title')
            .setLabel('Title')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Brief description of your report')
            .setRequired(true)
            .setMaxLength(100);
        
        const descriptionInput = new TextInputBuilder()
            .setCustomId('report_description')
            .setLabel('Detailed Description')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(this.getPlaceholder(reportType))
            .setRequired(true)
            .setMaxLength(1000);
        
        const stepsInput = new TextInputBuilder()
            .setCustomId('report_steps')
            .setLabel(reportType === 'bug' ? 'Steps to Reproduce' : 'Additional Information')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(reportType === 'bug' ? 
                '1. First step\n2. Second step\n3. Bug occurs' : 
                'Any additional context or information')
            .setRequired(false)
            .setMaxLength(500);
        
        const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
        const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(stepsInput);
        
        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
        
        await interaction.showModal(modal);
    },
    
    getReportTitle(type) {
        const titles = {
            bug: '🐛 Bug Report',
            feature: '💡 Feature Request',
            user: '⚠️ User Report',
            feedback: '📝 General Feedback'
        };
        return titles[type] || 'Report';
    },
    
    getPlaceholder(type) {
        const placeholders = {
            bug: 'Describe the bug in detail. What happened? What did you expect to happen?',
            feature: 'Describe the feature you\'d like to see. How would it improve VexiumVerse?',
            user: 'Describe the user\'s behavior and why you\'re reporting them.',
            feedback: 'Share your thoughts, suggestions, or general feedback about VexiumVerse.'
        };
        return placeholders[type] || 'Provide details about your report';
    },
    
    async handleModalSubmit(interaction) {
        const [, reportType, userId] = interaction.customId.split('_');
        
        if (userId !== interaction.user.id) {
            return interaction.reply({ 
                content: 'This report form is not for you.', 
                ephemeral: true 
            });
        }
        
        const title = interaction.fields.getTextInputValue('report_title');
        const description = interaction.fields.getTextInputValue('report_description');
        const steps = interaction.fields.getTextInputValue('report_steps') || 'None provided';
        
        const reportId = this.generateReportId();
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Report Submitted`)
            .setDescription(`Your ${this.getReportTitle(reportType).toLowerCase()} has been submitted successfully!`)
            .addFields(
                { name: '🆔 Report ID', value: reportId, inline: true },
                { name: '📋 Title', value: title, inline: false },
                { name: '📝 Status', value: 'Under Review', inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Thank you for helping improve VexiumVerse!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
        
        await this.logReport(interaction, reportType, reportId, title, description, steps);
    },
    
    async logReport(interaction, type, reportId, title, description, steps) {
        const logEmbed = new EmbedBuilder()
            .setTitle(`${this.getReportTitle(type)} - ${reportId}`)
            .setDescription(`**Title:** ${title}`)
            .addFields(
                { name: '👤 Reporter', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: '🏛️ Server', value: interaction.guild ? `${interaction.guild.name} (${interaction.guild.id})` : 'DM', inline: true },
                { name: '📅 Submitted', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: '📝 Description', value: description, inline: false }
            )
            .setColor(this.getReportColor(type))
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();
        
        if (steps !== 'None provided') {
            logEmbed.addFields({
                name: type === 'bug' ? '🔄 Steps to Reproduce' : '📋 Additional Info',
                value: steps,
                inline: false
            });
        }
        
        console.log('Report logged:', JSON.stringify({
            id: reportId,
            type,
            reporter: interaction.user.id,
            title,
            description: description.substring(0, 100) + '...'
        }));
    },
    
    generateReportId() {
        return 'RPT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    },
    
    getReportColor(type) {
        const colors = {
            bug: constants.COLORS.ERROR,
            feature: constants.COLORS.INFO,
            user: constants.COLORS.WARNING,
            feedback: constants.COLORS.PRIMARY
        };
        return colors[type] || constants.COLORS.PRIMARY;
    }
};
