const { performance } = require('perf_hooks');

class LoadTester {
    constructor() {
        this.results = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0,
            responseTimes: [],
            errors: []
        };
    }

    async simulateUserLoad(concurrentUsers = 100, duration = 60000) {
        console.log(`🚀 Starting load test with ${concurrentUsers} concurrent users for ${duration/1000} seconds`);
        
        const startTime = Date.now();
        const promises = [];
        
        for (let i = 0; i < concurrentUsers; i++) {
            promises.push(this.simulateUser(i, startTime, duration));
        }
        
        await Promise.all(promises);
        
        this.calculateResults();
        return this.results;
    }

    async simulateUser(userId, startTime, duration) {
        const commands = [
            'wallet',
            'daily',
            'work',
            'profile',
            'leaderboard',
            'shop',
            'invest'
        ];
        
        while (Date.now() - startTime < duration) {
            const command = commands[Math.floor(Math.random() * commands.length)];
            
            try {
                const responseTime = await this.simulateCommand(command, userId);
                this.recordSuccess(responseTime);
            } catch (error) {
                this.recordError(error);
            }
            
            await this.sleep(Math.random() * 2000 + 1000);
        }
    }

    async simulateCommand(command, userId) {
        const startTime = performance.now();
        
        await this.sleep(Math.random() * 500 + 100);
        
        if (Math.random() < 0.05) {
            throw new Error(`Simulated error for command: ${command}`);
        }
        
        const endTime = performance.now();
        return endTime - startTime;
    }

    async testDatabasePerformance(operations = 1000) {
        console.log(`🗄️ Testing database performance with ${operations} operations`);
        
        const User = require('../database/models/User');
        const results = {
            reads: [],
            writes: [],
            errors: 0
        };
        
        for (let i = 0; i < operations; i++) {
            try {
                const startTime = performance.now();
                
                const user = new User(`test_user_${i % 100}`);
                await user.load();
                
                const readTime = performance.now() - startTime;
                results.reads.push(readTime);
                
                const writeStartTime = performance.now();
                await user.save(user.userData);
                const writeTime = performance.now() - writeStartTime;
                results.writes.push(writeTime);
                
            } catch (error) {
                results.errors++;
                console.error(`Database operation ${i} failed:`, error.message);
            }
            
            if (i % 100 === 0) {
                console.log(`Completed ${i}/${operations} database operations`);
            }
        }
        
        return {
            averageReadTime: results.reads.reduce((a, b) => a + b, 0) / results.reads.length,
            averageWriteTime: results.writes.reduce((a, b) => a + b, 0) / results.writes.length,
            totalErrors: results.errors,
            successRate: ((operations * 2 - results.errors) / (operations * 2)) * 100
        };
    }

    async testRedisPerformance(operations = 1000) {
        console.log(`🔴 Testing Redis performance with ${operations} operations`);
        
        const RedisCache = require('../database/redis');
        const redis = new RedisCache();
        await redis.connect();
        
        const results = {
            sets: [],
            gets: [],
            errors: 0
        };
        
        for (let i = 0; i < operations; i++) {
            try {
                const key = `test_key_${i}`;
                const value = { testData: `value_${i}`, timestamp: Date.now() };
                
                const setStartTime = performance.now();
                await redis.set(key, JSON.stringify(value), 60);
                const setTime = performance.now() - setStartTime;
                results.sets.push(setTime);
                
                const getStartTime = performance.now();
                await redis.get(key);
                const getTime = performance.now() - getStartTime;
                results.gets.push(getTime);
                
            } catch (error) {
                results.errors++;
                console.error(`Redis operation ${i} failed:`, error.message);
            }
            
            if (i % 100 === 0) {
                console.log(`Completed ${i}/${operations} Redis operations`);
            }
        }
        
        await redis.disconnect();
        
        return {
            averageSetTime: results.sets.reduce((a, b) => a + b, 0) / results.sets.length,
            averageGetTime: results.gets.reduce((a, b) => a + b, 0) / results.gets.length,
            totalErrors: results.errors,
            successRate: ((operations * 2 - results.errors) / (operations * 2)) * 100
        };
    }

    async testEconomicCalculations(iterations = 10000) {
        console.log(`💰 Testing economic calculations with ${iterations} iterations`);
        
        const economics = require('../utils/economics');
        const results = {
            calculationTimes: [],
            errors: 0
        };
        
        for (let i = 0; i < iterations; i++) {
            try {
                const startTime = performance.now();
                
                const amount = Math.random() * 1000;
                const level = Math.floor(Math.random() * 50) + 1;
                
                economics.calculateWorkPayout(amount, level);
                economics.calculateTax(amount, 'withdrawal');
                economics.calculateBurnAmount(amount, 'entertainment_loss');
                economics.calculateInterest(amount, 'daily');
                
                const calculationTime = performance.now() - startTime;
                results.calculationTimes.push(calculationTime);
                
            } catch (error) {
                results.errors++;
                console.error(`Economic calculation ${i} failed:`, error.message);
            }
        }
        
        return {
            averageCalculationTime: results.calculationTimes.reduce((a, b) => a + b, 0) / results.calculationTimes.length,
            totalErrors: results.errors,
            successRate: ((iterations - results.errors) / iterations) * 100
        };
    }

    recordSuccess(responseTime) {
        this.results.totalRequests++;
        this.results.successfulRequests++;
        this.results.responseTimes.push(responseTime);
        
        if (responseTime < this.results.minResponseTime) {
            this.results.minResponseTime = responseTime;
        }
        if (responseTime > this.results.maxResponseTime) {
            this.results.maxResponseTime = responseTime;
        }
    }

    recordError(error) {
        this.results.totalRequests++;
        this.results.failedRequests++;
        this.results.errors.push(error.message);
    }

    calculateResults() {
        if (this.results.responseTimes.length > 0) {
            this.results.averageResponseTime = this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
        }
        
        this.results.successRate = (this.results.successfulRequests / this.results.totalRequests) * 100;
        this.results.errorRate = (this.results.failedRequests / this.results.totalRequests) * 100;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateReport() {
        return {
            timestamp: new Date().toISOString(),
            summary: {
                totalRequests: this.results.totalRequests,
                successfulRequests: this.results.successfulRequests,
                failedRequests: this.results.failedRequests,
                successRate: `${this.results.successRate.toFixed(2)}%`,
                errorRate: `${this.results.errorRate.toFixed(2)}%`
            },
            performance: {
                averageResponseTime: `${this.results.averageResponseTime.toFixed(2)}ms`,
                minResponseTime: `${this.results.minResponseTime.toFixed(2)}ms`,
                maxResponseTime: `${this.results.maxResponseTime.toFixed(2)}ms`
            },
            errors: this.results.errors.slice(0, 10)
        };
    }
}

