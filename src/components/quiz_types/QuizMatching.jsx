import React, { useState } from 'react';
import { ClayButton } from '../../lib/helpers';

const QuizMatching = ({ question, onAnswer, isSubmitted }) => {
    // Logic khởi tạo an toàn
    const [leftItems] = useState(() => {
        if (!question.pairs || !Array.isArray(question.pairs)) return [];
        return question.pairs.map((p, i) => ({ id: `L${i}`, val: p.left, pairId: i }));
    });

    const [rightItems] = useState(() => {
        if (!question.pairs || !Array.isArray(question.pairs)) return [];
        const rights = question.pairs.map((p, i) => ({ id: `R${i}`, val: p.right, pairId: i }));
        return rights.sort(() => Math.random() - 0.5);
    });

    const [selectedLeft, setSelectedLeft] = useState(null);
    const [matchedPairs, setMatchedPairs] = useState({});
    const [wrongPair, setWrongPair] = useState(null);

    // ✅ Hiển thị fallback nếu dữ liệu lỗi
    if (leftItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl">🧩</div>
                <h3 className="text-lg font-bold text-slate-700">Lỗi hiển thị câu hỏi</h3>
                <p className="text-sm text-slate-500">Dữ liệu ghép cặp bị thiếu. Bé hãy bấm "Bỏ qua" hoặc nộp bài để sang câu tiếp theo nhé!</p>
                {/* Nút cứu cánh để qua màn */}
                {!isSubmitted && (
                    <ClayButton onClick={() => onAnswer(true)} colorClass="bg-indigo-500 text-white" className="px-6 py-3 font-bold">
                        Bỏ qua câu này
                    </ClayButton>
                )}
            </div>
        );
    }

    const handleLeftClick = (item) => {
        if (isSubmitted || matchedPairs[item.id]) return;
        setSelectedLeft(item);
        setWrongPair(null);
    };

    const handleRightClick = (item) => {
        if (isSubmitted || !selectedLeft) return;
        
        if (selectedLeft.pairId === item.pairId) {
            const newMatches = { ...matchedPairs, [selectedLeft.id]: item.id };
            setMatchedPairs(newMatches);
            setSelectedLeft(null);

            if (Object.keys(newMatches).length === leftItems.length) {
                setTimeout(() => onAnswer(true), 500);
            }
        } else {
            setWrongPair({ left: selectedLeft.id, right: item.id });
            setTimeout(() => {
                setWrongPair(null);
                setSelectedLeft(null);
            }, 800);
        }
    };

    return (
        <div className="flex gap-2 sm:gap-4 justify-between h-full">
            {/* Cột Trái */}
            <div className="flex-1 flex flex-col gap-3 justify-center">
                {leftItems.map((item) => {
                    const isMatched = !!matchedPairs[item.id];
                    const isSelected = selectedLeft?.id === item.id;
                    const isWrong = wrongPair?.left === item.id;

                    let bgClass = "bg-white text-slate-700 border-slate-200";
                    if (isMatched) bgClass = "bg-green-100 text-green-700 border-green-300 opacity-50 cursor-default scale-95";
                    else if (isWrong) bgClass = "bg-red-100 text-red-700 border-red-300 animate-shake";
                    else if (isSelected) bgClass = "bg-indigo-500 text-white border-indigo-700 scale-105 shadow-lg ring-2 ring-indigo-200";

                    return (
                        <ClayButton 
                            key={item.id} 
                            onClick={() => handleLeftClick(item)}
                            className={`min-h-[60px] font-bold text-sm sm:text-base px-2 break-words whitespace-normal ${bgClass}`}
                        >
                            {item.val}
                        </ClayButton>
                    );
                })}
            </div>

            {/* Cột Phải */}
            <div className="flex-1 flex flex-col gap-3 justify-center">
                {rightItems.map((item) => {
                    const isMatched = Object.values(matchedPairs).includes(item.id);
                    const isWrong = wrongPair?.right === item.id;

                    let bgClass = "bg-white text-slate-700 border-slate-200";
                    if (isMatched) bgClass = "bg-green-100 text-green-700 border-green-300 opacity-50 cursor-default scale-95";
                    else if (isWrong) bgClass = "bg-red-100 text-red-700 border-red-300 animate-shake";

                    return (
                        <ClayButton 
                            key={item.id} 
                            onClick={() => handleRightClick(item)}
                            className={`min-h-[60px] font-bold text-sm sm:text-base px-2 break-words whitespace-normal ${bgClass}`}
                        >
                            {item.val}
                        </ClayButton>
                    );
                })}
            </div>
        </div>
    );
};

export default QuizMatching;