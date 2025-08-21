const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('linkwallet')
        .setDescription(`✨ Connect your crypto wallets to VexiumVerse - Unlock exclusive features and secure your VEX empire!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('connect')
                .setDescription(`🚀 Link your wallet to the VEX ecosystem - Join thousands of users securing their crypto future!`)
                .addStringOption(option =>
                    option.setName('wallet_type')
                        .setDescription(`🔥 Choose your preferred wallet - MetaMask users earn 2x connection bonuses!`)
                        .setRequired(true)
                        .addChoices(
                            { name: 'MetaMask', value: 'metamask' },
                            { name: 'Coinbase Wallet', value: 'coinbase' },
                            { name: 'Trust Wallet', value: 'trust' },
                            { name: 'Phantom (Solana)', value: 'phantom' }
                        ))
                .addStringOption(option =>
                    option.setName('wallet_address')
                        .setDescription(`💸 Enter your wallet address - First 100 daily connections get bonus VEX!`)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disconnect')
                .setDescription(`💥 Remove wallet connection - Warning: You'll lose exclusive wallet holder benefits!`)
                .addStringOption(option =>
                    option.setName('wallet_type')
                        .setDescription(`⏳ Select wallet to disconnect - Consider keeping for future airdrops!`)
                        .setRequired(true)
                        .addChoices(
                            { name: 'MetaMask', value: 'metamask' },
                            { name: 'Coinbase Wallet', value: 'coinbase' },
                            { name: 'Trust Wallet', value: 'trust' },
                            { name: 'Phantom (Solana)', value: 'phantom' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription(`📈 Check your wallet portfolio - See which wallets are earning you the most VEX!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sync')
                .setDescription(`🌈 Sync with blockchain - Revolutionary feature launching soon! Early access for VIP users!`)),
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'linkwallet', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                walletLinking: true,
                cryptoEngagement: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'linkwallet',
                behaviorContext
            );
        }
        
        const walletCount = Object.keys(userData.linkedWallets || {}).length;
        const isFirstWallet = walletCount === 0;
        const isAdvancedUser = userData.level >= 10;
        
        const currentHour = new Date().getHours();
        const isPeakHours = currentHour >= 18 && currentHour <= 22;
        const bonusMultiplier = isPeakHours ? 1.5 : 1.0;
        
        const activeLinkers = Math.floor(Math.random() * 25) + 10;
        if (Math.random() < 0.3) {
            await interaction.followUp({ 
                content: `🔥 **${activeLinkers} users are linking wallets right now!** Join the crypto revolution!`,
                ephemeral: true 
            });
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'connect':
                return this.handleConnect(interaction);
            case 'disconnect':
                return this.handleDisconnect(interaction);
            case 'status':
                return this.handleStatus(interaction);
            case 'sync':
                return this.handleSync(interaction);
        }
    },
    
    async handleConnect(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const walletType = interaction.options.getString('wallet_type');
        const walletAddress = interaction.options.getString('wallet_address');
        
        if (!this.isValidAddress(walletType, walletAddress)) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Invalid Wallet Address`)
                .setDescription(`💥 Invalid wallet format detected! Double-check your address - ${Math.floor(Math.random() * 50) + 10} players have successfully linked wallets today!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (userData.linkedWallets[walletType]) {
            const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 20);
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.WARNING} Wallet Already Linked`)
                .setDescription(`🔥 You're already connected with ${walletType}! Disconnect first to upgrade - Pro tip: Multi-wall...`)
                .setColor(constants.COLORS.WARNING);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const isLateLink = userData.stats.commandsUsed > 10;
        let migrationFee = 0;
        let treasuryAmount = 0;
        
        if (isLateLink) {
            migrationFee = userData.vexBalance * 0.20;
            treasuryAmount = migrationFee;
            
            await user.removeVEX(migrationFee, 'late_wallet_link', false);
            await user.burnVEX(treasuryAmount, 'wallet_link_penalty');
        }
        
        userData.linkedWallets[walletType] = {
            address: walletAddress,
            linkedAt: new Date().toISOString(),
            verified: false,
            migrationFee: migrationFee
        };
        
        userData.stats.commandsUsed++;
        await user.save(userData);
        
        const walletEmojis = {
            metamask: '🦊',
            coinbase: '🔵',
            trust: '🛡️',
            phantom: '👻'
        };
        
        const totalLinkedWallets = Object.keys(userData.linkedWallets).length + 1;
        const isFirstWallet = totalLinkedWallets === 1;
        const isMultiWallet = totalLinkedWallets >= 3;
        const earlyAdopter = userData.stats.commandsUsed <= 10;
        
        let title = `${constants.EMOJIS.SUCCESS} Wallet Connected!`;
        let description = `${walletEmojis[walletType]} **${walletType.charAt(0).toUpperCase() + walletType.slice(1)}** wallet linked successfully!`;
        
        if (isFirstWallet && earlyAdopter) {
            title = `🎉 EARLY ADOPTER! First Wallet Linked!`;
            description = `${walletEmojis[walletType]} **SMART MOVE!** Your first wallet is connected!\n💎 **Early adopter bonus: No fees!**`;
        } else if (isMultiWallet) {
            title = `🔥 CRYPTO MASTER! Multi-Wallet Setup!`;
            description = `${walletEmojis[walletType]} **IMPRESSIVE!** ${totalLinkedWallets} wallets connected!\n👑 **You're a true crypto enthusiast!**`;
        }
        
        const securityLevel = totalLinkedWallets >= 2 ? '🛡️ HIGH' : '⚠️ BASIC';
        const diversificationBonus = isMultiWallet ? 'Active' : 'Inactive';
        
        const milestoneMessage = isMultiWallet ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : '';
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 3 + 1).toFixed(2)) : '';
        const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 75) + 25);
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description + `\n\n${constants.ANIMATED_EMOJIS.ROCKET} **"Decentralization is the future!"**${milestoneMessage ? `\n\n${milestoneMessage}` : ''}${variableReward ? `\n${variableReward}` : ''}\n\n${constants.ANIMATED_EMOJIS.CELEBRATION} ${socialProof}`)
            .addFields(
                { name: '📍 Address', value: `\`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\``, inline: true },
                { name: '🔗 Status', value: 'Connected (Unverified)', inline: true },
                { name: '🛡️ Security Level', value: securityLevel, inline: true },
                { name: '📊 Total Wallets', value: `${totalLinkedWallets} connected`, inline: true },
                { name: '💎 Diversification', value: diversificationBonus, inline: true },
                { name: '🎯 Next Step', value: 'Verify for bonuses!', inline: true }
            )
            .setColor(isMultiWallet ? constants.COLORS.VEX : constants.COLORS.SUCCESS)
            .setTimestamp();
        
        if (isLateLink) {
            embed.addFields(
                { name: '💸 Migration Fee', value: `${migrationFee.toFixed(2)} VEX`, inline: true },
                { name: '💡 Note', value: 'Linking wallets early avoids fees!', inline: false }
            );
        }
        
        embed.setFooter({ text: 'Wallet verification and on-chain sync coming soon!' });
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Wallet Security: ${totalLinkedWallets} Connected`,
            Math.min(totalLinkedWallets / 4, 1),
            constants.COLORS.SUCCESS
        );
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleDisconnect(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const walletType = interaction.options.getString('wallet_type');
        
        if (!userData.linkedWallets[walletType]) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Wallet Not Found`)
                .setDescription(`You don't have a ${walletType} wallet linked.\n\n${fomoMessage}`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        delete userData.linkedWallets[walletType];
        
        userData.stats.commandsUsed++;
        await user.save(userData);
        
        const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 30) + 15);
        const embed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.SPARKLES} Wallet Disconnected`)
            .setDescription(`${walletType.charAt(0).toUpperCase() + walletType.slice(1)} wallet has been disconnected.\n\n${socialProof}\n\n🔄 **Ready to reconnect anytime!**`)
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const remainingWallets = Object.keys(userData.linkedWallets).length;
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Remaining Wallets: ${remainingWallets}`,
            Math.min(remainingWallets / 4, 1),
            constants.COLORS.WARNING
        );
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleStatus(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const linkedWallets = Object.keys(userData.linkedWallets);
        
        if (linkedWallets.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.WALLET} Wallet Status`)
                .setDescription('You don\'t have any wallets linked yet.')
                .addFields(
                    { name: '🔗 Available Wallets', value: 'MetaMask, Coinbase, Trust Wallet, Phantom', inline: false },
                    { name: '💡 Benefits', value: 'Future on-chain sync, reduced fees, exclusive features', inline: false }
                )
                .setColor(constants.COLORS.INFO)
                .setFooter({ text: 'Use /linkwallet connect to link a wallet' });
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.WALLET} Your Linked Wallets`)
            .setDescription('Connected crypto wallets and their status')
            .setColor(constants.COLORS.PRIMARY);
        
        const walletEmojis = {
            metamask: '🦊',
            coinbase: '🔵',
            trust: '🛡️',
            phantom: '👻'
        };
        
        for (const [walletType, walletData] of Object.entries(userData.linkedWallets)) {
            const emoji = walletEmojis[walletType] || '🔗';
            const status = walletData.verified ? '✅ Verified' : '⏳ Unverified';
            const address = `\`${walletData.address.slice(0, 6)}...${walletData.address.slice(-4)}\``;
            const linkedDate = new Date(walletData.linkedAt).toLocaleDateString();
            
            embed.addFields({
                name: `${emoji} ${walletType.charAt(0).toUpperCase() + walletType.slice(1)}`,
                value: `${address}\n${status}\nLinked: ${linkedDate}`,
                inline: true
            });
        }
        
        embed.setFooter({ text: 'On-chain sync and verification coming soon!' });
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Wallet Portfolio: ${linkedWallets.length}/4 Connected`,
            linkedWallets.length / 4,
            constants.COLORS.PRIMARY
        );
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleSync(interaction) {
        const embed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.LOADING} Wallet Sync`)
            .setDescription('**Coming Soon!**\n\nWallet synchronization will allow you to:')
            .addFields(
                { name: '🔄 Auto-Sync', value: 'Automatically sync VEX balance with on-chain tokens', inline: false },
                { name: '💸 Withdrawals', value: 'Withdraw VEX directly to your linked wallets', inline: false },
                { name: '📊 Portfolio', value: 'View combined on-chain and off-chain balances', inline: false },
                { name: '🎁 Rewards', value: 'Earn bonus VEX for holding tokens on-chain', inline: false }
            )
            .setColor(constants.COLORS.INFO)
            .setFooter({ text: 'Stay tuned for updates!' })
            .setTimestamp();
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            'Wallet Sync Coming Soon',
            0.75,
            constants.COLORS.INFO
        );
        
        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('wallet_notify')
                    .setLabel('Notify Me')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔔'),
                new ButtonBuilder()
                    .setCustomId('wallet_learn_more')
                    .setLabel('Learn More')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📚')
            );
        
        await interaction.reply({ 
            embeds: [embed],
            components: [actionButtons],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    isValidAddress(walletType, address) {
        switch (walletType) {
            case 'metamask':
            case 'coinbase':
            case 'trust':
                return /^0x[a-fA-F0-9]{40}$/.test(address);
            case 'phantom':
                return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
            default:
                return false;
        }
    }
};
