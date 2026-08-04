const fs = require('fs');

function injectNavLink(filename) {
    if (fs.existsSync(filename)) {
        let content = fs.readFileSync(filename, 'utf8');
        
        // Find the nav links
        const targetString = `<li><a href="browse.html">Browse</a></li>`;
        const replacementString = `<li><a href="browse.html">Browse</a></li>\n      <li><a href="my-library.html">My Library</a></li>`;
        
        // Ensure we don't add it twice
        if (!content.includes('<li><a href="my-library.html">My Library</a></li>')) {
            content = content.replace(targetString, replacementString);
            fs.writeFileSync(filename, content, 'utf8');
            console.log("Injected Nav link into", filename);
        }
    }
}

injectNavLink('index.html');
injectNavLink('story.html');
// Note: dashboard.html uses a different sidebar navigation, so we won't put it there.
