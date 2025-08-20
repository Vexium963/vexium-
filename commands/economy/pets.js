const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pets')
        .setDescription('Adopt, care for, and train virtual pets for bonuses')
        .addSubcommand(subcommand =>
            subcommand
                .setName('adopt')
                .setDescription('Adopt a new pet companion')
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
                .setDescription('Feed your pet to keep it happy')
                .addStringOption(option =>
                    option.setName('pet_id')
                        .setDescription('ID of the pet to feed')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('Play with your pet to increase bonding')
                .addStringOption(option =>
                    option.setName('pet_id')
                        .setDescription('ID of the pet to play with')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('train')
                .setDescription('Train your pet to unlock new abilities')
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
                .setDescription('View your pet collection'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check a pet\'s status and stats')
                .addStringOption(option =>
                    option.setName('pet_id')
                        .setDescription('ID of the pet to check')
                        .setRequired(true))),
    
    cooldown: 30,
    
    async execute(interaction) {
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
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Pet Limit Reached`)
                .setDescription('You can only have 5 pets at a time.\n\nConsider releasing a pet to make room for a new one.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const adoptionCost = 500;
        
        if (userData.vexBalance < adoptionCost) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`Pet adoption costs $${adoptionCost.toFixed(2)} VEX.\nYour balance: $${userData.vexBalance.toFixed(2)} VEX`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(adoptionCost, 'pet_adoption');
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Adoption Failed`)
                .setDescription(result.reason)
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
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Pet Adopted Successfully!`)
            .setDescription(`Welcome your new companion **${pet.name}**!`)
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
        
        await interaction.reply({ embeds: [embed], components: [row] });
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
        
        await interaction.reply({ embeds: [embed], components: [row] });
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
