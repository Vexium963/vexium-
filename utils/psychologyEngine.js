const EventEmitter = require('events');

class PsychologyEngine extends EventEmitter {
    constructor() {
        super();
        this.userBehaviorPatterns = new Map();
        this.engagementTriggers = {
            FOMO: ['limited_time', 'exclusive_offer', 'last_chance'],
            SOCIAL_PROOF: ['trending', 'popular', 'others_bought'],
            ACHIEVEMENT: ['milestone', 'badge_unlock', 'level_up'],
            VARIABLE_REWARD: ['mystery_box', 'random_bonus', 'surprise_gift'],
            PROGRESS: ['almost_there', 'next_level', 'completion'],
            COMPETITION: ['leaderboard', 'ranking', 'beat_friends']
        };
    }

    analyzeUserBehavior(userId, action, context = {}) {
        if (!this.userBehaviorPatterns.has(userId)) {
            this.userBehaviorPatterns.set(userId, {
                sessionCount: 0,
                totalCommands: 0,
                favoriteCommands: new Map(),
                engagementScore: 0,
                lastActive: Date.now(),
                behaviorTriggers: new Set(),
                spendingPattern: 'conservative',
                riskTolerance: 'low',
                socialEngagement: 'low',
                achievementMotivation: 'medium'
            });
        }

        const pattern = this.userBehaviorPatterns.get(userId);
        pattern.totalCommands++;
        pattern.lastActive = Date.now();

        if (!pattern.favoriteCommands.has(action)) {
            pattern.favoriteCommands.set(action, 0);
        }
        pattern.favoriteCommands.set(action, pattern.favoriteCommands.get(action) + 1);

        this.updateEngagementScore(userId, action, context);
        this.identifyBehaviorTriggers(userId, action, context);
        
        return this.generatePersonalizedExperience(userId);
    }

    updateEngagementScore(userId, action, context) {
        const pattern = this.userBehaviorPatterns.get(userId);
        let scoreChange = 0;

        const highEngagementActions = ['shop', 'gamble', 'invest', 'trade', 'work'];
        const socialActions = ['gift', 'trade', 'leaderboard', 'profile'];
        const achievementActions = ['daily', 'achievements', 'progression'];

        if (highEngagementActions.includes(action)) scoreChange += 5;
        if (socialActions.includes(action)) scoreChange += 3;
        if (achievementActions.includes(action)) scoreChange += 2;

        if (context.consecutiveUse) scoreChange += 2;
        if (context.quickReturn && context.timeSinceLastUse < 300000) scoreChange += 3;

        pattern.engagementScore = Math.max(0, Math.min(100, pattern.engagementScore + scoreChange));
    }

    identifyBehaviorTriggers(userId, action, context) {
        const pattern = this.userBehaviorPatterns.get(userId);

        if (action === 'shop' && context.purchaseAmount > 100) {
            pattern.spendingPattern = 'high_roller';
            pattern.behaviorTriggers.add('premium_offers');
        }

        if (['gamble', 'lottery', 'roulette'].includes(action)) {
            pattern.riskTolerance = context.amount > 50 ? 'high' : 'medium';
            pattern.behaviorTriggers.add('risk_rewards');
        }

        if (['gift', 'trade', 'leaderboard'].includes(action)) {
            pattern.socialEngagement = 'high';
            pattern.behaviorTriggers.add('social_features');
        }

        if (['achievements', 'progression', 'daily'].includes(action)) {
            pattern.achievementMotivation = 'high';
            pattern.behaviorTriggers.add('achievement_chains');
        }
    }

