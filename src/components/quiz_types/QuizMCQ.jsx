import React from 'react';
import { ClayButton, MathText } from '../../lib/helpers';
import { CheckCircle, XCircle } from 'lucide-react';

const QuizMCQ = ({ question, onAnswer, isSubmitted, userAnswer }) => {
    return (
        <div className="space-y-3">
            {question.options.map((opt, idx) => {
                const label = ['A', 'B', 'C', 'D'][idx];
                let stateClass = "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50";
                let icon = <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-2 bg-white border-current`}>{label}</div>;

                if (isSubmitted) {
                    // Logic màu sắc khi đã nộp bài
                    // So sánh trực tiếp giá trị (Value) hoặc Label nếu cần
                    const isCorrectVal = String(opt).trim() === String(question.correctVal).trim();
                    const isUserSelected = String(opt).trim() === String(userAnswer).trim();

                    if (isCorrectVal) {
                        stateClass = "bg-green-100 border-green-600 text-green-800 ring-4 ring-green-200 scale-[1.02] shadow-xl";
                        icon = <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm bg-green-600 text-white border-green-700"><CheckCircle size={18}/></div>;
                    } else if (isUserSelected) {
                        stateClass = "bg-red-100 border-red-600 text-red-800 ring-4 ring-red-200 animate-shake opacity-60";
                        icon = <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm bg-red-600 text-white border-red-700"><XCircle size={18}/></div>;
                    } else {
                        stateClass = "bg-slate-50 border-slate-100 text-slate-300 opacity-40 grayscale";
                    }
                } else if (userAnswer === opt) {
                    stateClass = "bg-blue-50 border-blue-500 text-blue-700";
                }

                return (
                    <ClayButton
                        key={idx}
                        onClick={() => onAnswer(opt)} // Trả về giá trị option luôn
                        disabled={isSubmitted}
                        className={`w-full min-h-[72px] flex items-center px-4 gap-4 ${stateClass} border-2 transition-all duration-200`}
                    >
                        {icon}
                        <span className="text-xl font-bold flex-1 text-left"><MathText text={opt} /></span>
                    </ClayButton>
                )
            })}
        </div>
    );
};

export default QuizMCQ;