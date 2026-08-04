const fs = require('fs');

let content = fs.readFileSync('story.html', 'utf8');

// 1. Remove the hardcoded chapters list in HTML
// Find: <div class="chapters-section"> ... </div>
// Note: We'll replace the contents of chapters-section with an empty shell that we will populate.
const oldHtmlSectionRegex = /<div class="chapters-section">[\s\S]*?<\/div>\s*<\/div>\s*<!-- Sidebar -->/;
const newHtmlSection = `
      <div class="chapters-section" id="chaptersSection">
        <div class="chapters-header">
          <h3>Table of Contents</h3>
          <span class="chapters-count" id="chaptersCountLabel">Loading chapters...</span>
        </div>
        <div id="chaptersList">
            <div class="chapter-row" style="cursor:default;">
                <div class="ch-info" style="text-align:center; padding: 2rem; color:var(--muted);">Loading chapters...</div>
            </div>
        </div>
      </div>
    </div>
    <!-- Sidebar -->`;

content = content.replace(oldHtmlSectionRegex, newHtmlSection);


// 2. Replace the hardcoded JS chapters array and functions with our new dynamic script
const oldScriptRegex = /<script>\s*\/\/\s*── CHAPTER DATA ──[\s\S]*?<\/script>/;
const newScript = `
<script>
  let currentChapter = 1;
  let fontSizes = [14, 16, 18, 20, 22, 24];
  let fontIdx = 2;
  
  // We will store fetched chapters here
  let chapters = [];
  let unlockedChapters = new Set([1, 2, 3]); // By default, 1,2,3 are "unlocked" since they are typically free.
  
  // Expose these globally for the HTML onclick handlers
  window.openReading = function(num) {
    currentChapter = num;
    document.getElementById('bookDetailView').style.display = 'none';
    document.getElementById('readingView').style.display = 'block';
    document.getElementById('mainNav').style.display = 'none';
    window.scrollTo(0, 0);
    renderChapter();
  };

  window.closeReading = function() {
    document.getElementById('bookDetailView').style.display = 'block';
    document.getElementById('readingView').style.display = 'none';
    document.getElementById('mainNav').style.display = 'flex';
    window.scrollTo(0, 0);
  };

  window.renderChapter = function() {
    const ch = chapters[currentChapter - 1];
    if (!ch) return;

    document.title = \`\${ch.title} — W&L Words\`;
    document.getElementById('toolbarTitle').textContent = \`Chapter \${ch.chapterNum} · \${ch.title}\`;
    document.getElementById('chLabel').textContent = "Chapter " + ch.chapterNum;
    document.getElementById('chMainTitle').textContent = ch.title;
    
    const timeToRead = Math.max(1, Math.ceil((ch.content.length || 0) / 1000));
    const priceText = ch.pricing === 'free' ? 'Free chapter' : '8 coins';
    document.querySelector('#readingWrap .ch-sub').textContent = \`~\${timeToRead} min read · \${priceText}\`;
    
    document.getElementById('chProgress').textContent = \`Chapter \${ch.chapterNum} of \${chapters.length}\`;
    document.getElementById('prevBtn').disabled = ch.chapterNum === 1;
    document.getElementById('nextBtn').disabled = ch.chapterNum === chapters.length;

    const isLocked = ch.pricing !== 'free' && !unlockedChapters.has(ch.chapterNum);
    document.getElementById('proseContent').innerHTML = isLocked ? '' : ch.content;
    document.getElementById('lockGate').style.display = isLocked ? 'block' : 'none';
    document.getElementById('chNav').style.display = isLocked ? 'none' : 'flex';

    if (isLocked) {
      document.getElementById('proseContent').innerHTML = \`<p style="color:var(--read-muted);font-style:italic;">Continue the story from where Chapter \${ch.chapterNum - 1} left off…</p>\`;
    }

    updateProgress();
  };

  window.goChapter = function(dir) {
    const next = currentChapter + dir;
    if (next < 1 || next > chapters.length) return;
    currentChapter = next;
    window.scrollTo(0, 0);
    renderChapter();
  };

  window.updateProgress = function() {
    const wrap = document.getElementById('readingWrap');
    if (!wrap) return;
    const total = document.body.scrollHeight - window.innerHeight;
    const pct = total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0;
    document.getElementById('progressFill').style.width = pct + '%';
  };
  window.addEventListener('scroll', window.updateProgress);

  window.changeFontSize = function(dir) {
    fontIdx = Math.max(0, Math.min(fontSizes.length - 1, fontIdx + dir));
    const sz = fontSizes[fontIdx];
    document.documentElement.style.setProperty('--read-size', sz + 'px');
    document.getElementById('fsDisplay').textContent = sz + 'px';
  };

  window.setTheme = function(theme, btn) {
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.body.classList.remove('dark-mode', 'sepia-mode');
    if (theme === 'dark')  document.body.classList.add('dark-mode');
    if (theme === 'sepia') document.body.classList.add('sepia-mode');
  };

  window.toggleSettings = function() {
    document.getElementById('settingsPanel').classList.toggle('open');
    document.getElementById('settingsBtn').classList.toggle('active');
  };
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#settingsPanel') && !e.target.closest('#settingsBtn')) {
      const panel = document.getElementById('settingsPanel');
      if (panel) panel.classList.remove('open');
      const btn = document.getElementById('settingsBtn');
      if (btn) btn.classList.remove('active');
    }
  });
</script>
`;
content = content.replace(oldScriptRegex, newScript);

