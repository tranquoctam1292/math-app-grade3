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
        // 1. Chuẩn hóa phép toán
        const clean = text.toLowerCase()
            .replace(/x/g, '*')
            .replace(/×/g, '*')
            .replace(/:/g, '/')
            .replace(/÷/g, '/');

        // 2. Bảo mật (Whitelist Check)
        if (/[^0-9+*/().\s-]/.test(clean)) {
            return null;
        }

        // 3. Kiểm tra xem có phép toán nào không
        if (!/[+\-*/]/.test(clean)) return null;

        // 4. Thực thi an toàn
        const result = new Function('return ' + clean)();
        
        return (isFinite(result) && !isNaN(result)) ? Math.round(result) : null; 
    } catch {
        return null;
    }
};

// --- HÀM MỚI: XỬ LÝ BÀI TOÁN SO SÁNH ---
export const solveComparison = (text) => {
    try {
        // Chỉ xử lý nếu có dấu "..." hoặc từ "với" làm mốc so sánh
        if (!text.includes('...') && !text.includes(' với ')) return null;

        const separator = text.includes('...') ? '...' : ' với ';
        const parts = text.split(separator);
        
        if (parts.length !== 2) return null;

        // Hàm helper để tính giá trị một vế
        const calcSide = (str) => {
            // Lấy phần số và phép toán, loại bỏ chữ cái (ví dụ: "So sánh 5" -> "5")
            let clean = str.toLowerCase()
                .replace(/so sánh/g, '')
                .replace(/điền dấu/g, '')
                .replace(/compare/g, '')
                .replace(/x/g, '*')
                .replace(/×/g, '*')
                .replace(/:/g, '/')
                .replace(/÷/g, '/')
                .trim();
            
            // Nếu chỉ là số thì parse luôn
            if (/^\d+$/.test(clean)) return parseInt(clean);

            // Nếu là biểu thức thì dùng Function (nhưng phải check whitelist trước)
            if (/[^0-9+*/().\s-]/.test(clean)) return null; 
            if (!clean) return null;

            try {
                return new Function('return ' + clean)();
            } catch {
                return null;
            }
        };

        const val1 = calcSide(parts[0]);
        const val2 = calcSide(parts[1]);

        // Nếu không tính được một trong hai vế thì bỏ qua
        if (val1 === null || val2 === null || isNaN(val1) || isNaN(val2)) return null;

        if (val1 > val2) return '>';
        if (val1 < val2) return '<';
        return '=';
    } catch { 
        // ĐÃ SỬA: Bỏ (e) ở đây để hết lỗi ESLint
        return null;
    }
};

export const encodeEmail = (email) => {
    return btoa(email.toLowerCase().trim()).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};