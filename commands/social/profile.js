const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const CanvasRenderer = require('../../utils/canvasRenderer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View and customize your VexiumVerse profile')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View a user profile')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to view profile of')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('bio')
                .setDescription('Set your profile bio')
                .addStringOption(option =>
                    option.setName('text')
                        .setDescription('Your bio text (max 200 characters)')
                        .setRequired(true)
                        .setMaxLength(200)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('color')
                .setDescription('Set your profile embed color')
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('Hex color code (e.g., #FF0000)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Set your profile status')
                .addStringOption(option =>
                    option.setName('status')
                        .setDescription('Your status')
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
                .setDescription(`🔥 **${socialProof} players are customizing profiles RIGHT NOW!**\n✨ **Limited Time:** Profile updates earn +${urgencyBonus} XP bonus today!\n💎 **Stand out from the crowd and show your legendary status!**`)
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
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Private Profile`)
                .setDescription(`${targetUser.username}'s profile is set to private.`)
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
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(profileColor)
            .setTimestamp();
        
        if (userData.profile.bio) {
            embed.setDescription(userData.profile.bio);
        }
        
        const wealthRank = userData.networth >= 10000 ? '🐋 Whale' : userData.networth >= 1000 ? '🦈 Shark' : '🐟 Fish';
        const levelProgress = this.calculateLevelProgress(userData);
        const statusEmoji = this.getStatusEmoji(userData.profile.status || 'Active');
        
        embed.addFields(
            { name: '💰 Net Worth', value: `$${userData.networth.toFixed(2)} VEX ${wealthRank}`, inline: true },
            { name: '🎯 Level Progress', value: `${userData.level} ${levelProgress.bar}\n${levelProgress.percentage}% to next level`, inline: true },
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
        embed.setFooter({ text: `VexiumVerse member since ${joinDate}` });
        
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
                files: [attachment],
                components: components.length > 0 ? components : undefined
            });
        } catch (error) {
            console.warn('Canvas rendering failed, using fallback:', error);
            embed.setThumbnail(targetUser.displayAvatarURL({ size: 256 }));
            await interaction.reply({ 
                embeds: [embed],
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
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Bio Too Long`)
                .setDescription('Bio must be 200 characters or less.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        userData.profile.bio = bioText;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Bio Updated!`)
            .setDescription(`Your bio has been set to:\n\n*${bioText}*`)
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
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
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Color Updated!`)
            .setDescription('Your profile color has been updated!')
            .setColor(colorInput)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
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
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Status Updated!`)
            .setDescription(`Your status is now: ${statusEmojis[status] || '⚪'} **${status}**`)
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
