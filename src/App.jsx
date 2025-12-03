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

// --- DỮ LIỆU DỰ PHÒNG (OFFLINE MODE) - ĐÃ CẬP NHẬT FORMAT LOGIC ---
const BACKUP_QUESTIONS = [
    {
        "text": "Mẹ đi chợ mua 5 chục quả trứng, biếu bà 20 quả. Hỏi mẹ còn lại bao nhiêu quả trứng?",
        "logic_type": "calculation",
        "expression_value": "50 - 20",
        "unit": "quả",
        "explanation": "5 chục = 50. Mẹ còn lại: 50 - 20 = 30 (quả).",
        "level": 2,
        "topic": "word_problems"
    },
    {
        "text": "Tìm x, biết: x : 5 = 12",
        "logic_type": "calculation",
        "expression_value": "12 * 5",
        "explanation": "Muốn tìm số bị chia, ta lấy thương nhân với số chia: x = 12 × 5 = 60.",
        "level": 3,
        "topic": "finding_x"
    },
    {
        "text": "Tính nhẩm: 234 + 100 - 34",
        "logic_type": "calculation",
        "expression_value": "234 + 100 - 34",
        "explanation": "Ta lấy 234 - 34 = 200, sau đó 200 + 100 = 300.",
        "level": 2,
        "topic": "arithmetic"
    },
    {
        "text": "Một hình vuông có cạnh 6cm. Chu vi hình vuông đó là bao nhiêu?",
        "logic_type": "calculation",
        "expression_value": "6 * 4",
        "unit": "cm",
        "explanation": "Chu vi hình vuông = cạnh × 4. Vậy chu vi là: 6 × 4 = 24 (cm).",
        "level": 3,
        "topic": "geometry"
    },
    {
        "text": "Điền dấu thích hợp: 150 + 30 ... 30 x 6",
        "logic_type": "comparison",
        "expression_left": "150 + 30",
        "expression_right": "30 * 6",
        "explanation": "Vế trái: 150 + 30 = 180. Vế phải: 30 x 6 = 180. Vì 180 = 180 nên điền dấu =.",
        "level": 3,
        "topic": "arithmetic"
    }
];

