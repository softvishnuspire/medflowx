const fs = require('fs');
const path = require('path');

function fixImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixImports(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Look for the broken pattern:
      // import {
      // import { View, ... } from 'react-native';
      const brokenPattern = /import\s*\{\s*\n?(import\s+\{\s*[^}]+\}\s+from\s+['"]react-native['"];\s*\n?)/;
      
      const match = content.match(brokenPattern);
      if (match) {
        // match[1] is the react-native import
        const rnImport = match[1];
        // replace the broken part by removing the rnImport from inside the brackets
        let newContent = content.replace(brokenPattern, 'import { \n');
        // Now prepend the rnImport before the `import {`
        // We will just find where 'import {' originally was and put it before
        const originalImportIndex = newContent.indexOf('import { \n');
        
        if (originalImportIndex !== -1) {
            newContent = newContent.slice(0, originalImportIndex) + rnImport + newContent.slice(originalImportIndex);
        } else {
            // fallback
            newContent = rnImport + newContent;
        }

        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log('Fixed:', fullPath);
      }
      
      // Also catch cases where the newline was slightly different:
      const brokenPattern2 = /import\s*\{\r\n(import\s+\{\s*[^}]+\}\s+from\s+['"]react-native['"];\r\n?)/;
      const match2 = content.match(brokenPattern2);
      if (match2) {
        const rnImport = match2[1];
        let newContent = content.replace(brokenPattern2, 'import {\r\n');
        const originalImportIndex = newContent.indexOf('import {\r\n');
        if (originalImportIndex !== -1) {
            newContent = newContent.slice(0, originalImportIndex) + rnImport + newContent.slice(originalImportIndex);
        } else {
            newContent = rnImport + newContent;
        }
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log('Fixed (windows newline):', fullPath);
      }
    }
  }
}

fixImports(path.join(__dirname, 'src'));
console.log('Fix script complete.');
