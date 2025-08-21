const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('friends')
        .setDescription(`✨ Build your social empire and unlock exclusive bonuses!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription(`💓 Connect with players and grow your network`)
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to add as friend')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription(`💥 Remove someone from your network`)
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Friend to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription(`🌈 See your social empire and network status`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('requests')
                .setDescription(`⏳ Manage incoming connection requests`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('accept')
                .setDescription(`🎉 Welcome someone to your network`)
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User whose request to accept')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('decline')
                .setDescription(`🔥 Reject a connection request`)
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User whose request to decline')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('activity')
                .setDescription(`📊 See what your network is up to`)),
    
    cooldown: 3,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.psychologyEngine) {
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'friends',
                { socialActivity: true, friendsCount: userData.friends?.list?.length || 0 }
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'friends', true);
        }
        
        const friendsCount = userData.friends?.list?.length || 0;
        const socialLevel = friendsCount >= 25 ? 'Social Legend' : friendsCount >= 10 ? 'Social Butterfly' : friendsCount >= 5 ? 'Networker' : 'Growing';
        const isPopular = friendsCount >= 10;
        const hasActiveRequests = (userData.friends?.requests?.received?.length || 0) > 0;
        
        const socialBoost = Math.random() < 0.15 ? Math.floor(friendsCount * 0.5) + 5 : 0;
        if (socialBoost > 0) {
            await user.addVEX(socialBoost, 'social_activity_bonus');
            const Economics = require('../../utils/economics');
            Economics.updateVEXMarket('reward', socialBoost);
            userData.stats.socialBonusesEarned = (userData.stats.socialBonusesEarned || 0) + 1;
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'add':
                return this.handleAdd(interaction);
            case 'remove':
                return this.handleRemove(interaction);
            case 'list':
                return this.handleList(interaction);
            case 'requests':
                return this.handleRequests(interaction);
            case 'accept':
                return this.handleAccept(interaction);
            case 'decline':
                return this.handleDecline(interaction);
            case 'activity':
                return this.handleActivity(interaction);
        }
    },
    
    async handleAdd(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const targetUser = interaction.options.getUser('user');
        
        if (targetUser.id === interaction.user.id) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Cannot Add Yourself`)
                .setDescription(`💬 You can't befriend yourself, but you can befriend EVERYONE ELSE!\n\n${fomoMessage}\n\n✨ **FOMO...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (targetUser.bot) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Cannot Add Bots`)
                .setDescription(`💥 Bots don't make good friends - they can't boost your social status!\n\n🔥 **Try adding real pl...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (!userData.friends) userData.friends = { list: [], requests: { sent: [], received: [] } };
        
        if (userData.friends.list.includes(targetUser.id)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Already Friends`)
                .setDescription(`💓 You're already connected to **${targetUser.username}**!\n\n✨ **Why not expand further?** Popul...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (userData.friends.requests.sent.includes(targetUser.id)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Request Already Sent`)
                .setDescription(`${constants.ANIMATED_EMOJIS.LOADING} Request already sent to **${targetUser.username}**!\n\n${constants.ANIMATED_EMOJIS.CLOCK} **Please wait for them to respond!**\n\n${constants.ANIMATED_EMOJIS.SPARKLES} Patience makes friendships stronger!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const targetUserData = new User(targetUser.id);
        const targetData = await targetUserData.load();
        
        if (!targetData.friends) targetData.friends = { list: [], requests: { sent: [], received: [] } };
        
        userData.friends.requests.sent.push(targetUser.id);
        targetData.friends.requests.received.push(interaction.user.id);
        
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        await targetUserData.save(targetData);
        
        const totalFriends = userData.friends.list.length;
        const totalRequests = userData.friends.requests.sent.length;
        const isSocialButterfly = totalFriends >= 10;
        const isNetworker = totalRequests >= 5;
        
        let title = `${constants.EMOJIS.SUCCESS} Friend Request Sent!`;
        let description = `🤝 **Connection initiated!** Request sent to **${targetUser.username}**!`;
        
        if (isSocialButterfly) {
            title = `🦋 SOCIAL BUTTERFLY! Friend Request Sent!`;
            description = `🌟 **AMAZING NETWORKING!** Request sent to **${targetUser.username}**!\n👑 **You're building an incredible social empire!**`;
        }
        
        const socialTips = [
            "💡 **Tip:** Active friends boost your daily rewards!",
            "🎯 **Tip:** Friends can gift you rare items!",
            "⚡ **Tip:** Social connections unlock exclusive features!",
            "🚀 **Tip:** Popular players get priority in events!"
        ];
        
        const randomTip = socialTips[Math.floor(Math.random() * socialTips.length)];
        
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 20);
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 3 + 1).toFixed(2)) : null;
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const socialProgress = Math.min(totalFriends / 25, 1);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Social Network: ${totalFriends}/25 friends`,
            socialProgress,
            constants.COLORS.VEX
        );

        const embed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.SPARKLES} ${title.replace(constants.EMOJIS.SUCCESS, '')}`)
            .setDescription(description + `\n\n${randomTip}\n\n${socialProofMessage}${variableReward ? `\n${variableReward}` : ''}`)
            .addFields(
                { name: '👤 Target', value: `${targetUser.username} ${Math.random() > 0.5 ? '📈 Rising Star' : '⭐ Active Player'}`, inline: true },
                { name: '📤 Status', value: 'Request Sent ✨', inline: true },
                { name: '👥 Your Network', value: `${totalFriends} friends | ${totalRequests} pending`, inline: true },
                { name: '🏅 Social Level', value: isSocialButterfly ? '🦋 Social Butterfly' : totalFriends >= 5 ? '⭐ Networker' : '🌟 Growing', inline: true },
                { name: '🎯 Next Milestone', value: totalFriends < 5 ? '5 friends (Networker)' : totalFriends < 10 ? '10 friends (Social Butterfly)' : '25 friends (Social Legend)', inline: true },
                { name: '💫 Social Boost', value: `+${Math.min(totalFriends * 2, 20)}% friend bonuses`, inline: true }
            )
            .setColor(isSocialButterfly ? constants.COLORS.VEX : constants.COLORS.SUCCESS)
            .setThumbnail(targetUser.displayAvatarURL())
            .setImage('attachment://progress.png')
            .setFooter({ text: '🔔 They\'ll be notified instantly! Social connections = success!' })
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleRemove(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const targetUser = interaction.options.getUser('user');
        
        if (!userData.friends || !userData.friends.list.includes(targetUser.id)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Not Friends`)
                .setDescription(`You're not friends with **${targetUser.username}**.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const targetUserData = new User(targetUser.id);
        const targetData = await targetUserData.load();
        
        userData.friends.list = userData.friends.list.filter(id => id !== targetUser.id);
        if (targetData.friends) {
            targetData.friends.list = targetData.friends.list.filter(id => id !== interaction.user.id);
        }
        
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        await targetUserData.save(targetData);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Friend Removal Confirmation`,
            1.0,
            constants.COLORS.WARNING
        );

        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Friend Removed`)
            .setDescription(`**${targetUser.username}** has been removed from your friends list.`)
            .setColor(constants.COLORS.WARNING)
            .setImage('attachment://progress.png')
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleList(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.friends || userData.friends.list.length === 0) {
            const motivationalMessages = [
                "🌟 **Start building your empire!** Friends unlock exclusive bonuses!",
                "💎 **Social connections = SUCCESS!** Popular players earn 50% more!",
                "🚀 **Network effect incoming!** Each friend multiplies your opportunities!",
                "⚡ **FOMO Alert:** Other players are building massive friend networks!"
            ];
            
            const randomMotivation = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
            const activeUsers = Math.floor(Math.random() * 30) + 15;
            
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const milestoneMessage = constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)];
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.HEART} Your Social Empire Awaits!`)
                .setDescription(`${randomMotivation}\n\n📊 **${activeUsers} players are networking RIGHT NOW!**\n🎯 **Start with /...`)
                .addFields(
                    { name: '🎁 Friend Benefits', value: '💰 **Daily bonuses**\n🎮 **Exclusive events**\n📈 **Popularity boosts**\n🏆 **Social achievements**', inline: true },
                    { name: '⚡ Quick Start', value: '1️⃣ Add 5 friends = **Networker** status\n2️⃣ Add 10 friends = **Social Butterfly**\n3️⃣ Add 25 friends = **Social Legend**', inline: true },
                    { name: '🔥 Urgency Bonus', value: 'First 3 friends added today get **2x connection bonus!**', inline: false }
                )
                .setColor(constants.COLORS.VEX)
                .setFooter({ text: '⏰ Social opportunities are time-sensitive! Act now!' });
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.HEART} Your Friends`)
            .setDescription(`You have ${userData.friends.list.length} friend${userData.friends.list.length > 1 ? 's' : ''}`)
            .setColor(constants.COLORS.PRIMARY);
        
        const friendsData = [];
        for (const friendId of userData.friends.list.slice(0, 10)) {
            try {
                const friendUser = await interaction.client.users.fetch(friendId);
                const friendData = new User(friendId);
                const friendUserData = await friendData.load();
                
                const status = this.getFriendStatus(friendUserData);
                friendsData.push(`**${friendUser.username}** - Level ${friendUserData.level} ${status}`);
            } catch (error) {
                friendsData.push(`Unknown User (${friendId}) - Offline`);
            }
        }
        
        embed.addFields({
            name: '👥 Friends List',
            value: friendsData.join('\n') || 'No friends to display',
            inline: false
        });
        
        if (userData.friends.list.length > 10) {
            embed.setFooter({ text: `Showing 10 of ${userData.friends.list.length} friends` });
        }
        
        const addButton = new ButtonBuilder()
            .setCustomId(`friends_add_${interaction.user.id}`)
            .setLabel('Add Friend')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('➕');
        
        const activityButton = new ButtonBuilder()
            .setCustomId(`friends_activity_${interaction.user.id}`)
            .setLabel('Activity Feed')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📰');
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const socialProgress = Math.min(userData.friends.list.length / 25, 1);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Social Network: ${userData.friends.list.length}/25 friends`,
            socialProgress,
            constants.COLORS.VEX
        );

        const row = new ActionRowBuilder().addComponents(addButton, activityButton);
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleRequests(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.friends) userData.friends = { list: [], requests: { sent: [], received: [] } };
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.BELL} Friend Requests`)
            .setDescription('Manage your pending friend requests')
            .setColor(constants.COLORS.PRIMARY);
        
        if (userData.friends.requests.received.length === 0 && userData.friends.requests.sent.length === 0) {
            embed.setDescription('No pending friend requests.');
        } else {
            if (userData.friends.requests.received.length > 0) {
                const receivedRequests = [];
                for (const requesterId of userData.friends.requests.received.slice(0, 5)) {
                    try {
                        const requesterUser = await interaction.client.users.fetch(requesterId);
                        receivedRequests.push(`**${requesterUser.username}**`);
                    } catch (error) {
                        receivedRequests.push(`Unknown User (${requesterId})`);
                    }
                }
                
                embed.addFields({
                    name: '📥 Received Requests',
                    value: receivedRequests.join('\n'),
                    inline: false
                });
            }
            
            if (userData.friends.requests.sent.length > 0) {
                const sentRequests = [];
                for (const targetId of userData.friends.requests.sent.slice(0, 5)) {
                    try {
                        const targetUser = await interaction.client.users.fetch(targetId);
                        sentRequests.push(`**${targetUser.username}**`);
                    } catch (error) {
                        sentRequests.push(`Unknown User (${targetId})`);
                    }
                }
                
                embed.addFields({
                    name: '📤 Sent Requests',
                    value: sentRequests.join('\n'),
                    inline: false
                });
            }
        }
        
        const acceptButton = new ButtonBuilder()
            .setCustomId(`friends_accept_${interaction.user.id}`)
            .setLabel('Accept Request')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅')
            .setDisabled(userData.friends.requests.received.length === 0);
        
        const declineButton = new ButtonBuilder()
            .setCustomId(`friends_decline_${interaction.user.id}`)
            .setLabel('Decline Request')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
            .setDisabled(userData.friends.requests.received.length === 0);
        
        const row = new ActionRowBuilder().addComponents(acceptButton, declineButton);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const requestProgress = Math.min((userData.friends.requests.received.length + userData.friends.requests.sent.length) / 10, 1);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Friend Requests: ${userData.friends.requests.received.length} received, ${userData.friends.requests.sent.length} sent`,
            requestProgress,
            constants.COLORS.PRIMARY
        );

        embed.setFooter({ text: 'Use /friends accept or /friends decline to manage requests' });
        embed.setImage('attachment://progress.png');
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleAccept(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const requesterUser = interaction.options.getUser('user');
        
        if (!userData.friends || !userData.friends.requests.received.includes(requesterUser.id)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} No Request Found`)
                .setDescription(`No friend request from **${requesterUser.username}** found.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const requesterData = new User(requesterUser.id);
        const requesterUserData = await requesterData.load();
        
        userData.friends.requests.received = userData.friends.requests.received.filter(id => id !== requesterUser.id);
        userData.friends.list.push(requesterUser.id);
        
        if (requesterUserData.friends) {
            requesterUserData.friends.requests.sent = requesterUserData.friends.requests.sent.filter(id => id !== interaction.user.id);
            requesterUserData.friends.list.push(interaction.user.id);
        }
        
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        await requesterData.save(requesterUserData);
        
        const milestoneMessage = userData.friends.list.length >= 10 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : '';
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 30) + 15);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Friend Request Accepted!`)
            .setDescription(`You're now friends with **${requesterUser.username}**!\n\n${socialProofMessage}${milestoneMessage ? `\n${milestoneMessage}` : ''}`)
            .addFields(
                { name: '👤 New Friend', value: requesterUser.username, inline: true },
                { name: '👥 Total Friends', value: `${userData.friends.list.length}`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setThumbnail(requesterUser.displayAvatarURL())
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleDecline(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const requesterUser = interaction.options.getUser('user');
        
        if (!userData.friends || !userData.friends.requests.received.includes(requesterUser.id)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} No Request Found`)
                .setDescription(`No friend request from **${requesterUser.username}** found.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const requesterData = new User(requesterUser.id);
        const requesterUserData = await requesterData.load();
        
        userData.friends.requests.received = userData.friends.requests.received.filter(id => id !== requesterUser.id);
        
        if (requesterUserData.friends) {
            requesterUserData.friends.requests.sent = requesterUserData.friends.requests.sent.filter(id => id !== interaction.user.id);
        }
        
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        await requesterData.save(requesterUserData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Friend Request Declined`)
            .setDescription(`Friend request from **${requesterUser.username}** has been declined.`)
            .setColor(constants.COLORS.WARNING)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleActivity(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.friends || userData.friends.list.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.HEART} Friends Activity`)
                .setDescription('Add friends to see their activity feed!')
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const activities = await this.getFriendsActivity(userData.friends.list, interaction.client);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.HEART} Friends Activity`)
            .setDescription('Recent activity from your friends')
            .setColor(constants.COLORS.PRIMARY);
        
        if (activities.length === 0) {
            embed.addFields({
                name: '📰 Activity Feed',
                value: 'No recent activity from friends.',
                inline: false
            });
        } else {
            const activityText = activities.slice(0, 10).map(activity => 
                `**${activity.username}** ${activity.action} *${activity.timeAgo}*`
            ).join('\n');
            
            embed.addFields({
                name: '📰 Recent Activity',
                value: activityText,
                inline: false
            });
        }
        
        embed.setFooter({ text: 'Activity updates every few minutes' });
        
        await interaction.reply({ embeds: [embed] });
    },
    
    getFriendStatus(friendData) {
        const lastSeen = friendData.lastSeen || 0;
        const timeDiff = Date.now() - lastSeen;
        
        if (timeDiff < 5 * 60 * 1000) return '🟢 Online';
        if (timeDiff < 30 * 60 * 1000) return '🟡 Away';
        if (timeDiff < 24 * 60 * 60 * 1000) return '🔴 Offline';
        return '⚫ Inactive';
    },
    
    async getFriendsActivity(friendIds, client) {
        const activities = [];
        
        for (const friendId of friendIds.slice(0, 10)) {
            try {
                const friendUser = await client.users.fetch(friendId);
                const friendData = new User(friendId);
                const friendUserData = await friendData.load();
                
                if (friendUserData.lastActivity) {
                    const timeDiff = Date.now() - friendUserData.lastActivity.timestamp;
                    if (timeDiff < 24 * 60 * 60 * 1000) {
                        activities.push({
                            username: friendUser.username,
                            action: friendUserData.lastActivity.action || 'was active',
                            timeAgo: this.formatTimeAgo(timeDiff)
                        });
                    }
                }
            } catch (error) {
                continue;
            }
        }
        
        return activities.sort((a, b) => a.timestamp - b.timestamp);
    },
    
    formatTimeAgo(milliseconds) {
        const minutes = Math.floor(milliseconds / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ago`;
        } else if (minutes > 0) {
            return `${minutes}m ago`;
        } else {
            return 'just now';
        }
    }
};
