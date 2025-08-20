const fs = require('fs');
const path = require('path');
const DatabaseMigration = require('../database/migrations/init');

async function setup() {
    console.log('🚀 Setting up VexiumVerse Bot...\n');
    
    try {
        console.log('1. Checking environment configuration...');
        await checkEnvironment();
        
        console.log('2. Initializing database...');
        const migration = new DatabaseMigration();
        await migration.initialize();
        
        console.log('3. Creating necessary directories...');
        await createDirectories();
        
        console.log('4. Setting up logging...');
        await setupLogging();
        
        console.log('5. Validating configuration...');
        await validateConfig();
        
        console.log('\n✅ Setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Configure your .env file with your Discord bot token');
        console.log('2. Run "npm run deploy" to register slash commands');
        console.log('3. Run "npm start" to start the bot');
        
    } catch (error) {
        console.error('\n❌ Setup failed:', error);
        process.exit(1);
    }
}

async function checkEnvironment() {
    const envPath = path.join(__dirname, '../.env');
    
    if (!fs.existsSync(envPath)) {
        console.log('   📄 Creating .env file from template...');
        const examplePath = path.join(__dirname, '../.env.example');
        fs.copyFileSync(examplePath, envPath);
        console.log('   ⚠️  Please configure your .env file before starting the bot');
    } else {
        console.log('   ✅ .env file exists');
    }
    
    const requiredVars = ['DISCORD_TOKEN', 'CLIENT_ID'];
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    for (const varName of requiredVars) {
        if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your_`)) {
            console.log(`   ⚠️  ${varName} needs to be configured in .env`);
        } else {
            console.log(`   ✅ ${varName} is configured`);
        }
    }
}

async function createDirectories() {
    const directories = [
        'database/data',
        'database/backups',
        'logs',
        'temp',
        'docs/images/screenshots'
    ];
    
    for (const dir of directories) {
        const fullPath = path.join(__dirname, '..', dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`   📁 Created directory: ${dir}`);
        } else {
            console.log(`   ✅ Directory exists: ${dir}`);
        }
    }
}

async function setupLogging() {
    const logsDir = path.join(__dirname, '../logs');
    const logFiles = ['bot.log', 'error.log', 'security.log', 'audit.log'];
    
    for (const logFile of logFiles) {
        const logPath = path.join(logsDir, logFile);
        if (!fs.existsSync(logPath)) {
            fs.writeFileSync(logPath, `# ${logFile} - Created ${new Date().toISOString()}\n`);
            console.log(`   📝 Created log file: ${logFile}`);
        }
    }
}

async function validateConfig() {
    const packagePath = path.join(__dirname, '../package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    console.log(`   📦 Package: ${packageData.name} v${packageData.version}`);
    console.log(`   🔧 Node.js requirement: ${packageData.engines.node}`);
    
    const nodeVersion = process.version;
    const requiredVersion = packageData.engines.node.replace('>=', '');
    
    if (nodeVersion >= requiredVersion) {
        console.log(`   ✅ Node.js version compatible: ${nodeVersion}`);
    } else {
        console.log(`   ⚠️  Node.js version may be incompatible: ${nodeVersion} (required: ${requiredVersion})`);
    }
    
    const dependencies = Object.keys(packageData.dependencies);
    console.log(`   📚 Dependencies: ${dependencies.length} packages`);
    
    for (const dep of dependencies) {
        try {
            require.resolve(dep);
            console.log(`   ✅ ${dep} is installed`);
        } catch (error) {
            console.log(`   ❌ ${dep} is missing - run npm install`);
        }
    }
}

async function createSampleFiles() {
    const sampleCommand = `const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sample')
        .setDescription('A sample command for VexiumVerse'),
    
    async execute(interaction) {
        const user = new User(interaction.user.id);
        const userData = await user.load();
        
        const embed = new EmbedBuilder()
            .setTitle('Sample Command')
            .setDescription('This is a sample command!')
            .setColor(constants.COLORS.PRIMARY)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },
};`;
    
    const samplePath = path.join(__dirname, '../commands/economy/sample.js');
    if (!fs.existsSync(samplePath)) {
        fs.writeFileSync(samplePath, sampleCommand);
        console.log('   📄 Created sample command file');
    }
}

if (require.main === module) {
    setup();
}

module.exports = { setup };
