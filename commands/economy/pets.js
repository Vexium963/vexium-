const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pets')
        .setDescription(`✨ Adopt, care for, and train virtual pets for exclusive bonuses! 💓 Join 500+ pet owners earning ...`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('adopt')
                .setDescription(`✨ Adopt your perfect companion - Limited slots available!`)
                .addStringOption(option =>
                    option.setName('pet_type')
                        .setDescription('Type of pet to adopt')
                        .setRequired(true)
                        .addChoices(
                            { name: '🐕 Dog - Loyalty bonus', value: 'dog' },
                            { name: '🐱 Cat - Independence bonus', value: 'cat' },
                            { name: '🐦 Bird - Speed bonus', value: 'bird' },
                            { name: '🐠 Fish - Calm bonus', value: 'fish' },
                            { name: '🐰 Rabbit - Luck bonus', value: 'rabbit' })))
        .addSubcommand(subcommand =>
            subcommand
                .setName('feed')
                .setDescription(`💓 Feed your pet to maintain happiness and unlock bonuses!`)
                .addStringOption(option =>
                    option.setName('pet_id')
                        .setDescription('ID of the pet to feed')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription(`🎉 Play with your pet to boost bonding and earn rewards!`)
                .addStringOption(option =>
                    option.setName('pet_id')
                        .setDescription('ID of the pet to play with')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('train')
                .setDescription(`🔥 Train your pet to unlock powerful abilities and multipliers!`)
                .addStringOption(option =>
                    option.setName('pet_id')
                        .setDescription('ID of the pet to train')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('skill')
                        .setDescription('Skill to train')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Fetch - Increases daily rewards', value: 'fetch' },
                            { name: 'Guard - Protects from losses', value: 'guard' },
                            { name: 'Hunt - Finds random items', value: 'hunt' },
                            { name: 'Perform - Entertainment bonuses', value: 'perform' })))
        .addSubcommand(subcommand =>
            subcommand
                .setName('collection')
                .setDescription(`🌈 View your amazing pet collection and achievements!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription(`📈 Check your pet's detailed status, stats, and progress!`)
                .addStringOption(option =>
                    option.setName('pet_id')
                        .setDescription('ID of the pet to check')
                        .setRequired(true))),
    
    cooldown: 30,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.psychologyEngine) {
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'pets',
                { petCollection: userData.pets?.length || 0, engagement: 'high' }
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'pets', true);
        }
        
        const petCount = userData.pets?.length || 0;
        const isPetMaster = petCount >= 3;
        const isNewPetOwner = petCount === 0;
        const lastPetActivity = userData.stats.lastPetActivity || 0;
        const timeSinceLastActivity = Date.now() - lastPetActivity;
        const isReturningUser = timeSinceLastActivity > 86400000; // 24 hours
        
        const surpriseBonus = Math.random() < 0.2 ? Math.floor(Math.random() * 100) + 50 : 0;
        
        const urgencyMessage = petCount > 0 && timeSinceLastActivity > 43200000 ? // 12 hours
            '⚠️ **Your pets miss you!** They need attention soon!' : '';
        
        const activePetOwners = Math.floor(Math.random() * 200) + 150;
        
        const totalPetsFed = userData.stats.petsFed || 0;
        const isCaringMilestone = [10, 25, 50, 100].includes(totalPetsFed);
        
        if (surpriseBonus > 0) {
            await user.addVEX(surpriseBonus, 'pet_surprise_bonus');
            userData.stats.lastPetActivity = Date.now();
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'adopt':
                return this.handleAdopt(interaction);
            case 'feed':
                return this.handleFeed(interaction);
            case 'play':
                return this.handlePlay(interaction);
            case 'train':
                return this.handleTrain(interaction);
            case 'collection':
                return this.handleCollection(interaction);
            case 'status':
                return this.handleStatus(interaction);
        }
    },
    
    async handleAdopt(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const petType = interaction.options.getString('pet_type');
        
        if (!userData.pets) userData.pets = [];
        
        if (userData.pets.length >= 5) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Pet Limit Reached`)
                .setDescription(`💥 You can only have 5 pets at a time!\n\n🔥 **URGENT:** Other players are adopting rare pets rig...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const adoptionCost = 500;
        
        if (userData.vexBalance < adoptionCost) {
            const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 50) + 20);
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`💸 Pet adoption costs $${adoptionCost.toFixed(2)} VEX.\n\n💰 **Your balance:** $${userData.vexBalance.toFixed(2)} VEX\n🔥 **Missing:** $${(adoptionCost - userData.vexBalance).toFixed(2)} VEX\n\n🚀 **Quick earn:** Use \`/work\` or \`/daily\` to get VEX fast!\n\n${socialProof}`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(adoptionCost, 'pet_adoption');
        if (!result.success) {
            const nearMiss = constants.NEAR_MISS_MESSAGES[Math.floor(Math.random() * constants.NEAR_MISS_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Adoption Failed`)
                .setDescription(`💥 ${result.reason}\n\n🔥 **Don't give up!** Other players just adopted rare pets!\n\n${nearMiss}`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const petId = this.generatePetId();
        const pet = {
            id: petId,
            type: petType,
            name: this.generatePetName(petType),
            level: 1,
            xp: 0,
            happiness: 100,
            hunger: 0,
            energy: 100,
            bonding: 0,
            skills: {
                fetch: 0,
                guard: 0,
                hunt: 0,
                perform: 0
            },
            traits: this.generatePetTraits(petType),
            adoptedAt: new Date().toISOString(),
            lastFed: new Date().toISOString(),
            lastPlayed: null,
            lastTrained: null
        };
        
        userData.pets.push(pet);
        userData.stats.petsAdopted = (userData.stats.petsAdopted || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const petEmojis = {
            dog: '🐕',
            cat: '🐱',
            bird: '🐦',
            fish: '🐠',
            rabbit: '🐰'
        };
        
        const variableReward = Math.random() < 0.3 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 50 + 25).toFixed(0)) : null;
        const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 100) + 50);
        const milestoneMessage = userData.stats.petsAdopted >= 3 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Pet Adopted Successfully!`)
            .setDescription(`Welcome your new companion **${pet.name}**!${variableReward ? `\n\n${variableReward}` : ''}\n\n${socialProof}${milestoneMessage ? `\n\n${milestoneMessage}` : ''}`)
            .addFields(
                { name: '🏷️ Name', value: pet.name, inline: true },
                { name: '🐾 Type', value: `${petEmojis[petType]} ${petType.charAt(0).toUpperCase() + petType.slice(1)}`, inline: true },
                { name: '🆔 Pet ID', value: `#${petId}`, inline: true },
                { name: '⭐ Level', value: `${pet.level}`, inline: true },
                { name: '❤️ Happiness', value: `${pet.happiness}%`, inline: true },
                { name: '⚡ Energy', value: `${pet.energy}%`, inline: true },
                { name: '🎨 Traits', value: pet.traits.join(', '), inline: false },
                { name: '💡 Pet Care Tips', value: '• Feed regularly to maintain happiness\n• Play to increase bonding\n• Train to unlock special abilities', inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `Pet #${petId} • Remember to care for your new friend!` })
            .setTimestamp();
        
        const feedButton = new ButtonBuilder()
            .setCustomId(`pet_feed_${petId}`)
            .setLabel('Feed Pet')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🍖');
        
        const playButton = new ButtonBuilder()
            .setCustomId(`pet_play_${petId}`)
            .setLabel('Play')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎾');
        
        const statusButton = new ButtonBuilder()
            .setCustomId(`pet_status_${petId}`)
            .setLabel('Check Status')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📊');
        
        const row = new ActionRowBuilder().addComponents(feedButton, playButton, statusButton);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `${pet.name}'s Happiness Level`,
            pet.happiness / 100,
            constants.COLORS.SUCCESS
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
        
        if (!userData.pets || userData.pets.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.PETS} Your Pet Collection`)
                .setDescription('You don\'t have any pets yet!\n\nUse `/pets adopt` to get your first companion.')
                .addFields(
                    { name: '🐾 Available Pets', value: '🐕 Dog - Loyalty bonus\n🐱 Cat - Independence bonus\n🐦 Bird - Speed bonus\n🐠 Fish - Calm bonus\n🐰 Rabbit - Luck bonus', inline: false },
                    { name: '💰 Adoption Cost', value: '$500 VEX per pet', inline: false }
                )
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const totalBonding = userData.pets.reduce((sum, pet) => sum + pet.bonding, 0);
        const avgHappiness = userData.pets.reduce((sum, pet) => sum + pet.happiness, 0) / userData.pets.length;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.PETS} ${interaction.user.displayName}'s Pet Collection`)
            .setDescription(`**${userData.pets.length}** beloved companions`)
            .addFields(
                { name: '📊 Collection Stats', value: `**Total Bonding**: ${totalBonding.toFixed(0)}\n**Avg Happiness**: ${avgHappiness.toFixed(0)}%\n**Pets Fed Today**: ${userData.stats.petsFedToday || 0}`, inline: true },
                { name: '🏆 Achievements', value: `**Pets Adopted**: ${userData.stats.petsAdopted || 0}\n**Total Fed**: ${userData.stats.petsFed || 0}\n**Training Sessions**: ${userData.stats.petTraining || 0}`, inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: `Pet collection: ${userData.pets.length}/5 slots used` })
            .setTimestamp();
        
        const petEmojis = {
            dog: '🐕',
            cat: '🐱',
            bird: '🐦',
            fish: '🐠',
            rabbit: '🐰'
        };
        
        for (const pet of userData.pets.slice(0, 6)) {
            const statusEmoji = pet.happiness >= 80 ? '😊' : pet.happiness >= 50 ? '😐' : '😢';
            embed.addFields({
                name: `${petEmojis[pet.type]} ${pet.name} (Lv.${pet.level})`,
                value: `**ID**: #${pet.id}\n**Status**: ${statusEmoji} ${pet.happiness}% happy\n**Bonding**: ${pet.bonding}%`,
                inline: true
            });
        }
        
        const adoptButton = new ButtonBuilder()
            .setCustomId('pets_adopt_menu')
            .setLabel('Adopt New Pet')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🐾')
            .setDisabled(userData.pets.length >= 5);
        
        const careButton = new ButtonBuilder()
            .setCustomId('pets_care_menu')
            .setLabel('Pet Care')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('❤️');
        
        const row = new ActionRowBuilder().addComponents(adoptButton, careButton);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Pet Collection Progress: ${userData.pets.length}/5 slots`,
            userData.pets.length / 5,
            constants.COLORS.VEX
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    generatePetId() {
        return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    },
    
    generatePetName(petType) {
        const names = {
            dog: ['Buddy', 'Max', 'Bella', 'Charlie', 'Luna', 'Cooper', 'Daisy', 'Rocky'],
            cat: ['Whiskers', 'Shadow', 'Luna', 'Mittens', 'Tiger', 'Princess', 'Smokey', 'Felix'],
            bird: ['Tweety', 'Sky', 'Sunny', 'Echo', 'Kiwi', 'Phoenix', 'Storm', 'Azure'],
            fish: ['Bubbles', 'Nemo', 'Splash', 'Coral', 'Pearl', 'Finn', 'Marina', 'Aqua'],
            rabbit: ['Bunny', 'Hop', 'Cotton', 'Clover', 'Snowball', 'Pepper', 'Cocoa', 'Velvet']
        };
        
        const petNames = names[petType] || ['Pet'];
        return petNames[Math.floor(Math.random() * petNames.length)];
    },
    
    generatePetTraits(petType) {
        const traits = {
            dog: ['Loyal', 'Energetic', 'Friendly', 'Protective'],
            cat: ['Independent', 'Curious', 'Graceful', 'Mysterious'],
            bird: ['Intelligent', 'Social', 'Colorful', 'Musical'],
            fish: ['Peaceful', 'Graceful', 'Colorful', 'Calm'],
            rabbit: ['Gentle', 'Quick', 'Soft', 'Playful']
        };
        
        const availableTraits = traits[petType] || ['Unique'];
        const numTraits = Math.floor(Math.random() * 2) + 2; // 2-3 traits
        
        return availableTraits
            .sort(() => 0.5 - Math.random())
            .slice(0, numTraits);
    }
};
