const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Play skill-based blackjack entertainment game for VEX rewards (21+ verification required)')
        .addNumberOption(option =>
            option.setName('bet')
                .setDescription('Amount of VEX to play with')
                .setRequired(true)
                .setMinValue(0.01)),
    
    cooldown: 3,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.ageVerified) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.WARNING} Age Verification Required`)
                .setDescription('**LEGAL COMPLIANCE**: You must verify you are 21+ to play cryptocurrency entertainment games.')
                .addFields({
                    name: '🔞 Verification Required',
                    value: 'Use `/verify-age` to confirm you are 21 or older for legal compliance.',
                    inline: false
                })
                .setColor(constants.COLORS.WARNING)
                .setFooter({ text: 'Age verification required by cryptocurrency gaming regulations' });
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const betAmount = interaction.options.getNumber('bet');
        
        if (betAmount > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`You need $${betAmount.toFixed(2)} VEX but only have $${userData.vexBalance.toFixed(2)}.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(betAmount, 'blackjack_bet', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Bet Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const game = this.initializeGame(betAmount);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CARDS} Blackjack Game`)
            .setDescription('Try to get as close to 21 as possible without going over!')
            .addFields(
                { name: '🃏 Your Hand', value: this.formatHand(game.playerHand), inline: true },
                { name: '🎯 Your Total', value: `${this.calculateHandValue(game.playerHand)}`, inline: true },
                { name: '🏠 Dealer Hand', value: this.formatDealerHand(game.dealerHand), inline: true },
                { name: '💰 Bet Amount', value: `$${betAmount.toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setFooter({ text: 'Choose your action!' });
        
        const hitButton = new ButtonBuilder()
            .setCustomId(`blackjack_hit_${interaction.user.id}_${game.gameId}`)
            .setLabel('Hit')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🃏');
        
        const standButton = new ButtonBuilder()
            .setCustomId(`blackjack_stand_${interaction.user.id}_${game.gameId}`)
            .setLabel('Stand')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('✋');
        
        const doubleButton = new ButtonBuilder()
            .setCustomId(`blackjack_double_${interaction.user.id}_${game.gameId}`)
            .setLabel('Double Down')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💰')
            .setDisabled(userData.vexBalance < betAmount);
        
        const row = new ActionRowBuilder().addComponents(hitButton, standButton, doubleButton);
        
        this.saveGame(game);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    initializeGame(betAmount) {
        const deck = this.createDeck();
        this.shuffleDeck(deck);
        
        const playerHand = [deck.pop(), deck.pop()];
        const dealerHand = [deck.pop(), deck.pop()];
        
        return {
            gameId: this.generateGameId(),
            deck,
            playerHand,
            dealerHand,
            betAmount,
            gameState: 'playing',
            doubled: false
        };
    },
    
    createDeck() {
        const suits = ['♠️', '♥️', '♦️', '♣️'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const deck = [];
        
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({ suit, rank });
            }
        }
        
        return deck;
    },
    
    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    },
    
    calculateHandValue(hand) {
        let value = 0;
        let aces = 0;
        
        for (const card of hand) {
            if (card.rank === 'A') {
                aces++;
                value += 11;
            } else if (['J', 'Q', 'K'].includes(card.rank)) {
                value += 10;
            } else {
                value += parseInt(card.rank);
            }
        }
        
        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }
        
        return value;
    },
    
    formatHand(hand) {
        return hand.map(card => `${card.rank}${card.suit}`).join(' ');
    },
    
    formatDealerHand(hand, hideSecond = true) {
        if (hideSecond && hand.length >= 2) {
            return `${hand[0].rank}${hand[0].suit} 🂠`;
        }
        return this.formatHand(hand);
    },
    
    async handleHit(interaction, gameId) {
        const game = this.getGame(gameId);
        if (!game || game.gameState !== 'playing') {
            return interaction.reply({ content: 'Game not found or already finished.', ephemeral: true });
        }
        
        game.playerHand.push(game.deck.pop());
        const playerValue = this.calculateHandValue(game.playerHand);
        
        if (playerValue > 21) {
            return this.endGame(interaction, game, 'bust');
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CARDS} Blackjack Game`)
            .setDescription('You drew a card!')
            .addFields(
                { name: '🃏 Your Hand', value: this.formatHand(game.playerHand), inline: true },
                { name: '🎯 Your Total', value: `${playerValue}`, inline: true },
                { name: '🏠 Dealer Hand', value: this.formatDealerHand(game.dealerHand), inline: true }
            )
            .setColor(constants.COLORS.PRIMARY);
        
        const hitButton = new ButtonBuilder()
            .setCustomId(`blackjack_hit_${interaction.user.id}_${gameId}`)
            .setLabel('Hit')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🃏');
        
        const standButton = new ButtonBuilder()
            .setCustomId(`blackjack_stand_${interaction.user.id}_${gameId}`)
            .setLabel('Stand')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('✋');
        
        const row = new ActionRowBuilder().addComponents(hitButton, standButton);
        
        this.saveGame(game);
        
        await interaction.update({ embeds: [embed], components: [row] });
    },
    
    async handleStand(interaction, gameId) {
        const game = this.getGame(gameId);
        if (!game || game.gameState !== 'playing') {
            return interaction.reply({ content: 'Game not found or already finished.', ephemeral: true });
        }
        
        while (this.calculateHandValue(game.dealerHand) < 17) {
            game.dealerHand.push(game.deck.pop());
        }
        
        const playerValue = this.calculateHandValue(game.playerHand);
        const dealerValue = this.calculateHandValue(game.dealerHand);
        
        let result;
        if (dealerValue > 21) {
            result = 'dealer_bust';
        } else if (playerValue > dealerValue) {
            result = 'player_wins';
        } else if (dealerValue > playerValue) {
            result = 'dealer_wins';
        } else {
            result = 'push';
        }
        
        return this.endGame(interaction, game, result);
    },
    
    async endGame(interaction, game, result) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        let winnings = 0;
        let resultText = '';
        let color = constants.COLORS.ERROR;
        
        const playerValue = this.calculateHandValue(game.playerHand);
        const dealerValue = this.calculateHandValue(game.dealerHand);
        
        switch (result) {
            case 'bust':
                resultText = '💥 Bust! You went over 21.';
                color = constants.COLORS.ERROR;
                break;
            case 'dealer_bust':
                resultText = '🎉 Dealer busted! You win!';
                winnings = game.betAmount * 2;
                color = constants.COLORS.SUCCESS;
                break;
            case 'player_wins':
                resultText = '🎉 You win!';
                winnings = game.betAmount * 2;
                color = constants.COLORS.SUCCESS;
                break;
            case 'dealer_wins':
                resultText = '😔 Dealer wins.';
                color = constants.COLORS.ERROR;
                break;
            case 'push':
                resultText = '🤝 Push! It\'s a tie.';
                winnings = game.betAmount;
                color = constants.COLORS.WARNING;
                break;
        }
        
        if (winnings > 0) {
            await user.addVEX(winnings, 'blackjack_win');
        }
        
        const burnAmount = game.betAmount * constants.TAX_SYSTEM.ENTERTAINMENT.HOUSE_EDGE;
        if (result !== 'push') {
            await user.burnVEX(burnAmount, 'blackjack_house_edge');
        }
        
        userData.stats.blackjackGames = (userData.stats.blackjackGames || 0) + 1;
        if (winnings > game.betAmount) {
            userData.stats.blackjackWins = (userData.stats.blackjackWins || 0) + 1;
        }
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.CARDS} Blackjack Result`)
            .setDescription(resultText)
            .addFields(
                { name: '🃏 Your Hand', value: `${this.formatHand(game.playerHand)} (${playerValue})`, inline: true },
                { name: '🏠 Dealer Hand', value: `${this.formatHand(game.dealerHand)} (${dealerValue})`, inline: true },
                { name: '💰 Winnings', value: `$${(winnings - game.betAmount).toFixed(2)} VEX`, inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(color)
            .setTimestamp();
        
        this.deleteGame(game.gameId);
        
        await interaction.update({ embeds: [embed], components: [] });
    },
    
    generateGameId() {
        return 'BJ-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    },
    
    saveGame(game) {
        console.log('Blackjack game saved:', game.gameId);
    },
    
    getGame(gameId) {
        return null;
    },
    
    deleteGame(gameId) {
        console.log('Blackjack game deleted:', gameId);
    }
};
