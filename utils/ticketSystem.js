const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../database/models/User');
const constants = require('./constants');

class TicketSystem {
    static async createWalletLinkingTicket(interaction) {
        try {
            const guild = interaction.guild;
            const user = interaction.user;
            
            const adminRoles = guild.roles.cache.filter(role => 
                role.permissions.has(PermissionFlagsBits.Administrator) || 
                role.permissions.has(PermissionFlagsBits.ManageChannels)
            );
            
            const permissionOverwrites = [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
            ];
            
            adminRoles.forEach(role => {
                permissionOverwrites.push({
                    id: role.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageMessages,
                    ],
                });
            });
            
            const ticketChannel = await guild.channels.create({
                name: `wallet-${user.username}-${Date.now()}`,
                type: ChannelType.GuildText,
                permissionOverwrites: permissionOverwrites,
                topic: `Private wallet linking and age verification for ${user.tag}`,
            });

            const welcomeEmbed = new EmbedBuilder()
                .setTitle('🔗 Welcome to Your Private Wallet Linking Ticket')
                .setDescription(`**Hello ${user.displayName}!** This is your secure space for wallet linking and age verification.\n\n**Step 1: Link Your Wallet**\nChoose your preferred crypto wallet below:\n\n**Step 2: Age Verification**\nConfirm you are 21+ to unlock entertainment features`)
                .setColor('#FFD700')
                .addFields(
                    { name: '🔒 Privacy Guaranteed', value: 'Only you and server administrators can see this channel', inline: true },
                    { name: '⏱️ Auto-Close', value: 'This ticket will close 20 seconds after age verification', inline: true }
                );

            const walletButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_link_wallet')
                        .setLabel('🦊 MetaMask')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('ticket_link_wallet')
                        .setLabel('🔵 Coinbase')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('ticket_link_wallet')
                        .setLabel('👻 Phantom')
                        .setStyle(ButtonStyle.Primary)
                );

            const ageVerifyButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_verify_age')
                        .setLabel('🎂 Verify Age (21+)')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('ticket_close')
                        .setLabel('❌ Close Ticket')
                        .setStyle(ButtonStyle.Danger)
                );

            await ticketChannel.send({ 
                content: `${user}`,
                embeds: [welcomeEmbed], 
                components: [walletButtons, ageVerifyButtons] 
            });

            return ticketChannel;
        } catch (error) {
            console.error('Error creating wallet linking ticket:', error);
            throw error;
        }
    }

    static async handleWalletLinking(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🔗 Wallet Linking Process')
                .setDescription('Please use the `/linkwallet connect` command to link your crypto wallet.\n\nSupported wallets:\n• MetaMask\n• Coinbase Wallet\n• Trust Wallet\n• Phantom (Solana)')
                .setColor(constants.COLORS.INFO)
                .addFields(
                    { name: '📝 Instructions', value: '1. Use `/linkwallet connect`\n2. Select your wallet type\n3. Enter your wallet address\n4. Return here when complete', inline: false }
                );

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('Error in handleWalletLinking:', error);
        }
    }

    static async handleAgeVerification(interaction) {
        try {
            const user = new User(interaction.user.id);
            const userData = await user.load();

            const verificationEmbed = new EmbedBuilder()
                .setTitle('🎂 Age Verification (21+)')
                .setDescription('To unlock entertainment features (gambling, poker, etc.), please confirm you are 21 years or older.')
                .setColor(constants.COLORS.WARNING)
                .addFields(
                    { name: '⚠️ Important', value: 'Entertainment features are restricted to users 21+', inline: false },
                    { name: '🎮 Features Unlocked', value: 'Gambling, Poker, Blackjack, Roulette, Crash, Tournaments', inline: false }
                );

            const ageButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_age_21')
                        .setLabel('✅ I am 21 or older')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('deny_age_21')
                        .setLabel('❌ I am under 21')
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.reply({ embeds: [verificationEmbed], components: [ageButtons], ephemeral: true });
        } catch (error) {
            console.error('Error in handleAgeVerification:', error);
        }
    }

    static async confirmAge(interaction, isOver21) {
        try {
            const user = new User(interaction.user.id);
            const userData = await user.load();

            userData.ageVerified = isOver21;
            userData.entertainmentUnlocked = isOver21;
            await user.save(userData);

            const embed = new EmbedBuilder()
                .setTitle(isOver21 ? '✅ Age Verified' : '❌ Age Verification Failed')
                .setDescription(isOver21 ? 
                    '🎉 **Entertainment features unlocked!** You now have access to all gambling and entertainment commands.' :
                    '⚠️ **Entertainment features remain locked.** You must be 21+ to access gambling features.')
                .setColor(isOver21 ? constants.COLORS.SUCCESS : constants.COLORS.ERROR)
                .addFields(
                    { name: '📋 Next Step', value: 'Use `/start onboarding` to complete your setup', inline: false }
                );

            await interaction.update({ embeds: [embed], components: [] });

            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                } catch (error) {
                    console.error('Error deleting ticket channel after age verification:', error);
                }
            }, 20000);
        } catch (error) {
            console.error('Error in confirmAge:', error);
        }
    }

    static async closeTicket(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🎫 Closing Ticket')
                .setDescription('This ticket will be deleted in 10 seconds. Use `/start onboarding` to continue your setup.')
                .setColor(constants.COLORS.INFO);

            await interaction.update({ embeds: [embed], components: [] });

            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                } catch (error) {
                    console.error('Error deleting ticket channel:', error);
                }
            }, 20000);
        } catch (error) {
            console.error('Error in closeTicket:', error);
        }
    }
}

module.exports = TicketSystem;
