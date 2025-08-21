const { Client, GatewayIntentBits } = require('discord.js');
const User = require('../../database/models/User');
const Economics = require('../../utils/economics');

describe('User Flow Integration Tests', () => {
    let mockInteraction;
    let testUserId = 'test_user_123';

    beforeEach(() => {
        mockInteraction = {
            user: { id: testUserId },
            options: {
                getSubcommand: jest.fn(),
                getString: jest.fn(),
                getInteger: jest.fn()
            },
            reply: jest.fn(),
            deferReply: jest.fn(),
            editReply: jest.fn(),
            followUp: jest.fn()
        };
        
        Economics.resetPriceEngine();
    });

    test('New user onboarding flow', async () => {
        const user = new User(testUserId);
        const userData = await user.load();
        
        expect(userData.vexBalance).toBe(0);
        expect(userData.level).toBe(1);
        expect(userData.linkedWallets).toEqual({});
        
        userData.linkedWallets = { metamask: 'test_wallet_address' };
        await user.save(userData);
        
        await user.addVEX(100, 'welcome_bonus');
        const updatedData = await user.load();
        expect(updatedData.vexBalance).toBe(100);
    });

    test('Work → Bank deposit → Investment flow', async () => {
        const user = new User(testUserId);
        let userData = await user.load();
        
        await user.addVEX(1000, 'test_setup');
        
        const workPay = 50;
        await user.addVEX(workPay, 'work_payment');
        userData = await user.load();
        expect(userData.vexBalance).toBe(1050);
        
        const depositAmount = 500;
        userData.bankBalance = (userData.bankBalance || 0) + depositAmount;
        userData.vexBalance -= depositAmount;
        await user.save(userData);
        
        userData = await user.load();
        expect(userData.bankBalance).toBe(500);
        expect(userData.vexBalance).toBe(550);
        
        const investAmount = 200;
        userData.investments = userData.investments || {};
        userData.investments.crypto = (userData.investments.crypto || 0) + investAmount;
        userData.vexBalance -= investAmount;
        await user.save(userData);
        
        userData = await user.load();
        expect(userData.investments.crypto).toBe(200);
        expect(userData.vexBalance).toBe(350);
    });

    test('Business purchase and portfolio management', async () => {
        const user = new User(testUserId);
        await user.addVEX(10000, 'test_setup');
        
        let userData = await user.load();
        
        const businessCost = 5000;
        userData.businesses = userData.businesses || {};
        userData.businesses.tech_startup = {
            level: 1,
            purchaseDate: new Date().toISOString(),
            totalInvested: businessCost,
            monthlyRevenue: 500
        };
        userData.vexBalance -= businessCost;
        await user.save(userData);
        
        userData = await user.load();
        expect(userData.businesses.tech_startup).toBeDefined();
        expect(userData.businesses.tech_startup.totalInvested).toBe(5000);
        expect(userData.vexBalance).toBe(5000);
    });

    test('Gambling with transaction safety', async () => {
        const user = new User(testUserId);
        await user.addVEX(1000, 'test_setup');
        
        const betAmount = 100;
        
        const removeResult = await user.removeVEX(betAmount, 'entertainment_game', false);
        expect(removeResult.success).toBe(true);
        
        let userData = await user.load();
        expect(userData.vexBalance).toBe(900);
        
        const payout = 200;
        await user.addVEX(payout, 'entertainment_win');
        
        userData = await user.load();
        expect(userData.vexBalance).toBe(1100);
    });

    test('Marketplace escrow system', async () => {
        const seller = new User('seller_123');
        const buyer = new User('buyer_456');
        
        await seller.addVEX(0, 'test_setup');
        await buyer.addVEX(1000, 'test_setup');
        
        const itemPrice = 500;
        let sellerData = await seller.load();
        sellerData.marketplaceListings = sellerData.marketplaceListings || {};
        sellerData.marketplaceListings.item_001 = {
            price: itemPrice,
            item: 'rare_nft',
            status: 'active'
        };
        await seller.save(sellerData);
        
        let buyerData = await buyer.load();
        buyerData.vexBalance -= itemPrice;
        buyerData.escrowTransactions = buyerData.escrowTransactions || {};
        buyerData.escrowTransactions.tx_001 = {
            amount: itemPrice,
            seller: 'seller_123',
            item: 'rare_nft',
            status: 'pending'
        };
        await buyer.save(buyerData);
        
        buyerData = await buyer.load();
        expect(buyerData.vexBalance).toBe(500);
        expect(buyerData.escrowTransactions.tx_001.amount).toBe(500);
    });
});
