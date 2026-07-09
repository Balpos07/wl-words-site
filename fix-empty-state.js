const fs = require('fs');
const path = require('path');

const destPath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(destPath, 'utf8');

// 1. Empty the static book strip
content = content.replace(
  /<div class="book-strip" aria-hidden="true" id="homeBookStrip">([\s\S]*?)<\/div>\s*<\/section>/,
  `<div class="book-strip" aria-hidden="true" id="homeBookStrip">
    <div style="width:100%;text-align:center;padding:2rem;color:rgba(255,255,255,0.6);font-family:'Playfair Display',serif;font-style:italic;">
      Stories uploaded by writers will appear here soon.
    </div>
  </div>
</section>`
);

// 2. Empty the static featured grid
content = content.replace(
  /<div class="books-grid" id="featuredGrid">([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/,
  `<div class="books-grid" id="featuredGrid">
      <div style="grid-column:1/-1;text-align:center;padding:4rem 1rem;color:var(--muted);font-style:italic;">
        New and trending books will appear here soon.
      </div>
    </div>
  </div>
</section>`
);

// 3. Make dynamic strip cards clickable
content = content.replace(
  'stripHtml += `<div class="book-card" style="--r:${r}"><div class="book-cover ${cover}">${book.title}</div></div>`;',
  'stripHtml += `<div class="book-card" style="--r:${r}; cursor:pointer;" onclick="window.location.href=\\\'story.html?id=${doc.id}\\\'"><div class="book-cover ${cover}">${book.title}</div></div>`;'
);

fs.writeFileSync(destPath, content, 'utf8');
console.log('Successfully updated index.html for empty states');
