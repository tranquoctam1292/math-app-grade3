// src/lib/utils.js

// --- DEVICE & SESSION ---
export const getDeviceId = () => {
    let deviceId = localStorage.getItem('math_app_device_id');
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('math_app_device_id', deviceId);
    }
    return deviceId;
};

// --- FORMATTING ---
export const fmt = (num) => {
    if (num === null || num === undefined) return "0";
    if (/[a-zA-Z]/.test(String(num))) return String(num); 
    return new Intl.NumberFormat('vi-VN').format(parseInt(num));
};


// --- LOGIC & CALCULATION ---
export const solveSimpleExpression = (expression) => {
  if (typeof expression !== 'string') return null;

  // Chuẩn hóa ký hiệu phép nhân và chia
  const sanitized = expression
    .toLowerCase()
    .replace(/x/g, '*')
    .replace(/×/g, '*')
    .replace(/:/g, '/')
    .replace(/[^0-9+\-*/().]/g, ' ') 
    .replace(/(\s{2,})/g, ' ') 
    .trim();

  // Kiểm tra xem có phép toán nào không và không phải là tìm X
  if (!/[+\-*/]/.test(sanitized) || sanitized.includes('x')) return null;

  try {
    // Đánh giá biểu thức
    const result = new Function('return ' + sanitized)();
    if (isNaN(result) || !isFinite(result)) return null;

    // Chỉ trả về số nguyên (Toán lớp 3)
    return Number.isInteger(result) ? result : null; 
  } catch {
    return null; 
  }
};


// --- DATA ENCODING ---
export const encodeEmail = (email) => {
    if (!email) return '';
    // Mã hóa base64 để tránh các ký tự đặc biệt trong Firestore key
    return btoa(email.toLowerCase().trim()).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};
