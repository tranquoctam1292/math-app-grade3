import React from 'react';
import { CheckCircle, XCircle, Trophy } from 'lucide-react';
import { ClayButton, MathText } from '../lib/helpers';
import { REWARD_PER_LEVEL } from '../lib/constants';
import { fmt } from '../lib/utils';

const QuizScreen = ({ quizData, currentQIndex, sessionScore, selectedOption, isSubmitted, handleSelectOption, handleNextQuestion }) => {
    const currentQ = quizData[currentQIndex];
    const progress = ((currentQIndex) / quizData.length) * 100;

    if (!currentQ) {
        return <div className="p-6 text-center">Đang tải câu hỏi...</div>;
    }

    const labels = ['A', 'B', 'C', 'D'];
    const isCorrect = selectedOption === currentQ.correctOption;

    return (
        <div className="p-4 md:p-6 flex flex-col h-full bg-slate-50">
            {/* Progress Bar and Score */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2 text-sm">
                    <span className="text-gray-600">Câu {currentQIndex + 1}/{quizData.length}</span>
                    <span className="font-bold text-yellow-500 flex items-center">
                        <Trophy className="w-4 h-4 mr-1" /> {fmt(sessionScore)}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            {/* Question */}
            <div className="text-xl md:text-2xl font-bold text-center text-gray-800 mb-6 py-4">
                <MathText text={currentQ.text} />
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                {currentQ.options.map((option, index) => {
                    const label = labels[index];
                    const isSelected = selectedOption === label;
                    const isCorrectOption = currentQ.correctOption === label;
                    
                    let colorClass = 'bg-white';
                    if (isSubmitted) {
                        if (isCorrectOption) {
                            colorClass = 'bg-green-200 border-green-400';
                        } else if (isSelected && !isCorrectOption) {
                            colorClass = 'bg-red-200 border-red-400';
                        }
                    } else if (isSelected) {
                        colorClass = 'bg-blue-200 border-blue-400';
                    }

                    return (
                        <ClayButton
                            key={index}
                            onClick={() => handleSelectOption(label)}
                            disabled={isSubmitted}
                            className="w-full h-full text-left p-4 flex items-center text-base md:text-lg"
                            colorClass={colorClass}
                        >
                            <span className="font-bold mr-3">{label}.</span>
                            <div className="flex-1"><MathText text={option} /></div>
                        </ClayButton>
                    );
                })}
            </div>

            {/* Feedback and Next Button */}
            {isSubmitted && (
                <div className={`mt-4 p-4 rounded-2xl ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                    <div className="font-bold text-lg mb-2 flex items-center">
                        {isCorrect ? <CheckCircle className="text-green-600 mr-2" /> : <XCircle className="text-red-600 mr-2" />}
                        <span className={isCorrect ? 'text-green-800' : 'text-red-800'}>
                            {isCorrect ? `Chính xác! +${fmt(REWARD_PER_LEVEL[currentQ.level] || 0)} điểm` : "Chưa đúng!"}
                        </span>
                    </div>
                    {currentQ.explanation && (
                        <p className="text-sm text-gray-700 pl-8 mb-4"><MathText text={currentQ.explanation} /></p>
                    )}
                    <ClayButton
                        onClick={handleNextQuestion}
                        className="w-full py-3 text-lg font-bold"
                        colorClass={isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"}
                    >
                        {currentQIndex < quizData.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
                    </ClayButton>
                </div>
            )}
        </div>
    );
};

export default QuizScreen;