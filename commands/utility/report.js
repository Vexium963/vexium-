const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription(`✨ Help shape VexiumVerse! Report bugs, request features, or share feedback to earn community rewa...`)
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
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(
                interaction.user.id,
                'report',
                true
            );
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                communityEngagement: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'report',
                behaviorContext
            );
        }
        
        const reportType = interaction.options.getString('type');
        
        const User = require('../../database/models/User');
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const reportsSubmitted = userData.stats.reportsSubmitted || 0;
        const isCommunityHelper = reportsSubmitted >= 5;
        const isLegendaryContributor = reportsSubmitted >= 20;
        const isFirstReport = reportsSubmitted === 0;
        const recentReports = userData.stats.reportsThisWeek || 0;
        const isActiveContributor = recentReports >= 3;
        
        const communityImpact = Math.floor(Math.random() * 50) + 10;
        const urgencyBonus = Math.random() < 0.2 ? Math.floor(Math.random() * 25) + 10 : 0;
        
        let modalTitle = this.getReportTitle(reportType);
        let motivationalPrefix = '';
        
        if (isLegendaryContributor) {
            modalTitle = `👑 LEGENDARY CONTRIBUTOR - ${this.getReportTitle(reportType)}`;
            motivationalPrefix = '🔥 Your expertise shapes VexiumVerse! ';
        } else if (isCommunityHelper) {
            modalTitle = `⭐ COMMUNITY HERO - ${this.getReportTitle(reportType)}`;
            motivationalPrefix = '💎 Your feedback drives innovation! ';
        } else if (isFirstReport) {
            modalTitle = `🌟 FIRST REPORT - ${this.getReportTitle(reportType)}`;
            motivationalPrefix = '✨ Welcome to the VexiumVerse improvement team! ';
        } else if (isActiveContributor) {
            modalTitle = `🚀 ACTIVE CONTRIBUTOR - ${this.getReportTitle(reportType)}`;
            motivationalPrefix = '⚡ Your dedication is noticed! ';
        }
        
        if (urgencyBonus > 0) {
            motivationalPrefix += `🎁 BONUS: +${urgencyBonus} VEX for quality reports! `;
        }
        
        const modal = new ModalBuilder()
            .setCustomId(`report_${reportType}_${interaction.user.id}`)
            .setTitle(modalTitle);
        
        const titleInput = new TextInputBuilder()
            .setCustomId('report_title')
            .setLabel('Title')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(motivationalPrefix + (isCommunityHelper ? 
                '🔥 Your expertise matters! Brief description...' : 
                isFirstReport ? '🌟 Your first contribution! Brief description...' :
                'Brief description of your report'))
            .setRequired(true)
            .setMaxLength(100);
        
        const descriptionInput = new TextInputBuilder()
            .setCustomId('report_description')
            .setLabel('Detailed Description')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(this.getPlaceholder(reportType) + 
                (isCommunityHelper ? '\n\n💎 Your detailed reports help make VexiumVerse better!' : ''))
            .setRequired(true)
            .setMaxLength(1000);
        
        const stepsInput = new TextInputBuilder()
            .setCustomId('report_steps')
            .setLabel(reportType === 'bug' ? 'Steps to Reproduce' : 'Additional Information')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(reportType === 'bug' ? 
                '1. First step\n2. Second step\n3. Bug occurs\n\n🎯 Detailed steps help us fix faster!' : 
                'Any additional context or information\n\n✨ Every detail helps improve the experience!')
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
        
        const reportTitle = interaction.fields.getTextInputValue('report_title');
        const reportDescription = interaction.fields.getTextInputValue('report_description');
        const steps = interaction.fields.getTextInputValue('report_steps') || 'None provided';
        
        const reportId = this.generateReportId();
        
        const User = require('../../database/models/User');
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const reportsSubmitted = (userData.stats.reportsSubmitted || 0) + 1;
        const isLegendaryContributor = reportsSubmitted >= 20;
        const isCommunityHelper = reportsSubmitted >= 5;
        const isFirstReport = reportsSubmitted === 1;
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 75) + 25);
        const variableReward = Math.random() < 0.3 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        const milestoneMessage = isLegendaryContributor ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        
        let embedTitle = `${constants.EMOJIS.SUCCESS} Report Submitted`;
        let embedDescription = `Your ${this.getReportTitle(reportType).toLowerCase()} has been submitted successfully!`;
        
        if (isLegendaryContributor) {
            embedTitle = `👑 LEGENDARY CONTRIBUTOR! Report Submitted`;
            embedDescription = `🔥 **COMMUNITY LEGEND!** Your ${reportsSubmitted}th report shows incredible dedication!\n\n${milestoneMessage}`;
        } else if (isCommunityHelper) {
            embedTitle = `⭐ COMMUNITY HERO! Report Submitted`;
            embedDescription = `💎 **RISING STAR!** ${reportsSubmitted} reports submitted - you're making VexiumVerse better!`;
        } else if (isFirstReport) {
            embedTitle = `🌟 FIRST REPORT! Welcome to the Team`;
            embedDescription = `✨ **WELCOME TO THE IMPROVEMENT SQUAD!** Your first report is the beginning of something amazing!`;
        }
        
        if (variableReward) {
            embedDescription += `\n\n${variableReward}`;
        }
        
        embedDescription += `\n\n${fomoMessage}\n${socialProofMessage}`;
        
        userData.stats.reportsSubmitted = reportsSubmitted;
        userData.stats.commandsUsed++;
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(embedTitle)
            .setDescription(`🎉 ${embedDescription}`)
            .addFields(
                { name: '🆔 Report ID', value: reportId, inline: true },
                { name: '📋 Title', value: reportTitle, inline: false },
                { name: '📝 Status', value: 'Under Review', inline: true },
                { name: '🏆 Community Impact', value: `${reportsSubmitted} reports submitted\n${isLegendaryContributor ? '👑 **Legendary Status**' : isCommunityHelper ? '⭐ **Hero Status**' : '🌟 **Growing Contributor**'}`, inline: true }
            )
            .setColor(isLegendaryContributor ? constants.COLORS.VEX : isCommunityHelper ? constants.COLORS.GOLD : constants.COLORS.SUCCESS)
            .setFooter({ text: 'Your feedback shapes the future of VexiumVerse!' })
            .setTimestamp();
        
        const ActionRowBuilder = require('discord.js').ActionRowBuilder;
        const ButtonBuilder = require('discord.js').ButtonBuilder;
        const ButtonStyle = require('discord.js').ButtonStyle;
        
        const reportButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('report_status_check')
                    .setLabel('Check Status')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📋'),
                new ButtonBuilder()
                    .setCustomId('report_another')
                    .setLabel('Submit Another')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📝')
            );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [reportButtons],
            ephemeral: true 
        });
        
        await this.logReport(interaction, reportType, reportId, reportTitle, reportDescription, steps);
    },
    
    async logReport(interaction, type, reportId, title, description, steps) {
        const logEmbed = new EmbedBuilder()
            .setTitle(`${this.getReportTitle(type)} - ${reportId}`)
            .setDescription(`🔥 **Title:** ${title}`)
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
