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
        if (!/[\+\-\*\/x:×]/.test(text)) return null;
        const clean = text.toLowerCase()
            .replace(/x/g, '*')
            .replace(/×/g, '*')
            .replace(/:/g, '/')
            .replace(/[^\d\+\-\*\/().]/g, ' '); 
        if (!/[\+\-\*\/]/.test(clean)) return null;
        const result = new Function('return ' + clean)();
        return isNaN(result) ? null : Math.round(result); 
    } catch (e) {
        return null;
    }
};

export const encodeEmail = (email) => {
    return btoa(email.toLowerCase().trim()).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};