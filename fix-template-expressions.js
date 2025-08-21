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

function fixTemplateExpressions() {
    const commandsDir = './commands';
    const jsFiles = findJSFiles(commandsDir);
    
    let fixedCount = 0;
    
    jsFiles.forEach(filePath => {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;
            
            const brokenTemplateRegex = /\$\{[^}]*\.toFixe\.\.\./g;
            content = content.replace(brokenTemplateRegex, (match) => {
                console.log(`Fixed broken template in: ${filePath}`);
                console.log(`  Found: ${match}`);
                const fixed = match.replace('.toFixe...', '.toFixed(2)}');
                console.log(`  Fixed: ${fixed}`);
                modified = true;
                fixedCount++;
                return fixed;
            });
            
            const patterns = [
                { regex: /\$\{[^}]*\.toFixed\.\.\./g, replacement: (match) => match.replace('.toFixed...', '.toFixed(2)}') },
                { regex: /\$\{[^}]*\.length\.\.\./g, replacement: (match) => match.replace('.length...', '.length}') },
                { regex: /\$\{[^}]*\.join\.\.\./g, replacement: (match) => match.replace('.join...', '.join(\', \')}') }
            ];
            
            patterns.forEach(pattern => {
                content = content.replace(pattern.regex, (match) => {
                    console.log(`Fixed pattern in: ${filePath}`);
                    console.log(`  Found: ${match}`);
                    const fixed = pattern.replacement(match);
                    console.log(`  Fixed: ${fixed}`);
                    modified = true;
                    fixedCount++;
                    return fixed;
                });
            });
            
            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
            }
        } catch (error) {
            console.error(`Error processing ${filePath}:`, error.message);
        }
    });
    
    console.log(`\nFixed ${fixedCount} broken template expressions.`);
}

fixTemplateExpressions();
