const fs = require('fs');
const path = require('path');

const destPath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(destPath, 'utf8');

// 1. Inject Ionicons script if not present
if (!content.includes('ionicons.esm.js')) {
  content = content.replace(
    '</head>',
    `  <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
  <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
</head>`
  );
}

// 2. Replace hiw-icon contents
content = content.replace(/<div class="hiw-icon icon-pink">📖<\/div>/g, '<div class="hiw-icon icon-pink"><ion-icon name="book-outline"></ion-icon></div>');
content = content.replace(/<div class="hiw-icon icon-blue">🪙<\/div>/g, '<div class="hiw-icon icon-blue"><ion-icon name="wallet-outline"></ion-icon></div>');
content = content.replace(/<div class="hiw-icon icon-mixed">📚<\/div>/g, '<div class="hiw-icon icon-mixed"><ion-icon name="library-outline"></ion-icon></div>');
content = content.replace(/<div class="hiw-icon icon-pink">✍🏽<\/div>/g, '<div class="hiw-icon icon-pink"><ion-icon name="create-outline"></ion-icon></div>');
content = content.replace(/<div class="hiw-icon icon-blue">💸<\/div>/g, '<div class="hiw-icon icon-blue"><ion-icon name="cash-outline"></ion-icon></div>');
content = content.replace(/<div class="hiw-icon icon-mixed">🕊️<\/div>/g, '<div class="hiw-icon icon-mixed"><ion-icon name="leaf-outline"></ion-icon></div>');

// 3. Replace cat-pill emojis
content = content.replace(/<span class="cat-emoji">🙏<\/span>/g, '<ion-icon name="heart-half-outline" class="cat-emoji"></ion-icon>');
content = content.replace(/<span class="cat-emoji">📖<\/span>/g, '<ion-icon name="book-outline" class="cat-emoji"></ion-icon>');
content = content.replace(/<span class="cat-emoji">💑<\/span>/g, '<ion-icon name="heart-outline" class="cat-emoji"></ion-icon>');
content = content.replace(/<span class="cat-emoji">⚔️<\/span>/g, '<ion-icon name="shield-outline" class="cat-emoji"></ion-icon>');
content = content.replace(/<span class="cat-emoji">🌿<\/span>/g, '<ion-icon name="leaf-outline" class="cat-emoji"></ion-icon>');
content = content.replace(/<span class="cat-emoji">✍🏽<\/span>/g, '<ion-icon name="brush-outline" class="cat-emoji"></ion-icon>');
content = content.replace(/<span class="cat-emoji">🏠<\/span>/g, '<ion-icon name="home-outline" class="cat-emoji"></ion-icon>');
content = content.replace(/<span class="cat-emoji">🌍<\/span>/g, '<ion-icon name="globe-outline" class="cat-emoji"></ion-icon>');
content = content.replace(/<span class="cat-emoji">🎓<\/span>/g, '<ion-icon name="school-outline" class="cat-emoji"></ion-icon>');
content = content.replace(/<span class="cat-emoji">💼<\/span>/g, '<ion-icon name="briefcase-outline" class="cat-emoji"></ion-icon>');
content = content.replace(/<span class="cat-emoji">🕊️<\/span>/g, '<ion-icon name="eye-outline" class="cat-emoji"></ion-icon>');
content = content.replace(/<span class="cat-emoji">📚<\/span>/g, '<ion-icon name="library-outline" class="cat-emoji"></ion-icon>');

fs.writeFileSync(destPath, content, 'utf8');
console.log('Successfully updated index.html with Ionicons');
