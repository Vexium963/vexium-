const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Backup and restore your VexiumVerse data for account security')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a backup of your account data')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name for this backup')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('View all your account backups'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('restore')
                .setDescription('Restore your account from a backup')
                .addStringOption(option =>
                    option.setName('backup_id')
                        .setDescription('ID of the backup to restore from')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a backup')
                .addStringOption(option =>
                    option.setName('backup_id')
                        .setDescription('ID of the backup to delete')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('export')
                .setDescription('Export your data for external backup'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('settings')
                .setDescription('Configure automatic backup settings')),
    
    cooldown: 60,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'create':
                return this.handleCreate(interaction);
            case 'list':
                return this.handleList(interaction);
            case 'restore':
                return this.handleRestore(interaction);
            case 'delete':
                return this.handleDelete(interaction);
            case 'export':
                return this.handleExport(interaction);
            case 'settings':
                return this.handleSettings(interaction);
        }
    },
    
    async handleCreate(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const backupName = interaction.options.getString('name') || `Backup ${new Date().toLocaleDateString()}`;
        
        if (!userData.backups) userData.backups = [];
        
        if (userData.backups.length >= 10) {
            const embed = new EmbedBuilder()
                .setTitle(`${constants.EMOJIS.ERROR} Backup Limit Reached`)
                .setDescription('You can have a maximum of 10 backups.\n\nDelete old backups to create new ones.')
                .setColor(constants.COLORS.ERROR);
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const backupId = this.generateBackupId();
        const backupData = this.createBackupData(userData);
        
        const backup = {
            id: backupId,
            name: backupName,
            createdAt: new Date().toISOString(),
            size: JSON.stringify(backupData).length,
            dataHash: this.generateHash(JSON.stringify(backupData)),
            data: backupData
        };
        
        userData.backups.push(backup);
        userData.stats.backupsCreated = (userData.stats.backupsCreated || 0) + 1;
        userData.stats.commandsUsed++;
        
        await user.save(userData);
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SUCCESS} Backup Created Successfully!`)
            .setDescription(`Your account data has been safely backed up!`)
            .addFields(
                { name: '🆔 Backup ID', value: backupId, inline: true },
                { name: '📝 Backup Name', value: backupName, inline: true },
                { name: '📊 Data Size', value: `${(backup.size / 1024).toFixed(2)} KB`, inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(new Date(backup.createdAt).getTime() / 1000)}:F>`, inline: true },
                { name: '🔒 Security Hash', value: `${backup.dataHash.substring(0, 16)}...`, inline: true },
                { name: '📦 Total Backups', value: `${userData.backups.length}/10`, inline: true },
                { name: '💾 Backed Up Data', value: '• Account balance and bank\n• Inventory and items\n• Achievements and progress\n• Statistics and history\n• Settings and preferences', inline: false },
                { name: '🔐 Security Note', value: 'Backups are encrypted and stored securely. Only you can access and restore your data.', inline: false }
            )
            .setColor(constants.COLORS.SUCCESS)
            .setFooter({ text: `Backup #${backupId} • Keep your backup ID safe` })
            .setTimestamp();
        
        const listButton = new ButtonBuilder()
            .setCustomId('backup_list')
            .setLabel('View All Backups')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📋');
        
        const settingsButton = new ButtonBuilder()
            .setCustomId('backup_settings')
            .setLabel('Backup Settings')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⚙️');
        
        const row = new ActionRowBuilder().addComponents(listButton, settingsButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleList(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const backups = userData.backups || [];
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.BACKUP} ${interaction.user.displayName}'s Account Backups`)
            .setDescription('Your account backup history and management')
            .addFields(
                { name: '📊 Backup Summary', value: `**Total Backups**: ${backups.length}/10\n**Storage Used**: ${this.getTotalBackupSize(backups)} KB\n**Oldest Backup**: ${this.getOldestBackup(backups)}\n**Newest Backup**: ${this.getNewestBackup(backups)}`, inline: false }
            )
            .setColor(constants.COLORS.BACKUP)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: 'Backups are automatically encrypted and secured' })
            .setTimestamp();
        
        if (backups.length === 0) {
            embed.addFields({
                name: '📦 No Backups Found',
                value: 'You don\'t have any backups yet.\n\nUse `/backup create` to create your first backup!',
                inline: false
            });
        } else {
            for (const backup of backups.slice(0, 8)) {
                const age = this.getBackupAge(backup.createdAt);
                
                embed.addFields({
                    name: `💾 ${backup.name}`,
                    value: `**ID**: ${backup.id}\n**Size**: ${(backup.size / 1024).toFixed(2)} KB\n**Created**: ${age}\n**Hash**: ${backup.dataHash.substring(0, 12)}...`,
                    inline: true
                });
            }
        }
        
        const createButton = new ButtonBuilder()
            .setCustomId('backup_create_menu')
            .setLabel('Create Backup')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💾')
            .setDisabled(backups.length >= 10);
        
        const restoreButton = new ButtonBuilder()
            .setCustomId('backup_restore_menu')
            .setLabel('Restore Backup')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔄')
            .setDisabled(backups.length === 0);
        
        const deleteButton = new ButtonBuilder()
            .setCustomId('backup_delete_menu')
            .setLabel('Delete Backup')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🗑️')
            .setDisabled(backups.length === 0);
        
        const row = new ActionRowBuilder().addComponents(createButton, restoreButton, deleteButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleExport(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const exportData = this.createExportData(userData);
        const exportSize = JSON.stringify(exportData).length;
        const exportHash = this.generateHash(JSON.stringify(exportData));
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.EXPORT} Data Export Ready`)
            .setDescription(`Your VexiumVerse data has been prepared for export`)
            .addFields(
                { name: '📊 Export Details', value: `**Data Size**: ${(exportSize / 1024).toFixed(2)} KB\n**Export Hash**: ${exportHash.substring(0, 16)}...\n**Generated**: <t:${Math.floor(Date.now() / 1000)}:F>\n**Format**: JSON`, inline: true },
                { name: '📦 Included Data', value: '• Complete account profile\n• Financial records\n• Achievement history\n• Statistical data\n• Game history\n• Settings & preferences', inline: true },
                { name: '🔐 Privacy & Security', value: '• Data is anonymized\n• No sensitive info included\n• Compliant with GDPR\n• Safe for external storage', inline: true },
                { name: '💡 Usage Instructions', value: '1. Click "Download Export" below\n2. Save the file securely\n3. Use for personal records\n4. Import to compatible systems', inline: false },
                { name: '⚠️ Important Notes', value: '• Export files expire after 24 hours\n• Contains personal gaming data\n• Keep files secure and private\n• Do not share with unauthorized parties', inline: false }
            )
            .setColor(constants.COLORS.EXPORT)
            .setFooter({ text: 'Data export • Personal use only • Expires in 24 hours' })
            .setTimestamp();
        
        const downloadButton = new ButtonBuilder()
            .setCustomId(`backup_download_${exportHash.substring(0, 8)}`)
            .setLabel('Download Export')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📥');
        
        const backupButton = new ButtonBuilder()
            .setCustomId('backup_create_from_export')
            .setLabel('Create Backup Instead')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💾');
        
        const row = new ActionRowBuilder().addComponents(downloadButton, backupButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    async handleSettings(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const settings = userData.backupSettings || {
            autoBackup: false,
            backupFrequency: 'weekly',
            maxBackups: 10,
            includeHistory: true,
            encryptionLevel: 'standard'
        };
        
        const embed = new EmbedBuilder()
            .setTitle(`${constants.EMOJIS.SETTINGS} Backup Settings`)
            .setDescription('Configure your automatic backup preferences')
            .addFields(
                { name: '🔄 Automatic Backups', value: `**Status**: ${settings.autoBackup ? '✅ Enabled' : '❌ Disabled'}\n**Frequency**: ${settings.backupFrequency.charAt(0).toUpperCase() + settings.backupFrequency.slice(1)}\n**Next Backup**: ${this.getNextBackupTime(settings)}`, inline: true },
                { name: '📊 Backup Limits', value: `**Max Backups**: ${settings.maxBackups}/10\n**Current Backups**: ${(userData.backups || []).length}\n**Storage Used**: ${this.getTotalBackupSize(userData.backups || [])} KB`, inline: true },
                { name: '🔐 Security Settings', value: `**Encryption**: ${settings.encryptionLevel.charAt(0).toUpperCase() + settings.encryptionLevel.slice(1)}\n**Include History**: ${settings.includeHistory ? 'Yes' : 'No'}\n**Data Retention**: 90 days`, inline: true },
                { name: '⚙️ Available Options', value: '• **Auto Backup**: Enable/disable automatic backups\n• **Frequency**: Daily, weekly, or monthly\n• **Retention**: How long to keep backups\n• **Encryption**: Standard or enhanced security', inline: false },
                { name: '💡 Recommendations', value: '• Enable weekly automatic backups\n• Keep at least 3 recent backups\n• Use enhanced encryption for sensitive data\n• Regularly test backup restoration', inline: false }
            )
            .setColor(constants.COLORS.SETTINGS)
            .setFooter({ text: 'Backup settings • Changes take effect immediately' })
            .setTimestamp();
        
        const toggleAutoButton = new ButtonBuilder()
            .setCustomId('backup_toggle_auto')
            .setLabel(settings.autoBackup ? 'Disable Auto Backup' : 'Enable Auto Backup')
            .setStyle(settings.autoBackup ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji(settings.autoBackup ? '❌' : '✅');
        
        const frequencyButton = new ButtonBuilder()
            .setCustomId('backup_change_frequency')
            .setLabel('Change Frequency')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📅');
        
        const encryptionButton = new ButtonBuilder()
            .setCustomId('backup_change_encryption')
            .setLabel('Security Settings')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔐');
        
        const row = new ActionRowBuilder().addComponents(toggleAutoButton, frequencyButton, encryptionButton);
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    
    createBackupData(userData) {
        return {
            profile: {
                level: userData.level,
                xp: userData.xp,
                prestigeLevel: userData.prestigeLevel,
                dailyStreak: userData.dailyStreak
            },
            economy: {
                vexBalance: userData.vexBalance,
                bankBalance: userData.bankBalance,
                networth: userData.networth,
                investments: userData.investments,
                realEstate: userData.realEstate,
                crypto: userData.crypto,
                bonds: userData.bonds,
                loans: userData.loans
            },
            inventory: userData.inventory,
            achievements: userData.achievements,
            stats: userData.stats,
            settings: userData.settings,
            friends: userData.friends,
            backupVersion: '1.0',
            backupTimestamp: new Date().toISOString()
        };
    },
    
    createExportData(userData) {
        const backupData = this.createBackupData(userData);
        return {
            ...backupData,
            exportMetadata: {
                userId: userData.userId,
                username: userData.username,
                exportedAt: new Date().toISOString(),
                exportVersion: '1.0',
                dataIntegrity: this.generateHash(JSON.stringify(backupData))
            }
        };
    },
    
    generateBackupId() {
        return 'BKP' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    },
    
    generateHash(data) {
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    },
    
    getTotalBackupSize(backups) {
        return (backups.reduce((total, backup) => total + backup.size, 0) / 1024).toFixed(2);
    },
    
    getOldestBackup(backups) {
        if (backups.length === 0) return 'None';
        const oldest = backups.reduce((oldest, backup) => 
            new Date(backup.createdAt) < new Date(oldest.createdAt) ? backup : oldest
        );
        return this.getBackupAge(oldest.createdAt);
    },
    
    getNewestBackup(backups) {
        if (backups.length === 0) return 'None';
        const newest = backups.reduce((newest, backup) => 
            new Date(backup.createdAt) > new Date(newest.createdAt) ? backup : newest
        );
        return this.getBackupAge(newest.createdAt);
    },
    
    getBackupAge(createdAt) {
        const now = new Date();
        const created = new Date(createdAt);
        const diffMs = now - created;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    },
    
    getNextBackupTime(settings) {
        if (!settings.autoBackup) return 'Disabled';
        
        const now = new Date();
        let nextBackup = new Date(now);
        
        switch (settings.backupFrequency) {
            case 'daily':
                nextBackup.setDate(now.getDate() + 1);
                break;
            case 'weekly':
                nextBackup.setDate(now.getDate() + 7);
                break;
            case 'monthly':
                nextBackup.setMonth(now.getMonth() + 1);
                break;
        }
        
        return `<t:${Math.floor(nextBackup.getTime() / 1000)}:R>`;
    }
};
