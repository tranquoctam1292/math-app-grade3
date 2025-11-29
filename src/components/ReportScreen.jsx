import React from 'react';

const ReportScreen = ({ currentProfile, appUser, setGameState }) => {
    // Dữ liệu giả lập vì logic tính toán nằm ở App.jsx
    const stats = {
        total_questions: 150,
        total_correct: 125,
        topics: {
            arithmetic: { total: 80, correct: 70 },
            geometry: { total: 40, correct: 35 },
            word_problem: { total: 30, correct: 20 },
        }
    };

    const accuracy = stats.total_questions > 0 ? ((stats.total_correct / stats.total_questions) * 100).toFixed(1) : 0;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-1">Học bạ của {currentProfile?.name}</h1>
            <p className="text-gray-500 mb-6">Thống kê quá trình học tập</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-100 p-4 rounded-lg">
                    <p className="text-sm font-bold text-blue-600">Tổng số câu</p>
                    <p className="text-3xl font-black text-blue-800">{stats.total_questions}</p>
                </div>
                 <div className="bg-green-100 p-4 rounded-lg">
                    <p className="text-sm font-bold text-green-600">Tỷ lệ đúng</p>
                    <p className="text-3xl font-black text-green-800">{accuracy}%</p>
                </div>
            </div>

            <h2 className="font-bold text-lg mb-2">Thành thạo theo chủ đề</h2>
            <div className="space-y-3">
                {Object.entries(stats.topics).map(([topic, data]) => {
                    const topicAccuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
                    return (
                        <div key={topic}>
                            <div className="flex justify-between font-semibold text-sm mb-1">
                                <span>{topic}</span>
                                <span>{topicAccuracy.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${topicAccuracy}%` }}></div>
                            </div>
                        </div>
                    )
                })}
            </div>
             <button onClick={() => setGameState('home')} className="w-full bg-gray-500 text-white p-4 rounded-lg mt-8 font-bold">
                Về trang chủ
            </button>
        </div>
    );
};

export default ReportScreen;
