import React, { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, ArrowRight, ArrowLeft,
  Trophy, Lightbulb, ListChecks,
  Home, Play, RotateCcw,
  PiggyBank, Settings, Loader,
  Sparkles, Bot, ShoppingBag, Banknote, Cloud, RefreshCw, Save, Sliders, Edit3, Plus, Minus, Wand2,
  BookOpen, Calculator, Brain, Target, Calendar, Shapes, Sigma, BarChart3, Hash,
  User, Users, UserPlus, LogOut, Clock, HelpCircle, Gift, WifiOff, Lock, ShieldCheck, ShieldAlert, AlertTriangle,
  Mail, Key, Smartphone, LogIn, UserCheck, UserCog, Frown, Smile, Bell
} from 'lucide-react';
import {
  signInAnonymously, onAuthStateChanged, signInWithCustomToken, signOut
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, updateDoc
} from 'firebase/firestore';

// Import modules
import { ClayButton } from './lib/helpers.jsx';
import { getDeviceId, fmt, solveSimpleExpression, solveComparison, encodeEmail } from './lib/utils.js';
import { callGemini } from './lib/gemini.js';
import { 
  TOPICS_LIST, TOPIC_TRANSLATIONS, SEMESTER_DEFAULT_TOPICS, SEMESTER_CONTENT, 
  REWARD_PER_LEVEL, DIFFICULTY_MIX, SHOP_ITEMS, AVATARS, BACKUP_QUESTIONS 
} from './lib/constants.js';
import { db, auth, appId } from './lib/firebase';

// Import components
import AuthScreen from './components/AuthScreen';
import HomeScreen from './components/HomeScreen';

// Import các component còn lại (Lazy load)
const ProfileScreen = React.lazy(() => import('./components/ProfileScreen'));
const UserProfileScreen = React.lazy(() => import('./components/UserProfileScreen'));
// SỬA LỖI: Thêm khoảng trắng giữa const và QV
const QV = React.lazy(() => import('./components/QuizScreen'));
const ResultScreen = React.lazy(() => import('./components/ResultScreen'));
const ReportScreen = React.lazy(() => import('./components/ReportScreen'));
const ConfigScreen = React.lazy(() => import('./components/ConfigScreen'));
const ShopScreen = React.lazy(() => import('./components/ShopScreen'));

// --- HELPER: TẠO RÀNG BUỘC NGẪU NHIÊN ĐỂ AI KHÔNG BỊ LẶP ---
const getRandomConstraints = () => {
    const constraints = [
        "Ưu tiên sử dụng các số lẻ trong phép tính.",
        "Ưu tiên sử dụng các số chẵn và số tròn chục.",
        "Kết quả các phép tính nên lớn hơn 100.",
        "Kết quả các phép tính nên nhỏ hơn 50.",
        "Trong bài toán đố, hãy sử dụng tên các nhân vật trong truyện cổ tích Việt Nam (Tấm, Cám, Thạch Sanh...).",
        "Trong bài toán đố, hãy sử dụng bối cảnh về phi hành gia và vũ trụ.",
        "Trong bài toán đố, hãy sử dụng bối cảnh về các loài động vật dưới biển.",
        "Hãy tạo ít nhất 1 câu hỏi về tìm quy luật dãy số.",
        "Hãy tạo ít nhất 1 câu hỏi yêu cầu so sánh (lớn hơn, bé hơn) có phép tính ở 2 vế.",
        `Hãy sử dụng các số kết thúc bằng ${Math.floor(Math.random() * 9)}.`
    ];
    // Lấy ngẫu nhiên 2 chỉ thị để phối hợp
    const shuffled = constraints.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2).join(" ");
};