module.exports = LoadTester;

if (require.main === module) {
    async function runLoadTest() {
        const tester = new LoadTester();
        
        console.log('🧪 Starting comprehensive load testing...\n');
        
        const userLoadResults = await tester.simulateUserLoad(50, 30000);
        console.log('✅ User load test completed');
        console.log(`Success rate: ${userLoadResults.successRate.toFixed(2)}%`);
        console.log(`Average response time: ${userLoadResults.averageResponseTime.toFixed(2)}ms\n`);
        
        const dbResults = await tester.testDatabasePerformance(500);
        console.log('✅ Database performance test completed');
        console.log(`Average read time: ${dbResults.averageReadTime.toFixed(2)}ms`);
        console.log(`Average write time: ${dbResults.averageWriteTime.toFixed(2)}ms`);
        console.log(`Success rate: ${dbResults.successRate.toFixed(2)}%\n`);
        
        const redisResults = await tester.testRedisPerformance(500);
        console.log('✅ Redis performance test completed');
        console.log(`Average set time: ${redisResults.averageSetTime.toFixed(2)}ms`);
        console.log(`Average get time: ${redisResults.averageGetTime.toFixed(2)}ms`);
        console.log(`Success rate: ${redisResults.successRate.toFixed(2)}%\n`);
        
        const economicResults = await tester.testEconomicCalculations(5000);
        console.log('✅ Economic calculations test completed');
        console.log(`Average calculation time: ${economicResults.averageCalculationTime.toFixed(2)}ms`);
        console.log(`Success rate: ${economicResults.successRate.toFixed(2)}%\n`);
        
        console.log('🎉 All load tests completed successfully!');
    }
    
    runLoadTest().catch(console.error);
}
