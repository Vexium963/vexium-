const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('contracts')
        .setDescription(`✨ Create elite smart contracts and secure high-value deals! 🔥 Join the VEX trading elite!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription(`🚀 Create a new smart contract and join the elite traders!`)
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription(`📈 Choose your contract type - each unlocks different rewards!`)
                        .setRequired(true)
                        .addChoices(
                            { name: 'Escrow', value: 'escrow' },
                            { name: 'Payment Plan', value: 'payment' },
                            { name: 'Service Agreement', value: 'service' }
                        ))
                .addUserOption(option =>
                    option.setName('counterparty')
                        .setDescription(`🤝 Select your trading partner - build your network!`)
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription(`💸 Contract value in VEX - higher amounts = bigger rewards!`)
                        .setRequired(true)
                        .setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription(`📈 View your contract empire and track your deals!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('execute')
                .setDescription(`🎉 Execute and complete your contracts for instant rewards!`)
                .addStringOption(option =>
                    option.setName('contract_id')
                        .setDescription(`⏳ Enter contract ID to claim your rewards instantly!`)
                        .setRequired(true))),
    
    cooldown: 30,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        const subcommand = interaction.options.getSubcommand();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'contracts', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: (userData.stats.contractsCreated || 0) > 5,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                contractMastery: (userData.stats.contractsCompleted || 0) >= 10,
                highValueDeals: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'contracts',
                behaviorContext
            );
        }
        
        switch (subcommand) {
            case 'create':
                await this.handleCreate(interaction, user, userData);
                break;
            case 'list':
                await this.handleList(interaction, user, userData);
                break;
            case 'execute':
                await this.handleExecute(interaction, user, userData);
                break;
        }
    },
    
    async handleCreate(interaction, user, userData) {
        const type = interaction.options.getString('type');
        const counterparty = interaction.options.getUser('counterparty');
        const amount = interaction.options.getNumber('amount');
        
        const contractsCreated = userData.stats.contractsCreated || 0;
        const isContractExpert = contractsCreated >= 25;
        const isFirstContract = contractsCreated === 0;
        const isHighValueDeal = amount >= 1000;
        const urgencyBonus = Math.random() < 0.2 ? Math.floor(amount * 0.02) : 0;
        
        if (amount > userData.vexBalance) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Funds`)
                .setDescription(`🔥 **URGENT:** You need $${amount.toFixed(2)} VEX but only have $${userData.vexBalance.toFixed(2)}!\n\n${fomoMessage}\n\n🚀 **Quick Fix:** Use \`/work\` or \`/daily\` to earn more VEX!\n📈 **${Math.floor(Math.random() * 50) + 25} players** are creating contracts right now!`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const contractId = this.generateContractId();
        const contract = {
            id: contractId,
            type,
            creator: interaction.user.id,
            counterparty: counterparty.id,
            amount,
            status: 'pending',
            createdAt: Date.now(),
            terms: this.getContractTerms(type, amount)
        };
        
        await user.removeVEX(amount, 'contract_escrow', false);
        
        userData.contracts = userData.contracts || [];
        userData.contracts.push(contract);
        userData.stats.contractsCreated = (userData.stats.contractsCreated || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const socialProofMessage = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 75) + 25);
        const variableReward = urgencyBonus > 0 ? constants.VARIABLE_REWARDS[Math.floor(Math.random() * constants.VARIABLE_REWARDS.length)].replace('{amount}', urgencyBonus.toFixed(2)) : null;
        
        let title = `${constants.EMOJIS.SUCCESS} Contract Created`;
        let description = `📋 Smart contract created successfully!`;
        
        if (isContractExpert) {
            title = `👑 MASTER NEGOTIATOR! Contract Empire!`;
            description = `🏆 **LEGENDARY DEAL MAKER!** ${contractsCreated} contracts mastered!\n📋 **EXPERT CONTRACT** created with MAXIMUM efficiency!`;
        } else if (isFirstContract) {
            title = `🎉 FIRST CONTRACT! Welcome to Elite Deals!`;
            description = `🌟 **CONGRATULATIONS!** Your first smart contract is LIVE!\n🚀 **You're now part of the VEX elite trading community!**`;
        } else if (isHighValueDeal) {
            title = `💎 HIGH-VALUE DEAL! Elite Status!`;
            description = `🔥 **BIG MONEY MOVES!** $${amount.toFixed(2)} VEX contract created!\n👑 **You're playing in the major leagues now!**`;
        }
        
        if (variableReward) {
            description += `\n${variableReward}`;
        }
        
        description += `\n\n${socialProofMessage}`;
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const contractProgress = Math.min(contractsCreated / 50, 1);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Contract Mastery: ${contractsCreated} contracts created`,
            contractProgress,
            constants.COLORS.VEX
        );

        const embed = new EmbedBuilder()
            .setTitle(`✨ ${title.replace(/🎉|👑|💎|📋/, '')}`)
            .setDescription(description)
            .addFields(
                { name: '🆔 Contract ID', value: contractId, inline: true },
                { name: '📝 Type', value: type.charAt(0).toUpperCase() + type.slice(1), inline: true },
                { name: '👤 Counterparty', value: `<@${counterparty.id}>`, inline: true },
                { name: '💰 Amount', value: `$${amount.toFixed(2)} VEX`, inline: true },
                { name: '📊 Status', value: 'Pending Acceptance', inline: true },
                { name: '📜 Terms', value: contract.terms, inline: false }
            )
            .setColor(isContractExpert ? constants.COLORS.VEX : isHighValueDeal ? constants.COLORS.GOLD : constants.COLORS.SUCCESS)
            .setImage('attachment://progress.png')
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleList(interaction, user, userData) {
        const contracts = userData.contracts || [];
        const activeContracts = contracts.filter(c => c.status !== 'completed' && c.status !== 'cancelled');
        
        if (activeContracts.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.INFO} No Active Contracts`)
                .setDescription(`${constants.ANIMATED_EMOJIS.SPARKLES} **Ready to start your contract empire?**\n\n${constants.ANIMATED_EMOJIS.ROCKET} Create your first contract with \`/contracts create\`!\n${constants.ANIMATED_EMOJIS.FIRE} **${Math.floor(Math.random() * 100) + 50} players** have active contracts earning passive income!`)
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const totalValue = activeContracts.reduce((sum, c) => sum + c.amount, 0);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Active Contracts Value: $${totalValue.toFixed(2)} VEX`,
            Math.min(totalValue / 10000, 1),
            constants.COLORS.PRIMARY
        );

        const embed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.SPARKLES} Your Contracts`)
            .setDescription(`${constants.ANIMATED_EMOJIS.FIRE} **CONTRACT EMPIRE:** ${activeContracts.length} active deal(s) w...`)
            .addFields(
                activeContracts.slice(0, 10).map(contract => ({
                    name: `📋 ${contract.id}`,
                    value: `**Type:** ${contract.type}\n**Amount:** $${contract.amount.toFixed(2)} VEX\n**Status:** ${contract.status}\n**Created:** ${new Date(contract.createdAt).toLocaleDateString()}`,
                    inline: true
                }))
            )
            .setColor(constants.COLORS.PRIMARY)
            .setImage('attachment://progress.png')
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [embed],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleExecute(interaction, user, userData) {
        const contractId = interaction.options.getString('contract_id');
        const contracts = userData.contracts || [];
        const contract = contracts.find(c => c.id === contractId);
        
        if (!contract) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Contract Not Found`)
                .setDescription('The specified contract could not be found.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (contract.status !== 'active') {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Contract Not Active`)
                .setDescription('This contract is not in an active state.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        contract.status = 'completed';
        contract.completedAt = Date.now();
        
        await user.addVEX(contract.amount, 'contract_completion');
        
        userData.stats.contractsCompleted = (userData.stats.contractsCompleted || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const completionProgress = Math.min((userData.stats.contractsCompleted || 0) / 25, 1);
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Contracts Completed: ${userData.stats.contractsCompleted || 0}`,
            completionProgress,
            constants.COLORS.SUCCESS
        );

        const embed = new EmbedBuilder()
            .setTitle(`${constants.ANIMATED_EMOJIS.CELEBRATION} Contract Executed Successfully!`)
            .setDescription(`${constants.ANIMATED_EMOJIS.MONEY_RAIN} **DEAL COMPLETED!** Contract ${contractId} executed flawl...`)
            .addFields(
                { name: '💰 Amount Released', value: `$${contract.amount.toFixed(2)} VEX`, inline: true },
                { name: '📊 Status', value: 'Completed', inline: true },
                { name: '💼 New Balance', value: `$${userData.vexBalance.toFixed(2)} VEX`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setImage('attachment://progress.png')
            .setTimestamp();

        const actionButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('quick_daily')
                    .setLabel('Claim Daily')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('💰'),
                new ButtonBuilder()
                    .setCustomId('quick_work')
                    .setLabel('Work Now')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⚒️')
            );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [actionButtons],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    generateContractId() {
        return 'CONTRACT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    },
    
    getContractTerms(type, amount) {
        switch (type) {
            case 'escrow':
                return `Escrow agreement for $${amount.toFixed(2)} VEX. Funds held until both parties confirm completion.`;
            case 'payment':
                return `Payment plan for $${amount.toFixed(2)} VEX. Structured payment schedule with defined milestones.`;
            case 'service':
                return `Service agreement worth $${amount.toFixed(2)} VEX. Payment upon satisfactory service completion.`;
            default:
                return `Standard contract for $${amount.toFixed(2)} VEX with mutual agreement terms.`;
        }
    }
};
