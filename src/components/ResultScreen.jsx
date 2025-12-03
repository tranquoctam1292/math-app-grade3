import React from 'react';

const ResultScreen = ({ history, sessionScore, setGameState, currentProfile, onRetryWrongQuestions }) => {
    const correctAnswers = history.filter(q => q.isCorrect).length;
    const totalQuestions = history.length;
    const wrongQuestions = history.filter(q => !q.isCorrect);

    return (
        <div className="p-6 flex flex-col h-full bg-slate-50">
            <h1 className="text-3xl font-black text-center mb-1 text-slate-800">Hoàn thành!</h1>
            <p className="text-center text-slate-500 mb-6 font-semibold">Chúc mừng {currentProfile?.name} đã hoàn thành bài tập.</p>

            <div className="bg-indigo-100 p-6 rounded-3xl text-center mb-6 shadow-inner border border-indigo-200">
                <p className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">Tổng điểm phiên này</p>
                <p className="text-5xl font-black text-indigo-600 mt-1">{sessionScore}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center mb-6">
                <div className="bg-green-100 p-4 rounded-2xl shadow-sm border border-green-200">
                    <p className="text-2xl font-black text-green-700">{correctAnswers}</p>
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Câu đúng</p>
                </div>
                 <div className="bg-red-100 p-4 rounded-2xl shadow-sm border border-red-200">
                    <p className="text-2xl font-black text-red-700">{totalQuestions - correctAnswers}</p>
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Câu sai</p>
                </div>
            </div>

            <h2 className="font-bold text-lg mb-2 text-slate-800">Xem lại bài làm:</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4 no-scrollbar">
                {history.map((q, index) => (
                    <div 
                        key={q.id ?? index} 
                        className={`p-3 rounded-2xl border text-sm ${q.isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}
                    >
                        <p className="font-semibold text-slate-800 mb-1">
                            Câu {index + 1}: {q.text}
                        </p>
                        <p className="text-xs text-slate-600">
                            Bạn chọn: <span className="font-semibold">{q.userAnswer}</span>
                            {!q.isCorrect && (
                                <>
                                    {' '}| Đáp án đúng: <span className="font-semibold text-green-700">{q.correctOption || q.correctVal}</span>
                                </>
                            )}
                        </p>
                    </div>
                ))}

                {history.length === 0 && (
                    <p className="text-center text-xs text-slate-400">Chưa có dữ liệu bài làm.</p>
                )}
            </div>

            {/* Nút Sửa lại các câu sai */}
            {wrongQuestions.length > 0 && (
                <button
                    onClick={() => onRetryWrongQuestions && onRetryWrongQuestions(wrongQuestions)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-2xl font-black text-sm shadow-md mb-3 transition-colors"
                >
                    🔁 Sửa lại các câu sai ({wrongQuestions.length})
                </button>
            )}

            <button 
                onClick={() => setGameState('home')} 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-2xl font-black text-sm shadow-md transition-colors"
            >
                Về trang chủ
            </button>
        </div>
    );
};

export default ResultScreen;
