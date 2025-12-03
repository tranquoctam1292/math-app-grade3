import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, appId } from './firebase';

let functionsInstance = null;

const getFunctionsInstance = () => {
    if (!functionsInstance && app) {
        functionsInstance = getFunctions(app, 'us-central1');
    }
    return functionsInstance;
};

export const secureUpdatePiggyBank = async (delta, reason) => {
    const functions = getFunctionsInstance();
    if (!functions) {
        throw new Error('Firebase chưa được khởi tạo.');
    }
    
    try {
        const fn = httpsCallable(functions, 'updatePiggyBank');
        const res = await fn({ delta, reason, appId });
        return res.data;
    } catch (error) {
        // Xử lý lỗi CORS hoặc network
        if (error.code === 'functions/unavailable' || 
            error.message?.includes('CORS') || 
            error.message?.includes('network') ||
            error.code === 'internal') {
            console.warn("Cloud Function không khả dụng, có thể chưa được deploy:", error);
            throw new Error('Cloud Function chưa sẵn sàng. Vui lòng thử lại sau hoặc liên hệ admin để deploy function.');
        }
        throw error;
    }
};


