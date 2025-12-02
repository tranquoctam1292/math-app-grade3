import { useState, useCallback } from 'react';
import { callGemini } from '../lib/gemini';
import { solveEquation, solveComparison, solveSimpleExpression, normalizeVal } from '../lib/utils';
import { TOPICS_LIST, TOPIC_TRANSLATIONS, BACKUP_QUESTIONS, REWARD_PER_LEVEL } from '../lib/constants';

// Helper tạo ràng buộc ngẫu nhiên (Giữ nguyên)
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

    // AI Logic Generator
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
        NỘI DUNG TẬP TRUNG: ${topicLabels}.
        YÊU CẦU: ${dynamicConstraint}
        QUY TẮC: 'correctVal' là số/từ đơn giản. 'options' đủ 4 giá trị.
        TYPES: mcq(40%), fill_blank(20%), comparison(10%), sorting(15%), matching(15%).
        OUTPUT JSON SCHEMA.
        `;

        // --- Helper process questions (ĐÃ CẬP NHẬT LOGIC FIX LỖI MATCHING) ---
        const processQuestions = (questions) => {
            return questions.map((q, idx) => {
                let processedQ = {
                    ...q, id: idx, level: q.level || 2,
                    topic: TOPIC_TRANSLATIONS[String(q.topic).toLowerCase().trim()] || 'arithmetic',
                    type: q.type || 'mcq'
                };
                
                // 1. FIX Sorting (Code cũ của bạn)
                if (processedQ.type === 'sorting') {
                    if ((!processedQ.items || processedQ.items.length === 0) && processedQ.correctOrder) {
                        processedQ.items = [...processedQ.correctOrder].sort(() => Math.random() - 0.5);
                    }
                    if ((!processedQ.items || processedQ.items.length === 0)) {
                        const numbers = processedQ.text.match(/\d+/g); 
                        if (numbers && numbers.length >= 2) {
                            const sortedNums = [...numbers].sort((a, b) => parseFloat(a) - parseFloat(b));
                            processedQ.correctOrder = sortedNums;
                            processedQ.items = [...numbers].sort(() => Math.random() - 0.5);
                        }
                    }
                }

                // 2. ✅ FIX MỚI CHO MATCHING: Tự động khôi phục pairs từ text nếu thiếu
                if (processedQ.type === 'matching') {
                    if (!processedQ.pairs || processedQ.pairs.length === 0) {
                        try {
                            // Regex tìm pattern: "A) 1+1" hoặc "1) 1+1" trong text
                            // Tách text làm 2 phần dựa vào chữ "với" (tiếng Việt) hoặc "with"
                            const parts = processedQ.text.split(/với|with|and/i);
                            if (parts.length >= 2) {
                                // Tìm tất cả các biểu thức hoặc số ở vế trái (A, B, C, D)
                                const leftMatches = parts[0].match(/[A-Za-z0-9]+\)\s*([^,]+)/g);
                                // Tìm tất cả kết quả ở vế phải (1, 2, 3, 4)
                                const rightMatches = parts[1].match(/[A-Za-z0-9]+\)\s*([^,]+)/g);

                                if (leftMatches && rightMatches) {
                                    const cleanVal = (str) => str.replace(/^[A-Za-z0-9]+\)\s*/, '').trim();
                                    
                                    const lefts = leftMatches.map(cleanVal);
                                    const rights = rightMatches.map(cleanVal);
                                    
                                    // Logic ghép cặp thông minh: Tính toán vế trái để tìm vế phải tương ứng
                                    const newPairs = [];
                                    lefts.forEach(leftExpr => {
                                        const solvedVal = solveSimpleExpression(leftExpr); // Tính toán: "11 + 19" -> 30
                                        if (solvedVal !== null) {
                                            // Tìm kết quả trong danh sách rights
                                            const matchingRight = rights.find(r => normalizeVal(r) === normalizeVal(solvedVal));
                                            if (matchingRight) {
                                                newPairs.push({ left: leftExpr, right: matchingRight });
                                            }
                                        }
                                    });
                                    
                                    // Nếu khôi phục được ít nhất 2 cặp -> Gán vào câu hỏi
                                    if (newPairs.length >= 2) {
                                        processedQ.pairs = newPairs;
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn("Lỗi khôi phục matching pairs:", e);
                        }
                    }
                }

                // 3. Logic MCQ cũ (giữ nguyên)
                if (processedQ.type === 'mcq' || processedQ.type === 'fill_blank' || processedQ.type === 'comparison') {
                    let computedVal = null;
                    if (processedQ.topic === 'finding_x' || processedQ.text.toLowerCase().includes('tìm x')) {
                        computedVal = solveEquation(processedQ.text);
                    } else if (processedQ.type === 'comparison') {
                        computedVal = solveComparison(processedQ.text);
                    } else if (processedQ.topic === 'arithmetic' || processedQ.topic === 'expressions') {
                        computedVal = solveSimpleExpression(processedQ.text);
                    }
                    if (computedVal !== null && !isNaN(computedVal)) processedQ.correctVal = String(computedVal);
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
            return processQuestions([...BACKUP_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 10));
        }
    }, [currentProfile, config]);

    // ... (Phần còn lại giữ nguyên)
    const startSession = (questions) => {
        setQuizData(questions);
        setCurrentQIndex(0); setSessionScore(0); setHistory([]);
        setSelectedOption(null); setIsSubmitted(false);
        setQuestionStartTime(Date.now());
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
        } else {
            isCorrect = normalizeVal(userAnswerData) === normalizeVal(currentQ.correctVal);
        }

        if (isCorrect) {
            setSessionScore(prev => prev + (REWARD_PER_LEVEL[currentQ.level] || 200));
        }
        setHistory(prev => [...prev, { ...currentQ, userAnswer: displayAnswer, isCorrect, timeTaken }]);
        setIsSubmitted(true);
    };

    const nextQuestion = () => {
        if (currentQIndex < quizData.length - 1) {
            setCurrentQIndex(prev => prev + 1);
            setSelectedOption(null); setIsSubmitted(false);
            setQuestionStartTime(Date.now());
            return true; 
        }
        return false; 
    };

    return {
        quizData, currentQIndex, selectedOption, isSubmitted, sessionScore, history,
        isGenerating, setIsGenerating, preloadedQuiz, setPreloadedQuiz,
        generateQuizQuestions, startSession, handleSelectOption, nextQuestion
    };
};