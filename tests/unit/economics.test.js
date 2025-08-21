const Economics = require('../../utils/economics');
const TransactionManager = require('../../utils/TransactionManager');

describe('Economics System', () => {
    beforeEach(() => {
        Economics.resetPriceEngine();
    });

    test('Economics.apply() should update VEX price correctly', () => {
        const initialPrice = Economics.getCurrentVEXPrice();
        
        Economics.apply({
            event: 'sell',
            amountVEX: 1000,
            userId: 'test123',
            meta: { command: 'test' }
        });
        
        const newPrice = Economics.getCurrentVEXPrice();
        expect(newPrice).not.toBe(initialPrice);
    });

    test('Price impact should be proportional to transaction size', () => {
        const initialPrice = Economics.getCurrentVEXPrice();
        
        Economics.apply({ event: 'sell', amountVEX: 100, userId: 'test1' });
        const smallImpactPrice = Economics.getCurrentVEXPrice();
        
        Economics.resetPriceEngine();
        
        Economics.apply({ event: 'sell', amountVEX: 10000, userId: 'test2' });
        const largeImpactPrice = Economics.getCurrentVEXPrice();
        
        const smallImpact = Math.abs(smallImpactPrice - initialPrice);
        const largeImpact = Math.abs(largeImpactPrice - initialPrice);
        
        expect(largeImpact).toBeGreaterThan(smallImpact);
    });

    test('Buy and sell events should have opposite price effects', () => {
        const initialPrice = Economics.getCurrentVEXPrice();
        
        Economics.apply({ event: 'buy', amountVEX: 1000, userId: 'test1' });
        const buyPrice = Economics.getCurrentVEXPrice();
        
        Economics.resetPriceEngine();
        
        Economics.apply({ event: 'sell', amountVEX: 1000, userId: 'test2' });
        const sellPrice = Economics.getCurrentVEXPrice();
        
        if (buyPrice > initialPrice) {
            expect(sellPrice).toBeLessThan(initialPrice);
        } else {
            expect(sellPrice).toBeGreaterThan(initialPrice);
        }
    });
});

describe('TransactionManager', () => {
    test('Transaction lifecycle should work correctly', async () => {
        const txId = await TransactionManager.begin('test123', 'gambling', 100);
        expect(txId).toBeDefined();
        
        const result = await TransactionManager.commit(txId);
        expect(result.success).toBe(true);
    });

    test('Rollback should work for failed transactions', async () => {
        const txId = await TransactionManager.begin('test123', 'gambling', 100);
        
        const result = await TransactionManager.rollback(txId);
        expect(result.success).toBe(true);
    });

    test('Concurrent transactions should be prevented', async () => {
        const txId1 = await TransactionManager.begin('test123', 'gambling', 100);
        
        await expect(
            TransactionManager.begin('test123', 'gambling', 50)
        ).rejects.toThrow('Transaction already in progress');
        
        await TransactionManager.commit(txId1);
    });
});
