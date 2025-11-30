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
// Import thêm solveComparison
import { getDeviceId, fmt, solveSimpleExpression, solveComparison, encodeEmail } from './lib/utils.js';
import { callGemini } from './lib/gemini.js';
// Import thêm BACKUP_QUESTIONS từ constants
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

    // Chỉ chạy init một lần duy nhất
    const initSystemAuth = async () => {
        try {
            const initialAuthToken = import.meta.env.VITE_INITIAL_AUTH_TOKEN;
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken); 
            } else {
                // Chỉ sign-in ẩn danh nếu chưa có user
                if (!auth.currentUser) {
                    await signInAnonymously(auth);
                }
            }
        } catch(e) { 
            console.error("Lỗi xác thực hệ thống:", e); 
            // Fallback
            if (!auth.currentUser) {
                await signInAnonymously(auth); 
            }
        }
    };
    
    // Gọi hàm init
    initSystemAuth();
    
    // Lắng nghe thay đổi auth state
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
  }, []); // <--- QUAN TRỌNG: Dependency array rỗng để chỉ chạy 1 lần khi mount

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

      // Key để lưu/đọc Cache
      const cacheKey = `math_quiz_cache_${config.difficultyMode}_${config.semester}_${config.selectedTopics.sort().join('_')}`;
      
      // Chuẩn bị tham số cho AI
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
        3. NGÔN NGỮ: 100% TIẾNG VIỆT chuẩn. TUYỆT ĐỐI KHÔNG chèn từ tiếng Anh, tiếng Nga hay mở ngoặc giải thích tiếng nước ngoài.
        CẤM: ${excludedTopics}, Số thập phân.

        QUY TẮC LOGIC VÀ ĐÁP ÁN (CỰC KỲ QUAN TRỌNG):
        1. ĐỒNG NHẤT ĐƠN VỊ: Tất cả 4 đáp án phải có cùng một đơn vị đo. (Ví dụ: Nếu đáp án đúng là "3 m", các đáp án sai cũng phải là "m". CẤM trộn lẫn "300 cm" và "3 m").
        2. KHÔNG TRÙNG LẶP GIÁ TRỊ: Tuyệt đối không đưa ra 2 đáp án có giá trị bằng nhau (Ví dụ: "1 giờ" và "60 phút" là trùng -> CẤM).
        3. ĐỘ LỚN TƯƠNG ĐỒNG: Các đáp án sai phải có giá trị gần với đáp án đúng (Ví dụ: Đáp án là 1000, thì câu sai nên là 900, 1100... KHÔNG ĐƯỢC là 5 hay 10).
        4. ĐẦY ĐỦ ĐƠN VỊ: Nếu đáp án đúng có đơn vị (ví dụ: "quyển vở"), thì TẤT CẢ đáp án sai cũng phải có chữ "quyển vở" đi kèm.
        5. LUÔN TRẢ VỀ ĐỦ 4 OPTIONS: Không được thiếu.

        OUTPUT JSON FORMAT:
        // Đảm bảo correctVal và options là STRING để chứa đơn vị
        [{"text": "...", "options": ["10", "12", "14"], "correctVal": "12", "explanation": "...", "level": 2, "topic": "arithmetic"}]
      `;
      
      let questions = [];
      let isFallback = false;

      try {
          // --- ƯU TIÊN 1: GỌI AI ---
          const aiResult = await callGemini(aiPrompt);
          if (aiResult && Array.isArray(aiResult) && aiResult.length > 0) {
              questions = aiResult.slice(0, 10);
          } else {
              throw new Error("Dữ liệu AI không hợp lệ hoặc rỗng");
          }
      } catch (e) {
          console.warn("Lỗi AI, đang thử tìm Cache hoặc Offline:", e);
          
          // --- ƯU TIÊN 2: AI LỖI -> TÌM TRONG CACHE (Bài tập cũ) ---
          const cachedData = localStorage.getItem(cacheKey);
          let foundCache = false;
          
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
                      return; // THOÁT NGAY, dùng dữ liệu cache đã format sẵn
                  }
              } catch (cacheErr) {
                  console.error("Lỗi đọc cache:", cacheErr);
              }
          }

          // --- ƯU TIÊN 3: KHÔNG CÓ CACHE -> DÙNG HARDCODED BACKUP ---
          const shuffledBackup = [...BACKUP_QUESTIONS].sort(() => 0.5 - Math.random());
          questions = shuffledBackup.slice(0, 10);
          isFallback = true; // Đánh dấu là fallback để không lưu đè cache xịn

          if (!questions || questions.length === 0) {
             showNotification('error', "Mạng yếu và không có dữ liệu offline. Thử lại sau!");
             setIsGenerating(false);
             return;
          }
          console.log("⚠️ Cache trống -> Dùng bộ câu hỏi dự phòng cứng");
          showNotification('error', "Đang dùng chế độ Offline (Bộ câu hỏi mẫu)!");
      }
      
      // --- XỬ LÝ & FORMAT CÂU HỎI (Cho AI hoặc Backup) ---
      const formattedQuiz = questions.map((q, idx) => {
          let opts = q.options || [];
          let correctVal = String(q.correctVal).trim();
          
          // Tự động kiểm tra và sửa đáp án (cả số học và so sánh)
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
          
          // Bổ sung đáp án nhiễu
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
            level: q.level || 3, 
            topic: TOPIC_TRANSLATIONS[String(q.topic).toLowerCase().trim()] || 'arithmetic' 
          };
      });
      
      // --- LƯU CACHE: Chỉ lưu nếu là dữ liệu mới từ AI ---
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
                  text: h.text,           // <--- CẬP NHẬT MỚI: Nội dung câu hỏi
                  userAnswer: h.userAnswer, // <--- CẬP NHẬT MỚI: Đáp án bé chọn
                  correctOption: h.correctOption, // <--- CẬP NHẬT MỚI: Đáp án đúng
                  correctVal: h.correctVal, // <--- CẬP NHẬT MỚI: Giá trị đúng
                  explanation: h.explanation, // <--- CẬP NHẬT MỚI: Lời giải thích
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
              return <QuizScreen quizData={quizData} currentQIndex={currentQIndex} setGameState={setGameState} sessionScore={sessionScore} selectedOption={selectedOption} isSubmitted={isSubmitted} handleSelectOption={handleSelectOption} handleNextQuestion={handleNextQuestion} />; 
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
        
        {/* APP ERROR NOTIFICATION */}
        {appError && (
            <div className="absolute top-10 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl z-50 flex items-center shadow-lg animation-fade-in">
                <WifiOff size={20} className="mr-2" />
                <div className="flex-1 text-sm font-bold">{appError}</div>
                <button onClick={() => setAppError(null)} className="ml-2 font-bold">✕</button>
            </div>
        )}

        {/* TOAST NOTIFICATION SYSTEM */}
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