const fs = require('fs');

const file = 'dashboard.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Normalize newlines for the replacement
    content = content.replace(/\r\n/g, '\n');
    
    // 1. Add hamburger icon to topbar
    const topbarTarget = `<div class="topbar">\n      <div>`;
    const topbarReplacement = `<div class="topbar">\n      <div style="display: flex; align-items: center; gap: 1rem;">\n        <div class="hamburger" onclick="toggleSidebar()"><ion-icon name="menu-outline"></ion-icon></div>\n        <div>`;
    
    if (!content.includes('class="hamburger"')) {
        content = content.replace(topbarTarget, topbarReplacement);
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log("Successfully added hamburger menu.");
}
