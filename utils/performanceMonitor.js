const EventEmitter = require('events');

class PerformanceMonitor extends EventEmitter {
    constructor() {
        super();
        this.metrics = {
            commandExecutions: new Map(),
            responseTimeHistory: [],
            errorCounts: new Map(),
            memoryUsageHistory: [],
            activeUsers: new Set(),
            peakConcurrentUsers: 0,
            totalCommands: 0,
            averageResponseTime: 0
        };
        this.startTime = Date.now();
        this.monitoringInterval = null;
    }

    startMonitoring() {
        console.log('📊 Starting performance monitoring...');
        
        this.monitoringInterval = setInterval(() => {
            this.collectSystemMetrics();
            this.analyzePerformance();
        }, 5000);

        setInterval(() => {
            this.cleanupOldMetrics();
        }, 60000);

        console.log('✅ Performance monitoring started');
    }

    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        console.log('⏹️ Performance monitoring stopped');
    }

    recordCommandExecution(commandName, responseTime, userId, success = true) {
        this.metrics.totalCommands++;
        
        if (!this.metrics.commandExecutions.has(commandName)) {
            this.metrics.commandExecutions.set(commandName, {
                count: 0,
                totalTime: 0,
                errors: 0,
                averageTime: 0
            });
        }

        const commandStats = this.metrics.commandExecutions.get(commandName);
        commandStats.count++;
        commandStats.totalTime += responseTime;
        commandStats.averageTime = commandStats.totalTime / commandStats.count;

        if (!success) {
            commandStats.errors++;
            this.recordError(commandName);
        }

        this.metrics.responseTimeHistory.push({
            timestamp: Date.now(),
            responseTime,
            command: commandName
        });

        this.metrics.activeUsers.add(userId);
        this.updatePeakUsers();

        this.calculateAverageResponseTime();
    }

    recordError(source, error = null) {
        if (!this.metrics.errorCounts.has(source)) {
            this.metrics.errorCounts.set(source, 0);
        }
        this.metrics.errorCounts.set(source, this.metrics.errorCounts.get(source) + 1);

        this.emit('error-recorded', { source, error, timestamp: Date.now() });
    }

    collectSystemMetrics() {
        const memUsage = process.memoryUsage();
        this.metrics.memoryUsageHistory.push({
            timestamp: Date.now(),
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external,
            rss: memUsage.rss
        });

        const cpuUsage = process.cpuUsage();
        this.metrics.cpuUsage = {
            user: cpuUsage.user,
            system: cpuUsage.system,
            timestamp: Date.now()
        };
    }

    analyzePerformance() {
        const analysis = {
            timestamp: Date.now(),
            uptime: Date.now() - this.startTime,
            totalCommands: this.metrics.totalCommands,
            averageResponseTime: this.metrics.averageResponseTime,
            activeUsers: this.metrics.activeUsers.size,
            peakUsers: this.metrics.peakConcurrentUsers,
            memoryUsage: this.getCurrentMemoryUsage(),
            topCommands: this.getTopCommands(5),
            errorRate: this.calculateErrorRate(),
            performance: this.getPerformanceRating()
        };

        this.emit('performance-analysis', analysis);

        if (analysis.performance === 'poor') {
            this.emit('performance-alert', {
                type: 'poor-performance',
                analysis,
                recommendations: this.getPerformanceRecommendations(analysis)
            });
        }

        return analysis;
    }

    getPerformanceMetrics() {
        return {
            uptime: Date.now() - this.startTime,
            totalCommands: this.metrics.totalCommands,
            averageResponseTime: this.metrics.averageResponseTime,
            activeUsers: this.metrics.activeUsers.size,
            peakUsers: this.metrics.peakConcurrentUsers,
            memoryUsage: this.getCurrentMemoryUsage(),
            errorRate: this.calculateErrorRate(),
            topCommands: this.getTopCommands(10),
            recentErrors: this.getRecentErrors(10),
            performanceRating: this.getPerformanceRating()
        };
    }

    updatePeakUsers() {
        if (this.metrics.activeUsers.size > this.metrics.peakConcurrentUsers) {
            this.metrics.peakConcurrentUsers = this.metrics.activeUsers.size;
        }
    }

    calculateAverageResponseTime() {
        const recentResponses = this.metrics.responseTimeHistory.slice(-100);
        if (recentResponses.length === 0) {
            this.metrics.averageResponseTime = 0;
            return;
        }

        const totalTime = recentResponses.reduce((sum, entry) => sum + entry.responseTime, 0);
        this.metrics.averageResponseTime = totalTime / recentResponses.length;
    }

    calculateErrorRate() {
        const totalErrors = Array.from(this.metrics.errorCounts.values()).reduce((sum, count) => sum + count, 0);
        return this.metrics.totalCommands > 0 ? totalErrors / this.metrics.totalCommands : 0;
    }

    getCurrentMemoryUsage() {
        const memUsage = process.memoryUsage();
        return {
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
            heapUsagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100
        };
    }

    getTopCommands(limit = 5) {
        return Array.from(this.metrics.commandExecutions.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, limit)
            .map(([command, stats]) => ({
                command,
                executions: stats.count,
                averageTime: Math.round(stats.averageTime),
                errorRate: stats.errors / stats.count
            }));
    }

    getRecentErrors(limit = 10) {
        return Array.from(this.metrics.errorCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([source, count]) => ({ source, count }));
    }

    getPerformanceRating() {
        const avgResponseTime = this.metrics.averageResponseTime;
        const errorRate = this.calculateErrorRate();
        const memoryUsage = this.getCurrentMemoryUsage().heapUsagePercent;

        if (avgResponseTime > 3000 || errorRate > 0.1 || memoryUsage > 90) {
            return 'poor';
        } else if (avgResponseTime > 1500 || errorRate > 0.05 || memoryUsage > 75) {
            return 'fair';
        } else if (avgResponseTime > 800 || errorRate > 0.02 || memoryUsage > 60) {
            return 'good';
        } else {
            return 'excellent';
        }
    }

    getPerformanceRecommendations(analysis) {
        const recommendations = [];

        if (analysis.averageResponseTime > 2000) {
            recommendations.push('Consider optimizing slow commands or implementing caching');
        }

        if (analysis.errorRate > 0.05) {
            recommendations.push('Review and fix commands with high error rates');
        }

        if (analysis.memoryUsage.heapUsagePercent > 80) {
            recommendations.push('Memory usage is high - consider implementing garbage collection or reducing memory footprint');
        }

        if (analysis.activeUsers > 1000) {
            recommendations.push('High user load detected - consider implementing rate limiting or load balancing');
        }

        return recommendations;
    }

    cleanupOldMetrics() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        this.metrics.responseTimeHistory = this.metrics.responseTimeHistory.filter(
            entry => entry.timestamp > oneHourAgo
        );

        this.metrics.memoryUsageHistory = this.metrics.memoryUsageHistory.filter(
            entry => entry.timestamp > oneHourAgo
        );

        this.metrics.activeUsers.clear();
    }

    generateReport() {
        const metrics = this.getPerformanceMetrics();
        const report = {
            generatedAt: new Date().toISOString(),
            uptime: `${Math.floor(metrics.uptime / 1000 / 60)} minutes`,
            summary: {
                totalCommands: metrics.totalCommands,
                averageResponseTime: `${Math.round(metrics.averageResponseTime)}ms`,
                currentActiveUsers: metrics.activeUsers,
                peakUsers: metrics.peakUsers,
                errorRate: `${(metrics.errorRate * 100).toFixed(2)}%`,
                memoryUsage: `${metrics.memoryUsage.heapUsedMB}MB / ${metrics.memoryUsage.heapTotalMB}MB (${Math.round(metrics.memoryUsage.heapUsagePercent)}%)`,
                performanceRating: metrics.performanceRating
            },
            topCommands: metrics.topCommands,
            recentErrors: metrics.recentErrors
        };

        return report;
    }
}

module.exports = PerformanceMonitor;
