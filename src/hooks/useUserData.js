import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';
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
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Load data khi user thay đổi
    useEffect(() => {
        const loadData = async () => {
            if (!appUser || !appUser.uid) {
                // Reset data khi không có user
                setProfiles([]);
                setPiggyBank(0);
                setRedemptionHistory([]);
                setUserStats({});
                return;
            }
            
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
            } finally {
                setIsLoadingData(false);
            }
        };

        loadData();
    }, [appUser]);

    // Hàm helper để save nhanh (Internal use)
    const saveData = async (newData) => {
        if (!appUser || !appUser.uid) return;
        try {
            const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_user_data', appUser.uid);
            await updateDoc(userDocRef, newData);
        } catch (e) {
            console.error("Lỗi save data:", e);
            throw e; // Ném lỗi để UI có thể bắt được nếu cần
        }
    };

    // ✅ Hàm xử lý logic đổi tiền (Transaction Logic)
    const redeemCash = async (item) => {
        if (piggyBank < item.value) {
            return { success: false, message: "Số dư không đủ để đổi quà này!" };
        }

        // Tính toán số dư mới
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
            // 1. Cập nhật State cục bộ ngay lập tức (Optimistic UI update)
            setPiggyBank(newBalance);
            setRedemptionHistory(newHistory);

            // 2. Cập nhật Firebase
            await saveData({ 
                piggyBank: newBalance, 
                redemptionHistory: newHistory 
            });

            return { success: true, message: "Đổi quà thành công! Số dư đã được cập nhật." };
        } catch (error) {
            console.error("Lỗi giao dịch:", error);
            // Rollback state nếu cần (ở đây ta giữ đơn giản, có thể reload lại trang)
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
        redeemCash // Export hàm này để App sử dụng
    };
};