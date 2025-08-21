const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lottery')
        .setDescription(`💸 Participate in the weekly VEX lottery for massive prizes! 🔥`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription(`✨ View current lottery information and prizes - Don't miss out!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription(`🪙 Purchase lottery tickets - Your fortune awaits!`)
                .addIntegerOption(option =>
                    option.setName('tickets')
                        .setDescription('Number of tickets to purchase (1-10)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(10)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('tickets')
                .setDescription(`🎉 View your lottery tickets for this week - Check your winning chances!`)),
    
    cooldown: 5,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        const subcommand = interaction.options.getSubcommand();
        
        const lotteryUsage = userData.stats.lotteryTicketsBought || 0;
        const isLotteryVeteran = lotteryUsage >= 50;
        const isLotteryNovice = lotteryUsage < 5;
        const recentWins = userData.stats.lotteryWins || 0;
        const hasWonBefore = recentWins > 0;
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                lotteryAddiction: lotteryUsage >= 20,
                winStreak: hasWonBefore,
                gamblingTendency: true
            };
            
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'lottery',
                behaviorContext
            );
        }
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(
                interaction.user.id,
                'lottery',
                true
            );
        }
        
        switch (subcommand) {
            case 'info':
                return this.handleInfo(interaction);
            case 'buy':
                return this.handleBuy(interaction);
            case 'tickets':
                return this.handleTickets(interaction);
        }
    },
    
    async handleInfo(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        const lotteryData = this.getCurrentLottery();
        
        const timeUntilDraw = lotteryData.drawTime * 1000 - Date.now();
        const hoursLeft = Math.floor(timeUntilDraw / (1000 * 60 * 60));
        const isUrgent = hoursLeft <= 24;
        const jackpotGrowth = Math.floor(Math.random() * 500) + 100;
        const activeParticipants = Math.floor(Math.random() * 200) + 150;
        
        let title = `${constants.EMOJIS.LOTTERY} MASSIVE JACKPOT ALERT!`;
        let description = `💎 **$${lotteryData.jackpot.toFixed(2)} VEX JACKPOT** - Life-changing money awaits!\n🔥 **${activeParticipants} players competing RIGHT NOW!**`;
        
        if (isUrgent) {
            title = `🚨 URGENT: ${hoursLeft}H LEFT TO WIN!`;
            description = `⏰ **FINAL HOURS!** Jackpot closes in ${hoursLeft} hours!\n💰 **$${lotteryData.jackpot.toFixed(2)} VEX** could be YOURS!\n🏃‍♂️ **Don't miss your chance at financial freedom!**`;
        }
        
        const lotteryUsage = userData.stats.lotteryTicketsBought || 0;
        if (lotteryUsage >= 10) {
            description += `\n👑 **VIP PLAYER DETECTED!** ${lotteryUsage} tickets purchased - you're a lottery legend!`;
        } else if (lotteryUsage === 0) {
            description += `\n🌟 **FIRST TIME?** This could be your lucky break into wealth!`;
        }
        
        const surpriseBonus = Math.random() < 0.2 ? Math.floor(lotteryData.jackpot * 0.1) : 0;
        if (surpriseBonus > 0) {
            description += `\n✨ **SURPRISE JACKPOT BOOST: +$${surpriseBonus} VEX!**`;
        }
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', activeParticipants);
        const variableReward = Math.random() < 0.15 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 50 + 10).toFixed(2)) : null;
        
        if (variableReward) {
            description += `\n${variableReward}`;
        }
        description += `\n\n${fomoMessage}\n${socialProofMessage}`;
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`🔥 ${description} 💸\n\n🚨 **FOMO ALERT:** Every minute you wait, someone else could claim YOUR j...`)
            .setColor(isUrgent ? constants.COLORS.ERROR : constants.COLORS.GOLD)
            .addFields(
                { name: '🎯 Current Jackpot', value: `$${lotteryData.jackpot.toFixed(2)} VEX`, inline: true },
                { name: '🎫 Ticket Price', value: `$${constants.LOTTERY.TICKET_PRICE.toFixed(2)} VEX`, inline: true },
                { name: '📊 Tickets Sold', value: `${lotteryData.ticketsSold}`, inline: true },
                { name: '⏰ Draw Time', value: `<t:${lotteryData.drawTime}:F>`, inline: false },
                { name: '🏆 Prize Distribution', value: this.getPrizeDistribution(lotteryData.jackpot), inline: false },
                { name: '🎲 Odds', value: this.getOddsInfo(), inline: false }
            )
            .setFooter({ text: 'Good luck! Draw happens every Sunday at 8 PM UTC' })
            .setTimestamp();
        
        const buyButton = new ButtonBuilder()
            .setCustomId(`lottery_buy_${interaction.user.id}`)
            .setLabel('Buy Tickets')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎫');
        
        const row = new ActionRowBuilder().addComponents(buyButton);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const jackpotProgress = Math.min(lotteryData.jackpot / 10000, 1);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Jackpot Growth: $${lotteryData.jackpot.toFixed(2)} VEX`,
            jackpotProgress,
            constants.COLORS.GOLD
        );

        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleBuy(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const ticketCount = interaction.options.getInteger('tickets');
        const totalCost = ticketCount * constants.LOTTERY.TICKET_PRICE;
        
        if (totalCost > userData.vexBalance) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`⏳ You need $${totalCost.toFixed(2)} VEX but only have $${userData.vexBalance.toFixed(2)}.\n\n${fomoMessage}\n\n🚀 **Quick Fix:** Use \`/work\` or \`/daily\` to earn more VEX!\n\n⚠️ **WARNING:** While you're earning, others are buying YOUR winning tickets!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const lotteryWeek = this.getCurrentWeek();
        const userTickets = userData.lotteryTickets?.[lotteryWeek] || [];
        
        if (userTickets.length + ticketCount > constants.LOTTERY.MAX_TICKETS_PER_USER) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Ticket Limit Exceeded`)
                .setDescription(`💥 You can only buy ${constants.LOTTERY.MAX_TICKETS_PER_USER} tickets per week. You currently hav...`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(totalCost, 'lottery_tickets', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Purchase Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const burnAmount = totalCost * constants.TAX_SYSTEM.LOTTERY.BURN_RATE;
        await user.burnVEX(burnAmount, 'lottery_tax');
        
        if (!userData.lotteryTickets) userData.lotteryTickets = {};
        if (!userData.lotteryTickets[lotteryWeek]) userData.lotteryTickets[lotteryWeek] = [];
        
        const newTickets = [];
        for (let i = 0; i < ticketCount; i++) {
            const ticketNumber = this.generateTicketNumber();
            userData.lotteryTickets[lotteryWeek].push(ticketNumber);
            newTickets.push(ticketNumber);
        }
        
        userData.stats.lotteryTicketsBought = (userData.stats.lotteryTicketsBought || 0) + ticketCount;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const milestoneMessage = userData.stats.lotteryTicketsBought >= 25 ? constants.MILESTONE_MESSAGES[Math.floor(Math.random() * constants.MILESTONE_MESSAGES.length)] : null;
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 100) + 50);
        
        let description = `You bought ${ticketCount} lottery ticket${ticketCount > 1 ? 's' : ''}! 🎫✨`;
        if (milestoneMessage) {
            description += `\n\n${milestoneMessage}`;
        }
        description += `\n${socialProofMessage}`;
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const lotteryProgress = Math.min(userData.stats.lotteryTicketsBought / 50, 1);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Lottery Experience: ${userData.stats.lotteryTicketsBought} tickets bought`,
            lotteryProgress,
            constants.COLORS.GOLD
        );

        const embed = new EmbedBuilder()
            .setTitle(`🎉 Lottery Tickets Purchased!`)
            .setDescription(`🎉 ${description}\n\n🔥 **You're now in the running for LIFE-CHANGING money!** 💸\n\n📈 **Social ...`)
            .addFields(
                { name: '🎫 Your Tickets', value: newTickets.join(', '), inline: false },
                { name: '💰 Total Cost', value: `$${totalCost.toFixed(2)} VEX`, inline: true },
                { name: '🔥 Burned', value: `$${burnAmount.toFixed(2)} VEX`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '📊 Total Tickets This Week', value: `${userData.lotteryTickets[lotteryWeek].length}`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setImage('attachment://progress.png')
            .setFooter({ text: 'Good luck in the draw! Check back Sunday for results.' })
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleTickets(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const lotteryWeek = this.getCurrentWeek();
        const userTickets = userData.lotteryTickets?.[lotteryWeek] || [];
        
        if (userTickets.length === 0) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 200) + 100);
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.LOTTERY} Your Lottery Tickets`)
                .setDescription(`${constants.ANIMATED_EMOJIS.LOADING} You don't have any tickets for this week's lottery. Use \`/lottery buy\` to purchase tickets!\n\n${fomoMessage}\n${socialProofMessage}\n\n🚨 **URGENT:** The jackpot is growing every minute - don't let others claim what could be yours! ${constants.ANIMATED_EMOJIS.FIRE}`)
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const lotteryData = this.getCurrentLottery();
        const winChance = (userTickets.length / Math.max(lotteryData.ticketsSold, 1)) * 100;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.LOTTERY} Your Lottery Tickets`)
            .setDescription(`${constants.ANIMATED_EMOJIS.SPARKLES} You have ${userTickets.length} ticket${userTickets.length >...`)
            .addFields(
                { name: '🎫 Your Tickets', value: userTickets.join(', '), inline: false },
                { name: '🎯 Win Chance', value: `${winChance.toFixed(3)}%`, inline: true },
                { name: '🏆 Potential Prize', value: `Up to $${lotteryData.jackpot.toFixed(2)} VEX`, inline: true },
                { name: '⏰ Draw Time', value: `<t:${lotteryData.drawTime}:R>`, inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setFooter({ text: 'May the odds be ever in your favor!' })
            .setTimestamp();
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const ticketProgress = Math.min(userTickets.length / 10, 1);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Your Tickets: ${userTickets.length} tickets`,
            ticketProgress,
            constants.COLORS.PRIMARY
        );

        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    getCurrentLottery() {
        const now = Date.now();
        const weekStart = this.getWeekStart(now);
        const drawTime = weekStart + (6 * 24 * 60 * 60 * 1000) + (20 * 60 * 60 * 1000);
        
        const baseJackpot = constants.LOTTERY.BASE_JACKPOT;
        const ticketsSold = Math.floor(Math.random() * 1000) + 500;
        const jackpot = baseJackpot + (ticketsSold * constants.LOTTERY.TICKET_PRICE * 0.7);
        
        return {
            jackpot,
            ticketsSold,
            drawTime: Math.floor(drawTime / 1000)
        };
    },
    
    getCurrentWeek() {
        const now = new Date();
        const weekStart = this.getWeekStart(now.getTime());
        return Math.floor(weekStart / (7 * 24 * 60 * 60 * 1000));
    },
    
    getWeekStart(timestamp) {
        const date = new Date(timestamp);
        const day = date.getUTCDay();
        const diff = date.getUTCDate() - day;
        const weekStart = new Date(date.setUTCDate(diff));
        weekStart.setUTCHours(0, 0, 0, 0);
        return weekStart.getTime();
    },
    
    generateTicketNumber() {
        return Math.floor(Math.random() * 999999) + 1;
    },
    
    getPrizeDistribution(jackpot) {
        const first = jackpot * 0.5;
        const second = jackpot * 0.3;
        const third = jackpot * 0.2;
        
        return `🥇 1st Place: $${first.toFixed(2)} VEX\n🥈 2nd Place: $${second.toFixed(2)} VEX\n🥉 3rd Place: $${third.toFixed(2)} VEX`;
    },
    
    getOddsInfo() {
        return `🎲 Odds depend on total tickets sold\n🎫 More tickets = better chances\n🏆 3 winners drawn each week`;
    }
};
