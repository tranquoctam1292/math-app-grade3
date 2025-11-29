/* global __firebase_config, __app_id */
// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- KHỞI TẠO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCPQ1wy4j-z0yW1N3K2TSUzyJnDhUWe17Y",
  authDomain: "math-app-v1-6ddcf.firebaseapp.com",
  projectId: "math-app-v1-6ddcf",
  storageBucket: "math-app-v1-6ddcf.firebasestorage.app",
  messagingSenderId: "974155148852",
  appId: "1:974155148852:web:84a7c92599fd36ed596461",
  measurementId: "G-XY875PTQTW"
};

const appId = firebaseConfig.appId;

// Khởi tạo các biến
let app, db, auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
} catch (error) {
    console.error("Lỗi khởi tạo Firebase:", error);
    app = null;
    db = null;
    auth = null;
}

// Export ở cấp cao nhất (Top-level)
export { db, auth, appId };