    generatePersonalizedExperience(userId) {
        const pattern = this.userBehaviorPatterns.get(userId);
        const recommendations = {
            urgencyMessages: [],
            personalizedOffers: [],
            motivationalContent: [],
            socialElements: [],
            nextActions: []
        };

        if (pattern.behaviorTriggers.has('premium_offers')) {
            recommendations.urgencyMessages.push("🔥 VIP exclusive deals expire in 2 hours!");
            recommendations.personalizedOffers.push({
                type: 'premium_bundle',
                discount: 25,
                reason: 'Based on your premium purchases'
            });
        }

        if (pattern.behaviorTriggers.has('risk_rewards')) {
            recommendations.motivationalContent.push("🎲 Your luck is building up - perfect time for a big play!");
            recommendations.nextActions.push('high_stakes_game');
        }

        if (pattern.behaviorTriggers.has('social_features')) {
            recommendations.socialElements.push("👥 3 friends are currently online - challenge them!");
            recommendations.nextActions.push('social_competition');
        }

        if (pattern.behaviorTriggers.has('achievement_chains')) {
            recommendations.motivationalContent.push("🏆 You're 80% to your next achievement - don't stop now!");
            recommendations.nextActions.push('achievement_progress');
        }

        if (pattern.engagementScore > 70) {
            recommendations.urgencyMessages.push("⚡ You're on fire! Keep the momentum going!");
        } else if (pattern.engagementScore < 30) {
            recommendations.motivationalContent.push("🌟 Come back stronger - your empire awaits!");
        }

        return recommendations;
    }

    createFOMOElements(userData, context = {}) {
        const fomoElements = [];
        const now = new Date();
        const hour = now.getHours();

        if (hour >= 18 && hour <= 23) {
            fomoElements.push({
                type: 'time_limited',
                message: '🔥 FLASH SALE: 25% off all items - ends at midnight!',
                urgency: 'high',
                timeLeft: this.getTimeUntilMidnight()
            });
        }

        if (userData.dailyStreak > 0 && !userData.dailyClaimedToday) {
            fomoElements.push({
                type: 'streak_risk',
                message: `⚠️ Your ${userData.dailyStreak}-day streak expires in ${this.getTimeUntilMidnight()}!`,
                urgency: 'critical',
                action: 'claim_daily'
            });
        }

        const randomEvents = [
            { message: '🎁 Mystery boxes 50% off - limited stock!', chance: 0.1 },
            { message: '💎 Rare items spotted in shop - grab them quick!', chance: 0.05 },
            { message: '🏆 Double XP weekend starting soon!', chance: 0.15 }
        ];

        randomEvents.forEach(event => {
            if (Math.random() < event.chance) {
                fomoElements.push({
                    type: 'random_event',
                    message: event.message,
                    urgency: 'medium'
                });
            }
        });

        return fomoElements;
    }

    createSocialProofElements(userData, globalStats = {}) {
        const socialProof = [];

        if (globalStats.activeUsers > 100) {
            socialProof.push({
                type: 'activity',
                message: `🔥 ${globalStats.activeUsers} players online right now!`,
                engagement: 'high'
            });
        }

        if (globalStats.recentPurchases) {
            const recentItem = globalStats.recentPurchases[0];
            socialProof.push({
                type: 'purchase_activity',
                message: `💰 Someone just bought ${recentItem.name} for $${recentItem.price}!`,
                engagement: 'medium'
            });
        }

        if (userData.networth > 1000) {
            const percentile = this.calculatePercentile(userData.networth, globalStats.networthDistribution);
            socialProof.push({
                type: 'ranking',
                message: `📈 You're richer than ${percentile}% of all players!`,
                engagement: 'high'
            });
        }

        return socialProof;
    }

    createVariableRewardSystem(userId, action) {
        const pattern = this.userBehaviorPatterns.get(userId);
        const rewards = [];

        const baseReward = this.calculateBaseReward(action);
        const multiplier = this.calculateRewardMultiplier(pattern);
        
        const shouldGetBonus = Math.random() < this.getBonusChance(pattern);
        
        if (shouldGetBonus) {
            const bonusTypes = ['vex_bonus', 'xp_bonus', 'item_bonus', 'mystery_box'];
            const bonusType = bonusTypes[Math.floor(Math.random() * bonusTypes.length)];
            
            rewards.push({
                type: bonusType,
                amount: baseReward * multiplier,
                message: this.getBonusMessage(bonusType),
                rarity: this.getBonusRarity(multiplier)
            });
        }

        if (pattern.totalCommands % 50 === 0) {
            rewards.push({
                type: 'milestone_bonus',
                amount: pattern.totalCommands * 2,
                message: `🎉 Milestone reached! ${pattern.totalCommands} commands completed!`,
                rarity: 'epic'
            });
        }

        return rewards;
    }

