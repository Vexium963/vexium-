const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('View your transaction history and financial records')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of history to view')
                .setRequired(false)
                .addChoices(
                    { name: 'All Transactions', value: 'transactions' },
                    { name: 'Tax History', value: 'taxes' },
                    { name: 'Burn History', value: 'burns' },
                    { name: 'Withdrawals Only', value: 'withdrawals' },
                    { name: 'Earnings Only', value: 'earnings' }
                ))
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Number of records to show (max 20)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(20)),
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'history', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                financialTracking: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'history',
                behaviorContext
            );
        }
        
        const type = interaction.options.getString('type') || 'transactions';
        const limit = interaction.options.getInteger('limit') || 10;
        
        let records = [];
        let title = '';
        let description = '';
        
        switch (type) {
            case 'transactions':
                records = userData.transactionHistory || [];
                title = `${constants.EMOJIS.MONEY} Transaction History`;
                description = 'Your complete VEX transaction record';
                break;
            case 'taxes':
                records = userData.taxHistory || [];
                title = `${constants.EMOJIS.TAX} Tax History`;
                description = 'All taxes paid to the VexiumVerse treasury';
                break;
            case 'burns':
                records = userData.burnHistory || [];
                title = `${constants.EMOJIS.BURN} Burn History`;
                description = 'VEX tokens permanently removed from circulation';
                break;
            case 'withdrawals':
                records = (userData.transactionHistory || []).filter(t => t.type === 'withdrawal');
                title = `${constants.EMOJIS.BANK} Withdrawal History`;
                description = 'All withdrawals from your bank account';
                break;
            case 'earnings':
                records = (userData.transactionHistory || []).filter(t => t.type === 'earn');
                title = `${constants.EMOJIS.CHART} Earnings History`;
                description = 'All VEX earned through various activities';
                break;
        }
        
        if (records.length === 0) {
            const motivationalMessages = [
                "🚀 **Time to make history!** Start earning and spending to build your financial legacy!",
                "💎 **Your journey begins now!** Every transaction tells a story of success!",
                "⚡ **Ready to create wealth?** Your first transaction is just a command away!",
                "🌟 **Future millionaire detected!** Start building your empire today!"
            ];
            
            const randomMotivation = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.INFO} ${title}`)
                .setDescription(`No records found yet!\n\n${randomMotivation}`)
                .addFields({
                    name: '💡 Quick Start Tips',
                    value: '• Use `/daily` to earn your first VEX\n• Try `/work` to build consistent income\n• Use `/shop` to make your first purchase\n• Check `/invest` to multiply your wealth',
                    inline: false
                })
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const totalTransactions = records.length;
        const isActiveTrader = totalTransactions >= 50;
        const isFinancialGuru = totalTransactions >= 200;
        const recentActivity = records.filter(r => Date.now() - r.timestamp < 7 * 24 * 60 * 60 * 1000).length;
        const isActiveThisWeek = recentActivity >= 5;
        
        const historyViews = userData.stats.historyViewed || 0;
        const isDataAnalyst = historyViews >= 20;
        const surpriseInsight = Math.random() < 0.25;
        const activeUsers = Math.floor(Math.random() * 30) + 10;
        
        userData.stats.historyViewed = historyViews + 1;
        
        let enhancedTitle = title;
        let enhancedDescription = description;
        
        if (isFinancialGuru) {
            enhancedTitle = `👑 FINANCIAL LEGEND! ${title}`;
            enhancedDescription = `💎 **INCREDIBLE!** You're a financial mastermind with ${totalTransactions} transactions!\n${description}`;
        } else if (isActiveTrader) {
            enhancedTitle = `🔥 ACTIVE TRADER! ${title}`;
            enhancedDescription = `⚡ **IMPRESSIVE!** ${totalTransactions} transactions show your dedication!\n${description}`;
        }
        
        if (isActiveThisWeek) {
            enhancedDescription += `\n\n📈 **HOT STREAK!** ${recentActivity} transactions this week!`;
        }
        
        if (isDataAnalyst) {
            enhancedDescription += `\n🧠 **DATA MASTER!** You've analyzed your history ${historyViews} times - true financial wisdom!`;
        }
        
        if (surpriseInsight) {
            enhancedDescription += `\n✨ **INSIGHT BONUS!** Your financial awareness is growing - keep tracking for hidden patterns!`;
        }
        
        enhancedDescription += `\n\n📊 **${activeUsers} players** are analyzing their finances right now!`;
        
        const embed = new EmbedBuilder()
            .setTitle(enhancedTitle)
            .setDescription(enhancedDescription)
            .setColor(isFinancialGuru ? constants.COLORS.VEX : isActiveTrader ? constants.COLORS.SUCCESS : constants.COLORS.PRIMARY);
        
        const recentRecords = records.slice(0, limit);
        
        if (type === 'transactions') {
            const transactionList = recentRecords.map(record => {
                const emoji = this.getTransactionEmoji(record.type);
                const amount = record.type === 'spend' ? `-$${record.amount.toFixed(2)}` : `+$${record.amount.toFixed(2)}`;
                const tax = record.taxAmount > 0 ? ` (Tax: $${record.taxAmount.toFixed(2)})` : '';
                const date = new Date(record.timestamp).toLocaleDateString();
                
                return `${emoji} **${amount}** VEX - ${record.source}${tax}\n*${date}*`;
            }).join('\n\n');
            
            embed.addFields({
                name: `Recent ${limit} Transactions`,
                value: transactionList || 'No transactions found',
                inline: false
            });
        } else if (type === 'taxes') {
            const taxList = recentRecords.map(record => {
                const date = new Date(record.timestamp).toLocaleDateString();
                return `💸 **$${record.amount.toFixed(2)}** VEX - ${record.source}\n*${date}*`;
            }).join('\n\n');
            
            embed.addFields({
                name: `Recent ${limit} Tax Payments`,
                value: taxList || 'No tax records found',
                inline: false
            });
        } else if (type === 'burns') {
            const burnList = recentRecords.map(record => {
                const date = new Date(record.timestamp).toLocaleDateString();
                return `🔥 **$${record.amount.toFixed(2)}** VEX - ${record.reason}\n*${date}*`;
            }).join('\n\n');
            
            embed.addFields({
                name: `Recent ${limit} Burns`,
                value: burnList || 'No burn records found',
                inline: false
            });
        }
        
        embed.addFields(
            { name: '📊 Total Records', value: records.length.toString(), inline: true },
            { name: '📅 Date Range', value: this.getDateRange(records), inline: true }
        );
        
        if (type === 'transactions') {
            const totalEarned = records.filter(r => r.type === 'earn').reduce((sum, r) => sum + r.amount, 0);
            const totalSpent = records.filter(r => r.type === 'spend').reduce((sum, r) => sum + r.amount, 0);
            const totalTaxes = records.reduce((sum, r) => sum + (r.taxAmount || 0), 0);
            
            embed.addFields(
                { name: '💰 Total Earned', value: `$${totalEarned.toFixed(2)} VEX`, inline: true },
                { name: '💸 Total Spent', value: `$${totalSpent.toFixed(2)} VEX`, inline: true },
                { name: '🏛️ Total Taxes', value: `$${totalTaxes.toFixed(2)} VEX`, inline: true }
            );
        }
        
        const footerMessages = [
            `💡 Pro Tip: Regular financial tracking leads to wealth!`,
            `🎯 Knowledge is power - you're building financial intelligence!`,
            `📈 Smart investors always know their numbers!`,
            `💎 Your financial awareness is your greatest asset!`
        ];
        
        const randomFooter = footerMessages[Math.floor(Math.random() * footerMessages.length)];
        
        embed.setFooter({ text: `${randomFooter} | Showing ${Math.min(limit, records.length)} of ${records.length} records` });
        embed.setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        
        userData.stats.commandsUsed++;
        await user.save(userData);
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
    
    getDateRange(records) {
        if (records.length === 0) return 'No records';
        
        const dates = records.map(r => new Date(r.timestamp)).sort((a, b) => a - b);
        const oldest = dates[0].toLocaleDateString();
        const newest = dates[dates.length - 1].toLocaleDateString();
        
        return oldest === newest ? oldest : `${oldest} - ${newest}`;
    }
};
