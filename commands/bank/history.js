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
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription('No records found for this category.')
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(constants.COLORS.PRIMARY);
        
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
        
        embed.setFooter({ text: `Showing ${Math.min(limit, records.length)} of ${records.length} records` });
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
            'gambling_win': '🎰',
            'gambling_loss': '🎲',
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
