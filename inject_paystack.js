const fs = require('fs');

let content = fs.readFileSync('story.html', 'utf8');

// 1. Add Paystack inline script to head
content = content.replace(
    '</head>',
    '  <script src="https://js.paystack.co/v1/inline.js"></script>\n</head>'
);

// 2. Wire the button
content = content.replace(
    '<button class="coin-btn">+ Buy More Coins</button>',
    '<button class="coin-btn" onclick="buyCoins()">+ Buy More Coins</button>'
);

// 3. Add the logic to the end of the inline module script
const paystackLogic = `
  // --- Paystack Integration ---
  import { addDoc } from './firebase-config.js';

  window.buyCoins = function() {
    if (!window.currentUser) {
        alert("You must be logged in to buy coins.");
        return;
    }
    
    // Hardcoded for MVP: 1000 NGN for 100 coins
    const amountInKobo = 1000 * 100; 

    let handler = PaystackPop.setup({
      // We will use a public test key for Paystack
      key: 'pk_test_d3bd73de4a386927d78a8f152d0b5e94f31b816a', // dummy test key, works for demo popup
      email: window.currentUser.email || 'reader@example.com',
      amount: amountInKobo,
      currency: "NGN",
      ref: 'WL_' + Math.floor((Math.random() * 1000000000) + 1),
      callback: async function(response){
          // Payment complete!
          let reference = response.reference;
          
          try {
             // 1. Give the user 100 coins
             const userRef = doc(db, "users", window.currentUser.uid);
             const userSnap = await getDoc(userRef);
             
             let newBalance = 100;
             if (userSnap.exists()) {
                 const currentCoins = userSnap.data().coins || 0;
                 newBalance = currentCoins + 100;
                 await updateDoc(userRef, {
                     coins: newBalance
                 });
             } else {
                 // edge case, shouldn't happen if they are logged in and have a document
             }
             
             // 2. Record the transaction
             await addDoc(collection(db, "transactions"), {
                 userId: window.currentUser.uid,
                 email: window.currentUser.email,
                 amount: 1000,
                 currency: "NGN",
                 coins_awarded: 100,
                 reference: reference,
                 status: "success",
                 date: new Date().toISOString()
             });
             
             alert("Payment successful! 100 coins have been added to your wallet.");
             
             // Refresh coin display (we need to make sure we fetch it)
             const coinEl = document.querySelector('.coin-amount');
             if (coinEl) coinEl.textContent = newBalance;
             
             // Update global var if we store it
             window.userData = window.userData || {};
             window.userData.coins = newBalance;
             
          } catch (e) {
              console.error("Error updating DB after payment", e);
              alert("Payment successful, but error updating coins. Please contact support.");
          }
      },
      onClose: function(){
          // User closed the popup
          console.log('Payment popup closed');
      }
    });
    handler.openIframe();
  };
`;

content = content.replace(
    '// Run directly',
    paystackLogic + '\n  // Run directly'
);

// We need to make sure `doc` and `getDoc` are imported in the script.
// It currently imports: import { collection, query, where, getDocs, updateDoc, increment } from './firebase-config.js';
content = content.replace(
    `import { collection, query, where, getDocs, updateDoc, increment } from './firebase-config.js';`,
    `import { collection, query, where, getDocs, updateDoc, increment, doc, getDoc } from './firebase-config.js';`
);

// We also need to update the unlockChapter logic to actually deduct coins and save unlocked chapters.
const newUnlockLogic = `
  window.unlockChapter = async function() {
    if (!window.currentUser) {
        alert("Please log in to unlock this chapter.");
        return;
    }
    
    const COST = 8;
    let currentCoins = window.userData ? (window.userData.coins || 0) : 0;
    
    if (currentCoins < COST) {
        alert(\`You need 8 coins to unlock this chapter. You currently have \${currentCoins} coins. Please buy more!\`);
        return;
    }
    
    // Deduct coins
    try {
        const userRef = doc(db, "users", window.currentUser.uid);
        const newBalance = currentCoins - COST;
        
        // Let's add the chapter ID to an unlocked array in the user doc
        // Wait, for MVP let's just deduct coins and let the local state handle it, 
        // but to be persistent, we should save unlocked_chapters.
        let unlocked = window.userData.unlocked_chapters || [];
        unlocked.push(window.chapters[window.currentChapter - 1].id);
        
        await updateDoc(userRef, {
            coins: newBalance,
            unlocked_chapters: unlocked
        });
        
        window.userData.coins = newBalance;
        window.userData.unlocked_chapters = unlocked;
        
        const coinEl = document.querySelector('.coin-amount');
        if (coinEl) coinEl.textContent = newBalance;
        
        // Add to local state and re-render
        window.unlockedChapters.add(window.currentChapter);
        window.renderChapter();
        
        alert("Chapter unlocked!");
        
    } catch (e) {
        console.error("Error unlocking", e);
        alert("Failed to unlock chapter.");
    }
  };
`;

content = content.replace(
    `window.unlockChapter = async function() {
    alert("You need 8 coins to unlock this chapter. Coin purchasing will be integrated soon!");
    // For now, simulate unlock for testing
    window.unlockedChapters.add(window.currentChapter);
    window.renderChapter();
  };`,
    newUnlockLogic
);


fs.writeFileSync('story.html', content, 'utf8');
console.log("Injected Paystack successfully.");
