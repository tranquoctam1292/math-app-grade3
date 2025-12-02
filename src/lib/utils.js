import { evaluate } from 'mathjs';
import { TOPIC_TRANSLATIONS } from './constants';

export const getDeviceId = () => {
    let deviceId = localStorage.getItem('math_app_device_id');
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('math_app_device_id', deviceId);
    }
    return deviceId;
};

export const fmt = (num) => {
    if (num === null || num === undefined) return "0";
    if (/[a-zA-Z]/.test(String(num))) return String(num); 
    return String(parseInt(num)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const normalizeVal = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val).toLowerCase().trim().replace(/,/g, '');
    if (/^-?\d+(\.\d+)?$/.test(str)) {
        return parseFloat(str);
    }
    return str;
};

export const normalizeComparisonSymbol = (val) => {
    const v = String(val).toLowerCase().trim();
    if (['bằng nhau', 'bằng', 'equal', '=', 'eq'].includes(v)) return '=';
    if (v.includes('lớn') || v === 'greater' || v === 'gt' || v === '>') return '>';
    if (v.includes('bé') || v.includes('nhỏ') || v === 'less' || v === 'lt' || v === '<') return '<';
    return v;
};

// --- HÀM LÀM SẠCH TEXT (QUAN TRỌNG) ---
const cleanMathText = (text) => {
    return text.toLowerCase()
        .replace(/điền dấu.*?(:|vào chỗ chấm)/g, '') // Bỏ "Điền dấu..."
        .replace(/kết quả của phép tính/g, '')
        .replace(/giá trị của biểu thức/g, '')
        .replace(/tính nhẩm/g, '')
        .replace(/tính/g, '')
        .replace(/so sánh/g, '')
        .replace(/hãy chọn/g, '')
        .replace(/tìm x,? biết/g, '') // Bỏ "Tìm x biết"
        .replace(/tìm y,? biết/g, '')
        .replace(/x\s*=/g, '') // Bỏ "x =" nếu có
        .replace(/:/g, '') // Bỏ dấu hai chấm ở cuối câu dẫn
        .trim();
};

export const solveSimpleExpression = (text) => {
    try {
        // Làm sạch text trước khi tính
        let clean = cleanMathText(text)
            .replace(/x/g, '*')
            .replace(/×/g, '*')
            .replace(/:/g, '/')
            .replace(/÷/g, '/')
            .replace(/của/g, '*')
            .replace(/,/g, '.')
            .trim();

        // Xử lý trường hợp chỉ còn lại số (ví dụ: " 500 ")
        if (/^-?\d+(\.\d+)?$/.test(clean)) return parseFloat(clean);

        // Nếu chuỗi rỗng hoặc chứa ký tự lạ, return null
        if (!clean || /[a-zđ]/.test(clean)) return null;

        const result = evaluate(clean);
        return (isFinite(result) && !isNaN(result)) ? parseFloat(result.toFixed(2)) : null; 
    } catch {
        return null;
    }
};

export const solveEquation = (text) => {
    try {
        let clean = cleanMathText(text)
            .replace(/×/g, '*')
            .replace(/x/g, '*') // Lưu ý: ở đây coi x là dấu nhân sau khi đã remove chữ "tìm x"
            .replace(/÷/g, '/')
            .trim();

        // Phương trình phải có dấu bằng
        const sides = clean.split('=');
        if (sides.length !== 2) return null;

        const left = sides[0].trim();
        const right = sides[1].trim();

        const rightVal = evaluate(right);
        if (!isFinite(rightVal)) return null;

        // Tìm số trong vế trái
        const numMatch = left.match(/(\d+(\.\d+)?)/); 
        if (!numMatch) return null;
        const a = parseFloat(numMatch[0]);

        if (left.includes('+')) return rightVal - a;
        else if (left.includes('-')) {
            const indexNum = left.indexOf(numMatch[0]);
            const indexOp = left.indexOf('-');
            return indexNum < indexOp ? a - rightVal : rightVal + a;
        } else if (left.includes('*')) return rightVal / a;
        else if (left.includes('/')) {
            const indexNum = left.indexOf(numMatch[0]);
            const indexOp = left.indexOf('/');
            return indexNum < indexOp ? a / rightVal : rightVal * a;
        }
        
        return null;
    } catch {
        return null;
    }
};

export const solveComparison = (text) => {
    try {
        // 1. Làm sạch câu dẫn (Đây là bước sửa lỗi quan trọng nhất)
        // Ví dụ: "Điền dấu...: 15 + 9 ... 32 - 8" -> "15 + 9 ... 32 - 8"
        const clean = cleanMathText(text);

        // 2. Tách 2 vế
        const parts = clean.split(/(?:\.\.+|_+|\?|;|với|\s{2,})/i);
        
        // Lấy phần tử đầu và cuối có nội dung
        const validParts = parts.filter(p => p.trim().length > 0);
        
        if (validParts.length < 2) return null;

        const leftStr = validParts[0];
        const rightStr = validParts[validParts.length - 1];

        const val1 = solveSimpleExpression(leftStr);
        const val2 = solveSimpleExpression(rightStr);

        if (val1 === null || val2 === null || isNaN(val1) || isNaN(val2)) return null;

        if (val1 > val2) return '>';
        if (val1 < val2) return '<';
        return '='; 
    } catch (e) { 
        console.error("Lỗi tính so sánh:", e);
        return null;
    }
};

export const encodeEmail = (email) => {
    return btoa(email.toLowerCase().trim()).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

export const getWeakTopics = (stats) => {
    if (!stats || !stats.topics) return [];
    return Object.entries(stats.topics)
        .filter(([, val]) => { 
            const rate = val.total > 0 ? (val.correct / val.total) : 1;
            return rate < 0.5 && val.total >= 3;
        })
        .map(([key]) => TOPIC_TRANSLATIONS[key] || key); 
};

export const getDeviceLabel = () => {
    try {
        const ua = navigator?.userAgent || 'Thiết bị';
        const platform = navigator?.platform || '';
        const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/i);
        const browser = browserMatch ? browserMatch[1] : 'Trình duyệt';
        if (platform) return `${platform} • ${browser}`;
        return `${browser} • Web`;
    } catch {
        return 'Thiết bị chưa xác định';
    }
};

const digestToHex = (buffer) => Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');

export const hashParentPin = async (pin) => {
    if (!pin) return null;
    const encoder = new TextEncoder();
    const data = encoder.encode(String(pin).trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return digestToHex(hashBuffer);
};

export const verifyParentPin = async (pin, pinHash) => {
    if (!pinHash) return false;
    const hashed = await hashParentPin(pin);
    return hashed === pinHash;
};