require('dotenv').config();
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const AutoHealingSystem = require('./utils/autoHealing');
const PerformanceMonitor = require('./utils/performanceMonitor');
const PsychologyEngine = require('./utils/psychologyEngine');
const ImmersionEngine = require('./utils/immersionEngine');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel],
});

client.commands = new Collection();
client.cooldowns = new Collection();

const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(__dirname, 'commands', folder, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} is online and ready!`);
    console.log(`🔗 Invite link: https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=274877906944&scope=bot%20applications.commands`);
    
    const autoHealing = new AutoHealingSystem();
    await autoHealing.initialize();
    client.autoHealing = autoHealing;
    
    const performanceMonitor = new PerformanceMonitor();
    performanceMonitor.startMonitoring();
    client.performanceMonitor = performanceMonitor;
    
    const psychologyEngine = new PsychologyEngine();
    client.psychologyEngine = psychologyEngine;
    
    const immersionEngine = new ImmersionEngine();
    client.immersionEngine = immersionEngine;
    
    performanceMonitor.on('performance-alert', (alert) => {
        console.warn('⚠️ Performance Alert:', alert);
        if (client.autoHealing) {
            client.autoHealing.recordRequest(0, true);
        }
    });
    
    immersionEngine.on('achievement-chain-completed', (chain) => {
        console.log(`🏆 Achievement chain completed for user ${chain.userId}`);
    });
    
    immersionEngine.on('milestone-celebration', (milestone) => {
        console.log(`🎉 Milestone celebration for user ${milestone.userId}: ${milestone.type}`);
    });
    
    console.log('🧠 Psychology Engine initialized - Ready for maximum user engagement!');
    console.log('🎮 Immersion Engine initialized - Creating addictive experiences!');
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

const gracefulShutdown = () => {
    console.log('Received shutdown signal, gracefully shutting down...');
    client.destroy();
    process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

client.login(process.env.DISCORD_TOKEN);
