const fs = require('fs');

let content = fs.readFileSync('story.html', 'utf8');

// 1. Update the buttons to call toggleBookmark()
content = content.replace(
    '<button class="btn-bookmark">',
    '<button class="btn-bookmark" onclick="toggleBookmark()" id="btnBookmark1">'
);

content = content.replace(
    `<button class="tool-btn" title="Bookmark" onclick="this.classList.toggle('active')">`,
    `<button class="tool-btn" title="Bookmark" onclick="toggleBookmark()" id="btnBookmark2">`
);

// 2. Add the javascript logic to the end of the inline module script
const bookmarkLogic = `
  // --- Bookmark Logic ---
  
  window.toggleBookmark = async function() {
      if (!window.currentUser) {
          alert("Please log in to bookmark stories.");
          return;
      }
      
      if (!storyId) return;
      
      try {
          const userRef = doc(db, "users", window.currentUser.uid);
          
          let bookmarkedIds = window.userData ? (window.userData.bookmarks || []) : [];
          const isBookmarked = bookmarkedIds.includes(storyId);
          
          if (isBookmarked) {
              bookmarkedIds = bookmarkedIds.filter(id => id !== storyId);
              document.getElementById('btnBookmark1').innerHTML = '<ion-icon name="bookmark-outline"></ion-icon> Save for Later';
              document.getElementById('btnBookmark2').classList.remove('active');
          } else {
              bookmarkedIds.push(storyId);
              document.getElementById('btnBookmark1').innerHTML = '<ion-icon name="bookmark"></ion-icon> Saved to Library';
              document.getElementById('btnBookmark2').classList.add('active');
          }
          
          await updateDoc(userRef, { bookmarks: bookmarkedIds });
          if (window.userData) window.userData.bookmarks = bookmarkedIds;
          
      } catch (e) {
          console.error("Error toggling bookmark:", e);
      }
  };
  
  // We need to also check if it's bookmarked on load to set the initial button states
  window.checkInitialBookmarkState = function() {
      if (!window.currentUser || !storyId) return;
      const bookmarkedIds = window.userData ? (window.userData.bookmarks || []) : [];
      if (bookmarkedIds.includes(storyId)) {
          const btn1 = document.getElementById('btnBookmark1');
          if (btn1) btn1.innerHTML = '<ion-icon name="bookmark"></ion-icon> Saved to Library';
          const btn2 = document.getElementById('btnBookmark2');
          if (btn2) btn2.classList.add('active');
      }
  };
`;

content = content.replace(
    '// Run directly',
    bookmarkLogic + '\n  // Run directly'
);

// We need to call checkInitialBookmarkState after we load user data.
// In story.html, in onAuthStateChanged:
const authStateInjection = `
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            window.userData = userSnap.data();
            if (typeof window.checkInitialBookmarkState === 'function') {
                window.checkInitialBookmarkState();
            }
        }
`;

content = content.replace(
    `const letter = user.email.charAt(0).toUpperCase();`,
    `const letter = user.email.charAt(0).toUpperCase();\n${authStateInjection}`
);

fs.writeFileSync('story.html', content, 'utf8');
console.log("Injected Bookmarking successfully.");
