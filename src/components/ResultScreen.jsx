import React from 'react';

const ResultScreen = ({ history, sessionScore, setGameState, currentProfile }) => {
    const correctAnswers = history.filter(q => q.isCorrect).length;
    const totalQuestions = history.length;

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-center mb-2">Hoàn thành!</h1>
            <p className="text-center text-gray-600 mb-6">Chúc mừng {currentProfile?.name} đã hoàn thành bài tập.</p>

            <div className="bg-indigo-100 p-6 rounded-lg text-center mb-6">
                <p className="text-lg">Tổng điểm đạt được</p>
                <p className="text-5xl font-black text-indigo-600">{sessionScore}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center mb-6">
                <div className="bg-green-100 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">{correctAnswers}</p>
                    <p className="text-sm font-semibold text-green-600">Câu đúng</p>
                </div>
                 <div className="bg-red-100 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-red-700">{totalQuestions - correctAnswers}</p>
                    <p className="text-sm font-semibold text-red-600">Câu sai</p>
                </div>
            </div>

            <h2 className="font-bold text-lg mb-2">Xem lại bài làm:</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
                {history.map((q, index) => (
                    <div key={q.id} className={`p-3 rounded-lg ${q.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                       <p className="font-semibold text-sm">Câu {index + 1}: {q.text}</p>
                       <p className="text-xs">Bạn chọn: {q.userAnswer}. Đáp án đúng: {q.correctOption}</p>
                    </div>
                ))}
            </div>

            <button onClick={() => setGameState('home')} className="w-full bg-blue-500 text-white p-4 rounded-lg mt-6 font-bold">
                Về trang chủ
            </button>
        </div>
    );
};

export default ResultScreen;
