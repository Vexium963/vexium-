const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crafting')
        .setDescription(`🔥 Craft legendary items, tools, and equipment using materials and VEX - Become a master artisan!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('recipes')
                .setDescription(`✨ View available crafting recipes - Discover legendary blueprints!`)
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('Recipe category to view')
                        .setRequired(false)
                        .addChoices(
                            { name: 'All Recipes', value: 'all' },
                            { name: 'Tools & Equipment', value: 'tools' },
                            { name: 'Consumables', value: 'consumables' },
                            { name: 'Decorative Items', value: 'decorative' },
                            { name: 'Advanced Gear', value: 'advanced' })))
        .addSubcommand(subcommand =>
            subcommand
                .setName('craft')
                .setDescription(`💥 Craft an item using materials - Transform resources into power!`)
                .addStringOption(option =>
                    option.setName('recipe_id')
                        .setDescription('ID of the recipe to craft')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('quantity')
                        .setDescription('Number of items to craft')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(10)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('materials')
                .setDescription(`🌈 View your crafting materials inventory - Check your treasure vault!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('workshop')
                .setDescription(`⬆️ Upgrade your crafting workshop for better recipes - Unlock legendary crafting power!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('salvage')
                .setDescription(`💸 Salvage items for crafting materials - Turn junk into treasure!`)
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('Item to salvage from inventory')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('quantity')
                        .setDescription('Quantity to salvage')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(50))),
    
    cooldown: 15,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now()
            };
            
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'crafting',
                behaviorContext
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(
                interaction.user.id,
                'crafting',
                true
            );
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'recipes':
                return this.handleRecipes(interaction);
            case 'craft':
                return this.handleCraft(interaction);
            case 'materials':
                return this.handleMaterials(interaction);
            case 'workshop':
                return this.handleWorkshop(interaction);
            case 'salvage':
                return this.handleSalvage(interaction);
        }
    },
    
    async handleRecipes(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const category = interaction.options.getString('category') || 'all';
        const workshopLevel = userData.workshopLevel || 1;
        const availableRecipes = this.getAvailableRecipes(workshopLevel, category);
        
        const craftingStreak = userData.stats.craftingStreak || 0;
        const totalCrafted = userData.stats.itemsCrafted || 0;
        const isMaster = totalCrafted >= 100;
        const isArtisan = totalCrafted >= 50;
        const flashSale = Math.random() < 0.2; // 20% chance for flash sale
        
        let title = `${constants.EMOJIS.CRAFTING} Master Craftsman's Workshop`;
        let description = `🔥 **CREATE LEGENDARY ITEMS!** Transform materials into power!\n\n**Workshop Level**: ${workshopLevel} ${workshopLevel >= 3 ? '👑' : ''}`;
        
        if (isMaster) {
            title = `👑 LEGENDARY CRAFTMASTER'S FORGE!`;
            description = `💎 **MASTER ARTISAN DETECTED!** ${totalCrafted} items crafted!\n🏆 **You're in the elite 1% of crafters!**\n\n**Workshop Level**: ${workshopLevel} 👑`;
        } else if (isArtisan) {
            title = `⚡ EXPERT ARTISAN'S WORKSHOP!`;
            description = `🔥 **SKILLED CRAFTSMAN!** ${totalCrafted} items forged!\n⭐ **You're becoming legendary!**\n\n**Workshop Level**: ${workshopLevel} ⭐`;
        }
        
        if (flashSale) {
            description += `\n\n🚨 **FLASH SALE ACTIVE!** 25% off all crafting costs for the next hour! ⏰`;
        }
        
        if (craftingStreak >= 5) {
            description += `\n🔥 **CRAFTING STREAK: ${craftingStreak} days!** You're on fire!`;
        }
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 75) + 25);
        const variableReward = Math.random() < 0.15 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 3 + 1).toFixed(2)) : null;
        
        if (variableReward) {
            description += `\n\n${variableReward}`;
        }
        
        description += `\n\n${fomoMessage}\n${socialProofMessage}`;
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`🔥 ${description} ✨\n\n🚨 **${Math.floor(Math.random() * 50) + 25} players** are crafting right n...`)
            .setColor(isMaster ? constants.COLORS.VEX : isArtisan ? constants.COLORS.SUCCESS : constants.COLORS.CRAFTING)
            .setFooter({ text: flashSale ? '⚡ Flash Sale Active! Craft now for maximum savings!' : 'Upgrade your workshop to unlock legendary recipes' })
            .setTimestamp();
        
        if (availableRecipes.length === 0) {
            embed.addFields({
                name: '🔨 No Recipes Available',
                value: `No recipes found in the ${category} category for your workshop level.\n\nUpgrade your workshop to unlock more recipes!`,
                inline: false
            });
        } else {
            embed.addFields({
                name: '📊 Recipe Overview',
                value: `**${availableRecipes.length}** recipes available\n**Category**: ${category.charAt(0).toUpperCase() + category.slice(1)}\n**Workshop Level**: ${workshopLevel}`,
                inline: false
            });
            
            for (const recipe of availableRecipes.slice(0, 8)) {
                const materials = recipe.materials.map(m => `${m.quantity}x ${m.name}`).join(', ');
                const canCraft = this.canCraftRecipe(recipe, userData);
                const status = canCraft ? '✅ Can Craft' : '❌ Missing Materials';
                
                embed.addFields({
                    name: `${recipe.emoji} ${recipe.name}`,
                    value: `**Materials**: ${materials}\n**VEX Cost**: $${recipe.vexCost.toFixed(2)}\n**ID**: ${recipe.id}\n**Status**: ${status}`,
                    inline: true
                });
            }
        }
        
        const categorySelect = new StringSelectMenuBuilder()
            .setCustomId('crafting_category')
            .setPlaceholder('Select recipe category')
            .addOptions([
                { label: 'All Recipes', value: 'all', emoji: '📋' },
                { label: 'Tools & Equipment', value: 'tools', emoji: '🔧' },
                { label: 'Consumables', value: 'consumables', emoji: '🧪' },
                { label: 'Decorative Items', value: 'decorative', emoji: '🎨' },
                { label: 'Advanced Gear', value: 'advanced', emoji: '⚡' }
            ]);
        
        const craftButton = new ButtonBuilder()
            .setCustomId('crafting_craft_menu')
            .setLabel('Craft Item')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🔨');
        
        const materialsButton = new ButtonBuilder()
            .setCustomId('crafting_materials')
            .setLabel('My Materials')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📦');
        
        const workshopButton = new ButtonBuilder()
            .setCustomId('crafting_workshop')
            .setLabel('Workshop')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🏭');
        
        const row1 = new ActionRowBuilder().addComponents(categorySelect);
        const row2 = new ActionRowBuilder().addComponents(craftButton, materialsButton, workshopButton);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const workshopProgress = (workshopLevel - 1) / 4; // Assuming max level 5
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Workshop Level ${workshopLevel}`,
            workshopProgress,
            constants.COLORS.CRAFTING
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row1, row2],
            files: [{ attachment: progressBuffer, name: 'workshop-progress.png' }]
        });
    },
    
    async handleCraft(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const recipeId = interaction.options.getString('recipe_id');
        const quantity = interaction.options.getInteger('quantity') || 1;
        
        const workshopLevel = userData.workshopLevel || 1;
        const allRecipes = this.getAvailableRecipes(workshopLevel, 'all');
        const recipe = allRecipes.find(r => r.id === recipeId);
        
        if (!recipe) {
            const comebackMessage = constants.COMEBACK_MESSAGES[Math.floor(Math.random() * constants.COMEBACK_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Recipe Not Found`)
                .setDescription(`💥 No recipe found with ID: ${recipeId}\n\n💡 **Pro Tip:** Use \`/crafting recipes\` to see available recipes and become a master crafter!\n\n${comebackMessage}\n\n🔥 **${Math.floor(Math.random() * 30) + 10} players** found their perfect recipe today!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const totalVexCost = recipe.vexCost * quantity;
        
        if (userData.vexBalance < totalVexCost) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient VEX`)
                .setDescription(`💸 **Insufficient VEX for this legendary craft!**\n\n💰 **Required:** $${totalVexCost.toFixed(2)} VEX\n💳 **Your Balance:** $${userData.vexBalance.toFixed(2)} VEX\n\n🚀 **Quick Fix:** Use \`/work\` or \`/daily\` to earn more VEX!\n⚡ **${Math.floor(Math.random() * 20) + 5} players** just earned VEX in the last hour!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (!userData.materials) userData.materials = {};
        
        for (const material of recipe.materials) {
            const required = material.quantity * quantity;
            const available = userData.materials[material.name] || 0;
            
            if (available < required) {
                const embed = new EmbedBuilder()
                    .setTitle(`${constants.EMOJIS.ERROR} Insufficient Materials`)
                    .setDescription(`${constants.ANIMATED_EMOJIS.EXPLOSION} **Missing legendary materials!**\n\n🔍 **Need:** ${required}x **${material.name}**\n📦 **Have:** ${available}x\n\n💡 **Solutions:**\n• Salvage items with \`/crafting salvage\`\n• Reduce crafting quantity\n• Complete quests for materials\n\n🔥 **${Math.floor(Math.random() * 15) + 5} players** just gathered materials!`)
                    .setColor(constants.COLORS.ERROR);
                
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
        
        const result = await user.removeVEX(totalVexCost, 'crafting_cost');
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Crafting Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        for (const material of recipe.materials) {
            const required = material.quantity * quantity;
            userData.materials[material.name] -= required;
            if (userData.materials[material.name] <= 0) {
                delete userData.materials[material.name];
            }
        }
        
        if (!userData.inventory) userData.inventory = {};
        userData.inventory[recipe.name] = (userData.inventory[recipe.name] || 0) + quantity;
        
        userData.stats.itemsCrafted = (userData.stats.itemsCrafted || 0) + quantity;
        userData.stats.craftingXP = (userData.stats.craftingXP || 0) + (recipe.xp * quantity);
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const milestoneMessage = userData.stats.itemsCrafted >= 50 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 40) + 15);
        
        let successDescription = `Successfully crafted **${quantity}x ${recipe.name}**!`;
        if (milestoneMessage) {
            successDescription += `\n\n${milestoneMessage}`;
        }
        successDescription += `\n\n${socialProofMessage}`;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Crafting Successful!`)
            .setDescription(successDescription)
            .addFields(
                { name: '🔨 Item Crafted', value: `${recipe.emoji} ${recipe.name}`, inline: true },
                { name: '🔢 Quantity', value: `${quantity}`, inline: true },
                { name: '💰 VEX Cost', value: `$${totalVexCost.toFixed(2)}`, inline: true },
                { name: '⭐ XP Gained', value: `${recipe.xp * quantity} Crafting XP`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)}`, inline: true },
                { name: '🏆 Total Crafted', value: `${userData.stats.itemsCrafted}`, inline: true },
                { name: '📦 Materials Used', value: recipe.materials.map(m => `${m.quantity * quantity}x ${m.name}`).join('\n'), inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `Recipe #${recipeId} • Items added to your inventory` })
            .setTimestamp();
        
        const craftMoreButton = new ButtonBuilder()
            .setCustomId(`crafting_craft_${recipeId}`)
            .setLabel('Craft More')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔨');
        
        const recipesButton = new ButtonBuilder()
            .setCustomId('crafting_recipes')
            .setLabel('View Recipes')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋');
        
        const inventoryButton = new ButtonBuilder()
            .setCustomId('wallet_inventory')
            .setLabel('View Inventory')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎒');
        
        const row = new ActionRowBuilder().addComponents(craftMoreButton, recipesButton, inventoryButton);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const craftingXP = userData.stats.craftingXP || 0;
        const xpProgress = (craftingXP % 100) / 100;
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Crafting XP: ${craftingXP}`,
            xpProgress,
            constants.COLORS.SUCCESS
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'crafting-progress.png' }]
        });
    },
    
    async handleMaterials(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const materials = userData.materials || {};
        const materialCount = Object.keys(materials).length;
        const totalMaterials = Object.values(materials).reduce((sum, count) => sum + count, 0);
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 60) + 20);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.MATERIALS} ${interaction.user.displayName}'s Materials`)
            .setDescription(`Your crafting materials inventory\n\n${fomoMessage}\n${socialProofMessage}`)
            .addFields(
                { name: '📊 Material Stats', value: `**Types**: ${materialCount}\n**Total Items**: ${totalMaterials}\n**Crafting XP**: ${userData.stats.craftingXP || 0}`, inline: true },
                { name: '🏭 Workshop', value: `**Level**: ${userData.workshopLevel || 1}\n**Items Crafted**: ${userData.stats.itemsCrafted || 0}\n**Recipes Unlocked**: ${this.getAvailableRecipes(userData.workshopLevel || 1, 'all').length}`, inline: true }
            )
            .setColor(constants.COLORS.MATERIALS)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: 'Gather materials through salvaging, quests, and exploration' })
            .setTimestamp();
        
        if (materialCount === 0) {
            embed.addFields({
                name: '📦 No Materials',
                value: 'You don\'t have any crafting materials yet!\n\nTry salvaging items or completing quests to gather materials.',
                inline: false
            });
        } else {
            const sortedMaterials = Object.entries(materials)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 12);
            
            for (const [materialName, count] of sortedMaterials) {
                const emoji = this.getMaterialEmoji(materialName);
                embed.addFields({
                    name: `${emoji} ${materialName}`,
                    value: `**Quantity**: ${count}`,
                    inline: true
                });
            }
        }
        
        const salvageButton = new ButtonBuilder()
            .setCustomId('crafting_salvage_menu')
            .setLabel('Salvage Items')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('♻️');
        
        const recipesButton = new ButtonBuilder()
            .setCustomId('crafting_recipes')
            .setLabel('View Recipes')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📋');
        
        const workshopButton = new ButtonBuilder()
            .setCustomId('crafting_workshop')
            .setLabel('Workshop')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🏭');
        
        const row = new ActionRowBuilder().addComponents(salvageButton, recipesButton, workshopButton);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const materialsProgress = Math.min(totalMaterials / 100, 1);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Materials Collected: ${totalMaterials}`,
            materialsProgress,
            constants.COLORS.MATERIALS
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'materials-progress.png' }]
        });
    },
    
    getAvailableRecipes(workshopLevel, category) {
        const allRecipes = [
            { id: 'basic_pickaxe', name: 'Basic Pickaxe', emoji: '⛏️', category: 'tools', level: 1, vexCost: 100, xp: 25, materials: [{ name: 'Iron Ore', quantity: 3 }, { name: 'Wood', quantity: 2 }] },
            { id: 'energy_drink', name: 'Energy Drink', emoji: '⚡', category: 'consumables', level: 1, vexCost: 50, xp: 15, materials: [{ name: 'Herbs', quantity: 2 }, { name: 'Water', quantity: 1 }] },
            
            { id: 'steel_pickaxe', name: 'Steel Pickaxe', emoji: '⛏️', category: 'tools', level: 2, vexCost: 250, xp: 50, materials: [{ name: 'Steel', quantity: 2 }, { name: 'Wood', quantity: 3 }] },
            { id: 'luck_potion', name: 'Luck Potion', emoji: '🍀', category: 'consumables', level: 2, vexCost: 150, xp: 35, materials: [{ name: 'Rare Herbs', quantity: 1 }, { name: 'Crystal', quantity: 1 }] },
            
            { id: 'diamond_pickaxe', name: 'Diamond Pickaxe', emoji: '💎', category: 'advanced', level: 3, vexCost: 500, xp: 100, materials: [{ name: 'Diamond', quantity: 1 }, { name: 'Steel', quantity: 2 }] },
            { id: 'power_core', name: 'Power Core', emoji: '⚡', category: 'advanced', level: 3, vexCost: 750, xp: 150, materials: [{ name: 'Crystal', quantity: 3 }, { name: 'Rare Metal', quantity: 2 }] },
            
            { id: 'golden_statue', name: 'Golden Statue', emoji: '🏆', category: 'decorative', level: 2, vexCost: 300, xp: 75, materials: [{ name: 'Gold', quantity: 2 }, { name: 'Stone', quantity: 3 }] },
            { id: 'crystal_lamp', name: 'Crystal Lamp', emoji: '💡', category: 'decorative', level: 3, vexCost: 400, xp: 90, materials: [{ name: 'Crystal', quantity: 2 }, { name: 'Wire', quantity: 1 }] }
        ];
        
        const availableRecipes = allRecipes.filter(recipe => recipe.level <= workshopLevel);
        
        if (category === 'all') return availableRecipes;
        return availableRecipes.filter(recipe => recipe.category === category);
    },
    
    canCraftRecipe(recipe, userData) {
        if (userData.vexBalance < recipe.vexCost) return false;
        
        const materials = userData.materials || {};
        
        for (const material of recipe.materials) {
            if ((materials[material.name] || 0) < material.quantity) {
                return false;
            }
        }
        
        return true;
    },
    
    getMaterialEmoji(materialName) {
        const emojis = {
            'Iron Ore': '⚙️',
            'Wood': '🪵',
            'Steel': '🔩',
            'Herbs': '🌿',
            'Water': '💧',
            'Rare Herbs': '🍃',
            'Crystal': '💎',
            'Diamond': '💠',
            'Rare Metal': '⚡',
            'Gold': '🥇',
            'Stone': '🪨',
            'Wire': '🔌'
        };
        
        return emojis[materialName] || '📦';
    }
};
