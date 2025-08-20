const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Begin your VexiumVerse journey and create your VEX wallet'),
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (userData.stats.commandsUsed > 0) {
            const comebackMessage = constants.COMEBACK_MESSAGES[Math.floor(Math.random() * constants.COMEBACK_MESSAGES.length)];
            const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 100) + 25);
            const milestoneBonus = userData.networth >= 100 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.VEX} ${comebackMessage.split('!')[0]}!`)
                .setDescription(`${comebackMessage}\n\n💎 **Your Empire Status:** $${userData.vexBalance.toFixed(2)} VEX${milestoneBonus ? `\n\n${milestoneBonus}` : ''}\n\n${socialProof}`)
                .addFields(
                    { name: '💰 VEX Balance', value: `$${userData.vexBalance.toFixed(2)}`, inline: true },
                    { name: '🏦 Bank Balance', value: `$${userData.bankBalance.toFixed(2)}`, inline: true },
                    { name: '📊 Net Worth', value: `$${userData.networth.toFixed(2)}`, inline: true },
                    { name: '🎯 Level', value: userData.level.toString(), inline: true },
                    { name: '🔥 Daily Streak', value: userData.dailyStreak.toString(), inline: true },
                    { name: '⚒️ Job', value: userData.job || 'None', inline: true }
                )
                .setColor(constants.COLORS.VEX)
                .setFooter({ text: 'Use /help to see all available commands' })
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed] });
        }
        
        userData.stats.commandsUsed++;
        await user.save(userData);
        
        const welcomeBonus = Math.random() < 0.3 ? Math.floor(constants.VEX_TOKEN.STARTING_BALANCE * 0.5) : 0;
        const totalStarting = constants.VEX_TOKEN.STARTING_BALANCE + welcomeBonus;
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 150) + 50);
        const variableReward = Math.random() < 0.25 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 5 + 1).toFixed(2)) : null;
        
        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`🎉 WELCOME TO YOUR EMPIRE!`)
            .setDescription(`👑 **${interaction.user.username}, you're about to become LEGENDARY!**\n\n💎 **Starting Fortune:** $${totalStarting.toFixed(2)} VEX${welcomeBonus > 0 ? `\n✨ **LUCKY BONUS:** +$${welcomeBonus} VEX!` : ''}${variableReward ? `\n${variableReward}` : ''}\n\n🚀 **Your journey to wealth and power starts NOW!**\n\n` +
                `${constants.EMOJIS.VEX} **VEX Token**: 1 VEX = $1 USD (REAL VALUE!)\n` +
                `${constants.EMOJIS.MONEY} **Unlimited Earning**: Work, invest, dominate skill-based games\n` +
                `${constants.EMOJIS.BANK} **Compound Interest**: 5% daily on savings!\n` +
                `${constants.EMOJIS.CHART} **Investment Empire**: Crypto, stocks, real estate\n` +
                `${constants.EMOJIS.TROPHY} **Achievement Rewards**: Hidden bonuses worth 1000s!\n` +
                `${constants.EMOJIS.PREMIUM} **VIP Status**: Reduce taxes, unlock exclusive features\n\n` +
                `${fomoMessage}\n${socialProofMessage}`)
            .addFields(
                { 
                    name: '🎯 YOUR FIRST MISSIONS (Complete for MASSIVE rewards!)', 
                    value: '🔥 **URGENT:** `/daily` - Claim FREE VEX (expires in 24h!)\n💪 **POWER UP:** `/work` - Start earning immediately!\n🛍️ **SHOP:** `/shop` - Buy tools to multiply earnings!\n📊 **COMPETE:** `/leaderboard` - See who you need to beat!', 
                    inline: false 
                },
                { 
                    name: '💎 INSIDER SECRETS (Most players don\'t know this!)', 
                    value: '🏦 **COMPOUND:** Bank VEX for 5% daily interest!\n🏆 **ACHIEVEMENTS:** Hidden bonuses worth 1000s of VEX!\n🤝 **NETWORK:** Trade with whales for exclusive deals!\n⚡ **TIMING:** Some rewards are 10x higher at certain times!', 
                    inline: false 
                },
                { 
                    name: '🚨 LIMITED TIME OFFERS', 
                    value: '⏰ **NEWBIE PROTECTION:** 2x earnings for first 7 days!\n🎁 **REFERRAL BONUS:** Invite friends for 500 VEX each!\n🔥 **STREAK MULTIPLIER:** Daily rewards grow exponentially!\n👑 **VIP STATUS:** Early access to exclusive features!', 
                    inline: false 
                }
            )
            .setColor(constants.COLORS.VEX)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: 'VexiumVerse - Where Legends Are Born' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [welcomeEmbed] });
        
        setTimeout(async () => {
            const helpEmbed = new EmbedBuilder()
                .setTitle(`🚀 MISSION CONTROL - Your Path to Wealth!`)
                .setDescription('🎯 **COMPLETE THESE NOW FOR INSTANT REWARDS:**\n\n⚡ **Priority Actions** (Do these first!)')
                .addFields(
                    { name: '🔥 IMMEDIATE ACTIONS (Next 5 minutes!)', value: '`/daily` - **FREE $100+ VEX!**\n`/work` - **Start earning NOW!**\n`/profile` - **Customize your legend!**\n`/shop` - **Buy power multipliers!**', inline: false },
                    { name: '💎 WEALTH BUILDING (Next 30 minutes!)', value: '`/deposit` - **5% daily interest!**\n`/invest` - **Multiply your VEX!**\n`/achievements` - **Hidden bonuses!**\n`/leaderboard` - **Beat the competition!**', inline: false },
                    { name: '🏆 DOMINATION MODE (Ongoing!)', value: '`/entertainment` - **Skill-based wins!**\n`/trade` - **Player marketplace!**\n`/guild` - **Join elite teams!**\n`/tournaments` - **Compete for glory!**', inline: false },
                    { name: '⚠️ CRITICAL REMINDERS', value: '🔥 **Daily streak = EXPONENTIAL rewards!**\n💰 **Banking = Compound interest magic!**\n🎯 **Achievements = Secret wealth unlocks!**\n👑 **Consistency = Legendary status!**', inline: false }
                )
                .setColor(constants.COLORS.VEX)
                .setFooter({ text: '⏰ Your empire awaits! Every second counts!' });
            
            await interaction.followUp({ embeds: [helpEmbed], ephemeral: true });
        }, 2000);
    },
};
