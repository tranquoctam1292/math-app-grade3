// src/lib/helpers.js
import React from 'react';

// --- UI COMPONENTS ---

// Một component Button đơn giản với style giống đất sét (claymorphism)
export const ClayButton = ({ onClick, children, className = '', disabled = false }) => {
  const baseClasses = "font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const colorClasses = "bg-indigo-500 text-white border-b-4 border-indigo-700 hover:bg-indigo-400";
  
  return (
    <button onClick={onClick} className={`${baseClasses} ${colorClasses} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
};


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

  // Chỉ xử lý các biểu thức đơn giản, không chứa chữ cái (ngoại trừ 'x' cho phép nhân)
  // và các ký tự không cần thiết.
  const sanitized = expression
    .replace(/×/g, '*')
    .replace(/:/g, '/')
    .replace(/[^0-9\+\-\*\/ \.]/g, '') 
    .trim();

  // Biểu thức phải ở dạng "số toán tử số"
  const match = sanitized.match(/^(\d+)\s*([\+\-\*\/])\s*(\d+)$/);
  
  if (!match) return null;

  const [, num1, operator, num2] = match;
  const a = parseInt(num1, 10);
  const b = parseInt(num2, 10);

  try {
    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': 
        // Tránh lỗi chia cho 0 và đảm bảo là số nguyên nếu có thể
        if (b === 0) return null;
        const result = a / b;
        return Number.isInteger(result) ? result : parseFloat(result.toFixed(2));
      default: return null;
    }
  } catch (e) {
    return null; // An toàn là trên hết
  }
};


// --- DATA ENCODING ---

// Mã hóa email để dùng làm key trong Firebase (thay thế các ký tự không hợp lệ)
export const encodeEmail = (email) => {
    if (!email) return '';
    return email.replace(/\./g, ',').replace(/@/g, '_at_');
};
