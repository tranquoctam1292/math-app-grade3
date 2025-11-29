import React, { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, ArrowRight, ArrowLeft,
  Trophy, Lightbulb, ListChecks,
  Home, Play, RotateCcw,
  PiggyBank, Settings, Loader,
  Sparkles, Bot, ShoppingBag, Banknote, Cloud, RefreshCw, Save, Sliders, Edit3, Plus, Minus, Wand2,
  BookOpen, Calculator, Brain, Target, Calendar, Shapes, Sigma, BarChart3, Hash,
  User, Users, UserPlus, LogOut, Clock, HelpCircle, Gift, WifiOff, Lock, ShieldCheck, ShieldAlert, AlertTriangle,
  Mail, Key, Smartphone, LogIn, UserCheck, UserCog, Frown, Smile
} from 'lucide-react';
import {
  signInAnonymously, onAuthStateChanged, signInWithCustomToken, signOut
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, updateDoc
} from 'firebase/firestore';

// Import modules
import { ClayButton } from './lib/helpers.jsx';
import { getDeviceId, fmt, solveSimpleExpression, encodeEmail } from './lib/utils.js';
import { callGemini } from './lib/gemini.js';
import { TOPICS_LIST, TOPIC_TRANSLATIONS, SEMESTER_DEFAULT_TOPICS, SEMESTER_CONTENT, REWARD_PER_LEVEL, DIFFICULTY_MIX, SHOP_ITEMS, AVATARS } from './lib/constants.js';
import { db, auth, appId } from './lib/firebase';

// Import components
import AuthScreen from './components/AuthScreen';
import HomeScreen from './components/HomeScreen';
// Import các component còn lại
const ProfileScreen = React.lazy(() => import('./components/ProfileScreen'));
const UserProfileScreen = React.lazy(() => import('./components/UserProfileScreen'));
const QuizScreen = React.lazy(() => import('./components/QuizScreen'));
const ResultScreen = React.lazy(() => import('./components/ResultScreen'));
const ReportScreen = React.lazy(() => import('./components/ReportScreen'));
const ConfigScreen = React.lazy(() => import('./components/ConfigScreen'));
const ShopScreen = React.lazy(() => import('./components/ShopScreen'));