    createProgressionHooks(userData) {
        const hooks = [];
        const currentXP = userData.xp || 0;
        const currentLevel = userData.level || 1;
        const nextLevelXP = this.getXPForLevel(currentLevel + 1);
        const progress = (currentXP / nextLevelXP) * 100;

        if (progress >= 90) {
            hooks.push({
                type: 'almost_level_up',
                message: '🚀 SO CLOSE! Just a few more XP to level up!',
                urgency: 'high',
                action: 'continue_grinding'
            });
        } else if (progress >= 75) {
            hooks.push({
                type: 'final_stretch',
                message: '💪 You\'re in the final stretch - don\'t give up now!',
                urgency: 'medium',
                action: 'push_forward'
            });
        }

        const achievements = userData.achievements || [];
        const totalAchievements = 50;
        const achievementProgress = (achievements.length / totalAchievements) * 100;

        if (achievementProgress >= 80) {
            hooks.push({
                type: 'achievement_completion',
                message: '🏆 You\'re so close to completing all achievements!',
                urgency: 'medium',
                action: 'complete_achievements'
            });
        }

        return hooks;
    }

    getTimeUntilMidnight() {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }

    calculatePercentile(userValue, distribution) {
        if (!distribution || distribution.length === 0) return 50;
        
        const sorted = distribution.sort((a, b) => a - b);
        const index = sorted.findIndex(value => value >= userValue);
        return Math.round((index / sorted.length) * 100);
    }

    calculateBaseReward(action) {
        const rewardMap = {
            work: 10,
            daily: 25,
            gamble: 5,
            shop: 2,
            trade: 15,
            invest: 20
        };
        return rewardMap[action] || 5;
    }

    calculateRewardMultiplier(pattern) {
        let multiplier = 1;
        
        if (pattern.engagementScore > 80) multiplier += 0.5;
        if (pattern.totalCommands > 100) multiplier += 0.3;
        if (pattern.spendingPattern === 'high_roller') multiplier += 0.4;
        
        return Math.min(multiplier, 3);
    }

    getBonusChance(pattern) {
        let baseChance = 0.1;
        
        if (pattern.engagementScore > 70) baseChance += 0.1;
        if (pattern.behaviorTriggers.has('achievement_chains')) baseChance += 0.05;
        
        return Math.min(baseChance, 0.3);
    }

    getBonusMessage(bonusType) {
        const messages = {
            vex_bonus: '💰 Bonus VEX reward!',
            xp_bonus: '⭐ Extra XP gained!',
            item_bonus: '🎁 Surprise item received!',
            mystery_box: '📦 Mystery box unlocked!'
        };
        return messages[bonusType] || '🎉 Bonus reward!';
    }

    getBonusRarity(multiplier) {
        if (multiplier >= 2.5) return 'legendary';
        if (multiplier >= 2) return 'epic';
        if (multiplier >= 1.5) return 'rare';
        return 'common';
    }

    getXPForLevel(level) {
        const base = 1000;
        const multiplier = 1.2;
        return Math.floor(base * Math.pow(multiplier, level - 1));
    }

    getUserEngagementLevel(userId) {
        const pattern = this.userBehaviorPatterns.get(userId);
        if (!pattern) return 'new';
        
        if (pattern.engagementScore >= 80) return 'highly_engaged';
        if (pattern.engagementScore >= 60) return 'engaged';
        if (pattern.engagementScore >= 40) return 'moderately_engaged';
        if (pattern.engagementScore >= 20) return 'low_engagement';
        return 'at_risk';
    }

    generateRetentionStrategy(userId) {
        const engagementLevel = this.getUserEngagementLevel(userId);
        const pattern = this.userBehaviorPatterns.get(userId);
        
        const strategies = {
            highly_engaged: {
                focus: 'maintain_momentum',
                tactics: ['exclusive_content', 'social_features', 'advanced_challenges']
            },
            engaged: {
                focus: 'increase_frequency',
                tactics: ['daily_bonuses', 'streak_rewards', 'social_competition']
            },
            moderately_engaged: {
                focus: 'find_hook',
                tactics: ['personalized_offers', 'achievement_chains', 'tutorial_completion']
            },
            low_engagement: {
                focus: 'reactivation',
                tactics: ['comeback_bonuses', 'simplified_experience', 'immediate_rewards']
            },
            at_risk: {
                focus: 'emergency_retention',
                tactics: ['massive_bonuses', 'personal_attention', 'remove_friction']
            }
        };
        
        return strategies[engagementLevel] || strategies.at_risk;
    }
}

module.exports = PsychologyEngine;
