const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const CanvasRenderer = require('../../utils/canvasRenderer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription(`✨ View and customize your legendary VexiumVerse profile - Stand out from the crowd!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription(`🔥 View a user's epic profile and achievements`)
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription(`✨ User to view profile of - Discover their empire!`)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('bio')
                .setDescription(`💓 Set your profile bio - Express your legendary status!`)
                .addStringOption(option =>
                    option.setName('text')
                        .setDescription(`✨ Your bio text - Make it legendary! (max 200 characters)`)
                        .setRequired(true)
                        .setMaxLength(200)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('color')
                .setDescription(`🌈 Set your profile embed color - Show your unique style!`)
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription(`🌈 Hex color code - Make your profile shine! (e.g., #FF0000)`)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription(`🎉 Set your profile status - Let everyone know what you're conquering!`)
                .addStringOption(option =>
                    option.setName('status')
                        .setDescription(`🔥 Your status - Show your current empire activity!`)
                        .setRequired(true)
                        .addChoices(
                            { name: 'Active', value: 'Active' },
                            { name: 'Away', value: 'Away' },
                            { name: 'Busy', value: 'Busy' },
                            { name: 'Investing', value: 'Investing' },
                            { name: 'Trading', value: 'Trading' },
                            { name: 'Playing Games', value: 'Playing Games' }
                        ))),
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                profileCustomization: true,
                socialEngagement: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'profile',
                behaviorContext
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(
                interaction.user.id,
                'profile',
                true
            );
        }
        
        const profileViews = userData.stats.profileViews || 0;
        const isProfileExpert = profileViews >= 50;
        const recentCustomization = userData.stats.lastProfileUpdate && 
            (Date.now() - new Date(userData.stats.lastProfileUpdate).getTime()) < 86400000;
        
        if (Math.random() < 0.2 && !recentCustomization) {
            const urgencyBonus = Math.floor(Math.random() * 25) + 10;
            const socialProof = Math.floor(Math.random() * 15) + 5;
            
            const motivationEmbed = new EmbedBuilder()
                .setTitle(`🌟 PROFILE POWER-UP OPPORTUNITY!`)
                .setDescription(`🔥 **${socialProof} players are customizing profiles RIGHT NOW!**\n✨ **Limited Time:** Profile up...`)
                .addFields(
                    { name: '🎯 Quick Actions', value: '`/profile bio` - **Express yourself!**\n`/profile color` - **Show your style!**\n`/profile status` - **Let others know what you\'re up to!**', inline: false },
                    { name: '🏆 Profile Benefits', value: `${isProfileExpert ? '👑 **Profile Master** - You inspire others!' : '🌟 **Build your reputation** - Customized profiles get 3x more views!'}`, inline: false }
                )
                .setColor(constants.COLORS.VEX)
                .setFooter({ text: '⏰ Bonus XP expires at midnight! Don\'t miss out!' })
                .setTimestamp();
            
            await interaction.followUp({ embeds: [motivationEmbed], ephemeral: true });
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'view':
                return this.handleView(interaction);
            case 'bio':
                return this.handleBio(interaction);
            case 'color':
                return this.handleColor(interaction);
            case 'status':
                return this.handleStatus(interaction);
        }
    },
    
    async handleView(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const isOwnProfile = targetUser.id === interaction.user.id;
        
        const user = new User(targetUser.id);
        const userData = await user.load();
        
        if (!isOwnProfile && userData.settings.privacy === 'private') {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Private Profile`)
                .setDescription(`🔥 ${targetUser.username}'s profile is set to private.\n\n${fomoMessage}\n\n✨ **FOMO Alert:** Cus...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const profileColor = userData.profile.color || constants.COLORS.PRIMARY;
        
        const profileViews = userData.stats.profileViews || 0;
        const isPopular = profileViews >= 100;
        const recentActivity = Date.now() - (userData.lastActive || Date.now()) < 3600000; // 1 hour
        const socialRank = this.calculateSocialRank(userData);
        
        let title = `${constants.EMOJIS.DIAMOND} ${targetUser.username}'s Profile`;
        if (isPopular) {
            title = `🌟 POPULAR PROFILE: ${targetUser.username}`;
        }
        if (userData.premiumTier) {
            title = `👑 VIP PROFILE: ${targetUser.username}`;
        }
        
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 75) + 25);
        const milestoneMessage = userData.level >= 10 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const levelProgressXPValue = userData.xp / (userData.level * 100);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Level ${userData.level} Progress: ${userData.xp}/${userData.level * 100} XP`,
            levelProgressXPValue,
            constants.COLORS.VEX
        );

        const embed = new EmbedBuilder()
            .setTitle(`✨ ${title}`)
            .setColor(profileColor)
            .setImage('attachment://progress.png')
            .setTimestamp();
        
        if (userData.profile.bio) {
            embed.setDescription(userData.profile.bio);
        }
        
        const wealthRank = userData.networth >= 10000 ? '🐋 Whale' : userData.networth >= 1000 ? '🦈 Shark' : '🐟 Fish';
        const levelProgressValue = this.calculateLevelProgress(userData);
        const statusEmoji = this.getStatusEmoji(userData.profile.status || 'Active');
        
        embed.addFields(
            { name: '💰 Net Worth', value: `$${userData.networth.toFixed(2)} VEX ${wealthRank}`, inline: true },
            { name: '🎯 Level Progress', value: `Level ${userData.level}\nSee progress bar below`, inline: true },
            { name: '📊 Status', value: `${statusEmoji} ${userData.profile.status || 'Active'}${recentActivity ? ' 🟢 ONLINE' : ''}`, inline: true }
        );
        
        if (userData.job) {
            embed.addFields({
                name: '💼 Occupation',
                value: `${userData.job} (Level ${userData.jobLevel})`,
                inline: true
            });
        }
        
        if (userData.dailyStreak > 0) {
            embed.addFields({
                name: '🔥 Daily Streak',
                value: `${userData.dailyStreak} days`,
                inline: true
            });
        }
        
        if (userData.premiumTier) {
            const tier = constants.PREMIUM_TIERS[userData.premiumTier.toUpperCase()];
            embed.addFields({
                name: `${constants.EMOJIS.PREMIUM} Premium Status`,
                value: `${tier.badge} ${tier.name}`,
                inline: true
            });
        }
        
        if (userData.achievements && userData.achievements.length > 0) {
            const recentAchievements = userData.achievements.slice(-3);
            const achievementText = recentAchievements.map(id => {
                const achievement = constants.ACHIEVEMENTS.find(a => a.id === id);
                return achievement ? `${achievement.icon} ${achievement.name}` : id;
            }).join('\n');
            
            embed.addFields({
                name: `🏆 Recent Achievements (${userData.achievements.length}/${constants.ACHIEVEMENTS.length})`,
                value: achievementText,
                inline: false
            });
        }
        
        if (userData.profile.badges && userData.profile.badges.length > 0) {
            embed.addFields({
                name: '🏅 Badges',
                value: userData.profile.badges.join(' '),
                inline: false
            });
        }
        
        if (isOwnProfile) {
            embed.addFields(
                { name: '📈 Total Earned', value: `$${userData.stats.totalEarned.toFixed(2)} VEX`, inline: true },
                { name: '🎮 Games Played', value: userData.stats.gamesPlayed.toString(), inline: true },
                { name: '🤝 Trades Completed', value: userData.stats.tradesCompleted.toString(), inline: true }
            );
        }
        
        const joinDate = new Date(userData.createdAt).toLocaleDateString();
        let footerText = `VexiumVerse member since ${joinDate}`;
        if (Math.random() < 0.4) {
            footerText += ` • ${socialProofMessage}`;
        }
        if (milestoneMessage && Math.random() < 0.3) {
            footerText += ` • ${milestoneMessage}`;
        }
        embed.setFooter({ text: footerText });
        
        const components = [];
        if (isOwnProfile) {
            const actionRow = new ActionRowBuilder();
            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`profile_edit_${interaction.user.id}`)
                    .setLabel('Edit Profile')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('✏️'),
                new ButtonBuilder()
                    .setCustomId(`profile_share_${interaction.user.id}`)
                    .setLabel('Share Profile')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📤'),
                new ButtonBuilder()
                    .setCustomId(`profile_achievements_${interaction.user.id}`)
                    .setLabel('View Achievements')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🏆')
            );
            components.push(actionRow);
        }
        
        try {
            const canvasRenderer = new CanvasRenderer();
            const profileBuffer = await canvasRenderer.createProfileCard(userData, targetUser);
            const attachment = new AttachmentBuilder(profileBuffer, { name: 'profile-card.png' });
            
            embed.setImage('attachment://profile-card.png');
            
            await interaction.reply({ 
                embeds: [embed], 
                files: [attachment, { attachment: progressBuffer, name: 'progress.png' }],
                components: components.length > 0 ? components : undefined
            });
        } catch (error) {
            console.warn('Canvas rendering failed, using fallback:', error);
            embed.setThumbnail(targetUser.displayAvatarURL({ size: 256 }));
            await interaction.reply({ 
                embeds: [embed],
                files: [{ attachment: progressBuffer, name: 'progress.png' }],
                components: components.length > 0 ? components : undefined
            });
        }
        
        if (isOwnProfile) {
            userData.stats.commandsUsed++;
            await user.save(userData);
        }
    },
    
    async handleBio(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const bioText = interaction.options.getString('text');
        
        if (bioText.length > 200) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Bio Too Long`)
                .setDescription(`${constants.ANIMATED_EMOJIS.FIRE} Bio must be 200 characters or less.\n\n${fomoMessage}\n\n${cons...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        userData.profile.bio = bioText;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const variableReward = Math.random() < 0.3 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 30) + 10);
        
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            'Profile Customization Progress',
            0.75,
            constants.COLORS.SUCCESS
        );

        const embed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.SPARKLES} Bio Updated!`)
            .setDescription(`Your bio has been set to:\n\n*${bioText}*${variableReward ? `\n\n${variableReward}` : ''}\n\n${socialProofMessage}`)
            .setColor(constants.COLORS.SUCCESS)
            .setImage('attachment://progress.png')
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleColor(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const colorInput = interaction.options.getString('color');
        
        if (!userData.inventory.custom_color && !userData.premiumTier) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Feature Locked`)
                .setDescription('You need to purchase "Custom Color" from the shop or have Premium status to use custom colors.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (!/^#[0-9A-F]{6}$/i.test(colorInput)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Invalid Color`)
                .setDescription('Please provide a valid hex color code (e.g., #FF0000 for red).')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        userData.profile.color = colorInput;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            'Profile Customization Progress',
            0.85,
            colorInput
        );

        const embed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.RAINBOW} Color Updated!`)
            .setDescription(`${constants.ANIMATED_EMOJIS.SPARKLES} Your profile color has been updated!`)
            .setColor(colorInput)
            .setImage('attachment://progress.png')
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleStatus(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const status = interaction.options.getString('status');
        
        userData.profile.status = status;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const statusEmojis = {
            'Active': '🟢',
            'Away': '🟡',
            'Busy': '🔴',
            'Investing': '📈',
            'Trading': '🤝',
            'Playing Games': '🎮'
        };
        
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            'Profile Customization Progress',
            0.9,
            constants.COLORS.SUCCESS
        );

        const embed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.CELEBRATION} Status Updated!`)
            .setDescription(`${constants.ANIMATED_EMOJIS.HEART_BEAT} Your status is now: ${statusEmojis[status] || '⚪'} **${st...`)
            .setColor(constants.COLORS.SUCCESS)
            .setImage('attachment://progress.png')
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    }
};
