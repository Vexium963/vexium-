const EventEmitter = require('events');

class ImmersionEngine extends EventEmitter {
    constructor() {
        super();
        this.userSessions = new Map();
        this.achievementChains = new Map();
        this.dailyChallenges = new Map();
        this.comebackBonuses = new Map();
        this.milestoneTracking = new Map();
    }

    startUserSession(userId) {
        const sessionData = {
            startTime: Date.now(),
            commandsUsed: 0,
            achievementsUnlocked: 0,
            streakMaintained: false,
            socialInteractions: 0,
            economicActivity: 0,
            immersionScore: 0
        };
        
        this.userSessions.set(userId, sessionData);
        this.emit('session-started', { userId, sessionData });
        
        return sessionData;
    }

    trackCommand(userId, commandName, success = true) {
        let session = this.userSessions.get(userId);
        if (!session) {
            session = this.startUserSession(userId);
        }

        session.commandsUsed++;
        session.lastActivity = Date.now();

        if (this.isEconomicCommand(commandName)) {
            session.economicActivity++;
        }

        if (this.isSocialCommand(commandName)) {
            session.socialInteractions++;
        }

        this.updateImmersionScore(userId, commandName, success);
        this.checkForMilestones(userId, session);
        
        return session;
    }

    createAchievementChain(userId, baseAchievement) {
        const chain = {
            id: `chain_${userId}_${Date.now()}`,
            userId,
            baseAchievement,
            currentStep: 0,
            totalSteps: this.getChainLength(baseAchievement),
            rewards: this.generateChainRewards(baseAchievement),
            timeLimit: Date.now() + (24 * 60 * 60 * 1000),
            completed: false
        };

        this.achievementChains.set(chain.id, chain);
        this.emit('achievement-chain-created', chain);
        
        return chain;
    }

    progressAchievementChain(userId, achievementType) {
        const userChains = Array.from(this.achievementChains.values())
            .filter(chain => chain.userId === userId && !chain.completed);

        for (const chain of userChains) {
            if (this.isChainRelevant(chain, achievementType)) {
                chain.currentStep++;
                
                if (chain.currentStep >= chain.totalSteps) {
                    chain.completed = true;
                    this.emit('achievement-chain-completed', chain);
                    return this.getChainCompletionReward(chain);
                } else {
                    this.emit('achievement-chain-progress', chain);
                    return this.getChainProgressReward(chain);
                }
            }
        }
        
        return null;
    }

    generateDailyChallenge(userId, userLevel, preferences = {}) {
        const challengeTypes = [
            'economic_mastery',
            'social_butterfly',
            'achievement_hunter',
            'streak_keeper',
            'risk_taker',
            'collector'
        ];

        const selectedType = this.selectChallengeType(challengeTypes, preferences);
        const challenge = {
            id: `daily_${userId}_${Date.now()}`,
            userId,
            type: selectedType,
            description: this.getChallengeDescription(selectedType, userLevel),
            requirements: this.getChallengeRequirements(selectedType, userLevel),
            rewards: this.getChallengeRewards(selectedType, userLevel),
            progress: 0,
            maxProgress: this.getChallengeMaxProgress(selectedType, userLevel),
            timeLimit: this.getTomorrowMidnight(),
            completed: false,
            difficulty: this.getChallengeDifficulty(userLevel)
        };

        this.dailyChallenges.set(challenge.id, challenge);
        this.emit('daily-challenge-created', challenge);
        
        return challenge;
    }

    updateChallengeProgress(userId, actionType, amount = 1) {
        const userChallenges = Array.from(this.dailyChallenges.values())
            .filter(challenge => challenge.userId === userId && !challenge.completed);

        const updates = [];
        
        for (const challenge of userChallenges) {
            if (this.isChallengeRelevant(challenge, actionType)) {
                challenge.progress = Math.min(challenge.progress + amount, challenge.maxProgress);
                
                if (challenge.progress >= challenge.maxProgress) {
                    challenge.completed = true;
                    this.emit('daily-challenge-completed', challenge);
                    updates.push({
                        type: 'completed',
                        challenge,
                        rewards: challenge.rewards
                    });
                } else {
                    this.emit('daily-challenge-progress', challenge);
                    updates.push({
                        type: 'progress',
                        challenge,
                        progressPercentage: (challenge.progress / challenge.maxProgress) * 100
                    });
                }
            }
        }
        
        return updates;
    }

