const constants = require('./constants');

class Progression {
    static checkAchievements(userData, action, value = 1) {
        const newAchievements = [];
        
        for (const achievement of constants.ACHIEVEMENTS) {
            if (userData.achievements.includes(achievement.id)) continue;
            
            if (this.isAchievementUnlocked(achievement, userData, action, value)) {
                newAchievements.push(achievement);
                userData.achievements.push(achievement.id);
                userData.wallet += achievement.reward;
                userData.stats.totalEarned += achievement.reward;
            }
        }
        
        return newAchievements;
    }

    static isAchievementUnlocked(achievement, userData, action, value) {
        switch (achievement.id) {
            case 'first_steps':
                return action === 'command_used' && userData.stats.commandsUsed >= 1;
            
            case 'worker':
                return action === 'work_completed' && this.getWorkCount(userData) >= 10;
            
            case 'millionaire':
                return userData.networth >= 1000000;
            
            case 'gambler':
                return userData.stats.gamesPlayed >= 50;
            
            case 'trader':
                return userData.stats.tradesCompleted >= 25;
            
            case 'generous':
                return userData.stats.giftsSent >= 100;
            
            case 'level_master':
                return userData.level >= 50;
            
            case 'daily_streak':
                return userData.dailyStreak >= 30;
            
            default:
                return false;
        }
    }

    static getWorkCount(userData) {
        return userData.stats.commandsUsed || 0;
    }

    static calculateLevelProgress(userData) {
        const currentLevelXP = this.getXPForLevel(userData.level);
        const nextLevelXP = this.getXPForLevel(userData.level + 1);
        const progress = userData.xp / (nextLevelXP - currentLevelXP);
        
        return {
            currentLevel: userData.level,
            currentXP: userData.xp,
            xpForNext: nextLevelXP - currentLevelXP,
            xpToNext: (nextLevelXP - currentLevelXP) - userData.xp,
            progress: Math.min(progress, 1)
        };
    }

    static getXPForLevel(level) {
        const { BASE, MULTIPLIER } = constants.LEVEL_XP_REQUIREMENTS;
        return Math.floor(BASE * Math.pow(MULTIPLIER, level - 1));
    }

    static addXP(userData, amount, source = 'general') {
        const oldLevel = userData.level;
        userData.xp += amount;
        
        const xpNeeded = this.getXPForLevel(userData.level + 1) - this.getXPForLevel(userData.level);
        
        while (userData.xp >= xpNeeded) {
            userData.level++;
            userData.xp -= xpNeeded;
            
            const levelReward = userData.level * 100;
            userData.wallet += levelReward;
            userData.stats.totalEarned += levelReward;
        }
        
        const leveledUp = userData.level > oldLevel;
        
        return {
            leveledUp,
            oldLevel,
            newLevel: userData.level,
            xpGained: amount,
            levelReward: leveledUp ? userData.level * 100 : 0
        };
    }

    static getJobProgression(userData) {
        if (!userData.job) {
            return {
                hasJob: false,
                availableJobs: this.getAvailableJobs(userData.level)
            };
        }
        
        const jobData = this.getJobData(userData.job);
        const nextLevelXP = (userData.jobLevel + 1) * 500;
        const progress = userData.jobXp / nextLevelXP;
        
        return {
            hasJob: true,
            currentJob: jobData,
            jobLevel: userData.jobLevel,
            jobXP: userData.jobXp,
            xpToNext: nextLevelXP - userData.jobXp,
            progress: Math.min(progress, 1),
            availableJobs: this.getAvailableJobs(userData.level)
        };
    }

    static getAvailableJobs(level) {
        const jobs = [];
        
        if (level >= 1) jobs.push(...constants.JOBS.BEGINNER);
        if (level >= 5) jobs.push(...constants.JOBS.INTERMEDIATE);
        if (level >= 15) jobs.push(...constants.JOBS.ADVANCED);
        if (level >= 30) jobs.push(...constants.JOBS.EXPERT);
        
        return jobs;
    }

    static getJobData(jobId) {
        const allJobs = [
            ...constants.JOBS.BEGINNER,
            ...constants.JOBS.INTERMEDIATE,
            ...constants.JOBS.ADVANCED,
            ...constants.JOBS.EXPERT
        ];
        
        return allJobs.find(job => job.id === jobId);
    }

