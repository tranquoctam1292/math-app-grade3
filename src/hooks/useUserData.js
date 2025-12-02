// src/hooks/useUserData.js
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, appId, auth } from '../lib/firebase';
import { SEMESTER_DEFAULT_TOPICS } from '../lib/constants';

export const useUserData = (appUser) => {
    const [profiles, setProfiles] = useState([]);
    const [piggyBank, setPiggyBank] = useState(0);
    const [redemptionHistory, setRedemptionHistory] = useState([]);
    const [userStats, setUserStats] = useState({});
    const [config, setConfig] = useState({
        difficultyMode: 'medium',
        semester: 'hk2',
        selectedTopics: SEMESTER_DEFAULT_TOPICS['hk2'],
    });
    
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
                    setRedemptionHistory(data.redemptionHistory || []);
                    setUserStats(data.stats || {});
                    if (data.config) setConfig(data.config);
                } else {
                    // Init data mới nếu chưa có
                    const initData = {
                        profiles: [], 
                        piggyBank: 0, 
                        redemptionHistory: [],
                        config: { 
                            difficultyMode: 'medium', 
                            semester: 'hk2', 
                            selectedTopics: SEMESTER_DEFAULT_TOPICS['hk2'] 
                        },
                        stats: {}, 
                        logs: []
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

        const newBalance = piggyBank - item.value;
        const newHistory = [
            ...redemptionHistory, 
            { 
                id: item.id, 
                date: Date.now(), 
                value: item.value, 
                name: item.name 
            }
        ];

        try {
            setPiggyBank(newBalance);
            setRedemptionHistory(newHistory);

            await saveData({ 
                piggyBank: newBalance, 
                redemptionHistory: newHistory 
            });

            return { success: true, message: "Đổi quà thành công! Số dư đã được cập nhật." };
        } catch (error) {
            console.error("Lỗi giao dịch:", error);
            return { success: false, message: "Lỗi kết nối, vui lòng thử lại sau." };
        }
    };

    return {
        profiles, setProfiles,
        piggyBank, setPiggyBank,
        redemptionHistory, setRedemptionHistory,
        userStats, setUserStats,
        config, setConfig,
        isLoadingData,
        saveData,
        redeemCash
    };
};