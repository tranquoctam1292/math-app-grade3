import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { 
    BarChart3, XCircle, Trophy, Clock, Loader, Calendar, 
    ChevronRight, CheckCircle2, XCircle as XCircleIcon, 
    ArrowRight, Play, Target 
} from 'lucide-react';
import { db, appId } from '../lib/firebase';
import { ClayButton, MathText } from '../lib/helpers';
import { TOPICS_LIST, TOPIC_TRANSLATIONS, REWARD_PER_LEVEL } from '../lib/constants';
import { fmt } from '../lib/utils';

const ReportScreen = ({ currentProfile, appUser, setGameState, setConfig }) => {
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State cho Modal chi tiết
    const [selectedLog, setSelectedLog] = useState(null);
    
    // State cho Biểu đồ
    const [weeklyData, setWeeklyData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!appUser || !currentProfile) return;
            try {
                const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_user_data', appUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                const userData = userDocSnap.exists() ? userDocSnap.data() : {};
                
                if (userData.stats && userData.stats[currentProfile.id]) {
                    setStats(userData.stats[currentProfile.id]);
                }

                if (userData.logs && Array.isArray(userData.logs)) {
                    const profileLogs = userData.logs.filter(l => l.profileId === currentProfile.id);
                    // Sắp xếp mới nhất trước
                    profileLogs.sort((a, b) => b.timestamp - a.timestamp);
                    setLogs(profileLogs.slice(0, 20)); // Lấy 20 bài gần nhất
                    
                    // --- XỬ LÝ DỮ LIỆU BIỂU ĐỒ 7 NGÀY ---
                    const last7Days = [...Array(7)].map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (6 - i));
                        return d.toISOString().split('T')[0];
                    });

                    const chartData = last7Days.map(dateStr => {
                        const dayLogs = profileLogs.filter(l => {
                            const lDate = new Date(l.timestamp).toISOString().split('T')[0];
                            return lDate === dateStr;
                        });
                        const dayScore = dayLogs.reduce((acc, curr) => acc + (curr.score || 0), 0);
                        const dayDate = new Date(dateStr);
                        const dayLabel = `${dayDate.getDate()}/${dayDate.getMonth() + 1}`;
                        const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dayDate.getDay()];
                        return { date: dateStr, label: dayLabel, dayOfWeek, score: dayScore };
                    });
                    setWeeklyData(chartData);
                }
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchData();
    }, [appUser, currentProfile]);

    const getTopicVietnamese = (key) => {
        const found = TOPICS_LIST.find(t => t.id === key);
        if (found) return found.label;
        const lowerKey = key.toLowerCase().trim();
        if (TOPIC_TRANSLATIONS[lowerKey]) return TOPIC_TRANSLATIONS[lowerKey];
        return "Chủ đề khác";
    };

    // --- LOGIC SMART ACTION ---
    const getWeakestTopic = () => {
        if (!stats?.topics) return null;
        let weakTopic = null; 
        let minRate = 101;

        Object.entries(stats.topics).forEach(([key, val]) => {
            if (val.total < 3) return; // Chỉ xét khi đã làm > 3 câu
            const rate = (val.correct / val.total) * 100;
            if (rate < 50 && rate < minRate) {
                minRate = rate;
                weakTopic = key;
            }
        });
        return weakTopic;
    };

    const handleSmartPractice = (topicKey) => {
        if (!setConfig) {
            alert("Vui lòng cập nhật App.jsx để truyền prop 'setConfig' vào ReportScreen!");
            return;
        }
        // Tìm ID gốc của topic (do key trong stats có thể là label tiếng Việt hoặc ID cũ)
        let targetId = topicKey;
        const foundObj = TOPICS_LIST.find(t => t.id === topicKey || t.label === topicKey);
        if (foundObj) targetId = foundObj.id;
        
        // Cấu hình bài tập chỉ với chủ đề này
        setConfig(prev => ({
            ...prev,
            selectedTopics: [targetId],
            difficultyMode: 'medium' // Mặc định medium để ôn luyện
        }));
        setGameState('home'); // Về trang chủ để thấy nút Play sẵn sàng
    };

    const weakTopic = getWeakestTopic();

    if (loading) return <div className="flex items-center justify-center h-full"><Loader className="animate-spin text-indigo-500"/></div>;

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 overflow-y-auto relative">
            {/* --- HEADER --- */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-700 flex items-center gap-2">
                    <BarChart3 className="text-indigo-500"/> Học Bạ
                </h2>
                <ClayButton onClick={() => setGameState('home')} className="w-10 h-10 flex items-center justify-center !rounded-full !p-0">
                    <XCircle size={24} className="text-slate-400"/>
                </ClayButton>
            </div>

            {/* --- SMART ADVICE SECTION --- */}
            <div className={`p-6 rounded-3xl text-white shadow-lg mb-6 relative overflow-hidden transition-all ${weakTopic ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-3">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                            {weakTopic ? '🚑' : '🦉'}
                        </div>
                        <div>
                            <h3 className="font-bold text-white/90 text-xs uppercase mb-1">
                                {weakTopic ? 'Cần bổ sung gấp!' : 'Lời khuyên từ Bác Cú'}
                            </h3>
                            <p className="font-bold text-sm leading-relaxed">
                                {weakTopic 
                                    ? `Bé đang gặp khó khăn ở "${getTopicVietnamese(weakTopic)}". Hãy dành thời gian ôn lại nhé!`
                                    : "Bé học rất đều. Hãy duy trì thói quen luyện tập hàng ngày để tích thêm điểm đổi quà!"}
                            </p>
                        </div>
                    </div>
                    
                    {/* SMART ACTION BUTTON */}
                    {weakTopic && (
                        <ClayButton 
                            onClick={() => handleSmartPractice(weakTopic)}
                            colorClass="bg-white text-red-500"
                            className="w-full h-10 text-sm font-black flex items-center justify-center gap-2 !rounded-xl mt-1 shadow-md"
                        >
                            <Play size={16} fill="currentColor"/> Luyện "{getTopicVietnamese(weakTopic)}" ngay
                        </ClayButton>
                    )}
                </div>
            </div>

            {/* --- WEEKLY CHART --- */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6">
                <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase">
                    <Calendar size={18} className="text-blue-500"/> Phong độ 7 ngày qua
                </h3>
                <div className="h-40 flex items-end justify-between gap-2">
                    {weeklyData.map((day, idx) => {
                        const maxScore = Math.max(...weeklyData.map(d => d.score), 100); // Scale max
                        const heightPercent = Math.max((day.score / maxScore) * 100, 10); // Min 10% height
                        const isToday = idx === 6;
                        
                        return (
                            <div key={idx} className="flex-1 flex flex-col items-center group">
                                <div className="mb-1 text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {fmt(day.score)}
                                </div>
                                <div 
                                    className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-indigo-500' : 'bg-indigo-200 group-hover:bg-indigo-400'}`}
                                    style={{ height: `${heightPercent}%` }}
                                ></div>
                                <div className={`mt-2 text-[10px] font-bold ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                                    {day.dayOfWeek}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* --- TOPIC PROGRESS --- */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6">
                <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase">
                    <Trophy size={18} className="text-green-500"/> Chỉ số năng lực
                </h3>
                <div className="space-y-4">
                    {stats?.topics && Object.keys(stats.topics).length > 0 ? Object.entries(stats.topics).map(([key, val]) => {
                        const rate = val.total > 0 ? (val.correct / val.total) * 100 : 0;
                        const label = getTopicVietnamese(key);
                        let colorClass = rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-yellow-500" : "bg-red-500";
                        return (
                            <div key={key}>
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                    <span>{label}</span>
                                    <span>{Math.round(rate)}% ({val.correct}/{val.total})</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                    <div className={`h-full ${colorClass} transition-all duration-1000 rounded-full`} style={{width: `${rate}%`}}></div>
                                </div>
                            </div>
                        );
                    }) : <div className="text-center text-slate-400 text-sm py-4">Chưa có dữ liệu học tập</div>}
                </div>
            </div>

            {/* --- HISTORY LIST --- */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 pb-20">
                <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase">
                    <Clock size={18} className="text-orange-500"/> Lịch sử đấu trường
                </h3>
                <div className="space-y-3">
                    {logs.map((log, index) => (
                        <ClayButton 
                            key={log.id || index} 
                            onClick={() => setSelectedLog(log)}
                            colorClass="bg-slate-50 hover:bg-white"
                            className="w-full flex justify-between items-center p-3 rounded-xl border border-slate-100 group"
                        >
                            <div className="text-left">
                                <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                    Bài tập {log.difficultyMode === 'easy' ? 'Khởi động' : log.difficultyMode === 'hard' ? 'Thần đồng' : 'Tiêu chuẩn'}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                                    {new Date(log.timestamp).toLocaleDateString('vi-VN')} • {new Date(log.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className="font-black text-indigo-600">+{fmt(log.score)}đ</div>
                                    <div className={`text-[10px] font-bold ${log.questions.filter(q=>q.isCorrect).length >= 5 ? 'text-green-500' : 'text-red-500'}`}>
                                        {log.questions.filter(q=>q.isCorrect).length}/10 đúng
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors"/>
                            </div>
                        </ClayButton>
                    ))}
                </div>
            </div>

            {/* --- DETAIL MODAL (SOI BÀI) --- */}
            {selectedLog && (
                <div className="absolute inset-0 z-50 bg-slate-100 flex flex-col animation-fade-in overflow-hidden">
                    {/* Modal Header */}
                    <div className="bg-white px-4 py-4 shadow-sm border-b border-slate-200 flex items-center gap-3 shrink-0">
                        <ClayButton onClick={() => setSelectedLog(null)} className="w-10 h-10 flex items-center justify-center !rounded-full !p-0 bg-slate-100">
                            <ArrowLeft size={20} className="text-slate-600"/>
                        </ClayButton>
                        <div className="flex-1">
                            <h2 className="font-black text-slate-700 text-lg">Chi tiết bài làm</h2>
                            <p className="text-xs font-bold text-slate-400">
                                {new Date(selectedLog.timestamp).toLocaleDateString('vi-VN')} • Tổng điểm: {fmt(selectedLog.score)}đ
                            </p>
                        </div>
                    </div>

                    {/* Modal Content - List Questions */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                        {selectedLog.questions.map((q, idx) => (
                            <div key={idx} className={`bg-white p-4 rounded-2xl border-2 shadow-sm ${q.isCorrect ? 'border-green-100' : 'border-red-100'}`}>
                                {/* Question Text */}
                                <div className="flex gap-3 mb-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${q.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="font-bold text-slate-700 text-sm leading-relaxed">
                                        <MathText text={q.text || "Nội dung câu hỏi không khả dụng"} />
                                    </div>
                                </div>

                                {/* Answers Comparison */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className={`p-2 rounded-lg border ${q.isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                        <span className="block font-black opacity-50 mb-1 uppercase text-[10px]">Bé chọn</span>
                                        <span className="font-bold">{q.userAnswer ? <MathText text={q.userAnswer} /> : "Không trả lời"}</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                                        <span className="block font-black opacity-50 mb-1 uppercase text-[10px]">Đáp án đúng</span>
                                        <span className="font-bold flex items-center gap-1">
                                            {q.correctOption} 
                                            {q.correctVal && q.correctVal !== q.correctOption && <span> (<MathText text={q.correctVal}/>)</span>}
                                        </span>
                                    </div>
                                </div>

                                {/* Explanation if wrong */}
                                {!q.isCorrect && q.explanation && (
                                    <div className="mt-2 pt-2 border-t border-red-50 text-xs text-slate-500 leading-relaxed">
                                        <span className="font-bold text-slate-400 mr-1">Giải thích:</span> 
                                        <MathText text={q.explanation} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
export default ReportScreen;