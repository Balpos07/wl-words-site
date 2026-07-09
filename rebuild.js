const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const destPath = path.join(__dirname, 'index.html');

// 1. Read directly from git to avoid PowerShell encoding bugs
let content = execSync('git show 6af5a2d:index.html').toString('utf8');

// 2. Add ID to book strip
content = content.replace(
  '<div class="book-strip" aria-hidden="true">',
  '<div class="book-strip" aria-hidden="true" id="homeBookStrip">'
);

// 3. Add ID to books-grid
content = content.replace(
  '<div class="books-grid">',
  '<div class="books-grid" id="featuredGrid">'
);

// 4. Make static featured books clickable
content = content.replace(
  /<div class="book-item reveal">/g,
  '<div class="book-item reveal" onclick="window.location.href=\'story.html\'" style="cursor:pointer">'
);

// 5. Inject Firebase Script
const firebaseScript = `
<!-- Firebase SDK & Logic -->
<script type="module">
  import { db, collection, getDocs, query, orderBy, limit } from './firebase-config.js';

  async function loadTrendingBooks() {
    try {
      const strip = document.getElementById('homeBookStrip');
      const featuredGrid = document.getElementById('featuredGrid');
      
      // Fetch top books
      const q = query(collection(db, "stories"), orderBy("total_reads", "desc"), limit(8));
      const snapshot = await getDocs(q);
      
      let stripHtml = '';
      let featuredHtml = '';
      
      const rotations = ['-3deg', '2deg', '-1.5deg', '3deg', '-2.5deg', '1.5deg', '-2deg', '2.5deg'];
      let i = 0;

      snapshot.forEach(doc => {
        const book = doc.data();
        const cover = book.coverClass || 'bc1';

        // Build strip item
        const r = rotations[i % rotations.length];
        stripHtml += \`<div class="book-card" style="--r:\${r}"><div class="book-cover \${cover}">\${book.title}</div></div>\`;

        // Build featured item (only up to 6 for the grid)
        if (i < 6) {
          let badge = '';
          if (book.pricing_type === 'free') badge = \`<span class="book-badge badge-free">Free</span>\`;
          else if (book.pricing_type === 'coins') badge = \`<span class="book-badge badge-coins">🪙 Coins</span>\`;
          else if (book.pricing_type === 'purchase') badge = \`<span class="book-badge badge-purchase">💳 Buy</span>\`;

          featuredHtml += \`
          <div class="book-item reveal visible" onclick="window.location.href='story.html?id=\${doc.id}'" style="cursor:pointer">
            <div class="book-item-cover \${cover}">\${book.title}</div>
            \${badge}
            <div class="book-item-title">\${book.title}</div>
            <div class="book-item-author">by \${book.author}</div>
          </div>
          \`;
        }
        i++;
      });

      if (snapshot.size > 0) {
        if (strip) strip.innerHTML = stripHtml;
        if (featuredGrid) featuredGrid.innerHTML = featuredHtml;
      }

    } catch (error) {
      console.error("Error fetching trending books:", error);
    }
  }

  loadTrendingBooks();
</script>
`;

content = content.replace('</body>', firebaseScript + '\n</body>');

fs.writeFileSync(destPath, content, 'utf8');
console.log('Successfully rebuilt index.html');
