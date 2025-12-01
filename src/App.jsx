import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, XCircle, ArrowRight, ArrowLeft,
  Loader, WifiOff, AlertTriangle
} from 'lucide-react';
import {
  signInAnonymously, onAuthStateChanged, signInWithCustomToken, signOut
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, updateDoc
} from 'firebase/firestore';

// Import modules
import { getDeviceId, fmt, solveSimpleExpression, solveComparison, encodeEmail, getWeakTopics } from './lib/utils.js';
import { callGemini } from './lib/gemini.js';
import { 
  TOPICS_LIST, TOPIC_TRANSLATIONS, SEMESTER_DEFAULT_TOPICS, SEMESTER_CONTENT, 
  REWARD_PER_LEVEL, DIFFICULTY_MIX, AVATARS, BACKUP_QUESTIONS 
} from './lib/constants.js';
import { db, auth, appId } from './lib/firebase';

// Import components
import AuthScreen from './components/AuthScreen';
import HomeScreen from './components/HomeScreen';

// Import các component còn lại (Lazy load)
const ProfileScreen = React.lazy(() => import('./components/ProfileScreen'));
const UserProfileScreen = React.lazy(() => import('./components/UserProfileScreen'));
const QV = React.lazy(() => import('./components/QuizScreen'));
const ResultScreen = React.lazy(() => import('./components/ResultScreen'));
const ReportScreen = React.lazy(() => import('./components/ReportScreen'));
const ConfigScreen = React.lazy(() => import('./components/ConfigScreen'));
const ShopScreen = React.lazy(() => import('./components/ShopScreen'));

// --- HELPER: TẠO RÀNG BUỘC NGẪU NHIÊN ---
const getRandomConstraints = () => {
    const constraints = [
        "Ưu tiên sử dụng các số lẻ trong phép tính.",
        "Ưu tiên sử dụng các số chẵn và số tròn chục.",
        "Kết quả các phép tính nên lớn hơn 100.",
        "Kết quả các phép tính nên nhỏ hơn 50.",
        "Trong bài toán đố, hãy sử dụng tên các nhân vật trong truyện cổ tích Việt Nam.",
        "Trong bài toán đố, hãy sử dụng bối cảnh về phi hành gia và vũ trụ.",
        "Trong bài toán đố, hãy sử dụng bối cảnh về các loài động vật dưới biển.",
        "Hãy tạo ít nhất 1 câu hỏi về tìm quy luật dãy số.",
        "Hãy tạo ít nhất 1 câu hỏi yêu cầu so sánh (lớn hơn, bé hơn).",
        `Hãy sử dụng các số kết thúc bằng ${Math.floor(Math.random() * 9)}.`
    ];
    const shuffled = constraints.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2).join(" ");
};

