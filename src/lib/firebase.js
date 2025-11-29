/* global __firebase_config, __app_id */
// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- KHỞI TẠO FIREBASE ---
// 1. Cố gắng đọc từ biến global (Canvas Environment)
// Chúng ta đã khai báo global ở dòng 1 để tránh lỗi ESLint
const globalConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const globalAppId = typeof __app_id !== 'undefined' ? __app_id : null;

// 2. Cố gắng đọc từ biến môi trường Vite (cho môi trường phát triển)
const viteConfigString = import.meta.env.VITE_FIREBASE_CONFIG;
const viteConfig = viteConfigString ? JSON.parse(viteConfigString) : null;
const viteAppId = import.meta.env.VITE_APP_ID;

// 3. Chọn cấu hình ưu tiên (Global > Vite > Default)
const firebaseConfig = globalConfig || viteConfig;
const appId = globalAppId || viteAppId || 'math-app-grade3';

// Khởi tạo các biến
let app, db, auth;

if (!firebaseConfig) {
    console.error("LỖI CẤU HÌNH: Firebase config không được tìm thấy. Vui lòng kiểm tra file .env của bạn.");
    // Gán giá trị null để các file khác có thể kiểm tra và xử lý
    app = null;
    db = null;
    auth = null;
} else {
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
}

// Export ở cấp cao nhất (Top-level)
export { db, auth, appId };