// 3. Inject the logic to actually fetch the chapters at the end of the inline module script we created in Step 1
const chapterLoaderInjection = `
  // --- Chapter Fetching Logic ---
  import { collection, query, where, getDocs, updateDoc, increment } from './firebase-config.js';
  
  async function loadChaptersForStory() {
    if (!storyId) return;
    
    try {
      const q = query(collection(db, "chapters"), where("storyId", "==", storyId));
      const querySnapshot = await getDocs(q);
      
      let fetchedChapters = [];
      querySnapshot.forEach((doc) => {
          fetchedChapters.push({ id: doc.id, ...doc.data() });
      });
      
      fetchedChapters.sort((a, b) => a.chapterNum - b.chapterNum);
      window.chapters = fetchedChapters; // expose to global scope for the reading view
      
      const listContainer = document.getElementById('chaptersList');
      const countLabel = document.getElementById('chaptersCountLabel');
      
      if (fetchedChapters.length === 0) {
        countLabel.textContent = "0 chapters";
        listContainer.innerHTML = '<div class="chapter-row" style="cursor:default;"><div class="ch-info" style="text-align:center; padding: 2rem; color:var(--muted);">No chapters published yet.</div></div>';
        return;
      }
      
      let freeCount = fetchedChapters.filter(c => c.pricing === 'free').length;
      countLabel.textContent = \`\${fetchedChapters.length} chapters · \${freeCount} free\`;
      
      let html = '';
      fetchedChapters.forEach(ch => {
        const isFree = ch.pricing === 'free';
        const words = ch.content ? ch.content.split(' ').length : 0;
        const timeToRead = Math.max(1, Math.ceil(words / 200));
        
        let badgeHtml = '';
        let lockedClass = '';
        if (isFree) {
            badgeHtml = '<span class="ch-badge ch-free">Free</span>';
        } else {
            badgeHtml = '<span class="ch-badge ch-lock">🔒 8 coins</span>';
            lockedClass = 'locked';
        }
        
        html += \`
        <div class="chapter-row \${lockedClass}" onclick="openReading(\${ch.chapterNum})">
          <span class="ch-num">\${ch.chapterNum}</span>
          <div class="ch-info">
            <div class="ch-title">\${ch.title}</div>
            <div class="ch-meta">~\${words} words · \${timeToRead} min read</div>
          </div>
          \${badgeHtml}
        </div>
        \`;
      });
      listContainer.innerHTML = html;
      
    } catch (e) {
      console.error("Error loading chapters:", e);
    }
  }
  
  // Attach unlock logic to global window so button works
  window.unlockChapter = async function() {
    alert("You need 8 coins to unlock this chapter. Coin purchasing will be integrated soon!");
    // For now, simulate unlock for testing
    window.unlockedChapters.add(window.currentChapter);
    window.renderChapter();
  };

  // Run the loader
  document.addEventListener("DOMContentLoaded", loadChaptersForStory);
`;

content = content.replace(
    '// Run directly',
    chapterLoaderInjection + '\n  // Run directly'
);

fs.writeFileSync('story.html', content, 'utf8');
console.log("Injected Real Chapter Rendering logic successfully.");
