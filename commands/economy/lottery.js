const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lottery')
        .setDescription('Participate in the weekly VEX lottery for massive prizes!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('View current lottery information and prizes'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Purchase lottery tickets')
                .addIntegerOption(option =>
                    option.setName('tickets')
                        .setDescription('Number of tickets to purchase (1-10)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(10)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('tickets')
                .setDescription('View your lottery tickets for this week')),
    
    cooldown: 5,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
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
        const lotteryData = this.getCurrentLottery();
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.LOTTERY} Weekly VEX Lottery`)
            .setDescription('Win massive VEX prizes in our weekly lottery draw!')
            .setColor(constants.COLORS.GOLD)
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
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleBuy(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const ticketCount = interaction.options.getInteger('tickets');
        const totalCost = ticketCount * constants.LOTTERY.TICKET_PRICE;
        
        if (totalCost > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`You need $${totalCost.toFixed(2)} VEX but only have $${userData.vexBalance.toFixed(2)}.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const lotteryWeek = this.getCurrentWeek();
        const userTickets = userData.lotteryTickets?.[lotteryWeek] || [];
        
        if (userTickets.length + ticketCount > constants.LOTTERY.MAX_TICKETS_PER_USER) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Ticket Limit Exceeded`)
                .setDescription(`You can only buy ${constants.LOTTERY.MAX_TICKETS_PER_USER} tickets per week. You currently have ${userTickets.length} tickets.`)
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
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Lottery Tickets Purchased!`)
            .setDescription(`You bought ${ticketCount} lottery ticket${ticketCount > 1 ? 's' : ''}!`)
            .addFields(
                { name: '🎫 Your Tickets', value: newTickets.join(', '), inline: false },
                { name: '💰 Total Cost', value: `$${totalCost.toFixed(2)} VEX`, inline: true },
                { name: '🔥 Burned', value: `$${burnAmount.toFixed(2)} VEX`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '📊 Total Tickets This Week', value: `${userData.lotteryTickets[lotteryWeek].length}`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Good luck in the draw! Check back Sunday for results.' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleTickets(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const lotteryWeek = this.getCurrentWeek();
        const userTickets = userData.lotteryTickets?.[lotteryWeek] || [];
        
        if (userTickets.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.LOTTERY} Your Lottery Tickets`)
                .setDescription('You don\'t have any tickets for this week\'s lottery. Use `/lottery buy` to purchase tickets!')
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const lotteryData = this.getCurrentLottery();
        const winChance = (userTickets.length / Math.max(lotteryData.ticketsSold, 1)) * 100;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.LOTTERY} Your Lottery Tickets`)
            .setDescription(`You have ${userTickets.length} ticket${userTickets.length > 1 ? 's' : ''} for this week's lottery!`)
            .addFields(
                { name: '🎫 Your Tickets', value: userTickets.join(', '), inline: false },
                { name: '🎯 Win Chance', value: `${winChance.toFixed(3)}%`, inline: true },
                { name: '🏆 Potential Prize', value: `Up to $${lotteryData.jackpot.toFixed(2)} VEX`, inline: true },
                { name: '⏰ Draw Time', value: `<t:${lotteryData.drawTime}:R>`, inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setFooter({ text: 'May the odds be ever in your favor!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
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
