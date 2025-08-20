const { Collection } = require('discord.js');
const User = require('../database/models/User');
const constants = require('../utils/constants');

class InteractionHandler {
    constructor() {
        this.handlers = new Collection();
        this.setupHandlers();
    }

    setupHandlers() {
        this.handlers.set('shop_category_select', this.handleShopCategorySelect.bind(this));
        this.handlers.set('shop_quick_buy', this.handleShopQuickBuy.bind(this));
        this.handlers.set('shop_inventory', this.handleShopInventory.bind(this));
        this.handlers.set('shop_featured', this.handleShopFeatured.bind(this));
        this.handlers.set('shop_deals', this.handleShopDeals.bind(this));
        this.handlers.set('shop_back_categories', this.handleShopBackCategories.bind(this));
        this.handlers.set('shop_page', this.handleShopPagination.bind(this));
        this.handlers.set('shop_sort', this.handleShopSort.bind(this));

        this.handlers.set('leaderboard_category_select', this.handleLeaderboardCategorySelect.bind(this));
        this.handlers.set('leaderboard_page', this.handleLeaderboardPagination.bind(this));
        this.handlers.set('leaderboard_refresh', this.handleLeaderboardRefresh.bind(this));
        this.handlers.set('leaderboard_my_stats', this.handleLeaderboardMyStats.bind(this));
        this.handlers.set('leaderboard_top_10', this.handleLeaderboardTop10.bind(this));

        this.handlers.set('progression_jobs', this.handleProgressionJobs.bind(this));
        this.handlers.set('progression_achievements', this.handleProgressionAchievements.bind(this));
        this.handlers.set('progression_prestige', this.handleProgressionPrestige.bind(this));
        this.handlers.set('progression_refresh', this.handleProgressionRefresh.bind(this));
        this.handlers.set('progression_compare', this.handleProgressionCompare.bind(this));
        this.handlers.set('progression_goals', this.handleProgressionGoals.bind(this));
    }

