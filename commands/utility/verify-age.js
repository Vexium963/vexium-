const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify-age')
        .setDescription('Verify that you are 21+ years old to access entertainment games (REQUIRED FOR LEGAL COMPLIANCE)')
        .addBooleanOption(option =>
            option.setName('confirm_21_plus')
                .setDescription('I confirm under penalty of perjury that I am 21 years of age or older')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('jurisdiction')
                .setDescription('Your country/state of residence for legal compliance')
                .setRequired(true)
                .setMaxLength(100)),
    
    cooldown: 86400000, // 24 hours to prevent spam
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'verify-age', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                legalCompliance: true,
                majorLifeEvent: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'verify-age',
                behaviorContext
            );
        }
        
        const confirmation = interaction.options.getBoolean('confirm_21_plus');
        const jurisdiction = interaction.options.getString('jurisdiction');
        
        const totalVerifications = Math.floor(Math.random() * 1000) + 500;
        const todayVerifications = Math.floor(Math.random() * 50) + 10;
        const isFirstTimeUser = (userData.stats?.commandsUsed || 0) < 10;
        const hasHighNetworth = (userData.networth || 0) >= 1000;
        
        if (!confirmation) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Age Verification Failed`)
                .setDescription('**LEGAL NOTICE**: You must confirm that you are 21+ years old to access cryptocurrency entertainment games.')
                .addFields({
                    name: '⚖️ Legal Requirements',
                    value: 'Cryptocurrency gaming platforms must verify user age to comply with financial regulations and prevent underage participation.',
                    inline: false
                })
                .setColor(constants.COLORS.ERROR)
                .setFooter({ text: 'This verification protects both users and the platform legally' });
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (userData.ageVerified) {
            const daysSinceVerification = Math.floor((Date.now() - userData.ageVerifiedAt) / (1000 * 60 * 60 * 24));
            const isVeteranPlayer = daysSinceVerification >= 30;
            const entertainmentStats = userData.stats?.entertainmentGamesPlayed || 0;
            
            let title = `${constants.EMOJIS.SUCCESS} Already Verified - Welcome Back!`;
            let description = '✅ **Your age has already been verified!** You have full access to all entertainment features.';
            
            if (isVeteranPlayer) {
                title = `👑 VERIFIED VETERAN - ${daysSinceVerification} Days Strong!`;
                description = `🏆 **Veteran Player Status!** You've been verified for ${daysSinceVerification} days!\n💎 **${entertainmentStats} games played** - You're a true VexiumVerse legend!`;
            } else if (entertainmentStats >= 100) {
                title = `🎮 ENTERTAINMENT MASTER - Verified Player!`;
                description = `🔥 **Gaming Champion!** ${entertainmentStats} entertainment games played!\n⚡ **You're dominating the entertainment scene!**`;
            }
            
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .addFields(
                    { name: '📅 Verified Since', value: `<t:${Math.floor(userData.ageVerifiedAt / 1000)}:F>`, inline: true },
                    { name: '🎮 Games Played', value: `${entertainmentStats} entertainment sessions`, inline: true },
                    { name: '📊 Player Status', value: isVeteranPlayer ? '👑 Veteran' : entertainmentStats >= 50 ? '🏆 Expert' : '⭐ Active', inline: true }
                )
                .setColor(isVeteranPlayer ? constants.COLORS.VEX : constants.COLORS.SUCCESS)
                .setFooter({ text: '🎯 Ready to dominate more entertainment games!' });
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        userData.ageVerified = true;
        userData.ageVerifiedAt = Date.now();
        userData.verificationJurisdiction = jurisdiction;
        userData.verificationIP = interaction.user.id; // Store user ID for audit trail
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Age Verification Complete`)
            .setDescription('**VERIFICATION SUCCESSFUL**: You have confirmed you are 21+ and can now access entertainment games.')
            .addFields(
                {
                    name: '🎮 Available Entertainment Games',
                    value: '• Skill-based slots\n• Strategy dice games\n• Prediction coin flip\n• Card games (Blackjack, Poker)\n• Timing games (Crash, Roulette)',
                    inline: false
                },
                {
                    name: '🛡️ Responsible Gaming',
                    value: '• Set personal limits\n• Take regular breaks\n• Never play with money you cannot afford to lose\n• Seek help if gaming becomes problematic',
                    inline: false
                },
                {
                    name: '⚖️ Legal Compliance',
                    value: `Verified: <t:${Math.floor(Date.now() / 1000)}:F>\nJurisdiction: ${jurisdiction}`,
                    inline: true
                }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Your verification is permanent and cannot be undone. Play responsibly.' })
            .setTimestamp();
        
        const responsibleButton = new ButtonBuilder()
            .setCustomId(`responsible_gaming_${interaction.user.id}`)
            .setLabel('Responsible Gaming Info')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🛡️');
        
        const gamesButton = new ButtonBuilder()
            .setCustomId(`entertainment_menu_${interaction.user.id}`)
            .setLabel('View Entertainment Games')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎮');
        
        const row = new ActionRowBuilder().addComponents(responsibleButton, gamesButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
