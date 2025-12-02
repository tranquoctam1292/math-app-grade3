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

// --- HÀM MỚI: CHUẨN HÓA GIÁ TRỊ ĐỂ SO SÁNH ---
export const normalizeVal = (val) => {
    if (val === null || val === undefined) return '';
    // Chuyển về string, trim, bỏ dấu phẩy (nếu có), chuyển về chữ thường
    const str = String(val).toLowerCase().trim().replace(/,/g, '');
    // Nếu là số học (chỉ chứa số và dấu . -), hãy ép kiểu về số để so sánh (loại bỏ số 0 vô nghĩa ở đầu: 05 -> 5)
    if (/^-?\d+(\.\d+)?$/.test(str)) {
        return parseFloat(str);
    }
    return str;
};

// --- HÀM HELPER CHUẨN HÓA DẤU SO SÁNH (Đã có sẵn trong mã gốc bạn cung cấp cho lần chỉnh sửa này) ---
export const normalizeComparisonSymbol = (val) => {
    const v = String(val).toLowerCase().trim();
    if (v === 'bằng nhau' || v === 'bằng' || v === 'equal' || v === '=') return '=';
    if (v.includes('lớn') || v === 'greater' || v === '>') return '>';
    if (v.includes('bé') || v.includes('nhỏ') || v === 'less' || v === '<') return '<';
    return v;
};

export const solveSimpleExpression = (text) => {
    try {
        const clean = text.toLowerCase()
            .replace(/x/g, '*')
            .replace(/×/g, '*')
            .replace(/:/g, '/')
            .replace(/÷/g, '/')
            .replace(/của/g, '*') // ✅ THÊM: Xử lý "1/2 của 60"
            .replace(/,/g, '.'); // ✅ THÊM: Xử lý dấu phẩy thập phân VN

        const result = evaluate(clean);
        return (isFinite(result) && !isNaN(result)) ? parseFloat(result.toFixed(2)) : null; 
    } catch {
        return null;
    }
};

// --- HÀM MỚI: GIẢI PHƯƠNG TRÌNH TÌM X ---
export const solveEquation = (text) => {
    try {
        // 1. Chuẩn hóa văn bản: bỏ "Tìm x", "biết", dấu cách thừa...
        let clean = text.toLowerCase()
            .replace(/tìm\s+x/g, '')
            .replace(/tìm\s+y/g, '')
            .replace(/biết/g, '')
            .replace(/[,;:]/g, '') // Bỏ dấu câu
            .replace(/×/g, '*')
            .replace(/x/g, '*') // Lưu ý: 'x' ở đây có thể là dấu nhân nếu AI viết thường
            .replace(/÷/g, '/')
            .replace(/của/g, '*') // ✅ THÊM
            .trim();

        // 2. Tách 2 vế dấu bằng
        const sides = clean.split('=');
        if (sides.length !== 2) return null;

        const left = sides[0].trim();
        const right = sides[1].trim(); // Vế phải thường là kết quả (số)

        // Tính giá trị vế phải
        const rightVal = evaluate(right);
        if (!isFinite(rightVal)) return null;

        // Phân tích vế trái: Chứa biến (tạm gọi là x) và 1 phép tính
        // Regex tìm số trong vế trái (Hỗ trợ số thập phân)
        const numMatch = left.match(/(\d+(\.\d+)?)/); 
        if (!numMatch) return null;
        const a = parseFloat(numMatch[0]);

        // Xác định phép toán
        if (left.includes('+')) {
            // x + a = b => x = b - a
            return rightVal - a;
        } else if (left.includes('-')) {
            // Kiểm tra vị trí của biến. 
            const indexNum = left.indexOf(numMatch[0]);
            const indexOp = left.indexOf('-');
            if (indexNum < indexOp) {
                // a - x = b => x = a - b
                return a - rightVal;
            } else {
                // x - a = b => x = b + a
                return rightVal + a;
            }
        } else if (left.includes('*')) {
            // x * a = b => x = b / a
            return rightVal / a;
        } else if (left.includes('/')) {
            const indexNum = left.indexOf(numMatch[0]);
            const indexOp = left.indexOf('/');
            if (indexNum < indexOp) {
                // a / x = b => x = a / b
                return a / rightVal;
            } else {
                // x / a = b => x = b * a
                return rightVal * a;
            }
        }
        
        return null;
    } catch (e) {
        // console.log("Lỗi giải phương trình:", e);
        console.error(e);
        return null;
    }
};

export const solveComparison = (text) => {
    try {
        if (!text.includes('...') && !text.includes(' với ')) return null;

        const separator = text.includes('...') ? '...' : ' với ';
        const parts = text.split(separator);
        
        if (parts.length !== 2) return null;

        const calcSide = (str) => {
            let clean = str.toLowerCase()
                .replace(/so sánh/g, '')
                .replace(/điền dấu/g, '')
                .replace(/compare/g, '')
                .replace(/x/g, '*')
                .replace(/×/g, '*')
                .replace(/:/g, '/')
                .replace(/÷/g, '/')
                .replace(/của/g, '*') // ✅ THÊM
                .trim();
            
            try {
                return evaluate(clean);
            } catch {
                return null;
            }
        };

        const val1 = calcSide(parts[0]);
        const val2 = calcSide(parts[1]);

        if (val1 === null || val2 === null || isNaN(val1) || isNaN(val2)) return null;

        if (val1 > val2) return '>';
        if (val1 < val2) return '<';
        return '='; // Trả về symbol chuẩn
    } catch { 
        return null;
    }
};

export const encodeEmail = (email) => {
    return btoa(email.toLowerCase().trim()).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

export const getWeakTopics = (stats) => {
    if (!stats || !stats.topics) return [];
    
    const weakList = Object.entries(stats.topics)
        .filter(([, val]) => { 
            const rate = val.total > 0 ? (val.correct / val.total) : 1;
            return rate < 0.5 && val.total >= 3;
        })
        .map(([key]) => TOPIC_TRANSLATIONS[key] || key); 

    return weakList;
};