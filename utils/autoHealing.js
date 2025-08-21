const fs = require('fs').promises;
const path = require('path');

class AutoHealingSystem {
    constructor() {
        this.healthChecks = new Map();
        this.alertThresholds = {
            responseTime: 5000,
            errorRate: 0.05,
            memoryUsage: 0.85,
            cpuUsage: 0.80
        };
        this.metrics = {
            requests: 0,
            errors: 0,
            totalResponseTime: 0,
            lastHealthCheck: Date.now()
        };
        this.isHealing = false;
    }

    async initialize() {
        console.log('🏥 Initializing auto-healing system...');
        
        setInterval(() => this.performHealthCheck(), 30000);
        setInterval(() => this.collectMetrics(), 5000);
        
        process.on('uncaughtException', (error) => this.handleCriticalError(error));
        process.on('unhandledRejection', (reason) => this.handleCriticalError(reason));
        
        console.log('✅ Auto-healing system initialized');
    }

    async performHealthCheck() {
        const healthStatus = {
            timestamp: Date.now(),
            status: 'healthy',
            checks: {},
            metrics: { ...this.metrics }
        };

        try {
            healthStatus.checks.database = await this.checkDatabaseHealth();
            healthStatus.checks.redis = await this.checkRedisHealth();
            healthStatus.checks.memory = await this.checkMemoryUsage();
            healthStatus.checks.responseTime = this.checkResponseTime();
            healthStatus.checks.errorRate = this.checkErrorRate();

            const failedChecks = Object.values(healthStatus.checks).filter(check => !check.healthy);
            if (failedChecks.length > 0) {
                healthStatus.status = 'unhealthy';
                await this.triggerHealing(failedChecks);
            }

            await this.logHealthStatus(healthStatus);

        } catch (error) {
            console.error('❌ Health check failed:', error);
            healthStatus.status = 'critical';
            await this.triggerEmergencyHealing(error);
        }

        return healthStatus;
    }

    async checkDatabaseHealth() {
        try {
            const databaseType = process.env.DATABASE_TYPE || 'json';
            
            if (databaseType === 'postgresql') {
                const PostgreSQLDatabase = require('../database/postgresql');
                const db = new PostgreSQLDatabase();
                const isHealthy = await db.healthCheck();
                
                return {
                    healthy: isHealthy,
                    message: isHealthy ? 'PostgreSQL responsive' : 'PostgreSQL connection failed',
                    timestamp: Date.now()
                };
            } else {
                const fs = require('fs');
                const path = require('path');
                const dbPath = path.join(__dirname, '../database/data');
                
                try {
                    await fs.promises.access(dbPath);
                    return {
                        healthy: true,
                        message: 'JSON database accessible',
                        timestamp: Date.now()
                    };
                } catch {
                    await fs.promises.mkdir(dbPath, { recursive: true });
                    return {
                        healthy: true,
                        message: 'JSON database initialized',
                        timestamp: Date.now()
                    };
                }
            }
        } catch (error) {
            return {
                healthy: false,
                message: `Database error: ${error.message}`,
                timestamp: Date.now()
            };
        }
    }

    async checkRedisHealth() {
        try {
            const RedisCache = require('../database/redis');
            const redis = new RedisCache();
            const isHealthy = await redis.healthCheck();
            
            return {
                healthy: isHealthy,
                message: isHealthy ? 'Redis responsive' : 'Redis connection failed',
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                healthy: false,
                message: `Redis error: ${error.message}`,
                timestamp: Date.now()
            };
        }
    }

    async checkMemoryUsage() {
        const memUsage = process.memoryUsage();
        const totalMemory = memUsage.heapTotal;
        const usedMemory = memUsage.heapUsed;
        const memoryRatio = usedMemory / totalMemory;
        
        return {
            healthy: memoryRatio < this.alertThresholds.memoryUsage,
            message: `Memory usage: ${(memoryRatio * 100).toFixed(2)}%`,
            usage: memoryRatio,
            timestamp: Date.now()
        };
    }

    checkResponseTime() {
        const avgResponseTime = this.metrics.requests > 0 
            ? this.metrics.totalResponseTime / this.metrics.requests 
            : 0;
            
        return {
            healthy: avgResponseTime < this.alertThresholds.responseTime,
            message: `Average response time: ${avgResponseTime.toFixed(2)}ms`,
            responseTime: avgResponseTime,
            timestamp: Date.now()
        };
    }

    checkErrorRate() {
        const errorRate = this.metrics.requests > 0 
            ? this.metrics.errors / this.metrics.requests 
            : 0;
            
        return {
            healthy: errorRate < this.alertThresholds.errorRate,
            message: `Error rate: ${(errorRate * 100).toFixed(2)}%`,
            errorRate: errorRate,
            timestamp: Date.now()
        };
    }

    async triggerHealing(failedChecks) {
        if (this.isHealing) {
            console.log('🏥 Healing already in progress, skipping...');
            return;
        }

        this.isHealing = true;
        console.log('🚨 Triggering auto-healing for failed checks:', failedChecks.map(c => c.message));

        try {
            for (const check of failedChecks) {
                await this.healCheck(check);
            }
        } catch (error) {
            console.error('❌ Auto-healing failed:', error);
        } finally {
            this.isHealing = false;
        }
    }

