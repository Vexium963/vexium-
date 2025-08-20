module.exports = {
    COLORS: {
        PRIMARY: '#7C3AED',
        SUCCESS: '#10B981',
        WARNING: '#F59E0B',
        ERROR: '#EF4444',
        INFO: '#3B82F6',
        GOLD: '#FFD700',
        SILVER: '#C0C0C0',
        BRONZE: '#CD7F32',
        VEX: '#8B5CF6',
        TREASURY: '#059669'
    },

    EMOJIS: {
        VEX: '💜',
        COIN: '🪙',
        BANK: '🏦',
        WALLET: '👛',
        DIAMOND: '💎',
        STAR: '⭐',
        TROPHY: '🏆',
        MEDAL: '🏅',
        FIRE: '🔥',
        ROCKET: '🚀',
        CHART: '📈',
        MONEY: '💰',
        GIFT: '🎁',
        DICE: '🎲',
        SLOT: '🎰',
        CARDS: '🃏',
        WORK: '⚒️',
        SHOP: '🛍️',
        TRADE: '🤝',
        LEVEL_UP: '📈',
        ACHIEVEMENT: '🏆',
        WARNING: '⚠️',
        ERROR: '❌',
        SUCCESS: '✅',
        LOADING: '⏳',
        COOLDOWN: '⏰',
        BURN: '🔥',
        TAX: '💸',
        TREASURY: '🏛️',
        NFT: '🖼️',
        PREMIUM: '👑',
        LOTTERY: '🎟️',
        AUCTION: '🔨',
        MINING: '⛏️',
        STAKING: '🔒',
        REFERRAL: '🤝'
    },

    VEX_TOKEN: {
        SYMBOL: 'VEX',
        USD_PEGGED: true,
        DECIMALS: 2,
        STARTING_BALANCE: 10.00,
        DAILY_REWARD_BASE: 2.50,
        WORK_MULTIPLIER: 0.01
    },

    TAX_SYSTEM: {
        WITHDRAWAL: {
            BASE_RATE: 0.05,
            PREMIUM_RATE: 0.02,
            HIGH_AMOUNT_THRESHOLD: 100.00,
            HIGH_AMOUNT_RATE: 0.08,
            FREQUENT_WITHDRAWAL_PENALTY: 0.03
        },
        ENTERTAINMENT: {
            LOSS_BURN_RATE: 0.15,
            WIN_TAX_RATE: 0.02,
            HOUSE_EDGE: 0.05
        },
        TRADING: {
            TRANSACTION_FEE: 0.01,
            LARGE_TRADE_FEE: 0.02,
            LARGE_TRADE_THRESHOLD: 50.00
        },
        PURCHASE: {
            ITEM_BURN_RATE: 0.10,
            COSMETIC_BURN_RATE: 0.20,
            NFT_BURN_RATE: 0.05
        },
        LOTTERY: {
            BURN_RATE: 0.1
        },
        MINING: {
            ENERGY_BURN_RATE: 0.2,
            CLAIM_TAX_RATE: 0.05
        },
        STAKING: {
            REWARD_TAX_RATE: 0.1
        },
        REFERRAL: {
            REWARD_TAX_RATE: 0.05
        },
        POKER: {
            RAKE_RATE: 0.1
        },
        GUILD: {
            CREATION_BURN_RATE: 0.2
        }
    },

    TREASURY: {
        INITIAL_BALANCE: 10000.00,
        REWARD_POOL_ALLOCATION: 0.60,
        DEVELOPMENT_ALLOCATION: 0.25,
        MARKETING_ALLOCATION: 0.15,
        MIN_BALANCE_THRESHOLD: 1000.00
    },

    PREMIUM_TIERS: {
        BRONZE: {
            name: 'Bronze VIP',
            price: 25.00,
            benefits: {
                withdrawalTaxReduction: 0.01,
                dailyBonus: 1.25,
                workBonus: 1.15,
                entertainmentLossReduction: 0.05
            },
            badge: '🥉'
        },
        SILVER: {
            name: 'Silver VIP',
            price: 50.00,
            benefits: {
                withdrawalTaxReduction: 0.02,
                dailyBonus: 1.50,
                workBonus: 1.25,
                entertainmentLossReduction: 0.10,
                exclusiveItems: true
            },
            badge: '🥈'
        },
        GOLD: {
            name: 'Gold VIP',
            price: 100.00,
            benefits: {
                withdrawalTaxReduction: 0.03,
                dailyBonus: 2.00,
                workBonus: 1.50,
                entertainmentLossReduction: 0.15,
                exclusiveItems: true,
                prioritySupport: true
            },
            badge: '🥇'
        }
    },

    JOBS: {
        BEGINNER: [
            { id: 'cashier', name: 'Cashier', minPay: 0.50, maxPay: 1.50, requiredLevel: 1, xpReward: 10 },
            { id: 'janitor', name: 'Janitor', minPay: 0.40, maxPay: 1.20, requiredLevel: 1, xpReward: 8 },
            { id: 'delivery', name: 'Delivery Driver', minPay: 0.60, maxPay: 1.80, requiredLevel: 1, xpReward: 12 },
            { id: 'waiter', name: 'Waiter', minPay: 0.45, maxPay: 1.35, requiredLevel: 2, xpReward: 9 },
            { id: 'retail', name: 'Retail Associate', minPay: 0.55, maxPay: 1.65, requiredLevel: 2, xpReward: 11 }
        ],
        INTERMEDIATE: [
            { id: 'teacher', name: 'Teacher', minPay: 2.00, maxPay: 4.00, requiredLevel: 5, xpReward: 25 },
            { id: 'mechanic', name: 'Mechanic', minPay: 1.80, maxPay: 3.50, requiredLevel: 5, xpReward: 22 },
            { id: 'chef', name: 'Chef', minPay: 2.20, maxPay: 4.20, requiredLevel: 5, xpReward: 28 },
            { id: 'nurse', name: 'Nurse', minPay: 2.50, maxPay: 4.50, requiredLevel: 7, xpReward: 30 },
            { id: 'programmer', name: 'Programmer', minPay: 3.00, maxPay: 5.00, requiredLevel: 8, xpReward: 35 }
        ],
        ADVANCED: [
            { id: 'doctor', name: 'Doctor', minPay: 5.00, maxPay: 10.00, requiredLevel: 15, xpReward: 50 },
            { id: 'lawyer', name: 'Lawyer', minPay: 4.50, maxPay: 9.00, requiredLevel: 15, xpReward: 45 },
            { id: 'engineer', name: 'Engineer', minPay: 4.80, maxPay: 9.50, requiredLevel: 15, xpReward: 48 },
            { id: 'architect', name: 'Architect', minPay: 5.20, maxPay: 10.20, requiredLevel: 18, xpReward: 52 },
            { id: 'consultant', name: 'Consultant', minPay: 6.00, maxPay: 12.00, requiredLevel: 20, xpReward: 60 }
        ],
        EXPERT: [
            { id: 'ceo', name: 'CEO', minPay: 10.00, maxPay: 25.00, requiredLevel: 30, xpReward: 100 },
            { id: 'investor', name: 'Investor', minPay: 8.00, maxPay: 20.00, requiredLevel: 25, xpReward: 80 },
            { id: 'entrepreneur', name: 'Entrepreneur', minPay: 9.00, maxPay: 22.00, requiredLevel: 28, xpReward: 90 },
            { id: 'executive', name: 'Executive', minPay: 12.00, maxPay: 30.00, requiredLevel: 35, xpReward: 120 }
        ]
    },

    SHOP_ITEMS: {
        TOOLS: {
            laptop: { 
                name: 'Gaming Laptop', 
                price: 20.00, 
                description: 'Increases work efficiency by 15%', 
                effect: 'work_boost', 
                value: 0.15,
                burnRate: 0.10
            },
            smartphone: { 
                name: 'Smartphone Pro', 
                price: 8.00, 
                description: 'Reduces work cooldown by 10 minutes', 
                effect: 'cooldown_reduction', 
                value: 600000,
                burnRate: 0.10
            },
            car: { 
                name: 'Luxury Car', 
                price: 150.00, 
                description: 'Unlocks premium jobs and increases pay by 25%', 
                effect: 'job_unlock', 
                value: 'premium',
                burnRate: 0.05
            },
            office: {
                name: 'Home Office Setup',
                price: 75.00,
                description: 'Enables remote work with 20% bonus',
                effect: 'remote_work',
                value: 0.20,
                burnRate: 0.08
            }
        },
        CONSUMABLES: {
            energy_drink: { 
                name: 'VEX Energy', 
                price: 0.50, 
                description: 'Removes work cooldown instantly', 
                effect: 'remove_cooldown', 
                value: 'work',
                burnRate: 0.15
            },
            luck_potion: { 
                name: 'Fortune Elixir', 
                price: 2.00, 
                description: 'Increases entertainment game win rate by 10% for 1 hour', 
                effect: 'luck_boost', 
                value: 0.1,
                burnRate: 0.15
            },
            xp_booster: { 
                name: 'Knowledge Serum', 
                price: 1.50, 
                description: 'Doubles XP gain for 30 minutes', 
                effect: 'xp_boost', 
                value: 2,
                burnRate: 0.15
            },
            work_multiplier: {
                name: 'Productivity Pill',
                price: 3.00,
                description: 'Doubles next work payout',
                effect: 'work_multiplier',
                value: 2,
                burnRate: 0.15
            }
        },
        COSMETICS: {
            premium_badge: { 
                name: 'VIP Badge', 
                price: 50.00, 
                description: 'Shows VIP status on profile', 
                effect: 'badge', 
                value: 'vip',
                burnRate: 0.20
            },
            custom_color: { 
                name: 'Rainbow Theme', 
                price: 10.00, 
                description: 'Unlock custom embed colors', 
                effect: 'color_unlock', 
                value: true,
                burnRate: 0.20
            },
            avatar_frame: { 
                name: 'Golden Frame', 
                price: 30.00, 
                description: 'Decorative frame for profile avatar', 
                effect: 'avatar_frame', 
                value: 'gold',
                burnRate: 0.20
            },
            title: {
                name: 'Custom Title',
                price: 25.00,
                description: 'Set a custom title on your profile',
                effect: 'custom_title',
                value: true,
                burnRate: 0.20
            }
        },
        NFT: {
            genesis_nft: {
                name: 'Genesis NFT',
                price: 500.00,
                description: 'Exclusive Genesis collection NFT with special perks',
                effect: 'nft_genesis',
                value: 'genesis',
                burnRate: 0.05,
                supply: 100
            },
            rare_avatar: {
                name: 'Rare Avatar NFT',
                price: 200.00,
                description: 'Rare animated avatar with utility bonuses',
                effect: 'nft_avatar',
                value: 'rare',
                burnRate: 0.05,
                supply: 500
            }
        }
    },

    ENTERTAINMENT_GAMES: {
        SLOTS: {
            symbols: ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '💜'],
            payouts: {
                '💜💜💜': 100,
                '💎💎💎': 50,
                '⭐⭐⭐': 25,
                '🍇🍇🍇': 10,
                '🍊🍊🍊': 8,
                '🍋🍋🍋': 6,
                '🍒🍒🍒': 4,
                'any_two': 2
            },
            houseBurn: 0.15,
            maxPlayAmount: 50.00
        },
        DICE: {
            minRoll: 1,
            maxRoll: 6,
            winMultiplier: 2,
            houseBurn: 0.10,
            maxPlayAmount: 25.00
        },
        COINFLIP: {
            sides: ['heads', 'tails'],
            winMultiplier: 1.95,
            houseBurn: 0.05,
            maxPlayAmount: 100.00
        },
        BLACKJACK: {
            winMultiplier: 2,
            blackjackMultiplier: 2.5,
            houseBurn: 0.08,
            maxPlayAmount: 75.00
        }
    },

    ACHIEVEMENTS: [
        { id: 'first_steps', name: 'First Steps', description: 'Welcome to VexiumVerse!', reward: 1.00, icon: '👶', rarity: 'common' },
        { id: 'worker', name: 'Hard Worker', description: 'Complete 10 work sessions', reward: 5.00, icon: '⚒️', rarity: 'common' },
        { id: 'millionaire', name: 'VEX Millionaire', description: 'Reach $1,000 VEX networth', reward: 100.00, icon: '💰', rarity: 'legendary' },
        { id: 'entertainer', name: 'High Roller', description: 'Play 50 skill-based entertainment games', reward: 10.00, icon: '🎲', rarity: 'uncommon' },
        { id: 'trader', name: 'Master Trader', description: 'Complete 25 trades', reward: 20.00, icon: '🤝', rarity: 'rare' },
        { id: 'generous', name: 'Philanthropist', description: 'Send 100 gifts', reward: 50.00, icon: '🎁', rarity: 'epic' },
        { id: 'level_master', name: 'Level Legend', description: 'Reach level 50', reward: 150.00, icon: '🏆', rarity: 'legendary' },
        { id: 'daily_streak', name: 'Dedication', description: 'Maintain a 30-day daily streak', reward: 250.00, icon: '🔥', rarity: 'mythic' },
        { id: 'investor', name: 'Smart Investor', description: 'Earn $100 from investments', reward: 25.00, icon: '📈', rarity: 'rare' },
        { id: 'whale', name: 'VEX Whale', description: 'Hold $5,000 VEX at once', reward: 500.00, icon: '🐋', rarity: 'mythic' }
    ],

    INVESTMENT_TYPES: {
        CRYPTO: {
            bitcoin: { name: 'Bitcoin', symbol: 'BTC', volatility: 0.15, baseReturn: 0.08, minInvestment: 1.00 },
            ethereum: { name: 'Ethereum', symbol: 'ETH', volatility: 0.18, baseReturn: 0.12, minInvestment: 0.50 },
            vexcoin: { name: 'VexCoin', symbol: 'VXC', volatility: 0.25, baseReturn: 0.15, minInvestment: 0.10 },
            solana: { name: 'Solana', symbol: 'SOL', volatility: 0.22, baseReturn: 0.10, minInvestment: 0.25 }
        },
        STOCKS: {
            tech: { name: 'Tech Giants', symbol: 'TECH', volatility: 0.12, baseReturn: 0.10, minInvestment: 5.00 },
            healthcare: { name: 'Healthcare', symbol: 'HLTH', volatility: 0.08, baseReturn: 0.07, minInvestment: 5.00 },
            energy: { name: 'Clean Energy', symbol: 'ENRG', volatility: 0.20, baseReturn: 0.09, minInvestment: 2.50 },
            gaming: { name: 'Gaming Sector', symbol: 'GAME', volatility: 0.18, baseReturn: 0.11, minInvestment: 2.00 }
        },
        BONDS: {
            government: { name: 'Government Bonds', symbol: 'GOVT', volatility: 0.02, baseReturn: 0.03, minInvestment: 10.00 },
            corporate: { name: 'Corporate Bonds', symbol: 'CORP', volatility: 0.05, baseReturn: 0.05, minInvestment: 5.00 },
            municipal: { name: 'Municipal Bonds', symbol: 'MUNI', volatility: 0.03, baseReturn: 0.04, minInvestment: 7.50 }
        },
        REAL_ESTATE: {
            residential: { name: 'Residential Properties', symbol: 'RES', volatility: 0.06, baseReturn: 0.06, minInvestment: 50.00 },
            commercial: { name: 'Commercial Real Estate', symbol: 'COM', volatility: 0.10, baseReturn: 0.08, minInvestment: 100.00 },
            reit: { name: 'REIT Index', symbol: 'REIT', volatility: 0.08, baseReturn: 0.07, minInvestment: 25.00 }
        }
    },

    COOLDOWNS: {
        WORK: 3600000,
        DAILY: 86400000,
        ENTERTAINMENT: 30000,
        TRADE: 300000,
        GIFT: 60000,
        INVEST: 300000,
        WITHDRAW: 1800000
    },

    LIMITS: {
        MAX_PLAY_AMOUNT: 100.00,
        MAX_GIFT: 1000.00,
        MAX_TRADE: 10000.00,
        MAX_DAILY_ENTERTAINMENT: 500.00,
        MAX_INVENTORY_STACK: 999,
        MAX_WITHDRAWAL: 10000.00,
        MIN_WITHDRAWAL: 1.00
    },

    BANK_INTEREST_RATES: {
        DAILY: 0.001,
        WEEKLY: 0.005,
        MONTHLY: 0.015,
        YEARLY: 0.06,
        PREMIUM_BONUS: 0.002
    },

    LEVEL_XP_REQUIREMENTS: {
        BASE: 1000,
        MULTIPLIER: 1.2
    },

    LEADERBOARD_TYPES: [
        'networth',
        'level',
        'wallet',
        'bank',
        'totalEarned',
        'totalEntertainmentPlayed',
        'totalInvested',
        'commandsUsed',
        'gamesPlayed',
        'tradesCompleted'
    ],

    BURN_EVENTS: [
        'entertainment_loss',
        'item_purchase',
        'cosmetic_purchase',
        'failed_trade',
        'penalty_fine',
        'inactivity_tax'
    ],

    REFERRAL_SYSTEM: {
        BONUS_PERCENTAGE: 0.10,
        MAX_REFERRALS: 50,
        REFERRER_BONUS: 5.00,
        REFEREE_BONUS: 2.50
    }
};

