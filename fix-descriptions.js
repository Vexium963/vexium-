const fs = require('fs');
const path = require('path');

function findJSFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat && stat.isDirectory()) {
            results = results.concat(findJSFiles(filePath));
        } else if (file.endsWith('.js')) {
            results.push(filePath);
        }
    });
    
    return results;
}

function fixDescriptions() {
    const commandsDir = './commands';
    const jsFiles = findJSFiles(commandsDir);
    
    let fixedCount = 0;
    
    jsFiles.forEach(filePath => {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;
            
            const descriptionRegex = /\.setDescription\(`([^`]{101,})`\)/g;
            
            content = content.replace(descriptionRegex, (match, description) => {
                if (description.length > 100) {
                    const truncated = description.substring(0, 97) + '...';
                    console.log(`Fixed: ${filePath}`);
                    console.log(`  Old (${description.length} chars): ${description}`);
                    console.log(`  New (${truncated.length} chars): ${truncated}`);
                    modified = true;
                    fixedCount++;
                    return `.setDescription(\`${truncated}\`)`;
                }
                return match;
            });
            
            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
            }
        } catch (error) {
            console.error(`Error processing ${filePath}:`, error.message);
        }
    });
    
    console.log(`\nFixed ${fixedCount} long descriptions.`);
}

fixDescriptions();
