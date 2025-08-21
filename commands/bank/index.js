const { SlashCommandBuilder } = require('discord.js');
const { route } = require('../../utils/router');
const ui = require('../../utils/ui');
const User = require('../../database/models/User');
const TransactionManager = require('../../utils/TransactionManager');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bank')
        .setDescription('Banking operations')
        .addSubcommand(s => s.setName('balance').setDescription('View balances'))
        .addSubcommand(s => s.setName('deposit').setDescription('Deposit VEX').addNumberOption(o => o.setName('amount').setRequired(true)))
        .addSubcommand(s => s.setName('withdraw').setDescription('Withdraw VEX').addNumberOption(o => o.setName('amount').setRequired(true)))
        .addSubcommand(s => s.setName('history').setDescription('Recent transactions'))
        .addSubcommand(s => s.setName('credit').setDescription('Credit information'))
        .addSubcommand(s => s.setName('loan').setDescription('Loan operations')
            .addStringOption(o => o.setName('action').setRequired(true).addChoices(
                { name: 'Apply', value: 'apply' },
                { name: 'View', value: 'view' },
                { name: 'Repay', value: 'repay' }
            ))
            .addNumberOption(o => o.setName('amount').setRequired(false))),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        return route(interaction, {
            balance: this.handleBalance.bind(this),
            deposit: this.handleDeposit.bind(this),
            withdraw: this.handleWithdraw.bind(this),
            history: this.handleHistory.bind(this),
            credit: this.handleCredit.bind(this),
            loan: this.handleLoan.bind(this),
            _fallback: (i) => i.editReply({ embeds: [ui.err('Unknown subcommand', 'Please use a valid banking operation.')] })
        });
    },
    
    async handleBalance(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const totalWealth = userData.bankBalance + userData.vexBalance;
        const currentLoans = userData.loans || [];
        const totalLoanAmount = currentLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
        
        const embed = ui.info('Bank Balance', 
            `Wallet: ${ui.formatCurrency(userData.vexBalance)}\n` +
            `Bank: ${ui.formatCurrency(userData.bankBalance)}\n` +
            `Total: ${ui.formatCurrency(totalWealth)}\n` +
            `Loans: ${ui.formatCurrency(totalLoanAmount)}`
        );
        
        await interaction.editReply({ embeds: [embed] });
    },
    
    async handleDeposit(interaction) {
        const amount = interaction.options.getNumber('amount');
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (amount <= 0) {
            return interaction.editReply({ embeds: [ui.err('Invalid amount', 'Amount must be positive.')] });
        }
        
        if (userData.vexBalance < amount) {
            return interaction.editReply({ embeds: [ui.err('Insufficient funds', `You only have ${ui.formatCurrency(userData.vexBalance)}.`)] });
        }
        
        let txId;
        try {
            txId = await TransactionManager.begin(interaction.user.id, 'bank_deposit', amount);
            
            userData.bankBalance += amount;
            await user.save(userData);
            
            await TransactionManager.commit(txId);
            Economics.apply({ event: 'deposit', amountVEX: amount, userId: interaction.user.id, meta: { command: 'bank' } });
            
            const embed = ui.ok('Deposit complete', 
                `+${ui.formatCurrency(amount)}\n` +
                `Bank: ${ui.formatCurrency(userData.bankBalance)}\n` +
                `Wallet: ${ui.formatCurrency(userData.vexBalance - amount)}`
            );
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            if (txId) await TransactionManager.rollback(txId);
            await interaction.editReply({ embeds: [ui.err('Deposit failed', error.message)] });
        }
    },
    
    async handleWithdraw(interaction) {
        const amount = interaction.options.getNumber('amount');
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (amount <= 0) {
            return interaction.editReply({ embeds: [ui.err('Invalid amount', 'Amount must be positive.')] });
        }
        
        if (userData.bankBalance < amount) {
            return interaction.editReply({ embeds: [ui.err('Insufficient funds', `Bank balance: ${ui.formatCurrency(userData.bankBalance)}.`)] });
        }
        
        try {
            userData.bankBalance -= amount;
            await user.addVEX(amount, 'bank_withdrawal');
            await user.save(userData);
            
            Economics.apply({ event: 'withdrawal', amountVEX: amount, userId: interaction.user.id, meta: { command: 'bank' } });
            
            const embed = ui.ok('Withdrawal complete', 
                `-${ui.formatCurrency(amount)}\n` +
                `Bank: ${ui.formatCurrency(userData.bankBalance)}\n` +
                `Wallet: ${ui.formatCurrency(userData.vexBalance + amount)}`
            );
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await interaction.editReply({ embeds: [ui.err('Withdrawal failed', error.message)] });
        }
    },
    
    async handleHistory(interaction) {
        const entries = await TransactionManager.getLedgerEntries(interaction.user.id, 5);
        
        if (entries.length === 0) {
            return interaction.editReply({ embeds: [ui.info('Transaction History', 'No recent transactions.')] });
        }
        
        const history = entries.map(entry => 
            `${entry.type}: ${entry.deltaVEX > 0 ? '+' : ''}${ui.formatCurrency(Math.abs(entry.deltaVEX))}`
        ).join('\n');
        
        const embed = ui.info('Recent Transactions', history);
        await interaction.editReply({ embeds: [embed] });
    },
    
    async handleCredit(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const creditScore = this.calculateCreditScore(userData);
        const maxLoan = this.getMaxLoanAmount(userData);
        const eligibility = this.checkLoanEligibility(userData);
        
        const embed = ui.info('Credit Information', 
            `Credit Score: ${creditScore}/850\n` +
            `Max Loan: ${ui.formatCurrency(maxLoan)}\n` +
            `Eligible: ${eligibility ? 'Yes' : 'No'}\n` +
            `Rate: 1.0% per week`
        );
        
        await interaction.editReply({ embeds: [embed] });
    },
    
    async handleLoan(interaction) {
        const action = interaction.options.getString('action');
        const amount = interaction.options.getNumber('amount');
        
        switch (action) {
            case 'apply':
                return this.handleLoanApply(interaction, amount);
            case 'view':
                return this.handleLoanView(interaction);
            case 'repay':
                return this.handleLoanRepay(interaction, amount);
        }
    },
    
    async handleLoanApply(interaction, amount) {
        if (!amount) {
            return interaction.editReply({ embeds: [ui.err('Amount required', 'Specify loan amount.')] });
        }
        
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!this.checkLoanEligibility(userData)) {
            return interaction.editReply({ embeds: [ui.err('Not eligible', 'Level ≥ 5, credit score ≥ 580 required.')] });
        }
        
        const maxLoan = this.getMaxLoanAmount(userData);
        if (amount > maxLoan) {
            return interaction.editReply({ embeds: [ui.err('Amount too high', `Max loan: ${ui.formatCurrency(maxLoan)}.`)] });
        }
        
        const activeLoans = (userData.loans || []).filter(loan => loan.status === 'active');
        if (activeLoans.length >= 3) {
            return interaction.editReply({ embeds: [ui.err('Too many loans', 'Maximum 3 active loans.')] });
        }
        
        let txId;
        try {
            txId = await TransactionManager.begin(interaction.user.id, 'loan_disbursement', amount);
            
            const loanId = `loan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            const newLoan = {
                id: loanId,
                principal: amount,
                remainingBalance: amount * 1.04,
                weeklyPayment: (amount * 1.04) / 4,
                paymentsRemaining: 4,
                appliedAt: new Date().toISOString(),
                status: 'active',
                nextPaymentDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };
            
            if (!userData.loans) userData.loans = [];
            userData.loans.push(newLoan);
            
            await user.addVEX(amount, 'loan_disbursement');
            await user.save(userData);
            
            await TransactionManager.commit(txId);
            Economics.apply({ event: 'loan', amountVEX: amount, userId: interaction.user.id, meta: { command: 'bank' } });
            
            const embed = ui.ok('Loan approved', 
                `Amount: ${ui.formatCurrency(amount)}\n` +
                `Weekly payment: ${ui.formatCurrency(newLoan.weeklyPayment)}\n` +
                `Total repayment: ${ui.formatCurrency(newLoan.remainingBalance)}\n` +
                `Loan ID: ${loanId}`
            );
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            if (txId) await TransactionManager.rollback(txId);
            await interaction.editReply({ embeds: [ui.err('Loan failed', error.message)] });
        }
    },
    
    async handleLoanView(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const activeLoans = (userData.loans || []).filter(loan => loan.status === 'active');
        
        if (activeLoans.length === 0) {
            return interaction.editReply({ embeds: [ui.info('Active Loans', 'No active loans.')] });
        }
        
        const loanList = activeLoans.map(loan => 
            `${loan.id}: ${ui.formatCurrency(loan.remainingBalance)} (${loan.paymentsRemaining} payments)`
        ).join('\n');
        
        const embed = ui.info('Active Loans', loanList);
        await interaction.editReply({ embeds: [embed] });
    },
    
    async handleLoanRepay(interaction, amount) {
        if (!amount) {
            return interaction.editReply({ embeds: [ui.err('Amount required', 'Specify repayment amount.')] });
        }
        
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (userData.vexBalance < amount) {
            return interaction.editReply({ embeds: [ui.err('Insufficient funds', `Wallet: ${ui.formatCurrency(userData.vexBalance)}.`)] });
        }
        
        const activeLoans = (userData.loans || []).filter(loan => loan.status === 'active');
        if (activeLoans.length === 0) {
            return interaction.editReply({ embeds: [ui.err('No loans', 'No active loans to repay.')] });
        }
        
        let txId;
        try {
            txId = await TransactionManager.begin(interaction.user.id, 'loan_repayment', amount);
            
            let remainingAmount = amount;
            for (const loan of activeLoans) {
                if (remainingAmount <= 0) break;
                
                const paymentAmount = Math.min(remainingAmount, loan.remainingBalance);
                loan.remainingBalance -= paymentAmount;
                remainingAmount -= paymentAmount;
                
                if (loan.remainingBalance <= 0) {
                    loan.status = 'paid';
                }
            }
            
            await user.save(userData);
            await TransactionManager.commit(txId);
            Economics.apply({ event: 'loan_repayment', amountVEX: amount, userId: interaction.user.id, meta: { command: 'bank' } });
            
            const embed = ui.ok('Payment processed', 
                `Paid: ${ui.formatCurrency(amount - remainingAmount)}\n` +
                `Remaining balance: ${ui.formatCurrency(activeLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0))}`
            );
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            if (txId) await TransactionManager.rollback(txId);
            await interaction.editReply({ embeds: [ui.err('Payment failed', error.message)] });
        }
    },
    
    calculateCreditScore(userData) {
        let score = 600;
        
        if (userData.level >= 5) score += 50;
        if (userData.level >= 10) score += 50;
        
        const loanHistory = userData.loans || [];
        const paidLoans = loanHistory.filter(loan => loan.status === 'paid');
        score += Math.min(paidLoans.length * 20, 100);
        
        const delinquentLoans = loanHistory.filter(loan => loan.status === 'delinquent');
        score -= delinquentLoans.length * 50;
        
        return Math.max(300, Math.min(850, score));
    },
    
    getMaxLoanAmount(userData) {
        const monthlyIncome = (userData.stats?.totalEarned || 0) / Math.max(1, userData.stats?.daysActive || 1) * 30;
        return Math.min(monthlyIncome * 2, 10000);
    },
    
    checkLoanEligibility(userData) {
        const creditScore = this.calculateCreditScore(userData);
        const hasDelinquency = (userData.loans || []).some(loan => loan.status === 'delinquent');
        
        return userData.level >= 5 && creditScore >= 580 && !hasDelinquency;
    }
};
