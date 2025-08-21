describe('Loan Policy', () => {
    test('should calculate credit score correctly', () => {
        const userData = {
            level: 8,
            loans: [
                { status: 'paid' },
                { status: 'paid' },
                { status: 'active' }
            ]
        };
        
        let score = 600;
        if (userData.level >= 5) score += 50;
        if (userData.level >= 10) score += 50;
        
        const paidLoans = userData.loans.filter(loan => loan.status === 'paid');
        score += Math.min(paidLoans.length * 20, 100);
        
        const delinquentLoans = userData.loans.filter(loan => loan.status === 'delinquent');
        score -= delinquentLoans.length * 50;
        
        const finalScore = Math.max(300, Math.min(850, score));
        
        expect(finalScore).toBe(690);
    });

    test('should check loan eligibility correctly', () => {
        const userData = {
            level: 6,
            loans: [{ status: 'active' }]
        };
        
        const creditScore = 650;
        const hasDelinquency = userData.loans.some(loan => loan.status === 'delinquent');
        
        const isEligible = userData.level >= 5 && creditScore >= 580 && !hasDelinquency;
        
        expect(isEligible).toBe(true);
    });

    test('should calculate max loan amount', () => {
        const userData = {
            stats: {
                totalEarned: 3000,
                daysActive: 30
            }
        };
        
        const monthlyIncome = (userData.stats.totalEarned || 0) / Math.max(1, userData.stats.daysActive || 1) * 30;
        const maxLoan = Math.min(monthlyIncome * 2, 10000);
        
        expect(maxLoan).toBe(6000);
    });

    test('should enforce maximum active loans', () => {
        const userData = {
            loans: [
                { status: 'active' },
                { status: 'active' },
                { status: 'active' }
            ]
        };
        
        const activeLoans = userData.loans.filter(loan => loan.status === 'active');
        const canTakeNewLoan = activeLoans.length < 3;
        
        expect(canTakeNewLoan).toBe(false);
    });

    test('should calculate loan terms correctly', () => {
        const principal = 1000;
        const interestRate = 0.01;
        const termWeeks = 4;
        
        const totalRepayment = principal * (1 + interestRate * termWeeks);
        const weeklyPayment = totalRepayment / termWeeks;
        
        expect(totalRepayment).toBe(1040);
        expect(weeklyPayment).toBe(260);
    });
});
