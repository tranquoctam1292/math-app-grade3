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

export const encodeEmail = (email) => {
    return btoa(email.toLowerCase().trim()).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};