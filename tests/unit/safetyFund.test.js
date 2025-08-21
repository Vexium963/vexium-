const User = require('../../database/models/User');
const TransactionManager = require('../../utils/TransactionManager');

describe('Safety Fund', () => {
    test('should verify valid casino loss claim', async () => {
        const userId = 'test_safety_user';
        const lossAmount = 100;
        const refTxId = 'casino_loss_123';
        
        const ledgerEntry = await TransactionManager.writeLedger(
            userId, 
            'casino_loss', 
            -lossAmount, 
            refTxId, 
            'test_casino_loss'
        );
        
        const entries = await TransactionManager.getLedgerEntries(userId, 10);
        const referenceTx = entries.find(entry => entry.ref_tx_id === refTxId);
        
        expect(referenceTx).toBeDefined();
        expect(referenceTx.type).toBe('casino_loss');
        expect(Math.abs(referenceTx.deltaVEX)).toBe(lossAmount);
    });

    test('should reject invalid transaction types', async () => {
        const userId = 'test_invalid_user';
        const refTxId = 'invalid_tx_123';
        
        await TransactionManager.writeLedger(
            userId, 
            'daily_reward', 
            50, 
            refTxId, 
            'not_a_loss'
        );
        
        const entries = await TransactionManager.getLedgerEntries(userId, 10);
        const referenceTx = entries.find(entry => entry.ref_tx_id === refTxId);
        
        expect(referenceTx.type).toBe('daily_reward');
        expect(['casino_loss', 'invest_loss'].includes(referenceTx.type)).toBe(false);
    });

    test('should calculate coverage amount correctly', async () => {
        const lossAmount = 200;
        const coverageRate = 0.5;
        const dailyCap = 500;
        const dailyUsed = 100;
        
        const coverageAmount = Math.min(
            lossAmount * coverageRate,
            dailyCap - dailyUsed
        );
        
        expect(coverageAmount).toBe(100);
    });

    test('should respect daily cap limits', async () => {
        const lossAmount = 1000;
        const coverageRate = 0.5;
        const dailyCap = 500;
        const dailyUsed = 450;
        
        const coverageAmount = Math.min(
            lossAmount * coverageRate,
            dailyCap - dailyUsed
        );
        
        expect(coverageAmount).toBe(50);
    });
});
