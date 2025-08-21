module.exports.route = async (interaction, handlers) => {
    const sub = interaction.options.getSubcommand(false) || 'default';
    if (!handlers[sub]) return handlers._fallback?.(interaction);
    return handlers[sub](interaction);
};
