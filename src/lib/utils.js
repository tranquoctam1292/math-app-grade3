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

export const solveSimpleExpression = (text) => {
    try {
        const clean = text.toLowerCase()
            .replace(/x/g, '*')
            .replace(/×/g, '*')
            .replace(/:/g, '/')
            .replace(/÷/g, '/');

        const result = evaluate(clean);
        return (isFinite(result) && !isNaN(result)) ? Math.round(result) : null; 
    } catch {
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
                .trim();
            
            if (/^\d+$/.test(clean)) return parseInt(clean);
            if (!clean) return null;

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
        return '=';
    } catch { 
        return null;
    }
};

export const encodeEmail = (email) => {
    return btoa(email.toLowerCase().trim()).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

// --- NEW: Hàm phân tích điểm yếu (Đã sửa lỗi biến unused) ---
export const getWeakTopics = (stats) => {
    if (!stats || !stats.topics) return [];
    
    // Lọc ra các chủ đề có tỷ lệ đúng < 50%
    // Sử dụng _ cho biến key nếu không dùng, nhưng ở đây ta cần key để map
    const weakList = Object.entries(stats.topics)
        .filter(([, val]) => { // Bỏ qua 'key' ở đây vì chưa cần dùng trong filter
            const rate = val.total > 0 ? (val.correct / val.total) : 1;
            return rate < 0.5 && val.total >= 3;
        })
        .map(([key]) => TOPIC_TRANSLATIONS[key] || key); 

    return weakList;
};