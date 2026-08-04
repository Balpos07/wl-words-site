import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  where,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
// (Optional) Analytics could be imported similarly if needed, but omitted here to keep it simple.

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRYgVFDrcoDfdJlzp3owXjUDAD7G4p0ec",
  authDomain: "wl-words-app.firebaseapp.com",
  projectId: "wl-words-app",
  storageBucket: "wl-words-app.firebasestorage.app",
  messagingSenderId: "283908029329",
  appId: "1:283908029329:web:1ff8a2e45ab1973882b830",
  measurementId: "G-Y7BQ5V84R8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Exporting functions for use in other HTML files (via module scripts)
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  where,
  updateDoc
};

// Global Auth State Observer (runs automatically on every page load)
onAuthStateChanged(auth, (user) => {
  const navCtas = document.querySelector('.nav-ctas');
  
  if (user) {
    // Make auth globally accessible for inline scripts just in case
    window.currentUser = user;
    
    // Update navigation bar if it exists on the page
    if (navCtas) {
      navCtas.innerHTML = `
        <a class="btn-ghost" id="globalLogoutBtn" style="cursor:pointer;">Sign Out</a>
        <a class="btn-primary" href="dashboard.html">Dashboard</a>
      `;
      document.getElementById('globalLogoutBtn').addEventListener('click', () => {
        signOut(auth).then(() => {
          window.location.href = 'index.html';
        });
      });
    }
  } else {
    window.currentUser = null;
    
    if (navCtas) {
      navCtas.innerHTML = `
        <a class="btn-ghost" href="auth.html">Sign In</a>
        <a class="btn-primary" href="browse.html">Start Reading</a>
      `;
    }
  }
});