const MathApp = () => {
  const [firebaseUser, setFirebaseUser] = useState(null); 
  const [appUser, setAppUser] = useState(null); 
  const [isLoading, setIsLoading] = useState(true); 
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [appError, setAppError] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [notification, setNotification] = useState(null);

  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null); 
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileAvatar, setNewProfileAvatar] = useState(AVATARS[0]);

  // State mới cho Adaptive AI
  const [userStats, setUserStats] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [preloadedQuiz, setPreloadedQuiz] = useState(null);
  
  const [piggyBank, setPiggyBank] = useState(0);
  const [redemptionHistory, setRedemptionHistory] = useState([]);
  
  const [config, setConfig] = useState({
      difficultyMode: 'medium', 
      semester: 'hk2', 
      selectedTopics: SEMESTER_DEFAULT_TOPICS['hk2'], 
  });

  const [gameState, setGameState] = useState('auth'); 
  const [quizData, setQuizData] = useState([]); 
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null); 
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [sessionScore, setSessionScore] = useState(0); 
  const [history, setHistory] = useState([]);
  const [questionStartTime, setQuestionStartTime] = useState(null);

  const showNotification = (type, message) => {
      setNotification({ type, message });
      setTimeout(() => { setNotification(null); }, 3000);
  };

  const handleAppLogin = async (userAccount) => {
      const deviceId = getDeviceId();
      let devices = userAccount.devices || [];
      const isAnon = userAccount.isAnon || false;
      
      if (!isAnon) {
        if (!devices.includes(deviceId)) {
          if (devices.length >= 3) {
            setAuthError("Tài khoản đã đăng nhập quá 3 thiết bị.");
            return;
          } else {
            devices.push(deviceId);
            const accountId = encodeEmail(userAccount.email);
            const accountRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_accounts', accountId);
            await updateDoc(accountRef, { devices });
          }
        }
      } else {
        userAccount.uid = auth.currentUser.uid;
      }

      const updatedUser = { ...userAccount, devices };
      setAppUser(updatedUser);
      localStorage.setItem('math_app_user_session', JSON.stringify(updatedUser));
      setAuthError(null);
      setGameState('profile_select'); 
      showNotification('success', `Chào mừng ${userAccount.displayName || 'Bạn'} quay lại!`);
  };

  // --- FIX LỖI LOGOUT ---
  const handleAppLogout = async (resetAuth = false) => {
      // Logic xử lý đăng xuất bắt buộc hoặc tài khoản ẩn danh
      if (resetAuth || (appUser && appUser.isAnon)) {
          // 1. Hiển thị loading TRƯỚC
          setIsLoading(true);
          
          try { 
              await signOut(auth); 
          } catch(e) { 
              console.warn("Lỗi sign out:", e);
          }
          
          // 2. Clear toàn bộ state
          setAppUser(null);
          setProfiles([]);
          setCurrentProfile(null);
          setUserStats({});
          setPreloadedQuiz(null);
          localStorage.removeItem('math_app_user_session');
          
          // 3. Chuyển màn hình & TẮT LOADING (Quan trọng)
          setGameState('auth');
          setIsLoading(false); 
          showNotification('success', 'Đã đăng xuất thành công.');
      } else {
        // Logic đăng xuất người dùng thường
        if (window.confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
            setAppUser(null);
            setProfiles([]);
            setCurrentProfile(null);
            setUserStats({});
            localStorage.removeItem('math_app_user_session');
            
            setGameState('auth');
            showNotification('success', 'Đã đăng xuất.');
        }
      }
  };

  useEffect(() => {
    if (!auth) {
      setAppError("Lỗi cấu hình Firebase!");
      setIsLoading(false);
      setIsAuthReady(true);
      return;
    }

    const initSystemAuth = async () => {
        try {
            const initialAuthToken = import.meta.env.VITE_INITIAL_AUTH_TOKEN;
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken); 
            } else if (!auth.currentUser) {
                await signInAnonymously(auth);
            }
        } catch(e) { 
            console.error("Lỗi Auth:", e);
            if (!auth.currentUser) await signInAnonymously(auth); 
        }
    };
    
    initSystemAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
        setFirebaseUser(u);
        if (u) {
            const savedSession = localStorage.getItem('math_app_user_session');
            if (savedSession) {
                try {
                    const parsedUser = JSON.parse(savedSession);
                    const finalUid = parsedUser.isAnon ? u.uid : parsedUser.uid;
                    setAppUser({...parsedUser, uid: finalUid});
                } catch {
                    localStorage.removeItem('math_app_user_session');
                }
            }
        }
        setIsAuthReady(true);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return; 
    if (!appUser) { setGameState('auth'); return; }
    
    const fetchProfilesAndData = async () => {
        setIsLoading(true);
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
                const initData = {
                    profiles: [], piggyBank: 0, redemptionHistory: [],
                    config: { difficultyMode: 'medium', semester: 'hk2', selectedTopics: SEMESTER_DEFAULT_TOPICS['hk2'] },
                    stats: {}, logs: []
                };
                await setDoc(userDocRef, initData);
                setProfiles([]);
                setUserStats({});
            }
            setGameState('profile_select');
        } catch (e) {
            console.error("Lỗi data:", e);
            setAppError("Không thể tải dữ liệu.");
            setGameState('home');
        } finally {
            setIsLoading(false); 
        }
    };

    if (appUser && firebaseUser) { fetchProfilesAndData(); }
  }, [appUser, isAuthReady, firebaseUser]);

  useEffect(() => {
    if (currentProfile && !['playing', 'result', 'user_profile', 'report', 'shop', 'config'].includes(gameState)) {
      setGameState('home');
    }
  }, [currentProfile, gameState]);

  const createProfile = async () => {
      if (!newProfileName.trim()) { showNotification('error', "Vui lòng nhập tên cho bé."); return; }
      const newProfile = { id: `profile_${Date.now()}`, name: newProfileName, avatar: newProfileAvatar };
      const updatedProfiles = [...profiles, newProfile];
      setProfiles(updatedProfiles);
      
      const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_user_data', appUser.uid);
      await updateDoc(userDocRef, { profiles: updatedProfiles });
      
      setNewProfileName(""); setIsCreatingProfile(false); setCurrentProfile(newProfile); 
      showNotification('success', `Đã tạo hồ sơ cho bé ${newProfileName}!`);
  };

  const saveData = async (newData) => {
    if (!appUser || !currentProfile) return;
    try {
        const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_user_data', appUser.uid);
        await updateDoc(userDocRef, newData);
    } catch { showNotification('error', "Lỗi lưu dữ liệu."); }
  };

  const saveConfig = async (newConfig) => {
      if (!appUser || !currentProfile) { showNotification('error', "Chọn hồ sơ trước."); return; }
      setConfig(newConfig);
      await saveData({ config: newConfig });
      setPreloadedQuiz(null);
      showNotification('success', "Đã lưu cấu hình!");
      setGameState('home');
  };

  // --- CORE AI LOGIC ---