    calculateComebackBonus(userId, lastActiveTime) {
        const timeSinceActive = Date.now() - lastActiveTime;
        const daysAway = Math.floor(timeSinceActive / (24 * 60 * 60 * 1000));
        
        if (daysAway < 1) return null;

        const bonusMultiplier = Math.min(daysAway * 0.1, 2.0);
        const baseBonus = 100;
        const bonusAmount = baseBonus * bonusMultiplier;

        const comebackBonus = {
            userId,
            daysAway,
            bonusAmount,
            bonusMultiplier,
            message: this.getComebackMessage(daysAway),
            specialOffers: this.getComebackOffers(daysAway),
            expires: Date.now() + (24 * 60 * 60 * 1000)
        };

        this.comebackBonuses.set(userId, comebackBonus);
        this.emit('comeback-bonus-created', comebackBonus);
        
        return comebackBonus;
    }

    createMilestoneCelebration(userId, milestoneType, value) {
        const celebration = {
            id: `milestone_${userId}_${Date.now()}`,
            userId,
            type: milestoneType,
            value,
            rewards: this.getMilestoneRewards(milestoneType, value),
            specialEffects: this.getMilestoneEffects(milestoneType, value),
            message: this.getMilestoneMessage(milestoneType, value),
            timestamp: Date.now(),
            celebrated: false
        };

        this.emit('milestone-celebration', celebration);
        return celebration;
    }

    updateImmersionScore(userId, commandName, success) {
        let session = this.userSessions.get(userId);
        if (!session) return;

        let scoreChange = 0;

        if (success) {
            scoreChange += this.getCommandImmersionValue(commandName);
        } else {
            scoreChange -= 5;
        }

        if (session.commandsUsed > 10) {
            scoreChange += 2;
        }

        if (session.socialInteractions > 3) {
            scoreChange += 3;
        }

        if (session.economicActivity > 5) {
            scoreChange += 4;
        }

        session.immersionScore = Math.max(0, Math.min(100, session.immersionScore + scoreChange));
        
        if (session.immersionScore > 80) {
            this.emit('high-immersion', { userId, score: session.immersionScore });
        }
    }

    checkForMilestones(userId, session) {
        const milestones = [
            { type: 'commands_used', threshold: 50, value: session.commandsUsed },
            { type: 'social_interactions', threshold: 10, value: session.socialInteractions },
            { type: 'economic_activity', threshold: 20, value: session.economicActivity },
            { type: 'session_duration', threshold: 30 * 60 * 1000, value: Date.now() - session.startTime }
        ];

        for (const milestone of milestones) {
            if (milestone.value >= milestone.threshold) {
                const existing = this.milestoneTracking.get(`${userId}_${milestone.type}`);
                if (!existing || existing < milestone.value) {
                    this.milestoneTracking.set(`${userId}_${milestone.type}`, milestone.value);
                    this.createMilestoneCelebration(userId, milestone.type, milestone.value);
                }
            }
        }
    }

    isEconomicCommand(commandName) {
        const economicCommands = ['work', 'daily', 'shop', 'invest', 'trade', 'gamble', 'lottery', 'auction'];
        return economicCommands.includes(commandName);
    }

    isSocialCommand(commandName) {
        const socialCommands = ['gift', 'trade', 'leaderboard', 'profile', 'guild', 'duel', 'friends'];
        return socialCommands.includes(commandName);
    }

    getCommandImmersionValue(commandName) {
        const values = {
            work: 3,
            daily: 5,
            shop: 4,
            gamble: 6,
            trade: 7,
            guild: 8,
            achievements: 5,
            progression: 4,
            profile: 3
        };
        return values[commandName] || 2;
    }

    getChainLength(baseAchievement) {
        const lengths = {
            economic: 5,
            social: 4,
            gaming: 6,
            collection: 7
        };
        return lengths[baseAchievement] || 5;
    }

    generateChainRewards(baseAchievement) {
        const baseReward = 50;
        const multipliers = [1, 1.5, 2, 3, 5];
        
        return multipliers.map((mult, index) => ({
            step: index + 1,
            vex: baseReward * mult,
            xp: 25 * mult,
            special: index === multipliers.length - 1 ? 'legendary_badge' : null
        }));
    }

    getChallengeDescription(type, level) {
        const descriptions = {
            economic_mastery: `Complete ${3 + Math.floor(level / 5)} economic activities`,
            social_butterfly: `Interact with ${2 + Math.floor(level / 10)} different players`,
            achievement_hunter: `Unlock ${1 + Math.floor(level / 15)} new achievements`,
            streak_keeper: 'Maintain your daily streak',
            risk_taker: `Play ${2 + Math.floor(level / 8)} skill-based games`,
            collector: `Purchase ${1 + Math.floor(level / 12)} items from the shop`
        };
        return descriptions[type] || 'Complete daily activities';
    }

