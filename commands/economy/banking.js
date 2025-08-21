const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banking')
        .setDescription(`💸 Advanced banking empire - Build wealth through smart financial decisions!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('loan')
                .setDescription(`🔥 Unlock instant capital - Fuel your empire's growth!`)
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription(`✨ Choose your wealth-building strategy`)
                        .setRequired(true)
                        .addChoices(
                            { name: 'Apply for Loan', value: 'apply' },
                            { name: 'View Active Loans', value: 'view' },
                            { name: 'Make Payment', value: 'pay' },
                            { name: 'Loan Calculator', value: 'calculate' }))
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription(`💸 Investment amount - Every VEX counts toward your empire!`)
                        .setRequired(false)
                        .setMinValue(100)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('credit')
                .setDescription(`📈 Unlock your financial power - See what you're capable of!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('savings')
                .setDescription(`⬆️ Build your wealth fortress - Every goal brings you closer to financial freedom!`)
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription(`🚀 Accelerate your wealth journey`)
                        .setRequired(true)
                        .addChoices(
                            { name: 'Create Savings Goal', value: 'create' },
                            { name: 'View Goals', value: 'view' },
                            { name: 'Add to Goal', value: 'add' },
                            { name: 'Withdraw from Goal', value: 'withdraw' }))
                .addStringOption(option =>
                    option.setName('goal_name')
                        .setDescription(`🏆 Name your empire's next milestone`)
                        .setRequired(false))
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription(`💥 Power up your savings - Every VEX multiplies your potential!`)
                        .setRequired(false)
                        .setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('financial-advisor')
                .setDescription(`🌈 Unlock millionaire strategies - Get AI-powered wealth advice!`)),
    
    cooldown: 30,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'banking', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now()
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(interaction.user.id, 'banking', behaviorContext);
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        const netWorth = userData.networth || 0;
        const isWhale = netWorth >= 50000;
        const isRising = (userData.stats.bankingStreak || 0) >= 3;
        
        let motivationalMessage = '';
        if (isWhale) {
            motivationalMessage = '🐋 **FINANCIAL WHALE DETECTED!** Your empire grows stronger!';
        } else if (isRising) {
            motivationalMessage = '🚀 **FINANCIAL MOMENTUM!** You\'re building serious wealth!';
        } else if (netWorth >= 1000) {
            motivationalMessage = '💎 **WEALTH BUILDER!** Every decision shapes your empire!';
        } else {
            motivationalMessage = '🌟 **FUTURE MILLIONAIRE!** Your journey to wealth starts here!';
        }
        
        userData.stats.bankingStreak = (userData.stats.bankingStreak || 0) + 1;
        userData.stats.commandsUsed++;
        await user.save(userData);
        
        switch (subcommand) {
            case 'loan':
                return this.handleLoan(interaction, motivationalMessage);
            case 'credit':
                return this.handleCredit(interaction, motivationalMessage);
            case 'savings':
                return this.handleSavings(interaction, motivationalMessage);
            case 'financial-advisor':
                return this.handleFinancialAdvisor(interaction, motivationalMessage);
        }
    },
    
    async handleLoan(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const action = interaction.options.getString('action');
        const amount = interaction.options.getNumber('amount');
        
        switch (action) {
            case 'apply':
                return this.handleLoanApplication(interaction, userData, user, amount);
            case 'view':
                return this.handleViewLoans(interaction, userData);
            case 'pay':
                return this.handleLoanPayment(interaction, userData, user, amount);
            case 'calculate':
                return this.handleLoanCalculator(interaction, amount);
        }
    },
    
    async handleLoanApplication(interaction, userData, user, amount) {
        if (!amount) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Amount Required`)
                .setDescription(`⏳ **EMPIRE EXPANSION AWAITS!**\n\nSpecify your loan amount to unlock instant capital for your Vex...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const creditScore = this.calculateCreditScore(userData);
        const maxLoanAmount = this.getMaxLoanAmount(creditScore, userData);
        
        if (amount > maxLoanAmount) {
            const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 20);
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Loan Amount Too High`)
                .setDescription(`${constants.ANIMATED_EMOJIS.CHART} **CREDIT POWER ANALYSIS**\n\nYour current empire strength allo...`)
                .addFields(
                    { name: '💡 Improve Your Credit', value: '• Make timely payments\n• Maintain low debt-to-income ratio\n• Build transaction history\n• Complete achievements', inline: false }
                )
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (!userData.loans) userData.loans = [];
        
        const activeLoans = userData.loans.filter(loan => loan.status === 'active');
        if (activeLoans.length >= 3) {
            const nearMiss = constants.NEAR_MISS_MESSAGES[Math.floor(Math.random() * constants.NEAR_MISS_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Maximum Loans Reached`)
                .setDescription(`You can have a maximum of 3 active loans at once.\n\nPay off existing loans to apply for new ones...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const interestRate = this.getInterestRate(creditScore);
        const termMonths = 12; // Fixed 12-month term
        const monthlyPayment = this.calculateMonthlyPayment(amount, interestRate, termMonths);
        const totalRepayment = monthlyPayment * termMonths;
        
        const loanId = this.generateLoanId();
        const newLoan = {
            id: loanId,
            principal: amount,
            interestRate: interestRate,
            termMonths: termMonths,
            monthlyPayment: monthlyPayment,
            totalRepayment: totalRepayment,
            remainingBalance: totalRepayment,
            paymentsRemaining: termMonths,
            appliedAt: new Date().toISOString(),
            status: 'active',
            nextPaymentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        userData.loans.push(newLoan);
        await user.addVEX(amount, 'loan_disbursement');
        
        userData.stats.loansApplied = (userData.stats.loansApplied || 0) + 1;
        userData.stats.totalBorrowed = (userData.stats.totalBorrowed || 0) + amount;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        const milestoneMessage = userData.stats.loansApplied >= 5 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 75) + 25);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Loan Approved!`)
            .setDescription(`Your loan application has been approved and funds have been disbursed!${variableReward ? `\n\n${variableReward}` : ''}${milestoneMessage ? `\n\n${milestoneMessage}` : ''}\n\n${socialProof}`)
            .addFields(
                { name: '🆔 Loan ID', value: loanId, inline: true },
                { name: '💰 Loan Amount', value: `${amount.toFixed(2)} VEX`, inline: true },
                { name: '📊 Interest Rate', value: `${(interestRate * 100).toFixed(2)}% APR`, inline: true },
                { name: '📅 Term', value: `${termMonths} months`, inline: true },
                { name: '💳 Monthly Payment', value: `${monthlyPayment.toFixed(2)} VEX`, inline: true },
                { name: '💸 Total Repayment', value: `${totalRepayment.toFixed(2)} VEX`, inline: true },
                { name: '📈 Credit Score', value: `${creditScore}/850`, inline: true },
                { name: '💼 New Balance', value: `${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '📅 First Payment Due', value: '<t:' + Math.floor(new Date(newLoan.nextPaymentDue).getTime() / 1000) + ':R>', inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `Loan #${loanId} • Make timely payments to improve your credit score` })
            .setTimestamp();
        
        const paymentButton = new ButtonBuilder()
            .setCustomId(`banking_loan_pay_${loanId}`)
            .setLabel('Make Payment')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💳');
        
        const loansButton = new ButtonBuilder()
            .setCustomId('banking_view_loans')
            .setLabel('View All Loans')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📊');
        
        const row = new ActionRowBuilder().addComponents(paymentButton, loansButton);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Loan Progress: ${amount.toFixed(2)} VEX`,
            1.0,
            constants.COLORS.SUCCESS
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleCredit(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const creditScore = this.calculateCreditScore(userData);
        const creditRating = this.getCreditRating(creditScore);
        const maxLoanAmount = this.getMaxLoanAmount(creditScore, userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CREDIT} ${interaction.user.displayName}'s Credit Report`)
            .setDescription('Your financial creditworthiness and borrowing capacity')
            .addFields(
                { name: '📊 Credit Score', value: `**${creditScore}/850**\n${creditRating}`, inline: true },
                { name: '💰 Max Loan Amount', value: `${maxLoanAmount.toFixed(2)} VEX`, inline: true },
                { name: '📈 Interest Rate', value: `${(this.getInterestRate(creditScore) * 100).toFixed(2)}% APR`, inline: true },
                { name: '🏦 Credit Factors', value: this.getCreditFactors(userData), inline: false },
                { name: '📋 Credit History', value: this.getCreditHistory(userData), inline: false },
                { name: '💡 Improvement Tips', value: this.getCreditTips(creditScore), inline: false }
            )
            .setColor(this.getCreditColor(creditScore))
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: 'Credit score updates daily based on your financial activity' })
            .setTimestamp();
        
        const loanButton = new ButtonBuilder()
            .setCustomId('banking_loan_apply')
            .setLabel('Apply for Loan')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💰');
        
        const historyButton = new ButtonBuilder()
            .setCustomId('banking_credit_history')
            .setLabel('Detailed History')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📋');
        
        const row = new ActionRowBuilder().addComponents(loanButton, historyButton);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Credit Score: ${creditScore}/850`,
            creditScore / 850,
            this.getCreditColor(creditScore)
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleFinancialAdvisor(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const analysis = this.analyzeFinancialHealth(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.ADVISOR} Personal Financial Advisor`)
            .setDescription(`Personalized financial advice for ${interaction.user.displayName}`)
            .addFields(
                { name: '📊 Financial Health Score', value: `**${analysis.healthScore}/100**\n${analysis.healthRating}`, inline: true },
                { name: '💰 Net Worth', value: `${(userData.networth || 0).toFixed(2)} VEX`, inline: true },
                { name: '📈 Monthly Growth', value: `${analysis.monthlyGrowth >= 0 ? '+' : ''}${analysis.monthlyGrowth.toFixed(1)}%`, inline: true },
                { name: '🎯 Recommendations', value: analysis.recommendations, inline: false },
                { name: '⚠️ Risk Assessment', value: analysis.riskAssessment, inline: false },
                { name: '📋 Action Plan', value: analysis.actionPlan, inline: false }
            )
            .setColor(analysis.healthScore >= 70 ? constants.COLORS.SUCCESS : analysis.healthScore >= 40 ? constants.COLORS.WARNING : constants.COLORS.ERROR)
            .setFooter({ text: 'Financial advice updates based on your activity and goals' })
            .setTimestamp();
        
        const savingsButton = new ButtonBuilder()
            .setCustomId('banking_savings_create')
            .setLabel('Create Savings Goal')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎯');
        
        const investButton = new ButtonBuilder()
            .setCustomId('investment_portfolio')
            .setLabel('Investment Options')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📈');
        
        const budgetButton = new ButtonBuilder()
            .setCustomId('banking_budget_planner')
            .setLabel('Budget Planner')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📊');
        
        const row = new ActionRowBuilder().addComponents(savingsButton, investButton, budgetButton);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Financial Health: ${analysis.healthScore}/100`,
            analysis.healthScore / 100,
            analysis.healthScore >= 70 ? constants.COLORS.SUCCESS : analysis.healthScore >= 40 ? constants.COLORS.WARNING : constants.COLORS.ERROR
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    calculateCreditScore(userData) {
        let score = 300; // Base score
        
        const paymentHistory = userData.stats.loanPayments || 0;
        score += Math.min(paymentHistory * 5, 175);
        
        const accountAge = userData.stats.daysActive || 1;
        score += Math.min(accountAge * 2, 75);
        
        const totalDebt = (userData.loans || []).reduce((sum, loan) => sum + loan.remainingBalance, 0);
        const creditLimit = userData.vexBalance + totalDebt;
        const utilization = creditLimit > 0 ? totalDebt / creditLimit : 0;
        score += Math.max(150 - (utilization * 300), 0);
        
        const transactions = userData.stats.commandsUsed || 0;
        score += Math.min(transactions * 0.5, 50);
        
        const achievements = (userData.achievements || []).length;
        score += Math.min(achievements * 5, 50);
        
        return Math.min(Math.max(Math.round(score), 300), 850);
    },
    
    getCreditRating(score) {
        if (score >= 800) return '🌟 Excellent';
        if (score >= 740) return '✅ Very Good';
        if (score >= 670) return '👍 Good';
        if (score >= 580) return '⚠️ Fair';
        return '❌ Poor';
    },
    
    getMaxLoanAmount(creditScore, userData) {
        const baseAmount = 1000;
        const scoreMultiplier = creditScore / 300;
        const balanceMultiplier = Math.min((userData.vexBalance || 0) / 1000, 5);
        
        return Math.round(baseAmount * scoreMultiplier * balanceMultiplier);
    },
    
    getInterestRate(creditScore) {
        if (creditScore >= 800) return 0.05; // 5%
        if (creditScore >= 740) return 0.08; // 8%
        if (creditScore >= 670) return 0.12; // 12%
        if (creditScore >= 580) return 0.18; // 18%
        return 0.25; // 25%
    },
    
    calculateMonthlyPayment(principal, annualRate, months) {
        const monthlyRate = annualRate / 12;
        if (monthlyRate === 0) return principal / months;
        
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    },
    
    getCreditFactors(userData) {
        const factors = [];
        
        if ((userData.stats.loanPayments || 0) > 10) factors.push('✅ Good payment history');
        else factors.push('⚠️ Limited payment history');
        
        if ((userData.stats.daysActive || 0) > 30) factors.push('✅ Established account');
        else factors.push('⚠️ New account');
        
        if ((userData.vexBalance || 0) > 5000) factors.push('✅ Strong financial position');
        else factors.push('⚠️ Building financial stability');
        
        return factors.join('\n');
    },
    
    getCreditHistory(userData) {
        const loans = userData.loans || [];
        const activeLoans = loans.filter(l => l.status === 'active').length;
        const paidLoans = loans.filter(l => l.status === 'paid').length;
        
        return `**Active Loans**: ${activeLoans}\n**Paid Loans**: ${paidLoans}\n**Total Payments**: ${userData.stats.loanPayments || 0}`;
    },
    
    getCreditTips(score) {
        if (score >= 740) return '• Maintain current habits\n• Consider premium investments\n• Explore business loans';
        if (score >= 580) return '• Make timely payments\n• Reduce debt utilization\n• Build transaction history';
        return '• Focus on payment history\n• Start with small loans\n• Complete achievements';
    },
    
    getCreditColor(score) {
        if (score >= 740) return constants.COLORS.SUCCESS;
        if (score >= 580) return constants.COLORS.WARNING;
        return constants.COLORS.ERROR;
    },
    
    analyzeFinancialHealth(userData) {
        const netWorth = userData.networth || 0;
        const balance = userData.vexBalance || 0;
        const debt = (userData.loans || []).reduce((sum, loan) => sum + loan.remainingBalance, 0);
        
        let healthScore = 50; // Base score
        
        if (netWorth > 50000) healthScore += 25;
        else if (netWorth > 10000) healthScore += 15;
        else if (netWorth > 1000) healthScore += 10;
        
        const debtRatio = balance > 0 ? debt / balance : 0;
        if (debtRatio < 0.3) healthScore += 15;
        else if (debtRatio < 0.5) healthScore += 5;
        else healthScore -= 10;
        
        const hasInvestments = (userData.investments && Object.keys(userData.investments).length > 0);
        const hasRealEstate = (userData.realEstate && userData.realEstate.length > 0);
        const hasCrypto = (userData.crypto && Object.keys(userData.crypto).length > 0);
        
        if (hasInvestments) healthScore += 5;
        if (hasRealEstate) healthScore += 5;
        if (hasCrypto) healthScore += 5;
        
        healthScore = Math.min(Math.max(healthScore, 0), 100);
        
        const healthRating = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Improvement';
        
        return {
            healthScore,
            healthRating,
            monthlyGrowth: Math.random() * 10 - 2, // Simulated growth
            recommendations: this.getRecommendations(userData, healthScore),
            riskAssessment: this.getRiskAssessment(userData),
            actionPlan: this.getActionPlan(userData, healthScore)
        };
    },
    
    getRecommendations(userData, healthScore) {
        const recommendations = [];
        
        if (healthScore < 60) {
            recommendations.push('• Build emergency fund (3-6 months expenses)');
            recommendations.push('• Reduce high-interest debt');
        }
        
        if (!(userData.investments && Object.keys(userData.investments).length > 0)) {
            recommendations.push('• Start investing in diversified portfolio');
        }
        
        if (!(userData.realEstate && userData.realEstate.length > 0)) {
            recommendations.push('• Consider real estate for passive income');
        }
        
        recommendations.push('• Set up automatic savings goals');
        
        return recommendations.slice(0, 4).join('\n');
    },
    
    getRiskAssessment(userData) {
        const debt = (userData.loans || []).reduce((sum, loan) => sum + loan.remainingBalance, 0);
        const balance = userData.vexBalance || 0;
        
        if (debt > balance * 0.8) return '🔴 High Risk - High debt levels';
        if (debt > balance * 0.5) return '🟡 Medium Risk - Moderate debt';
        return '🟢 Low Risk - Healthy financial position';
    },
    
    getActionPlan(userData, healthScore) {
        if (healthScore >= 80) return '• Maintain current strategy\n• Explore advanced investments\n• Consider wealth preservation';
        if (healthScore >= 60) return '• Increase savings rate\n• Diversify investments\n• Plan for major goals';
        return '• Create budget plan\n• Build emergency fund\n• Focus on debt reduction';
    },
    
    generateLoanId() {
        return 'LOAN' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    }
};
