import { useState, useEffect } from 'react';
import { 
    signInAnonymously, onAuthStateChanged, signInWithCustomToken, signOut 
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db, appId } from '../lib/firebase';
import { getDeviceId, encodeEmail } from '../lib/utils';

export const useMathAuth = () => {
    const [appUser, setAppUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [authError, setAuthError] = useState(null);

    // Khởi tạo Auth
    useEffect(() => {
        const initSystemAuth = async () => {
            if (!auth) return;
            try {
                const initialAuthToken = import.meta.env.VITE_INITIAL_AUTH_TOKEN;
                if (initialAuthToken) { 
                    await signInWithCustomToken(auth, initialAuthToken); 
                } else if (!auth.currentUser) { 
                    await signInAnonymously(auth); 
                }
            } catch (e) {
                console.error("Lỗi Auth Init:", e);
                // Fallback nếu lỗi
                if (!auth.currentUser) await signInAnonymously(auth);
            }
        };

        initSystemAuth();

        const unsubscribe = onAuthStateChanged(auth, (u) => {
            if (u) {
                // Khôi phục session từ localStorage nếu có
                const savedSession = localStorage.getItem('math_app_user_session');
                if (savedSession) {
                    try {
                        const parsedUser = JSON.parse(savedSession);
                        // Đảm bảo UID luôn đúng với phiên hiện tại
                        // CHỈNH SỬA TẠI ĐÂY: Luôn sử dụng u.uid
                        const finalUid = u.uid; 
                        
                        setAppUser({ ...parsedUser, uid: finalUid });
                    } catch { 
                        localStorage.removeItem('math_app_user_session'); 
                    }
                } else {
                    // Nếu không có session lưu, coi như user ẩn danh mới
                    if (u.isAnonymous) {
                        setAppUser({ uid: u.uid, isAnon: true });
                    }
                }
            } else {
                setAppUser(null);
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, []);

    // Hàm Login (Xử lý logic device limit & merge user)
    const login = async (userAccount) => {
        const deviceId = getDeviceId();
        let devices = userAccount.devices || [];
        const isAnon = userAccount.isAnon || false;

        if (!isAnon) {
            if (!devices.includes(deviceId)) {
                if (devices.length >= 3) {
                    setAuthError("Tài khoản đã đăng nhập quá 3 thiết bị.");
                    return false;
                } else {
                    devices.push(deviceId);
                    const accountId = encodeEmail(userAccount.email);
                    const accountRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_accounts', accountId);
                    await updateDoc(accountRef, { devices });
                }
            }
        } else {
            // Nếu là ẩn danh, gán UID thật từ Firebase
            userAccount.uid = auth.currentUser?.uid;
        }

        const updatedUser = { ...userAccount, devices };
        setAppUser(updatedUser);
        localStorage.setItem('math_app_user_session', JSON.stringify(updatedUser));
        setAuthError(null);
        return true;
    };

    // Hàm Logout
    const logout = async () => {
        try {
            await signOut(auth);
            setAppUser(null);
            localStorage.removeItem('math_app_user_session');
            return true;
        } catch (e) {
            console.error("Lỗi Logout:", e);
            return false;
        }
    };

    return { appUser, setAppUser, isAuthReady, authError, setAuthError, login, logout };
};