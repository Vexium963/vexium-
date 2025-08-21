const fs = require('fs');
const path = require('path');

function findCommandFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            files.push(...findCommandFiles(fullPath));
        } else if (item.endsWith('.js')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

function extractCommandName(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const match = content.match(/\.setName\('([^']+)'\)/);
        return match ? match[1] : null;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return null;
    }
}

const commandFiles = findCommandFiles('./commands');
const commandNames = {};

console.log('Scanning command files...\n');

for (const file of commandFiles) {
    const commandName = extractCommandName(file);
    if (commandName) {
        if (!commandNames[commandName]) {
            commandNames[commandName] = [];
        }
        commandNames[commandName].push(file);
    }
}

console.log('DUPLICATE COMMAND NAMES FOUND:');
console.log('==============================');

let duplicatesFound = false;
for (const [name, files] of Object.entries(commandNames)) {
    if (files.length > 1) {
        duplicatesFound = true;
        console.log(`\n❌ DUPLICATE: "${name}"`);
        files.forEach(file => console.log(`   - ${file}`));
    }
}

if (!duplicatesFound) {
    console.log('✅ No duplicate command names found!');
}

console.log(`\nTotal commands: ${Object.keys(commandNames).length}`);
console.log('All command names:');
Object.keys(commandNames).sort().forEach(name => console.log(`  - ${name}`));
