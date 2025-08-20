const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help with VexiumVerse commands and features')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Specific help category')
                .setRequired(false)
                .addChoices(
                    { name: 'Economy', value: 'economy' },
                    { name: 'Banking', value: 'banking' },
                    { name: 'Entertainment Games', value: 'entertainment' },
                    { name: 'Investing', value: 'investing' },
                    { name: 'Social', value: 'social' },
                    { name: 'Shopping', value: 'shopping' },
                    { name: 'Admin', value: 'admin' },
                    { name: 'Getting Started', value: 'getting-started' }
                )),
    
    async execute(interaction) {
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'help', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                knowledgeSeeking: true,
                helpOptimization: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'help',
                behaviorContext
            );
        }
        
        const category = interaction.options.getString('category');
        
        if (category) {
            return this.showCategoryHelp(interaction, category);
        }
        
        return this.showMainHelp(interaction);
    },
    
    async showMainHelp(interaction) {
        const User = require('../../database/models/User');
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const userLevel = userData?.level || 1;
        const isNewbie = userLevel <= 5;
        const isVeteran = userLevel >= 20;
        const commandsUsed = userData?.stats?.commandsUsed || 0;
        const helpCount = userData?.stats?.helpUsed || 0;
        
        userData.stats.helpUsed = helpCount + 1;
        await user.save(userData);
        
        let title = `${constants.EMOJIS.ROCKET} VexiumVerse Command Center`;
        let description = '🚀 **Welcome to your empire!** Master these commands to dominate VexiumVerse!';
        
        if (isNewbie) {
            title = `🌟 Welcome, Future Legend!`;
            description = '✨ **New to VexiumVerse?** You\'re about to embark on an EPIC journey to wealth!\n🔥 **Start with the essentials below and watch your empire grow!**';
        } else if (isVeteran) {
            title = `👑 Master's Command Arsenal`;
            description = '💎 **Veteran Player Detected!** You have access to ALL advanced features!\n🏆 **Time to show the newcomers how it\'s done!**';
        }
        
        const activeUsers = Math.floor(Math.random() * 500) + 100;
        const onlineNow = Math.floor(Math.random() * 50) + 20;
        const recentEarners = Math.floor(Math.random() * 25) + 10;
        description += `\n\n📊 **Live Stats:** ${activeUsers} players building empires | ${onlineNow} online now!`;
        description += `\n💰 **${recentEarners} players earned VEX in the last hour!**`;
        
        const surpriseBonus = Math.random() < 0.2 ? Math.floor(Math.random() * 50) + 10 : 0;
        if (surpriseBonus > 0) {
            description += `\n✨ **SURPRISE KNOWLEDGE BONUS: +${surpriseBonus} VEX** for seeking help!`;
            const User = require('../../database/models/User');
            const user = new User(interaction.user.id);
            await user.addVEX(surpriseBonus, 'help_bonus');
        }
        
        if (helpCount === 0) {
            description += `\n🎉 **FIRST TIME BONUS!** You're taking the right first step!`;
        } else if (helpCount >= 10) {
            description += `\n🧠 **KNOWLEDGE SEEKER!** ${helpCount} help sessions - you're becoming a master!`;
        } else if (helpCount >= 5) {
            description += `\n📚 **LEARNING STREAK!** Knowledge is power - keep it up!`;
        }
        
        const urgencyMessage = Math.random() < 0.3 ? '\n⚠️ **LIMITED TIME:** Some features have daily limits - act fast!' : '';
        description += urgencyMessage;
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 100) + 25);
        const variableReward = Math.random() < 0.15 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 10 + 5).toFixed(2)) : null;
        
        if (variableReward) {
            description += `\n${variableReward}`;
        }
        description += `\n${fomoMessage}`;
        description += `\n${socialProofMessage}`;
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .addFields(
                {
                    name: '💰 Economy Commands',
                    value: '`/start` `/daily` `/work` `/wallet` `/invest`\nEarn and manage your VEX tokens',
                    inline: true
                },
                {
                    name: '🏦 Banking Commands',
                    value: '`/deposit` `/withdraw` `/bank` `/interest`\nSecure storage with interest earnings',
                    inline: true
                },
                {
                    name: '🎮 Entertainment Games',
                    value: '`/entertainment slots` `/entertainment coinflip` `/entertainment dice`\nSkill-based games for VEX rewards (21+ required)',
                    inline: true
                },
                {
                    name: '📈 Investment Commands',
                    value: '`/invest buy` `/invest sell` `/invest portfolio`\nGrow wealth through smart investing',
                    inline: true
                },
                {
                    name: '👥 Social Commands',
                    value: '`/profile` `/gift` `/leaderboard` `/trade`\nConnect and compete with others',
                    inline: true
                },
                {
                    name: '🛍️ Shopping Commands',
                    value: '`/shop` `/use` `/linkwallet`\nPurchase items and link crypto wallets',
                    inline: true
                }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setThumbnail('https://via.placeholder.com/128x128/8B5CF6/FFFFFF?text=VEX')
            .setFooter({ text: '💡 Pro Tip: Smart players check help regularly for hidden bonuses!' })
            .setTimestamp();
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category_select')
            .setPlaceholder('Choose a category for detailed help')
            .addOptions([
                {
                    label: 'Getting Started',
                    description: 'New to VexiumVerse? Start here!',
                    value: 'getting-started',
                    emoji: '🚀'
                },
                {
                    label: 'Economy',
                    description: 'Earning and managing VEX tokens',
                    value: 'economy',
                    emoji: '💰'
                },
                {
                    label: 'Banking',
                    description: 'Deposits, withdrawals, and interest',
                    value: 'banking',
                    emoji: '🏦'
                },
                {
                    label: 'Entertainment Games',
                    description: 'Skill-based entertainment games (21+ required)',
                    value: 'entertainment',
                    emoji: '🎮'
                },
                {
                    label: 'Investing',
                    description: 'Grow wealth through investments',
                    value: 'investing',
                    emoji: '📈'
                },
                {
                    label: 'Social',
                    description: 'Profiles, gifts, and leaderboards',
                    value: 'social',
                    emoji: '👥'
                }
            ]);
        
        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async showCategoryHelp(interaction, category) {
        const helpData = {
            'getting-started': {
                title: '🚀 Getting Started with VexiumVerse',
                description: 'Welcome to the ultimate Discord economy! Here\'s how to begin your journey:',
                fields: [
                    {
                        name: '1️⃣ Create Your Account',
                        value: '`/start` - Get your welcome bonus and VEX wallet',
                        inline: false
                    },
                    {
                        name: '2️⃣ Earn Your First VEX',
                        value: '`/daily` - Claim daily rewards\n`/work` - Choose a job and start earning',
                        inline: false
                    },
                    {
                        name: '3️⃣ Secure Your Wealth',
                        value: '`/deposit` - Put VEX in the bank to earn interest',
                        inline: false
                    },
                    {
                        name: '4️⃣ Grow Your Portfolio',
                        value: '`/invest market` - View investment opportunities\n`/shop browse` - Buy tools to increase earnings',
                        inline: false
                    },
                    {
                        name: '💡 Pro Tips',
                        value: '• VEX tokens are pegged 1:1 to USD\n• Bank deposits earn daily interest\n• Premium tiers reduce taxes\n• Link crypto wallets for future benefits',
                        inline: false
                    }
                ]
            },
            'economy': {
                title: '💰 Economy Commands',
                description: 'Master the VexiumVerse economy and maximize your VEX earnings:',
                fields: [
                    {
                        name: '`/start`',
                        value: 'Create your VEX wallet and begin your journey',
                        inline: true
                    },
                    {
                        name: '`/daily`',
                        value: 'Claim daily VEX rewards with streak bonuses',
                        inline: true
                    },
                    {
                        name: '`/work [job]`',
                        value: 'Work various jobs to earn VEX (1-hour cooldown)',
                        inline: true
                    },
                    {
                        name: '`/wallet [user]`',
                        value: 'Check VEX balance and statistics',
                        inline: true
                    },
                    {
                        name: '`/invest`',
                        value: 'Invest in crypto, stocks, bonds, real estate',
                        inline: true
                    },
                    {
                        name: '`/use <item>`',
                        value: 'Use consumable items from inventory',
                        inline: true
                    }
                ]
            },
            'banking': {
                title: '🏦 Banking Commands',
                description: 'Secure your VEX and earn passive income through our banking system:',
                fields: [
                    {
                        name: '`/deposit <amount> [term]`',
                        value: 'Deposit VEX to earn interest\n• No Lock: 0.1% daily\n• 1 Week: 0.5% daily\n• 1 Month: 1.5% daily\n• 1 Year: 6% daily',
                        inline: false
                    },
                    {
                        name: '`/withdraw <amount> [force]`',
                        value: 'Withdraw VEX from bank (taxes apply)\nUse `force: true` for locked deposits (10% penalty)',
                        inline: false
                    },
                    {
                        name: '`/bank`',
                        value: 'View complete bank account overview',
                        inline: true
                    },
                    {
                        name: '`/interest <amount> [days]`',
                        value: 'Calculate potential interest earnings',
                        inline: true
                    },
                    {
                        name: '`/history [type]`',
                        value: 'View transaction, tax, and burn history',
                        inline: true
                    }
                ]
            },
            'entertainment': {
                title: '🎮 Entertainment Games (21+ Required)',
                description: '**LEGAL NOTICE**: Skill-based entertainment games with cryptocurrency rewards. Age verification required.',
                fields: [
                    {
                        name: '`/entertainment slots <amount>`',
                        value: 'Skill-based slot entertainment game (Max: $50 VEX)',
                        inline: true
                    },
                    {
                        name: '`/entertainment coinflip <choice> <amount>`',
                        value: 'Prediction-based coin entertainment game (Max: $100 VEX)',
                        inline: true
                    },
                    {
                        name: '`/entertainment dice <prediction> <amount>`',
                        value: 'Skill-based dice prediction game (Max: $25 VEX)',
                        inline: true
                    },
                    {
                        name: '`/entertainment stats`',
                        value: 'View your entertainment game statistics',
                        inline: true
                    },
                    {
                        name: '`/verify-age`',
                        value: 'Required: Verify you are 21+ to access entertainment games',
                        inline: true
                    },
                    {
                        name: '⚖️ Legal Compliance',
                        value: '• Age verification required (21+)\n• Skill-based entertainment, not gambling\n• 15% house edge on losses\n• 2% tax on winnings\n• Play responsibly!',
                        inline: false
                    }
                ]
            },
            'investing': {
                title: '📈 Investment Commands',
                description: 'Build wealth through our sophisticated investment platform:',
                fields: [
                    {
                        name: '`/invest market`',
                        value: 'View all available investment opportunities',
                        inline: true
                    },
                    {
                        name: '`/invest buy <type> <asset> <amount>`',
                        value: 'Purchase investments (crypto, stocks, bonds, real estate)',
                        inline: false
                    },
                    {
                        name: '`/invest sell <type> <asset> [percentage]`',
                        value: 'Sell investments (24-hour minimum hold, 2% tax)',
                        inline: false
                    },
                    {
                        name: '`/invest portfolio`',
                        value: 'View your complete investment portfolio',
                        inline: true
                    },
                    {
                        name: '💡 Investment Types',
                        value: '**Crypto**: High risk, high reward\n**Stocks**: Moderate risk and returns\n**Bonds**: Low risk, stable returns\n**Real Estate**: Long-term growth',
                        inline: false
                    }
                ]
            },
            'social': {
                title: '👥 Social Commands',
                description: 'Connect with the VexiumVerse community and show off your success:',
                fields: [
                    {
                        name: '`/profile view [user]`',
                        value: 'View detailed user profiles',
                        inline: true
                    },
                    {
                        name: '`/profile bio <text>`',
                        value: 'Set your profile bio (200 chars max)',
                        inline: true
                    },
                    {
                        name: '`/profile color <hex>`',
                        value: 'Set custom profile color (requires item/premium)',
                        inline: true
                    },
                    {
                        name: '`/gift send <user> <amount/item>`',
                        value: 'Send VEX or items to other users (2% tax)',
                        inline: false
                    },
                    {
                        name: '`/gift random <amount>`',
                        value: 'Send anonymous gift to random active user',
                        inline: false
                    },
                    {
                        name: '`/leaderboard [category] [page]`',
                        value: 'View rankings by networth, level, earnings, etc.',
                        inline: false
                    },
                    {
                        name: '`/trade offer <user> <offer>`',
                        value: 'Create trade offers with other users',
                        inline: true
                    }
                ]
            }
        };
        
        const data = helpData[category];
        if (!data) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Category Not Found`)
                .setDescription('Invalid help category.\n\n' + constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)])
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 75) + 15);
        const milestoneMessage = Math.random() < 0.2 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        
        let enhancedDescription = data.description;
        enhancedDescription += `\n\n${socialProofMessage}`;
        if (milestoneMessage) {
            enhancedDescription += `\n${milestoneMessage}`;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(data.title)
            .setDescription(enhancedDescription)
            .addFields(data.fields)
            .setColor(constants.COLORS.PRIMARY)
            .setFooter({ text: 'Need more help? Join our support server!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
