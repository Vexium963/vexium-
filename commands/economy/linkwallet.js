const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('linkwallet')
        .setDescription('Link external crypto wallets to your VEX account')
        .addSubcommand(subcommand =>
            subcommand
                .setName('connect')
                .setDescription('Connect a crypto wallet')
                .addStringOption(option =>
                    option.setName('wallet_type')
                        .setDescription('Type of wallet to connect')
                        .setRequired(true)
                        .addChoices(
                            { name: 'MetaMask', value: 'metamask' },
                            { name: 'Coinbase Wallet', value: 'coinbase' },
                            { name: 'Trust Wallet', value: 'trust' },
                            { name: 'Phantom (Solana)', value: 'phantom' }
                        ))
                .addStringOption(option =>
                    option.setName('wallet_address')
                        .setDescription('Your wallet address')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disconnect')
                .setDescription('Disconnect a linked wallet')
                .addStringOption(option =>
                    option.setName('wallet_type')
                        .setDescription('Type of wallet to disconnect')
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
                .setDescription('View your linked wallets'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sync')
                .setDescription('Sync VEX balance with linked wallets (future feature)')),
    
    async execute(interaction) {
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
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Invalid Wallet Address`)
                .setDescription('The wallet address format is invalid for the selected wallet type.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (userData.linkedWallets[walletType]) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.WARNING} Wallet Already Linked`)
                .setDescription(`You already have a ${walletType} wallet linked. Disconnect it first to link a new one.`)
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
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Wallet Linked!`)
            .setDescription(`${walletEmojis[walletType]} **${walletType.charAt(0).toUpperCase() + walletType.slice(1)}** wallet connected successfully!`)
            .addFields(
                { name: '📍 Address', value: `\`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\``, inline: true },
                { name: '🔗 Status', value: 'Connected (Unverified)', inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        if (isLateLink) {
            embed.addFields(
                { name: '💸 Migration Fee', value: `$${migrationFee.toFixed(2)} VEX`, inline: true },
                { name: '💡 Note', value: 'Linking wallets early avoids fees!', inline: false }
            );
        }
        
        embed.setFooter({ text: 'Wallet verification and on-chain sync coming soon!' });
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleDisconnect(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const walletType = interaction.options.getString('wallet_type');
        
        if (!userData.linkedWallets[walletType]) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Wallet Not Found`)
                .setDescription(`You don't have a ${walletType} wallet linked.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        delete userData.linkedWallets[walletType];
        
        userData.stats.commandsUsed++;
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Wallet Disconnected`)
            .setDescription(`${walletType.charAt(0).toUpperCase() + walletType.slice(1)} wallet has been disconnected.`)
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
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
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleSync(interaction) {
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.LOADING} Wallet Sync`)
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
        
        await interaction.reply({ embeds: [embed] });
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
