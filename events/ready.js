module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`✅ VexiumVerse Bot is online!`);
        console.log(`🤖 Logged in as ${client.user.tag}`);
        console.log(`🌐 Serving ${client.guilds.cache.size} servers`);
        console.log(`👥 Watching ${client.users.cache.size} users`);
        
        client.user.setActivity('VexiumVerse Economy | /start', { type: 'PLAYING' });
        
        const startTime = Date.now();
        console.log(`⏰ Bot started at ${new Date(startTime).toISOString()}`);
    },
};
