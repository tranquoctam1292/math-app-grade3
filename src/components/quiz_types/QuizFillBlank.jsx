import React, { useState } from 'react';
import { ClayButton, MathText } from '../../lib/helpers';
import { Delete, Check } from 'lucide-react';

const QuizFillBlank = ({ question, onAnswer, isSubmitted, userAnswer }) => {
    const [input, setInput] = useState("");

    const handlePress = (val) => {
        if (isSubmitted) return;
        if (val === 'DEL') setInput(prev => prev.slice(0, -1));
        else if (val === 'OK') {
            if (input.length > 0) onAnswer(input.trim());
        }
        else setInput(prev => (prev.length < 5 ? prev + val : prev));
    };

    return (
        <div className="flex flex-col items-center w-full">
            {/* Display Area */}
            <div className="w-full bg-indigo-50 p-6 rounded-3xl border-2 border-indigo-100 mb-6 text-center shadow-inner">
                <div className="text-2xl font-bold text-slate-700 leading-loose">
                    <MathText text={question.text.replace("__", "___")} />
                </div>
                <div className="mt-4 flex justify-center items-center gap-2">
                    <span className="text-sm font-bold text-slate-400 uppercase">Trả lời:</span>
                    <div className={`min-w-[100px] h-12 border-b-4 text-3xl font-black text-center flex items-center justify-center px-4 ${
                        isSubmitted 
                            ? (String(userAnswer) === String(question.correctVal) ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600') 
                            : 'border-indigo-400 text-indigo-600 bg-white rounded-lg'
                    }`}>
                        {isSubmitted ? userAnswer : input}
                        {!isSubmitted && <span className="animate-pulse text-indigo-300 ml-1">|</span>}
                    </div>
                </div>
            </div>

            {/* Numpad */}
            {!isSubmitted && (
                <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                        <ClayButton key={n} onClick={() => handlePress(n)} className="h-14 font-black text-2xl bg-white text-slate-600 border-slate-200 active:bg-slate-100">
                            {n}
                        </ClayButton>
                    ))}
                    <ClayButton onClick={() => handlePress('DEL')} className="h-14 flex items-center justify-center bg-red-100 text-red-500 border-red-200">
                        <Delete size={24}/>
                    </ClayButton>
                    <ClayButton onClick={() => handlePress(0)} className="h-14 font-black text-2xl bg-white text-slate-600 border-slate-200">
                        0
                    </ClayButton>
                    <ClayButton onClick={() => handlePress('OK')} colorClass="bg-green-500 text-white border-green-600" className="h-14 flex items-center justify-center">
                        <Check size={28} strokeWidth={4}/>
                    </ClayButton>
                </div>
            )}
        </div>
    );
};

export default QuizFillBlank;