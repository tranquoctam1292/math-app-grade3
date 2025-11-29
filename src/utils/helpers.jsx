// src/utils/helpers.jsx
// File này đã được cấu trúc lại để chỉ chứa các hàm tiện ích (non-components)
// nhằm khắc phục lỗi Fast Refresh. React component "ClayButton" đã được xóa bỏ
// vì nó được quản lý ở một file khác.

// --- DEVICE & SESSION ---

/**
 * Lấy hoặc tạo một ID duy nhất cho thiết bị và lưu vào localStorage.
 * @returns {string} ID của thiết bị.
 */
export const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
};

// --- FORMATTING ---

/**
 * Định dạng một số thành chuỗi tiền tệ Việt Nam (ví dụ: 1000 -> "1.000").
 * @param {number} value - Giá trị số cần định dạng.
 * @returns {string} Chuỗi đã định dạng.
 */
export const fmt = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value || 0);
};

// --- LOGIC & CALCULATION ---

/**
 * Giải một biểu thức toán học đơn giản dưới dạng chuỗi một cách an toàn.
 * Hỗ trợ các toán tử: +, -, *, x, :, /
 * Ví dụ: "10 + 5", "3 x 4", "12 : 2"
 * @param {string} expression - Chuỗi biểu thức cần giải.
 * @returns {number|null} Kết quả của biểu thức hoặc null nếu không hợp lệ.
 */
export const solveSimpleExpression = (expression) => {
  if (typeof expression !== 'string') return null;

  // Chuẩn hóa và làm sạch chuỗi, chỉ giữ lại các ký tự cần thiết.
  const sanitized = expression
    .replace(/×/g, '*') // Thay '×' bằng '*'
    .replace(/:/g, '/')  // Thay ':' bằng '/'
    .replace(/[^0-9+\-*/ .]/g, '') // Loại bỏ các ký tự không phải là số hoặc toán tử
    .trim();

  // Biểu thức cần phải khớp với mẫu "số toán tử số"
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
        if (b === 0) return null; // Tránh lỗi chia cho 0
        const result = a / b;
        // Trả về số nguyên nếu kết quả là số nguyên
        return Number.isInteger(result) ? result : parseFloat(result.toFixed(2));
      }
      default: return null;
    }
  } catch {
    return null; // Đảm bảo an toàn nếu có lỗi xảy ra
  }
};


// --- DATA ENCODING ---

/**
 * Mã hóa một địa chỉ email để sử dụng làm key trong Firebase Realtime Database.
 * Thay thế các ký tự không được phép ('.', '@') bằng chuỗi an toàn.
 * @param {string} email - Địa chỉ email cần mã hóa.
 * @returns {string} Chuỗi email đã được mã hóa.
 */
export const encodeEmail = (email) => {
    if (!email) return '';
    return email.replace(/\./g, ',').replace(/@/g, '_at_');
};