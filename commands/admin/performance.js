const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('performance')
        .setDescription('View bot performance metrics and system health (Admin only)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('metrics')
                .setDescription('View current performance metrics'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('health')
                .setDescription('Check system health status'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('report')
                .setDescription('Generate detailed performance report')),
    
    async execute(interaction) {
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'performance', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                adminAccess: true,
                systemMonitoring: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'performance',
                behaviorContext
            );
        }
        
        if (!this.isAdmin(interaction.user.id)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Access Denied`)
                .setDescription('This command is restricted to administrators only.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'metrics':
                await this.handleMetrics(interaction);
                break;
            case 'health':
                await this.handleHealth(interaction);
                break;
            case 'report':
                await this.handleReport(interaction);
                break;
        }
    },

    async handleMetrics(interaction) {
        const performanceMonitor = interaction.client.performanceMonitor;
        
        if (!performanceMonitor) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Performance Monitor Unavailable`)
                .setDescription('Performance monitoring is not enabled.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const metrics = performanceMonitor.getPerformanceMetrics();
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CHART} Performance Metrics`)
            .setDescription('Current bot performance statistics')
            .addFields(
                { name: '⏱️ Uptime', value: `${Math.floor(metrics.uptime / 1000 / 60)} minutes`, inline: true },
                { name: '📊 Total Commands', value: metrics.totalCommands.toLocaleString(), inline: true },
                { name: '⚡ Avg Response Time', value: `${Math.round(metrics.averageResponseTime)}ms`, inline: true },
                { name: '👥 Active Users', value: metrics.activeUsers.toString(), inline: true },
                { name: '📈 Peak Users', value: metrics.peakUsers.toString(), inline: true },
                { name: '🧠 Memory Usage', value: `${metrics.memoryUsage.heapUsedMB}MB / ${metrics.memoryUsage.heapTotalMB}MB`, inline: true },
                { name: '❌ Error Rate', value: `${(metrics.errorRate * 100).toFixed(2)}%`, inline: true },
                { name: '🏆 Performance Rating', value: this.getPerformanceEmoji(metrics.performanceRating) + ' ' + metrics.performanceRating.toUpperCase(), inline: true },
                { name: '📊 Memory Usage %', value: `${Math.round(metrics.memoryUsage.heapUsagePercent)}%`, inline: true }
            )
            .setColor(this.getPerformanceColor(metrics.performanceRating))
            .setTimestamp();

        if (metrics.topCommands.length > 0) {
            const topCommandsText = metrics.topCommands
                .map(cmd => `\`${cmd.command}\`: ${cmd.executions} uses (${cmd.averageTime}ms avg)`)
                .join('\n');
            
            embed.addFields({
                name: '🔥 Top Commands',
                value: topCommandsText,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleHealth(interaction) {
        const autoHealing = interaction.client.autoHealing;
        
        if (!autoHealing) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Auto-Healing Unavailable`)
                .setDescription('Auto-healing system is not enabled.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const healthStatus = await autoHealing.performHealthCheck();
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.DIAMOND} System Health Check`)
                .setDescription(`Overall Status: ${this.getHealthEmoji(healthStatus.status)} **${healthStatus.status.toUpperCase()}**`)
                .setColor(this.getHealthColor(healthStatus.status))
                .setTimestamp();

            Object.entries(healthStatus.checks).forEach(([checkName, result]) => {
                embed.addFields({
                    name: `${result.healthy ? '✅' : '❌'} ${checkName.charAt(0).toUpperCase() + checkName.slice(1)}`,
                    value: result.message,
                    inline: true
                });
            });

            embed.addFields(
                { name: '📊 Total Requests', value: healthStatus.metrics.requests.toString(), inline: true },
                { name: '❌ Total Errors', value: healthStatus.metrics.errors.toString(), inline: true },
                { name: '⏱️ Avg Response Time', value: `${Math.round(healthStatus.metrics.totalResponseTime / Math.max(healthStatus.metrics.requests, 1))}ms`, inline: true }
            );

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Health Check Failed`)
                .setDescription(`Failed to perform health check: ${error.message}`)
                .setColor(constants.COLORS.ERROR);
            
            await interaction.editReply({ embeds: [embed] });
        }
    },

    async handleReport(interaction) {
        const performanceMonitor = interaction.client.performanceMonitor;
        
        if (!performanceMonitor) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Performance Monitor Unavailable`)
                .setDescription('Performance monitoring is not enabled.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const report = performanceMonitor.generateReport();
            const reportJson = JSON.stringify(report, null, 2);
            
            const attachment = new AttachmentBuilder(
                Buffer.from(reportJson, 'utf8'),
                { name: `performance-report-${Date.now()}.json` }
            );

            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.CHART} Performance Report Generated`)
                .setDescription('Detailed performance report has been generated and attached.')
                .addFields(
                    { name: '📊 Report Summary', value: `Generated at: ${report.generatedAt}`, inline: false },
                    { name: '⏱️ Uptime', value: report.summary.uptime, inline: true },
                    { name: '📈 Total Commands', value: report.summary.totalCommands.toString(), inline: true },
                    { name: '🏆 Performance Rating', value: report.summary.performanceRating.toUpperCase(), inline: true }
                )
                .setColor(constants.COLORS.INFO)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], files: [attachment] });
        } catch (error) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Report Generation Failed`)
                .setDescription(`Failed to generate performance report: ${error.message}`)
                .setColor(constants.COLORS.ERROR);
            
            await interaction.editReply({ embeds: [embed] });
        }
    },

    isAdmin(userId) {
        const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
        return adminIds.includes(userId);
    },

    getPerformanceEmoji(rating) {
        const emojis = {
            excellent: '🟢',
            good: '🟡',
            fair: '🟠',
            poor: '🔴'
        };
        return emojis[rating] || '⚪';
    },

    getPerformanceColor(rating) {
        const colors = {
            excellent: constants.COLORS.SUCCESS,
            good: constants.COLORS.WARNING,
            fair: '#FF8C00',
            poor: constants.COLORS.ERROR
        };
        return colors[rating] || constants.COLORS.INFO;
    },

    getHealthEmoji(status) {
        const emojis = {
            healthy: '🟢',
            unhealthy: '🟡',
            critical: '🔴'
        };
        return emojis[status] || '⚪';
    },

    getHealthColor(status) {
        const colors = {
            healthy: constants.COLORS.SUCCESS,
            unhealthy: constants.COLORS.WARNING,
            critical: constants.COLORS.ERROR
        };
        return colors[status] || constants.COLORS.INFO;
    }
};
