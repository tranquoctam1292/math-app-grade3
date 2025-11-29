// src/lib/utils.js

// --- DEVICE & SESSION ---

// Lấy hoặc tạo một ID duy nhất cho thiết bị
export const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
};

// --- FORMATTING ---

// Định dạng số thành dạng tiền tệ (không có phần thập phân)
export const fmt = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value || 0);
};

// --- LOGIC & CALCULATION ---

/**
 * Giải một biểu thức toán học đơn giản một cách an toàn.
 * Hỗ trợ các phép tính: +, -, *, x, :, /
 * Ví dụ: "10 + 5", "3 x 4", "12 : 2"
 * Trả về null nếu biểu thức không hợp lệ hoặc phức tạp.
 */
export const solveSimpleExpression = (expression) => {
  if (typeof expression !== 'string') return null;

  const sanitized = expression
    .replace(/×/g, '*')
    .replace(/:/g, '/')
    .replace(/[^0-9+\-*/ .]/g, '') 
    .trim();

  const match = sanitized.match(/^(\d+)\s*([+\-*/])\s*(\d+)$/);
  
  if (!match) return null;

  const [, num1, operator, num2] = match;
  const a = parseInt(num1, 10);
  const b = parseInt(num2, 10);

  try {
    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': {
        if (b === 0) return null;
        const result = a / b;
        return Number.isInteger(result) ? result : parseFloat(result.toFixed(2));
      }
      default: return null;
    }
  } catch {
    return null; // An toàn là trên hết
  }
};


// --- DATA ENCODING ---

// Mã hóa email để dùng làm key trong Firebase (thay thế các ký tự không hợp lệ)
export const encodeEmail = (email) => {
    if (!email) return '';
    return email.replace(/\./g, ',').replace(/@/g, '_at_');
};
