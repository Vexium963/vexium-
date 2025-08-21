const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nft-mint')
        .setDescription(`✨ Mint unique NFTs using VEX tokens - Create digital masterpieces!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription(`🔥 Mint a new NFT - Join the digital art revolution!`)
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription(`✨ Name for your NFT masterpiece`)
                        .setRequired(true)
                        .setMaxLength(50))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription(`🌈 Description of your NFT - Tell its story!`)
                        .setRequired(true)
                        .setMaxLength(200))
                .addStringOption(option =>
                    option.setName('rarity')
                        .setDescription(`⬆️ NFT rarity tier - Higher rarity = More value!`)
                        .setRequired(true)
                        .addChoices(
                            { name: 'Common - 50 VEX', value: 'common' },
                            { name: 'Rare - 150 VEX', value: 'rare' },
                            { name: 'Epic - 500 VEX', value: 'epic' },
                            { name: 'Legendary - 1500 VEX', value: 'legendary' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('collection')
                .setDescription(`🏆 View your NFT collection - Showcase your digital empire!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('marketplace')
                .setDescription(`💸 Browse NFT marketplace - Discover rare treasures!`)),
    
    cooldown: 30,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'nft-mint', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                nftCreation: true,
                creativityBoost: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'nft-mint',
                behaviorContext
            );
        }
        
        const nftsMinted = userData.stats.nftsMinted || 0;
        const isNFTMaster = nftsMinted >= 10;
        const isFirstTime = nftsMinted === 0;
        const recentActivity = Date.now() - (userData.lastActive || Date.now()) < 3600000;
        
        if (isFirstTime && Math.random() < 0.3) {
            const bonusEmbed = new EmbedBuilder()
                .setTitle(`🎉 FIRST-TIME NFT CREATOR BONUS!`)
                .setDescription(`🎉 **Welcome to the NFT world!** You're about to create digital history!\n🔥 **SPECIAL OFFER:** 2...`)
                .setColor(constants.COLORS.VEX)
                .setFooter({ text: '⏰ First-time bonus expires after this session!' });
            
            const CanvasRenderer = require('../../utils/canvasRenderer');
            const canvasRenderer = new CanvasRenderer();
            const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
                'NFT Creation Bonus Progress',
                0.25,
                constants.COLORS.VEX
            );
            
            await interaction.reply({ 
                embeds: [bonusEmbed], 
                files: [{ attachment: progressBuffer, name: 'progress.png' }],
                ephemeral: true 
            });
            
            setTimeout(async () => {
                await interaction.followUp({ content: '🎨 Ready to create your masterpiece? Use the command again!', ephemeral: true });
            }, 3000);
            return;
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'create':
                return this.handleMint(interaction);
            case 'collection':
                return this.handleCollection(interaction);
            case 'marketplace':
                return this.handleMarketplace(interaction);
        }
    },
    
    async handleMint(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const name = interaction.options.getString('name');
        const description = interaction.options.getString('description');
        const rarity = interaction.options.getString('rarity');
        
        const costs = {
            common: 50,
            rare: 150,
            epic: 500,
            legendary: 1500
        };
        
        const cost = costs[rarity];
        
        if (userData.vexBalance < cost) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 20);
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`⏳ You need $${cost.toFixed(2)} VEX to mint a ${rarity} NFT.\n💰 Your balance: $${userData.vexBalance.toFixed(2)} VEX`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(cost, 'nft_mint');
        if (!result.success) {
            const comebackMessage = constants.COMEBACK_MESSAGES[Math.floor(Math.random() * constants.COMEBACK_MESSAGES.length)];
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Transaction Failed`)
                .setDescription(`💥 ${result.reason}\n\n💓 ${comebackMessage}`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const nftId = this.generateNFTId();
        const nft = {
            id: nftId,
            name: name,
            description: description,
            rarity: rarity,
            creator: interaction.user.id,
            createdAt: new Date().toISOString(),
            traits: this.generateTraits(rarity),
            marketValue: cost * (1 + Math.random() * 0.5)
        };
        
        if (!userData.nfts) userData.nfts = [];
        userData.nfts.push(nft);
        
        userData.stats.nftsMinted = (userData.stats.nftsMinted || 0) + 1;
        userData.stats.commandsUsed++;
        
        const burnAmount = cost * constants.TAX_SYSTEM.NFT.MINT_BURN_RATE;
        await user.burnVEX(burnAmount, 'nft_mint_burn');
        
        await user.save(userData);
        
        const rarityEmojis = {
            common: '⚪',
            rare: '🔵',
            epic: '🟣',
            legendary: '🟡'
        };
        
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        const milestoneMessage = userData.stats.nftsMinted >= 5 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 30) + 15);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.NFT} NFT Minted Successfully!`)
            .setDescription(`**${name}** has been minted!${variableReward ? `\n\n${variableReward}` : ''}${milestoneMessage ? `\n${milestoneMessage}` : ''}\n\n${socialProof}`)
            .addFields(
                { name: '🏷️ Name', value: name, inline: true },
                { name: '✨ Rarity', value: `${rarityEmojis[rarity]} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}`, inline: true },
                { name: '🆔 Token ID', value: `#${nftId}`, inline: true },
                { name: '📝 Description', value: description, inline: false },
                { name: '🎨 Traits', value: this.formatTraits(nft.traits), inline: false },
                { name: '💰 Mint Cost', value: `$${cost.toFixed(2)} VEX`, inline: true },
                { name: '📈 Est. Value', value: `$${nft.marketValue.toFixed(2)} VEX`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(this.getRarityColor(rarity))
            .setFooter({ text: `NFT #${nftId} • VexiumVerse Collection` })
            .setTimestamp();
        
        const tradeButton = new ButtonBuilder()
            .setCustomId(`nft_trade_${nftId}`)
            .setLabel('List for Trade')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🤝');
        
        const viewButton = new ButtonBuilder()
            .setCustomId(`nft_view_${nftId}`)
            .setLabel('View Details')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔍');
        
        const row = new ActionRowBuilder().addComponents(tradeButton, viewButton);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `NFT Minting Progress: ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}`,
            1.0,
            this.getRarityColor(rarity)
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleCollection(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.nfts || userData.nfts.length === 0) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 100) + 50);
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.NFT} Your NFT Collection`)
                .setDescription(`You don't own any NFTs yet!\n\nUse \`/nft-mint create\` to mint your first NFT.\n\n${fomoMessage}\n${socialProof}`)
                .addFields(
                    { name: '🎨 Getting Started', value: 'Mint NFTs with unique traits and rarity levels', inline: false },
                    { name: '💰 Rarity Costs', value: 'Common: 50 VEX\nRare: 150 VEX\nEpic: 500 VEX\nLegendary: 1500 VEX', inline: false }
                )
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const totalValue = userData.nfts.reduce((sum, nft) => sum + nft.marketValue, 0);
        const rarityCount = userData.nfts.reduce((acc, nft) => {
            acc[nft.rarity] = (acc[nft.rarity] || 0) + 1;
            return acc;
        }, {});
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.NFT} ${interaction.user.displayName}'s NFT Collection`)
            .setDescription(`**${userData.nfts.length}** NFTs owned • **$${totalValue.toFixed(2)}** VEX total value`)
            .addFields(
                { name: '📊 Collection Stats', value: this.formatRarityStats(rarityCount), inline: true },
                { name: '💎 Most Valuable', value: this.getMostValuable(userData.nfts), inline: true },
                { name: '🎨 Recent Mints', value: this.getRecentMints(userData.nfts), inline: false }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: `Total NFTs: ${userData.nfts.length} • Use buttons to navigate` })
            .setTimestamp();
        
        const viewAllButton = new ButtonBuilder()
            .setCustomId('nft_view_all')
            .setLabel('View All NFTs')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📋');
        
        const marketplaceButton = new ButtonBuilder()
            .setCustomId('nft_marketplace')
            .setLabel('Browse Marketplace')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🛒');
        
        const row = new ActionRowBuilder().addComponents(viewAllButton, marketplaceButton);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const collectionProgress = userData.nfts.length / 20; // Progress towards 20 NFT milestone
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Collection Progress: ${userData.nfts.length} NFTs`,
            Math.min(collectionProgress, 1.0),
            constants.COLORS.PRIMARY
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleMarketplace(interaction) {
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.NFT} NFT Marketplace`)
            .setDescription('Browse and trade NFTs with other players')
            .addFields(
                { name: '🔥 Featured NFTs', value: 'Coming soon - player-to-player trading', inline: false },
                { name: '📈 Market Trends', value: 'Legendary NFTs gaining value\nRare traits in high demand', inline: true },
                { name: '💡 Trading Tips', value: 'Unique traits increase value\nRarity affects base price', inline: true },
                { name: '🚀 Coming Soon', value: '• Auction system\n• Direct trading\n• Price history\n• Trait filters', inline: false }
            )
            .setColor(constants.COLORS.INFO)
            .setFooter({ text: 'NFT trading system in development' });
        
        const mintButton = new ButtonBuilder()
            .setCustomId('nft_mint_new')
            .setLabel('Mint New NFT')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎨');
        
        const collectionButton = new ButtonBuilder()
            .setCustomId('nft_my_collection')
            .setLabel('My Collection')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📋');
        
        const row = new ActionRowBuilder().addComponents(mintButton, collectionButton);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const marketProgress = 0.6; // Marketplace development progress
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            'NFT Marketplace Development',
            marketProgress,
            constants.COLORS.INFO
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    generateNFTId() {
        return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    },
    
    generateTraits(rarity) {
        const traitPools = {
            background: ['Cosmic', 'Forest', 'Ocean', 'Desert', 'City', 'Abstract'],
            style: ['Minimalist', 'Detailed', 'Artistic', 'Geometric', 'Organic'],
            color: ['Vibrant', 'Pastel', 'Monochrome', 'Gradient', 'Neon'],
            special: ['Animated', 'Holographic', 'Glowing', 'Textured', 'Interactive']
        };
        
        const traitCount = {
            common: 2,
            rare: 3,
            epic: 4,
            legendary: 5
        };
        
        const traits = {};
        const categories = Object.keys(traitPools);
        const numTraits = traitCount[rarity];
        
        for (let i = 0; i < numTraits; i++) {
            const category = categories[i % categories.length];
            const trait = traitPools[category][Math.floor(Math.random() * traitPools[category].length)];
            traits[category] = trait;
        }
        
        return traits;
    },
    
    formatTraits(traits) {
        return Object.entries(traits)
            .map(([key, value]) => `**${key.charAt(0).toUpperCase() + key.slice(1)}**: ${value}`)
            .join('\n');
    },
    
    getRarityColor(rarity) {
        const colors = {
            common: '#FFFFFF',
            rare: '#0099FF',
            epic: '#9933FF',
            legendary: '#FFD700'
        };
        return colors[rarity] || constants.COLORS.PRIMARY;
    },
    
    formatRarityStats(rarityCount) {
        const emojis = { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟡' };
        return Object.entries(rarityCount)
            .map(([rarity, count]) => `${emojis[rarity]} ${rarity}: ${count}`)
            .join('\n') || 'No NFTs yet';
    },
    
    getMostValuable(nfts) {
        if (nfts.length === 0) return 'None';
        const most = nfts.reduce((max, nft) => nft.marketValue > max.marketValue ? nft : max);
        return `**${most.name}**\n$${most.marketValue.toFixed(2)} VEX`;
    },
    
    getRecentMints(nfts) {
        const recent = nfts
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3)
            .map(nft => `• **${nft.name}** (${nft.rarity})`)
            .join('\n');
        return recent || 'No recent mints';
    }
};
