import { useState, useEffect, useCallback } from 'react';
import { 
    onAuthStateChanged, signInWithCustomToken, signOut 
} from 'firebase/auth';
import { doc, updateDoc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, appId } from '../lib/firebase';
import { getDeviceId, encodeEmail, getDeviceLabel } from '../lib/utils';

export const useMathAuth = () => {
    const [appUser, setAppUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [deviceSessions, setDeviceSessions] = useState([]);

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
    const getAccountRef = (email) => doc(db, 'artifacts', appId, 'public', 'data', 'math_accounts', encodeEmail(email));

    const fetchAccountData = async (email) => {
        if (!email) return { devices: [], deviceSessions: [] };
        const currentUid = auth.currentUser?.uid;
        if (!currentUid) {
            throw new Error("Người dùng chưa được xác thực");
        }
        
        const ref = getAccountRef(email);
        try {
            const snap = await getDoc(ref);
            if (!snap.exists()) {
                // Document chưa tồn tại, tạo mới
                try {
                    await setDoc(ref, { email, ownerUid: currentUid, devices: [], deviceSessions: [] });
                    return { email, ownerUid: currentUid, devices: [], deviceSessions: [] };
                } catch (createError) {
                    console.error("Lỗi tạo document math_accounts:", createError);
                    // Nếu lỗi permissions, ném lại để AuthScreen xử lý
                    if (createError.code === 'permission-denied' || createError.message?.includes('permission')) {
                        throw new Error("Không có quyền tạo tài khoản. Vui lòng kiểm tra Firestore rules.");
                    }
                    throw createError;
                }
            }
            
            // Document đã tồn tại, kiểm tra và cập nhật owner nếu cần
            const data = snap.data();
            
            // Nếu document không có ownerUid hoặc ownerUid không khớp, cập nhật lại
            // (Có thể do document được tạo từ trước khi có logic ownerUid)
            if (!data.ownerUid || data.ownerUid !== currentUid) {
                try {
                    await updateDoc(ref, { ownerUid: currentUid });
                    data.ownerUid = currentUid;
                } catch (updateError) {
                    console.warn("Không thể cập nhật ownerUid:", updateError);
                    // Nếu không cập nhật được nhưng ownerUid rỗng, vẫn cho phép tiếp tục
                    if (!data.ownerUid) {
                        data.ownerUid = currentUid;
                    } else {
                        // Nếu ownerUid khác và không cập nhật được, ném lỗi
                        throw new Error("Không có quyền truy cập tài khoản này. Chỉ chủ sở hữu mới có thể truy cập.");
                    }
                }
            }
            
            return data;
        } catch (error) {
            console.error("Lỗi fetchAccountData:", error);
            // Nếu lỗi permissions, ném lại để AuthScreen xử lý
            if (error.code === 'permission-denied' || error.message?.includes('permission') || error.message?.includes('quyền')) {
                throw new Error("Không có quyền truy cập dữ liệu tài khoản. Vui lòng kiểm tra Firestore rules.");
            }
            throw error;
        }
    };

    const login = async (userAccount) => {
        const deviceId = getDeviceId();
        let devices = [];
        let sessions = [];
        const isAnon = userAccount.isAnon || false;

        if (!isAnon) {
            try {
                const accountData = await fetchAccountData(userAccount.email);
                devices = accountData.devices || [];
                sessions = accountData.deviceSessions || [];

                if (!devices.includes(deviceId)) {
                    if (devices.length >= 3) {
                        setAuthError("Tài khoản đã đăng nhập quá 3 thiết bị.");
                        // Nếu vượt quá giới hạn, sign out ngay lập tức
                        await signOut(auth);
                        return false;
                    } else {
                        devices.push(deviceId);
                    }
                }

                try {
                    const accountRef = getAccountRef(userAccount.email);
                    const deviceName = getDeviceLabel();
                    const now = Date.now();
                    const updatedSessions = [
                        ...sessions.filter(session => session.id !== deviceId),
                        { id: deviceId, name: deviceName, lastActive: now }
                    ];
                    await updateDoc(accountRef, { devices, deviceSessions: updatedSessions });
                } catch (e) {
                    console.warn("Lỗi cập nhật thiết bị:", e);
                    // Nếu lỗi permissions khi update, ném lại để AuthScreen xử lý
                    if (e.code === 'permission-denied' || e.message?.includes('permission')) {
                        throw new Error("Không có quyền cập nhật thông tin thiết bị. Vui lòng kiểm tra Firestore rules.");
                    }
                    // Các lỗi khác không nghiêm trọng, tiếp tục
                }
            } catch (error) {
                console.error("Lỗi trong quá trình login:", error);
                // Ném lại lỗi để AuthScreen xử lý
                throw error;
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
    const logout = useCallback(async () => {
        try {
            const deviceId = getDeviceId();
            const userEmail = appUser?.email;
            const isAnon = appUser?.isAnon;
            if (userEmail && !isAnon) {
                try {
                    const ref = getAccountRef(userEmail);
                    const snap = await getDoc(ref);
                    if (snap.exists()) {
                        const data = snap.data();
                        const filteredDevices = (data.devices || []).filter(id => id !== deviceId);
                        const filteredSessions = (data.deviceSessions || []).filter(sess => sess.id !== deviceId);
                        await updateDoc(ref, { devices: filteredDevices, deviceSessions: filteredSessions });
                    }
                } catch (e) {
                    console.warn("Không thể cập nhật danh sách thiết bị khi logout", e);
                }
            }
            await signOut(auth);
            setAppUser(null);
            localStorage.removeItem('math_app_user_session');
            localStorage.removeItem('math_app_last_profile_id'); // Xoá luôn nhớ profile để sạch sẽ
            return true;
        } catch (e) {
            console.error("Lỗi Logout:", e);
            return false;
        }
    }, [appUser]);

    const remoteLogoutDevice = async (deviceId) => {
        if (!appUser?.email) return { success: false, message: "Không có email để xác định tài khoản." };
        try {
            const ref = getAccountRef(appUser.email);
            const snap = await getDoc(ref);
            if (!snap.exists()) return { success: false, message: "Không tìm thấy dữ liệu tài khoản." };
            const data = snap.data();
            const updatedDevices = (data.devices || []).filter(id => id !== deviceId);
            const updatedSessions = (data.deviceSessions || []).filter(sess => sess.id !== deviceId);
            await updateDoc(ref, { devices: updatedDevices, deviceSessions: updatedSessions });
            if (deviceId === getDeviceId()) {
                await logout();
            }
            return { success: true, message: "Đã đăng xuất thiết bị khỏi tài khoản." };
        } catch (error) {
            console.error(error);
            return { success: false, message: "Không thể đăng xuất thiết bị." };
        }
    };

    useEffect(() => {
        if (!appUser?.email || appUser.isAnon) {
            setTimeout(() => setDeviceSessions([]), 0);
            return;
        }
        const ref = getAccountRef(appUser.email);
        const unsubscribe = onSnapshot(ref, (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            setDeviceSessions(data.deviceSessions || []);
            if (data.devices && !data.devices.includes(getDeviceId())) {
                logout();
            }
        });
        return () => unsubscribe();
    }, [appUser?.email, appUser?.isAnon, logout]);

    return { appUser, setAppUser, isAuthReady, authError, setAuthError, login, logout, deviceSessions, remoteLogoutDevice };
};