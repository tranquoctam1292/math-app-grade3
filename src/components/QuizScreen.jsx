import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const QuizScreen = ({ quizData, currentQIndex, sessionScore, selectedOption, isSubmitted, handleSelectOption, handleNextQuestion }) => {
    const currentQ = quizData[currentQIndex];

    if (!currentQ) {
        return <div className="p-6">Đang tải câu hỏi...</div>;
    }

    const labels = ['A', 'B', 'C', 'D'];

    return (
        <div className="p-6 flex flex-col h-full">
            <div className="mb-4">
                <p className="text-sm text-gray-500">Câu hỏi {currentQIndex + 1} / {quizData.length}</p>
                <p className="font-bold text-lg">{currentQ.text}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
                {currentQ.options.map((option, index) => {
                    const label = labels[index];
                    const isSelected = selectedOption === label;
                    const isCorrect = currentQ.correctOption === label;
                    
                    let buttonClass = "p-4 border rounded-lg text-left ";
                    if (isSubmitted) {
                        if (isCorrect) {
                            buttonClass += "bg-green-200 border-green-400";
                        } else if (isSelected && !isCorrect) {
                            buttonClass += "bg-red-200 border-red-400";
                        }
                    } else {
                        if (isSelected) {
                            buttonClass += "bg-blue-200 border-blue-400";
                        } else {
                            buttonClass += "bg-gray-100 hover:bg-gray-200";
                        }
                    }

                    return (
                        <button key={index} onClick={() => handleSelectOption(label)} disabled={isSubmitted} className={buttonClass}>
                            <span className="font-bold mr-2">{label}.</span>
                            {option}
                        </button>
                    );
                })}
            </div>

            {isSubmitted && (
                <div className="mt-4 p-4 rounded-lg bg-gray-50">
                    <div className="font-bold text-lg mb-2 flex items-center">
                        {selectedOption === currentQ.correctOption ? <CheckCircle className="text-green-500 mr-2" /> : <XCircle className="text-red-500 mr-2" />}
                        {selectedOption === currentQ.correctOption ? "Chính xác!" : "Chưa đúng!"}
                    </div>
                    <p className="text-sm">{currentQ.explanation}</p>
                    <button onClick={handleNextQuestion} className="mt-4 bg-indigo-500 text-white px-6 py-2 rounded-lg w-full">
                        {currentQIndex < quizData.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
                    </button>
                </div>
            )}

            <div className="mt-4 text-center">
                <p className="font-bold">Điểm: {sessionScore}</p>
            </div>
        </div>
    );
};

export default QuizScreen;
