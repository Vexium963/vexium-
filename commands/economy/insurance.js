const { SlashCommandBuilder } = require('discord.js');
const { route } = require('../../utils/router');
const ui = require('../../utils/ui');
const User = require('../../database/models/User');
const TransactionManager = require('../../utils/TransactionManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('safety')
        .setDescription('Safety Fund operations')
        .addSubcommand(s => s.setName('purchase').setDescription('Purchase coverage').addNumberOption(o => o.setName('amount').setRequired(true)))
        .addSubcommand(s => s.setName('claim').setDescription('Claim verified loss').addStringOption(o => o.setName('ref_tx_id').setRequired(true)))
        .addSubcommand(s => s.setName('status').setDescription('View fund status')),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        return route(interaction, {
            purchase: this.handlePurchase,
            claim: this.handleClaim,
            status: this.handleStatus,
            _fallback: (i) => i.editReply({ embeds: [ui.err('Unknown subcommand', 'Please use a valid Safety Fund operation.')] })
        });
    },

    async handlePurchase(interaction) {
        const amount = interaction.options.getNumber('amount');
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (amount <= 0) {
            return interaction.editReply({ embeds: [ui.err('Invalid amount', 'Amount must be positive.')] });
        }
        
        const premium = amount * 0.02;
        
        if (userData.vexBalance < premium) {
            return interaction.editReply({ embeds: [ui.err('Insufficient funds', `Premium: ${ui.formatCurrency(premium)}`)] });
        }
        
        let txId;
        try {
            txId = await TransactionManager.begin(interaction.user.id, 'safety_premium', premium);
            
            if (!userData.safetyFund) userData.safetyFund = [];
            
            const coverage = {
                id: `SF_${Date.now()}`,
                amount: amount,
                premium: premium,
                coverageRate: 0.5,
                purchasedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            };
            
            userData.safetyFund.push(coverage);
            userData.vexBalance -= premium;
            await user.save(userData);
            
            await TransactionManager.commit(txId);
            
            const embed = ui.ok('Coverage purchased', 
                `Amount: ${ui.formatCurrency(amount)}\n` +
                `Premium: ${ui.formatCurrency(premium)} (2%)\n` +
                `Coverage: 50% of verified losses\n` +
                `Expires: 30 days`
            );
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            if (txId) await TransactionManager.rollback(txId);
            await interaction.editReply({ embeds: [ui.err('Purchase failed', error.message)] });
        }
    },

    async handleClaim(interaction) {
        const refTxId = interaction.options.getString('ref_tx_id');
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.safetyFund || userData.safetyFund.length === 0) {
            return interaction.editReply({ embeds: [ui.err('No coverage', 'Purchase Safety Fund coverage first.')] });
        }
        
        const activeCoverage = userData.safetyFund.find(c => new Date(c.expiresAt) > new Date());
        if (!activeCoverage) {
            return interaction.editReply({ embeds: [ui.err('No active coverage', 'All coverage has expired.')] });
        }
        
        const entries = await TransactionManager.getLedgerEntries(interaction.user.id, 50);
        const referenceTx = entries.find(entry => entry.ref_tx_id === refTxId);
        
        if (!referenceTx) {
            return interaction.editReply({ embeds: [ui.err('Transaction not found', 'Invalid ref_tx_id provided.')] });
        }
        
        if (!['casino_loss', 'invest_loss'].includes(referenceTx.type)) {
            return interaction.editReply({ embeds: [ui.err('Invalid transaction type', 'Only casino/investment losses are covered.')] });
        }
        
        const txTime = new Date(referenceTx.timestamp);
        const hoursSince = (Date.now() - txTime.getTime()) / (1000 * 60 * 60);
        if (hoursSince > 24) {
            return interaction.editReply({ embeds: [ui.err('Claim expired', 'Claims must be filed within 24 hours.')] });
        }
        
        const alreadyClaimed = userData.safetyFund.some(c => 
            c.claims && c.claims.some(claim => claim.ref_tx_id === refTxId)
        );
        if (alreadyClaimed) {
            return interaction.editReply({ embeds: [ui.err('Already claimed', 'This transaction has already been claimed.')] });
        }
        
        const lossAmount = Math.abs(referenceTx.deltaVEX);
        const coverageAmount = Math.min(lossAmount * activeCoverage.coverageRate, 500);
        
        const dailyUsed = userData.safetyFund.reduce((total, coverage) => {
            if (!coverage.claims) return total;
            const todayClaims = coverage.claims.filter(claim => {
                const claimDate = new Date(claim.date);
                const today = new Date();
                return claimDate.toDateString() === today.toDateString();
            });
            return total + todayClaims.reduce((sum, claim) => sum + claim.payout, 0);
        }, 0);
        
        const remainingDaily = Math.max(0, 500 - dailyUsed);
        const finalPayout = Math.min(coverageAmount, remainingDaily);
        
        if (finalPayout <= 0) {
            return interaction.editReply({ embeds: [ui.err('Daily limit reached', 'Daily claim limit of 500 VEX exceeded.')] });
        }
        
        try {
            await user.addVEX(finalPayout, 'safety_fund_claim');
            
            if (!activeCoverage.claims) activeCoverage.claims = [];
            activeCoverage.claims.push({
                ref_tx_id: refTxId,
                loss_amount: lossAmount,
                payout: finalPayout,
                date: new Date().toISOString()
            });
            
            await user.save(userData);
            
            const embed = ui.ok('Claim approved', 
                `Loss: ${ui.formatCurrency(lossAmount)}\n` +
                `Payout: ${ui.formatCurrency(finalPayout)}\n` +
                `Coverage: ${(activeCoverage.coverageRate * 100)}%\n` +
                `Ref: ${refTxId}`
            );
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await interaction.editReply({ embeds: [ui.err('Claim failed', error.message)] });
        }
    },

    async handleStatus(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const activeCoverage = userData.safetyFund?.filter(c => new Date(c.expiresAt) > new Date()) || [];
        const totalCoverage = activeCoverage.reduce((sum, c) => sum + c.amount, 0);
        
        const dailyUsed = userData.safetyFund?.reduce((total, coverage) => {
            if (!coverage.claims) return total;
            const todayClaims = coverage.claims.filter(claim => {
                const claimDate = new Date(claim.date);
                const today = new Date();
                return claimDate.toDateString() === today.toDateString();
            });
            return total + todayClaims.reduce((sum, claim) => sum + claim.payout, 0);
        }, 0) || 0;
        
        const remainingDaily = Math.max(0, 500 - dailyUsed);
        
        const embed = ui.info('Safety Fund Status', 
            `Active Coverage: ${ui.formatCurrency(totalCoverage)}\n` +
            `Daily Used: ${ui.formatCurrency(dailyUsed)} / 500 VEX\n` +
            `Remaining Today: ${ui.formatCurrency(remainingDaily)}\n` +
            `Coverage Rate: 50% of verified losses`
        );
        
        await interaction.editReply({ embeds: [embed] });
    }
};
