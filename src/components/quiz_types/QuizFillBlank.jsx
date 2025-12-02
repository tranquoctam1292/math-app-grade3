import React, { useState } from 'react';
import { ClayButton, MathText } from '../../lib/helpers';
import { Delete, Check } from 'lucide-react';

const QuizFillBlank = ({ question, onAnswer, isSubmitted, userAnswer }) => {
    const [input, setInput] = useState("");

    const handlePress = (val) => {
        if (isSubmitted) return;

        if (val === 'DEL') {
            // Xóa ký tự cuối
            setInput(prev => prev.slice(0, -1));
        } 
        else if (val === 'OK') {
            // Nộp bài nếu có dữ liệu
            if (input.length > 0) onAnswer(input.trim());
        }
        else if (val === '/') {
            // Logic cho phân số:
            // 1. Không cho nhập '/' ở đầu tiên
            // 2. Không cho nhập nếu đã có dấu '/' rồi (chỉ hỗ trợ phân số đơn giản a/b)
            if (input.length > 0 && !input.includes('/')) {
                setInput(prev => prev + val);
            }
        }
        else {
            // Nhập số: Giới hạn độ dài để không vỡ giao diện
            setInput(prev => (prev.length < 10 ? prev + val : prev));
        }
    };

    return (
        <div className="flex flex-col items-center w-full">
            {/* Display Area */}
            <div className="w-full bg-indigo-50 p-6 rounded-3xl border-2 border-indigo-100 mb-6 text-center shadow-inner relative">
                <div className="text-2xl font-bold text-slate-700 leading-loose">
                    <MathText text={question.text.replace("__", "___")} />
                </div>
                
                <div className="mt-4 flex flex-col justify-center items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Câu trả lời của bé:</span>
                    <div className={`min-w-[140px] h-16 border-b-4 text-3xl font-black text-center flex items-center justify-center px-4 transition-all ${
                        isSubmitted 
                            ? (String(userAnswer) === String(question.correctVal) 
                                ? 'border-green-500 text-green-600 bg-green-50 rounded-xl' 
                                : 'border-red-500 text-red-600 bg-red-50 rounded-xl') 
                            : 'border-indigo-400 text-indigo-600 bg-white rounded-xl shadow-sm'
                    }`}>
                        {/* Nếu đã nộp thì hiện userAnswer, chưa nộp thì hiện input */}
                        {isSubmitted ? userAnswer : input}
                        
                        {/* Con trỏ nhấp nháy */}
                        {!isSubmitted && <span className="animate-pulse text-indigo-300 ml-1">|</span>}
                    </div>
                </div>
            </div>

            {/* Custom Numpad */}
            {!isSubmitted && (
                <div className="w-full max-w-[300px]">
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        {/* Hàng 1-3: Các số 1-9 */}
                        {[1,2,3,4,5,6,7,8,9].map(n => (
                            <ClayButton key={n} onClick={() => handlePress(n)} className="h-14 font-black text-2xl bg-white text-slate-600 border-slate-200 active:bg-slate-100 shadow-sm">
                                {n}
                            </ClayButton>
                        ))}

                        {/* Hàng 4: Dấu phần (/), Số 0, Xóa */}
                        <ClayButton onClick={() => handlePress('/')} className="h-14 font-black text-2xl bg-white text-indigo-600 border-indigo-200 active:bg-indigo-50">
                            /
                        </ClayButton>
                        
                        <ClayButton onClick={() => handlePress(0)} className="h-14 font-black text-2xl bg-white text-slate-600 border-slate-200 active:bg-slate-100">
                            0
                        </ClayButton>

                        <ClayButton onClick={() => handlePress('DEL')} className="h-14 flex items-center justify-center bg-red-50 text-red-500 border-red-200 active:bg-red-100">
                            <Delete size={24}/>
                        </ClayButton>
                    </div>

                    {/* Hàng cuối: Nút OK to rõ ràng */}
                    <ClayButton 
                        onClick={() => handlePress('OK')} 
                        colorClass="bg-green-500 text-white border-green-600 hover:bg-green-600" 
                        className="w-full h-16 flex items-center justify-center gap-2 font-black text-xl shadow-md !rounded-2xl"
                        disabled={input.length === 0} // Disable nếu chưa nhập gì
                    >
                        TRẢ LỜI NGAY <Check size={28} strokeWidth={4}/>
                    </ClayButton>
                </div>
            )}
        </div>
    );
};

export default QuizFillBlank;