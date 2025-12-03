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

export const evaluateMathLogic = (text) => {
    try {
        // 1. Chuẩn hóa phép toán
        const clean = text.toLowerCase()
            .replace(/x/g, '*')
            .replace(/×/g, '*')
            .replace(/:/g, '/')
            .replace(/÷/g, '/');

        // 2. Bảo mật (Whitelist Check)
        // Đã sửa Regex: bỏ escape \ thừa, chuyển dấu - xuống cuối để không bị hiểu lầm là khoảng (range)
        if (/[^0-9+*/().\s-]/.test(clean)) {
            return null;
        }

        // 3. Kiểm tra xem có phép toán nào không
        if (!/[+\-*/]/.test(clean)) return null;

        // 4. Thực thi an toàn
        const result = new Function('return ' + clean)();
        
        return (isFinite(result) && !isNaN(result)) ? Math.round(result) : null; 
    } catch {
        // Bỏ biến (e) đi vì không dùng đến để tránh lỗi ESLint
        return null;
    }
};

export const compareExpressions = (expr1, expr2) => {
    const val1 = evaluateMathLogic(expr1);
    const val2 = evaluateMathLogic(expr2);

    if (val1 === null || val2 === null) {
        return '='; 
    }

    if (val1 > val2) return '>';
    if (val1 < val2) return '<';
    return '=';
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
        .replace(/so sánh.*?(:|hai biểu thức sau|biểu thức)/g, '') // Bỏ "So sánh hai biểu thức sau:"
        .replace(/hãy chọn/g, '')
        .replace(/tìm x,? biết/g, '') // Bỏ "Tìm x biết"
        .replace(/tìm y,? biết/g, '')
        .replace(/x\s*=/g, '') // Bỏ "x =" nếu có (nhưng không bỏ dấu nhân "x")
        .replace(/hai biểu thức sau/g, '') // Bỏ "hai biểu thức sau"
        .replace(/:/g, '') // Bỏ dấu hai chấm ở cuối câu dẫn
        .trim();
};

export const solveSimpleExpression = (text) => {
    try {
        if (!text || typeof text !== 'string') return null;
        
        // ✅ FIX: Bỏ qua nếu là comparison hoặc equation question
        const textLower = text.toLowerCase();
        if (textLower.includes('...') || textLower.includes('điền dấu') || textLower.includes('tìm x')) {
            return null;
        }
        
        // Làm sạch text trước khi tính
        let clean = cleanMathText(text)
            .replace(/×/g, '*') // Thay × trước
            .replace(/\s*x\s*/g, '*') // Thay " x " (dấu nhân) nhưng không thay "x" trong biến
            .replace(/:/g, '/')
            .replace(/÷/g, '/')
            .replace(/của/g, '*')
            .replace(/,/g, '.')
            .trim();

        // Xử lý trường hợp chỉ còn lại số (ví dụ: " 500 ")
        if (/^-?\d+(\.\d+)?$/.test(clean)) return parseFloat(clean);

        // ✅ FIX: Kiểm tra xem có phải là biểu thức hợp lệ không
        // Bỏ qua nếu có dấu "..." hoặc các ký tự không hợp lệ
        if (clean.includes('...') || clean.includes('___')) return null;

        // Nếu chuỗi rỗng hoặc chứa ký tự chữ cái (trừ dấu toán học), return null
        // Cho phép: số, dấu +, -, *, /, dấu ngoặc, dấu chấm thập phân
        if (!clean || /[a-zđ]/i.test(clean.replace(/[0-9+\-*/().\s]/g, ''))) return null;

        // ✅ FIX: Kiểm tra xem có ít nhất một phép toán không
        if (!/[+\-*/]/.test(clean)) return null;

        const result = evaluate(clean);
        return (isFinite(result) && !isNaN(result)) ? parseFloat(result.toFixed(2)) : null; 
    } catch (e) {
        // ✅ FIX: Chỉ log warning nếu không phải là comparison/equation question
        const textLower = (text || '').toLowerCase();
        if (!textLower.includes('...') && !textLower.includes('tìm x')) {
            console.warn("solveSimpleExpression error:", e, "Text:", text);
        }
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

        // 2. Tách 2 vế - cải thiện pattern để bắt nhiều format hơn
        // Pattern: tìm dấu ... hoặc khoảng trắng lớn hoặc dấu phân cách
        let parts = clean.split(/(?:\.\.+|_+|…|___|\s{3,}|\s+với\s+|\s+so\s+với\s+)/i);
        
        // Nếu không tìm thấy, thử tách bằng dấu toán học ở giữa
        if (parts.length < 2) {
            // Tìm pattern: "biểu thức1 ... biểu thức2" hoặc "biểu thức1 ? biểu thức2"
            const match = clean.match(/([^...]+?)(?:\.\.+|_+|…|___|\?)([^...]+)/);
            if (match) {
                parts = [match[1].trim(), match[2].trim()];
            } else {
                // Thử tách bằng dấu toán học: tìm vị trí có dấu +, -, x, / ở giữa
                const mathOpMatch = clean.match(/(.+?[+\-×x*÷/]\d+)\s*(?:\.\.+|_+|…|___|\?)\s*(.+?[+\-×x*÷/]\d+)/);
                if (mathOpMatch) {
                    parts = [mathOpMatch[1].trim(), mathOpMatch[2].trim()];
                }
            }
        }
        
        // Lấy phần tử đầu và cuối có nội dung
        const validParts = parts.filter(p => p.trim().length > 0);
        
        if (validParts.length < 2) {
            console.warn("solveComparison: Không tìm thấy 2 vế trong:", text);
            return null;
        }

        const leftStr = validParts[0].trim();
        const rightStr = validParts[validParts.length - 1].trim();

        const val1 = solveSimpleExpression(leftStr);
        const val2 = solveSimpleExpression(rightStr);

        if (val1 === null || val2 === null || isNaN(val1) || isNaN(val2)) {
            console.warn("solveComparison: Không tính được giá trị:", { leftStr, rightStr, val1, val2 });
            return null;
        }

        // So sánh với độ chính xác số thập phân
        const diff = Math.abs(val1 - val2);
        const epsilon = 0.001; // Ngưỡng sai số cho số thập phân
        
        if (diff < epsilon) return '=';
        if (val1 > val2) return '>';
        if (val1 < val2) return '<';
        
        return '='; // Fallback
    } catch (e) { 
        console.error("Lỗi tính so sánh:", e, "Text:", text);
        return null;
    }
};

export const encodeEmail = (email) => {
    return btoa(email.toLowerCase().trim()).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};