// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- KHỞI TẠO FIREBASE ---
// Cấu hình Firebase và App ID được tải từ file .env
// Đảm bảo rằng file .env của bạn có VITE_FIREBASE_CONFIG
const firebaseConfigString = import.meta.env.VITE_FIREBASE_CONFIG;
if (!firebaseConfigString || firebaseConfigString === 'PASTE_YOUR_FIREBASE_CONFIG_OBJECT_HERE') {
    console.error("Firebase config is not set in .env file. Please set VITE_FIREBASE_CONFIG.");
    // Có thể throw error hoặc hiển thị thông báo lỗi trên UI
}

const firebaseConfig = JSON.parse(firebaseConfigString);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = import.meta.env.VITE_APP_ID || 'math-app-grade3';

// Export các đối tượng đã được khởi tạo để các file khác có thể sử dụng
export { db, auth, appId };
