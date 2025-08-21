const { EmbedBuilder } = require('discord.js');
const constants = require('./constants');

class UIHelpers {
    static success(title, description, fields = [], footer = null) {
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} ${title}`)
            .setDescription(description)
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
            
        if (fields.length > 0) {
            embed.addFields(fields);
        }
        
        if (footer) {
            embed.setFooter({ text: footer });
        } else {
            embed.setFooter({ text: this.complianceFooter() });
        }
        
        return embed;
    }

    static error(title, description, ephemeral = true) {
        return new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.ERROR} ${title}`)
            .setDescription(description)
            .setColor(constants.COLORS.ERROR)
            .setTimestamp()
            .setFooter({ text: this.complianceFooter() });
    }

    static info(title, description, fields = []) {
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.INFO} ${title}`)
            .setDescription(description)
            .setColor(constants.COLORS.INFO)
            .setTimestamp();
            
        if (fields.length > 0) {
            embed.addFields(fields);
        }
        
        embed.setFooter({ text: this.complianceFooter() });
        return embed;
    }

    static warning(title, description) {
        return new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.WARNING} ${title}`)
            .setDescription(description)
            .setColor(constants.COLORS.WARNING)
            .setTimestamp()
            .setFooter({ text: this.complianceFooter() });
    }

    static money(amount, currency = 'VEX') {
        if (currency === 'VEX') {
            const Economics = require('./economics');
            const usdValue = amount * Economics.getCurrentVEXPrice();
            return `${amount.toFixed(2)} VEX (~$${usdValue.toFixed(2)})`;
        }
        return `$${amount.toFixed(2)}`;
    }

    static progressBar(current, max, length = 20) {
        const percentage = Math.min(current / max, 1);
        const filled = Math.round(percentage * length);
        const empty = length - filled;
        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${current}/${max} (${Math.round(percentage * 100)}%)`;
    }

    static complianceFooter() {
        return 'VEX is a simulated token inside Discord. No real-world value.';
    }

    static formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    static createStandardEmbed(type, title, description, fields = []) {
        const colorMap = {
            success: constants.COLORS.SUCCESS,
            error: constants.COLORS.ERROR,
            info: constants.COLORS.INFO,
            warning: constants.COLORS.WARNING,
            vex: constants.COLORS.VEX
        };

        const emojiMap = {
            success: constants.EMOJIS.SUCCESS,
            error: constants.EMOJIS.ERROR,
            info: constants.EMOJIS.INFO,
            warning: constants.EMOJIS.WARNING,
            vex: constants.EMOJIS.VEX
        };

        const embed = new EmbedBuilder()
            .setTitle(`${emojiMap[type] || ''} ${title}`)
            .setDescription(description)
            .setColor(colorMap[type] || constants.COLORS.INFO)
            .setTimestamp()
            .setFooter({ text: this.complianceFooter() });

        if (fields.length > 0) {
            embed.addFields(fields);
        }

        return embed;
    }
}

module.exports = UIHelpers;
