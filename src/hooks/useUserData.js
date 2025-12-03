// src/hooks/useUserData.js
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, appId, auth } from '../lib/firebase';
import { SEMESTER_DEFAULT_TOPICS, DEFAULT_PARENT_SETTINGS, REDEMPTION_STATUS } from '../lib/constants';
import { hashParentPin } from '../lib/utils';
import { secureUpdatePiggyBank } from '../lib/piggyBank';

export const useUserData = (appUser) => {
    const [profiles, setProfiles] = useState([]);
    const [piggyBank, setPiggyBank] = useState(0);
    const [redeemRequests, setRedeemRequests] = useState([]);
    const [userStats, setUserStats] = useState({});
    const [config, setConfig] = useState({
        difficultyMode: 'medium',
        semester: 'hk2',
        selectedTopics: SEMESTER_DEFAULT_TOPICS['hk2'],
    });
    const [parentSettings, setParentSettings] = useState(DEFAULT_PARENT_SETTINGS);
    
    // ✅ FIX LỖI F5: Mặc định là TRUE để App chờ tải dữ liệu xong mới quyết định hiển thị gì
    // Tránh việc ProfileScreen thấy list rỗng (do chưa tải) mà vội vàng hiện popup tạo mới
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Load data khi user thay đổi
    useEffect(() => {
        const loadData = async () => {
            // Nếu chưa có user, tắt loading để App xử lý luồng Auth
            if (!appUser || !appUser.uid || !auth.currentUser) {
                setIsLoadingData(false);
                return;
            }
            
            // Bắt đầu tải, đảm bảo loading là true
            setIsLoadingData(true);
            
            try {
                const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_user_data', appUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                
                if (userDocSnap.exists()) {
                    const data = userDocSnap.data();
                    setProfiles(data.profiles || []);
                    setPiggyBank(data.piggyBank || 0);
                    const requests = data.redemptionRequests || (data.redemptionHistory ? data.redemptionHistory.map(req => ({
                        ...req,
                        status: req.status || REDEMPTION_STATUS.APPROVED,
                        approvedAt: req.date || Date.now()
                    })) : []);
                    setRedeemRequests(requests);
                    setUserStats(data.stats || {});
                    if (data.config) setConfig(data.config);
                    setParentSettings(data.parentSettings || DEFAULT_PARENT_SETTINGS);
                } else {
                    // Init data mới nếu chưa có
                    const initData = {
                        profiles: [], 
                        piggyBank: 0, 
                        redemptionRequests: [],
                        config: { 
                            difficultyMode: 'medium', 
                            semester: 'hk2', 
                            selectedTopics: SEMESTER_DEFAULT_TOPICS['hk2'] 
                        },
                        stats: {}, 
                        logs: [],
                        parentSettings: DEFAULT_PARENT_SETTINGS
                    };
                    await setDoc(userDocRef, initData);
                    setProfiles([]); 
                    setUserStats({});
                }
            } catch (e) {
                console.error("Lỗi load user data:", e);
                // Tự động reset nếu lỗi quyền truy cập
                if (e.code === 'permission-denied' || e.message.includes('Missing or insufficient permissions')) {
                    console.warn("Phát hiện lỗi session cũ, đang reset...");
                    localStorage.removeItem('math_app_user_session');
                    window.location.reload();
                }
            } finally {
                // ✅ Luôn tắt loading khi xong việc (dù thành công hay thất bại)
                setIsLoadingData(false);
            }
        };

        loadData();
    }, [appUser]);

    // Hàm helper để save nhanh
    const saveData = async (newData) => {
        if (!appUser || !appUser.uid) return;
        try {
            const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_user_data', appUser.uid);
            await updateDoc(userDocRef, newData);
        } catch (e) {
            console.error("Lỗi save data:", e);
        }
    };

    // Hàm xử lý đổi tiền
    const redeemCash = async (item) => {
        if (piggyBank < item.value) {
            return { success: false, message: "Số dư không đủ để đổi quà này!" };
        }

        const request = {
            requestId: crypto.randomUUID(),
            id: item.id,
            name: item.name,
            value: item.value,
            status: REDEMPTION_STATUS.PENDING,
            requestedAt: Date.now()
        };
        const newRequests = [...redeemRequests, request];

        try {
            setRedeemRequests(newRequests);

            await saveData({ 
                redemptionRequests: newRequests 
            });

            return { success: true, message: "Đã gửi yêu cầu đổi quà! Bố mẹ sẽ duyệt sớm thôi." };
        } catch (error) {
            console.error("Lỗi giao dịch:", error);
            return { success: false, message: "Lỗi kết nối, vui lòng thử lại sau." };
        }
    };

    const approveRedemption = async (requestId) => {
        const target = redeemRequests.find(r => r.requestId === requestId);
        if (!target) return { success: false, message: "Không tìm thấy yêu cầu." };
        if (target.status !== REDEMPTION_STATUS.PENDING) {
            return { success: false, message: "Yêu cầu đã được xử lý." };
        }
        if (piggyBank < target.value) {
            return { success: false, message: "Số dư hiện tại không đủ để trừ." };
        }

        const updatedRequests = redeemRequests.map(r => r.requestId === requestId
            ? { ...r, status: REDEMPTION_STATUS.APPROVED, approvedAt: Date.now() }
            : r
        );
        try {
            // Gọi Cloud Function để trừ điểm an toàn
            try {
                const res = await secureUpdatePiggyBank(-target.value, 'redeem_cash');
                if (res?.success && typeof res.after === 'number') {
                    setPiggyBank(res.after);
                } else {
                    setPiggyBank(prev => prev - target.value);
                }
            } catch (err) {
                console.error("Lỗi updatePiggyBank khi duyệt quà:", err);
                setPiggyBank(prev => prev - target.value);
            }

            setRedeemRequests(updatedRequests);
            await saveData({
                redemptionRequests: updatedRequests
            });
            return { success: true, message: "Đã duyệt và trừ điểm tiết kiệm của bé." };
        } catch (error) {
            console.error(error);
            return { success: false, message: "Không thể lưu phê duyệt. Vui lòng thử lại." };
        }
    };

    const rejectRedemption = async (requestId) => {
        const target = redeemRequests.find(r => r.requestId === requestId);
        if (!target) return { success: false, message: "Không tìm thấy yêu cầu." };
        if (target.status !== REDEMPTION_STATUS.PENDING) {
            return { success: false, message: "Yêu cầu đã được xử lý." };
        }
        const updatedRequests = redeemRequests.map(r => r.requestId === requestId
            ? { ...r, status: REDEMPTION_STATUS.REJECTED, rejectedAt: Date.now() }
            : r
        );
        try {
            setRedeemRequests(updatedRequests);
            await saveData({ redemptionRequests: updatedRequests });
            return { success: true, message: "Đã từ chối yêu cầu này." };
        } catch (error) {
            console.error(error);
            return { success: false, message: "Không thể lưu trạng thái. Vui lòng thử lại." };
        }
    };

    const updateParentSettings = async (payload) => {
        const updates = { ...payload };
        if (Object.prototype.hasOwnProperty.call(updates, 'pin')) {
            updates.pinHash = updates.pin ? await hashParentPin(updates.pin) : null;
            delete updates.pin;
        }
        const nextSettings = {
            ...DEFAULT_PARENT_SETTINGS,
            ...parentSettings,
            ...updates,
            lastUpdated: Date.now()
        };
        try {
            setParentSettings(nextSettings);
            await saveData({ parentSettings: nextSettings });
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false, message: "Không thể lưu mã PIN." };
        }
    };

    return {
        profiles, setProfiles,
        piggyBank, setPiggyBank,
        redeemRequests, setRedeemRequests,
        userStats, setUserStats,
        config, setConfig,
        isLoadingData,
        saveData,
        redeemCash,
        parentSettings, updateParentSettings,
        approveRedemption, rejectRedemption
    };
};