// --- MAIN APP ---
const MathApp = () => {
  const [firebaseUser, setFirebaseUser] = useState(null); 
  const [appUser, setAppUser] = useState(null); 
  const [isLoading, setIsLoading] = useState(true); 
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [appError, setAppError] = useState(null);
  const [authError, setAuthError] = useState(null);
  
  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null); 
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileAvatar, setNewProfileAvatar] = useState(AVATARS[0]);

  const [isGenerating, setIsGenerating] = useState(false);
  
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

  // --- XỬ LÝ ĐĂNG NHẬP LOGIC ---
  const handleAppLogin = async (userAccount) => {
      const deviceId = getDeviceId();
      let devices = userAccount.devices || [];
      const isAnon = userAccount.isAnon || false;
      
      if (!isAnon) {
        // Cập nhật devices cho tài khoản có email/pass
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
        // Tài khoản ẩn danh
        userAccount.uid = auth.currentUser.uid;
      }

      const updatedUser = { ...userAccount, devices };
      setAppUser(updatedUser);
      localStorage.setItem('math_app_user_session', JSON.stringify(updatedUser));
      setAuthError(null);
      setGameState('profile_select'); 
  };

  const handleAppLogout = async (resetAuth = false) => {
      // Nếu là chế độ khách (resetAuth=false) thì chỉ thoát khỏi app, không reset auth firebase
      if (resetAuth || (appUser && appUser.isAnon)) {
          try {
              await signOut(auth);
          } catch(e) {
              console.warn("Lỗi sign out:", e);
          }
          setIsLoading(true); // Kích hoạt lại quá trình xác thực
          setAppUser(null);
          setProfiles([]);
          setCurrentProfile(null);
          localStorage.removeItem('math_app_user_session');
          setGameState('auth');
          // Sau khi sign out, useEffect sẽ tự động chạy lại initSystemAuth
      } else {
        // Dùng cho người dùng có tài khoản muốn đăng xuất
        if (window.confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
            setAppUser(null);
            setProfiles([]);
            setCurrentProfile(null);
            localStorage.removeItem('math_app_user_session');
            setGameState('auth');
        }
      }
  };

  // --- XÁC THỰC HỆ THỐNG & KHỞI TẠO ---
  useEffect(() => {
    // Thêm kiểm tra an toàn: chỉ chạy nếu auth được khởi tạo thành công
    if (!auth) {
      setAppError("Lỗi cấu hình Firebase! Vui lòng kiểm tra file .env hoặc biến môi trường.");
      setIsLoading(false);
      setIsAuthReady(true);
      return;
    }

    // Chỉ chạy lần đầu tiên khi app load
    if (isLoading && !isAuthReady) {
        const initSystemAuth = async () => {
            try {
                const initialAuthToken = import.meta.env.VITE_INITIAL_AUTH_TOKEN;
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken); 
                } else {
                    await signInAnonymously(auth);
                }
            } catch(e) { 
                console.error("Lỗi xác thực hệ thống:", e); 
                await signInAnonymously(auth); // Thử lại ẩn danh nếu custom token fail
            }
        };
        initSystemAuth();
    }
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
        setFirebaseUser(u);
        
        if (u) {
            const savedSession = localStorage.getItem('math_app_user_session');
            if (savedSession) {
                try {
                    const parsedUser = JSON.parse(savedSession);
                    // Dùng uid từ firebase nếu user là anon, nếu không thì dùng uid của userAccount
                    const finalUid = parsedUser.isAnon ? u.uid : parsedUser.uid;
                    setAppUser({...parsedUser, uid: finalUid});
                } catch (e) {
                    console.error("Lỗi đọc phiên làm việc:", e);
                    localStorage.removeItem('math_app_user_session');
                }
            }
        }
        
        setIsAuthReady(true);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady, isLoading]);

  // --- TẢI HỒ SƠ & DỮ LIỆU BAN ĐẦU ---
  useEffect(() => {
    if (!isAuthReady) return; // Đợi Auth sẵn sàng
    
    if (!appUser) {
        setGameState('auth');
        return;
    }
    
    const fetchProfilesAndData = async () => {
        setIsLoading(true);
        try {
            const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_user_data', appUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            let userData = {};
            if (userDocSnap.exists()) {
                userData = userDocSnap.data();
                setProfiles(userData.profiles || []);
                setPiggyBank(userData.piggyBank || 0);
                setRedemptionHistory(userData.redemptionHistory || []);
                if (userData.config) setConfig(userData.config);
                
            } else {
                // Tạo tài liệu mới nếu chưa tồn tại
                userData = {
                    profiles: [],
                    piggyBank: 0,
                    redemptionHistory: [],
                    config: {
                        difficultyMode: 'medium', 
                        semester: 'hk2', 
                        selectedTopics: SEMESTER_DEFAULT_TOPICS['hk2'], 
                    },
                    stats: {},
                    logs: []
                };
                await setDoc(userDocRef, userData);
                setProfiles([]);
            }
            
            // Chuyển sang màn hình chọn hồ sơ
            setGameState('profile_select');
        } catch (e) {
            console.error("Lỗi tải dữ liệu người dùng:", e);
            setAppError("Không thể tải dữ liệu. Vui lòng thử lại: " + e.message);
            setGameState('home');
        } finally {
            setIsLoading(false); 
        }
    };

    if (appUser && firebaseUser) {
        fetchProfilesAndData();
    }
  }, [appUser, isAuthReady, firebaseUser]);


  // --- CHỌN HỒ SƠ VÀ VỀ TRANG CHỦ ---
  useEffect(() => {
    if (currentProfile && gameState !== 'playing' && gameState !== 'result' && gameState !== 'user_profile' && gameState !== 'report' && gameState !== 'shop') {
      setGameState('home');
    }
  }, [currentProfile, gameState]);

  const createProfile = async () => {
      if (!newProfileName.trim()) { alert("Vui lòng nhập tên cho bé."); return; }
      const newId = `profile_${Date.now()}`;
      const newProfile = { id: newId, name: newProfileName, avatar: newProfileAvatar };
      const updatedProfiles = [...profiles, newProfile];
      setProfiles(updatedProfiles);
      
      const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_user_data', appUser.uid);
      await updateDoc(userDocRef, { profiles: updatedProfiles });
      
      setNewProfileName("");
      setIsCreatingProfile(false);
      setCurrentProfile(newProfile); 
  };

  const saveData = async (newData) => {
    if (!appUser || !currentProfile) return;
    try {
        const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_user_data', appUser.uid);
        await updateDoc(userDocRef, newData);
    } catch(e) {
        console.error("Lỗi lưu dữ liệu:", e);
        setAppError("Lỗi lưu dữ liệu lên Cloud. Vui lòng kiểm tra kết nối.");
    }
  };

  const saveConfig = async (newConfig) => {
      if (!appUser || !currentProfile) { setAppError("Vui lòng chọn hồ sơ trước."); return; }
      setConfig(newConfig);
      await saveData({ config: newConfig });
      // Thay alert bằng thông báo nhỏ
      setAppError("Đã lưu cấu hình bài tập!");
      setTimeout(() => setAppError(null), 3000);
      setGameState('home');
  };

  const handleStartQuiz = async () => {
      if (!currentProfile) { setAppError("Vui lòng chọn hồ sơ học tập trước khi làm bài!"); return; }
      if (config.selectedTopics.length === 0) { setAppError("Vui lòng chọn ít nhất 1 chủ đề ôn tập!"); return; }

      setIsGenerating(true);
      setAppError(null);
      const levelCounts = DIFFICULTY_MIX[config.difficultyMode] || DIFFICULTY_MIX['medium'];
      const topicIds = config.selectedTopics;
      const topicLabels = TOPICS_LIST.filter(t => topicIds.includes(t.id)).map(t => t.label).join(", ");
      
      const excludedTopics = TOPICS_LIST.filter(t => !topicIds.includes(t.id)).map(t => t.label).join(", ");
      const semesterDetail = SEMESTER_CONTENT[config.semester] || SEMESTER_CONTENT['hk2'];
      const countsPrompt = Object.entries(levelCounts).map(([lvl, count]) => count > 0 ? `- Mức ${lvl}: ${count} câu` : null).filter(Boolean).join('\n');

      const themes = ["Đi chợ/Siêu thị", "Nông trại vui vẻ", "Trường học thân thiện", "Thế giới động vật", "Thám hiểm vũ trụ", "Lễ hội trái cây", "Thể thao năng động"];
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];

      const aiPrompt = `
        Vai trò: Giáo viên Toán lớp 3 sáng tạo. Nhiệm vụ: Tạo 10 câu trắc nghiệm JSON ĐA DẠNG, KHÔNG TRÙNG LẶP.
        CHỦ ĐỀ CỐT TRUYỆN: ${randomTheme} (Hãy lồng ghép bối cảnh này vào các câu toán đố).
        CẤU HÌNH: ${countsPrompt}. Học kỳ: ${config.semester}.
        Kiến thức trọng tâm: ${topicLabels}.
        Chi tiết chương trình: ${semesterDetail}.
        
        YÊU CẦU ĐA DẠNG HÓA (Bắt buộc):
        1. Thay đổi cấu trúc câu hỏi liên tục: 
           - Đừng chỉ hỏi "Tính...", hãy hỏi "Tìm số còn thiếu", "So sánh", "Điền vào chỗ trống", "Giải đố".
           - Xen kẽ giữa Phép tính thuần túy và Toán đố (Word Problems).
        2. Với Toán đố: Sử dụng tên nhân vật, đồ vật, tình huống thực tế phong phú theo chủ đề "${randomTheme}".
        
        QUY TẮC HIỂN THỊ (NGHIÊM NGẶT):
        1. Dùng ký hiệu '×' cho phép nhân, ':' cho phép chia (dạng Unicode). TUYỆT ĐỐI KHÔNG DÙNG LaTeX (\\times, \\div) trong text.
        2. Dùng 'x' cho biến số tìm x.
        CẤM: ${excludedTopics}, Số thập phân.

        QUY TẮC LOGIC (AN TOÀN):
        1. Đáp án sai (options) phải là các số CÓ NGHĨA (do tính nhầm), TUYỆT ĐỐI KHÔNG ghép các con số trong đề lại với nhau.
        2. Các đáp án phải cùng đơn vị đo lường (nếu có).
        3. Suy luận từng bước (Chain-of-Thought) để đảm bảo đáp án đúng 100%.

        OUTPUT JSON FORMAT:
        // Đảm bảo correctVal và options là STRING để chứa đơn vị
        [{"text": "...", "options": ["10", "12", "14"], "correctVal": "12", "explanation": "...", "level": 2, "topic": "arithmetic"}]
      `;
      
      let questions = [];
      try {
          const aiResult = await callGemini(aiPrompt);
          if (aiResult && Array.isArray(aiResult) && aiResult.length > 0) {
              questions = aiResult.slice(0, 10);
          } else {
              throw new Error("Dữ liệu AI không hợp lệ hoặc rỗng");
          }
      } catch (e) {
          console.warn("Lỗi AI:", e);
          setAppError("Mạng yếu hoặc AI đang bận. Vui lòng thử lại sau giây lát!");
          setIsGenerating(false);
          return;
      }
      
      const formattedQuiz = questions.map((q, idx) => {
          let opts = q.options || [];
          let correctVal = String(q.correctVal).trim();
          
          // Tự động kiểm tra và sửa đáp án cho các phép tính thuần túy
          const verifiedResult = solveSimpleExpression(q.text);
          if (verifiedResult !== null && String(verifiedResult) !== correctVal) {
              console.log(`Tự động sửa câu ${idx}: AI tính ${correctVal}, Máy tính lại ${verifiedResult}`);
              correctVal = String(verifiedResult);
          }

          const optsString = opts.map(o => String(o).trim());
          if (!optsString.includes(correctVal)) {
              // Nếu đáp án đúng không có trong options, thay thế đáp án đầu tiên bằng đáp án đúng
              opts[0] = correctVal; 
          }
          
          // Đảm bảo đủ 4 options và không bị trùng, sau đó xáo trộn
          while(opts.length < 4) opts.push(String(Math.floor(Math.random() * 100)));
          opts = [...new Set(opts.map(o => String(o).trim()))].sort(() => Math.random() - 0.5);
          
          const labels = ['A', 'B', 'C', 'D'];
          let correctIdx = opts.findIndex(o => o === correctVal);
          // Nếu sau khi shuffle mà đáp án đúng bị mất (vì lý do nào đó), đặt lại vào vị trí ngẫu nhiên
          if (correctIdx === -1) { 
            correctIdx = Math.floor(Math.random() * 4);
            opts[correctIdx] = correctVal; 
          } 
          
          return { 
            ...q, 
            id: idx, 
            options: opts, 
            correctOption: labels[correctIdx], 
            correctVal: correctVal, 
            level: q.level || 3, // Default level
            topic: TOPIC_TRANSLATIONS[String(q.topic).toLowerCase().trim()] || 'arithmetic' // Chuẩn hóa topic
          };
      });
      
      setQuizData(formattedQuiz); setCurrentQIndex(0); setSessionScore(0); setHistory([]); setSelectedOption(null); setIsSubmitted(false); setGameState('playing'); setIsGenerating(false); setQuestionStartTime(Date.now());
  };

  const handleSelectOption = (optLabel) => {
      if (isSubmitted) return;
      
      const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
      setSelectedOption(optLabel); 
      
      const currentQ = quizData[currentQIndex];
      const isCorrect = optLabel === currentQ.correctOption;
      let reward = 0;
      if (isCorrect) { reward = REWARD_PER_LEVEL[currentQ.level] || 300; setSessionScore(prev => prev + reward); }
      
      setHistory(prev => [...prev, { ...currentQ, userAnswer: optLabel, isCorrect, reward, timeTaken }]);
      setIsSubmitted(true);
  };

  const handleNextQuestion = () => {
      if (currentQIndex < quizData.length - 1) { setCurrentQIndex(prev => prev + 1); setSelectedOption(null); setIsSubmitted(false); setQuestionStartTime(Date.now()); }  
      else { finishGame(); } 
  };

  const finishGame = async () => {
      const newPiggyBank = piggyBank + sessionScore;
      setPiggyBank(newPiggyBank);
      setGameState('result');
      
      if (!appUser || appUser.isAnon) return; // Không lưu dữ liệu cho tài khoản khách

      try {
          const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_user_data', appUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          let userData = userDocSnap.exists() ? userDocSnap.data() : {};
          
          let newStats = userData.stats || {};
          let newLogs = userData.logs || [];
          
          // Cập nhật Stats
          if (!newStats[currentProfile.id]) newStats[currentProfile.id] = { total_questions: 0, total_correct: 0, topics: {} };
          let pStats = newStats[currentProfile.id];
          
          history.forEach(q => {
              pStats.total_questions = (pStats.total_questions || 0) + 1;
              if (q.isCorrect) pStats.total_correct = (pStats.total_correct || 0) + 1;
              if (!pStats.topics) pStats.topics = {};
              
              const topicId = TOPIC_TRANSLATIONS[String(q.topic).toLowerCase().trim()] || 'arithmetic'; // Chuẩn hóa topic
              if (!pStats.topics[topicId]) pStats.topics[topicId] = { total: 0, correct: 0 };
              
              pStats.topics[topicId].total += 1;
              if (q.isCorrect) pStats.topics[topicId].correct += 1;
          });
          
          // Cập nhật Logs
          const logEntry = {
              id: crypto.randomUUID(), 
              profileId: currentProfile.id,
              timestamp: Date.now(),
              score: sessionScore,
              difficultyMode: config.difficultyMode,
              semester: config.semester,
              questions: history.map(h => ({
                  isCorrect: h.isCorrect,
                  topic: h.topic,
                  level: h.level,
                  timeTaken: h.timeTaken
              })) // Chỉ lưu thông tin cơ bản
          };
          newLogs.push(logEntry);
          
          await updateDoc(userDocRef, { 
              piggyBank: newPiggyBank,
              stats: newStats,
              logs: newLogs
          });
          
      } catch (error) { console.error("Lỗi lưu game:", error); setAppError("Lỗi lưu kết quả. Vui lòng kiểm tra lại mạng."); }
  };

  const redeemCash = (item) => {
      if (piggyBank >= item.value) {
          // Dùng custom modal thay cho window.confirm/alert
          if (window.confirm(`Xác nhận đổi quà: ${item.name}? Bạn sẽ mất ${fmt(item.value)}đ.`)) {
              const newBalance = piggyBank - item.value;
              const newHistory = [...redemptionHistory, { id: item.id, date: Date.now(), value: item.value, name: item.name }];
              setPiggyBank(newBalance); setRedemptionHistory(newHistory);
              saveData({ piggyBank: newBalance, redemptionHistory: newHistory });
              setAppError("Đổi quà thành công! Bố mẹ sẽ duyệt yêu cầu này.");
              setTimeout(() => setAppError(null), 3000);
          }
      } else { 
          setAppError("Chưa đủ tiền trong heo đất!"); 
          setTimeout(() => setAppError(null), 3000);
      }
  };

  if (isLoading || !isAuthReady) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader className="animate-spin text-indigo-500"/></div>;

  const getScreenComponent = () => {
      switch (gameState) {
          case 'auth':
              return <AuthScreen onLoginSuccess={handleAppLogin} errorMsg={authError} setErrorMsg={setAuthError} />; 
          case 'profile_select':
              return <ProfileScreen profiles={profiles} setCurrentProfile={setCurrentProfile} isCreatingProfile={isCreatingProfile} setIsCreatingProfile={setIsCreatingProfile} newProfileName={newProfileName} setNewProfileName={setNewProfileName} newProfileAvatar={newProfileAvatar} setNewProfileAvatar={setNewProfileAvatar} createProfile={createProfile} appUser={appUser} />; 
          case 'user_profile':
              return <UserProfileScreen appUser={appUser} setAppUser={setAppUser} setGameState={setGameState} onLogout={handleAppLogout} />; 
          case 'home':
              return <HomeScreen piggyBank={piggyBank} setGameState={setGameState} currentProfile={currentProfile} isGenerating={isGenerating} handleStartQuiz={handleStartQuiz} config={config} setCurrentProfile={setCurrentProfile} appError={appError} setAppError={setAppError} isAuthReady={isAuthReady} />; 
          case 'playing':
              // Cần truyền đủ props cho QuizScreen
              return <QuizScreen quizData={quizData} currentQIndex={currentQIndex} setGameState={setGameState} sessionScore={sessionScore} selectedOption={selectedOption} isSubmitted={isSubmitted} handleSelectOption={handleSelectOption} handleNextQuestion={handleNextQuestion} />; 
          case 'result':
              return <ResultScreen history={history} quizData={quizData} sessionScore={sessionScore} setGameState={setGameState} currentProfile={currentProfile} />; 
          case 'report':
              return <ReportScreen currentProfile={currentProfile} appUser={appUser} setGameState={setGameState} />; 
          case 'shop':
              return <ShopScreen piggyBank={piggyBank} setGameState={setGameState} redeemCash={redeemCash} redemptionHistory={redemptionHistory} />; 
          case 'config':
              return <ConfigScreen config={config} setConfig={setConfig} saveConfig={saveConfig} setGameState={setGameState} onLogout={handleAppLogout} appUser={appUser} />; 
          default:
              return <AuthScreen onLoginSuccess={handleAppLogin} errorMsg={authError} setErrorMsg={setAuthError} />; 
      }
  };

  return (
    <>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;800;900&display=swap'); body { font-family: 'Nunito', sans-serif; } .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .animation-fade-in { animation: fadeIn 0.3s ease-out forwards; } .animate-spin-once { animation: spin 1s linear 1; } @keyframes spin { 100% { transform: rotate(360deg); } } @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } } .animate-shake { animation: shake 0.5s ease-in-out; }`}</style>
    <div className="fixed inset-0 bg-slate-100 flex items-center justify-center select-none overflow-hidden">
      <div className="w-full h-full max-w-md bg-white shadow-2xl overflow-hidden relative flex flex-col sm:rounded-[2.5rem] sm:h-[95vh] sm:border-[8px] sm:border-slate-200 relative">
        <React.Suspense fallback={<div className="flex items-center justify-center h-full"><Loader className="animate-spin text-indigo-500"/></div>}>
            {getScreenComponent()}
        </React.Suspense>
        
        {appError && (
            <div className="absolute top-10 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl z-50 flex items-center shadow-lg animate-fade-in">
                <WifiOff size={20} className="mr-2" />
                <div className="flex-1 text-sm font-bold">{appError}</div>
                <button onClick={() => setAppError(null)} className="ml-2 font-bold">✕</button>
            </div>
        )}
      </div>
    </div>
    </>
  );
};

export default MathApp;