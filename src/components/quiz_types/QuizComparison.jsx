import React from 'react';
import { ClayButton } from '../../lib/helpers';

const QuizComparison = ({ question, onAnswer, isSubmitted, userAnswer }) => {
    const options = ['>', '=', '<'];

    return (
        <div className="flex justify-center gap-4 mt-8">
            {options.map((opt, idx) => {
                let stateClass = "bg-white border-slate-200 text-indigo-600 hover:border-indigo-400 hover:-translate-y-1";
                
                if (isSubmitted) {
                    const isCorrect = opt === question.correctVal;
                    const isSelected = opt === userAnswer;
                    
                    if (isCorrect) stateClass = "bg-green-500 text-white border-green-600 shadow-xl ring-4 ring-green-200";
                    else if (isSelected) stateClass = "bg-red-500 text-white border-red-600 opacity-50";
                    else stateClass = "bg-slate-100 text-slate-300 border-slate-200 grayscale";
                }

                return (
                    <ClayButton
                        key={idx}
                        onClick={() => onAnswer(opt)}
                        disabled={isSubmitted}
                        className={`w-24 h-24 flex items-center justify-center text-5xl font-black rounded-3xl border-b-8 transition-all ${stateClass}`}
                    >
                        {opt}
                    </ClayButton>
                );
            })}
        </div>
    );
};

export default QuizComparison;