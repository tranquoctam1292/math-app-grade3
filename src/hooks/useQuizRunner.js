import { useState, useCallback } from 'react';
import { callGemini } from '../lib/gemini';
import { 
    solveEquation, 
    solveComparison, 
    solveSimpleExpression, 
    normalizeVal,
    normalizeComparisonSymbol 
} from '../lib/utils';
import { TOPICS_LIST, TOPIC_TRANSLATIONS, REWARD_PER_LEVEL } from '../lib/constants';
import { buildOfflineQuiz } from '../lib/offlineGenerator';
import { evaluate } from 'mathjs';

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
        "Hãy tạo ít nhất 1 câu hỏi so sánh.",
        `Hãy sử dụng các số kết thúc bằng ${Math.floor(Math.random() * 9)}.`
    ];
    return constraints.sort(() => 0.5 - Math.random()).slice(0, 2).join(" ");
};

export const useQuizRunner = (currentProfile, config) => {
    const [quizData, setQuizData] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [sessionScore, setSessionScore] = useState(0);
    const [history, setHistory] = useState([]);
    const [questionStartTime, setQuestionStartTime] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [preloadedQuiz, setPreloadedQuiz] = useState(null);
    const [attemptCount, setAttemptCount] = useState(0);

    const generateQuizQuestions = useCallback(async (isBackground = false) => {
        if (!currentProfile) return null;

        const randomSeed = Math.floor(Math.random() * 1000000);
        const dynamicConstraint = getRandomConstraints();
        const topicLabels = TOPICS_LIST.filter(t => config.selectedTopics.includes(t.id)).map(t => t.label).join(", ");
        const themes = ["Siêu thị", "Nông trại", "Trường học", "Thám hiểm đại dương", "Vũ trụ", "Thế giới kẹo ngọt"];
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];

        // Map difficultyMode sang level range và mô tả
        const difficultyInfo = {
            easy: { levelRange: '1-2', description: 'Khởi động - Dành cho bé cần củng cố gốc', levels: [1, 2] },
            medium: { levelRange: '2-3', description: 'Tiêu chuẩn - Bám sát SGK trên lớp', levels: [2, 3] },
            hard: { levelRange: '3-4', description: 'Thần đồng - Thử thách tư duy & HS Giỏi', levels: [3, 4] }
        };
        const currentDifficulty = difficultyInfo[config.difficultyMode] || difficultyInfo.medium;

        // ✅ Tiêu chuẩn độ khó chi tiết cho từng level (dựa trên SGK Toán lớp 3 HK1)
        const getLevelStandards = (level) => {
            switch (level) {
                case 1:
                    return `Level 1 - Khởi Động:
- Phạm vi số: 1-100 (số có 1-2 chữ số, số tròn chục: 10, 20, 30, ..., 90)
- Phép tính: Cộng/trừ đơn giản trong phạm vi 100 (không nhớ hoặc nhớ 1 lần). Ví dụ: 25 + 13, 48 - 25
- Bảng nhân/chia: CHỈ dùng bảng nhân 2, 5 và bảng chia 2, 5. Ví dụ: 2 × 6, 5 × 4, 18 : 2, 15 : 5
- Độ phức tạp: Tính toán trực tiếp 1 bước, không cần suy luận phức tạp
- Ví dụ: "Bé tính: 35 + 24 = ?", "Bảng nhân 2: 2 × 6 = ?", "Chia hết: 18 : 2 = ?"`;
                case 2:
                    return `Level 2 - Tiêu Chuẩn:
- Phạm vi số: 100-1000 (số có 2-3 chữ số, số tròn trăm: 100, 200, 300, ..., 900)
- Phép tính: Cộng/trừ có nhớ trong phạm vi 1000. Ví dụ: 256 + 187, 432 - 189
- Bảng nhân/chia: CHỈ dùng bảng nhân 3, 4, 6 và bảng chia 3, 4, 6. Ví dụ: 3 × 7, 4 × 8, 21 : 3, 32 : 4
- Nhân số tròn chục với số có một chữ số: 20 × 3, 50 × 4
- Chia số tròn chục/trăm cho số có một chữ số: 60 : 3, 200 : 4
- Độ phức tạp: Tính toán 1-2 bước, có thể cần suy luận đơn giản
- Ví dụ: "Tính: 347 + 258 = ?", "Bảng nhân 4: 4 × 7 = ?", "Gấp 5 lên 3 lần được bao nhiêu?"`;
                case 3:
                    return `Level 3 - Nâng Cao:
- Phạm vi số: 500-1000 (số có 3 chữ số, gần giới hạn, có thể đến 999)
- Phép tính: Nhân với số có một chữ số (không nhớ): 234 × 2, 456 × 3
- Chia cho số có một chữ số: 648 : 3, 875 : 5
- Phép chia có dư: 17 : 3 = 5 dư 2, 47 : 6 = 7 dư 5
- Bảng nhân/chia: CHỈ dùng bảng nhân 7, 8, 9 và bảng chia 7, 8, 9. Ví dụ: 7 × 8, 8 × 9, 56 : 7, 72 : 8
- So sánh số lớn gấp mấy lần số bé: "Số 24 gấp mấy lần số 6?"
- Biểu thức số đơn giản: (5 + 3) × 2, (12 + 8) × 3
- Độ phức tạp: Tính toán 2-3 bước, cần suy luận và phân tích
- Ví dụ: "Tính: 456 × 3 = ?", "Chia có dư: 47 : 6 = ?", "Tính giá trị biểu thức: (12 + 8) × 3 = ?"`;
                case 4:
                    return `Level 4 - Thần Đồng:
- Phạm vi số: 800-1000 (số lớn nhất trong phạm vi HK1)
- Phép tính: Nhân với số có một chữ số (có nhớ): 789 × 4, 956 × 7
- Chia cho số có một chữ số (phức tạp): 987 : 3, 856 : 4
- Tính giá trị biểu thức số phức tạp: (45 + 15) : 3, (100 - 40) × 2, ((10 + 5) × 2) : 3
- Giải bài toán có đến hai bước tính: "Có 3 thùng, mỗi thùng có 24 quả cam. Người ta bán đi 15 quả. Hỏi còn lại bao nhiêu quả?"
- Bảng nhân/chia 7, 8, 9: Vận dụng linh hoạt
- Độ phức tạp: Tính toán 3+ bước, cần tư duy logic và phân tích, bài toán đố phức tạp
- Ví dụ: "Tính: 789 × 6 = ?", "Tính giá trị biểu thức: (100 - 28) : 4 = ?", "Một cửa hàng có 5 thùng, mỗi thùng có 48 quyển vở. Người ta bán đi 3 thùng. Hỏi còn lại bao nhiêu quyển vở?"`;
                default:
                    return '';
            }
        };

        // Tạo chuỗi tiêu chuẩn cho các level được phép
        const levelStandardsText = currentDifficulty.levels.map(level => getLevelStandards(level)).join('\n\n');

        const aiPrompt = `
        Mã phiên: ${randomSeed}. Vai trò: GV Toán lớp 3. Tạo 10 câu hỏi JSON.
        BỐI CẢNH: ${config.semester === 'hk1' ? 'HK1' : 'HK2'}. Chủ đề: ${randomTheme}.
        
        ĐỘ KHÓ: ${currentDifficulty.description} (Level ${currentDifficulty.levelRange}). 
        Mỗi câu hỏi PHẢI có trường 'level' là một trong các giá trị: ${currentDifficulty.levels.join(', ')}.
        
        ✅ TIÊU CHUẨN ĐỘ KHÓ CHI TIẾT (TUYỆT ĐỐI PHẢI TUÂN THỦ):
        ${levelStandardsText}
        
        QUY TẮC QUAN TRỌNG:
        - Nếu level = 1: CHỈ dùng số 1-100, CHỈ dùng bảng nhân/chia 2, 5
        - Nếu level = 2: Dùng số 100-1000, CHỈ dùng bảng nhân/chia 3, 4, 6, có thể nhân/chia số tròn chục/trăm
        - Nếu level = 3: Dùng số 500-1000, CHỈ dùng bảng nhân/chia 7, 8, 9, có thể chia có dư, biểu thức số đơn giản
        - Nếu level = 4: Dùng số 800-1000, nhân/chia có nhớ, biểu thức số phức tạp, bài toán đố 2+ bước
        
        CHỈ TẠO CÂU HỎI VỀ CHỦ ĐỀ: ${topicLabels}. TUYỆT ĐỐI KHÔNG tạo câu hỏi ngoài các chủ đề này.
        YÊU CẦU: ${dynamicConstraint}. Câu văn ngắn gọn. TUYỆT ĐỐI KHÔNG dùng đơn vị "tá", "lạng". Sử dụng đơn vị chuẩn: kg, g, lít, ml, km, m, cm, mm.
        QUY TẮC: 'correctVal' là số/từ đơn giản. 'options' đủ 4 giá trị. 'level' PHẢI là ${currentDifficulty.levels.join(' hoặc ')}.
        TYPES: mcq(40%), fill_blank(20%), comparison(10%), sorting(15%), matching(15%).
        Lưu ý: 
        - Nếu chủ đề là Hình học, hãy ưu tiên Type 'mcq' và 'comparison', giảm bớt 'sorting' nếu không phù hợp.
        - ✅ QUAN TRỌNG: Với phép chia có dư, PHẢI dùng type 'mcq' (KHÔNG dùng 'fill_blank'). Format: text = "Chia có dư: 47 : 6 = ?", correctVal = "7 dư 5", options = ["7 dư 5", "7 dư 4", "8 dư 1", "6 dư 5"].
        OUTPUT JSON SCHEMA.
        `;

        const processQuestions = (questions) => {
            // Import chooseLevel từ offlineGenerator để đảm bảo level phù hợp với difficultyMode
            const chooseLevel = (difficulty) => {
                const DIFFICULTY_MIX = {
                    easy: { 2: 7, 3: 3, 4: 0 },
                    medium: { 2: 4, 3: 4, 4: 2 },
                    hard: { 2: 2, 3: 4, 4: 4 }
                };
                const mix = DIFFICULTY_MIX[difficulty] || DIFFICULTY_MIX.medium;
                const pool = Object.entries(mix).flatMap(([level, count]) => Array(count).fill(Number(level)));
                return pool[Math.floor(Math.random() * pool.length)];
            };

            const currentDifficulty = difficultyInfo[config.difficultyMode] || difficultyInfo.medium;
            
            return questions.map((q, idx) => {
                // Validate và điều chỉnh level dựa trên difficultyMode
                let questionLevel = q.level;
                
                // Kiểm tra xem level từ AI có hợp lệ không
                const isValidLevel = questionLevel && typeof questionLevel === 'number' && questionLevel >= 1 && questionLevel <= 4;
                const isLevelInDifficultyRange = isValidLevel && currentDifficulty.levels.includes(questionLevel);
                
                if (!isValidLevel || !isLevelInDifficultyRange) {
                    // Nếu AI không trả về level hoặc level không phù hợp với difficultyMode, chọn level dựa trên difficultyMode
                    questionLevel = chooseLevel(config.difficultyMode);
                    if (import.meta.env.DEV && !isValidLevel) {
                        console.warn(`Question ${idx + 1}: Invalid level from AI (${q.level}), using ${questionLevel} based on difficultyMode: ${config.difficultyMode}`);
                    } else if (import.meta.env.DEV && !isLevelInDifficultyRange) {
                        console.warn(`Question ${idx + 1}: Level ${q.level} not in difficulty range ${currentDifficulty.levels.join(', ')}, using ${questionLevel}`);
                    }
                }

                let processedQ = {
                    ...q, id: idx, level: questionLevel,
                    topic: TOPIC_TRANSLATIONS[String(q.topic).toLowerCase().trim()] || 'arithmetic',
                    type: q.type || 'mcq'
                };
                
                // --- LOGIC TỰ SỬA LỖI AI (SELF-CORRECTION) ---
                let computedVal = null;

                if (processedQ.type === 'comparison') {
                    const originalCorrectVal = processedQ.correctVal; // Lưu giá trị từ AI
                    computedVal = solveComparison(processedQ.text);
                    // ✅ FIX: Với comparison, computedVal là string ('>', '<', '='), luôn cập nhật nếu tính được
                    if (computedVal !== null && (computedVal === '>' || computedVal === '<' || computedVal === '=')) {
                        // Validate: Đảm bảo correctVal từ AI khớp với tính toán
                        if (originalCorrectVal && originalCorrectVal !== computedVal) {
                            console.warn(`Comparison answer mismatch: AI said "${originalCorrectVal}", computed "${computedVal}". Using computed value.`);
                        }
                        processedQ.correctVal = computedVal; // Luôn dùng giá trị tính được
                    } else if (computedVal === null) {
                        // Nếu không tính được, validate correctVal từ AI bằng cách tính lại
                        console.warn(`Could not compute comparison for: ${processedQ.text}. Using AI value: ${originalCorrectVal}`);
                        // Giữ nguyên giá trị từ AI nếu không tính được
                    }
                } else if (processedQ.topic === 'finding_x' || processedQ.text.toLowerCase().includes('tìm x')) {
                    computedVal = solveEquation(processedQ.text);
                    if (computedVal !== null && !isNaN(computedVal)) {
                        processedQ.correctVal = String(computedVal);
                    } else {
                        console.warn(`Could not solve equation for: ${processedQ.text}. Using AI value: ${processedQ.correctVal}`);
                    }
                } else if ((processedQ.type === 'mcq' || processedQ.type === 'fill_blank') && (processedQ.topic === 'arithmetic' || processedQ.topic === 'expressions')) {
                    computedVal = solveSimpleExpression(processedQ.text);
                    if (computedVal !== null && !isNaN(computedVal)) {
                        const correctStr = String(computedVal);
                        // Validate: Nếu AI đưa đáp án khác với tính toán, dùng tính toán
                        if (processedQ.correctVal && normalizeVal(processedQ.correctVal) !== normalizeVal(correctStr)) {
                            console.warn(`MCQ/FillBlank answer mismatch: AI said "${processedQ.correctVal}", computed "${correctStr}". Using computed value.`);
                        }
                        processedQ.correctVal = correctStr;

                        if (processedQ.type === 'mcq' && Array.isArray(processedQ.options)) {
                            const hasCorrectOption = processedQ.options.some(opt => normalizeVal(opt) === normalizeVal(correctStr));
                            if (!hasCorrectOption) {
                                processedQ.options[Math.floor(Math.random() * 4)] = correctStr;
                            }
                        }
                    } else {
                        console.warn(`Could not compute expression for: ${processedQ.text}. Using AI value: ${processedQ.correctVal}`);
                    }
                }

                // --- FIX SORTING ---
                if (processedQ.type === 'sorting') {
                    if (!processedQ.items || processedQ.items.length === 0) {
                        let foundItems = processedQ.text.match(/\d+\s*\/\s*\d+/g);
                        if (!foundItems || foundItems.length < 2) {
                            foundItems = processedQ.text.match(/-?\d+(\.\d+)?/g);
                        }
                        if (foundItems && foundItems.length >= 2) processedQ.items = foundItems;
                    }
                    if (processedQ.items && (!processedQ.correctOrder || processedQ.correctOrder.length === 0)) {
                        try {
                            const sorted = [...processedQ.items].sort((a, b) => {
                                const valA = evaluate(String(a).replace(',', '.'));
                                const valB = evaluate(String(b).replace(',', '.'));
                                return processedQ.text.toLowerCase().includes('giảm') ? valB - valA : valA - valB;
                            });
                            processedQ.correctOrder = sorted;
                        } catch {
                            // ✅ FIX: Bỏ biến 'e' không dùng
                            processedQ.correctOrder = processedQ.items.sort(); 
                        }
                    }
                    if (processedQ.items) processedQ.items = [...processedQ.items].sort(() => Math.random() - 0.5);
                }

                // --- FIX MATCHING ---
                if (processedQ.type === 'matching') {
                    if (!processedQ.pairs || processedQ.pairs.length === 0) {
                        try {
                            let splitParts = processedQ.text.split(/(?:\.\s*|\n)(?:Kết quả|Đáp án|Cột phải|Result|Answer):/i);
                            if (splitParts.length < 2) {
                                const withSplit = processedQ.text.split(/\s+với\s+(?=[0-9A-Z])/i);
                                if (withSplit.length >= 2) splitParts = withSplit;
                                else splitParts = [processedQ.text, processedQ.text];
                            }

                            const extractItems = (str, pattern) => {
                                const matches = str.match(pattern);
                                return matches ? matches.map(m => m.replace(/^[A-Z0-9]+\s*[).:-]\s*/i, '').trim()) : [];
                            };

                            const numPattern = /[1-4]\s*[).:-]\s*[^,;\n]+/g; 
                            let leftRaw = extractItems(splitParts[0], numPattern);
                            // 

                            if (leftRaw.length === 0) {
                                // ✅ FIX: Sửa lỗi Regex "Unnecessary escape character" (\+ -> +, \* -> *)
                                leftRaw = processedQ.text.match(/\d+\s*[+\-x*]\s*\d+/g) || [];
                            }

                            const newPairs = [];
                            leftRaw.forEach(leftExpr => {
                                const solvedLeft = solveSimpleExpression(leftExpr);
                                if (solvedLeft !== null) {
                                    const matchRight = String(solvedLeft);
                                    if (processedQ.text.includes(matchRight)) {
                                            newPairs.push({ left: leftExpr, right: matchRight });
                                    }
                                }
                            });
                            if (newPairs.length > 0) processedQ.pairs = newPairs;
                        } catch (e) { console.warn(e); }
                    }
                }

                return processedQ;
            });
        };

        try {
            const aiResult = await callGemini(aiPrompt);
            if (aiResult && !aiResult.debug_error && Array.isArray(aiResult)) {
                return processQuestions(aiResult.slice(0, 10));
            }
            throw new Error("AI data invalid");
        } catch (e) {
            console.warn("AI Error, using backup:", e);
            if (isBackground) return null;

            const offline = buildOfflineQuiz(config);
            return processQuestions(offline);
        }
    }, [currentProfile, config]);

    const startSession = (questions) => {
        setQuizData(questions);
        setCurrentQIndex(0); setSessionScore(0); setHistory([]);
        setSelectedOption(null); setIsSubmitted(false);
        setQuestionStartTime(Date.now());
        setAttemptCount(0);
    };

    const handleSelectOption = (userAnswerData) => {
        if (isSubmitted) return;
        const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
        let displayAnswer = typeof userAnswerData === 'object' ? JSON.stringify(userAnswerData) : userAnswerData;
        setSelectedOption(displayAnswer);

        const currentQ = quizData[currentQIndex];
        let isCorrect = false;
        
        if (currentQ.type === 'sorting') {
            const userArr = Array.isArray(userAnswerData) ? userAnswerData : [];
            const correctArr = currentQ.correctOrder || [];
            if (userArr.length === correctArr.length) {
                isCorrect = userArr.every((val, index) => normalizeVal(val) === normalizeVal(correctArr[index]));
            }
        } else if (currentQ.type === 'matching') {
            isCorrect = userAnswerData === true;
        } else if (currentQ.type === 'comparison') {
            isCorrect = normalizeComparisonSymbol(userAnswerData) === normalizeComparisonSymbol(currentQ.correctVal);
        } else {
            isCorrect = normalizeVal(userAnswerData) === normalizeVal(currentQ.correctVal);
        }

        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);

        // Tính điểm: Nếu đúng ở lần 2, chỉ cộng 50% điểm
        if (isCorrect) {
            const baseReward = REWARD_PER_LEVEL[currentQ.level] || 200;
            const finalReward = newAttemptCount === 2 ? Math.floor(baseReward * 0.5) : baseReward;
            setSessionScore(prev => prev + finalReward);
        }
        
        setHistory(prev => [...prev, { ...currentQ, userAnswer: displayAnswer, isCorrect, timeTaken, attemptCount: newAttemptCount }]);
        setIsSubmitted(true);
    };

    const resetCurrentQuestion = () => {
        setSelectedOption(null);
        setIsSubmitted(false);
        // Giữ nguyên attemptCount để tiếp tục đếm
    };

    const nextQuestion = () => {
        if (currentQIndex < quizData.length - 1) {
            setCurrentQIndex(prev => prev + 1);
            setSelectedOption(null); setIsSubmitted(false);
            setQuestionStartTime(Date.now());
            setAttemptCount(0); // Reset attempt count khi chuyển câu
            return true; 
        }
        return false; 
    };

    return {
        quizData, currentQIndex, selectedOption, isSubmitted, sessionScore, history,
        isGenerating, setIsGenerating, preloadedQuiz, setPreloadedQuiz,
        attemptCount, setAttemptCount,
        generateQuizQuestions, startSession, handleSelectOption, nextQuestion, resetCurrentQuestion
    };
};