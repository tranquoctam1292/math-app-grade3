import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertTriangle, Loader, WifiOff } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, appId } from './lib/firebase';

// ✅ FIX LỖI IMPORT Ở ĐÂY: Tách import ra đúng file
import { fmt } from './lib/utils.js';
import { TOPIC_TRANSLATIONS } from './lib/constants.js'; 

// --- CUSTOM HOOKS ---
import { useMathAuth } from './hooks/useMathAuth';
import { useUserData } from './hooks/useUserData';
import { useQuizRunner } from './hooks/useQuizRunner';

// Components
import AuthScreen from './components/AuthScreen';
import HomeScreen from './components/HomeScreen';
// Lazy load
const ProfileScreen = React.lazy(() => import('./components/ProfileScreen'));
const UserProfileScreen = React.lazy(() => import('./components/UserProfileScreen'));
const QV = React.lazy(() => import('./components/QuizScreen'));
const ResultScreen = React.lazy(() => import('./components/ResultScreen'));
const ReportScreen = React.lazy(() => import('./components/ReportScreen'));
const ConfigScreen = React.lazy(() => import('./components/ConfigScreen'));
const ShopScreen = React.lazy(() => import('./components/ShopScreen'));

// --- GLOBAL STYLES ---
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;800;900&display=swap');
  body { font-family: 'Nunito', sans-serif; }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .animate-shake { animation: shake 0.5s ease-in-out; }
  @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }
  .animation-fade-in { animation: fadeIn 0.3s ease-out forwards; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;

const MathApp = () => {
    // 1. Hooks quản lý Logic
    const { appUser, setAppUser, isAuthReady, authError, setAuthError, login, logout } = useMathAuth();
    
    const { 
        profiles, setProfiles, piggyBank, setPiggyBank, 
        redemptionHistory, userStats, setUserStats, 
        config, setConfig, isLoadingData, saveData, redeemCash 
    } = useUserData(appUser);
    
    // 2. UI State
    const [gameState, setGameState] = useState('auth');
    const [currentProfile, setCurrentProfile] = useState(null);
    const [isCreatingProfile, setIsCreatingProfile] = useState(false);
    const [newProfileName, setNewProfileName] = useState("");
    const [newProfileAvatar, setNewProfileAvatar] = useState("🐶"); 
    const [appError, setAppError] = useState(null);
    const [notification, setNotification] = useState(null);

    // 3. Game Runner Hook
    const gameRunner = useQuizRunner(currentProfile, config, userStats);

    const gameStateRef = useRef(gameState);
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => { setNotification(null); }, 3000);
    };

    // --- EFFECT: Router cơ bản ---
    useEffect(() => {
        if (!isAuthReady) return;
        
        const current = gameStateRef.current;

        if (!appUser) {
            if (current !== 'auth') {
                const timer = setTimeout(() => setGameState('auth'), 0);
                return () => clearTimeout(timer);
            }
        } else {
            if (current === 'auth') {
                const timer = setTimeout(() => setGameState('profile_select'), 0);
                return () => clearTimeout(timer);
            }
        }
    }, [appUser, isAuthReady, gameState]);

    // --- EFFECT: Background Preloading ---
    const { generateQuizQuestions, setPreloadedQuiz } = gameRunner;
    useEffect(() => {
        if (gameState === 'result' && currentProfile) {
            const preload = async () => {
                const qs = await generateQuizQuestions(true);
                if (qs) setPreloadedQuiz(qs);
            };
            preload();
        }
    }, [gameState, currentProfile, generateQuizQuestions, setPreloadedQuiz]);

    // --- HANDLERS ---
    const handleLogin = async (user) => {
        const success = await login(user);
        if (success) showNotification('success', `Chào mừng ${user.displayName || 'Bạn'}!`);
    };

    const handleLogout = async (force = false) => {
        if (force || window.confirm("Bạn muốn đăng xuất?")) {
            await logout();
            setCurrentProfile(null);
            gameRunner.setPreloadedQuiz(null); // Clear cache
            setGameState('auth');
        }
    };

    const handleStartQuiz = async () => {
        if (!currentProfile) { showNotification('error', "Chọn hồ sơ trước!"); return; }
        gameRunner.setIsGenerating(true);
        
        if (gameRunner.preloadedQuiz) {
            gameRunner.startSession(gameRunner.preloadedQuiz);
            gameRunner.setPreloadedQuiz(null);
        } else {
            const questions = await gameRunner.generateQuizQuestions(false);
            if (questions) gameRunner.startSession(questions);
            else setAppError("Không tạo được câu hỏi. Thử lại sau!");
        }
        
        gameRunner.setIsGenerating(false);
        if(!appError) setGameState('playing');
    };

    const handleNextQuestionWrapper = () => {
        const hasMore = gameRunner.nextQuestion();
        if (!hasMore) finishGame();
    };

    const finishGame = async () => {
        const newScore = gameRunner.sessionScore;
        const newBalance = piggyBank + newScore;
        setPiggyBank(newBalance);
        setGameState('result');

        if (appUser && !appUser.isAnon) {
            try {
                let newStats = { ...userStats };
                if (!newStats[currentProfile.id]) newStats[currentProfile.id] = { total_questions: 0, total_correct: 0, topics: {} };
                let pStats = newStats[currentProfile.id];
                
                gameRunner.history.forEach(q => {
                    pStats.total_questions = (pStats.total_questions || 0) + 1;
                    if (q.isCorrect) pStats.total_correct = (pStats.total_correct || 0) + 1;
                    if (!pStats.topics) pStats.topics = {};
                    const topicId = TOPIC_TRANSLATIONS[String(q.topic).toLowerCase().trim()] || q.topic || 'arithmetic';
                    if (!pStats.topics[topicId]) pStats.topics[topicId] = { total: 0, correct: 0 };
                    pStats.topics[topicId].total += 1;
                    if (q.isCorrect) pStats.topics[topicId].correct += 1;
                });
                
                setUserStats(newStats);
                const logEntry = {
                    id: crypto.randomUUID(), profileId: currentProfile.id, timestamp: Date.now(), score: newScore,
                    difficultyMode: config.difficultyMode, semester: config.semester,
                    questions: gameRunner.history 
                };
                
                const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_user_data', appUser.uid);
                const snap = await getDoc(userDocRef);
                const currentLogs = snap.exists() ? (snap.data().logs || []) : [];
                await updateDoc(userDocRef, { 
                    piggyBank: newBalance, stats: newStats, 
                    logs: [...currentLogs, logEntry] 
                });
            } catch (e) { console.error("Lỗi lưu kết quả:", e); }
        }
    };

    const createProfileWrapper = async () => {
        if (!newProfileName.trim()) return;
        const newProfile = { id: `profile_${Date.now()}`, name: newProfileName, avatar: newProfileAvatar };
        const updatedProfiles = [...profiles, newProfile];
        setProfiles(updatedProfiles);
        await saveData({ profiles: updatedProfiles });
        setNewProfileName(""); setIsCreatingProfile(false); setCurrentProfile(newProfile);
        showNotification('success', "Đã tạo hồ sơ mới!");
    };

    const saveConfigWrapper = (newConfig) => {
        setConfig(newConfig);
        saveData({ config: newConfig });
        gameRunner.setPreloadedQuiz(null);
        showNotification('success', "Đã lưu cấu hình!");
        setGameState('home');
    };

    const handleRedeemCash = async (item) => {
        const confirmMsg = `Đổi quà: ${item.name}? Mất ${fmt(item.value)}đ.`;
        if (!window.confirm(confirmMsg)) return;

        const result = await redeemCash(item);

        if (result.success) {
            showNotification('success', result.message);
        } else {
            showNotification('error', result.message);
        }
    };

    // --- RENDER HELPERS ---
    const getNotificationClass = () => {
        const base = "absolute top-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl font-black text-sm text-white flex items-center gap-3 whitespace-nowrap animation-fade-in";
        const color = notification?.type === 'success' ? 'bg-green-500' : 'bg-red-500';
        return `${base} ${color}`;
    };

    if (!isAuthReady || isLoadingData) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader className="animate-spin text-indigo-500"/></div>;

    const renderScreen = () => {
        switch (gameState) {
            case 'auth': 
                return <AuthScreen onLoginSuccess={handleLogin} errorMsg={authError} setErrorMsg={setAuthError} />;
            case 'profile_select': 
                return <ProfileScreen profiles={profiles} setCurrentProfile={setCurrentProfile} isCreatingProfile={isCreatingProfile} setIsCreatingProfile={setIsCreatingProfile} newProfileName={newProfileName} setNewProfileName={setNewProfileName} newProfileAvatar={newProfileAvatar} setNewProfileAvatar={setNewProfileAvatar} createProfile={createProfileWrapper} appUser={appUser} />;
            case 'home': 
                return <HomeScreen piggyBank={piggyBank} setGameState={setGameState} currentProfile={currentProfile} isGenerating={gameRunner.isGenerating} handleStartQuiz={handleStartQuiz} config={config} setCurrentProfile={setCurrentProfile} appError={appError} setAppError={setAppError} />;
            case 'playing': 
                return <React.Suspense fallback={<Loader/>}><QV quizData={gameRunner.quizData} currentQIndex={gameRunner.currentQIndex} setGameState={setGameState} sessionScore={gameRunner.sessionScore} selectedOption={gameRunner.selectedOption} isSubmitted={gameRunner.isSubmitted} handleSelectOption={gameRunner.handleSelectOption} handleNextQuestion={handleNextQuestionWrapper} /></React.Suspense>;
            case 'result': 
                return <ResultScreen history={gameRunner.history} sessionScore={gameRunner.sessionScore} setGameState={setGameState} currentProfile={currentProfile} />;
            case 'config': 
                return <ConfigScreen config={config} saveConfig={saveConfigWrapper} setGameState={setGameState} />;
            case 'user_profile': 
                return <UserProfileScreen appUser={appUser} setAppUser={setAppUser} setGameState={setGameState} onLogout={handleLogout} profiles={profiles} onSaveProfiles={(p) => { setProfiles(p); saveData({ profiles: p }); }} />;
            case 'shop': 
                return <ShopScreen piggyBank={piggyBank} setGameState={setGameState} redeemCash={handleRedeemCash} redemptionHistory={redemptionHistory} />;
            case 'report': 
                return <ReportScreen currentProfile={currentProfile} appUser={appUser} setGameState={setGameState} setConfig={saveConfigWrapper} />;
            default: 
                return <AuthScreen onLoginSuccess={handleLogin} />;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-100 flex items-center justify-center select-none overflow-hidden">
            <style>{GLOBAL_STYLES}</style>

            <div className="w-full h-full max-w-md bg-white shadow-2xl overflow-hidden relative flex flex-col sm:rounded-[2.5rem] sm:h-[95vh] sm:border-[8px] sm:border-slate-200">
                <React.Suspense fallback={<div className="flex justify-center items-center h-full"><Loader className="animate-spin"/></div>}>
                    {renderScreen()}
                </React.Suspense>
                
                {gameState === 'home' && gameRunner.preloadedQuiz && (
                    <div className="absolute top-24 right-6 text-[10px] font-bold text-green-500 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1 animate-fade-in">
                        ⚡ Sẵn sàng
                    </div>
                )}
                
                {notification && (
                    <div className={getNotificationClass()}>
                        {notification.type === 'success' ? <CheckCircle size={20}/> : <AlertTriangle size={20}/>} 
                        {notification.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MathApp;