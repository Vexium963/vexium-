const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../database/models/User');
const constants = require('../utils/constants');

class OnboardingHandler {
    static async handleOnboardingInteraction(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.customId === 'onboarding_phantom') {
            return this.showPhantomWalletStep(interaction, userData);
        } else if (interaction.customId === 'onboarding_wallet') {
            return this.showWalletStep(interaction, userData);
        } else if (interaction.customId === 'onboarding_daily') {
            return this.showDailyStep(interaction, userData);
        } else if (interaction.customId === 'onboarding_work') {
            return this.showWorkStep(interaction, userData);
        } else if (interaction.customId === 'onboarding_shop') {
            return this.showShopStep(interaction, userData);
        } else if (interaction.customId === 'onboarding_complete') {
            return this.completeOnboarding(interaction, userData);
        } else if (interaction.customId === 'onboarding_skip') {
            return this.skipOnboarding(interaction, userData);
        } else if (interaction.customId.startsWith('quick_')) {
            return this.handleQuickAction(interaction, userData);
        } else if (interaction.customId.startsWith('step_')) {
            return this.handleStepNavigation(interaction, userData);
        } else if (interaction.customId.startsWith('guide_')) {
            return this.handleGuideAction(interaction, userData);
        }
    }
    
    static async showPhantomWalletStep(interaction, userData) {
        userData.onboardingStep = 2;
        await new User(interaction.user.id).save(userData);
        
        const CanvasRenderer = require('../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            'Tutorial Progress: Step 1 of 5 - Phantom Wallet',
            0.2,
            constants.COLORS.VEX
        );

        const phantomEmbed = new EmbedBuilder()
            .setTitle(`👻 STEP 1: CONNECT PHANTOM WALLET`)
            .setDescription(`**${interaction.user.username}**, let's secure your VEX fortune with Phantom!\n\n` +
                `🚀 **Why Phantom?**\n` +
                `👻 **Phantom Wallet** - Solana ecosystem leader\n` +
                `⚡ **Lightning fast** - Instant transactions\n` +
                `🛡️ **Bank-grade security** - Your VEX is protected\n` +
                `💎 **Easy withdrawals** - Cash out anytime\n\n` +
                `**Ready to connect your Phantom wallet?**`)
            .addFields(
                {
                    name: '🎯 NEXT STEP: DAILY REWARDS',
                    value: '**After wallet:** Use `/daily` to claim your first reward\n' +
                           '💰 **Reward:** $50-150 VEX (grows with streaks!)\n' +
                           '⏰ **Time:** 30 seconds',
                    inline: false
                }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setImage('attachment://progress.png')
            .setFooter({ text: '🎮 Step 1 of 5 - Phantom Wallet Security' })
            .setTimestamp();
        
        const phantomButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('wallet_phantom')
                    .setLabel('Connect Phantom')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('👻'),
                new ButtonBuilder()
                    .setCustomId('step_2')
                    .setLabel('Next: Daily Rewards')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('💰'),
                new ButtonBuilder()
                    .setCustomId('guide_phantom')
                    .setLabel('Phantom Guide')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📖')
            );
        
        const skipButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('onboarding_skip')
                    .setLabel('Skip Tutorial')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⏭️')
            );
        
        await interaction.update({ 
            embeds: [phantomEmbed], 
            components: [phantomButtons, skipButton],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    }

    static async showWalletStep(interaction, userData) {
        userData.onboardingStep = 2;
        await new User(interaction.user.id).save(userData);
        
        const CanvasRenderer = require('../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            'Tutorial Progress: Step 1 of 5 - Wallet Connection',
            0.2,
            '#8B5CF6'
        );
        
        const walletEmbed = new EmbedBuilder()
            .setTitle(`🌟 STEP 1: CONNECT YOUR WALLET`)
            .setDescription(`**${interaction.user.username}**, let's secure your VEX fortune!\n\n` +
                `💸 **Current Balance:** $${userData.vexBalance.toFixed(2)} VEX\n` +
                `💎 **Security:** Military-grade encryption\n` +
                `✨ **Instant Withdrawals:** Available 24/7\n\n` +
                `**Choose Your Wallet:**`)
            .addFields(
                {
                    name: '🦊 MetaMask',
                    value: 'Most popular browser wallet\n**Perfect for beginners**',
                    inline: true
                },
                {
                    name: '🔵 Coinbase Wallet',
                    value: 'Professional trading platform\n**Trusted by millions**',
                    inline: true
                },
                {
                    name: '🛡️ Trust Wallet',
                    value: 'Mobile-first crypto wallet\n**Secure & convenient**',
                    inline: true
                },
                {
                    name: '👻 Phantom',
                    value: 'Solana ecosystem leader\n**Fast & modern**',
                    inline: true
                },
                {
                    name: `🔥 Why Connect?`,
                    value: `✨ Secure your earnings\n` +
                           `🚀 Enable instant withdrawals\n` +
                           `🎉 Unlock premium features\n` +
                           `🚀 Get 3x rewards for 24 hours!`,
                    inline: false
                }
            )
            .setColor(constants.COLORS.VEX)
            .setImage('attachment://progress.png')
            .setFooter({ text: '🎮 Step 1 of 5 - Choose your wallet | 23 hours left for bonus!' })
            .setTimestamp();

        const walletEmbed2 = new EmbedBuilder()
            .setTitle(`🔗 STEP 2: CHOOSE YOUR WALLET`)
            .setDescription(`**${interaction.user.username}**, secure your VEX tokens with a trusted wallet!\n\n` +
                `🦊 **MetaMask** - Most popular choice\n` +
                `🔵 **Coinbase Wallet** - Beginner friendly\n` +
                `🛡️ **Trust Wallet** - Mobile optimized\n` +
                `👻 **Phantom** - Solana ecosystem\n\n` +
                `**Ready to connect?**`)
            .addFields(
                {
                    name: '🎯 NEXT STEP: DAILY REWARDS',
                    value: '**After wallet:** Use `/daily` to claim your first reward\n' +
                           '💰 **Reward:** $50-150 VEX (grows with streaks!)\n' +
                           '⏰ **Time:** 30 seconds',
                    inline: false
                }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: '🎮 Step 2 of 5 - Wallet Security' })
            .setTimestamp();
        
        const walletButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('guide_metamask')
                    .setLabel('MetaMask')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🦊'),
                new ButtonBuilder()
                    .setCustomId('guide_coinbase')
                    .setLabel('Coinbase')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔵'),
                new ButtonBuilder()
                    .setCustomId('guide_trust')
                    .setLabel('Trust Wallet')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🛡️'),
                new ButtonBuilder()
                    .setCustomId('guide_phantom')
                    .setLabel('Phantom')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('👻')
            );
        
        const skipButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('step_2')
                    .setLabel('Skip for Now')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⏭️')
            );
        
        await interaction.update({ 
            embeds: [walletEmbed2], 
            components: [walletButtons, skipButton],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    }
    
    static async showDailyStep(interaction, userData) {
        userData.onboardingStep = 3;
        await new User(interaction.user.id).save(userData);
        
        const CanvasRenderer = require('../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            'Tutorial Progress: Step 2 of 5 - Daily Rewards',
            0.4,
            '#10B981'
        );
        
        const dailyEmbed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.MONEY_RAIN} STEP 2: CLAIM DAILY REWARDS`)
            .setDescription(`**${interaction.user.username}**, time to earn your first VEX!\n\n` +
                `${constants.ANIMATED_EMOJIS.GIFT} **Daily Rewards:** $2.50 - $7.50 VEX per day\n` +
                `${constants.ANIMATED_EMOJIS.FIRE} **Streak Bonuses:** Up to 5x multiplier\n` +
                `${constants.EMOJIS.COOLDOWN} **Reset Time:** Every 24 hours\n\n` +
                `${constants.ANIMATED_EMOJIS.SPARKLES} **Pro Tips:**`)
            .addFields(
                {
                    name: `${constants.ANIMATED_EMOJIS.CHART} Streak Power`,
                    value: 'Longer streaks = Bigger rewards\nNever break the chain!',
                    inline: true
                },
                {
                    name: `${constants.EMOJIS.PREMIUM} Premium Bonus`,
                    value: 'VIP users get 2x bonuses\nUpgrade for maximum profit!',
                    inline: true
                },
                {
                    name: `${constants.ANIMATED_EMOJIS.PULSE} Live Stats`,
                    value: `${Math.floor(Math.random() * 300) + 200} players claiming now!`,
                    inline: true
                },
                {
                    name: `${constants.ANIMATED_EMOJIS.GLOW} STEP 3 PREVIEW: START WORKING`,
                    value: `**After daily:** Use \`/work\` to start earning through jobs\n\n` +
                           `${constants.ANIMATED_EMOJIS.ROCKET} **15+ job types** with skill progression\n` +
                           `${constants.ANIMATED_EMOJIS.SPARKLES} **Instant earnings** deposited to your wallet\n` +
                           `${constants.ANIMATED_EMOJIS.BOOST} **Level up** to unlock higher-paying jobs!`,
                    inline: false
                }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setImage('attachment://progress.png')
            .setFooter({ text: '🎮 Step 2 of 5 - Daily Rewards | Build your streak for maximum profit!' })
            .setTimestamp();
        
        const dailyButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('claim_daily_tutorial')
                    .setLabel('Claim Daily Reward')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('💰'),
                new ButtonBuilder()
                    .setCustomId('step_3')
                    .setLabel('Next: Work Jobs')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⚒️')
            );
        
        await interaction.update({ 
            embeds: [dailyEmbed], 
            components: [dailyButtons],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    }
    
    static async showWorkStep(interaction, userData) {
        userData.onboardingStep = 4;
        await new User(interaction.user.id).save(userData);
        
        const workEmbed1 = new EmbedBuilder()
            .setTitle(`⚒️ STEP 4: START YOUR CAREER`)
            .setDescription(`**${interaction.user.username}**, let's build your VEX empire through work!\n\n` +
                `💼 **Available Careers:**\n` +
                `🍔 **Fast Food** - $5-15/hour (Beginner)\n` +
                `🏪 **Retail** - $8-20/hour (Easy)\n` +
                `💻 **Programming** - $25-75/hour (Requires tools)\n` +
                `🏦 **Banking** - $30-100/hour (Requires education)\n` +
                `🎬 **Entertainment** - $50-200/hour (Requires charisma)\n\n` +
                `📈 **Career Progression:**\n` +
                `• Work to gain experience\n` +
                `• Buy tools and education from `/shop`\n` +
                `• Unlock higher-paying jobs\n` +
                `• Build your professional empire!\n\n` +
                `**Ready to start working?**`)
            .addFields(
                {
                    name: '🎯 NEXT STEP: SHOPPING SPREE',
                    value: '**After work:** Use `/shop` to buy upgrades\n' +
                           '🛍️ **Items:** Tools, education, power-ups\n' +
                           '⏰ **Time:** 2 minutes',
                    inline: false
                }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setFooter({ text: '🎮 Step 4 of 5 - Career Building' })
            .setTimestamp();
        
        const CanvasRenderer = require('../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            'Tutorial Progress: Step 3 of 5 - Work & Earn',
            0.6,
            '#3B82F6'
        );
        
        const workEmbed2 = new EmbedBuilder()
            .setTitle(`🚀 STEP 3: START WORKING`)
            .setDescription(`**${interaction.user.username}**, let's put you to work!\n\n` +
                `✨ **Available Jobs:** 15+ different careers\n` +
                `📊 **Skill Progression:** Level up for better pay\n` +
                `💸 **Instant Pay:** Earnings go straight to wallet\n\n` +
                `🔥 **Career Ladder:**`)
            .addFields(
                {
                    name: '🏪 Entry Level',
                    value: 'Cashier: $0.50-$1.00\nDelivery: $0.75-$1.25',
                    inline: true
                },
                {
                    name: '💻 Professional',
                    value: 'Programmer: $2.00-$4.00\nEngineer: $3.00-$5.00',
                    inline: true
                },
                {
                    name: '👑 Executive',
                    value: 'Doctor: $5.00-$10.00\nCEO: $15.00-$25.00',
                    inline: true
                },
                {
                    name: `${constants.ANIMATED_EMOJIS.GLOW} STEP 4 PREVIEW: SHOPPING`,
                    value: `**After work:** Use \`/shop\` to buy tools and upgrades\n\n` +
                           `${constants.ANIMATED_EMOJIS.SPARKLES} **20+ items** to boost your earnings\n` +
                           `${constants.ANIMATED_EMOJIS.BOOST} **Energy drinks, tools, and cosmetics**\n` +
                           `${constants.ANIMATED_EMOJIS.CELEBRATION} **Unlock premium items** as you level up!`,
                    inline: false
                }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setImage('attachment://progress.png')
            .setFooter({ text: '🎮 Step 3 of 5 - Work Jobs | Start your career and climb the ladder!' })
            .setTimestamp();
        
        const workButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('start_work_tutorial')
                    .setLabel('Start Working')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('⚒️'),
                new ButtonBuilder()
                    .setCustomId('step_4')
                    .setLabel('Next: Shopping')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🛍️')
            );
        
        await interaction.update({ 
            embeds: [workEmbed2], 
            components: [workButtons],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    }
    
    static async showShopStep(interaction, userData) {
        userData.onboardingStep = 5;
        await new User(interaction.user.id).save(userData);
        
        const CanvasRenderer = require('../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            'Tutorial Progress: Step 4 of 5 - Shopping & Upgrades',
            0.8,
            '#F59E0B'
        );
        
        const shopEmbed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.SPARKLES} STEP 4: EXPLORE THE SHOP`)
            .setDescription(`**${interaction.user.username}**, time to upgrade your arsenal!\n\n` +
                `${constants.ANIMATED_EMOJIS.CELEBRATION} **Shop Categories:**`)
            .addFields(
                {
                    name: '⚡ Energy Drinks',
                    value: 'Work more frequently\nBoost your productivity',
                    inline: true
                },
                {
                    name: '🔧 Professional Tools',
                    value: 'Increase work earnings\nUnlock new job types',
                    inline: true
                },
                {
                    name: '🎨 Style & Cosmetics',
                    value: 'Customize your profile\nShow off your success',
                    inline: true
                },
                {
                    name: '💎 Premium Items',
                    value: 'Exclusive bonuses\nVIP-only benefits',
                    inline: true
                },
                {
                    name: `${constants.ANIMATED_EMOJIS.SPARKLES} Smart Shopping`,
                    value: `${constants.ANIMATED_EMOJIS.CHART} Buy tools first for better ROI\n${constants.ANIMATED_EMOJIS.BOOST} Energy drinks for active players`,
                    inline: true
                },
                {
                    name: `${constants.ANIMATED_EMOJIS.PULSE} Live Market`,
                    value: `${Math.floor(Math.random() * 100) + 50} items sold today!`,
                    inline: true
                },
                {
                    name: `${constants.ANIMATED_EMOJIS.GLOW} STEP 5 PREVIEW: COMPLETE TUTORIAL`,
                    value: `**Almost done!** You now know the basics:\n\n` +
                           `${constants.ANIMATED_EMOJIS.SPARKLES} **Wallet connected** for secure withdrawals\n` +
                           `${constants.ANIMATED_EMOJIS.MONEY_RAIN} **Daily rewards** for consistent income\n` +
                           `${constants.ANIMATED_EMOJIS.ROCKET} **Work system** for active earnings\n` +
                           `${constants.ANIMATED_EMOJIS.CELEBRATION} **Shopping** for upgrades and tools\n\n` +
                           `${constants.ANIMATED_EMOJIS.FIRE} **You're ready to dominate VexiumVerse!**`,
                    inline: false
                }
            )
            .setColor(constants.COLORS.GOLD)
            .setImage('attachment://progress.png')
            .setFooter({ text: '🎮 Step 4 of 5 - Shopping | Almost ready to dominate!' })
            .setTimestamp();
        
        const shopButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('open_shop_tutorial')
                    .setLabel('Browse Shop')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🛍️'),
                new ButtonBuilder()
                    .setCustomId('step_5')
                    .setLabel('Complete Tutorial')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎉')
            );
        
        await interaction.update({ 
            embeds: [shopEmbed], 
            components: [shopButtons],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    }
    
    static async completeOnboarding(interaction, userData) {
        userData.onboardingStep = 0;
        userData.onboardingCompleted = true;
        
        const completionBonus = 500;
        await new User(interaction.user.id).addVEX(completionBonus, 'tutorial_completion');
        await new User(interaction.user.id).save(userData);
        
        const CanvasRenderer = require('../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            'Tutorial Complete: Welcome to VexiumVerse!',
            1.0,
            '#10B981'
        );
        
        const completionEmbed = new EmbedBuilder()
            .setTitle(`🎉 TUTORIAL COMPLETE!`)
            .setDescription(`**Congratulations ${interaction.user.username}!** You've mastered the basics of VexiumVerse!\n\n` +
                `🎁 **Completion Bonus:** $${completionBonus} VEX\n` +
                `🔥 **3x Rewards Active:** For the next 24 hours\n` +
                `${constants.EMOJIS.PREMIUM} **VIP Trial:** 7 days of premium benefits\n\n` +
                `✨ **You're now ready to:**`)
            .addFields(
                {
                    name: `💸 Daily Income`,
                    value: 'Earn rewards with `/daily`\nBuild epic streaks!',
                    inline: true
                },
                {
                    name: `${constants.ANIMATED_EMOJIS.ROCKET} Active Earnings`,
                    value: 'Work jobs with `/work`\nClimb the career ladder!',
                    inline: true
                },
                {
                    name: `${constants.ANIMATED_EMOJIS.SPARKLES} Upgrades`,
                    value: 'Shop upgrades with `/shop`\nBoost your earnings!',
                    inline: true
                },
                {
                    name: `${constants.ANIMATED_EMOJIS.CHART} Progress`,
                    value: 'Track stats with `/profile`\nShow off your success!',
                    inline: true
                },
                {
                    name: `${constants.ANIMATED_EMOJIS.CELEBRATION} Competition`,
                    value: 'Compete on `/leaderboard`\nDominate the rankings!',
                    inline: true
                },
                {
                    name: `${constants.ANIMATED_EMOJIS.PULSE} Community`,
                    value: `${Math.floor(Math.random() * 1000) + 500} active players online!`,
                    inline: true
                },
                {
                    name: `${constants.ANIMATED_EMOJIS.GLOW} NEXT STEPS`,
                    value: `**Recommended actions:**\n\n` +
                           `1️⃣ ${constants.ANIMATED_EMOJIS.MONEY_RAIN} Claim your daily reward\n` +
                           `2️⃣ ${constants.ANIMATED_EMOJIS.ROCKET} Start working to build income\n` +
                           `3️⃣ ${constants.ANIMATED_EMOJIS.BOOST} Buy tools to increase earnings\n` +
                           `4️⃣ ${constants.ANIMATED_EMOJIS.SPARKLES} Explore all 70+ commands\n` +
                           `5️⃣ ${constants.ANIMATED_EMOJIS.CELEBRATION} Join the community and compete!\n\n` +
                           `${constants.ANIMATED_EMOJIS.FIRE} **Your VexiumVerse empire starts now!**`,
                    inline: false
                }
            )
            .setColor(constants.COLORS.GOLD)
            .setImage('attachment://progress.png')
            .setFooter({ text: '🎮 Welcome to VexiumVerse! Your empire awaits!' })
            .setTimestamp();
        
        const finalButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('quick_daily')
                    .setLabel('Claim Daily')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('💰'),
                new ButtonBuilder()
                    .setCustomId('quick_work')
                    .setLabel('Start Working')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⚒️'),
                new ButtonBuilder()
                    .setCustomId('quick_shop')
                    .setLabel('Browse Shop')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🛍️'),
                new ButtonBuilder()
                    .setCustomId('quick_profile')
                    .setLabel('View Profile')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('👤')
            );
        
        await interaction.update({ 
            embeds: [completionEmbed], 
            components: [finalButtons],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    }
    
    static async skipOnboarding(interaction, userData) {
        userData.onboardingStep = 0;
        userData.onboardingCompleted = true;
        await new User(interaction.user.id).save(userData);
        
        const skipEmbed = new EmbedBuilder()
            .setTitle(`⏭️ Tutorial Skipped`)
            .setDescription(`**${interaction.user.username}**, you've chosen to skip the tutorial.\n\n` +
                `💡 **Quick Start Guide:**\n` +
                `• `/help` - See all available commands\n` +
                `• `/daily` - Claim daily VEX rewards\n` +
                `• `/work` - Start earning income\n` +
                `• `/shop` - Buy tools and upgrades\n` +
                `• `/profile` - Customize your appearance\n\n` +
                `**Ready to build your empire?**`)
            .setColor(constants.COLORS.WARNING)
            .setFooter({ text: 'You can always use /help for guidance!' })
            .setTimestamp();
        
        await interaction.update({ embeds: [skipEmbed], components: [] });
    }
    
    static async handleQuickDaily(interaction, userData) {
        try {
            await interaction.deferUpdate();
            const dailyCommand = interaction.client.commands.get('daily');
            if (dailyCommand) {
                return await dailyCommand.execute(interaction);
            }
        } catch (error) {
            console.error('Error in handleQuickDaily:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Error executing daily command!',
                    ephemeral: true
                });
            }
        }
    }
    
    static async handleQuickWork(interaction, userData) {
        try {
            await interaction.deferUpdate();
            const workCommand = interaction.client.commands.get('work');
            if (workCommand) {
                return await workCommand.execute(interaction);
            }
        } catch (error) {
            console.error('Error in handleQuickWork:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Error executing work command!',
                    ephemeral: true
                });
            }
        }
    }
    
    static async handleQuickProfile(interaction, userData) {
        try {
            await interaction.deferUpdate();
            const profileCommand = interaction.client.commands.get('profile');
            if (profileCommand) {
                return await profileCommand.execute(interaction);
            }
        } catch (error) {
            console.error('Error in handleQuickProfile:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Error executing profile command!',
                    ephemeral: true
                });
            }
        }
    }
    
    static async handleQuickShop(interaction, userData) {
        try {
            await interaction.deferUpdate();
            const shopCommand = interaction.client.commands.get('shop');
            if (shopCommand) {
                return await shopCommand.execute(interaction);
            }
        } catch (error) {
            console.error('Error in handleQuickShop:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Error executing shop command!',
                    ephemeral: true
                });
            }
        }
    }
    
    static async handleQuickLeaderboard(interaction, userData) {
        try {
            await interaction.deferUpdate();
            const leaderboardCommand = interaction.client.commands.get('leaderboard');
            if (leaderboardCommand) {
                return await leaderboardCommand.execute(interaction);
            }
        } catch (error) {
            console.error('Error in handleQuickLeaderboard:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Error executing leaderboard command!',
                    ephemeral: true
                });
            }
        }
    }
    
    static async handleWalletConnection(interaction, userData) {
        const walletType = interaction.customId.split('_')[1];
        
        if (walletType === 'phantom') {
            return this.showPhantomGuide(interaction, userData);
        } else if (walletType === 'metamask') {
            return this.showMetaMaskGuide(interaction, userData);
        } else if (walletType === 'coinbase') {
            return this.showCoinbaseGuide(interaction, userData);
        } else if (walletType === 'trust') {
            return this.showTrustWalletGuide(interaction, userData);
        }
    }
    
    static async handleTutorialAction(interaction, userData) {
        try {
            if (interaction.customId === 'claim_daily_tutorial') {
                await interaction.deferUpdate();
                const dailyCommand = interaction.client.commands.get('daily');
                if (dailyCommand) {
                    return await dailyCommand.execute(interaction);
                }
            } else if (interaction.customId === 'start_work_tutorial') {
                await interaction.deferUpdate();
                const workCommand = interaction.client.commands.get('work');
                if (workCommand) {
                    return await workCommand.execute(interaction);
                }
            } else if (interaction.customId === 'open_shop_tutorial') {
                await interaction.deferUpdate();
                const shopCommand = interaction.client.commands.get('shop');
                if (shopCommand) {
                    return await shopCommand.execute(interaction);
                }
            }
        } catch (error) {
            console.error('Error in handleTutorialAction:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Error executing tutorial action!',
                    ephemeral: true
                });
            }
        }
    }
    
    static async handleStepNavigation(interaction, userData) {
        const stepNumber = parseInt(interaction.customId.split('_')[1]);
        
        switch (stepNumber) {
            case 1:
                return this.showWalletStep(interaction, userData);
            case 2:
                return this.showDailyStep(interaction, userData);
            case 3:
                return this.showWorkStep(interaction, userData);
            case 4:
                return this.showShopStep(interaction, userData);
            case 5:
                return this.completeOnboarding(interaction, userData);
            default:
                return this.showWalletStep(interaction, userData);
        }
    }
    
    static async handleGuideAction(interaction, userData) {
        const guideType = interaction.customId.split('_')[1];
        
        if (guideType === 'metamask') {
            return this.showMetaMaskGuide(interaction, userData);
        } else if (guideType === 'coinbase') {
            return this.showCoinbaseGuide(interaction, userData);
        } else if (guideType === 'trust') {
            return this.showTrustWalletGuide(interaction, userData);
        } else if (guideType === 'phantom') {
            return this.showPhantomGuide(interaction, userData);
        }
    }
    
    static async showMetaMaskGuide(interaction, userData) {
        const embed = new EmbedBuilder()
            .setTitle(`🌟 MetaMask Connection Guide`)
            .setDescription(`**Step-by-step MetaMask setup:**\n\n` +
                `1️⃣ Install MetaMask browser extension\n` +
                `2️⃣ Create or import your wallet\n` +
                `3️⃣ Copy your wallet address\n` +
                `4️⃣ Use \`/linkwallet metamask [address]\`\n\n` +
                `✨ **Secure & instant withdrawals enabled!**`)
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Your wallet = Your bank account for VEX tokens!' });
        
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('wallet_metamask_connect')
                    .setLabel('Connect MetaMask')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🦊'),
                new ButtonBuilder()
                    .setCustomId('step_2')
                    .setLabel('Next: Daily Rewards')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('💰')
            );
        
        await interaction.update({ embeds: [embed], components: [buttons] });
    }
    
    static async showCoinbaseGuide(interaction, userData) {
        const embed = new EmbedBuilder()
            .setTitle(`🌟 Coinbase Wallet Guide`)
            .setDescription(`**Step-by-step Coinbase setup:**\n\n` +
                `1️⃣ Download Coinbase Wallet app\n` +
                `2️⃣ Create your wallet account\n` +
                `3️⃣ Find your wallet address\n` +
                `4️⃣ Use \`/linkwallet coinbase [address]\`\n\n` +
                `✨ **Professional trading platform!**`)
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Coinbase = Trusted by millions worldwide!' });
        
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('wallet_coinbase_connect')
                    .setLabel('Connect Coinbase')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔵'),
                new ButtonBuilder()
                    .setCustomId('step_2')
                    .setLabel('Next: Daily Rewards')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('💰')
            );
        
        await interaction.update({ embeds: [embed], components: [buttons] });
    }
    
    static async showTrustWalletGuide(interaction, userData) {
        const embed = new EmbedBuilder()
            .setTitle(`🌟 Trust Wallet Guide`)
            .setDescription(`**Step-by-step Trust Wallet setup:**\n\n` +
                `1️⃣ Download Trust Wallet app\n` +
                `2️⃣ Create new wallet or import\n` +
                `3️⃣ Copy your receive address\n` +
                `4️⃣ Use \`/linkwallet trust [address]\`\n\n` +
                `✨ **Mobile-first crypto wallet!**`)
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Trust Wallet = Secure mobile crypto storage!' });
        
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('wallet_trust_connect')
                    .setLabel('Connect Trust Wallet')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🛡️'),
                new ButtonBuilder()
                    .setCustomId('step_2')
                    .setLabel('Next: Daily Rewards')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('💰')
            );
        
        await interaction.update({ embeds: [embed], components: [buttons] });
    }
    
    static async showPhantomGuide(interaction, userData) {
        const embed = new EmbedBuilder()
            .setTitle(`🌟 Phantom Wallet Guide`)
            .setDescription(`**Step-by-step Phantom setup:**\n\n` +
                `1️⃣ Install Phantom browser extension\n` +
                `2️⃣ Create or restore wallet\n` +
                `3️⃣ Copy your wallet address\n` +
                `4️⃣ Use \`/linkwallet phantom [address]\`\n\n` +
                `✨ **Solana ecosystem leader!**`)
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Phantom = Fast & secure Solana wallet!' });
        
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('wallet_phantom_connect')
                    .setLabel('Connect Phantom')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('👻'),
                new ButtonBuilder()
                    .setCustomId('step_2')
                    .setLabel('Next: Daily Rewards')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('💰')
            );
        
        await interaction.update({ embeds: [embed], components: [buttons] });
    }

    static async handleQuickAction(interaction, userData) {
        const action = interaction.customId.replace('quick_', '');
        
        try {
            switch (action) {
                case 'daily':
                    const dailyCommand = require('../commands/economy/daily');
                    return await dailyCommand.execute(interaction);
                case 'work':
                    const workCommand = require('../commands/economy/work');
                    return await workCommand.execute(interaction);
                case 'shop':
                    const shopCommand = require('../commands/economy/shop');
                    return await shopCommand.execute(interaction);
                case 'profile':
                    const profileCommand = require('../commands/social/profile');
                    return await profileCommand.execute(interaction);
                case 'leaderboard':
                    const leaderboardCommand = require('../commands/social/leaderboard');
                    return await leaderboardCommand.execute(interaction);
                default:
                    return interaction.reply({
                        content: '❌ Unknown quick action.',
                        ephemeral: true
                    });
            }
        } catch (error) {
            console.error(`Error executing quick action ${action}:`, error);
            return interaction.reply({
                content: '❌ There was an error executing that action.',
                ephemeral: true
            });
        }
    }
}

module.exports = OnboardingHandler;
