const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription(`✨ Transform your identity with exclusive avatar frames and effects!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('frames')
                .setDescription(`🌈 Browse stunning avatar frames - limited collection!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('equip')
                .setDescription(`🔥 Equip your premium avatar frame and stand out!`)
                .addStringOption(option =>
                    option.setName('frame')
                        .setDescription('Frame to equip')
                        .setRequired(true)
                        .addChoices(
                            { name: 'None', value: 'none' },
                            { name: 'Golden Frame', value: 'gold' },
                            { name: 'Silver Frame', value: 'silver' },
                            { name: 'Diamond Frame', value: 'diamond' },
                            { name: 'Fire Frame', value: 'fire' },
                            { name: 'Ice Frame', value: 'ice' }
                        ))),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'avatar', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                customizationEngagement: true,
                identityBuilding: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'avatar',
                behaviorContext
            );
        }
        
        switch (subcommand) {
            case 'frames':
                return this.handleFrames(interaction);
            case 'equip':
                return this.handleEquip(interaction);
        }
    },
    
    async handleFrames(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const frames = [
            { id: 'none', name: 'No Frame', price: 0, description: 'Default appearance', emoji: '⚪' },
            { id: 'gold', name: 'Golden Frame', price: 30.00, description: 'Luxurious golden border', emoji: '🟡' },
            { id: 'silver', name: 'Silver Frame', price: 20.00, description: 'Elegant silver border', emoji: '⚪' },
            { id: 'diamond', name: 'Diamond Frame', price: 100.00, description: 'Sparkling diamond border', emoji: '💎' },
            { id: 'fire', name: 'Fire Frame', price: 50.00, description: 'Animated fire effects', emoji: '🔥' },
            { id: 'ice', name: 'Ice Frame', price: 50.00, description: 'Cool ice crystal effects', emoji: '❄️' }
        ];
        
        const ownedFrames = frames.filter(f => userData.inventory[`avatar_frame_${f.id}`] || f.id === 'none').length;
        const totalFrames = frames.length;
        const collectionProgress = (ownedFrames / totalFrames) * 100;
        const isCollector = collectionProgress >= 75;
        const isCompletionist = collectionProgress >= 100;
        
        const frameUsage = userData.stats.frameChanges || 0;
        const isStyleExpert = frameUsage >= 20;
        const recentFrameChange = userData.lastFrameChange && (Date.now() - new Date(userData.lastFrameChange).getTime()) < 86400000;
        const surpriseDiscount = Math.random() < 0.15 ? 0.2 : 0;
        const activeCustomizers = Math.floor(Math.random() * 25) + 10;
        
        let title = `${constants.EMOJIS.NFT} Avatar Frame Collection`;
        let description = '✨ **Transform your identity!** Choose from exclusive avatar frames!';
        
        if (isCompletionist) {
            title = `👑 FRAME MASTER! Complete Collection`;
            description = '🏆 **LEGENDARY COLLECTOR!** You own every single frame!\n💎 **Ultimate customization unlocked!**';
        } else if (isCollector) {
            title = `🔥 FRAME COLLECTOR! Almost Complete`;
            description = '⭐ **AMAZING COLLECTION!** You\'re almost a completionist!\n🎯 **Just a few more frames to legendary status!**';
        }
        
        const flashSale = Math.random() < 0.3;
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', activeCustomizers);
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 3 + 1).toFixed(2)) : null;
        const milestoneMessage = isCollector ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description + 
                (flashSale ? `\n\n🔥 **FLASH SALE ACTIVE!** Limited time discounts!` : '') +
                (variableReward ? `\n${variableReward}` : '') +
                (milestoneMessage ? `\n${milestoneMessage}` : '') +
                `\n\n${fomoMessage}\n${socialProofMessage}`)
            .addFields({
                name: '📊 Collection Progress',
                value: `**${collectionProgress.toFixed(1)}%** complete\n🎨 **${ownedFrames}**/${totalFrames} frames owned`,
                inline: false
            })
            .setColor(isCompletionist ? constants.COLORS.VEX : isCollector ? constants.COLORS.SUCCESS : constants.COLORS.PRIMARY)
            .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
            .setTimestamp();
        
        for (const frame of frames) {
            const owned = userData.inventory[`avatar_frame_${frame.id}`] || (frame.id === 'none');
            const equipped = userData.profile.frame === frame.id || (frame.id === 'none' && !userData.profile.frame);
            
            let status = '';
            if (equipped) status = '✅ Equipped';
            else if (owned) status = '✅ Owned';
            else status = `💰 ${frame.price.toFixed(2)} VEX`;
            
            embed.addFields({
                name: `${frame.emoji} ${frame.name}`,
                value: `${frame.description}\n**Status**: ${status}`,
                inline: true
            });
        }
        
        embed.setFooter({ text: 'Purchase frames from /shop or equip owned frames with /avatar equip' });
        embed.setImage('attachment://progress.png');
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Frame Collection: ${ownedFrames}/${totalFrames}`,
            collectionProgress / 100,
            constants.COLORS.PRIMARY
        );
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleEquip(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const frameId = interaction.options.getString('frame');
        
        if (frameId !== 'none' && !userData.inventory[`avatar_frame_${frameId}`]) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 30) + 15);
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Frame Not Owned`)
                .setDescription(`⏳ You don't own the **${frameId}** avatar frame yet!\n\n💎 **Exclusive frames are flying off the ...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        userData.profile.frame = frameId === 'none' ? null : frameId;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const frameNames = {
            none: 'No Frame',
            gold: 'Golden Frame',
            silver: 'Silver Frame',
            diamond: 'Diamond Frame',
            fire: 'Fire Frame',
            ice: 'Ice Frame'
        };
        
        const frameEmojis = {
            none: '⚪',
            gold: '🟡',
            silver: '⚪',
            diamond: '💎',
            fire: '🔥',
            ice: '❄️'
        };
        
        const milestoneMessage = constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 20) + 10);
        const variableReward = Math.random() < 0.15 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 2 + 0.5).toFixed(2)) : null;
        
        const embed = new EmbedBuilder()
            .setTitle(`✨ Avatar Frame Updated!`)
            .setDescription(`🎉 You've equipped the **${frameNames[frameId]}**!\n\n🔥 **Your profile just got 10x more attractive!**\n📈 **Other players are already noticing your style!**\n\n${milestoneMessage}\n${socialProofMessage}${variableReward ? `\n${variableReward}` : ''}`)
            .addFields({
                name: `${frameEmojis[frameId]} Current Frame`,
                value: frameNames[frameId],
                inline: true
            })
            .setColor(constants.COLORS.SUCCESS)
            .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
            .setTimestamp();
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Customization Level: ${userData.level}`,
            Math.min(userData.level / 50, 1),
            constants.COLORS.SUCCESS
        );
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    }
};