// --- MAIN APP ---
const MathApp = () => {
  const [firebaseUser, setFirebaseUser] = useState(null); 
  const [appUser, setAppUser] = useState(null); 
  const [isLoading, setIsLoading] = useState(true); 
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [appError, setAppError] = useState(null);
  const [authError, setAuthError] = useState(null);
  
  // State notification (Toast)
  const [notification, setNotification] = useState(null);

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

  // --- HELPER NOTIFICATION ---
  const showNotification = (type, message) => {
      setNotification({ type, message });
      // Tự động tắt sau 3 giây
      setTimeout(() => {
          setNotification(null);
      }, 3000);
  };

  // --- XỬ LÝ ĐĂNG NHẬP LOGIC ---
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

  const handleAppLogout = async (resetAuth = false) => {
      if (resetAuth || (appUser && appUser.isAnon)) {
          try {
              await signOut(auth);
          } catch(e) {
              console.warn("Lỗi sign out:", e);
          }
          setIsLoading(true);
          setAppUser(null);
          setProfiles([]);
          setCurrentProfile(null);
          localStorage.removeItem('math_app_user_session');
          setGameState('auth');
          showNotification('success', 'Đã đăng xuất thành công.');
      } else {
        if (window.confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
            setAppUser(null);
            setProfiles([]);
            setCurrentProfile(null);
            localStorage.removeItem('math_app_user_session');
            setGameState('auth');
            showNotification('success', 'Đã đăng xuất.');
        }
      }
  };

  // --- XÁC THỰC HỆ THỐNG & KHỞI TẠO ---
  useEffect(() => {
    if (!auth) {
      setAppError("Lỗi cấu hình Firebase! Vui lòng kiểm tra file .env hoặc biến môi trường.");
      setIsLoading(false);
      setIsAuthReady(true);
      return;
    }

    const initSystemAuth = async () => {
        try {
            const initialAuthToken = import.meta.env.VITE_INITIAL_AUTH_TOKEN;
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken); 
            } else {
                if (!auth.currentUser) {
                    await signInAnonymously(auth);
                }
            }
        } catch(e) { 
            console.error("Lỗi xác thực hệ thống:", e); 
            if (!auth.currentUser) {
                await signInAnonymously(auth); 
            }
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
  }, []);

  // --- TẢI HỒ SƠ & DỮ LIỆU BAN ĐẦU ---
  useEffect(() => {
    if (!isAuthReady) return; 
    
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


  useEffect(() => {
    if (currentProfile && gameState !== 'playing' && gameState !== 'result' && gameState !== 'user_profile' && gameState !== 'report' && gameState !== 'shop' && gameState !== 'config') {
      setGameState('home');
    }
  }, [currentProfile, gameState]);

  const createProfile = async () => {
      if (!newProfileName.trim()) { 
          showNotification('error', "Vui lòng nhập tên cho bé."); 
          return; 
      }
      const newId = `profile_${Date.now()}`;
      const newProfile = { id: newId, name: newProfileName, avatar: newProfileAvatar };
      const updatedProfiles = [...profiles, newProfile];
      setProfiles(updatedProfiles);
      
      const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_user_data', appUser.uid);
      await updateDoc(userDocRef, { profiles: updatedProfiles });
      
      setNewProfileName("");
      setIsCreatingProfile(false);
      setCurrentProfile(newProfile); 
      showNotification('success', `Đã tạo hồ sơ cho bé ${newProfileName}!`);
  };

  const saveData = async (newData) => {
    if (!appUser || !currentProfile) return;
    try {
        const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_user_data', appUser.uid);
        await updateDoc(userDocRef, newData);
    } catch(e) {
        console.error("Lỗi lưu dữ liệu:", e);
        showNotification('error', "Lỗi lưu dữ liệu lên Cloud.");
    }
  };

  const saveConfig = async (newConfig) => {
      if (!appUser || !currentProfile) {
          showNotification('error', "Vui lòng chọn hồ sơ trước.");
          return;
      }
      setConfig(newConfig);
      await saveData({ config: newConfig });
      showNotification('success', "Đã lưu cấu hình bài tập!");
      setGameState('home');
  };

  const handleStartQuiz = async () => {
      if (!currentProfile) { showNotification('error', "Vui lòng chọn hồ sơ học tập trước!"); return; }
      if (config.selectedTopics.length === 0) { showNotification('error', "Hãy chọn ít nhất 1 chủ đề!"); return; }

      setIsGenerating(true);
      setAppError(null);

      // --- TẠO CÁC YẾU TỐ NGẪU NHIÊN ĐỂ "F5" BỘ NHỚ AI ---
      const randomSeed = Math.floor(Math.random() * 1000000); 
      const dynamicConstraint = getRandomConstraints(); 

      const cacheKey = `math_quiz_cache_${config.difficultyMode}_${config.semester}_${config.selectedTopics.sort().join('_')}`;
      const levelCounts = DIFFICULTY_MIX[config.difficultyMode] || DIFFICULTY_MIX['medium'];
      const topicIds = config.selectedTopics;
      const topicLabels = TOPICS_LIST.filter(t => topicIds.includes(t.id)).map(t => t.label).join(", ");
      
      // Lấy nội dung chi tiết dựa theo học kỳ
      const semesterDetail = SEMESTER_CONTENT[config.semester] || SEMESTER_CONTENT['hk2'];
      
      // Tạo chuỗi mô tả số lượng câu hỏi từng level
      const countsPrompt = Object.entries(levelCounts)
        .map(([lvl, count]) => count > 0 ? `- Level ${lvl}: ${count} câu` : null)
        .filter(Boolean).join('\n');
        
      const themes = ["Đi chợ/Siêu thị", "Nông trại vui vẻ", "Trường học thân thiện", "Thế giới động vật", "Thám hiểm vũ trụ", "Lễ hội trái cây", "Thể thao năng động"];
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];

      const aiPrompt = `
        Mã phiên làm việc: ${randomSeed} (Hãy tạo bộ câu hỏi hoàn toàn mới dựa trên mã này).
        Vai trò: Giáo viên Toán lớp 3 (Việt Nam) chuyên nghiệp.
        Nhiệm vụ: Tạo 10 câu trắc nghiệm JSON ĐA DẠNG.
        
        1. BỐI CẢNH & NỘI DUNG:
        - Học kỳ: ${config.semester === 'hk1' ? 'HỌC KỲ 1 (Sách giáo khoa Tập 1)' : 'HỌC KỲ 2 (Sách giáo khoa Tập 2)'}.
        - Chủ đề cốt truyện: ${randomTheme}.
        - Yêu cầu đặc biệt: ${dynamicConstraint}
        
        - KIẾN THỨC CẦN PHỦ:
        ${semesterDetail}
        (Tập trung vào: ${topicLabels})

        2. CẤU HÌNH ĐỘ KHÓ (BẮT BUỘC):
        ${countsPrompt}
        
        3. ĐỊNH NGHĨA LEVEL (CHUẨN SGK LỚP 3):
        - Level 1 (Nhận biết): Tính nhẩm trong bảng nhân/chia, đọc/viết số, xem đồng hồ đúng, nhận biết góc vuông/không vuông.
        - Level 2 (Thông hiểu): Cộng/trừ/nhân/chia đặt tính (có nhớ 1 lần), đổi đơn vị (mm, g, ml), tính chu vi hình đơn giản.
        - Level 3 (Vận dụng): Tính giá trị biểu thức (nhân chia trước), Tìm x (thành phần chưa biết), Toán đố 1 bước tính.
        - Level 4 (Vận dụng cao): Toán đố 2 bước tính (gấp lên/giảm đi), Quy luật dãy số, Bài toán diện tích/chu vi tổng hợp, Tư duy logic.

        4. QUY TẮC HIỂN THỊ (NGHIÊM NGẶT):
        - Dùng ký hiệu '×' (nhân), ':' (chia). KHÔNG DÙNG LaTeX.
        - NGÔN NGỮ: 100% TIẾNG VIỆT chuẩn, văn phong thân thiện với trẻ em.
        - ĐÁP ÁN: 4 lựa chọn, chỉ 1 đúng. Đáp án nhiễu phải hợp lý (sai do tính toán sai 1 bước).

        OUTPUT JSON FORMAT:
        [{"text": "...", "options": ["A", "B", "C", "D"], "correctVal": "...", "explanation": "...", "level": 1, "topic": "arithmetic"}]
      `;
      
      let questions = [];
      let isFallback = false;

      try {
          const aiResult = await callGemini(aiPrompt);
          if (aiResult && Array.isArray(aiResult) && aiResult.length > 0) {
              questions = aiResult.slice(0, 10);
          } else {
              throw new Error("Dữ liệu AI không hợp lệ hoặc rỗng");
          }
      } catch (e) {
          console.warn("Lỗi AI, đang thử tìm Cache hoặc Offline:", e);
          const cachedData = localStorage.getItem(cacheKey);
          
          if (cachedData) {
              try {
                  const parsedCache = JSON.parse(cachedData);
                  if (parsedCache.data && parsedCache.data.length > 0) {
                      console.log("⚡ AI lỗi -> Sử dụng bài tập từ Cache");
                      setQuizData(parsedCache.data);
                      setCurrentQIndex(0); setSessionScore(0); setHistory([]); 
                      setSelectedOption(null); setIsSubmitted(false); 
                      setGameState('playing'); setQuestionStartTime(Date.now());
                      setAppError(null);
                      setIsGenerating(false);
                      showNotification('success', "Mất kết nối AI. Đang dùng bài tập đã lưu!");
                      return; 
                  }
              } catch (cacheErr) {
                  console.error("Lỗi đọc cache:", cacheErr);
              }
          }

          const shuffledBackup = [...BACKUP_QUESTIONS].sort(() => 0.5 - Math.random());
          questions = shuffledBackup.slice(0, 10);
          isFallback = true; 

          if (!questions || questions.length === 0) {
             showNotification('error', "Mạng yếu và không có dữ liệu offline. Thử lại sau!");
             setIsGenerating(false);
             return;
          }
          console.log("⚠️ Cache trống -> Dùng bộ câu hỏi dự phòng cứng");
          showNotification('error', "Đang dùng chế độ Offline (Bộ câu hỏi mẫu)!");
      }
      
      const formattedQuiz = questions.map((q, idx) => {
          let opts = q.options || [];
          let correctVal = String(q.correctVal).trim();
          
          const verifiedExpression = solveSimpleExpression(q.text);
          const verifiedComparison = solveComparison(q.text);

          if (verifiedExpression !== null && String(verifiedExpression) !== correctVal) {
              console.log(`Auto-fix Math ${idx}: AI=${correctVal} -> Máy=${verifiedExpression}`);
              correctVal = String(verifiedExpression);
          } else if (verifiedComparison !== null && verifiedComparison !== correctVal) {
              console.log(`Auto-fix Compare ${idx}: AI=${correctVal} -> Máy=${verifiedComparison}`);
              correctVal = verifiedComparison;
          }

          const optsString = opts.map(o => String(o).trim());
          if (!optsString.includes(correctVal)) {
              opts[0] = correctVal; 
          }
          
          while(opts.length < 4) {
              if (['>', '<', '='].includes(correctVal)) {
                  const signs = ['>', '<', '=', '+'];
                  signs.forEach(s => { if (!opts.includes(s) && opts.length < 4) opts.push(s); });
              } else {
                  const valMatch = correctVal.match(/(\d+)/);
                  const baseVal = valMatch ? parseInt(valMatch[0]) : 50; 
                  let fakeNum = baseVal + Math.floor(Math.random() * 20) - 10;
                  if (fakeNum < 0) fakeNum = 0; 
                  if (fakeNum === baseVal) fakeNum = baseVal + 5;
                  const unitText = correctVal.replace(/[\d.,]+/g, '').trim(); 
                  const fakeOption = unitText ? `${fakeNum} ${unitText}` : String(fakeNum);
                  if (!opts.includes(fakeOption)) opts.push(fakeOption);
              }
          }

          opts = [...new Set(opts.map(o => String(o).trim()))].sort(() => Math.random() - 0.5);
          
          const labels = ['A', 'B', 'C', 'D'];
          let correctIdx = opts.findIndex(o => o === correctVal);
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
            level: q.level || 2, // Mặc định level 2 nếu AI quên trả về
            topic: TOPIC_TRANSLATIONS[String(q.topic).toLowerCase().trim()] || 'arithmetic' 
          };
      });
      
      if (!isFallback && questions.length > 0) {
          localStorage.setItem(cacheKey, JSON.stringify({
              timestamp: Date.now(),
              data: formattedQuiz
          }));
      }

      setQuizData(formattedQuiz); setCurrentQIndex(0); setSessionScore(0); setHistory([]); setSelectedOption(null); setIsSubmitted(false); setGameState('playing'); setIsGenerating(false); setQuestionStartTime(Date.now());
  };

  const handleSelectOption = (optLabel) => {
      if (isSubmitted) return;
      
      const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
      setSelectedOption(optLabel); 
      
      const currentQ = quizData[currentQIndex];
      const isCorrect = optLabel === currentQ.correctOption;
      let reward = 0;
      if (isCorrect) { reward = REWARD_PER_LEVEL[currentQ.level] || 200; setSessionScore(prev => prev + reward); }
      
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
      
      if (!appUser || appUser.isAnon) return; 

      try {
          const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_user_data', appUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          let userData = userDocSnap.exists() ? userDocSnap.data() : {};
          
          let newStats = userData.stats || {};
          let newLogs = userData.logs || [];
          
          if (!newStats[currentProfile.id]) newStats[currentProfile.id] = { total_questions: 0, total_correct: 0, topics: {} };
          let pStats = newStats[currentProfile.id];
          
          history.forEach(q => {
              pStats.total_questions = (pStats.total_questions || 0) + 1;
              if (q.isCorrect) pStats.total_correct = (pStats.total_correct || 0) + 1;
              if (!pStats.topics) pStats.topics = {};
              
              const topicId = TOPIC_TRANSLATIONS[String(q.topic).toLowerCase().trim()] || 'arithmetic'; 
              if (!pStats.topics[topicId]) pStats.topics[topicId] = { total: 0, correct: 0 };
              
              pStats.topics[topicId].total += 1;
              if (q.isCorrect) pStats.topics[topicId].correct += 1;
          });
          
          const logEntry = {
              id: crypto.randomUUID(), 
              profileId: currentProfile.id,
              timestamp: Date.now(),
              score: sessionScore,
              difficultyMode: config.difficultyMode,
              semester: config.semester,
              questions: history.map(h => ({
                  text: h.text,
                  userAnswer: h.userAnswer,
                  correctOption: h.correctOption,
                  correctVal: h.correctVal,
                  explanation: h.explanation,
                  isCorrect: h.isCorrect,
                  topic: h.topic,
                  level: h.level,
                  timeTaken: h.timeTaken
              })) 
          };
          newLogs.push(logEntry);
          
          await updateDoc(userDocRef, { 
              piggyBank: newPiggyBank,
              stats: newStats,
              logs: newLogs
          });
          
      } catch (error) { console.error("Lỗi lưu game:", error); showNotification('error', "Lỗi lưu kết quả. Kiểm tra mạng."); }
  };

  const redeemCash = (item) => {
      if (piggyBank >= item.value) {
          if (window.confirm(`Xác nhận đổi quà: ${item.name}? Bạn sẽ mất ${fmt(item.value)}đ.`)) {
              const newBalance = piggyBank - item.value;
              const newHistory = [...redemptionHistory, { id: item.id, date: Date.now(), value: item.value, name: item.name }];
              setPiggyBank(newBalance); setRedemptionHistory(newHistory);
              saveData({ piggyBank: newBalance, redemptionHistory: newHistory });
              showNotification('success', "Đổi quà thành công! Đã gửi yêu cầu cho bố mẹ.");
          }
      } else { 
          showNotification('error', "Bé chưa đủ tiền trong heo đất rồi!");
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
              return <React.Suspense fallback={<div className="flex items-center justify-center h-full"><Loader className="animate-spin text-indigo-500"/></div>}>
                  <QV quizData={quizData} currentQIndex={currentQIndex} setGameState={setGameState} sessionScore={sessionScore} selectedOption={selectedOption} isSubmitted={isSubmitted} handleSelectOption={handleSelectOption} handleNextQuestion={handleNextQuestion} />
              </React.Suspense>;
          case 'result':
              return <ResultScreen history={history} quizData={quizData} sessionScore={sessionScore} setGameState={setGameState} currentProfile={currentProfile} />; 
          case 'report':
              return <ReportScreen currentProfile={currentProfile} appUser={appUser} setGameState={setGameState} setConfig={setConfig} />; 
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