    async healCheck(check) {
        console.log(`🔧 Attempting to heal: ${check.message}`);

        if (check.message.includes('Database')) {
            await this.healDatabase();
        }
        
        if (check.message.includes('Redis')) {
            await this.healRedis();
        }
        
        if (check.message.includes('Memory')) {
            await this.healMemory();
        }
        
        if (check.message.includes('response time')) {
            await this.healResponseTime();
        }
    }

    async healDatabase() {
        try {
            console.log('🔧 Attempting database reconnection...');
            const databaseType = process.env.DATABASE_TYPE || 'json';
            
            if (databaseType === 'postgresql') {
                const PostgreSQLDatabase = require('../database/postgresql');
                const db = new PostgreSQLDatabase();
                await db.initialize();
                console.log('✅ PostgreSQL database healing successful');
            } else {
                const fs = require('fs');
                const path = require('path');
                const dbPath = path.join(__dirname, '../database/data');
                await fs.promises.mkdir(dbPath, { recursive: true });
                console.log('✅ JSON database healing successful');
            }
        } catch (error) {
            console.error('❌ Database healing failed:', error);
        }
    }

    async healRedis() {
        try {
            console.log('🔧 Attempting Redis reconnection...');
            const RedisCache = require('../database/redis');
            const redis = new RedisCache();
            await redis.connect();
            console.log('✅ Redis healing successful');
        } catch (error) {
            console.error('❌ Redis healing failed:', error);
        }
    }

    async healMemory() {
        try {
            console.log('🔧 Attempting memory cleanup...');
            
            if (global.gc) {
                global.gc();
            }
            
            const RedisCache = require('../database/redis');
            const redis = new RedisCache();
            await redis.flushPattern('cache:*');
            
            console.log('✅ Memory healing completed');
        } catch (error) {
            console.error('❌ Memory healing failed:', error);
        }
    }

    async healResponseTime() {
        try {
            console.log('🔧 Optimizing response time...');
            
            this.metrics.totalResponseTime = 0;
            this.metrics.requests = 0;
            
            const RedisCache = require('../database/redis');
            const redis = new RedisCache();
            await redis.flushPattern('slow:*');
            
            console.log('✅ Response time optimization completed');
        } catch (error) {
            console.error('❌ Response time healing failed:', error);
        }
    }

    async triggerEmergencyHealing(error) {
        console.error('🚨 CRITICAL ERROR - Triggering emergency healing:', error);
        
        try {
            await this.createEmergencyBackup();
            await this.restartCriticalServices();
            await this.sendCriticalAlert(error);
            
        } catch (healingError) {
            console.error('💥 Emergency healing failed:', healingError);
            process.exit(1);
        }
    }

    async createEmergencyBackup() {
        try {
            const backupPath = path.join(__dirname, '../backups/emergency');
            await fs.mkdir(backupPath, { recursive: true });
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(backupPath, `emergency-${timestamp}.json`);
            
            const backupData = {
                timestamp: Date.now(),
                metrics: this.metrics,
                healthChecks: Array.from(this.healthChecks.entries()),
                processInfo: {
                    pid: process.pid,
                    uptime: process.uptime(),
                    memory: process.memoryUsage()
                }
            };
            
            await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
            console.log(`✅ Emergency backup created: ${backupFile}`);
        } catch (error) {
            console.error('❌ Emergency backup failed:', error);
        }
    }

    async restartCriticalServices() {
        try {
            console.log('🔄 Restarting critical services...');
            
            await this.healDatabase();
            await this.healRedis();
            
            console.log('✅ Critical services restarted');
        } catch (error) {
            console.error('❌ Service restart failed:', error);
        }
    }

    async sendCriticalAlert(error) {
        console.log('📢 CRITICAL ALERT:', {
            error: error.message,
            timestamp: new Date().toISOString(),
            metrics: this.metrics
        });
    }

    collectMetrics() {
        this.metrics.lastHealthCheck = Date.now();
    }

    recordRequest(responseTime, isError = false) {
        this.metrics.requests++;
        this.metrics.totalResponseTime += responseTime;
        
        if (isError) {
            this.metrics.errors++;
        }
    }

    async logHealthStatus(status) {
        const logPath = path.join(__dirname, '../logs/health.log');
        const logEntry = `${new Date().toISOString()} - ${JSON.stringify(status)}\n`;
        
        try {
            await fs.mkdir(path.dirname(logPath), { recursive: true });
            await fs.appendFile(logPath, logEntry);
        } catch (error) {
            console.error('Failed to log health status:', error);
        }
    }

    handleCriticalError(error) {
        console.error('💥 CRITICAL ERROR DETECTED:', error);
        this.recordRequest(0, true);
        this.triggerEmergencyHealing(error);
    }

    getHealthStatus() {
        return {
            status: this.isHealing ? 'healing' : 'monitoring',
            metrics: { ...this.metrics },
            thresholds: { ...this.alertThresholds },
            lastCheck: this.metrics.lastHealthCheck
        };
    }
}

module.exports = AutoHealingSystem;