// Import modules
import { ClayButton } from './lib/helpers.jsx';
// LƯU Ý: Bạn cần đảm bảo file lib/utils.js đã có hàm evaluateMathLogic và compareExpressions
import { getDeviceId, fmt, evaluateMathLogic, compareExpressions, encodeEmail } from './lib/utils.js';
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
      } else {
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
    if (!auth) {
      setAppError("Lỗi cấu hình Firebase! Vui lòng kiểm tra file .env hoặc biến môi trường.");
      setIsLoading(false);
      setIsAuthReady(true);
      return;
    }

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
                await signInAnonymously(auth);
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

  // --- CHỌN HỒ SƠ VÀ VỀ TRANG CHỦ ---
  useEffect(() => {
    if (currentProfile && !['playing', 'result', 'user_profile', 'report', 'shop', 'config'].includes(gameState)) {
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
      if (!appUser || !currentProfile) {
          alert("Vui lòng chọn hồ sơ trước.");
          return;
      }
      setConfig(newConfig);
      await saveData({ config: newConfig });
      alert("Đã lưu cấu hình bài tập!");
      setGameState('home');
  };

  // --- LOGIC TẠO CÂU HỎI MỚI (QUAN TRỌNG) ---
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

      // --- PROMPT KỸ THUẬT MỚI: TÁCH LOGIC VÀ DỮ LIỆU ---
      const aiPrompt = `
        Vai trò: Giáo viên Toán lớp 3. Nhiệm vụ: Tạo 10 câu hỏi JSON.
        CHỦ ĐỀ: ${randomTheme}. HỌC KỲ: ${config.semester}. KIẾN THỨC: ${topicLabels}.
        CHI TIẾT: ${semesterDetail}. CẤU HÌNH: ${countsPrompt}.
        CẤM: ${excludedTopics}, Số thập phân.

        YÊU CẦU QUAN TRỌNG:
        1. KHÔNG tính toán đáp án cuối cùng. Chỉ đưa ra biểu thức hoặc giá trị thô.
        2. NGÔN NGỮ: 100% TIẾNG VIỆT.
        3. Dùng 'x' cho tìm x. Dùng dấu '...' cho điền dấu so sánh.

        OUTPUT JSON FORMAT (Mảng Object):
        [
            {
                "text": "Điền dấu thích hợp: 120 + 30 ... 50 x 3", 
                "logic_type": "comparison", 
                "expression_left": "120 + 30", 
                "expression_right": "50 * 3",
                "explanation": "...", "level": 3, "topic": "arithmetic"
            },
            {
                "text": "Mẹ có 50 quả cam, biếu bà 10 quả. Mẹ còn bao nhiêu?",
                "logic_type": "calculation",
                "expression_value": "50 - 10", 
                "unit": "quả cam", 
                "explanation": "...", "level": 2, "topic": "word_problems"
            }
        ]
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
          console.warn("Lỗi AI, chuyển sang chế độ Offline:", e);
          const shuffledBackup = [...BACKUP_QUESTIONS].sort(() => 0.5 - Math.random());
          questions = shuffledBackup.slice(0, 10);
          if (!questions || questions.length === 0) {
             setAppError("Mạng yếu và không có dữ liệu offline. Vui lòng thử lại sau!");
             setIsGenerating(false);
             return;
          }
          console.log("⚠️ Đang sử dụng bộ câu hỏi dự phòng (Offline Mode)");
      }
      
      // --- LOGIC XỬ LÝ: MÁY TÍNH TOÁN (ĐẢM BẢO CHÍNH XÁC 100%) ---
      const formattedQuiz = questions.map((q, idx) => {
          let trueVal, options = [];
          
          // ✅ FIX: Xử lý câu hỏi "số nào lớn nhất/nhỏ nhất"
          const textLower = q.text.toLowerCase();
          const isFindLargest = textLower.includes('số nào lớn nhất') || textLower.includes('số lớn nhất');
          const isFindSmallest = textLower.includes('số nào nhỏ nhất') || textLower.includes('số nhỏ nhất');
          
          if (isFindLargest || isFindSmallest) {
              // Extract các số từ text
              // Trước tiên, tách các số bằng dấu phẩy hoặc dấu chấm phẩy (phân cách giữa các số)
              // Ví dụ: "12.345, 54.321, 23.451" -> ["12.345", "54.321", "23.451"]
              let textToParse = q.text;
              
              // Tìm phần sau dấu hai chấm (nếu có) hoặc phần chứa danh sách số
              const colonMatch = textToParse.match(/[:：]\s*(.+)/);
              if (colonMatch) {
                  textToParse = colonMatch[1];
              }
              
              // Tách các số bằng dấu phẩy hoặc dấu chấm phẩy
              const numberStrings = textToParse.split(/[,;，；]\s*/).map(s => s.trim()).filter(s => s.length > 0);
              
              // Nếu không tách được bằng dấu phẩy, thử dùng regex
              let matches = numberStrings.length >= 2 ? numberStrings : q.text.match(/(\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:[.,]\d+)?)/g);
              
              if (matches && matches.length >= 2) {
                  // Chuẩn hóa số: xử lý cả dấu chấm và phẩy
                  // Format Việt Nam: dấu chấm (.) phân cách hàng nghìn, dấu phẩy (,) thập phân
                  // Format quốc tế: dấu phẩy (,) phân cách hàng nghìn, dấu chấm (.) thập phân
                  const normalizedNumbers = matches.map(numStr => {
                      let clean = numStr.trim();
                      
                      // Nếu có cả dấu chấm và phẩy
                      if (clean.includes('.') && clean.includes(',')) {
                          // Kiểm tra vị trí: dấu nào gần cuối hơn là thập phân
                          const lastDot = clean.lastIndexOf('.');
                          const lastComma = clean.lastIndexOf(',');
                          
                          if (lastDot > lastComma) {
                              // Dấu chấm ở cuối -> dấu chấm là thập phân, phẩy là phân cách hàng nghìn
                              clean = clean.replace(/,/g, '');
                          } else {
                              // Dấu phẩy ở cuối -> dấu phẩy là thập phân, chấm là phân cách hàng nghìn
                              clean = clean.replace(/\./g, '').replace(/,/g, '.');
                          }
                      }
                      // Nếu chỉ có dấu chấm
                      else if (clean.includes('.') && !clean.includes(',')) {
                          // Kiểm tra: nếu có 3 chữ số sau dấu chấm cuối cùng -> có thể là phân cách hàng nghìn
                          const lastDotIndex = clean.lastIndexOf('.');
                          const afterDot = clean.substring(lastDotIndex + 1);
                          if (afterDot.length === 3 && /^\d{3}$/.test(afterDot) && clean.split('.').length > 2) {
                              // Có nhiều dấu chấm -> phân cách hàng nghìn
                              clean = clean.replace(/\./g, '');
                          }
                          // Nếu không, coi là thập phân (giữ nguyên)
                      }
                      // Nếu chỉ có dấu phẩy
                      else if (clean.includes(',') && !clean.includes('.')) {
                          // Kiểm tra: nếu có 3 chữ số sau dấu phẩy cuối cùng -> phân cách hàng nghìn
                          const lastCommaIndex = clean.lastIndexOf(',');
                          const afterComma = clean.substring(lastCommaIndex + 1);
                          if (afterComma.length === 3 && /^\d{3}$/.test(afterComma) && clean.split(',').length > 2) {
                              // Có nhiều dấu phẩy -> phân cách hàng nghìn
                              clean = clean.replace(/,/g, '');
                          } else {
                              // Thập phân (format Việt Nam)
                              clean = clean.replace(/,/g, '.');
                          }
                      }
                      
                      const parsed = parseFloat(clean);
                      return isNaN(parsed) || !isFinite(parsed) ? null : parsed;
                  }).filter(n => n !== null);
                  
                  if (normalizedNumbers.length >= 2) {
                      // Tìm số lớn nhất hoặc nhỏ nhất
                      const targetValue = isFindLargest 
                          ? Math.max(...normalizedNumbers)
                          : Math.min(...normalizedNumbers);
                      
                      // Dùng các số từ câu hỏi làm options (giữ format gốc nếu có thể)
                      options = matches.slice(0, normalizedNumbers.length).map((match, i) => {
                          // Giữ format gốc nếu có thể, nhưng đảm bảo đúng giá trị
                          return String(normalizedNumbers[i]);
                      });
                      
                      // Đảm bảo có đủ 4 options (nếu thiếu, thêm số ngẫu nhiên gần đó)
                      while (options.length < 4 && options.length < 10) {
                          const randomNum = targetValue + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 10) + 1);
                          const randomStr = String(randomNum);
                          if (!options.includes(randomStr)) {
                              options.push(randomStr);
                          }
                      }
                      
                      // Giới hạn tối đa 4 options
                      options = options.slice(0, 4);
                      trueVal = String(targetValue);
                  }
              }
              
              // Nếu không extract được số, fallback về logic cũ
              if (!options || options.length < 2) {
                  const expr = q.expression_value || q.text; 
                  const numVal = evaluateMathLogic(expr); 
                  const safeNumVal = numVal !== null ? numVal : 0;
                  trueVal = String(safeNumVal);
                  const d1 = safeNumVal + Math.floor(Math.random() * 5) + 1; 
                  const d2 = Math.max(0, safeNumVal - Math.floor(Math.random() * 5) - 1); 
                  const d3 = safeNumVal + 10; 
                  const rawOptions = [safeNumVal, d1, d2, d3];
                  const uniqueOptions = [...new Set(rawOptions)];
                  while(uniqueOptions.length < 4) {
                      uniqueOptions.push(safeNumVal + uniqueOptions.length + 5);
                  }
                  options = uniqueOptions.map(String);
              }
          }
          else if (q.logic_type === 'comparison') {
                // Xử lý bài toán so sánh (< > =)
                const resultSign = compareExpressions(q.expression_left, q.expression_right); 
                trueVal = resultSign || "="; 
                options = [">", "<", "="];
                q.text = q.text.replace("...", "___"); 
          } 
          else {
                // Xử lý bài toán tính toán / toán đố (Mặc định)
                // Ưu tiên dùng expression_value, nếu không có thì fallback thử parse từ text (cho backup cũ)
                const expr = q.expression_value || q.text; 
                const numVal = evaluateMathLogic(expr); 
                
                // Nếu tính ra null (lỗi), gán giá trị mặc định an toàn để không crash
                const safeNumVal = numVal !== null ? numVal : 0;
                trueVal = String(safeNumVal);
                
                // Code TỰ SINH ra 3 đáp án nhiễu (Distractors)
                const d1 = safeNumVal + Math.floor(Math.random() * 5) + 1; 
                const d2 = Math.max(0, safeNumVal - Math.floor(Math.random() * 5) - 1); 
                const d3 = safeNumVal + 10; 
                
                // Tạo mảng options unique
                const rawOptions = [safeNumVal, d1, d2, d3];
                const uniqueOptions = [...new Set(rawOptions)];
                // Nếu sau khi lọc trùng bị thiếu, bù thêm số ngẫu nhiên
                while(uniqueOptions.length < 4) {
                    uniqueOptions.push(safeNumVal + uniqueOptions.length + 5);
                }

                options = uniqueOptions.map(String);
                
                // Thêm đơn vị vào nếu có
                if (q.unit) {
                    trueVal = `${trueVal} ${q.unit}`;
                    options = options.map(o => `${o} ${q.unit}`);
                }
          }

          // Xáo trộn vị trí đáp án
          options = options.sort(() => Math.random() - 0.5);
          
          // Tìm lại index của đáp án đúng
          const labels = ['A', 'B', 'C', 'D'];
          // Fallback: Nếu không tìm thấy trueVal (hiếm), mặc định chọn A
          let correctIdx = options.findIndex(o => o === trueVal);
          if (correctIdx === -1) {
              options[0] = trueVal;
              correctIdx = 0;
          }

          return { 
            ...q, 
            id: idx, 
            options: options, 
            correctOption: labels[correctIdx], 
            correctVal: trueVal, 
            level: q.level || 3, 
            topic: TOPIC_TRANSLATIONS[String(q.topic).toLowerCase().trim()] || 'arithmetic'
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
      if (isCorrect) { reward = REWARD_PER_LEVEL[currentQ.level] || 150; setSessionScore(prev => prev + reward); }
      
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
          
      } catch (error) { console.error("Lỗi lưu game:", error); setAppError("Lỗi lưu kết quả. Vui lòng kiểm tra lại mạng."); }
  };

  const redeemCash = (item) => {
      if (piggyBank >= item.value) {
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
              return <QuizScreen quizData={quizData} currentQIndex={currentQIndex} setGameState={setGameState} sessionScore={sessionScore} selectedOption={selectedOption} isSubmitted={isSubmitted} handleSelectOption={handleSelectOption} handleNextQuestion={handleNextQuestion} />; 
          case 'result':
              return <ResultScreen history={history} quizData={quizData} sessionScore={sessionScore} setGameState={setGameState} currentProfile={currentProfile} />; 
          case 'report':
              return <ReportScreen currentProfile={currentProfile} appUser={appUser} setGameState={setGameState} />; 
          case 'shop':
              return <ShopScreen piggyBank={piggyBank} setGameState={setGameState} redeemCash={redeemCash} redemptionHistory={redemptionHistory} appUser={appUser} />; 
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
      <div className="w-full h-full max-w-md bg-white shadow-2xl overflow-hidden relative flex flex-col sm:rounded-[2.5rem] sm:h-[95vh] sm:border-[8px] sm:border-slate-200">
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