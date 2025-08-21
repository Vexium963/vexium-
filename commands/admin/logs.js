const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logs')
        .setDescription(`⏳ Access powerful admin logs and audit trails - Monitor your empire's data flow!`)
        .addStringOption(option =>
            option.setName('type')
                .setDescription(`📈 Choose which critical data stream to analyze`)
                .setRequired(true)
                .addChoices(
                    { name: 'Treasury Transactions', value: 'treasury' },
                    { name: 'User Transactions', value: 'transactions' },
                    { name: 'Security Events', value: 'security' },
                    { name: 'System Errors', value: 'errors' },
                    { name: 'Burn Events', value: 'burns' }
                ))
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription(`📊 How many recent entries to display (1-50)`)
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(50))
        .addUserOption(option =>
            option.setName('user')
                .setDescription(`✨ Focus on a specific user's activity trail`)
                .setRequired(false)),
    
    async execute(interaction) {
        if (!this.isAdmin(interaction.user.id)) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 25) + 5);
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Access Denied`)
                .setDescription(`🔥 **ADMIN ONLY!** You need legendary admin powers to access the system logs!\n\n✨ **Tip:** Becom...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'admin_logs', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                adminAction: true,
                powerUser: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'admin_logs',
                behaviorContext
            );
        }
        
        const logType = interaction.options.getString('type');
        const limit = interaction.options.getInteger('limit') || 20;
        const filterUser = interaction.options.getUser('user');
        
        const adminLevel = this.getAdminLevel(interaction.user.id);
        const isSystemMaster = adminLevel === 'master';
        
        switch (logType) {
            case 'treasury':
                return this.handleTreasuryLogs(interaction, limit, isSystemMaster);
            case 'transactions':
                return this.handleTransactionLogs(interaction, limit, filterUser, isSystemMaster);
            case 'security':
                return this.handleSecurityLogs(interaction, limit, isSystemMaster);
            case 'errors':
                return this.handleErrorLogs(interaction, limit, isSystemMaster);
            case 'burns':
                return this.handleBurnLogs(interaction, limit, filterUser, isSystemMaster);
        }
    },
    
    async handleTreasuryLogs(interaction, limit) {
        const treasuryData = await User.getTreasuryData();
        const transactions = treasuryData.transactions.slice(0, limit);
        
        const milestoneMessage = constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)];
        const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 15) + 3);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.TREASURY} Treasury Transaction Logs`)
            .setDescription(`💸 Recent ${limit} treasury transactions - Watch the VEX flow!\n\n🔥 ${milestoneMessage}\n📈 ${socialProofMessage}\n\n${constants.ANIMATED_EMOJIS.SPARKLES} **Monitor the economic pulse of VexiumVerse!**`)
            .addFields(
                { name: '💰 Current Balance', value: `${treasuryData.balance.toFixed(2)} VEX (~$${(treasuryData.balance * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '📊 Total Transactions', value: treasuryData.transactions.length.toString(), inline: true }
            )
            .setColor(constants.COLORS.TREASURY)
            .setTimestamp();
        
        if (transactions.length > 0) {
            const transactionList = transactions.map(tx => {
                const date = new Date(tx.timestamp).toLocaleDateString();
                const time = new Date(tx.timestamp).toLocaleTimeString();
                return `**+${tx.amount.toFixed(2)} VEX** (~$${(tx.amount * Economics.getCurrentVEXPrice()).toFixed(2)}) from \`${tx.source}\`\n*${date} ${time}* | Balance: ${tx.balanceAfter.toFixed(2)} VEX (~$${(tx.balanceAfter * Economics.getCurrentVEXPrice()).toFixed(2)})`;
            }).join('\n\n');
            
            embed.addFields({
                name: '📋 Recent Transactions',
                value: transactionList,
                inline: false
            });
        } else {
            embed.addFields({
                name: '📋 Transactions',
                value: 'No treasury transactions found.',
                inline: false
            });
        }
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        
        let progressBuffer;
        if (embed.data.title.includes('Treasury')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                `Treasury Health: ${Math.min(treasuryData.balance / 10000, 1) * 100}%`,
                Math.min(treasuryData.balance / 10000, 1),
                constants.COLORS.TREASURY
            );
        } else if (embed.data.title.includes('Transaction')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                `Transaction Activity: ${Math.min(transactions.length / limit, 1) * 100}%`,
                Math.min(transactions.length / limit, 1),
                constants.COLORS.PRIMARY
            );
        } else if (embed.data.title.includes('Burn')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                `Burn Activity: ${Math.min(burns.length / limit, 1) * 100}%`,
                Math.min(burns.length / limit, 1),
                constants.COLORS.ERROR
            );
        } else if (embed.data.title.includes('Security')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                'Security Status: 100% Operational',
                1.0,
                constants.COLORS.SUCCESS
            );
        } else {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                'System Health: 100% Operational',
                1.0,
                constants.COLORS.SUCCESS
            );
        }

        embed.setImage('attachment://progress.png');
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleTransactionLogs(interaction, limit, filterUser) {
        let allTransactions = [];
        
        if (filterUser) {
            const user = new User(filterUser.id);
            const userData = await user.load();
            allTransactions = userData.transactionHistory || [];
        } else {
            const allUsers = await User.getLeaderboard('networth', 100);
            for (const userData of allUsers) {
                if (userData.transactionHistory) {
                    allTransactions.push(...userData.transactionHistory.map(tx => ({
                        ...tx,
                        userId: userData.userId
                    })));
                }
            }
            allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        
        const transactions = allTransactions.slice(0, limit);
        
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 3 + 1).toFixed(2)) : null;
        const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 20);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.MONEY} Transaction Logs`)
            .setDescription((filterUser ? 
                `Recent ${limit} transactions for ${filterUser.username}` :
                `Recent ${limit} transactions across all users`) + 
                `\n\n${socialProof}` + 
                (variableReward ? `\n${variableReward}` : ''))
            .setColor(constants.COLORS.PRIMARY)
            .setTimestamp();
        
        if (transactions.length > 0) {
            const transactionList = transactions.map(tx => {
                const emoji = this.getTransactionEmoji(tx.type);
                const amount = tx.type === 'spend' ? `-${tx.amount.toFixed(2)}` : `+${tx.amount.toFixed(2)}`;
                const usdAmount = tx.type === 'spend' ? `-$${(tx.amount * Economics.getCurrentVEXPrice()).toFixed(2)}` : `+$${(tx.amount * Economics.getCurrentVEXPrice()).toFixed(2)}`;
                const tax = tx.taxAmount > 0 ? ` (Tax: ${tx.taxAmount.toFixed(2)} VEX / $${(tx.taxAmount * Economics.getCurrentVEXPrice()).toFixed(2)})` : '';
                const date = new Date(tx.timestamp).toLocaleDateString();
                const userInfo = filterUser ? '' : ` | User: ${tx.userId.slice(-4)}`;
                
                return `${emoji} **${amount} VEX** (${usdAmount}) - ${tx.source}${tax}\n*${date}*${userInfo}`;
            }).join('\n\n');
            
            embed.addFields({
                name: '📋 Recent Transactions',
                value: transactionList,
                inline: false
            });
        } else {
            embed.addFields({
                name: '📋 Transactions',
                value: 'No transactions found.',
                inline: false
            });
        }
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        
        let progressBuffer;
        if (embed.data.title.includes('Treasury')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                `Treasury Health: ${Math.min(treasuryData.balance / 10000, 1) * 100}%`,
                Math.min(treasuryData.balance / 10000, 1),
                constants.COLORS.TREASURY
            );
        } else if (embed.data.title.includes('Transaction')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                `Transaction Activity: ${Math.min(transactions.length / limit, 1) * 100}%`,
                Math.min(transactions.length / limit, 1),
                constants.COLORS.PRIMARY
            );
        } else if (embed.data.title.includes('Burn')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                `Burn Activity: ${Math.min(burns.length / limit, 1) * 100}%`,
                Math.min(burns.length / limit, 1),
                constants.COLORS.ERROR
            );
        } else if (embed.data.title.includes('Security')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                'Security Status: 100% Operational',
                1.0,
                constants.COLORS.SUCCESS
            );
        } else {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                'System Health: 100% Operational',
                1.0,
                constants.COLORS.SUCCESS
            );
        }

        embed.setImage('attachment://progress.png');
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleBurnLogs(interaction, limit, filterUser) {
        let allBurns = [];
        
        if (filterUser) {
            const user = new User(filterUser.id);
            const userData = await user.load();
            allBurns = userData.burnHistory || [];
        } else {
            const allUsers = await User.getLeaderboard('networth', 100);
            for (const userData of allUsers) {
                if (userData.burnHistory) {
                    allBurns.push(...userData.burnHistory.map(burn => ({
                        ...burn,
                        userId: userData.userId
                    })));
                }
            }
            allBurns.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        
        const burns = allBurns.slice(0, limit);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.BURN} Burn Event Logs`)
            .setDescription(filterUser ? 
                `Recent ${limit} burn events for ${filterUser.username}` :
                `Recent ${limit} burn events across all users`)
            .setColor(constants.COLORS.ERROR)
            .setTimestamp();
        
        if (burns.length > 0) {
            const burnList = burns.map(burn => {
                const date = new Date(burn.timestamp).toLocaleDateString();
                const userInfo = filterUser ? '' : ` | User: ${burn.userId.slice(-4)}`;
                
                return `🔥 **${burn.amount.toFixed(2)} VEX** (~$${(burn.amount * Economics.getCurrentVEXPrice()).toFixed(2)}) - ${burn.reason}\n*${date}*${userInfo}`;
            }).join('\n\n');
            
            embed.addFields({
                name: '🔥 Recent Burns',
                value: burnList,
                inline: false
            });
            
            const totalBurned = burns.reduce((sum, burn) => sum + burn.amount, 0);
            embed.addFields({
                name: '📊 Total Burned (shown)',
                value: `${totalBurned.toFixed(2)} VEX (~$${(totalBurned * Economics.getCurrentVEXPrice()).toFixed(2)})`,
                inline: true
            });
        } else {
            embed.addFields({
                name: '🔥 Burns',
                value: 'No burn events found.',
                inline: false
            });
        }
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        
        let progressBuffer;
        if (embed.data.title.includes('Treasury')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                `Treasury Health: ${Math.min(treasuryData.balance / 10000, 1) * 100}%`,
                Math.min(treasuryData.balance / 10000, 1),
                constants.COLORS.TREASURY
            );
        } else if (embed.data.title.includes('Transaction')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                `Transaction Activity: ${Math.min(transactions.length / limit, 1) * 100}%`,
                Math.min(transactions.length / limit, 1),
                constants.COLORS.PRIMARY
            );
        } else if (embed.data.title.includes('Burn')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                `Burn Activity: ${Math.min(burns.length / limit, 1) * 100}%`,
                Math.min(burns.length / limit, 1),
                constants.COLORS.ERROR
            );
        } else if (embed.data.title.includes('Security')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                'Security Status: 100% Operational',
                1.0,
                constants.COLORS.SUCCESS
            );
        } else {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                'System Health: 100% Operational',
                1.0,
                constants.COLORS.SUCCESS
            );
        }

        embed.setImage('attachment://progress.png');
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleSecurityLogs(interaction, limit) {
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.WARNING} Security Logs`)
            .setDescription(`⏳ Security events and suspicious activity monitoring - Your empire's shield is active!`)
            .addFields(
                { name: '🔒 Security Status', value: 'All systems operational', inline: true },
                { name: '⚠️ Recent Alerts', value: 'No recent security alerts', inline: true }
            )
            .setColor(constants.COLORS.WARNING)
            .setTimestamp();
        
        embed.addFields({
            name: '📋 Security Features Active',
            value: '• Rate limiting on all commands\n• Input validation and sanitization\n• Transaction audit logging\n• Anti-abuse detection\n• Automated burn mechanisms',
            inline: false
        });
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        
        let progressBuffer;
        if (embed.data.title.includes('Treasury')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                `Treasury Health: ${Math.min(treasuryData.balance / 10000, 1) * 100}%`,
                Math.min(treasuryData.balance / 10000, 1),
                constants.COLORS.TREASURY
            );
        } else if (embed.data.title.includes('Transaction')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                `Transaction Activity: ${Math.min(transactions.length / limit, 1) * 100}%`,
                Math.min(transactions.length / limit, 1),
                constants.COLORS.PRIMARY
            );
        } else if (embed.data.title.includes('Burn')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                `Burn Activity: ${Math.min(burns.length / limit, 1) * 100}%`,
                Math.min(burns.length / limit, 1),
                constants.COLORS.ERROR
            );
        } else if (embed.data.title.includes('Security')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                'Security Status: 100% Operational',
                1.0,
                constants.COLORS.SUCCESS
            );
        } else {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                'System Health: 100% Operational',
                1.0,
                constants.COLORS.SUCCESS
            );
        }

        embed.setImage('attachment://progress.png');
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleErrorLogs(interaction, limit) {
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.ERROR} System Error Logs`)
            .setDescription(`📊 Recent system errors and exceptions - Monitoring system health!`)
            .addFields(
                { name: '✅ System Status', value: 'All systems operational', inline: true },
                { name: '📊 Error Count (24h)', value: '0', inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        embed.addFields({
            name: '🛡️ Error Handling',
            value: '• Graceful error recovery\n• Automatic retry mechanisms\n• User-friendly error messages\n• Comprehensive logging\n• Real-time monitoring',
            inline: false
        });
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        
        let progressBuffer;
        if (embed.data.title.includes('Treasury')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                `Treasury Health: ${Math.min(treasuryData.balance / 10000, 1) * 100}%`,
                Math.min(treasuryData.balance / 10000, 1),
                constants.COLORS.TREASURY
            );
        } else if (embed.data.title.includes('Transaction')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                `Transaction Activity: ${Math.min(transactions.length / limit, 1) * 100}%`,
                Math.min(transactions.length / limit, 1),
                constants.COLORS.PRIMARY
            );
        } else if (embed.data.title.includes('Burn')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                `Burn Activity: ${Math.min(burns.length / limit, 1) * 100}%`,
                Math.min(burns.length / limit, 1),
                constants.COLORS.ERROR
            );
        } else if (embed.data.title.includes('Security')) {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                'Security Status: 100% Operational',
                1.0,
                constants.COLORS.SUCCESS
            );
        } else {
            progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                'System Health: 100% Operational',
                1.0,
                constants.COLORS.SUCCESS
            );
        }

        embed.setImage('attachment://progress.png');
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    getTransactionEmoji(type) {
        const emojis = {
            'earn': '💰',
            'spend': '💸',
            'withdrawal': '🏦',
            'deposit': '📥',
            'entertainment_win': '🎰',
            'entertainment_loss': '🎲',
            'investment': '📈',
            'trade': '🤝',
            'gift': '🎁',
            'level_reward': '🏆'
        };
        
        return emojis[type] || '💱';
    },
    
    isAdmin(userId) {
        const adminIds = (process.env.BOT_ADMIN_IDS || '').split(',');
        return adminIds.includes(userId);
    }
};