    getChallengeRequirements(type, level) {
        const requirements = {
            economic_mastery: { commands: ['work', 'daily', 'invest'], count: 3 + Math.floor(level / 5) },
            social_butterfly: { commands: ['gift', 'trade', 'guild'], count: 2 + Math.floor(level / 10) },
            achievement_hunter: { type: 'achievements', count: 1 + Math.floor(level / 15) },
            streak_keeper: { type: 'daily_streak', maintain: true },
            risk_taker: { commands: ['gamble', 'lottery', 'roulette'], count: 2 + Math.floor(level / 8) },
            collector: { commands: ['shop'], count: 1 + Math.floor(level / 12) }
        };
        return requirements[type] || { commands: [], count: 1 };
    }

    getChallengeRewards(type, level) {
        const baseReward = 100 + (level * 10);
        return {
            vex: baseReward,
            xp: Math.floor(baseReward * 0.5),
            bonus: type === 'achievement_hunter' ? 'mystery_box' : null
        };
    }

    getComebackMessage(daysAway) {
        if (daysAway >= 7) return "🎉 Welcome back, legend! We've missed you!";
        if (daysAway >= 3) return "🌟 Great to see you again! Here's a special bonus!";
        return "👋 Welcome back! Your empire awaits!";
    }

    getComebackOffers(daysAway) {
        const offers = [];
        
        if (daysAway >= 3) {
            offers.push({
                type: 'xp_boost',
                duration: 24 * 60 * 60 * 1000,
                multiplier: 1.5
            });
        }
        
        if (daysAway >= 7) {
            offers.push({
                type: 'shop_discount',
                discount: 0.25,
                duration: 48 * 60 * 60 * 1000
            });
        }
        
        return offers;
    }

    getMilestoneMessage(type, value) {
        const messages = {
            commands_used: `🎯 Amazing! You've used ${value} commands!`,
            social_interactions: `🤝 Social butterfly! ${value} interactions completed!`,
            economic_activity: `💰 Economic master! ${value} transactions completed!`,
            session_duration: `⏰ Dedication! ${Math.floor(value / 60000)} minutes of gameplay!`
        };
        return messages[type] || `🏆 Milestone reached: ${value}!`;
    }

    getMilestoneRewards(type, value) {
        const baseReward = Math.floor(value / 10) * 50;
        return {
            vex: baseReward,
            xp: Math.floor(baseReward * 0.3),
            badge: value >= 100 ? `${type}_master` : null
        };
    }

    getTomorrowMidnight() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.getTime();
    }

    getImmersionLevel(userId) {
        const session = this.userSessions.get(userId);
        if (!session) return 'new';
        
        if (session.immersionScore >= 80) return 'highly_immersed';
        if (session.immersionScore >= 60) return 'immersed';
        if (session.immersionScore >= 40) return 'engaged';
        if (session.immersionScore >= 20) return 'casual';
        return 'disconnected';
    }

    generateImmersionReport(userId) {
        const session = this.userSessions.get(userId);
        const userChallenges = Array.from(this.dailyChallenges.values())
            .filter(c => c.userId === userId);
        const userChains = Array.from(this.achievementChains.values())
            .filter(c => c.userId === userId);

        return {
            immersionLevel: this.getImmersionLevel(userId),
            sessionData: session,
            activeChallenges: userChallenges.filter(c => !c.completed),
            completedChallenges: userChallenges.filter(c => c.completed),
            activeChains: userChains.filter(c => !c.completed),
            completedChains: userChains.filter(c => c.completed),
            comebackBonus: this.comebackBonuses.get(userId),
            recommendations: this.generateRecommendations(userId)
        };
    }

    generateRecommendations(userId) {
        const session = this.userSessions.get(userId);
        if (!session) return [];

        const recommendations = [];

        if (session.socialInteractions < 2) {
            recommendations.push({
                type: 'social',
                message: 'Try trading or gifting with other players!',
                commands: ['trade', 'gift', 'guild']
            });
        }

        if (session.economicActivity < 3) {
            recommendations.push({
                type: 'economic',
                message: 'Boost your earnings with work and investments!',
                commands: ['work', 'invest', 'shop']
            });
        }

        if (session.immersionScore < 50) {
            recommendations.push({
                type: 'engagement',
                message: 'Check out achievements and progression!',
                commands: ['achievements', 'progression', 'daily']
            });
        }

        return recommendations;
    }
}

module.exports = ImmersionEngine;
