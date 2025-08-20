const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

class CanvasRenderer {
    constructor() {
        this.canvasWidth = 800;
        this.canvasHeight = 400;
        this.initialized = false;
    }

    async initialize() {
        try {
            const fontPath = path.join(__dirname, '../assets/fonts');
            this.initialized = true;
            console.log('✅ Canvas renderer initialized');
        } catch (error) {
            console.warn('⚠️ Canvas fonts not found, using system defaults');
            this.initialized = true;
        }
    }

    async createProfileCard(userData, discordUser) {
        if (!this.initialized) await this.initialize();

        const canvas = createCanvas(this.canvasWidth, this.canvasHeight);
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeight);
        const profileColor = userData.profile?.color || '#7C3AED';
        gradient.addColorStop(0, profileColor);
        gradient.addColorStop(1, this.darkenColor(profileColor, 0.3));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        try {
            const avatarUrl = discordUser.displayAvatarURL({ extension: 'png', size: 128 });
            const avatar = await loadImage(avatarUrl);
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(100, 100, 60, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 40, 40, 120, 120);
            ctx.restore();

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(100, 100, 60, 0, Math.PI * 2);
            ctx.stroke();
        } catch (error) {
            console.warn('Failed to load avatar:', error);
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(100, 100, 60, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(discordUser.username, 200, 60);

        ctx.font = '24px Arial';
        ctx.fillText(`Level ${userData.level}`, 200, 100);
        
        const xpProgress = this.calculateXPProgress(userData);
        this.drawProgressBar(ctx, 200, 120, 300, 20, xpProgress, '#10B981', '#374151');
        
        ctx.font = '16px Arial';
        ctx.fillText(`${userData.xp} / ${this.getXPForLevel(userData.level + 1)} XP`, 520, 135);

        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`$${userData.networth.toFixed(2)} VEX`, 200, 180);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '18px Arial';
        const stats = [
            `🏆 Achievements: ${userData.achievements?.length || 0}`,
            `🎮 Games Played: ${userData.stats?.gamesPlayed || 0}`,
            `🤝 Trades: ${userData.stats?.tradesCompleted || 0}`,
            `🔥 Daily Streak: ${userData.dailyStreak || 0}`
        ];

        stats.forEach((stat, index) => {
            ctx.fillText(stat, 200, 220 + (index * 30));
        });

        if (userData.premiumTier) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 20px Arial';
            ctx.fillText('👑 VIP', 650, 60);
        }

        if (userData.profile?.bio) {
            ctx.fillStyle = '#E5E7EB';
            ctx.font = '16px Arial';
            this.wrapText(ctx, userData.profile.bio, 50, 350, 700, 20);
        }

        return canvas.toBuffer('image/png');
    }

    async createProgressCard(title, progress, color = '#10B981') {
        if (!this.initialized) await this.initialize();

        const canvas = createCanvas(400, 100);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#1F2937';
        ctx.fillRect(0, 0, 400, 100);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(title, 20, 30);

        this.drawProgressBar(ctx, 20, 50, 360, 30, progress, color, '#374151');

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Arial';
        ctx.fillText(`${Math.round(progress * 100)}%`, 350, 45);

        return canvas.toBuffer('image/png');
    }

    drawProgressBar(ctx, x, y, width, height, progress, fillColor, bgColor) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, width, height);

        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, width * progress, height);

        ctx.strokeStyle = '#6B7280';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    }

    calculateXPProgress(userData) {
        const currentXP = userData.xp;
        const currentLevelXP = this.getXPForLevel(userData.level);
        const nextLevelXP = this.getXPForLevel(userData.level + 1);
        
        return (currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP);
    }

    getXPForLevel(level) {
        const base = 1000;
        const multiplier = 1.2;
        return Math.floor(base * Math.pow(multiplier, level - 1));
    }

    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        return `rgb(${Math.floor(r * (1 - factor))}, ${Math.floor(g * (1 - factor))}, ${Math.floor(b * (1 - factor))})`;
    }
}

module.exports = CanvasRenderer;
