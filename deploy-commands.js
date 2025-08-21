require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];

const commandCategories = {};
const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
    commandCategories[folder] = commandFiles.map(file => file.replace('.js', ''));
}

console.log('Discovered command categories:', Object.keys(commandCategories));
console.log('Total command files found:', Object.values(commandCategories).flat().length);

for (const [category, commandNames] of Object.entries(commandCategories)) {
    console.log(`\nProcessing category: ${category}`);
    for (const commandName of commandNames) {
        const filePath = path.join(__dirname, 'commands', category, `${commandName}.js`);
        if (fs.existsSync(filePath)) {
            try {
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                    console.log(`✅ Loaded: ${category}/${commandName}`);
                } else {
                    console.log(`❌ Invalid structure: ${category}/${commandName} - missing data or execute property`);
                }
            } catch (error) {
                console.log(`❌ Error loading ${category}/${commandName}:`, error.message);
            }
        } else {
            console.log(`❌ File not found: ${filePath}`);
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
