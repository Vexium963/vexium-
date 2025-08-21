const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');
const Economics = require('../../utils/economics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dao')
        .setDescription(`✨ Shape VexiumVerse's future! Join the governance elite and earn exclusive democracy rewards!`)
        .addSubcommand(subcommand =>
            subcommand
                .setName('proposals')
                .setDescription(`🔥 View urgent proposals that need YOUR voice! Democracy rewards await!`))
        .addSubcommand(subcommand =>
            subcommand
                .setName('vote')
                .setDescription(`🚀 Cast your vote and shape the future! Elite voters get bonus rewards!`)
                .addStringOption(option =>
                    option.setName('proposal_id')
                        .setDescription('ID of the proposal to vote on')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('choice')
                        .setDescription('Your vote choice')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Yes - Support', value: 'yes' },
                            { name: 'No - Against', value: 'no' },
                            { name: 'Abstain', value: 'abstain' })))
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription(`🎉 Create proposals and lead the community! Early creators get 3x rewards!`)
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Proposal title')
                        .setRequired(true)
                        .setMaxLength(100))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Detailed proposal description')
                        .setRequired(true)
                        .setMaxLength(1000))
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('Proposal category')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Economy Changes', value: 'economy' },
                            { name: 'Feature Additions', value: 'features' },
                            { name: 'Community Rules', value: 'rules' },
                            { name: 'Technical Updates', value: 'technical' })))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delegate')
                .setDescription(`💓 Delegate your power to trusted leaders! Earn passive governance rewards!`)
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to delegate your voting power to')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription(`📈 See your democracy impact! Track your governance achievements and rewards!`)),
    
    cooldown: 10,
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        const subcommand = interaction.options.getSubcommand();
        
        if (interaction.client.immersionEngine) {
            interaction.client.immersionEngine.trackCommand(interaction.user.id, 'dao', true);
        }
        
        if (interaction.client.psychologyEngine) {
            const behaviorContext = {
                consecutiveUse: false,
                quickReturn: false,
                timeSinceLastUse: Date.now(),
                governanceEngagement: true,
                democraticParticipation: true
            };
            interaction.client.psychologyEngine.analyzeUserBehavior(
                interaction.user.id,
                'dao',
                behaviorContext
            );
        }
        
        const daoUsage = userData.stats?.daoVotes || 0;
        const isGovernanceNewbie = daoUsage === 0;
        const isGovernanceVeteran = daoUsage >= 20;
        const surpriseBonus = Math.random() < 0.1 ? Math.floor(Economics.getPeggedVEXPrice(userData.vexBalance * Economics.getCurrentVEXPrice() * 0.02)) : 0;
        
        if (isGovernanceNewbie && subcommand === 'proposals') {
            const welcomeEmbed = new EmbedBuilder()
                .setTitle(`🎉 WELCOME TO DEMOCRACY!`)
                .setDescription(`🎉 **${interaction.user.username}, you're about to shape VexiumVerse's future!**\n\n🔥 **Your voi...`)
                .addFields(
                    { name: '💎 Governance Benefits', value: '🏆 **Exclusive voter badges**\n💰 **Proposal rewards**\n👑 **Elite status recognition**\n🎁 **Democracy bonuses**', inline: true },
                    { name: '🔥 Active Now', value: `📊 **${Math.floor(Math.random() * 50) + 20} voters** participating\n⏰ **${Math.floor(Math.random() * 5) + 2} proposals** closing soon\n🚨 **Your input needed urgently!**`, inline: true }
                )
                .setColor(constants.COLORS.VEX)
                .setFooter({ text: '🌟 Democracy rewards those who participate!' });
            
            await interaction.followUp({ embeds: [welcomeEmbed], ephemeral: true });
        }
        
        if (surpriseBonus > 0) {
            await user.addVEX(surpriseBonus, 'governance_participation_bonus');
            Economics.updateVEXMarket('reward', surpriseBonus);
            const bonusEmbed = new EmbedBuilder()
                .setTitle(`✨ DEMOCRACY BONUS!`)
                .setDescription(`🎉 **Surprise reward for governance participation!**\n💸 **+${surpriseBonus} VEX** for being an active democracy participant!`)
                .setColor(constants.COLORS.SUCCESS);
            
            setTimeout(() => interaction.followUp({ embeds: [bonusEmbed], ephemeral: true }), 2000);
        }
        
        switch (subcommand) {
            case 'proposals':
                return this.handleProposals(interaction);
            case 'vote':
                return this.handleVote(interaction);
            case 'create':
                return this.handleCreate(interaction);
            case 'delegate':
                return this.handleDelegate(interaction);
            case 'stats':
                return this.handleStats(interaction);
        }
    },
    
    async handleProposals(interaction) {
        if (!global.daoProposals) global.daoProposals = this.getDefaultProposals();
        
        const activeProposals = global.daoProposals.filter(p => p.status === 'active');
        
        if (activeProposals.length === 0) {
            const fomoMessage = constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)];
            const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 30) + 15);
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.DAO} 🚨 DEMOCRACY AWAITS YOUR VOICE!`)
                .setDescription(`${constants.ANIMATED_EMOJIS.ROCKET} **BE THE FIRST TO SHAPE THE FUTURE!** Join the DAO...`)
                .addFields(
                    { name: '🗳️ How to Participate', value: 'Use `/dao create` to submit proposals\nRequires 1000 VEX stake', inline: false },
                    { name: '💡 Proposal Ideas', value: '• Economy adjustments\n• New features\n• Community rules\n• Technical improvements', inline: false }
                )
                .setColor(constants.COLORS.VEX);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const totalVoters = activeProposals.reduce((sum, p) => sum + p.voters.length, 0);
        const urgentProposals = activeProposals.filter(p => new Date(p.endsAt) - Date.now() < 24 * 60 * 60 * 1000);
        const isGovernanceElite = userData.stats?.daoVotes >= 10;
        
        let title = `${constants.EMOJIS.DAO} 🔥 GOVERNANCE POWER!`;
        let description = `⚡ **${activeProposals.length} ACTIVE PROPOSALS** need your voice!\n👥 **${totalVoters} community members** are participating!`;
        
        if (urgentProposals.length > 0) {
            title = `🚨 URGENT! DAO Proposals Closing Soon!`;
            description = `⏰ **${urgentProposals.length} proposals** end in 24 hours!\n🔥 **DON'T MISS YOUR CHANCE TO SHAPE THE FUTURE!**\n👥 **${totalVoters} voters** are already participating!`;
        }
        
        if (isGovernanceElite) {
            description += `\n👑 **GOVERNANCE ELITE STATUS** - You're a democracy champion!`;
        }
        
        const fomoTrigger = urgentProposals.length > 0 ? constants.FOMO_MESSAGES[Math.floor(Math.random() * constants.FOMO_MESSAGES.length)] : '';
        const socialValidation = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', totalVoters + Math.floor(Math.random() * 20));
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`${description}\n\n${fomoTrigger ? fomoTrigger + '\n' : ''}${socialValidation}`)
            .setColor(urgentProposals.length > 0 ? constants.COLORS.ERROR : constants.COLORS.VEX)
            .setFooter({ text: '🗳️ Your vote shapes VexiumVerse! Every voice matters!' });
        
        for (const proposal of activeProposals.slice(0, 5)) {
            const totalVotes = proposal.votes.yes + proposal.votes.no + proposal.votes.abstain;
            const yesPercent = totalVotes > 0 ? Math.round((proposal.votes.yes / totalVotes) * 100) : 0;
            
            embed.addFields({
                name: `📋 ${proposal.title}`,
                value: `**ID**: ${proposal.id}\n**Category**: ${proposal.category}\n**Votes**: ${totalVotes} (${yesPercent}% yes)\n**Ends**: <t:${Math.floor(new Date(proposal.endsAt).getTime() / 1000)}:R>`,
                inline: true
            });
        }
        
        const voteButton = new ButtonBuilder()
            .setCustomId('dao_vote_prompt')
            .setLabel('Cast Vote')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🗳️');
        
        const createButton = new ButtonBuilder()
            .setCustomId('dao_create_prompt')
            .setLabel('Create Proposal')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📝');
        
        const row = new ActionRowBuilder().addComponents(voteButton, createButton);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Active Proposals: ${activeProposals.length}`,
            Math.min(activeProposals.length / 10, 1.0),
            constants.COLORS.VEX
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleVote(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const proposalId = interaction.options.getString('proposal_id');
        const choice = interaction.options.getString('choice');
        
        if (!global.daoProposals) global.daoProposals = this.getDefaultProposals();
        
        const proposal = global.daoProposals.find(p => p.id === proposalId && p.status === 'active');
        if (!proposal) {
            const socialProof = constants.SOCIAL_PROOF[Math.floor(Math.random() * constants.SOCIAL_PROOF.length)].replace('{count}', Math.floor(Math.random() * 25) + 10);
            
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Proposal Not Found`)
                .setDescription(`No active proposal found with ID: ${proposalId}\n\nUse \`/dao proposals\` to see available proposals.\n\n${socialProof}`)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (new Date() > new Date(proposal.endsAt)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Voting Closed`)
                .setDescription('This proposal voting period has ended.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (proposal.voters.includes(interaction.user.id)) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Already Voted`)
                .setDescription('You have already voted on this proposal.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const votingPower = this.calculateVotingPower(userData);
        if (votingPower < 1) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Voting Power`)
                .setDescription('You need at least 100 VEX to participate in governance.\n\nEarn more VEX through daily rewards, work, and entertainment games!')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        proposal.votes[choice] += votingPower;
        proposal.voters.push(interaction.user.id);
        
        userData.stats.daoVotes = (userData.stats.daoVotes || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const totalVotes = proposal.votes.yes + proposal.votes.no + proposal.votes.abstain;
        const yesPercent = Math.round((proposal.votes.yes / totalVotes) * 100);
        const noPercent = Math.round((proposal.votes.no / totalVotes) * 100);
        const abstainPercent = Math.round((proposal.votes.abstain / totalVotes) * 100);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Vote Recorded!`)
            .setDescription(`Your vote on **${proposal.title}** has been recorded.`)
            .addFields(
                { name: '🗳️ Your Vote', value: choice.charAt(0).toUpperCase() + choice.slice(1), inline: true },
                { name: '⚡ Voting Power', value: `${votingPower} votes`, inline: true },
                { name: '📊 Current Results', value: `✅ Yes: ${yesPercent}%\n❌ No: ${noPercent}%\n⚪ Abstain: ${abstainPercent}%`, inline: false },
                { name: '📋 Proposal', value: proposal.description.slice(0, 200) + '...', inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `Proposal #${proposalId} • Voting ends ${new Date(proposal.endsAt).toLocaleDateString()}` })
            .setTimestamp();
        
        const viewButton = new ButtonBuilder()
            .setCustomId(`dao_view_${proposalId}`)
            .setLabel('View Proposal')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋');
        
        const proposalsButton = new ButtonBuilder()
            .setCustomId('dao_all_proposals')
            .setLabel('All Proposals')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🗳️');
        
        const row = new ActionRowBuilder().addComponents(viewButton, proposalsButton);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Vote Results: ${yesPercent}% Yes`,
            yesPercent / 100,
            constants.COLORS.SUCCESS
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    async handleCreate(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const category = interaction.options.getString('category');
        
        const requiredStake = 1000;
        
        if (userData.vexBalance < requiredStake) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Insufficient Stake`)
                .setDescription(`You need ${requiredStake} VEX (~$${(requiredStake * Economics.getCurrentVEXPrice()).toFixed(2)}) to create a proposal.\nYour balance: ${userData.vexBalance.toFixed(2)} VEX (~$${(userData.vexBalance * Economics.getCurrentVEXPrice()).toFixed(2)})`)
                .addFields(
                    { name: '💡 Why Staking?', value: 'Staking prevents spam and ensures serious proposals', inline: false },
                    { name: '💰 Stake Return', value: 'Your stake is returned when voting ends', inline: false }
                )
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await user.removeVEX(requiredStake, 'dao_proposal_stake');
        if (!result.success) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Staking Failed`)
                .setDescription(result.reason)
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        Economics.updateVEXMarket('stake', requiredStake);
        
        if (!global.daoProposals) global.daoProposals = [];
        
        const proposalId = this.generateProposalId();
        const proposal = {
            id: proposalId,
            title: title,
            description: description,
            category: category,
            creator: interaction.user.id,
            creatorName: interaction.user.displayName,
            stake: requiredStake,
            createdAt: new Date().toISOString(),
            endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            status: 'active',
            votes: { yes: 0, no: 0, abstain: 0 },
            voters: []
        };
        
        global.daoProposals.push(proposal);
        
        userData.stats.daoProposalsCreated = (userData.stats.daoProposalsCreated || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Proposal Created!`)
            .setDescription(`**${title}** is now live for community voting!`)
            .addFields(
                { name: '🆔 Proposal ID', value: proposalId, inline: true },
                { name: '📂 Category', value: category.charAt(0).toUpperCase() + category.slice(1), inline: true },
                { name: '💰 Stake', value: `${requiredStake.toFixed(2)} VEX (~$${(requiredStake * Economics.getCurrentVEXPrice()).toFixed(2)})`, inline: true },
                { name: '📝 Description', value: description, inline: false },
                { name: '⏰ Voting Period', value: '7 days from now', inline: true },
                { name: '🗳️ How to Vote', value: `/dao vote ${proposalId} <choice>`, inline: true }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `Proposal #${proposalId} • Stake will be returned when voting ends` })
            .setTimestamp();
        
        const shareButton = new ButtonBuilder()
            .setCustomId(`dao_share_${proposalId}`)
            .setLabel('Share Proposal')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📢');
        
        const viewButton = new ButtonBuilder()
            .setCustomId(`dao_view_${proposalId}`)
            .setLabel('View Details')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋');
        
        const row = new ActionRowBuilder().addComponents(shareButton, viewButton);
        
        const CanvasRenderer = require('../../utils/canvasRenderer');
        const canvasRenderer = new CanvasRenderer();
        const progressBuffer = await canvasRenderer.createAnimatedProgressBar(
            `Proposal Created Successfully`,
            1.0,
            constants.COLORS.SUCCESS
        );
        
        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            files: [{ attachment: progressBuffer, name: 'progress.png' }]
        });
    },
    
    calculateVotingPower(userData) {
        const baseVEX = userData.vexBalance + userData.bankBalance;
        return Math.floor(baseVEX / Economics.getPeggedVEXPrice(10)); // 1 vote per $10 worth of VEX
    },
    
    generateProposalId() {
        return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    },
    
    getDefaultProposals() {
        return [
            {
                id: '0001',
                title: 'Increase Daily Reward Caps',
                description: 'Proposal to increase maximum daily rewards from 5000 to 7500 VEX to help new players catch up faster.',
                category: 'economy',
                creator: 'system',
                creatorName: 'VexiumVerse Team',
                stake: 1000,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active',
                votes: { yes: 150, no: 45, abstain: 12 },
                voters: []
            },
            {
                id: '0002',
                title: 'Add Guild Tournament System',
                description: 'Implement monthly guild tournaments with VEX prizes and exclusive rewards for winning guilds.',
                category: 'features',
                creator: 'system',
                creatorName: 'Community Request',
                stake: 1000,
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                endsAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active',
                votes: { yes: 89, no: 23, abstain: 8 },
                voters: []
            }
        ];
    }
};
