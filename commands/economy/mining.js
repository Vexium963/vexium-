const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mining')
        .setDescription('Mine VEX tokens using computational power and energy')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start mining VEX tokens')
                .addStringOption(option =>
                    option.setName('rig')
                        .setDescription('Mining rig to use')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Basic CPU', value: 'cpu_basic' },
                            { name: 'Advanced CPU', value: 'cpu_advanced' },
                            { name: 'GPU Miner', value: 'gpu_basic' },
                            { name: 'ASIC Miner', value: 'asic_basic' },
                            { name: 'Quantum Rig', value: 'quantum' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check your mining status and earnings'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('Claim your mined VEX tokens'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('upgrade')
                .setDescription('Upgrade your mining equipment'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('pool')
                .setDescription('View mining pool information')),
    
    cooldown: 5,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                miningExperience: userData.stats?.miningSessionsStarted || 0,
                totalMined: userData.stats?.totalMined || 0
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
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'start':
                return this.handleStart(interaction);
            case 'status':
                return this.handleStatus(interaction);
            case 'claim':
                return this.handleClaim(interaction);
            case 'upgrade':
                return this.handleUpgrade(interaction);
            case 'pool':
                return this.handlePool(interaction);
        }
    },
    
    async handleStart(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const rigType = interaction.options.getString('rig') || 'cpu_basic';
        const rig = constants.MINING_RIGS[rigType.toUpperCase()];
        
        if (!rig) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Invalid Mining Rig`)
                .setDescription('Please select a valid mining rig.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (!userData.inventory || !userData.inventory[rigType] || userData.inventory[rigType] < 1) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Mining Rig Required`)
                .setDescription(`You need a **${rig.name}** to start mining. Purchase one from the shop first.`)
                .addFields({
                    name: '🛒 Purchase Info',
                    value: `Use \`/shop buy ${rigType}\` to get this mining rig`,
                    inline: false
                })
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (userData.mining && userData.mining.isActive) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Already Mining`)
                .setDescription('You\'re already mining! Use `/mining status` to check your progress.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const energyCost = rig.energyCost;
        if (energyCost > userData.vexBalance) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Energy`)
                .setDescription(`You need $${energyCost.toFixed(2)} VEX for energy costs but only have $${userData.vexBalance.toFixed(2)}.`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(energyCost, 'mining_energy', false);
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Mining Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const burnAmount = energyCost * constants.TAX_SYSTEM.MINING.ENERGY_BURN_RATE;
        await user.burnVEX(burnAmount, 'mining_energy_burn');
        
        userData.mining = {
            isActive: true,
            rigType,
            startTime: Date.now(),
            energyPaid: energyCost,
            hashRate: rig.hashRate,
            efficiency: rig.efficiency
        };
        
        userData.stats.miningSessionsStarted = (userData.stats.miningSessionsStarted || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 500) + 100);
        const variableReward = Math.random() < 0.2 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', (Math.random() * 2 + 0.5).toFixed(3)) : null;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.MINING} ⚡ MINING EMPIRE ACTIVATED!`)
            .setDescription(`🚀 **Your ${rig.name} is now DOMINATING the blockchain!**\n\n${variableReward ? `${variableReward}\n` : ''}💎 **PASSIVE INCOME ACTIVATED** - Earn while you sleep!\n\n${fomoMessage}\n${socialProofMessage}`)
            .addFields(
                { name: '⚡ Hash Rate', value: `${rig.hashRate.toFixed(2)} TH/s`, inline: true },
                { name: '🔋 Energy Cost', value: `$${energyCost.toFixed(2)} VEX`, inline: true },
                { name: '📈 Efficiency', value: `${(rig.efficiency * 100).toFixed(1)}%`, inline: true },
                { name: '💰 Expected Hourly', value: `$${this.calculateHourlyRate(rig).toFixed(4)} VEX`, inline: true },
                { name: '⏰ Started', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                { name: '🔥 Energy Burned', value: `$${burnAmount.toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: '💡 Pro Tip: Higher tier rigs = EXPONENTIAL rewards!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleStatus(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.mining || !userData.mining.isActive) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.MINING} Mining Status`)
                .setDescription('You\'re not currently mining. Use `/mining start` to begin!')
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const mining = userData.mining;
        const rig = constants.MINING_RIGS[mining.rigType.toUpperCase()];
        const miningTime = Date.now() - mining.startTime;
        const hoursElapsed = miningTime / (1000 * 60 * 60);
        
        const minedAmount = this.calculateMinedAmount(rig, hoursElapsed);
        const difficulty = this.getCurrentDifficulty();
        const networkHashRate = this.getNetworkHashRate();
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.MINING} Mining Status`)
            .setDescription(`Your **${rig.name}** has been mining for ${this.formatDuration(miningTime)}`)
            .addFields(
                { name: '💎 VEX Mined', value: `${minedAmount.toFixed(6)} VEX`, inline: true },
                { name: '⚡ Hash Rate', value: `${mining.hashRate.toFixed(2)} TH/s`, inline: true },
                { name: '📈 Efficiency', value: `${(mining.efficiency * 100).toFixed(1)}%`, inline: true },
                { name: '🌐 Network Difficulty', value: difficulty.toLocaleString(), inline: true },
                { name: '🔗 Network Hash Rate', value: `${networkHashRate.toFixed(2)} PH/s`, inline: true },
                { name: '💰 Hourly Rate', value: `${this.calculateHourlyRate(rig).toFixed(4)} VEX/h`, inline: true }
            )
            .setColor(constants.COLORS.PRIMARY)
            .setTimestamp();
        
        if (minedAmount >= constants.MINING.MIN_CLAIM_AMOUNT) {
            embed.addFields({
                name: '✅ Ready to Claim',
                value: `You can claim your mined VEX using \`/mining claim\``,
                inline: false
            });
            
            const claimButton = new ButtonBuilder()
                .setCustomId(`mining_claim_${interaction.user.id}`)
                .setLabel('Claim VEX')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💎');
            
            const row = new ActionRowBuilder().addComponents(claimButton);
            
            await interaction.reply({ embeds: [embed], components: [row] });
        } else {
            embed.addFields({
                name: '⏳ Keep Mining',
                value: `Minimum claim amount: ${constants.MINING.MIN_CLAIM_AMOUNT} VEX`,
                inline: false
            });
            
            await interaction.reply({ embeds: [embed] });
        }
    },
    
    async handleClaim(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        if (!userData.mining || !userData.mining.isActive) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Not Mining`)
                .setDescription('You\'re not currently mining.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const mining = userData.mining;
        const rig = constants.MINING_RIGS[mining.rigType.toUpperCase()];
        const miningTime = Date.now() - mining.startTime;
        const hoursElapsed = miningTime / (1000 * 60 * 60);
        
        const minedAmount = this.calculateMinedAmount(rig, hoursElapsed);
        
        if (minedAmount < constants.MINING.MIN_CLAIM_AMOUNT) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Amount`)
                .setDescription(`You need at least ${constants.MINING.MIN_CLAIM_AMOUNT} VEX to claim. Currently mined: ${minedAmount.toFixed(6)} VEX`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const taxAmount = minedAmount * constants.TAX_SYSTEM.MINING.CLAIM_TAX_RATE;
        const netAmount = minedAmount - taxAmount;
        
        await user.addVEX(netAmount, 'mining_reward');
        await user.burnVEX(taxAmount, 'mining_tax');
        
        userData.mining.isActive = false;
        userData.mining.lastClaim = Date.now();
        userData.mining.totalMined = (userData.mining.totalMined || 0) + minedAmount;
        
        userData.stats.totalMined = (userData.stats.totalMined || 0) + minedAmount;
        userData.stats.miningClaims = (userData.stats.miningClaims || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} VEX Claimed!`)
            .setDescription(`Successfully claimed your mined VEX tokens!`)
            .addFields(
                { name: '💎 Total Mined', value: `${minedAmount.toFixed(6)} VEX`, inline: true },
                { name: '💸 Mining Tax', value: `${taxAmount.toFixed(6)} VEX`, inline: true },
                { name: '💰 Net Received', value: `${netAmount.toFixed(6)} VEX`, inline: true },
                { name: '⏰ Mining Duration', value: this.formatDuration(miningTime), inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true },
                { name: '📊 Total Lifetime Mined', value: `${userData.stats.totalMined.toFixed(6)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: 'Start mining again to continue earning!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handleUpgrade(interaction) {
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.MINING} Mining Rig Upgrades`)
            .setDescription('Upgrade your mining equipment for better efficiency and higher rewards!')
            .setColor(constants.COLORS.PRIMARY);
        
        for (const [rigId, rig] of Object.entries(constants.MINING_RIGS)) {
            const hourlyRate = this.calculateHourlyRate(rig);
            
            embed.addFields({
                name: `${rig.name}`,
                value: `**Hash Rate**: ${rig.hashRate.toFixed(2)} TH/s\n` +
                       `**Efficiency**: ${(rig.efficiency * 100).toFixed(1)}%\n` +
                       `**Energy Cost**: $${rig.energyCost.toFixed(2)} VEX\n` +
                       `**Hourly Rate**: ${hourlyRate.toFixed(4)} VEX/h\n` +
                       `**Price**: $${rig.price.toFixed(2)} VEX`,
                inline: true
            });
        }
        
        embed.setFooter({ text: 'Purchase mining rigs from /shop browse tools' });
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async handlePool(interaction) {
        const difficulty = this.getCurrentDifficulty();
        const networkHashRate = this.getNetworkHashRate();
        const blockReward = constants.MINING.BLOCK_REWARD;
        const avgBlockTime = constants.MINING.AVERAGE_BLOCK_TIME;
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.MINING} VEX Mining Pool`)
            .setDescription('Real-time network statistics and mining information')
            .addFields(
                { name: '🌐 Network Hash Rate', value: `${networkHashRate.toFixed(2)} PH/s`, inline: true },
                { name: '📊 Current Difficulty', value: difficulty.toLocaleString(), inline: true },
                { name: '💎 Block Reward', value: `${blockReward} VEX`, inline: true },
                { name: '⏰ Avg Block Time', value: `${avgBlockTime} minutes`, inline: true },
                { name: '👥 Active Miners', value: this.getActiveMinerCount().toLocaleString(), inline: true },
                { name: '🔥 Daily Burn Rate', value: `${this.getDailyBurnRate().toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.INFO)
            .setFooter({ text: 'Mining difficulty adjusts automatically based on network hash rate' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
    
    calculateMinedAmount(rig, hoursElapsed) {
        const baseRate = this.calculateHourlyRate(rig);
        const difficulty = this.getCurrentDifficulty();
        const difficultyMultiplier = 1000000 / difficulty;
        
        return baseRate * hoursElapsed * difficultyMultiplier * rig.efficiency;
    },
    
    calculateHourlyRate(rig) {
        const baseRate = constants.MINING.BASE_REWARD_RATE;
        const hashRateMultiplier = rig.hashRate / 100;
        
        return baseRate * hashRateMultiplier;
    },
    
    getCurrentDifficulty() {
        const baseTime = Date.now();
        const variation = Math.sin(baseTime / (1000 * 60 * 60 * 24)) * 0.3;
        return Math.floor(1000000 * (1 + variation));
    },
    
    getNetworkHashRate() {
        const baseTime = Date.now();
        const variation = Math.sin(baseTime / (1000 * 60 * 60 * 12)) * 0.2;
        return 500 * (1 + variation);
    },
    
    getActiveMinerCount() {
        return Math.floor(Math.random() * 5000) + 10000;
    },
    
    getDailyBurnRate() {
        return Math.random() * 1000 + 500;
    },
    
    formatDuration(milliseconds) {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }
};
