const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dao')
        .setDescription('Participate in VexiumVerse DAO governance and voting')
        .addSubcommand(subcommand =>
            subcommand
                .setName('proposals')
                .setDescription('View active governance proposals'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('vote')
                .setDescription('Vote on a governance proposal')
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
                .setDescription('Create a new governance proposal (requires 1000 VEX stake)')
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
                .setDescription('Delegate your voting power to another user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to delegate your voting power to')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View DAO participation statistics')),
    
    cooldown: 10,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
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
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.DAO} DAO Governance`)
                .setDescription('No active proposals at this time.\n\nCreate a proposal to get the community involved!')
                .addFields(
                    { name: '🗳️ How to Participate', value: 'Use `/dao create` to submit proposals\nRequires 1000 VEX stake', inline: false },
                    { name: '💡 Proposal Ideas', value: '• Economy adjustments\n• New features\n• Community rules\n• Technical improvements', inline: false }
                )
                .setColor(constants.COLORS.INFO);
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.DAO} Active DAO Proposals`)
            .setDescription(`**${activeProposals.length}** proposals need your vote!`)
            .setColor(constants.COLORS.PRIMARY)
            .setFooter({ text: 'Use /dao vote <proposal_id> <choice> to participate' });
        
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
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleVote(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const proposalId = interaction.options.getString('proposal_id');
        const choice = interaction.options.getString('choice');
        
        if (!global.daoProposals) global.daoProposals = this.getDefaultProposals();
        
        const proposal = global.daoProposals.find(p => p.id === proposalId && p.status === 'active');
        if (!proposal) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Proposal Not Found`)
                .setDescription(`No active proposal found with ID: ${proposalId}\n\nUse \`/dao proposals\` to see available proposals.`)
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
        
        await interaction.reply({ embeds: [embed], components: [row] });
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
                .setDescription(`You need ${requiredStake} VEX to create a proposal.\nYour balance: $${userData.vexBalance.toFixed(2)} VEX`)
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
                { name: '💰 Stake', value: `$${requiredStake.toFixed(2)} VEX`, inline: true },
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
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    calculateVotingPower(userData) {
        const baseVEX = userData.vexBalance + userData.bankBalance;
        return Math.floor(baseVEX / 100); // 1 vote per 100 VEX
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
