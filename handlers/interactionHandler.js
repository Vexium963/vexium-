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

        this.handlers.set('select_job', this.handleJobSelection.bind(this));

        this.handlers.set('help_category_select', this.handleHelpCategorySelect.bind(this));

        this.handlers.set('analytics_economy', this.handleAnalyticsEconomy.bind(this));
        this.handlers.set('analytics_entertainment', this.handleAnalyticsEntertainment.bind(this));
        this.handlers.set('analytics_social', this.handleAnalyticsSocial.bind(this));
        this.handlers.set('analytics_export', this.handleAnalyticsExport.bind(this));
        this.handlers.set('analytics_overview', this.handleAnalyticsOverview.bind(this));

        this.handlers.set('settings_privacy', this.handleSettingsPrivacy.bind(this));
        this.handlers.set('settings_display', this.handleSettingsDisplay.bind(this));
        this.handlers.set('settings_reset', this.handleSettingsReset.bind(this));

        this.handlers.set('immersion_status', this.handleImmersionStatus.bind(this));
        this.handlers.set('immersion_challenges', this.handleImmersionChallenges.bind(this));

        this.handlers.set('verify_age_confirm', this.handleAgeVerification.bind(this));
        this.handlers.set('responsible_gaming', this.handleResponsibleGaming.bind(this));

        this.handlers.set('leaderboards_wealth', this.handleLeaderboardsWealth.bind(this));
        this.handlers.set('leaderboards_entertainment', this.handleLeaderboardsEntertainment.bind(this));
        this.handlers.set('leaderboards_social', this.handleLeaderboardsSocial.bind(this));
        this.handlers.set('leaderboards_achievements', this.handleLeaderboardsAchievements.bind(this));
        this.handlers.set('leaderboards_refresh', this.handleLeaderboardsRefresh.bind(this));

        this.handlers.set('crypto_buy_menu', this.handleCryptoBuyMenu.bind(this));
        this.handlers.set('crypto_portfolio', this.handleCryptoPortfolio.bind(this));
        this.handlers.set('crypto_market', this.handleCryptoMarket.bind(this));
        this.handlers.set('crypto_stake_menu', this.handleCryptoStakeMenu.bind(this));
        this.handlers.set('crypto_sell_menu', this.handleCryptoSellMenu.bind(this));

        this.handlers.set('nft_view_all', this.handleNftViewAll.bind(this));
        this.handlers.set('nft_marketplace', this.handleNftMarketplace.bind(this));
        this.handlers.set('nft_mint_new', this.handleNftMintNew.bind(this));
        this.handlers.set('nft_my_collection', this.handleNftMyCollection.bind(this));
        this.handlers.set('nft_buy_prompt', this.handleNftBuyPrompt.bind(this));
        this.handlers.set('nft_refresh_marketplace', this.handleNftRefreshMarketplace.bind(this));

        this.handlers.set('bonds_portfolio', this.handleBondsPortfolio.bind(this));
        this.handlers.set('bonds_market', this.handleBondsMarket.bind(this));
        this.handlers.set('bonds_redeem_menu', this.handleBondsRedeemMenu.bind(this));
        this.handlers.set('bonds_buy_menu', this.handleBondsBuyMenu.bind(this));
        this.handlers.set('bonds_calculator', this.handleBondsCalculator.bind(this));

        this.handlers.set('stocks_buy_menu', this.handleStocksBuyMenu.bind(this));
        this.handlers.set('stocks_portfolio', this.handleStocksPortfolio.bind(this));
        this.handlers.set('stocks_watchlist', this.handleStocksWatchlist.bind(this));
        this.handlers.set('stocks_market', this.handleStocksMarket.bind(this));
        this.handlers.set('stocks_sell_menu', this.handleStocksSellMenu.bind(this));

        this.handlers.set('real_estate_buy_menu', this.handleRealEstateBuyMenu.bind(this));
        this.handlers.set('real_estate_portfolio', this.handleRealEstatePortfolio.bind(this));
        this.handlers.set('real_estate_calculator', this.handleRealEstateCalculator.bind(this));
        this.handlers.set('real_estate_market', this.handleRealEstateMarket.bind(this));
        this.handlers.set('real_estate_collect', this.handleRealEstateCollect.bind(this));
        this.handlers.set('real_estate_upgrade_menu', this.handleRealEstateUpgradeMenu.bind(this));

        this.handlers.set('banking_view_loans', this.handleBankingViewLoans.bind(this));
        this.handlers.set('banking_loan_apply', this.handleBankingLoanApply.bind(this));
        this.handlers.set('banking_credit_history', this.handleBankingCreditHistory.bind(this));
        this.handlers.set('banking_savings_create', this.handleBankingSavingsCreate.bind(this));
        this.handlers.set('banking_budget_planner', this.handleBankingBudgetPlanner.bind(this));

        this.handlers.set('tournaments_join_menu', this.handleTournamentsJoinMenu.bind(this));
        this.handlers.set('tournaments_create_menu', this.handleTournamentsCreateMenu.bind(this));
        this.handlers.set('tournaments_history', this.handleTournamentsHistory.bind(this));
        this.handlers.set('tournaments_active', this.handleTournamentsActive.bind(this));

        this.handlers.set('poker_join_micro', this.handlePokerJoinMicro.bind(this));
        this.handlers.set('poker_join_low', this.handlePokerJoinLow.bind(this));
        this.handlers.set('poker_join_high', this.handlePokerJoinHigh.bind(this));
        this.handlers.set('poker_tournaments', this.handlePokerTournaments.bind(this));
        this.handlers.set('poker_leaderboard', this.handlePokerLeaderboard.bind(this));
        this.handlers.set('poker_stats', this.handlePokerStats.bind(this));

        this.handlers.set('pets_adopt_menu', this.handlePetsAdoptMenu.bind(this));
        this.handlers.set('pets_care_menu', this.handlePetsCareMenu.bind(this));

        this.handlers.set('crafting_category', this.handleCraftingCategory.bind(this));
        this.handlers.set('crafting_craft_menu', this.handleCraftingCraftMenu.bind(this));
        this.handlers.set('crafting_materials', this.handleCraftingMaterials.bind(this));
        this.handlers.set('crafting_workshop', this.handleCraftingWorkshop.bind(this));
        this.handlers.set('crafting_recipes', this.handleCraftingRecipes.bind(this));
        this.handlers.set('crafting_salvage_menu', this.handleCraftingSalvageMenu.bind(this));

        this.handlers.set('marketplace_category', this.handleMarketplaceCategory.bind(this));
        this.handlers.set('marketplace_buy_menu', this.handleMarketplaceBuyMenu.bind(this));
        this.handlers.set('marketplace_sell_menu', this.handleMarketplaceSellMenu.bind(this));
        this.handlers.set('marketplace_my_listings', this.handleMarketplaceMyListings.bind(this));
        this.handlers.set('marketplace_browse', this.handleMarketplaceBrowse.bind(this));

        this.handlers.set('quests_complete_menu', this.handleQuestsCompleteMenu.bind(this));
        this.handlers.set('quests_history', this.handleQuestsHistory.bind(this));
        this.handlers.set('quests_leaderboard', this.handleQuestsLeaderboard.bind(this));
        this.handlers.set('quests_active', this.handleQuestsActive.bind(this));

        this.handlers.set('achievements_economy', this.handleAchievementsEconomy.bind(this));
        this.handlers.set('achievements_social', this.handleAchievementsSocial.bind(this));
        this.handlers.set('achievements_entertainment', this.handleAchievementsEntertainment.bind(this));
        this.handlers.set('achievements_progress', this.handleAchievementsProgress.bind(this));
        this.handlers.set('achievements_list', this.handleAchievementsList.bind(this));
        this.handlers.set('achievements_showcase_menu', this.handleAchievementsShowcaseMenu.bind(this));
        this.handlers.set('achievements_tournaments', this.handleAchievementsTournaments.bind(this));

        this.handlers.set('insurance_claim_guide', this.handleInsuranceClaimGuide.bind(this));
        this.handlers.set('insurance_status', this.handleInsuranceStatus.bind(this));
        this.handlers.set('insurance_claim_history', this.handleInsuranceClaimHistory.bind(this));
        this.handlers.set('insurance_buy_menu', this.handleInsuranceBuyMenu.bind(this));
        this.handlers.set('insurance_renew', this.handleInsuranceRenew.bind(this));
        this.handlers.set('insurance_claim_menu', this.handleInsuranceClaimMenu.bind(this));
        this.handlers.set('insurance_cancel', this.handleInsuranceCancel.bind(this));

        this.handlers.set('challenges_claim_daily', this.handleChallengesClaimDaily.bind(this));
        this.handlers.set('challenges_weekly', this.handleChallengesWeekly.bind(this));
        this.handlers.set('challenges_progress', this.handleChallengesProgress.bind(this));
        this.handlers.set('challenges_claim_weekly', this.handleChallengesClaimWeekly.bind(this));
        this.handlers.set('challenges_daily', this.handleChallengesDaily.bind(this));
        this.handlers.set('challenges_view_all', this.handleChallengesViewAll.bind(this));
        this.handlers.set('challenges_leaderboard', this.handleChallengesLeaderboard.bind(this));

        this.handlers.set('statistics_economy', this.handleStatisticsEconomy.bind(this));
        this.handlers.set('statistics_entertainment', this.handleStatisticsEntertainment.bind(this));
        this.handlers.set('statistics_social', this.handleStatisticsSocial.bind(this));
        this.handlers.set('statistics_achievements', this.handleStatisticsAchievements.bind(this));

        this.handlers.set('leaderboards_wealth_refresh', this.handleLeaderboardsWealthRefresh.bind(this));
        this.handlers.set('leaderboards_my_rank', this.handleLeaderboardsMyRank.bind(this));
        this.handlers.set('leaderboards_global', this.handleLeaderboardsGlobal.bind(this));
        this.handlers.set('leaderboards_entertainment_skill', this.handleLeaderboardsEntertainmentSkill.bind(this));
        this.handlers.set('leaderboards_entertainment_wins', this.handleLeaderboardsEntertainmentWins.bind(this));
        this.handlers.set('leaderboards_social_traders', this.handleLeaderboardsSocialTraders.bind(this));
        this.handlers.set('leaderboards_social_gifters', this.handleLeaderboardsSocialGifters.bind(this));
        this.handlers.set('leaderboards_achievements_category', this.handleLeaderboardsAchievementsCategory.bind(this));
        this.handlers.set('leaderboards_achievements_rarity', this.handleLeaderboardsAchievementsRarity.bind(this));
        this.handlers.set('leaderboards_streaks_current', this.handleLeaderboardsStreaksCurrent.bind(this));
        this.handlers.set('leaderboards_streaks_best', this.handleLeaderboardsStreaksBest.bind(this));

        this.handlers.set('wallet_inventory', this.handleWalletInventory.bind(this));
        this.handlers.set('wallet_notify', this.handleWalletNotify.bind(this));
        this.handlers.set('wallet_learn_more', this.handleWalletLearnMore.bind(this));
        this.handlers.set('profile_view', this.handleProfileView.bind(this));
        this.handlers.set('investment_portfolio', this.handleInvestmentPortfolio.bind(this));

        this.handlers.set('market_refresh', this.handleMarketRefresh.bind(this));
        this.handlers.set('market_chart', this.handleMarketChart.bind(this));
        this.handlers.set('market_events', this.handleMarketEvents.bind(this));

        this.handlers.set('shop_browse', this.handleShopBrowse.bind(this));

        this.handlers.set('trade_help_offer', this.handleTradeHelpOffer.bind(this));
        this.handlers.set('trade_help_guide', this.handleTradeHelpGuide.bind(this));

        this.handlers.set('report_status_check', this.handleReportStatusCheck.bind(this));
        this.handlers.set('report_another', this.handleReportAnother.bind(this));

        this.handlers.set('guild_create_new', this.handleGuildCreateNew.bind(this));
        this.handlers.set('guild_refresh_list', this.handleGuildRefreshList.bind(this));

        this.handlers.set('dao_vote_prompt', this.handleDaoVotePrompt.bind(this));
        this.handlers.set('dao_create_prompt', this.handleDaoCreatePrompt.bind(this));
        this.handlers.set('dao_all_proposals', this.handleDaoAllProposals.bind(this));

        this.handlers.set('invest_quick_buy', this.handleInvestQuickBuy.bind(this));

        this.handlers.set('entertainment_skill_analysis', this.handleEntertainmentSkillAnalysis.bind(this));
        this.handlers.set('entertainment_history', this.handleEntertainmentHistory.bind(this));
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

    async handleJobSelection(interaction) {
        const User = require('../database/models/User');
        const Economics = require('../utils/economics');
        const constants = require('../utils/constants');
        const { EmbedBuilder } = require('discord.js');

        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const selectedJobId = interaction.values[0];
        const jobData = Economics.getJobData(selectedJobId);
        
        if (!jobData) {
            return interaction.reply({ content: 'Invalid job selection.', ephemeral: true });
        }
        
        userData.job = selectedJobId;
        userData.jobLevel = 1;
        userData.jobXp = 0;
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Job Selected!`)
            .setDescription(`🎉 **Congratulations!** You're now working as a **${jobData.name}**!\n\n💰 **Earning Potential:** $${jobData.minPay.toFixed(2)} - $${jobData.maxPay.toFixed(2)} VEX per work session\n\n🚀 **Ready to start earning?** Use \`/work\` to begin your first shift!`)
            .addFields(
                { name: '💼 Your New Job', value: jobData.name, inline: true },
                { name: '📊 Starting Level', value: '1', inline: true },
                { name: '⚡ Next Step', value: 'Use `/work` to start earning!', inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setTimestamp();
        
        await interaction.update({ embeds: [embed], components: [] });
    }

    async handleHelpCategorySelect(interaction) {
        return interaction.reply({ content: 'Help category selection coming soon!', ephemeral: true });
    }

    async handleAnalyticsEconomy(interaction) {
        return interaction.reply({ content: 'Analytics economy view coming soon!', ephemeral: true });
    }

    async handleAnalyticsEntertainment(interaction) {
        return interaction.reply({ content: 'Analytics entertainment view coming soon!', ephemeral: true });
    }

    async handleAnalyticsSocial(interaction) {
        return interaction.reply({ content: 'Analytics social view coming soon!', ephemeral: true });
    }

    async handleAnalyticsExport(interaction) {
        return interaction.reply({ content: 'Analytics export coming soon!', ephemeral: true });
    }

    async handleAnalyticsOverview(interaction) {
        return interaction.reply({ content: 'Analytics overview coming soon!', ephemeral: true });
    }

    async handleSettingsPrivacy(interaction) {
        return interaction.reply({ content: 'Privacy settings coming soon!', ephemeral: true });
    }

    async handleSettingsDisplay(interaction) {
        return interaction.reply({ content: 'Display settings coming soon!', ephemeral: true });
    }

    async handleSettingsReset(interaction) {
        return interaction.reply({ content: 'Settings reset coming soon!', ephemeral: true });
    }

    async handleImmersionStatus(interaction) {
        return interaction.reply({ content: 'Immersion status coming soon!', ephemeral: true });
    }

    async handleImmersionChallenges(interaction) {
        return interaction.reply({ content: 'Immersion challenges coming soon!', ephemeral: true });
    }

    async handleAgeVerification(interaction) {
        return interaction.reply({ content: 'Age verification confirmed!', ephemeral: true });
    }

    async handleResponsibleGaming(interaction) {
        return interaction.reply({ content: 'Responsible gaming info displayed!', ephemeral: true });
    }

    async handleLeaderboardsWealth(interaction) {
        return interaction.reply({ content: 'Wealth leaderboard coming soon!', ephemeral: true });
    }

    async handleLeaderboardsEntertainment(interaction) {
        return interaction.reply({ content: 'Entertainment leaderboard coming soon!', ephemeral: true });
    }

    async handleLeaderboardsSocial(interaction) {
        return interaction.reply({ content: 'Social leaderboard coming soon!', ephemeral: true });
    }

    async handleLeaderboardsAchievements(interaction) {
        return interaction.reply({ content: 'Achievements leaderboard coming soon!', ephemeral: true });
    }

    async handleLeaderboardsRefresh(interaction) {
        return interaction.reply({ content: 'Leaderboards refreshed!', ephemeral: true });
    }

    async handleCryptoBuyMenu(interaction) {
        try {
            await interaction.reply({ content: '🔧 Crypto buy menu functionality coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleCryptoBuyMenu:', error);
        }
    }

    async handleCryptoPortfolio(interaction) {
        try {
            await interaction.reply({ content: '📊 Crypto portfolio view coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleCryptoPortfolio:', error);
        }
    }

    async handleCryptoMarket(interaction) {
        try {
            await interaction.reply({ content: '📈 Crypto market view coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleCryptoMarket:', error);
        }
    }

    async handleCryptoStakeMenu(interaction) {
        try {
            await interaction.reply({ content: '🔒 Crypto staking menu coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleCryptoStakeMenu:', error);
        }
    }

    async handleCryptoSellMenu(interaction) {
        try {
            await interaction.reply({ content: '💸 Crypto sell menu coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleCryptoSellMenu:', error);
        }
    }

    async handleNftViewAll(interaction) {
        try {
            await interaction.reply({ content: '📋 NFT collection view coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleNftViewAll:', error);
        }
    }

    async handleNftMarketplace(interaction) {
        try {
            await interaction.reply({ content: '🛒 NFT marketplace coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleNftMarketplace:', error);
        }
    }

    async handleNftMintNew(interaction) {
        try {
            await interaction.reply({ content: '🎨 NFT minting coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleNftMintNew:', error);
        }
    }

    async handleNftMyCollection(interaction) {
        try {
            await interaction.reply({ content: '📋 Your NFT collection coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleNftMyCollection:', error);
        }
    }

    async handleNftBuyPrompt(interaction) {
        try {
            await interaction.reply({ content: '💰 NFT purchase coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleNftBuyPrompt:', error);
        }
    }

    async handleNftRefreshMarketplace(interaction) {
        try {
            await interaction.reply({ content: '🔄 NFT marketplace refresh coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleNftRefreshMarketplace:', error);
        }
    }

    async handleBondsPortfolio(interaction) {
        try {
            await interaction.reply({ content: '📊 Bonds portfolio view coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleBondsPortfolio:', error);
        }
    }

    async handleBondsMarket(interaction) {
        try {
            await interaction.reply({ content: '📈 Bonds market coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleBondsMarket:', error);
        }
    }

    async handleBondsRedeemMenu(interaction) {
        try {
            await interaction.reply({ content: '💰 Bonds redemption coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleBondsRedeemMenu:', error);
        }
    }

    async handleBondsBuyMenu(interaction) {
        try {
            await interaction.reply({ content: '📈 Bonds purchase coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleBondsBuyMenu:', error);
        }
    }

    async handleBondsCalculator(interaction) {
        try {
            await interaction.reply({ content: '🧮 Bonds calculator coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleBondsCalculator:', error);
        }
    }

    async handleStocksBuyMenu(interaction) {
        try {
            await interaction.reply({ content: '💰 Stocks purchase coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleStocksBuyMenu:', error);
        }
    }

    async handleStocksPortfolio(interaction) {
        try {
            await interaction.reply({ content: '📊 Stocks portfolio coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleStocksPortfolio:', error);
        }
    }

    async handleStocksWatchlist(interaction) {
        try {
            await interaction.reply({ content: '👁️ Stocks watchlist coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleStocksWatchlist:', error);
        }
    }

    async handleStocksMarket(interaction) {
        try {
            await interaction.reply({ content: '📈 Stocks market coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleStocksMarket:', error);
        }
    }

    async handleStocksSellMenu(interaction) {
        try {
            await interaction.reply({ content: '💸 Stocks sell menu coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleStocksSellMenu:', error);
        }
    }

    async handleRealEstateBuyMenu(interaction) {
        try {
            await interaction.reply({ content: '🏠 Real estate purchase coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleRealEstateBuyMenu:', error);
        }
    }

    async handleRealEstatePortfolio(interaction) {
        try {
            await interaction.reply({ content: '📊 Real estate portfolio coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleRealEstatePortfolio:', error);
        }
    }

    async handleRealEstateCalculator(interaction) {
        try {
            await interaction.reply({ content: '🧮 Real estate calculator coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleRealEstateCalculator:', error);
        }
    }

    async handleRealEstateMarket(interaction) {
        try {
            await interaction.reply({ content: '🏠 Real estate market coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleRealEstateMarket:', error);
        }
    }

    async handleRealEstateCollect(interaction) {
        try {
            await interaction.reply({ content: '💰 Real estate income collection coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleRealEstateCollect:', error);
        }
    }

    async handleRealEstateUpgradeMenu(interaction) {
        try {
            await interaction.reply({ content: '⬆️ Real estate upgrades coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleRealEstateUpgradeMenu:', error);
        }
    }

    async handleBankingViewLoans(interaction) {
        try {
            await interaction.reply({ content: '📊 Loan viewing coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleBankingViewLoans:', error);
        }
    }

    async handleBankingLoanApply(interaction) {
        try {
            await interaction.reply({ content: '💰 Loan application coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleBankingLoanApply:', error);
        }
    }

    async handleBankingCreditHistory(interaction) {
        try {
            await interaction.reply({ content: '📋 Credit history coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleBankingCreditHistory:', error);
        }
    }

    async handleBankingSavingsCreate(interaction) {
        try {
            await interaction.reply({ content: '🎯 Savings goal creation coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleBankingSavingsCreate:', error);
        }
    }

    async handleBankingBudgetPlanner(interaction) {
        try {
            await interaction.reply({ content: '📊 Budget planner coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleBankingBudgetPlanner:', error);
        }
    }

    async handleTournamentsJoinMenu(interaction) {
        try {
            await interaction.reply({ content: '🎯 Tournament joining coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleTournamentsJoinMenu:', error);
        }
    }

    async handleTournamentsCreateMenu(interaction) {
        try {
            await interaction.reply({ content: '⚡ Tournament creation coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleTournamentsCreateMenu:', error);
        }
    }

    async handleTournamentsHistory(interaction) {
        try {
            await interaction.reply({ content: '📊 Tournament history coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleTournamentsHistory:', error);
        }
    }

    async handleTournamentsActive(interaction) {
        try {
            await interaction.reply({ content: '🏆 Active tournaments coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleTournamentsActive:', error);
        }
    }

    async handlePokerJoinMicro(interaction) {
        try {
            await interaction.reply({ content: '🎯 Micro stakes poker coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handlePokerJoinMicro:', error);
        }
    }

    async handlePokerJoinLow(interaction) {
        try {
            await interaction.reply({ content: '🚀 Low stakes poker coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handlePokerJoinLow:', error);
        }
    }

    async handlePokerJoinHigh(interaction) {
        try {
            await interaction.reply({ content: '💎 High stakes poker coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handlePokerJoinHigh:', error);
        }
    }

    async handlePokerTournaments(interaction) {
        try {
            await interaction.reply({ content: '🎯 Poker tournaments coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handlePokerTournaments:', error);
        }
    }

    async handlePokerLeaderboard(interaction) {
        try {
            await interaction.reply({ content: '🏆 Poker leaderboard coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handlePokerLeaderboard:', error);
        }
    }

    async handlePokerStats(interaction) {
        try {
            await interaction.reply({ content: '📊 Poker stats coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handlePokerStats:', error);
        }
    }

    async handlePetsAdoptMenu(interaction) {
        try {
            await interaction.reply({ content: '🐾 Pet adoption coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handlePetsAdoptMenu:', error);
        }
    }

    async handlePetsCareMenu(interaction) {
        try {
            await interaction.reply({ content: '❤️ Pet care coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handlePetsCareMenu:', error);
        }
    }

    async handleCraftingCategory(interaction) {
        try {
            await interaction.reply({ content: '📋 Crafting categories coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleCraftingCategory:', error);
        }
    }

    async handleCraftingCraftMenu(interaction) {
        try {
            await interaction.reply({ content: '🔨 Crafting menu coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleCraftingCraftMenu:', error);
        }
    }

    async handleCraftingMaterials(interaction) {
        try {
            await interaction.reply({ content: '📦 Crafting materials coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleCraftingMaterials:', error);
        }
    }

    async handleCraftingWorkshop(interaction) {
        try {
            await interaction.reply({ content: '🏭 Crafting workshop coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleCraftingWorkshop:', error);
        }
    }

    async handleCraftingRecipes(interaction) {
        try {
            await interaction.reply({ content: '📋 Crafting recipes coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleCraftingRecipes:', error);
        }
    }

    async handleCraftingSalvageMenu(interaction) {
        try {
            await interaction.reply({ content: '♻️ Item salvaging coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleCraftingSalvageMenu:', error);
        }
    }

    async handleMarketplaceCategory(interaction) {
        try {
            await interaction.reply({ content: '📦 Marketplace categories coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleMarketplaceCategory:', error);
        }
    }

    async handleMarketplaceBuyMenu(interaction) {
        try {
            await interaction.reply({ content: '💰 Marketplace buying coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleMarketplaceBuyMenu:', error);
        }
    }

    async handleMarketplaceSellMenu(interaction) {
        try {
            await interaction.reply({ content: '📤 Marketplace selling coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleMarketplaceSellMenu:', error);
        }
    }

    async handleMarketplaceMyListings(interaction) {
        try {
            await interaction.reply({ content: '📋 Your marketplace listings coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleMarketplaceMyListings:', error);
        }
    }

    async handleMarketplaceBrowse(interaction) {
        try {
            await interaction.reply({ content: '🛒 Marketplace browsing coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleMarketplaceBrowse:', error);
        }
    }

    async handleQuestsCompleteMenu(interaction) {
        try {
            await interaction.reply({ content: '🎁 Quest completion coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleQuestsCompleteMenu:', error);
        }
    }

    async handleQuestsHistory(interaction) {
        try {
            await interaction.reply({ content: '📜 Quest history coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleQuestsHistory:', error);
        }
    }

    async handleQuestsLeaderboard(interaction) {
        try {
            await interaction.reply({ content: '🏅 Quest leaderboard coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleQuestsLeaderboard:', error);
        }
    }

    async handleQuestsActive(interaction) {
        try {
            await interaction.reply({ content: '🎯 Active quests coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleQuestsActive:', error);
        }
    }

    async handleAchievementsEconomy(interaction) {
        try {
            await interaction.reply({ content: '💰 Economy achievements coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleAchievementsEconomy:', error);
        }
    }

    async handleAchievementsSocial(interaction) {
        try {
            await interaction.reply({ content: '👥 Social achievements coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleAchievementsSocial:', error);
        }
    }

    async handleAchievementsEntertainment(interaction) {
        try {
            await interaction.reply({ content: '🎮 Entertainment achievements coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleAchievementsEntertainment:', error);
        }
    }

    async handleAchievementsProgress(interaction) {
        try {
            await interaction.reply({ content: '📊 Achievement progress coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleAchievementsProgress:', error);
        }
    }

    async handleAchievementsList(interaction) {
        try {
            await interaction.reply({ content: '📋 Achievement list coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleAchievementsList:', error);
        }
    }

    async handleAchievementsShowcaseMenu(interaction) {
        try {
            await interaction.reply({ content: '⭐ Achievement showcase coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleAchievementsShowcaseMenu:', error);
        }
    }

    async handleAchievementsTournaments(interaction) {
        try {
            await interaction.reply({ content: '🏅 Tournament achievements coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleAchievementsTournaments:', error);
        }
    }

    async handleInsuranceClaimGuide(interaction) {
        try {
            await interaction.reply({ content: '📋 Insurance claim guide coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleInsuranceClaimGuide:', error);
        }
    }

    async handleInsuranceStatus(interaction) {
        try {
            await interaction.reply({ content: '📊 Insurance status coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleInsuranceStatus:', error);
        }
    }

    async handleInsuranceClaimHistory(interaction) {
        try {
            await interaction.reply({ content: '📋 Insurance claim history coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleInsuranceClaimHistory:', error);
        }
    }

    async handleInsuranceBuyMenu(interaction) {
        try {
            await interaction.reply({ content: '🛡️ Insurance purchase coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleInsuranceBuyMenu:', error);
        }
    }

    async handleInsuranceRenew(interaction) {
        try {
            await interaction.reply({ content: '🔄 Insurance renewal coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleInsuranceRenew:', error);
        }
    }

    async handleInsuranceClaimMenu(interaction) {
        try {
            await interaction.reply({ content: '📋 Insurance claim filing coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleInsuranceClaimMenu:', error);
        }
    }

    async handleInsuranceCancel(interaction) {
        try {
            await interaction.reply({ content: '❌ Insurance cancellation coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleInsuranceCancel:', error);
        }
    }

    async handleChallengesClaimDaily(interaction) {
        try {
            await interaction.reply({ content: '💰 Daily challenge claiming coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleChallengesClaimDaily:', error);
        }
    }

    async handleChallengesWeekly(interaction) {
        try {
            await interaction.reply({ content: '📅 Weekly challenges coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleChallengesWeekly:', error);
        }
    }

    async handleChallengesProgress(interaction) {
        try {
            await interaction.reply({ content: '📊 Challenge progress coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleChallengesProgress:', error);
        }
    }

    async handleChallengesClaimWeekly(interaction) {
        try {
            await interaction.reply({ content: '💎 Weekly challenge claiming coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleChallengesClaimWeekly:', error);
        }
    }

    async handleChallengesDaily(interaction) {
        try {
            await interaction.reply({ content: '📅 Daily challenges coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleChallengesDaily:', error);
        }
    }

    async handleChallengesViewAll(interaction) {
        try {
            await interaction.reply({ content: '📋 All challenges view coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleChallengesViewAll:', error);
        }
    }

    async handleChallengesLeaderboard(interaction) {
        try {
            await interaction.reply({ content: '🏅 Challenge leaderboard coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleChallengesLeaderboard:', error);
        }
    }

    async handleStatisticsEconomy(interaction) {
        try {
            await interaction.reply({ content: '💰 Economy statistics coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleStatisticsEconomy:', error);
        }
    }

    async handleStatisticsEntertainment(interaction) {
        try {
            await interaction.reply({ content: '🎮 Entertainment statistics coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleStatisticsEntertainment:', error);
        }
    }

    async handleStatisticsSocial(interaction) {
        try {
            await interaction.reply({ content: '👥 Social statistics coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleStatisticsSocial:', error);
        }
    }

    async handleStatisticsAchievements(interaction) {
        try {
            await interaction.reply({ content: '🏆 Achievement statistics coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleStatisticsAchievements:', error);
        }
    }

    async handleLeaderboardsWealthRefresh(interaction) {
        try {
            await interaction.reply({ content: '🔄 Wealth leaderboard refresh coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleLeaderboardsWealthRefresh:', error);
        }
    }

    async handleLeaderboardsMyRank(interaction) {
        try {
            await interaction.reply({ content: '📊 Your rank view coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleLeaderboardsMyRank:', error);
        }
    }

    async handleLeaderboardsGlobal(interaction) {
        try {
            await interaction.reply({ content: '🌐 Global leaderboards coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleLeaderboardsGlobal:', error);
        }
    }

    async handleLeaderboardsEntertainmentSkill(interaction) {
        try {
            await interaction.reply({ content: '🎯 Skill leaderboard coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleLeaderboardsEntertainmentSkill:', error);
        }
    }

    async handleLeaderboardsEntertainmentWins(interaction) {
        try {
            await interaction.reply({ content: '🏆 Wins leaderboard coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleLeaderboardsEntertainmentWins:', error);
        }
    }

    async handleLeaderboardsSocialTraders(interaction) {
        try {
            await interaction.reply({ content: '🤝 Traders leaderboard coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleLeaderboardsSocialTraders:', error);
        }
    }

    async handleLeaderboardsSocialGifters(interaction) {
        try {
            await interaction.reply({ content: '🎁 Gifters leaderboard coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleLeaderboardsSocialGifters:', error);
        }
    }

    async handleLeaderboardsAchievementsCategory(interaction) {
        try {
            await interaction.reply({ content: '📂 Achievement categories coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleLeaderboardsAchievementsCategory:', error);
        }
    }

    async handleLeaderboardsAchievementsRarity(interaction) {
        try {
            await interaction.reply({ content: '💎 Achievement rarity coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleLeaderboardsAchievementsRarity:', error);
        }
    }

    async handleLeaderboardsStreaksCurrent(interaction) {
        try {
            await interaction.reply({ content: '🔥 Current streaks coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleLeaderboardsStreaksCurrent:', error);
        }
    }

    async handleLeaderboardsStreaksBest(interaction) {
        try {
            await interaction.reply({ content: '🏆 Best streaks coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleLeaderboardsStreaksBest:', error);
        }
    }

    async handleWalletInventory(interaction) {
        try {
            await interaction.reply({ content: '🎒 Wallet inventory coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleWalletInventory:', error);
        }
    }

    async handleWalletNotify(interaction) {
        try {
            await interaction.reply({ content: '🔔 Wallet notifications coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleWalletNotify:', error);
        }
    }

    async handleWalletLearnMore(interaction) {
        try {
            await interaction.reply({ content: '📚 Wallet information coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleWalletLearnMore:', error);
        }
    }

    async handleProfileView(interaction) {
        try {
            await interaction.reply({ content: '👤 Profile view coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleProfileView:', error);
        }
    }

    async handleInvestmentPortfolio(interaction) {
        try {
            await interaction.reply({ content: '📈 Investment portfolio coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleInvestmentPortfolio:', error);
        }
    }

    async handleMarketRefresh(interaction) {
        try {
            const marketCommand = require('../commands/admin/market');
            await interaction.deferUpdate();
            await marketCommand.handleStats(interaction);
        } catch (error) {
            console.error('Error in handleMarketRefresh:', error);
        }
    }

    async handleMarketChart(interaction) {
        try {
            const marketCommand = require('../commands/admin/market');
            await interaction.deferUpdate();
            await marketCommand.handleChart(interaction);
        } catch (error) {
            console.error('Error in handleMarketChart:', error);
        }
    }

    async handleMarketEvents(interaction) {
        try {
            const marketCommand = require('../commands/admin/market');
            await interaction.deferUpdate();
            await marketCommand.handleEvents(interaction);
        } catch (error) {
            console.error('Error in handleMarketEvents:', error);
        }
    }

    async handleShopBrowse(interaction) {
        try {
            await interaction.reply({ content: '🛍️ Shop browsing coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleShopBrowse:', error);
        }
    }

    async handleTradeHelpOffer(interaction) {
        try {
            await interaction.reply({ content: '🎁 Trade offer help coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleTradeHelpOffer:', error);
        }
    }

    async handleTradeHelpGuide(interaction) {
        try {
            await interaction.reply({ content: '📚 Trading guide coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleTradeHelpGuide:', error);
        }
    }

    async handleReportStatusCheck(interaction) {
        try {
            await interaction.reply({ content: '📋 Report status check coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleReportStatusCheck:', error);
        }
    }

    async handleReportAnother(interaction) {
        try {
            await interaction.reply({ content: '📝 Submit another report coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleReportAnother:', error);
        }
    }

    async handleGuildCreateNew(interaction) {
        try {
            await interaction.reply({ content: '⚔️ Guild creation coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleGuildCreateNew:', error);
        }
    }

    async handleGuildRefreshList(interaction) {
        try {
            await interaction.reply({ content: '🔄 Guild list refresh coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleGuildRefreshList:', error);
        }
    }

    async handleDaoVotePrompt(interaction) {
        try {
            await interaction.reply({ content: '🗳️ DAO voting coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleDaoVotePrompt:', error);
        }
    }

    async handleDaoCreatePrompt(interaction) {
        try {
            await interaction.reply({ content: '📝 DAO proposal creation coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleDaoCreatePrompt:', error);
        }
    }

    async handleDaoAllProposals(interaction) {
        try {
            await interaction.reply({ content: '🗳️ All DAO proposals coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleDaoAllProposals:', error);
        }
    }

    async handleInvestQuickBuy(interaction) {
        try {
            await interaction.reply({ content: '🚀 Quick investment coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleInvestQuickBuy:', error);
        }
    }

    async handleEntertainmentSkillAnalysis(interaction) {
        try {
            await interaction.reply({ content: '📊 Skill analysis coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleEntertainmentSkillAnalysis:', error);
        }
    }

    async handleEntertainmentHistory(interaction) {
        try {
            await interaction.reply({ content: '📋 Entertainment history coming soon!', ephemeral: true });
        } catch (error) {
            console.error('Error in handleEntertainmentHistory:', error);
        }
    }
}

module.exports = InteractionHandler;
