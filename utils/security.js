const crypto = require('crypto');

class Security {
    static rateLimit = new Map();
    static suspiciousActivity = new Map();
    static bannedUsers = new Set();

    static checkRateLimit(userId, command, limit = 5, window = 60000) {
        const key = `${userId}:${command}`;
        const now = Date.now();
        
        if (!this.rateLimit.has(key)) {
            this.rateLimit.set(key, { count: 1, resetTime: now + window });
            return { allowed: true, remaining: limit - 1 };
        }
        
        const data = this.rateLimit.get(key);
        
        if (now > data.resetTime) {
            this.rateLimit.set(key, { count: 1, resetTime: now + window });
            return { allowed: true, remaining: limit - 1 };
        }
        
        if (data.count >= limit) {
            return { 
                allowed: false, 
                remaining: 0, 
                resetTime: data.resetTime 
            };
        }
        
        data.count++;
        return { allowed: true, remaining: limit - data.count };
    }

    static validateInput(input, type) {
        switch (type) {
            case 'amount':
                return this.validateAmount(input);
            case 'userId':
                return this.validateUserId(input);
            case 'text':
                return this.validateText(input);
            case 'choice':
                return this.validateChoice(input);
            default:
                return { valid: false, reason: 'Unknown validation type' };
        }
    }

    static validateAmount(amount) {
        if (typeof amount !== 'number') {
            return { valid: false, reason: 'Amount must be a number' };
        }
        
        if (amount <= 0) {
            return { valid: false, reason: 'Amount must be positive' };
        }
        
        if (amount > Number.MAX_SAFE_INTEGER) {
            return { valid: false, reason: 'Amount too large' };
        }
        
        if (!Number.isInteger(amount)) {
            return { valid: false, reason: 'Amount must be a whole number' };
        }
        
        return { valid: true };
    }

    static validateUserId(userId) {
        if (typeof userId !== 'string') {
            return { valid: false, reason: 'User ID must be a string' };
        }
        
        if (!/^\d{17,19}$/.test(userId)) {
            return { valid: false, reason: 'Invalid Discord user ID format' };
        }
        
        return { valid: true };
    }

    static validateText(text, maxLength = 1000) {
        if (typeof text !== 'string') {
            return { valid: false, reason: 'Text must be a string' };
        }
        
        if (text.length > maxLength) {
            return { valid: false, reason: `Text too long (max ${maxLength} characters)` };
        }
        
        const suspiciousPatterns = [
            /<@[!&]?\d+>/g,
            /https?:\/\/[^\s]+/g,
            /discord\.gg\/[^\s]+/g
        ];
        
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(text)) {
                return { valid: false, reason: 'Text contains suspicious content' };
            }
        }
        
        return { valid: true };
    }

    static validateChoice(choice, validChoices) {
        if (!validChoices.includes(choice)) {
            return { 
                valid: false, 
                reason: `Invalid choice. Valid options: ${validChoices.join(', ')}` 
            };
        }
        
        return { valid: true };
    }

    static detectSuspiciousActivity(userId, activity) {
        const key = userId;
        const now = Date.now();
        
        if (!this.suspiciousActivity.has(key)) {
            this.suspiciousActivity.set(key, {
                activities: [],
                score: 0,
                lastReset: now
            });
        }
        
        const data = this.suspiciousActivity.get(key);
        
        if (now - data.lastReset > 3600000) {
            data.activities = [];
            data.score = 0;
            data.lastReset = now;
        }
        
        data.activities.push({ type: activity, timestamp: now });
        
        switch (activity) {
            case 'rapid_commands':
                data.score += 10;
                break;
            case 'large_transaction':
                data.score += 5;
                break;
            case 'entertainment_spree':
                data.score += 15;
                break;
            case 'multiple_trades':
                data.score += 8;
                break;
            default:
                data.score += 1;
        }
        
        if (data.score > 50) {
            this.flagUser(userId, 'suspicious_activity', data.score);
            return { suspicious: true, score: data.score };
        }
        
        return { suspicious: false, score: data.score };
    }

    static flagUser(userId, reason, severity = 1) {
        console.log(`🚨 User ${userId} flagged for: ${reason} (severity: ${severity})`);
        
        if (severity > 8) {
            this.bannedUsers.add(userId);
            console.log(`🔒 User ${userId} temporarily banned`);
        }
    }

    static isUserBanned(userId) {
        return this.bannedUsers.has(userId);
    }

    static unbanUser(userId) {
        this.bannedUsers.delete(userId);
        console.log(`🔓 User ${userId} unbanned`);
    }

    static encryptSensitiveData(data) {
        try {
            const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
            const cipher = crypto.createCipher('aes-256-cbc', key);
            let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return encrypted;
        } catch (error) {
            console.error('Encryption error:', error);
            return null;
        }
    }

    static decryptSensitiveData(encryptedData) {
        try {
            const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
            const decipher = crypto.createDecipher('aes-256-cbc', key);
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }

    static generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    static hashPassword(password, salt = null) {
        if (!salt) {
            salt = crypto.randomBytes(16).toString('hex');
        }
        
        const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        return { hash, salt };
    }

    static verifyPassword(password, hash, salt) {
        const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        return hash === verifyHash;
    }

    static logSecurityEvent(userId, event, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            userId,
            event,
            details,
            ip: details.ip || 'unknown'
        };
        
        console.log('🔒 Security Event:', JSON.stringify(logEntry));
        
        if (process.env.SECURITY_WEBHOOK_URL) {
            this.sendSecurityWebhook(logEntry);
        }
    }

    static async sendSecurityWebhook(logEntry) {
        try {
            const axios = require('axios');
            
            const embed = {
                title: '🔒 Security Alert',
                description: `**Event:** ${logEntry.event}\n**User:** <@${logEntry.userId}>\n**Time:** ${logEntry.timestamp}`,
                color: 0xFF0000,
                fields: Object.entries(logEntry.details).map(([key, value]) => ({
                    name: key,
                    value: String(value),
                    inline: true
                }))
            };
            
            await axios.post(process.env.SECURITY_WEBHOOK_URL, {
                embeds: [embed]
            });
        } catch (error) {
            console.error('Failed to send security webhook:', error);
        }
    }

    static sanitizeUserInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .trim()
            .substring(0, 1000);
    }

    static checkMaintenanceMode() {
        return process.env.MAINTENANCE_MODE === 'true';
    }

    static isMaintenanceAllowed(userId) {
        const allowedUsers = (process.env.MAINTENANCE_ALLOWED_USERS || '').split(',');
        return allowedUsers.includes(userId);
    }

    static generateAuditLog(userId, action, details = {}) {
        const auditEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            userId,
            action,
            details,
            hash: crypto.createHash('sha256')
                .update(`${userId}${action}${JSON.stringify(details)}${Date.now()}`)
                .digest('hex')
        };
        
        console.log('📋 Audit Log:', JSON.stringify(auditEntry));
        return auditEntry;
    }
}

module.exports = Security;
