const fs = require('fs');
const path = require('path');

function replaceFileContent(filePath, from, to) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(from, to);
    fs.writeFileSync(filePath, content, 'utf8');
}

// 1. Fix <aside> in index.tsx files
const asideRegex = /<aside/g;
const closeAsideRegex = /<\/aside>/g;

const filesWithAside = [
    'src/app/admin/index.tsx',
    'src/app/doctor/index.tsx',
    'src/app/pharmacy/index.tsx',
    'src/app/reception/index.tsx',
    'src/features/doctor/workspace-view.tsx'
];

for (const file of filesWithAside) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(asideRegex, '<View');
        content = content.replace(closeAsideRegex, '</View>');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed aside in', file);
    }
}

// 2. Fix components/ui/table.tsx
const tablePath = path.join(__dirname, 'src/components/ui/table.tsx');
if (fs.existsSync(tablePath)) {
    const newTableContent = `import React from 'react';
import { View, Text } from 'react-native';

interface TableProps extends React.ComponentProps<typeof View> {
  children: React.ReactNode;
}

export function Table({ children, className = '', ...props }: TableProps) {
  return (
    <View className="w-full flex-col" {...props}>
      <View className={\`w-full \${className}\`}>
        {children}
      </View>
    </View>
  );
}

export function TableHeader({ children, className = '', ...props }: React.ComponentProps<typeof View>) {
  return (
    <View className={\`bg-zinc-50 border-b border-zinc-100 \${className}\`} {...props}>
      {children}
    </View>
  );
}

export function TableBody({ children, className = '', ...props }: React.ComponentProps<typeof View>) {
  return (
    <View className={\`divide-y divide-zinc-100 \${className}\`} {...props}>
      {children}
    </View>
  );
}

export function TableRow({ children, className = '', ...props }: React.ComponentProps<typeof View>) {
  return (
    <View className={\`flex-row border-b border-zinc-100 items-center \${className}\`} {...props}>
      {children}
    </View>
  );
}

export function TableHead({ children, className = '', ...props }: React.ComponentProps<typeof View>) {
  return (
    <View className={\`flex-1 px-4 py-3 justify-center \${className}\`} {...props}>
      <Text className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{children}</Text>
    </View>
  );
}

export function TableCell({ children, className = '', ...props }: React.ComponentProps<typeof View>) {
  return (
    <View className={\`flex-1 px-4 py-4 justify-center \${className}\`} {...props}>
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text className={\`\${className}\`}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}
`;
    fs.writeFileSync(tablePath, newTableContent, 'utf8');
    console.log('Fixed table.tsx');
}

// 3. Fix reports-view.tsx (has <table>, <thead>, <tr> inside exportExcel/exportPDF, which are strings! 
// Wait, the regex caught <table> inside exportExcel as an HTML tag? No, if it was in a string literal, the regex I used didn't check for strings.
// But wait, are there real HTML tags in reports-view.tsx?
// Let's check if there are any ACTUAL <View class="title"> inside the PDF template. Yes! The PDF string has <View class="header"> etc. But those are INSIDE A STRING.
// The regex found them because they matched `<View`! Wait, no, the regex found `table`, `thead`, `tbody`, `th`, `tr`, `td` which are in the PDF HTML template string.
// As long as they are inside a string template \` \`, React Native is fine with it! It's just a string!
// Wait! In the PDF generation, it uses:
// <View class="header"> inside a string?! Yes, it was translated by my previous script!
// Oh! My previous script translated `<div class="header">` inside the HTML string to `<View class="header">` inside the HTML string!!
// That breaks the PDF HTML because PDF needs `<div>`. Let's fix the PDF HTML template back to `div`.
const reportsViewPath = path.join(__dirname, 'src/features/admin/reports-view.tsx');
if (fs.existsSync(reportsViewPath)) {
    let reportsContent = fs.readFileSync(reportsViewPath, 'utf8');
    reportsContent = reportsContent.replace(/<View class=/g, '<div class=');
    reportsContent = reportsContent.replace(/<\/View>/g, '</div>');
    fs.writeFileSync(reportsViewPath, reportsContent, 'utf8');
    console.log('Fixed reports-view.tsx PDF template');
}
