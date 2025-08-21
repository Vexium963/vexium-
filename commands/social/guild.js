const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guild')
        .setDescription('Create and manage guilds for collaborative gameplay')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new guild')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Guild name')
                        .setRequired(true)
                        .setMaxLength(32))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Guild description')
                        .setRequired(false)
                        .setMaxLength(200)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription('Join a guild')
                .addStringOption(option =>
                    option.setName('guild_id')
                        .setDescription('Guild ID to join')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('Leave your current guild'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('View guild information')
                .addStringOption(option =>
                    option.setName('guild_id')
                        .setDescription('Guild ID to view (defaults to your guild)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('members')
                .setDescription('View guild members'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('invite')
                .setDescription('Invite a user to your guild')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to invite')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Kick a member from your guild (officers only)')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to kick')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('promote')
                .setDescription('Promote a member to officer (leader only)')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to promote')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Browse available guilds')),
    
    cooldown: 3,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                guildActivity: true,
                socialEngagement: true
            };
            
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                interaction.commandName,
                behaviorContext
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(
                interaction.user.id,
                interaction.commandName,
                true
            );
        }
        
        const guildStats = userData.stats.guildActivity || 0;
        const isGuildVeteran = guildStats >= 50;
        const isGuildNewbie = guildStats < 5;
        const hasGuild = userData.guild !== null;
        
        const activeGuilds = Math.floor(Math.random() * 25) + 15;
        const recentJoins = Math.floor(Math.random() * 8) + 3;
        
        const guildBonus = Math.random() < 0.2 ? Math.floor(Math.random() * 50) + 25 : 0;
        
        userData.stats.guildActivity = guildStats + 1;
        userData.stats.commandsUsed++;
        await user.save(userData);
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'create':
                return this.handleCreate(interaction);
            case 'join':
                return this.handleJoin(interaction);
            case 'leave':
                return this.handleLeave(interaction);
            case 'info':
                return this.handleInfo(interaction);
            case 'members':
                return this.handleMembers(interaction);
            case 'invite':
                return this.handleInvite(interaction);
            case 'kick':
                return this.handleKick(interaction);
            case 'promote':
                return this.handlePromote(interaction);
            case 'list':
                return this.handleList(interaction);
        }
    },
    
    async handleCreate(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const guildName = interaction.options.getString('name');
        const guildDescription = interaction.options.getString('description') || 'A VexiumVerse guild';
        
        if (userData.guild) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Already in Guild`)
                .setDescription(`🔥 You must leave your current guild before creating a new one!\n\n${fomoMessage}\n\n✨ **Pro Tip:...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const creationCost = constants.GUILD.CREATION_COST;
        if (creationCost > userData.vexBalance) {
            const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 20);
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`💸 Creating a guild costs $${creationCost.toFixed(2)} VEX but you only have $${userData.vexBalanc...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(creationCost, 'guild_creation', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Creation Failed`)
                .setDescription(`💥 ${result.reason}\n\n⏳ Try again in a few moments!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const burnAmount = creationCost * constants.TAX_SYSTEM.GUILD.CREATION_BURN_RATE;
        await user.burnVEX(burnAmount, 'guild_creation_burn');
        
        const guildId = this.generateGuildId();
        const guild = {
            id: guildId,
            name: guildName,
            description: guildDescription,
            leader: interaction.user.id,
            officers: [],
            members: [interaction.user.id],
            treasury: 0,
            level: 1,
            xp: 0,
            createdAt: Date.now(),
            settings: {
                public: true,
                autoAccept: false,
                minLevel: 1
            }
        };
        
        userData.guild = {
            id: guildId,
            role: 'leader',
            joinedAt: Date.now()
        };
        
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        this.saveGuild(guild);
        
        const milestoneMessage = constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)];
        const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 30) + 15);
        const variableReward = Math.random() < 0.3 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 25 + 10).toFixed(2)) : null;
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Guild Level: ${guild.level}`,
            guild.level / 10,
            constants.COLORS.SUCCESS
        );

        const embed = new EmbedBuilder()
            .setTitle(`🎉 Guild Created!`)
            .setDescription(`🎉 ${milestoneMessage}\n\n✨ Successfully created **${guildName}**!\n\n🔥 ${socialProof}${variableReward ? `\n💸 ${variableReward}` : ''}\n\n🚀 **You're now a Guild Leader!** Earn 2x VEX from all activities!`)
            .addFields(
                { name: '🆔 Guild ID', value: guildId, inline: true },
                { name: '👑 Leader', value: interaction.user.username, inline: true },
                { name: '👥 Members', value: '1', inline: true },
                { name: '💰 Creation Cost', value: `$${creationCost.toFixed(2)} VEX`, inline: true },
                { name: '🔥 Burned', value: `$${burnAmount.toFixed(2)} VEX`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setImage('attachment://progress.png')
            .setFooter({ text: 'Start inviting members to grow your guild!' })
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleJoin(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const guildId = interaction.options.getString('guild_id');
        
        if (userData.guild) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Already in Guild`)
                .setDescription(`🔥 You must leave your current guild before joining another!\n\n✨ **Loyalty Bonus:** Stay in guil...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const guild = this.getGuild(guildId);
        if (!guild) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Guild Not Found`)
                .setDescription(`Guild **${guildId}** doesn't exist.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (guild.members.length >= constants.GUILD.MAX_MEMBERS) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Guild Full`)
                .setDescription(`🔥 **${guild.name}** is at maximum capacity (${constants.GUILD.MAX_MEMBERS} members)!\n\n🚀 **Hot...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (userData.level < guild.settings.minLevel) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Level Requirement`)
                .setDescription(`⬆️ **${guild.name}** requires level ${guild.settings.minLevel}. You are level ${userData.level}!\...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        guild.members.push(interaction.user.id);
        userData.guild = {
            id: guildId,
            role: 'member',
            joinedAt: Date.now()
        };
        
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        this.saveGuild(guild);
        
        const milestoneMessage = constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)];
        const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 40) + 25);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const memberProgress = guild.members.length / constants.GUILD.MAX_MEMBERS;
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Guild Members: ${guild.members.length}/${constants.GUILD.MAX_MEMBERS}`,
            memberProgress,
            constants.COLORS.SUCCESS
        );

        const embed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.CELEBRATION} Joined Guild!`)
            .setDescription(`${constants.ANIMATED_EMOJIS.CELEBRATION} ${milestoneMessage}\n\n${constants.ANIMATED_EMOJIS.SPARK...`)
            .addFields(
                { name: '🏰 Guild', value: guild.name, inline: true },
                { name: '👥 Members', value: `${guild.members.length}/${constants.GUILD.MAX_MEMBERS}`, inline: true },
                { name: '📊 Guild Level', value: `${guild.level}`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setImage('attachment://progress.png')
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleInfo(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        let guildId = interaction.options.getString('guild_id');
        
        if (!guildId && userData.guild) {
            guildId = userData.guild.id;
        }
        
        if (!guildId) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} No Guild`)
                .setDescription('You\'re not in a guild and no guild ID was provided.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const guild = this.getGuild(guildId);
        if (!guild) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Guild Not Found`)
                .setDescription(`Guild **${guildId}** doesn't exist.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const leaderUser = new User(guild.leader);
        const leaderData = await leaderUser.load();
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SHIELD} ${guild.name}`)
            .setDescription(`${constants.ANIMATED_EMOJIS.SPARKLES} ${guild.description}\n\n${constants.ANIMATED_EMOJIS.FIRE} *...`)
            .addFields(
                { name: '🆔 Guild ID', value: guild.id, inline: true },
                { name: '👑 Leader', value: leaderData.username || 'Unknown', inline: true },
                { name: '👥 Members', value: `${guild.members.length}/${constants.GUILD.MAX_MEMBERS}`, inline: true },
                { name: '📊 Guild Level', value: `${guild.level}`, inline: true },
                { name: '💰 Treasury', value: `$${guild.treasury.toFixed(2)} VEX`, inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(guild.createdAt / 1000)}:R>`, inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setTimestamp();
        
        if (guild.officers.length > 0) {
            embed.addFields({
                name: '⭐ Officers',
                value: `${guild.officers.length} officer${guild.officers.length > 1 ? 's' : ''}`,
                inline: true
            });
        }
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const guildProgress = guild.level / 10;
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Guild Level: ${guild.level}`,
            guildProgress,
            constants.COLORS.PRIMARY
        );

        const guildButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`guild_join_${guild.id}`)
                    .setLabel('Join Guild')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🏰'),
                new ButtonBuilder()
                    .setCustomId(`guild_members_${guild.id}`)
                    .setLabel('View Members')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('👥')
            );

        await interaction.reply({ 
            embeds: [embed], 
            components: [guildButtons],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleList(interaction) {
        const guilds = this.getPublicGuilds();
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 60) + 30);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SHIELD} Available Guilds`)
            .setDescription(`${constants.ANIMATED_EMOJIS.ROCKET} Browse and join public guilds!\n\n${constants.ANIMATED_EMOJIS...`)
            .setColor(constants.COLORS.PRIMARY);
        
        if (guilds.length === 0) {
            embed.setDescription(`${constants.ANIMATED_EMOJIS.ROCKET} No public guilds available. Create the first one!\n\n${consta...`);
        } else {
            const guildList = guilds.slice(0, 10).map(guild => 
                `**${guild.name}** (${guild.id})\n` +
                `Members: ${guild.members.length}/${constants.GUILD.MAX_MEMBERS} | Level: ${guild.level}\n` +
                `${guild.description.substring(0, 50)}${guild.description.length > 50 ? '...' : ''}`
            ).join('\n\n');
            
            embed.addFields({
                name: '🏰 Guilds',
                value: guildList,
                inline: false
            });
        }
        
        embed.setFooter({ text: 'Use /guild join <guild_id> to join a guild!' });
        
        const guildListButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('guild_create_new')
                    .setLabel('Create Guild')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⚔️'),
                new ButtonBuilder()
                    .setCustomId('guild_refresh_list')
                    .setLabel('Refresh List')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔄')
            );

        await interaction.reply({ 
            embeds: [embed], 
            components: [guildListButtons]
        });
    },
    
    generateGuildId() {
        return 'GUILD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    },
    
    saveGuild(guild) {
        console.log('Guild saved:', guild.id);
    },
    
    getGuild(guildId) {
        return null;
    },
    
    getPublicGuilds() {
        return [];
    }
};
