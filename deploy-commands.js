require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandCategories = {
    'economy': ['start', 'daily', 'work', 'wallet', 'invest', 'shop', 'trade', 'linkwallet', 'use', 'auction', 'banking', 'bonds', 'contracts', 'crafting', 'crypto', 'insurance', 'lottery', 'marketplace', 'mining', 'nft-mint', 'nft-trade', 'pets', 'prestige', 'quests', 'real-estate', 'referral', 'rewards', 'staking', 'stocks', 'tournaments'],
    'entertainment': ['blackjack', 'crash', 'poker', 'roulette'],
    'bank': ['deposit', 'withdraw', 'balance', 'history', 'interest'],
    'social': ['profile', 'leaderboard', 'gift', 'friends', 'guild', 'competitions', 'duel', 'events'],
    'progression': ['achievements', 'challenges', 'progression', 'xp'],
    'customization': ['avatar'],
    'utility': ['help', 'settings', 'analytics', 'immersion', 'leaderboards', 'verify-age', 'ping'],
    'admin': ['manage', 'logs', 'dao', 'performance']
};

for (const [category, commandNames] of Object.entries(commandCategories)) {
    for (const commandName of commandNames) {
        const filePath = path.join(__dirname, 'commands', category, `${commandName}.js`);
        if (fs.existsSync(filePath)) {
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        let data;
        if (process.env.GUILD_ID) {
            data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands },
            );
            console.log(`Successfully reloaded ${data.length} guild application (/) commands.`);
        } else {
            data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
            console.log(`Successfully reloaded ${data.length} global application (/) commands.`);
        }
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
})();
