const fs = require('fs');
const path = require('path');

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if it's already converted or not a tsx file
  if (!filePath.endsWith('.tsx')) return;
  if (content.includes("import { View")) return;

  // Track components to import
  const rnComponents = new Set();
  
  // Replace HTML tags with RN components
  const replacements = [
    { from: /<div/g, to: '<View', add: 'View' },
    { from: /<\/div>/g, to: '</View>' },
    { from: /<span/g, to: '<Text', add: 'Text' },
    { from: /<\/span>/g, to: '</Text>' },
    { from: /<p/g, to: '<Text', add: 'Text' },
    { from: /<\/p>/g, to: '</Text>' },
    { from: /<h[1-6]/g, to: '<Text', add: 'Text' },
    { from: /<\/h[1-6]>/g, to: '</Text>' },
    { from: /<button/g, to: '<TouchableOpacity', add: 'TouchableOpacity' },
    { from: /<\/button>/g, to: '</TouchableOpacity>' },
    { from: /<input/g, to: '<TextInput', add: 'TextInput' },
    { from: /<img/g, to: '<Image', add: 'Image' },
    { from: /<form/g, to: '<View', add: 'View' },
    { from: /<\/form>/g, to: '</View>' },
    { from: /<main/g, to: '<View', add: 'View' },
    { from: /<\/main>/g, to: '</View>' },
    { from: /<header/g, to: '<View', add: 'View' },
    { from: /<\/header>/g, to: '</View>' },
    { from: /<nav/g, to: '<View', add: 'View' },
    { from: /<\/nav>/g, to: '</View>' },
    { from: /<section/g, to: '<View', add: 'View' },
    { from: /<\/section>/g, to: '</View>' },
    { from: /<a /g, to: '<TouchableOpacity ', add: 'TouchableOpacity' },
    { from: /<\/a>/g, to: '</TouchableOpacity>' },
    { from: /<label/g, to: '<Text', add: 'Text' },
    { from: /<\/label>/g, to: '</Text>' },
    { from: /onClick=/g, to: 'onPress=' },
    { from: /onChange=/g, to: 'onChangeText=' },
    { from: /onSubmit=/g, to: 'onSubmitEditing=' },
  ];

  let modified = content;
  for (const rep of replacements) {
    if (rep.add && modified.match(rep.from)) {
      rnComponents.add(rep.add);
    }
    modified = modified.replace(rep.from, rep.to);
  }

  // Handle lucide-react -> lucide-react-native
  modified = modified.replace(/from\s+['"]lucide-react['"]/g, "from 'lucide-react-native'");

  // Add RN imports if needed
  if (rnComponents.size > 0) {
    const importStr = `import { ${Array.from(rnComponents).join(', ')} } from 'react-native';\n`;
    // Find last import
    const lastImportIndex = modified.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLine = modified.indexOf('\n', lastImportIndex);
      modified = modified.slice(0, endOfLine + 1) + importStr + modified.slice(endOfLine + 1);
    } else {
      modified = importStr + modified;
    }
  }

  // Basic Next.js router to Expo router conversion
  modified = modified.replace(/import\s+{.*useRouter.*}\s+from\s+['"]next\/navigation['"]/g, "import { useRouter } from 'expo-router'");
  modified = modified.replace(/next\/link/g, "expo-router");

  if (modified !== content) {
    fs.writeFileSync(filePath, modified, 'utf8');
    console.log(`Converted: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else {
      convertFile(fullPath);
    }
  }
}

const targetDirs = [
  path.join(__dirname, '../src/app'),
  path.join(__dirname, '../src/features'),
  path.join(__dirname, '../src/components'),
];

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Processing directory: ${dir}`);
    walkDir(dir);
  }
});

console.log("Conversion complete.");
