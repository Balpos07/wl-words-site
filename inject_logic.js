const fs = require('fs');

let content = fs.readFileSync('dashboard.html', 'utf8');

// The new Javascript logic for chapters
const js_payload = `
    let currentManageStoryId = null;
    let quill = null;

    // Initialize Quill when modal opens, or right away if we prefer
    function initQuill() {
        if (!quill) {
            quill = new Quill('#quillEditor', {
                theme: 'snow',
                placeholder: 'Write your chapter here...',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, false] }],
                        ['bold', 'italic', 'underline'],
                        ['blockquote'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['clean']
                    ]
                }
            });
        }
    }

    window.openChapterManager = async function(storyId, storyTitle) {
        currentManageStoryId = storyId;
        document.getElementById('cmStoryTitle').textContent = "Chapters for: " + storyTitle;
        showPanel('chapter-manager', document.querySelectorAll('.nav-item')[1]);
        
        await loadChapters(storyId);
    };

    async function loadChapters(storyId) {
        const tbody = document.getElementById('chapterTableBody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:2rem;">Loading chapters...</td></tr>';
        
        try {
            const q = query(collection(db, "chapters"), where("storyId", "==", storyId));
            const querySnapshot = await getDocs(q);
            
            let chapters = [];
            querySnapshot.forEach((doc) => {
                chapters.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort by chapter number
            chapters.sort((a, b) => a.chapterNum - b.chapterNum);
            
            if (chapters.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:2rem;">No chapters yet. Click New Chapter to start writing.</td></tr>';
                return;
            }
            
            let html = '';
            chapters.forEach(ch => {
                const isFree = ch.pricing === 'free';
                const badgeHtml = isFree 
                    ? '<span class="ch-badge ch-free" style="background:#D4F5E9; color:#1A7A55; padding:0.2rem 0.65rem; border-radius:50px; font-size:0.75rem;">Free</span>' 
                    : '<span class="ch-badge ch-lock" style="background:#FFF0D0; color:#A06010; padding:0.2rem 0.65rem; border-radius:50px; font-size:0.75rem;">🔒 8 coins</span>';
                    
                const date = ch.createdAt ? new Date(ch.createdAt).toLocaleDateString() : '--';
                
                html += \`
                <tr>
                    <td><strong>Chapter \${ch.chapterNum}</strong></td>
                    <td>\${ch.title}</td>
                    <td>\${badgeHtml}</td>
                    <td>\${date}</td>
                    <td>
                        <button class="btn-ghost" style="padding:0.3rem 0.8rem; font-size:0.8rem;">Edit</button>
                    </td>
                </tr>
                \`;
            });
            tbody.innerHTML = html;
            
        } catch (e) {
            console.error("Error loading chapters:", e);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red;padding:2rem;">Error loading chapters.</td></tr>';
        }
    }

    window.openChapterModal = function() {
        if (!currentManageStoryId) {
            showToast("No story selected!");
            return;
        }
        initQuill();
        document.getElementById('chapterModal').classList.add('active');
        document.getElementById('chapterTitle').value = '';
        // auto-increment chapter number based on existing
        const tbody = document.getElementById('chapterTableBody');
        const rows = tbody.querySelectorAll('tr');
        if (rows.length > 0 && !rows[0].textContent.includes('No chapters yet') && !rows[0].textContent.includes('Loading')) {
            document.getElementById('chapterNum').value = rows.length + 1;
        } else {
            document.getElementById('chapterNum').value = 1;
        }
        quill.root.innerHTML = '';
        document.getElementById('chapterPricing').value = 'free';
    };

    window.closeChapterModal = function() {
        document.getElementById('chapterModal').classList.remove('active');
    };

    window.saveChapter = async function() {
        if (!currentManageStoryId) return;
        
        const title = document.getElementById('chapterTitle').value;
        const chapterNum = parseInt(document.getElementById('chapterNum').value);
        const pricing = document.getElementById('chapterPricing').value;
        const contentHtml = quill.root.innerHTML;
        
        if (!title || contentHtml === '<p><br></p>') {
            showToast('Please enter a title and content.');
            return;
        }
        
        try {
            showToast('Publishing chapter...');
            await addDoc(collection(db, "chapters"), {
                storyId: currentManageStoryId,
                title: title,
                chapterNum: chapterNum,
                pricing: pricing,
                content: contentHtml,
                author_uid: currentWriterId,
                createdAt: new Date().toISOString()
            });
            
            // Also increment chapters_count on the story
            const storyRef = doc(db, "stories", currentManageStoryId);
            const storyDoc = await getDoc(storyRef);
            if (storyDoc.exists()) {
                const currentCount = storyDoc.data().chapters_count || 0;
                await updateDoc(storyRef, { chapters_count: currentCount + 1 });
            }
            
            closeChapterModal();
            showToast('Chapter published successfully!');
            await loadChapters(currentManageStoryId);
            loadMyStories(); // Refresh dashboard stats
            
        } catch (e) {
            console.error("Error saving chapter:", e);
            showToast('Error saving chapter.');
        }
    };
`;

content = content.replace(
    'window.saveSettings = async function() {',
    js_payload + '\n\n    window.saveSettings = async function() {'
);

// Now update `handleUpload`
// find:
/*
        closeModal();
        showToast('<ion-icon name="sparkles-outline" style="vertical-align:-2px;margin-right:4px;"></ion-icon> Story published successfully!');
*/
// replace with:
/*
        const newDocRef = await addDoc(collection(db, "stories"), { ... });
        closeModal();
        showToast('<ion-icon name="sparkles-outline" style="vertical-align:-2px;margin-right:4px;"></ion-icon> Story published successfully!');
        openChapterManager(newDocRef.id, title);
*/

content = content.replace(
    'await addDoc(collection(db, "stories"), {',
    'const newDocRef = await addDoc(collection(db, "stories"), {'
);

content = content.replace(
    `closeModal();
        showToast('<ion-icon name="sparkles-outline" style="vertical-align:-2px;margin-right:4px;"></ion-icon> Story published successfully!');`,
    `closeModal();
        showToast('<ion-icon name="sparkles-outline" style="vertical-align:-2px;margin-right:4px;"></ion-icon> Story published successfully!');
        window.openChapterManager(newDocRef.id, title);`
);

// Add a click handler to the Story rows in the stories table so you can click them to open the chapter manager.
// Currently in dashboard.html:
/*
            const date = s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '--';
            const priceLabel = s.pricing_type === 'free' ? 'Free' : (s.pricing_type === 'coins' ? 'Coin Unlock' : 'Mixed');
            
            html += \`
            <tr>
              <td>
*/
content = content.replace(
    `const priceLabel = s.pricing_type === 'free' ? 'Free' : (s.pricing_type === 'coins' ? 'Coin Unlock' : 'Mixed');`,
    `const priceLabel = s.pricing_type === 'free' ? 'Free' : (s.pricing_type === 'coins' ? 'Coin Unlock' : 'Mixed');
            const safeTitle = s.title ? s.title.replace(/'/g, "\\'") : '';`
);
content = content.replace(
    `<td>
                <div class="st-cover-cell">`,
    `<td onclick="window.openChapterManager('\${s.id}', '\${safeTitle}')" style="cursor:pointer;" title="Click to manage chapters">
                <div class="st-cover-cell">`
);

fs.writeFileSync('dashboard.html', content, 'utf8');
console.log("Injected JS successfully.");
