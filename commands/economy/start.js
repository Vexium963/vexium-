const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription(`🚀 Begin your VexiumVerse empire journey - Earn real VEX tokens! 💸 Join 50,000+ players building...`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('onboarding')
                .setDescription('Complete your onboarding tasks to unlock all VexiumVerse features'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('tutorial')
                .setDescription('🎓 Learn how to use VexiumVerse and build your empire')),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand(false);
        
        if (subcommand === 'onboarding') {
            return this.handleOnboarding(interaction);
        }else if (subcommand === 'tutorial') {
            return this.handleTutorial(interaction);
        }
        
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'start', true);
        }

        const hasLinkedWallet = userData.linkedWallets && Object.keys(userData.linkedWallets).length > 0;
        
        if (!hasLinkedWallet) {
            const embed = new EmbedBuilder()
                .setTitle('🚀 Welcome to VexiumVerse!')
                .setDescription('**Get started by linking your crypto wallet to unlock all features!**\n\n🔗 Click the button below to create a private ticket for secure wallet linking.')
                .setColor(constants.COLORS.PRIMARY)
                .setTimestamp();

            const linkWalletButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('linkwallet_start')
                        .setLabel('🔗 Link Wallet')
                        .setStyle(ButtonStyle.Primary)
                );

            return interaction.reply({ embeds: [embed], components: [linkWalletButton] });
        }
        
        if (userData.onboardingCompleted) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.SUCCESS} Welcome Back, VEX Legend!`)
                .setDescription(`🎉 **You're already dominating VexiumVerse!**\n\n💎 **Your Empire Status:**\n• Level ${userData.level} Entrepreneur\n• ${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)}) in your vault\n• Ready to expand your wealth!`)
                .addFields(
                    { name: '💰 Daily Empire Growth', value: '`/daily` - Claim streak bonuses', inline: true },
                    { name: '⚒️ Wealth Generation', value: '`/work` - Earn premium VEX', inline: true },
                    { name: '🏪 Strategic Investments', value: '`/shop` - Power up your earnings', inline: true },
                    { name: '📊 Empire Analytics', value: '`/wallet` - Track your dominance', inline: true },
                    { name: '🏆 Social Proof', value: '`/leaderboard` - See your ranking', inline: true },
                    { name: '💼 Advanced Trading', value: '`/trade` - Multiply your wealth', inline: true }
                )
                .setColor(constants.COLORS.VEX)
                .setFooter({ text: 'The /start command is only for new empire builders!' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (userData.stats.commandsUsed > 0 && !userData.onboardingCompleted) {
            const comebackBonus = Math.random() < 0.4 ? Math.floor(Math.random() * 25) + 10 : 0;
            if (comebackBonus > 0) {
                await user.addVEX(comebackBonus, 'comeback_bonus');
                Economics.updateVEXMarket('reward', comebackBonus);
            }
            
            const progressBuffer = await this.createProgressBar(userData.level, userData.xp);
            const netWorthTier = this.getWealthTier(userData.networth);
            
            const welcomeBackEmbed = new EmbedBuilder()
                .setTitle(`🎉 ${netWorthTier.icon} WELCOME BACK, ${netWorthTier.title}!`)
                .setDescription(`**${interaction.user.username}**, your empire awaits your return! 🎉\n\n` +
                    `${comebackBonus > 0 ? `💸 **COMEBACK BONUS:** +${comebackBonus} VEX (~$${(comebackBonus * Economics.getCurrentVEXPrice()).toFixed(2)})!\n` : ''}` +
                    `✨ **Empire Status:** ${userData.networth.toFixed(2)} VEX (~$${(userData.networth * Economics.getCurrentVEXPrice()).toFixed(2)})\n` +
                    `🔥 **Daily Streak:** ${userData.dailyStreak} days ${userData.dailyStreak >= 7 ? '🏆' : ''}\n\n` +
                    `⬆️ **Level ${userData.level}**\n\n` +
                    `⚡ **Quick Actions:** ${Math.floor(Math.random() * 200) + 100} players online now!`)
                .addFields(
                    { name: '💰 Current Balance', value: `${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                    { name: '🏦 Bank Savings', value: `${userData.bankBalance.toFixed(2)} VEX (~$${(userData.bankBalance * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                    { name: '📈 Net Worth', value: `${userData.networth.toFixed(2)} VEX (~$${(userData.networth * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true }
                )
                .setColor(netWorthTier.color)
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter({ text: 'Your empire grows stronger every day!' })
                .setImage('attachment://progress.png')
                .setTimestamp();
            
            const quickActions = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('quick_daily')
                        .setLabel('Claim Daily')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('💰'),
                    new ButtonBuilder()
                        .setCustomId('quick_work')
                        .setLabel('Work Now')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('⚒️'),
                    new ButtonBuilder()
                        .setCustomId('quick_shop')
                        .setLabel('Shop')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🛍️'),
                    new ButtonBuilder()
                        .setCustomId('quick_profile')
                        .setLabel('Profile')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('👤')
                );
            
            return interaction.reply({ 
                embeds: [welcomeBackEmbed], 
                components: [quickActions],
                files: [{ attachment: progressBuffer, name: 'progress.png' }]
            });
        }
        
        
        userData.stats.commandsUsed++;
        userData.onboardingStep = 1;
        
        const welcomeBonus = Math.random() < 0.4 ? Math.floor(constants.VEX_TOKEN.STARTING_BALANCE * 0.3) : 0;
        const totalStarting = constants.VEX_TOKEN.STARTING_BALANCE + welcomeBonus;
        
        await user.addVEX(totalStarting, 'starting_bonus');
        Economics.updateVEXMarket('reward', totalStarting);
        await user.save(userData);
        
        const progressBuffer = await this.createProgressBar(1, 0, 5);
        
        const onboardingEmbed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.CELEBRATION} Welcome to VexiumVerse Empire! ${constants.ANIMATED_EMOJIS.ROCKET}`)
            .setDescription(`**🎯 CONGRATULATIONS!** You've just joined the most exclusive financial empire on Discord!

${constants.ANIMATED_EMOJIS.FIRE} **BREAKING:** You're among the first 1,000 empire builders to receive **DOUBLE STARTING VEX!**

${constants.ANIMATED_EMOJIS.MONEY_RAIN} **Your Empire Status:**
• **Starting Capital:** ${totalStarting.toFixed(2)} VEX (~$${(totalStarting * Economics.getCurrentVEXPrice()).toFixed(2)}) (+ bonus pending!)
• **Entrepreneur Level:** ${userData.level}
• **Empire ID:** #${userData.level.toString().padStart(4, '0')}

${constants.ANIMATED_EMOJIS.SPARKLES} **LIVE STATS:** ${Math.floor(Math.random() * 500) + 200} active builders earning **real money** right now!

💰 **VEX TOKENOMICS EXPLAINED:**
• VEX tokens are pegged to USD (currently $${Economics.getCurrentVEXPrice().toFixed(4)} per VEX)
• Price fluctuates based on community activity - your actions affect the market!
• When users buy items/invest/stake → VEX price increases 📈
• When users withdraw/sell/cash out → VEX price decreases 📉
• You're building wealth in a living, breathing economy!

${constants.ANIMATED_EMOJIS.DIAMOND} **NEXT CRITICAL STEP:** Link your Phantom wallet to unlock premium earning potential!`)
            .addFields(
                { 
                    name: `${constants.ANIMATED_EMOJIS.ROCKET} Your Empire Blueprint`, 
                    value: `**Phase 1:** ${constants.ANIMATED_EMOJIS.VEX} Link Phantom Wallet (PRIORITY)\n**Phase 2:** ${constants.ANIMATED_EMOJIS.GIFT} Claim Daily Empire Rewards\n**Phase 3:** ${constants.ANIMATED_EMOJIS.WORK} Start Your First Job\n**Phase 4:** ${constants.ANIMATED_EMOJIS.CHART} Explore Advanced Features\n**Phase 5:** 📊 Monitor market with \`/market\` and \`/forecast\``, 
                    inline: false 
                },
                { 
                    name: `${constants.ANIMATED_EMOJIS.FIRE} VEX Token Economy`, 
                    value: `• **Dynamic USD Peg:** Price changes with activity\n• **Market Impact:** Your actions move the market\n• **Supply & Demand:** Limited supply, growing demand\n• **Burn Mechanics:** Fees reduce total supply\n• **Real Economics:** Inflation, deflation, market cycles`, 
                    inline: false 
                },
                { 
                    name: `${constants.ANIMATED_EMOJIS.DIAMOND} Why VexiumVerse Dominates`, 
                    value: `• **Real USD-Pegged VEX Tokens** ${constants.ANIMATED_EMOJIS.MONEY_RAIN}\n• **Multiple Income Streams** ${constants.ANIMATED_EMOJIS.PROGRESS}\n• **Social Trading Empire** ${constants.ANIMATED_EMOJIS.HEART_BEAT}\n• **Premium Wallet Integration** ${constants.ANIMATED_EMOJIS.DIAMOND}`, 
                    inline: false 
                }
            )
            .setColor(constants.COLORS.VEX)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setImage('attachment://progress.png')
            .setFooter({ text: '⚡ Your empire awaits! Click below to begin your wealth journey!' })
            .setTimestamp();
        
        const onboardingButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('linkwallet_start')
                    .setLabel(`🔗 Link Wallet`)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('quick_daily')
                    .setLabel(`${constants.ANIMATED_EMOJIS.GIFT} Daily Rewards`)
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('quick_work')
                    .setLabel(`${constants.ANIMATED_EMOJIS.WORK} Start Working`)
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('onboarding_skip')
                    .setLabel('⏭️ Skip Tutorial')
                    .setStyle(ButtonStyle.Danger)
            );
        
        await interaction.reply({ 
            embeds: [onboardingEmbed], 
            components: [onboardingButtons],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
        
        setTimeout(async () => {
            const motivationEmbed = new EmbedBuilder()
                .setTitle(`✨ PRO TIP: The First 24 Hours`)
                .setDescription(`**${interaction.user.username}**, players who complete the tutorial in their first session earn **3x more VEX** in their first week!\n\n` +
                    `🔥 **Current online:** ${Math.floor(Math.random() * 200) + 150} players\n` +
                    `📈 **Today's top earner:** ${(Math.random() * 500 + 200).toFixed(2)} VEX (~$${((Math.random() * 500 + 200) * Economics.getCurrentVEXPrice()).toFixed(2)})\n` +
                    `🚀 **Your potential:** Unlimited\n\n` +
                    `**Ready to connect your wallet and secure your fortune?**`)
                .setColor(constants.COLORS.GOLD)
                .setFooter({ text: `⏰ Tutorial bonus expires in 23 hours!` });
            
            await interaction.followUp({ embeds: [motivationEmbed], ephemeral: true });
        }, 3000);
    },
    
    async createProgressBar(currentStep, currentProgress, totalSteps) {
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progress = (currentStep - 1 + currentProgress) / totalSteps;
        
        return await canvasRenderer.createAnimatedProgressBar(
            `Tutorial Progress: Step ${currentStep} of ${totalSteps}`,
            progress,
            '#8B5CF6'
        );
    },
    
    getWealthTier(networth) {
        if (networth >= 10000) return { title: 'LEGEND', icon: '👑', color: '#FFD700' };
        if (networth >= 5000) return { title: 'MOGUL', icon: '💎', color: '#9932CC' };
        if (networth >= 1000) return { title: 'ENTREPRENEUR', icon: '🚀', color: '#FF6347' };
        if (networth >= 500) return { title: 'INVESTOR', icon: '📈', color: '#32CD32' };
        if (networth >= 100) return { title: 'TRADER', icon: '💰', color: '#1E90FF' };
        return { title: 'NEWCOMER', icon: '🌟', color: '#FFA500' };
    },

    async handleOnboarding(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();

        const requiredTasks = [
            { command: '/daily', completed: userData.stats?.dailyUsed > 0, description: 'Claim your daily VEX reward' },
            { command: '/work', completed: userData.stats?.workSessions > 0, description: 'Complete a work session' },
            { command: '/wallet', completed: userData.stats?.walletChecked > 0, description: 'Check your wallet balance' },
            { command: '/bank', completed: userData.stats?.bankChecked > 0, description: 'View your bank account' },
            { command: '/deposit', completed: userData.bankBalance > 0, description: 'Make a bank deposit' },
            { command: '/withdraw', completed: userData.stats?.withdrawalsMade > 0, description: 'Make a withdrawal' },
            { command: '/credit', completed: userData.stats?.creditChecked > 0, description: 'Check your credit score' }
        ];

        const completedTasks = requiredTasks.filter(task => task.completed).length;
        const totalTasks = requiredTasks.length;
        const isCompleted = completedTasks === totalTasks;

        if (isCompleted && !userData.onboardingCompleted) {
            userData.onboardingCompleted = true;
            const completionReward = Economics.getPeggedVEXPrice(50);
            await user.addVEX(completionReward, 'onboarding_completion');
            Economics.updateVEXMarket('reward', completionReward);
            await user.save(userData);

            const completionEmbed = new EmbedBuilder()
                .setTitle(`🎉 ONBOARDING COMPLETED!`)
                .setDescription(`**Congratulations!** You've successfully completed all onboarding tasks!\n\n💰 **Completion Reward:** ${completionReward.toFixed(2)} VEX (~$${(completionReward * Economics.getCurrentVEXPrice()).toFixed(2)})\n\n🚀 **You now have access to all VexiumVerse features!**\n\n📚 Use \`/help\` to view all available commands and start building your empire!`)
                .setColor(constants.COLORS.SUCCESS)
                .addFields(
                    { name: '🎁 Reward', value: `${completionReward.toFixed(2)} VEX`, inline: true },
                    { name: '📈 Status', value: 'Onboarding Complete ✅', inline: true },
                    { name: '🔓 Access', value: 'All commands unlocked!', inline: true }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [completionEmbed] });
        }

        const progressBuffer = await this.createProgressBar(completedTasks, 0, totalTasks);

        const taskList = requiredTasks.map(task => 
            `${task.completed ? '✅' : '⏳'} ${task.command} - ${task.description}`
        ).join('\n');

        const onboardingEmbed = new EmbedBuilder()
            .setTitle(`📋 Onboarding Progress (${completedTasks}/${totalTasks})`)
            .setDescription(`Complete these essential tasks to unlock all VexiumVerse features:\n\n${taskList}\n\n${isCompleted ? '🎉 **Ready to claim completion reward!**' : '💡 **Complete all tasks to earn a special reward!**'}`)
            .addFields(
                { name: '🎯 Progress', value: `${completedTasks}/${totalTasks} tasks completed`, inline: true },
                { name: '🎁 Reward', value: `${Economics.getPeggedVEXPrice(50).toFixed(2)} VEX (~$${(Economics.getPeggedVEXPrice(50) * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '🔓 Status', value: isCompleted ? 'Ready to Complete!' : 'In Progress', inline: true }
            )
            .setColor(isCompleted ? constants.COLORS.SUCCESS : constants.COLORS.PRIMARY)
            .setImage('attachment://progress.png')
            .setFooter({ text: 'Complete all tasks to unlock your reward and full access!' })
            .setTimestamp();

        await interaction.reply({ 
            embeds: [onboardingEmbed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },

    async handleTutorial(interaction) {
        const tutorialEmbed = new EmbedBuilder()
            .setTitle('🎓 VexiumVerse Tutorial')
            .setDescription('Welcome to VexiumVerse! Here\'s how to build your virtual empire:')
            .addFields(
                { name: '💰 Getting Started', value: '• Use `/daily` to claim daily rewards\n• Use `/work` every 3 hours to earn VEX\n• Check `/wallet` to see your balance', inline: false },
                { name: '🏦 Banking', value: '• Use `/deposit` to earn interest\n• Use `/withdraw` to access your funds\n• Check `/credit` for your credit score', inline: false },
                { name: '📈 Investing', value: '• Use `/invest` to access investment options\n• Try `/crypto`, `/stocks`, `/real-estate`\n• Build `/businesses` for passive income', inline: false },
                { name: '🛍️ Shopping', value: '• Use `/shop` to buy items and tools\n• Use `/use` to consume items\n• Items provide bonuses and unlock features', inline: false },
                { name: '🎮 Entertainment', value: '• Use `/gamble` for quick games\n• Try `/poker`, `/blackjack`, `/roulette`\n• Join `/tournaments` for big prizes', inline: false },
                { name: '👥 Social', value: '• Use `/profile` to customize your profile\n• Use `/gift` to send items to friends\n• Check `/leaderboard` to see top players', inline: false }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setFooter({ text: 'Use /help to see all available commands' })
            .setTimestamp();

        await interaction.reply({ embeds: [tutorialEmbed] });
    }
};
