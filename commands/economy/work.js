const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Work at your job to earn VEX tokens')
        .addStringOption(option =>
            option.setName('job')
                .setDescription('Choose a specific job to work')
                .setRequired(false)),
    
    cooldown: 10,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const now = Date.now();
        const lastWork = userData.lastWork ? new Date(userData.lastWork).getTime() : 0;
        const timeSinceLastWork = now - lastWork;
        const workCooldown = constants.COOLDOWNS.WORK;
        
        if (timeSinceLastWork < workCooldown && !userData.inventory.energy_drink) {
            const timeLeft = workCooldown - timeSinceLastWork;
            const minutesLeft = Math.floor(timeLeft / (60 * 1000));
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.COOLDOWN} Work Cooldown Active`)
                .setDescription(`You need to rest for **${minutesLeft} minutes** before working again.`)
                .addFields(
                    { name: '💡 Tip', value: 'Use an Energy Drink from `/shop` to skip cooldown!', inline: false }
                )
                .setColor(constants.COLORS.WARNING)
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const jobChoice = interaction.options.getString('job');
        
        if (!userData.job && !jobChoice) {
            return this.showJobSelection(interaction, userData);
        }
        
        if (jobChoice) {
            const availableJobs = Economics.getAvailableJobs(userData.level);
            const selectedJob = availableJobs.find(job => job.id === jobChoice);
            
            if (!selectedJob) {
                const embed = new EmbedBuilder()
                    .setTitle(`${constants.EMOJIS.ERROR} Job Not Available`)
                    .setDescription(`You don't have access to the **${jobChoice}** job yet.`)
                    .addFields(
                        { name: '📊 Your Level', value: userData.level.toString(), inline: true },
                        { name: '🔓 Required Level', value: 'Check available jobs below', inline: true }
                    )
                    .setColor(constants.COLORS.ERROR);
                
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            userData.job = jobChoice;
            userData.jobLevel = 1;
            userData.jobXp = 0;
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
        userData.stats.commandsUsed++;
        
        if (userData.inventory.energy_drink && timeSinceLastWork < workCooldown) {
            userData.inventory.energy_drink--;
            if (userData.inventory.energy_drink === 0) {
                delete userData.inventory.energy_drink;
            }
        }
        
        await user.save(userData);
        
        const workEmbed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.WORK} Work Complete!`)
            .setDescription(`You worked as a **${jobData.name}** and earned VEX!`)
            .addFields(
                { name: '💰 VEX Earned', value: `$${vexEarned.toFixed(2)}`, inline: true },
                { name: '📊 New Balance', value: `$${userData.vexBalance.toFixed(2)}`, inline: true },
                { name: '🎯 XP Gained', value: `+${xpGained} XP`, inline: true },
                { name: '💼 Job Level', value: `${userData.jobLevel} (${userData.jobXp}/${(userData.jobLevel + 1) * 500} XP)`, inline: true },
                { name: '⏰ Next Work', value: `<t:${Math.floor((now + workCooldown) / 1000)}:R>`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        if (userData.premiumTier) {
            workEmbed.addFields({ 
                name: `${constants.EMOJIS.PREMIUM} Premium Bonus`, 
                value: `${userData.premiumTier} multiplier active`, 
                inline: true 
            });
        }
        
        await interaction.reply({ embeds: [workEmbed] });
        
        if (xpResult.leveledUp) {
            const levelEmbed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.LEVEL_UP} Level Up!`)
                .setDescription(`You've reached **Level ${xpResult.newLevel}**!`)
                .addFields(
                    { name: '🎁 Level Reward', value: `$${xpResult.levelReward.toFixed(2)} VEX`, inline: true }
                )
                .setColor(constants.COLORS.GOLD);
            
            await interaction.followUp({ embeds: [levelEmbed] });
        }
        
        if (jobLevelUp) {
            const jobBonus = userData.jobLevel * 1.00;
            await user.addVEX(jobBonus, 'job_level_bonus');
            
            const jobLevelEmbed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.TROPHY} Job Level Up!`)
                .setDescription(`Your **${jobData.name}** skills improved to Level ${userData.jobLevel}!`)
                .addFields(
                    { name: '🎁 Bonus', value: `$${jobBonus.toFixed(2)} VEX`, inline: true }
                )
                .setColor(constants.COLORS.INFO);
            
            await interaction.followUp({ embeds: [jobLevelEmbed] });
        }
    },
    
    async showJobSelection(interaction, userData) {
        const availableJobs = Economics.getAvailableJobs(userData.level);
        
        if (availableJobs.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} No Jobs Available`)
                .setDescription('You need to reach level 1 to unlock jobs.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const jobOptions = availableJobs.slice(0, 25).map(job => ({
            label: job.name,
            description: `$${job.minPay.toFixed(2)}-$${job.maxPay.toFixed(2)} VEX | Level ${job.requiredLevel}+`,
            value: job.id
        }));
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_job')
            .setPlaceholder('Choose a job to work')
            .addOptions(jobOptions);
        
        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.WORK} Choose Your Job`)
            .setDescription('Select a job from the menu below to start working and earning VEX!')
            .addFields(
                { name: '📊 Your Level', value: userData.level.toString(), inline: true },
                { name: '🔓 Available Jobs', value: availableJobs.length.toString(), inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setFooter({ text: 'Higher level jobs pay more VEX!' });
        
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};