const REFERRAL = {
    REFERRER_REWARD: 25.0, // VEX earned per successful referral
    REFEREE_BONUS: 15.0, // VEX bonus for new user using referral code
    MIN_CLAIM_AMOUNT: 10.0, // Minimum amount to claim referral rewards
    MAX_LEVEL_FOR_REFERRAL: 5 // Max level to use referral codes
};

const POKER_TOURNAMENTS = {
    MICRO: {
        name: 'Micro Stakes',
        buyIn: 10.0,
        maxPlayers: 100,
        skillLevel: 'Beginner'
    },
    LOW: {
        name: 'Low Stakes',
        buyIn: 50.0,
        maxPlayers: 50,
        skillLevel: 'Intermediate'
    },
    MID: {
        name: 'Mid Stakes',
        buyIn: 200.0,
        maxPlayers: 25,
        skillLevel: 'Advanced'
    },
    HIGH: {
        name: 'High Stakes',
        buyIn: 1000.0,
        maxPlayers: 10,
        skillLevel: 'Expert'
    }
};

const GUILD = {
    CREATION_COST: 500.0,
    MAX_MEMBERS: 50,
    MAX_OFFICERS: 5
};

const PRESTIGE = {
    MIN_LEVEL: 50,
    BASE_BONUS: 1000,
    LEVEL_MULTIPLIER: 50,
    PRESTIGE_MULTIPLIER: 500,
    EARNING_BONUS: 0.05
};

