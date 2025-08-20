const { Collection } = require('discord.js');
const InteractionHandler = require('../handlers/interactionHandler');

const interactionHandler = new InteractionHandler();

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            const { cooldowns } = interaction.client;

            if (!cooldowns.has(command.data.name)) {
                cooldowns.set(command.data.name, new Collection());
            }

            const now = Date.now();
            const timestamps = cooldowns.get(command.data.name);
            const defaultCooldownDuration = 3;
            const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

                if (now < expirationTime) {
                    const expiredTimestamp = Math.round(expirationTime / 1000);
                    return interaction.reply({
                        content: `⏰ Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
                        ephemeral: true,
                    });
                }
            }

            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

            try {
                if (interaction.client.psychologyEngine) {
                    const behaviorContext = {
                        consecutiveUse: false,
                        quickReturn: false,
                        timeSinceLastUse: Date.now()
                    };
                    
                    interaction.client.psychologyEngine.analyzeUserBehavior(
                        interaction.user.id,
                        interaction.commandName,
                        behaviorContext
                    );
                }
                
                if (interaction.client.immersionEngine) {
                    interaction.client.immersionEngine.trackCommand(
                        interaction.user.id,
                        interaction.commandName,
                        true
                    );
                }
                
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}:`, error);
                
                const errorMessage = {
                    content: '❌ There was an error while executing this command!',
                    ephemeral: true,
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        } else if (interaction.isSelectMenu() || interaction.isButton()) {
            try {
                await interactionHandler.handleInteraction(interaction);
            } catch (error) {
                console.error(`Error handling interaction ${interaction.customId}:`, error);
                
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ There was an error while processing your interaction!',
                        ephemeral: true
                    });
                }
            }
        }
    },
};