// Tìm hàm generateQuizQuestions và thay thế nội dung bên trong:
    const generateQuizQuestions = useCallback(async (isBackground = false) => {
        if (!currentProfile) return null;

        // 1. Phân tích điểm yếu (Giữ nguyên logic cũ)
        const currentStats = userStats[currentProfile.id] || {};
        const weakTopics = getWeakTopics({ topics: currentStats.topics });
        const personalizationInstruction = weakTopics.length > 0 
        ? `Học sinh đang yếu: "${weakTopics.join(', ')}". Hãy ưu tiên tạo câu hỏi thuộc các chủ đề này.`
        : `Học sinh học tốt. Hãy tăng cường câu đố tư duy logic và các dạng bài ghép thẻ/sắp xếp.`;

        // 2. Setup Prompt MỚI
        const randomSeed = Math.floor(Math.random() * 1000000); 
        const dynamicConstraint = getRandomConstraints(); 
        const topicLabels = TOPICS_LIST.filter(t => config.selectedTopics.includes(t.id)).map(t => t.label).join(", ");
        const themes = ["Siêu thị", "Nông trại", "Trường học", "Thám hiểm đại dương", "Vũ trụ", "Thế giới kẹo ngọt"];
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];

        const aiPrompt = `
        Mã phiên: ${randomSeed}. Vai trò: GV Toán lớp 3. Tạo 10 câu hỏi JSON.
        BỐI CẢNH: ${config.semester === 'hk1' ? 'HK1' : 'HK2'}. Chủ đề: ${randomTheme}.
        NỘI DUNG TẬP TRUNG: ${topicLabels}.
        YÊU CẦU CÁ NHÂN HÓA: ${personalizationInstruction}
        YÊU CẦU ĐẶC BIỆT: ${dynamicConstraint}
        
        QUAN TRỌNG - HÃY TẠO ĐA DẠNG CÁC LOẠI CÂU HỎI SAU (Tỉ lệ ngẫu nhiên):
        1. "mcq": Trắc nghiệm 4 đáp án (Chiếm khoảng 40%).
        2. "fill_blank": Điền số vào chỗ trống. VD: "5 + __ = 10", correctVal: "5". (20%)
        3. "comparison": So sánh. Options bắt buộc là [">", "<", "="]. (10%)
        4. "sorting": Sắp xếp. Trả về mảng "items" và "correctOrder". VD: Sắp xếp từ bé đến lớn. (15%)
        5. "matching": Ghép cặp. Trả về mảng "pairs" (left/right). VD: Phép tính và Kết quả. (15%)

        VISUALS: Nếu là hình học, hãy cố gắng trả về "svgContent".
        OUTPUT JSON THEO SCHEMA ĐÃ ĐỊNH NGHĨA.
        `;

        // Helper xử lý dữ liệu trả về (Cập nhật để xử lý đa dạng type)
        const processQuestions = (questions) => {
            return questions.map((q, idx) => {
                // Xử lý mặc định
                let processedQ = {
                    ...q,
                    id: idx,
                    level: q.level || 2,
                    topic: TOPIC_TRANSLATIONS[String(q.topic).toLowerCase().trim()] || 'arithmetic',
                    type: q.type || 'mcq' // Fallback type
                };

                // Logic riêng cho từng loại
                if (processedQ.type === 'mcq' || processedQ.type === 'comparison') {
                    let opts = q.options || [];
                    let correctVal = String(q.correctVal).trim();
                    
                    // Logic verify phép tính (chỉ áp dụng nếu là biểu thức số học)
                    const verifiedExpression = solveSimpleExpression(q.text);
                    const verifiedComparison = solveComparison(q.text);

                    if (verifiedExpression !== null && String(verifiedExpression) !== correctVal) correctVal = String(verifiedExpression);
                    else if (verifiedComparison !== null && verifiedComparison !== correctVal) correctVal = verifiedComparison;

                    // Đảm bảo options đủ 4 (cho MCQ) hoặc 3 (cho Comparison)
                    if (processedQ.type === 'comparison') {
                        processedQ.options = ['>', '=', '<'];
                    } else {
                        // Logic tạo option giả cho MCQ (giữ nguyên logic cũ)
                        const optsString = opts.map(o => String(o).trim());
                        if (!optsString.includes(correctVal)) opts[0] = correctVal;
                        while(opts.length < 4) {
                            const valMatch = correctVal.match(/(\d+)/);
                            const baseVal = valMatch ? parseInt(valMatch[0]) : 50; 
                            let fakeNum = baseVal + Math.floor(Math.random() * 20) - 10;
                            if (fakeNum < 0) fakeNum = 0; 
                            const fakeOption = String(fakeNum);
                            if (!opts.includes(fakeOption)) opts.push(fakeOption);
                        }
                        processedQ.options = [...new Set(opts)].sort(() => Math.random() - 0.5);
                    }
                    
                    processedQ.correctVal = correctVal;
                    // Mapping correctOption (A, B, C...) chỉ dùng cho MCQ hiển thị kiểu cũ, 
                    // nhưng với logic mới ta sẽ so sánh trực tiếp value.
                    // Tuy nhiên, giữ lại field này để tương thích ngược nếu cần.
                    const labels = ['A', 'B', 'C', 'D'];
                    let correctIdx = processedQ.options.findIndex(o => o === correctVal);
                    processedQ.correctOption = labels[correctIdx] || 'A';
                }

                return processedQ;
            });
        };

        try {
            const aiResult = await callGemini(aiPrompt);
            if (aiResult && Array.isArray(aiResult) && aiResult.length > 0) {
                return processQuestions(aiResult.slice(0, 10));
            }
            throw new Error("Dữ liệu AI rỗng");
        } catch (e) {
            console.warn(isBackground ? "Lỗi Preload:" : "Lỗi AI:", e);
            if (isBackground) return null;
            
            // Fallback offline (Cần cập nhật BACKUP_QUESTIONS ở constants.js)
            return processQuestions([...BACKUP_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 10));
        }
    }, [currentProfile, userStats, config]);

  const handleStartQuiz = async () => {
      if (!currentProfile) { showNotification('error', "Vui lòng chọn hồ sơ!"); return; }
      if (config.selectedTopics.length === 0) { showNotification('error', "Chọn ít nhất 1 chủ đề!"); return; }

      setIsGenerating(true);
      setAppError(null);

      if (preloadedQuiz) {
          setQuizData(preloadedQuiz);
          setPreloadedQuiz(null);
          startSession();
          setIsGenerating(false);
          return;
      }

      const questions = await generateQuizQuestions(false);
      setQuizData(questions);
      startSession();
      setIsGenerating(false);
  };

  const startSession = () => {
      setCurrentQIndex(0); setSessionScore(0); setHistory([]); 
      setSelectedOption(null); setIsSubmitted(false); 
      setGameState('playing'); setQuestionStartTime(Date.now());
  };

  // Preload Effect
  useEffect(() => {
      if (gameState === 'result' && currentProfile) {
          const preload = async () => {
              const qs = await generateQuizQuestions(true);
              if (qs) setPreloadedQuiz(qs);
          };
          preload();
      }
  }, [gameState, currentProfile, generateQuizQuestions]); 

  const handleSelectOption = (userAnswerData) => {
    if (isSubmitted) return;
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
    
    // Lưu tạm câu trả lời để hiển thị (format string nếu là object)
    let displayAnswer = userAnswerData;
    if (typeof userAnswerData === 'object') {
        displayAnswer = JSON.stringify(userAnswerData);
    }
    setSelectedOption(displayAnswer); 

    const currentQ = quizData[currentQIndex];
    let isCorrect = false;

    // --- LOGIC CHECK ĐÁP ÁN MỚI ---
    if (currentQ.type === 'sorting') {
        // userAnswerData là mảng các item đã sắp xếp
        // So sánh JSON string của 2 mảng
        isCorrect = JSON.stringify(userAnswerData) === JSON.stringify(currentQ.correctOrder);
    } else if (currentQ.type === 'matching') {
        // Với matching, component con sẽ trả về true/false khi hoàn thành game
        isCorrect = userAnswerData === true; 
    } else if (currentQ.type === 'fill_blank') {
        // So sánh chuỗi, bỏ qua khoảng trắng
        isCorrect = String(userAnswerData).trim() === String(currentQ.correctVal).trim();
    } else {
        // MCQ & Comparison & Fallback
        // So sánh giá trị (Value) thay vì Label (A,B,C) để chính xác hơn
        isCorrect = String(userAnswerData).trim() === String(currentQ.correctVal).trim();
    }

    let reward = 0;
    if (isCorrect) { 
        reward = REWARD_PER_LEVEL[currentQ.level] || 200; 
        setSessionScore(prev => prev + reward); 
    }
    
    setHistory(prev => [...prev, { 
        ...currentQ, 
        userAnswer: displayAnswer, 
        isCorrect, 
        reward, 
        timeTaken 
    }]);
    setIsSubmitted(true);
  };

  const handleNextQuestion = () => {
      if (currentQIndex < quizData.length - 1) { 
          setCurrentQIndex(prev => prev + 1); 
          setSelectedOption(null); setIsSubmitted(false); 
          setQuestionStartTime(Date.now()); 
      } else { 
          finishGame(); 
      } 
  };

  const finishGame = async () => {
      const newPiggyBank = piggyBank + sessionScore;
      setPiggyBank(newPiggyBank);
      setGameState('result');
      
      if (!appUser || appUser.isAnon) return; 

      try {
          let newStats = { ...userStats };
          if (!newStats[currentProfile.id]) newStats[currentProfile.id] = { total_questions: 0, total_correct: 0, topics: {} };
          let pStats = newStats[currentProfile.id];
          
          history.forEach(q => {
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
              id: crypto.randomUUID(), 
              profileId: currentProfile.id,
              timestamp: Date.now(),
              score: sessionScore,
              difficultyMode: config.difficultyMode,
              semester: config.semester,
              questions: history.map(h => ({
                  text: h.text, userAnswer: h.userAnswer, correctOption: h.correctOption,
                  correctVal: h.correctVal, explanation: h.explanation, isCorrect: h.isCorrect,
                  topic: h.topic, level: h.level, timeTaken: h.timeTaken
              })) 
          };
          
          const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_user_data', appUser.uid);
          const snap = await getDoc(userDocRef);
          const currentLogs = snap.exists() ? (snap.data().logs || []) : [];
          
          await updateDoc(userDocRef, { 
              piggyBank: newPiggyBank, stats: newStats, logs: [...currentLogs, logEntry]
          });
          
      } catch (error) { console.error("Lỗi lưu game:", error); }
  };

  const redeemCash = (item) => {
      if (piggyBank >= item.value) {
          if (window.confirm(`Đổi quà: ${item.name}? Mất ${fmt(item.value)}đ.`)) {
              const newBalance = piggyBank - item.value;
              const newHistory = [...redemptionHistory, { id: item.id, date: Date.now(), value: item.value, name: item.name }];
              setPiggyBank(newBalance); setRedemptionHistory(newHistory);
              saveData({ piggyBank: newBalance, redemptionHistory: newHistory });
              showNotification('success', "Đổi quà thành công!");
          }
      } else { showNotification('error', "Không đủ tiền!"); }
  };

  if (isLoading || !isAuthReady) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader className="animate-spin text-indigo-500"/></div>;

  const getScreenComponent = () => {
      switch (gameState) {
          case 'auth': return <AuthScreen onLoginSuccess={handleAppLogin} errorMsg={authError} setErrorMsg={setAuthError} />; 
          case 'profile_select': return <ProfileScreen profiles={profiles} setCurrentProfile={setCurrentProfile} isCreatingProfile={isCreatingProfile} setIsCreatingProfile={setIsCreatingProfile} newProfileName={newProfileName} setNewProfileName={setNewProfileName} newProfileAvatar={newProfileAvatar} setNewProfileAvatar={setNewProfileAvatar} createProfile={createProfile} appUser={appUser} />; 
          case 'user_profile': return <UserProfileScreen appUser={appUser} setAppUser={setAppUser} setGameState={setGameState} onLogout={handleAppLogout} />; 
          case 'home': return <HomeScreen piggyBank={piggyBank} setGameState={setGameState} currentProfile={currentProfile} isGenerating={isGenerating} handleStartQuiz={handleStartQuiz} config={config} setCurrentProfile={setCurrentProfile} appError={appError} setAppError={setAppError} isAuthReady={isAuthReady} />; 
          case 'playing': return <React.Suspense fallback={<div className="flex items-center justify-center h-full"><Loader className="animate-spin"/></div>}><QV quizData={quizData} currentQIndex={currentQIndex} setGameState={setGameState} sessionScore={sessionScore} selectedOption={selectedOption} isSubmitted={isSubmitted} handleSelectOption={handleSelectOption} handleNextQuestion={handleNextQuestion} /></React.Suspense>;
          case 'result': return <ResultScreen history={history} quizData={quizData} sessionScore={sessionScore} setGameState={setGameState} currentProfile={currentProfile} />; 
          case 'report': return <ReportScreen currentProfile={currentProfile} appUser={appUser} setGameState={setGameState} setConfig={setConfig} />; 
          case 'shop': return <ShopScreen piggyBank={piggyBank} setGameState={setGameState} redeemCash={redeemCash} redemptionHistory={redemptionHistory} />; 
          case 'config': return <ConfigScreen config={config} setConfig={setConfig} saveConfig={saveConfig} setGameState={setGameState} onLogout={handleAppLogout} appUser={appUser} />; 
          default: return <AuthScreen onLoginSuccess={handleAppLogin} errorMsg={authError} setErrorMsg={setAuthError} />; 
      }
  };

  return (
    <>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;800;900&display=swap'); body { font-family: 'Nunito', sans-serif; } .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .animation-fade-in { animation: fadeIn 0.3s ease-out forwards; } @keyframes spin { 100% { transform: rotate(360deg); } } @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } } .animate-shake { animation: shake 0.5s ease-in-out; }`}</style>
    <div className="fixed inset-0 bg-slate-100 flex items-center justify-center select-none overflow-hidden">
      <div className="w-full h-full max-w-md bg-white shadow-2xl overflow-hidden relative flex flex-col sm:rounded-[2.5rem] sm:h-[95vh] sm:border-[8px] sm:border-slate-200">
        <React.Suspense fallback={<div className="flex items-center justify-center h-full"><Loader className="animate-spin text-indigo-500"/></div>}>{getScreenComponent()}</React.Suspense>
        
        {appError && (
            <div className="absolute top-10 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl z-50 flex items-center shadow-lg animation-fade-in">
                <WifiOff size={20} className="mr-2" />
                <div className="flex-1 text-sm font-bold">{appError}</div>
                <button onClick={() => setAppError(null)} className="ml-2 font-bold">✕</button>
            </div>
        )}

        {notification && (
             <div className={`absolute top-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl font-black text-sm text-white flex items-center gap-3 animation-fade-in ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} style={{minWidth: 'fit-content', whiteSpace: 'nowrap'}}>
                {notification.type === 'success' ? <CheckCircle size={20} className="text-white"/> : <AlertTriangle size={20} className="text-white"/>}
                {notification.message}
            </div>
        )}
      </div>
    </div>
    </>
  );
};

export default MathApp;