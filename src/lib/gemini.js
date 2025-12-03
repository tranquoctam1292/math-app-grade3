import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase'; // Đảm bảo export app từ firebase.js

// Khởi tạo Functions service
const functions = getFunctions(app, 'us-central1'); // Region phải khớp với lúc deploy function

export const callGemini = async (prompt) => {
  const generateQuestions = httpsCallable(functions, 'generateQuestions');

  try {
    const result = await generateQuestions({ prompt: prompt });
    // Cloud Function v2 onCall trả về data trong result.data
    return result.data;
  } catch (error) {
    console.error("Lỗi gọi Cloud Function:", error);
    // Trả về null để App.jsx biết mà chuyển sang chế độ Offline/Backup
    return null;
  }
};