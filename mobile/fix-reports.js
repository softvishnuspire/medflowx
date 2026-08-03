const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/features/admin/reports-view.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// Reverse ALL </div> back to </View>
content = content.replace(/<\/div>/g, '</View>');

// Fix <div class= back to <View className=
content = content.replace(/<div class=/g, '<View className=');

// Now explicitly fix the PDF and Excel string templates
// They are enclosed within \` 
// I'll just find the function exportPDF and fix the string inside it
const pdfStart = content.indexOf('const exportPDF =');
if (pdfStart !== -1) {
    const pdfEnd = content.indexOf('toast(\'PDF printable sheet compiled successfully!\', \'success\');', pdfStart);
    if (pdfEnd !== -1) {
        let pdfBlock = content.substring(pdfStart, pdfEnd);
        pdfBlock = pdfBlock.replace(/<View className=/g, '<div class=');
        pdfBlock = pdfBlock.replace(/<View style=/g, '<div style=');
        pdfBlock = pdfBlock.replace(/<View>/g, '<div>');
        pdfBlock = pdfBlock.replace(/<\/View>/g, '</div>');
        content = content.substring(0, pdfStart) + pdfBlock + content.substring(pdfEnd);
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed reports-view.tsx');
