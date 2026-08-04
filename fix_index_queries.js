const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// 1. Fix the top trending query
content = content.replace(
    'const q = query(collection(db, "stories"), orderBy("total_reads", "desc"), limit(8));',
    'const q = query(collection(db, "stories"), where("status", "==", "live"), orderBy("total_reads", "desc"), limit(8));'
);

// 2. Fix the all stories query (used for stats)
content = content.replace(
    'const storiesSnap = await getDocs(collection(db, "stories"));',
    'const storiesSnap = await getDocs(query(collection(db, "stories"), where("status", "==", "live")));'
);

// Ensure `where` is imported in index.html
if (!content.includes(', where }')) {
    content = content.replace(
        `import { db, collection, getDocs, query, orderBy, limit } from './firebase-config.js';`,
        `import { db, collection, getDocs, query, orderBy, limit, where } from './firebase-config.js';`
    );
}

fs.writeFileSync('index.html', content, 'utf8');
console.log("Fixed index.html queries");
