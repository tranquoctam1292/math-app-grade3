import { useState, useEffect } from 'react';
import { 
    onAuthStateChanged, signInWithCustomToken, signOut 
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
                // Kiểm tra token từ biến môi trường (dùng cho test/dev nếu có)
                const initialAuthToken = import.meta.env.VITE_INITIAL_AUTH_TOKEN;
                if (initialAuthToken) { 
                    await signInWithCustomToken(auth, initialAuthToken); 
                } 
                
                // ❌ ĐÃ SỬA: Xoá bỏ đoạn tự động signInAnonymously ở đây.
                // Việc đăng nhập (kể cả ẩn danh) phải do người dùng kích hoạt từ AuthScreen.
                
            } catch (e) {
                console.error("Lỗi Auth Init:", e);
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
                        // Đảm bảo UID luôn đúng với phiên hiện tại của Firebase
                        const finalUid = u.uid; 
                        setAppUser({ ...parsedUser, uid: finalUid });
                    } catch { 
                        // Nếu JSON lỗi, thử fallback
                        localStorage.removeItem('math_app_user_session'); 
                        if (u.isAnonymous) {
                            setAppUser({ uid: u.uid, isAnon: true });
                        }
                    }
                } else {
                    // Nếu Firebase nhớ user (do persistence) nhưng localStorage mất (xoá cache)
                    // Ta vẫn khôi phục lại trạng thái đăng nhập
                    if (u.isAnonymous) {
                        setAppUser({ uid: u.uid, isAnon: true });
                    }
                    // Lưu ý: Nếu user là Google/Email login mà mất localStorage, 
                    // họ sẽ cần login lại để lấy lại thông tin userAccount đầy đủ (tên, avatar...),
                    // hoặc bạn có thể fetch lại từ Firestore ở đây nếu muốn.
                }
            } else {
                // Không có user (đã logout hoặc chưa login) -> AppUser = null
                setAppUser(null);
            }
            // Đánh dấu hệ thống Auth đã sẵn sàng
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, []);

    // Hàm Login (Xử lý logic device limit & merge user)
    // Hàm này được gọi SAU KHI Firebase đã sign-in thành công (bởi AuthScreen)
    const login = async (userAccount) => {
        const deviceId = getDeviceId();
        let devices = userAccount.devices || [];
        const isAnon = userAccount.isAnon || false;

        if (!isAnon) {
            if (!devices.includes(deviceId)) {
                if (devices.length >= 3) {
                    setAuthError("Tài khoản đã đăng nhập quá 3 thiết bị.");
                    // Nếu vượt quá giới hạn, sign out ngay lập tức
                    await signOut(auth);
                    return false;
                } else {
                    devices.push(deviceId);
                    try {
                        const accountId = encodeEmail(userAccount.email);
                        const accountRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_accounts', accountId);
                        await updateDoc(accountRef, { devices });
                    } catch (e) {
                        console.warn("Lỗi cập nhật thiết bị:", e);
                        // Không chặn login nếu lỗi cập nhật Firestore phụ
                    }
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
            localStorage.removeItem('math_app_last_profile_id'); // Xoá luôn nhớ profile để sạch sẽ
            return true;
        } catch (e) {
            console.error("Lỗi Logout:", e);
            return false;
        }
    };

    return { appUser, setAppUser, isAuthReady, authError, setAuthError, login, logout };
};