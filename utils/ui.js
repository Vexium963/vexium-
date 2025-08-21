const { EmbedBuilder } = require('discord.js');

const COLORS = { 
    primary: '#5865F2', 
    ok: '#57F287', 
    warn: '#FEE75C', 
    err: '#ED4245' 
};

const base = (title, desc, color = 'primary') => 
    new EmbedBuilder()
        .setTitle(title)
        .setDescription(desc)
        .setColor(COLORS[color])
        .setTimestamp()
        .setFooter({ text: 'VEX is simulated; no real-world value.' });

module.exports = {
    ok: (t, d) => base(t, d, 'ok'),
    info: (t, d) => base(t, d, 'primary'),
    warn: (t, d) => base(t, d, 'warn'),
    err: (t, d) => base(t, d, 'err'),
    money: (n) => `${n.toFixed(2)} VEX`,
    usd: (vex, price) => `~$${(vex * price).toFixed(2)}`,
    
    createEmbed: (title, description, color = '#5865F2') => base(title, description, 'primary'),
    createSuccessEmbed: (title, description) => base(title, description, 'ok'),
    createErrorEmbed: (title, description) => base(title, description, 'err'),
    createWarningEmbed: (title, description) => base(title, description, 'warn'),
    formatMoney: (amount, currency = 'VEX') => `${amount.toLocaleString()} ${currency}`,
    formatPercentage: (value) => `${(value * 100).toFixed(1)}%`,
    createProgressBar: (current, max, length = 10) => {
        const filled = Math.round((current / max) * length);
        const empty = length - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    },
    addComplianceFooter: (embed) => embed.setFooter({ 
        text: 'VEX is simulated; no real-world value.' 
    }),
    formatCurrency: (amount, showUSD = true) => {
        try {
            const Economics = require('./economics');
            const formatted = `${amount.toFixed(2)} VEX`;
            if (showUSD) {
                const usdValue = amount * Economics.getCurrentVEXPrice();
                return `${formatted} (~$${usdValue.toFixed(2)})`;
            }
            return formatted;
        } catch (error) {
            return `${amount.toFixed(2)} VEX`;
        }
    }
};
