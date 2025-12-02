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

        const aiPrompt = `
        Mã phiên: ${randomSeed}. Vai trò: GV Toán lớp 3. Tạo 10 câu hỏi JSON.
        BỐI CẢNH: ${config.semester === 'hk1' ? 'HK1' : 'HK2'}. Chủ đề: ${randomTheme}.
        CHỈ TẠO CÂU HỎI VỀ CHỦ ĐỀ: ${topicLabels}. TUYỆT ĐỐI KHÔNG tạo câu hỏi ngoài các chủ đề này.
        YÊU CẦU: ${dynamicConstraint}. Câu văn ngắn gọn. TUYỆT ĐỐI KHÔNG dùng đơn vị "tá", "lạng". Sử dụng đơn vị chuẩn: kg, g, lít, ml, km, m, cm, mm.
        QUY TẮC: 'correctVal' là số/từ đơn giản. 'options' đủ 4 giá trị.
        TYPES: mcq(40%), fill_blank(20%), comparison(10%), sorting(15%), matching(15%).
        Lưu ý: Nếu chủ đề là Hình học, hãy ưu tiên Type 'mcq' và 'comparison', giảm bớt 'sorting' nếu không phù hợp.
        OUTPUT JSON SCHEMA.
        `;

        const processQuestions = (questions) => {
            return questions.map((q, idx) => {
                let processedQ = {
                    ...q, id: idx, level: q.level || 2,
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