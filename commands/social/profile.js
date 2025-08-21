const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const CanvasRenderer = require('../../utils/canvasRenderer');
const Economics = require('../../utils/economics');

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
        await interaction.deferReply({ ephemeral: true });
        
        const { route } = require('../../utils/router');
        return route(interaction, {
            view: this.handleView.bind(this),
            bio: this.handleBio.bind(this),
            color: this.handleColor.bind(this),
            status: this.handleStatus.bind(this),
            _fallback: (i) => {
                const ui = require('../../utils/ui');
                return i.editReply({ embeds: [ui.err('Unknown subcommand', 'Use view, bio, color, or status.')] });
            }
        });
    },
    
    async handleView(interaction) {
        const ui = require('../../utils/ui');
        
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const isOwnProfile = targetUser.id === interaction.user.id;
        
        const user = new User(targetUser.id);
        const userData = await user.load();
        
        if (!isOwnProfile && userData.settings?.privacy === 'private') {
            return interaction.editReply({ embeds: [ui.err('Private profile', `${targetUser.username}'s profile is private.`)] });
        }
        
        const netWorth = userData.networth || 0;
        const level = userData.level || 1;
        const achievements = userData.achievements || [];
        const joinedDate = userData.joinedAt ? new Date(userData.joinedAt) : new Date();
        
        const bio = userData.settings?.bio || 'No bio set';
        const status = userData.settings?.status || 'Active';
        
        const embed = ui.info(`${isOwnProfile ? 'Your' : targetUser.username + "'s"} Profile`, 
            `Level ${level} • ${achievements.length} achievements\n` +
            `Net worth: ${ui.formatCurrency(netWorth)}\n` +
            `Bio: ${bio}\n` +
            `Status: ${status}\n` +
            `Joined: <t:${Math.floor(joinedDate.getTime() / 1000)}:d>`
        );
        
        embed.setThumbnail(targetUser.displayAvatarURL());
        
        if (isOwnProfile) {
            userData.stats.profileViews = (userData.stats.profileViews || 0) + 1;
            await user.save(userData);
        }
        
        await interaction.editReply({ embeds: [embed] });
    },

    async handleBio(interaction) {
        const ui = require('../../utils/ui');
        const bioText = interaction.options.getString('text');
        
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.settings) userData.settings = {};
        userData.settings.bio = bioText;
        await user.save(userData);
        
        const embed = ui.ok('Bio updated', `New bio: ${bioText}`);
        await interaction.editReply({ embeds: [embed] });
    },

    async handleColor(interaction) {
        const ui = require('../../utils/ui');
        const colorCode = interaction.options.getString('color');
        
        if (!/^#[0-9A-F]{6}$/i.test(colorCode)) {
            return interaction.editReply({ embeds: [ui.err('Invalid color', 'Use hex format like #FF0000')] });
        }
        
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.settings) userData.settings = {};
        userData.settings.profileColor = colorCode;
        await user.save(userData);
        
        const embed = ui.ok('Color updated', `Profile color set to ${colorCode}`);
        embed.setColor(colorCode);
        
        await interaction.editReply({ embeds: [embed] });
    },

    async handleStatus(interaction) {
        const ui = require('../../utils/ui');
        const status = interaction.options.getString('status');
        
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.settings) userData.settings = {};
        userData.settings.status = status;
        await user.save(userData);
        
        const statusEmojis = {
            'Active': '🟢',
            'Away': '🟡',
            'Busy': '🔴',
            'Investing': '📈',
            'Trading': '💹',
            'Playing Games': '🎮'
        };
        
        const embed = ui.ok('Status updated', `${statusEmojis[status] || '⚪'} ${status}`);
        await interaction.editReply({ embeds: [embed] });
    }
};
};
