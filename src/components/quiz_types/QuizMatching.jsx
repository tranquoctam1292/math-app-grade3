import React, { useState } from 'react';
import { ClayButton } from '../../lib/helpers';

const QuizMatching = ({ question, onAnswer, isSubmitted }) => {
    // ✅ SỬA: Bỏ "setLeftItems" vì không dùng đến
    const [leftItems] = useState(() => {
        if (!question.pairs) return [];
        return question.pairs.map((p, i) => ({ id: `L${i}`, val: p.left, pairId: i }));
    });

    // ✅ SỬA: Bỏ "setRightItems" vì không dùng đến
    const [rightItems] = useState(() => {
        if (!question.pairs) return [];
        const rights = question.pairs.map((p, i) => ({ id: `R${i}`, val: p.right, pairId: i }));
        return rights.sort(() => Math.random() - 0.5);
    });
    
    // Đã xóa useEffect(...)

    const [selectedLeft, setSelectedLeft] = useState(null);
    const [matchedPairs, setMatchedPairs] = useState({}); // { leftId: rightId }
    const [wrongPair, setWrongPair] = useState(null); // Để hiển thị animation sai

    const handleLeftClick = (item) => {
        if (isSubmitted || matchedPairs[item.id]) return;
        setSelectedLeft(item);
        setWrongPair(null);
    };

    const handleRightClick = (item) => {
        if (isSubmitted || !selectedLeft) return;
        
        // Check logic ghép đôi (Dựa vào index ban đầu pairId)
        if (selectedLeft.pairId === item.pairId) {
            // Đúng
            const newMatches = { ...matchedPairs, [selectedLeft.id]: item.id };
            setMatchedPairs(newMatches);
            setSelectedLeft(null);

            // Kiểm tra xem đã xong hết chưa
            if (Object.keys(newMatches).length === leftItems.length) {
                setTimeout(() => onAnswer(true), 500); // Tự động submit TRUE nếu đúng hết
            }
        } else {
            // Sai
            setWrongPair({ left: selectedLeft.id, right: item.id });
            setTimeout(() => {
                setWrongPair(null);
                setSelectedLeft(null);
            }, 800);
        }
    };

    return (
        <div className="flex gap-4 justify-between h-full">
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
                            className={`min-h-[60px] font-bold text-sm sm:text-base px-2 ${bgClass}`}
                        >
                            {item.val}
                        </ClayButton>
                    );
                })}
            </div>

            {/* Cột Phải */}
            <div className="flex-1 flex flex-col gap-3 justify-center">
                {rightItems.map((item) => {
                    // Tìm xem item này đã được ghép với left nào chưa
                    const isMatched = Object.values(matchedPairs).includes(item.id);
                    const isWrong = wrongPair?.right === item.id;

                    let bgClass = "bg-white text-slate-700 border-slate-200";
                    if (isMatched) bgClass = "bg-green-100 text-green-700 border-green-300 opacity-50 cursor-default scale-95";
                    else if (isWrong) bgClass = "bg-red-100 text-red-700 border-red-300 animate-shake";

                    return (
                        <ClayButton 
                            key={item.id} 
                            onClick={() => handleRightClick(item)}
                            className={`min-h-[60px] font-bold text-sm sm:text-base px-2 ${bgClass}`}
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