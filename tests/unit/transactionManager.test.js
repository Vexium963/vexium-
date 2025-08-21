const TransactionManager = require('../../utils/TransactionManager');
const User = require('../../database/models/User');

describe('TransactionManager', () => {
    beforeEach(async () => {
        await TransactionManager.initialize();
    });

    test('should begin transaction and stage funds', async () => {
        const userId = 'test_user_123';
        const amount = 100;
        
        const txId = await TransactionManager.begin(userId, 'test_transaction', amount);
        
        expect(txId).toBeDefined();
        expect(txId).toMatch(/^tx_\d+_[a-z0-9]+$/);
        
        const isLocked = await TransactionManager.isLocked(userId, 'test_transaction');
        expect(isLocked).toBe(true);
    });

    test('should commit transaction successfully', async () => {
        const userId = 'test_user_456';
        const amount = 50;
        
        const txId = await TransactionManager.begin(userId, 'test_commit', amount);
        const result = await TransactionManager.commit(txId);
        
        expect(result.success).toBe(true);
        expect(result.txId).toBe(txId);
        
        const isLocked = await TransactionManager.isLocked(userId, 'test_commit');
        expect(isLocked).toBe(false);
    });

    test('should rollback transaction and refund funds', async () => {
        const userId = 'test_user_789';
        const amount = 75;
        
        const txId = await TransactionManager.begin(userId, 'test_rollback', amount);
        const result = await TransactionManager.rollback(txId);
        
        expect(result.success).toBe(true);
        
        const isLocked = await TransactionManager.isLocked(userId, 'test_rollback');
        expect(isLocked).toBe(false);
    });

    test('should write ledger entries', async () => {
        const userId = 'test_user_ledger';
        
        const entry = await TransactionManager.writeLedger(userId, 'test_entry', 25, 'ref_123', 'test_meta');
        
        expect(entry.userId).toBe(userId);
        expect(entry.type).toBe('test_entry');
        expect(entry.deltaVEX).toBe(25);
        expect(entry.ref_tx_id).toBe('ref_123');
        expect(entry.meta).toBe('test_meta');
    });

    test('should retrieve ledger entries', async () => {
        const userId = 'test_user_history';
        
        await TransactionManager.writeLedger(userId, 'entry1', 10, 'ref1', 'meta1');
        await TransactionManager.writeLedger(userId, 'entry2', 20, 'ref2', 'meta2');
        
        const entries = await TransactionManager.getLedgerEntries(userId, 5);
        
        expect(entries.length).toBeGreaterThanOrEqual(2);
        expect(entries[0].userId).toBe(userId);
    });
});