    static addJobXP(userData, amount) {
        if (!userData.job) return { leveledUp: false };
        
        const oldLevel = userData.jobLevel;
        userData.jobXp += amount;
        
        const xpNeeded = (userData.jobLevel + 1) * 500;
        
        if (userData.jobXp >= xpNeeded) {
            userData.jobLevel++;
            userData.jobXp -= xpNeeded;
            
            const jobLevelReward = userData.jobLevel * 50;
            userData.wallet += jobLevelReward;
            userData.stats.totalEarned += jobLevelReward;
            
            return {
                leveledUp: true,
                oldLevel,
                newLevel: userData.jobLevel,
                reward: jobLevelReward
            };
        }
        
        return { leveledUp: false };
    }

    static getProgressEmbed(userData) {
        const levelProgress = this.calculateLevelProgress(userData);
        const jobProgress = this.getJobProgression(userData);
        
        const progressBar = this.createProgressBar(levelProgress.progress);
        const jobProgressBar = jobProgress.hasJob ? 
            this.createProgressBar(jobProgress.progress) : 'No job selected';
        
        return {
            title: `📈 ${userData.userId}'s Progress`,
            fields: [
                {
                    name: '🎯 Level Progress',
                    value: `Level ${levelProgress.currentLevel}\n${progressBar}\n${levelProgress.xpToNext} XP to next level`,
                    inline: false
                },
                {
                    name: '💼 Job Progress',
                    value: jobProgress.hasJob ? 
                        `${jobProgress.currentJob.name} (Level ${jobProgress.jobLevel})\n${jobProgressBar}\n${jobProgress.xpToNext} XP to next level` :
                        'No job selected\nUse `/work` to choose a job!',
                    inline: false
                },
                {
                    name: '🏆 Achievements',
                    value: `${userData.achievements.length}/${constants.ACHIEVEMENTS.length} unlocked`,
                    inline: true
                },
                {
                    name: '💰 Net Worth',
                    value: `${userData.networth.toLocaleString()} coins`,
                    inline: true
                }
            ],
            color: constants.COLORS.PRIMARY
        };
    }

    static createProgressBar(progress, length = 10) {
        const filled = Math.floor(progress * length);
        const empty = length - filled;
        
        return '█'.repeat(filled) + '░'.repeat(empty) + ` ${Math.floor(progress * 100)}%`;
    }

    static getAchievementEmbed(achievement) {
        return {
            title: '🏆 Achievement Unlocked!',
            description: `**${achievement.name}**\n${achievement.description}`,
            fields: [
                {
                    name: '💰 Reward',
                    value: `${achievement.reward.toLocaleString()} coins`,
                    inline: true
                }
            ],
            color: constants.COLORS.GOLD,
            thumbnail: { url: achievement.icon }
        };
    }

    static getLevelUpEmbed(oldLevel, newLevel, reward) {
        return {
            title: '📈 Level Up!',
            description: `Congratulations! You've reached level ${newLevel}!`,
            fields: [
                {
                    name: '🎯 Previous Level',
                    value: oldLevel.toString(),
                    inline: true
                },
                {
                    name: '🎯 New Level',
                    value: newLevel.toString(),
                    inline: true
                },
                {
                    name: '💰 Reward',
                    value: `${reward.toLocaleString()} coins`,
                    inline: true
                }
            ],
            color: constants.COLORS.SUCCESS
        };
    }

    static getJobLevelUpEmbed(jobName, oldLevel, newLevel, reward) {
        return {
            title: '💼 Job Level Up!',
            description: `Your ${jobName} skills have improved!`,
            fields: [
                {
                    name: '📊 Previous Level',
                    value: oldLevel.toString(),
                    inline: true
                },
                {
                    name: '📊 New Level',
                    value: newLevel.toString(),
                    inline: true
                },
                {
                    name: '💰 Bonus',
                    value: `${reward.toLocaleString()} coins`,
                    inline: true
                }
            ],
            color: constants.COLORS.INFO
        };
    }

    static getUnlockedJobsForLevel(level) {
        const newJobs = [];
        
        if (level === 5) newJobs.push(...constants.JOBS.INTERMEDIATE);
        if (level === 15) newJobs.push(...constants.JOBS.ADVANCED);
        if (level === 30) newJobs.push(...constants.JOBS.EXPERT);
        
        return newJobs;
    }

    static calculatePrestige(userData) {
        if (userData.level < 100) {
            return {
                canPrestige: false,
                requirement: 100,
                current: userData.level
            };
        }
        
        const prestigeBonus = Math.floor(userData.level / 10) * 1000;
        
        return {
            canPrestige: true,
            bonus: prestigeBonus,
            newLevel: 1,
            keepItems: true
        };
    }
}

module.exports = Progression;