const LOTTERY = {
    TICKET_PRICE: 10.0,
    BASE_JACKPOT: 5000,
    MAX_TICKETS_PER_USER: 50,
    DRAW_DAY: 0,
    DRAW_HOUR: 20
};

const AUCTION = {
    LISTING_FEE_RATE: 0.05,
    MIN_LISTING_FEE: 1.0,
    MIN_BID_INCREMENT: 0.01,
    MAX_DURATION_HOURS: 72
};

const MINING = {
    BASE_REWARD_RATE: 0.001,
    MIN_CLAIM_AMOUNT: 0.01,
    BLOCK_REWARD: 50,
    AVERAGE_BLOCK_TIME: 10
};

const MINING_RIGS = {
    CPU_BASIC: {
        name: 'Basic CPU Miner',
        hashRate: 1.0,
        efficiency: 0.6,
        energyCost: 5.0,
        price: 100.0
    },
    CPU_ADVANCED: {
        name: 'Advanced CPU Miner',
        hashRate: 5.0,
        efficiency: 0.75,
        energyCost: 15.0,
        price: 500.0
    },
    GPU_BASIC: {
        name: 'GPU Miner',
        hashRate: 25.0,
        efficiency: 0.85,
        energyCost: 50.0,
        price: 2500.0
    },
    ASIC_BASIC: {
        name: 'ASIC Miner',
        hashRate: 100.0,
        efficiency: 0.95,
        energyCost: 150.0,
        price: 10000.0
    },
    QUANTUM: {
        name: 'Quantum Mining Rig',
        hashRate: 500.0,
        efficiency: 0.99,
        energyCost: 500.0,
        price: 100000.0
    }
};

const STAKING = {
    MIN_CLAIM_AMOUNT: 0.001,
    EARLY_WITHDRAWAL_PENALTY: 0.1
};

const STAKING_POOLS = {
    FLEXIBLE: {
        name: 'Flexible Staking',
        apy: 0.03,
        lockPeriod: null,
        minStake: 10.0,
        riskLevel: 'Low'
    },
    THIRTY_DAYS: {
        name: '30-Day Lock',
        apy: 0.05,
        lockPeriod: 30,
        minStake: 50.0,
        riskLevel: 'Low'
    },
    NINETY_DAYS: {
        name: '90-Day Lock',
        apy: 0.08,
        lockPeriod: 90,
        minStake: 100.0,
        riskLevel: 'Medium'
    },
    ONE_YEAR: {
        name: '365-Day Lock',
        apy: 0.12,
        lockPeriod: 365,
        minStake: 500.0,
        riskLevel: 'Medium'
    }
};
