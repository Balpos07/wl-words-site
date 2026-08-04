const fs = require('fs');

let content = fs.readFileSync('story.html', 'utf8');

// Restore the accidentally deleted book hero header
content = content.replace(
`<!-- ══════════════════════════════════ -->
<!--  BOOK DETAIL VIEW                 -->
<!-- ══════════════════════════════════ -->
        </div>
        <div class="hero-tags">`,
`<!-- ══════════════════════════════════ -->
<!--  BOOK DETAIL VIEW                 -->
<!-- ══════════════════════════════════ -->
<div id="bookDetailView">

  <!-- Book Hero -->
  <div class="book-hero">
    <div class="book-hero-inner">
      <div class="book-cover-lg" id="storyCover">Loading...</div>
      <div class="book-hero-info">
        <div class="hero-badge" id="storyBadge"><ion-icon name="book-outline" style="vertical-align:-2px; margin-right:4px;"></ion-icon> <span id="storyCategory">Story</span></div>
        <h1 class="hero-title" id="storyTitle">Loading Story...</h1>
        <p class="hero-author">by <a href="#" id="storyAuthor">Author</a></p>
        <div class="hero-stats">
          <div class="hero-stat"><div class="hero-stat-num" id="statChapters">0</div><div class="hero-stat-label">Chapters</div></div>
          <div class="hero-stat"><div class="hero-stat-num" id="statReaders">0</div><div class="hero-stat-label">Readers</div></div>
          <div class="hero-stat"><div class="hero-stat-num" id="statRating">0.0 ★</div><div class="hero-stat-label">Rating</div></div>
          <div class="hero-stat"><div class="hero-stat-num" id="statPublished">--</div><div class="hero-stat-label">Published</div></div>
        </div>
        <div class="hero-tags" id="storyTags">
          <span class="tag">Story</span>
        </div>`
);

// Update the description section
content = content.replace(
    /<div class="section-label">About this story<\/div>[\s\S]*?<div class="description">[\s\S]*?<\/div>/,
    `<div class="section-label">About this story</div>\n      <div class="description" id="storyDescription">\n        <p>Loading description...</p>\n      </div>`
);

// Insert the javascript payload at the end of the script block
const js_payload = `
  // Dynamic Firebase Loading
  const urlParams = new URLSearchParams(window.location.search);
  const storyId = urlParams.get('id');

  import { db, doc, getDoc } from './firebase-config.js';

  async function loadStoryData() {
    if (!storyId) {
      document.getElementById('storyTitle').textContent = "No story ID provided";
      return;
    }
    try {
      const docRef = doc(db, "stories", storyId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Basic Info
        document.getElementById('storyTitle').textContent = data.title;
        document.getElementById('storyAuthor').textContent = data.author;
        document.getElementById('storyCategory').textContent = data.category;
        document.getElementById('storyDescription').innerHTML = \`<p>\${data.description}</p>\`;
        
        // Cover
        const coverEl = document.getElementById('storyCover');
        coverEl.textContent = data.title.substring(0, 2).toUpperCase();
        coverEl.className = 'book-cover-lg ' + (data.coverClass || 'c1');
        
        // Stats
        document.getElementById('statChapters').textContent = data.chapters_count || 0;
        document.getElementById('statReaders').textContent = data.total_reads || 0;
        document.getElementById('statRating').textContent = (data.avg_rating || 0).toFixed(1) + ' ★';
        document.getElementById('statPublished').textContent = new Date(data.createdAt).getFullYear() || '--';
        
      } else {
        document.getElementById('storyTitle').textContent = "Story not found";
      }
    } catch (e) {
      console.error("Error fetching story:", e);
    }
  }

  // Run directly
  loadStoryData();
`;

// Replace the Firebase SDK script import to properly allow the inline script
content = content.replace(
    '<!-- Firebase SDK -->\n<script type="module" src="firebase-config.js"></script>',
    `<!-- Firebase SDK -->\n<script type="module">\n${js_payload}\n</script>`
);

fs.writeFileSync('story.html', content, 'utf8');
console.log("Applied dynamic modifications to story.html successfully.");