    async handleInteraction(interaction) {
        if (!interaction.isSelectMenu() && !interaction.isButton()) return;

        const customId = interaction.customId;
        let handlerKey = customId;

        if (customId.startsWith('shop_quick_buy_')) {
            handlerKey = 'shop_quick_buy';
        } else if (customId.startsWith('shop_page_')) {
            handlerKey = 'shop_page';
        } else if (customId.startsWith('shop_sort_')) {
            handlerKey = 'shop_sort';
        } else if (customId.startsWith('leaderboard_page_')) {
            handlerKey = 'leaderboard_page';
        } else if (customId.startsWith('leaderboard_refresh_')) {
            handlerKey = 'leaderboard_refresh';
        }

        const handler = this.handlers.get(handlerKey);
        if (handler) {
            try {
                await handler(interaction);
            } catch (error) {
                console.error(`Error handling interaction ${customId}:`, error);
                
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: `${constants.EMOJIS.ERROR} An error occurred while processing your request.`,
                        ephemeral: true
                    });
                }
            }
        }
    }

    async handleShopCategorySelect(interaction) {
        const category = interaction.values[0];
        const shopCommand = require('../commands/economy/shop');
        
        interaction.options = {
            getString: () => category
        };
        
        await interaction.deferUpdate();
        await shopCommand.handleBrowse(interaction);
    }

    async handleShopQuickBuy(interaction) {
        const itemId = interaction.values[0];
        const shopCommand = require('../commands/economy/shop');
        
        interaction.options = {
            getString: (key) => key === 'item' ? itemId : null,
            getInteger: () => 1
        };
        
        await interaction.deferUpdate();
        await shopCommand.handleBuy(interaction);
    }

    async handleShopInventory(interaction) {
        const shopCommand = require('../commands/economy/shop');
        await interaction.deferUpdate();
        await shopCommand.handleInventory(interaction);
    }

    async handleShopFeatured(interaction) {
        await interaction.reply({
            content: `${constants.EMOJIS.STAR} Featured items coming soon! Check back later for special deals.`,
            ephemeral: true
        });
    }

    async handleShopDeals(interaction) {
        await interaction.reply({
            content: `${constants.EMOJIS.MONEY} Daily deals feature coming soon! Get ready for amazing discounts.`,
            ephemeral: true
        });
    }

    async handleShopBackCategories(interaction) {
        const shopCommand = require('../commands/economy/shop');
        await interaction.deferUpdate();
        await shopCommand.showCategories(interaction);
    }

    async handleShopPagination(interaction) {
        const parts = interaction.customId.split('_');
        const category = parts[2];
        const page = parseInt(parts[3]);
        
        const shopCommand = require('../commands/economy/shop');
        interaction.options = {
            getString: () => category
        };
        
        await interaction.deferUpdate();
        await shopCommand.handleBrowse(interaction);
    }

    async handleShopSort(interaction) {
        await interaction.reply({
            content: `${constants.EMOJIS.REFRESH} Item sorting feature coming soon! You'll be able to sort by price, popularity, and more.`,
            ephemeral: true
        });
    }

    async handleLeaderboardCategorySelect(interaction) {
        const category = interaction.values[0];
        const leaderboardCommand = require('../commands/social/leaderboard');
        
        interaction.options = {
            getString: () => category,
            getInteger: () => 1
        };
        
        await interaction.deferUpdate();
        await leaderboardCommand.execute(interaction);
    }

    async handleLeaderboardPagination(interaction) {
        const parts = interaction.customId.split('_');
        const category = parts[2];
        const page = parseInt(parts[3]);
        
        const leaderboardCommand = require('../commands/social/leaderboard');
        interaction.options = {
            getString: () => category,
            getInteger: () => page
        };
        
        await interaction.deferUpdate();
        await leaderboardCommand.execute(interaction);
    }

    async handleLeaderboardRefresh(interaction) {
        const parts = interaction.customId.split('_');
        const category = parts[2];
        const page = parseInt(parts[3]);
        
        const leaderboardCommand = require('../commands/social/leaderboard');
        interaction.options = {
            getString: () => category,
            getInteger: () => page
        };
        
        await interaction.deferUpdate();
        await leaderboardCommand.execute(interaction);
    }

    async handleLeaderboardMyStats(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CHART} Your Statistics`)
            .setDescription(`Personal stats for ${interaction.user.username}`)
            .addFields(
                { name: '💰 Net Worth', value: `$${userData.networth.toFixed(2)} VEX`, inline: true },
                { name: '🎯 Level', value: `${userData.level} (${userData.xp} XP)`, inline: true },
                { name: '💳 VEX Balance', value: `$${userData.vexBalance.toFixed(2)}`, inline: true },
                { name: '🏦 Bank Balance', value: `$${userData.bankBalance.toFixed(2)}`, inline: true },
                { name: '📈 Total Earned', value: `$${(userData.stats?.totalEarned || 0).toFixed(2)}`, inline: true },
                { name: '🎮 Games Played', value: `${userData.stats?.gamesPlayed || 0}`, inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setThumbnail(interaction.user.displayAvatarURL());
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    async handleLeaderboardTop10(interaction) {
        const leaderboardCommand = require('../commands/social/leaderboard');
        interaction.options = {
            getString: () => 'networth',
            getInteger: () => 1
        };
        
        await interaction.deferUpdate();
        await leaderboardCommand.execute(interaction);
    }

    async handleProgressionJobs(interaction) {
        await interaction.reply({
            content: `${constants.EMOJIS.WORK} Detailed job browser coming soon! You'll be able to explore all available jobs and their requirements.`,
            ephemeral: true
        });
    }

    async handleProgressionAchievements(interaction) {
        const achievementsCommand = require('../commands/progression/achievements');
        await interaction.deferUpdate();
        await achievementsCommand.execute(interaction);
    }

    async handleProgressionPrestige(interaction) {
        const prestigeCommand = require('../commands/economy/prestige');
        await interaction.deferUpdate();
        await prestigeCommand.execute(interaction);
    }

    async handleProgressionRefresh(interaction) {
        const progressionCommand = require('../commands/progression/progression');
        await interaction.deferUpdate();
        await progressionCommand.execute(interaction);
    }

    async handleProgressionCompare(interaction) {
        await interaction.reply({
            content: `${constants.EMOJIS.CHART} Player comparison feature coming soon! Compare your stats with friends and top players.`,
            ephemeral: true
        });
    }

    async handleProgressionGoals(interaction) {
        await interaction.reply({
            content: `${constants.EMOJIS.TARGET} Goal setting feature coming soon! Set personal targets and track your progress.`,
            ephemeral: true
        });
    }
}

module.exports = InteractionHandler;
