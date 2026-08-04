const fs = require('fs');

let content = fs.readFileSync('dashboard.html', 'utf8');

// 1. Insert #panel-chapter-manager after panel-stories
const panel_manager_html = `
      <!-- CHAPTER MANAGER -->
      <div class="panel" id="panel-chapter-manager">
        <div class="card">
          <div class="card-header" style="justify-content: flex-start; gap: 1rem;">
            <button class="btn-ghost" onclick="showPanel('stories', document.querySelectorAll('.nav-item')[1])" style="padding: 0.4rem 1rem;"><ion-icon name="arrow-back-outline" style="vertical-align:-2px; margin-right:4px;"></ion-icon> Back</button>
            <div class="card-title" id="cmStoryTitle">Story Chapters</div>
          </div>
          <div class="stories-toolbar" style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--border);">
             <button class="btn-upload" onclick="openChapterModal()">+ New Chapter</button>
          </div>
          <table class="story-table">
            <thead>
              <tr>
                <th>Chapter</th>
                <th>Title</th>
                <th>Pricing</th>
                <th>Published</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="chapterTableBody">
              <tr><td colspan="5" style="text-align:center;color:var(--muted);padding:2rem;">No chapters yet.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
`;
content = content.replace('      <!-- EARNINGS -->', panel_manager_html + '\n      <!-- EARNINGS -->');

// 2. Insert Chapter Modal after Edit Modal
const chapter_modal_html = `
  <!-- CHAPTER MODAL -->
  <div class="modal-overlay" id="chapterModal">
    <div class="modal" style="max-width: 800px; width: 90%;">
      <div class="modal-header">
        <div class="modal-title" id="chapterModalTitle">Add New Chapter</div>
        <button class="modal-close" onclick="closeChapterModal()">✕</button>
      </div>
      <div class="m-row">
        <div class="m-field" style="flex:1;"><label class="m-label">Chapter Title *</label><input id="chapterTitle" class="m-input" type="text" placeholder="e.g. The Wedding That Wasn't" /></div>
        <div class="m-field" style="width: 150px;"><label class="m-label">Chapter No. *</label><input id="chapterNum" class="m-input" type="number" min="1" value="1" /></div>
      </div>
      <div class="m-field">
        <label class="m-label">Chapter Content *</label>
        <div id="quillEditor" style="height: 350px; background: white; border-radius: 0 0 12px 12px; font-family: 'Inter', sans-serif;"></div>
      </div>
      <div class="m-field">
        <label class="m-label">Pricing</label>
        <select id="chapterPricing" class="m-input" style="max-width: 200px;">
            <option value="free">Free</option>
            <option value="locked">Locked (Coins)</option>
        </select>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" onclick="closeChapterModal()">Cancel</button>
        <button class="btn-save" onclick="window.saveChapter()">Save & Publish</button>
      </div>
    </div>
  </div>
`;
content = content.replace('  <div class="toast" id="toast"></div>', chapter_modal_html + '\n  <div class="toast" id="toast"></div>');

// 3. Add to panelTitles
content = content.replace(
    "window.panelTitles = { overview: ['Overview', 'Good morning 🌸'], stories: ['Content', 'My Stories'], earnings: ['Money', 'Earnings & Payouts'], coins: ['Money', 'Coin Analytics'], profile: ['Account', 'Writer Profile'], settings: ['Account', 'Settings'] };",
    "window.panelTitles = { overview: ['Overview', 'Good morning 🌸'], stories: ['Content', 'My Stories'], earnings: ['Money', 'Earnings & Payouts'], coins: ['Money', 'Coin Analytics'], profile: ['Account', 'Writer Profile'], settings: ['Account', 'Settings'], 'chapter-manager': ['Content', 'Manage Chapters'] };"
);

fs.writeFileSync('dashboard.html', content, 'utf8');
console.log("Injected HTML successfully.");
