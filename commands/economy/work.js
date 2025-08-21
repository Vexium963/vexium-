const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription(`⚒️ Work at your job to earn VEX tokens and build your empire!`),
    
    cooldown: 10,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'work', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now()
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'work',
                behaviorContext
            );
        }
        
        const now = Date.now();
        const lastWork = userData.lastWork ? new Date(userData.lastWork).getTime() : 0;
        const timeSinceLastWork = now - lastWork;
        const workCooldown = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
        
        if (timeSinceLastWork < workCooldown && !userData.inventory.energy_drink) {
            const timeLeft = workCooldown - timeSinceLastWork;
            const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 20);
            
            const timeDisplay = hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`;
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.COOLDOWN} Work Cooldown Active`)
                .setDescription(`⏳ You need to rest for **${timeDisplay}** before working again.\n\n🔥 ${fomoMessage}\n📈 ${socialProofMessage}`)
                .addFields(
                    { name: '💡 Tip', value: 'Use an Energy Drink from `/shop` to skip cooldown!', inline: false },
                    { name: '⏰ Next Work Available', value: `<t:${Math.floor((lastWork + workCooldown) / 1000)}:R>`, inline: false }
                )
                .setColor(constants.COLORS.WARNING)
                .setTimestamp();
            
            if (!interaction.replied && !interaction.deferred) {
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
        
        if (!userData.job) {
            return this.showJobSelection(interaction, userData);
        }
        
        const jobData = Economics.getJobData(userData.job);
        if (!jobData) {
            return this.showJobSelection(interaction, userData);
        }
        
        let workPay = Economics.calculateWorkPay(userData.job, userData.jobLevel, userData.inventory);
        
        if (userData.premiumTier) {
            const tier = constants.PREMIUM_TIERS[userData.premiumTier.toUpperCase()];
            if (tier) {
                workPay *= tier.benefits.workBonus;
            }
        }
        
        if (userData.activeEffects?.work_multiplier) {
            workPay *= userData.activeEffects.work_multiplier.value;
            delete userData.activeEffects.work_multiplier;
        }
        
        const vexEarned = Math.round(workPay * constants.VEX_TOKEN.WORK_MULTIPLIER * 100) / 100;
        
        await user.addVEX(vexEarned, `work_${userData.job}`);
        Economics.updateVEXMarket('work', vexEarned);
        
        const xpGained = jobData.xpReward + Math.floor(Math.random() * 10);
        const jobXpGained = Math.floor(xpGained * 0.5);
        
        const xpResult = await user.addXP(xpGained, 'work');
        
        userData.jobXp += jobXpGained;
        const jobXpNeeded = (userData.jobLevel + 1) * 500;
        let jobLevelUp = false;
        
        if (userData.jobXp >= jobXpNeeded) {
            userData.jobLevel++;
            userData.jobXp -= jobXpNeeded;
            jobLevelUp = true;
        }
        
        userData.lastWork = new Date().toISOString();
        userData.stats.commandsUsed = (userData.stats.commandsUsed || 0) + 1;
        userData.stats.workSessions = (userData.stats.workSessions || 0) + 1;
        
        if (userData.inventory.energy_drink && timeSinceLastWork < workCooldown) {
            userData.inventory.energy_drink--;
            if (userData.inventory.energy_drink === 0) {
                delete userData.inventory.energy_drink;
            }
        }
        
        await user.save(userData);
        
        const workStreak = userData.stats.workStreak || 0;
        const isProductiveDay = workStreak >= 5;
        const bonusChance = Math.random();
        const gotBonus = bonusChance < (isProductiveDay ? 0.25 : 0.15);
        const bonusAmount = gotBonus ? Math.floor(vexEarned * 0.3) : 0;
        
        const totalWorkSessions = userData.stats.workSessions || 0;
        const isWorkExpert = totalWorkSessions >= 100;
        const isWorkNovice = totalWorkSessions < 10;
        const urgencyBonus = Math.random() < 0.15 ? Math.floor(vexEarned * 0.2) : 0;
        
        const socialProof = Math.random() < 0.3;
        const activeWorkers = Math.floor(Math.random() * 25) + 10;
        
        let title = `${constants.EMOJIS.WORK} Work Complete!`;
        let description = `💪 You crushed it as a **${jobData.name}**!\n💰 **${vexEarned.toFixed(2)} VEX (~$${(vexEarned * Economics.getCurrentVEXPrice()).toFixed(2)})** earned!`;
        
        if (isWorkExpert) {
            title = `👑 WORK MASTER IN ACTION!`;
            description = `🏆 **${totalWorkSessions} work sessions completed!** You're a productivity legend!\n💰 **${vexEarned.toFixed(2)} VEX (~$${(vexEarned * Economics.getCurrentVEXPrice()).toFixed(2)})** earned with expert efficiency!`;
        } else if (isWorkNovice) {
            title = `🌟 BUILDING YOUR WORK EMPIRE!`;
            description += `\n🚀 **Building your reputation!** (${totalWorkSessions}/100 sessions)`;
        }
        
        if (gotBonus) {
            title = `🎉 EXCEPTIONAL PERFORMANCE!`;
            description += `\n✨ **PERFORMANCE BONUS: +${bonusAmount} VEX!**`;
            await user.addVEX(bonusAmount, 'performance_bonus');
            Economics.updateVEXMarket('work', bonusAmount);
        }
        
        if (urgencyBonus > 0) {
            description += `\n⚡ **PRODUCTIVITY SURGE: +${urgencyBonus} VEX!** You're on fire!`;
            await user.addVEX(urgencyBonus, 'productivity_surge');
            Economics.updateVEXMarket('work', urgencyBonus);
        }
        
        if (workStreak >= 10) {
            title = `🔥 WORK MACHINE! ${workStreak} Days Strong!`;
            description += `\n🏆 **PRODUCTIVITY LEGEND STATUS!**`;
        }
        
        if (socialProof) {
            description += `\n📈 **${activeWorkers} players are working right now!** Join the productivity wave!`;
        }
        
        const jobProgress = (userData.jobXp || 0) / ((userData.jobLevel + 1) * 500);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const jobProgressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Job Progress: Level ${userData.jobLevel}`,
            jobProgress,
            constants.COLORS.VEX
        );
        
        const motivationalMessages = [
            "🚀 You're building an empire!",
            "💎 Every VEX brings you closer to wealth!",
            "⚡ Your dedication is paying off!",
            "🌟 Success is in your hands!",
            "🔥 Keep grinding, legend!"
        ];
        
        const randomMotivation = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.updateChallengeProgress(interaction.user.id, 'work', 1);
        }
        
        const workEmbed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description + `\n\n✨ ${randomMotivation}\n📈 **${Math.floor(Math.random() * 50) + 20} players** are working right now!`)
            .addFields(
                { name: '💼 Career', value: `${jobData.name} (Level ${userData.jobLevel})`, inline: true },
                { name: '💰 Total Earned', value: `${(vexEarned + bonusAmount).toFixed(2)} VEX (~$${((vexEarned + bonusAmount) * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '💼 New Balance', value: `${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '📊 Job Progress', value: `${Math.floor(jobProgress * 100)}% to next level`, inline: false },
                { name: '🔥 Work Streak', value: `${workStreak} days ${workStreak >= 10 ? '👑' : ''}`, inline: true },
                { name: '⏰ Next Work', value: `<t:${Math.floor((now + workCooldown) / 1000)}:R>`, inline: true }
            )
            .setColor(gotBonus ? constants.COLORS.VEX : constants.COLORS.SUCCESS)
            .setTimestamp();
        
        if (userData.premiumTier) {
            workEmbed.addFields({ 
                name: `${constants.EMOJIS.PREMIUM} Premium Bonus`, 
                value: `${userData.premiumTier} multiplier active`, 
                inline: true 
            });
        }
        
        workEmbed.setImage('attachment://progress.png');

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                embeds: [workEmbed],
                files: [{ attachment: jobProgressBuffer, name: 'progress.png' }]
            });
        }
        
        if (xpResult.leveledUp) {
            const levelEmbed = new EmbedBuilder()
                .setTitle(`⬆️ Level Up!`)
                .setDescription(`⬆️ You've reached **Level ${xpResult.newLevel}**!\n\n🎉 **New opportunities unlocked!** Check out...`)
                .addFields(
                    { name: '🎁 Level Reward', value: `${xpResult.levelReward.toFixed(2)} VEX (~$${(xpResult.levelReward * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true }
                )
                .setColor(constants.COLORS.GOLD);
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [levelEmbed] });
            }
        }
        
        if (jobLevelUp) {
            const jobBonus = userData.jobLevel * 1.00;
            await user.addVEX(jobBonus, 'job_level_bonus');
            Economics.updateVEXMarket('work', jobBonus);
            
            const jobLevelEmbed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.TROPHY} Job Level Up!`)
                .setDescription(`🏆 Your **${jobData.name}** skills improved to Level ${userData.jobLevel}!\n\n💸 **Higher earning...`)
                .addFields(
                    { name: '🎁 Bonus', value: `${jobBonus.toFixed(2)} VEX (~$${(jobBonus * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true }
                )
                .setColor(constants.COLORS.INFO);
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [jobLevelEmbed] });
            }
        }
    },
    
    async showJobSelection(interaction, userData) {
        const availableJobs = Economics.getAvailableJobs(userData.level);
        
        if (availableJobs.length === 0) {
            const comebackMessage = constants.COMEBACK_MESSAGES[Math.floor(Math.random() * constants.COMEBACK_MESSAGES.length)];
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} No Jobs Available`)
                .setDescription(`⏳ You need to reach level 1 to unlock jobs.\n\n🚀 ${comebackMessage}\n\n✨ **Quick Start:** Use \`/daily\` to gain XP and level up fast!`)
                .setColor(constants.COLORS.ERROR);
            
            if (!interaction.replied && !interaction.deferred) {
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
        
        const jobOptions = availableJobs.slice(0, 25).map(job => ({
            label: job.name,
            description: `${Economics.getPeggedVEXPrice(job.minPayUSD || 2).toFixed(2)}-${Economics.getPeggedVEXPrice(job.maxPayUSD || 8).toFixed(2)} VEX | Level ${job.requiredLevel}+`,
            value: job.id
        }));
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_job')
            .setPlaceholder(`${constants.ANIMATED_EMOJIS.PROGRESS} Choose your job to start earning VEX`)
            .addOptions(jobOptions);
        
        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.WORK} Choose Your Job`)
            .setDescription(`${constants.ANIMATED_EMOJIS.WORK || '⚒️'} Select a job from the menu below to start working and e...`)
            .addFields(
                { name: '📊 Your Level', value: userData.level.toString(), inline: true },
                { name: '🔓 Available Jobs', value: availableJobs.length.toString(), inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setFooter({ text: 'Higher level jobs pay more VEX!' });
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const levelProgress = userData.level / 10; // Show level progress
        const levelProgressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Your Level: ${userData.level}`,
            levelProgress,
            constants.COLORS.PRIMARY
        );

        embed.setImage('attachment://progress.png');

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                embeds: [embed], 
                components: [row], 
                files: [{ attachment: levelProgressBuffer, name: 'progress.png' }],
                ephemeral: true 
            });
        }
    }
};
