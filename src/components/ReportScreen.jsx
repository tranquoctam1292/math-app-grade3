import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { 
    BarChart3, XCircle, Trophy, Clock, Loader, Calendar, 
    ChevronRight, ArrowLeft, Play, ShieldAlert, Lightbulb
} from 'lucide-react';
import { db, appId } from '../lib/firebase';
import { ClayButton, MathText } from '../lib/helpers';
import { TOPICS_LIST, TOPIC_TRANSLATIONS } from '../lib/constants';
import { fmt } from '../lib/utils';

const ReportScreen = ({ currentProfile, appUser, setGameState, setConfig }) => {
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);
    const [historyFilter, setHistoryFilter] = useState('week');

    // Helper: Lấy ngày định dạng YYYY-MM-DD theo giờ địa phương
    const getLocalYMD = (date) => {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

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
                    // Lấy logs của profile hiện tại
                    const profileLogs = userData.logs.filter(l => l.profileId === currentProfile.id);
                    profileLogs.sort((a, b) => b.timestamp - a.timestamp);
                    setLogs(profileLogs);
                }
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchData();
    }, [appUser, currentProfile]);

    const buildChartData = () => {
        const buildWeek = () => {
            const last7Days = [...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return d;
            });
            return last7Days.map(dateObj => {
                const dateStr = getLocalYMD(dateObj);
                const dayLogs = logs.filter(l => getLocalYMD(new Date(l.timestamp)) === dateStr);
                const dayScore = dayLogs.reduce((acc, curr) => acc + (curr.score || 0), 0);
                const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dateObj.getDay()];
                return { label: `${dateObj.getDate()}/${dateObj.getMonth() + 1}`, dayOfWeek, score: dayScore };
            });
        };

        if (historyFilter === 'week') {
            return buildWeek();
        }

        const bucket = {};
        logs.forEach(log => {
            const date = new Date(log.timestamp);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!bucket[key]) bucket[key] = 0;
            bucket[key] += log.score || 0;
        });
        const sortedKeys = Object.keys(bucket).sort();
        const limit = historyFilter === 'month' ? 4 : sortedKeys.length;
        const keys = sortedKeys.slice(-limit);
        const monthlyData = keys.map(key => {
            const [year, month] = key.split('-');
            return {
                label: `Th${Number(month)}/${year.slice(-2)}`,
                dayOfWeek: '',
                score: bucket[key]
            };
        });
        if (monthlyData.length === 0) return buildWeek();
        return monthlyData;
    };

    const chartData = buildChartData();
    const chartTitle = historyFilter === 'week' ? 'Phong độ 7 ngày qua' : historyFilter === 'month' ? 'So sánh theo tháng' : 'Tất cả lịch sử';

    const getTopicVietnamese = (key) => {
        // 1. Tìm trong danh sách chuẩn (nếu key là ID tiếng Anh như 'geometry')
        const found = TOPICS_LIST.find(t => t.id === key);
        if (found) return found.label;

        // 2. Tìm trong từ điển dịch (nếu key là từ khóa tiếng Anh cũ)
        const lowerKey = key.toLowerCase().trim();
        if (TOPIC_TRANSLATIONS[lowerKey]) return TOPIC_TRANSLATIONS[lowerKey];

        // 3. [FIX QUAN TRỌNG] Nếu không tìm thấy ID, hiển thị luôn Key
        // Vì dữ liệu trong Firebase hiện tại đang lưu trực tiếp tên Tiếng Việt (ví dụ: "Toán đố")
        // Nên nếu key là "Toán đố", ta trả về luôn "Toán đố".
        return key !== "undefined" && key !== "null" ? key : "Chủ đề khác";
    };

    const getWeakestTopic = () => {
        if (!stats?.topics) return null;
        let weakTopic = null; 
        let minRate = 101;
        Object.entries(stats.topics).forEach(([key, val]) => {
            if (val.total < 3) return; // Bỏ qua nếu chưa làm đủ nhiều
            const rate = (val.correct / val.total) * 100;
            if (rate < 50 && rate < minRate) {
                minRate = rate;
                weakTopic = key;
            }
        });
        return weakTopic;
    };

    const handleSmartPractice = (topicKey) => {
        if (!setConfig) return;
        let targetId = topicKey;
        const foundObj = TOPICS_LIST.find(t => t.id === topicKey || t.label === topicKey);
        if (foundObj) targetId = foundObj.id;
        
        setConfig(prev => ({
            ...prev,
            selectedTopics: [targetId],
            difficultyMode: 'medium'
        }));
        setGameState('home');
    };

    const weakTopic = getWeakestTopic();

    if (loading) return <div className="flex items-center justify-center h-full"><Loader className="animate-spin text-indigo-500"/></div>;

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 overflow-y-auto no-scrollbar relative">
            {/* --- HEADER (Shrink-0 để không bị bẹp) --- */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-2xl font-black text-slate-700 flex items-center gap-2">
                    <BarChart3 className="text-indigo-500"/> Học Bạ
                </h2>
                <ClayButton onClick={() => setGameState('home')} className="w-10 h-10 flex items-center justify-center !rounded-full !p-0">
                    <XCircle size={24} className="text-slate-400"/>
                </ClayButton>
            </div>

            {/* --- SMART ADVICE (Shrink-0) --- */}
            <div className={`p-6 rounded-3xl text-white shadow-lg mb-6 relative overflow-hidden transition-all shrink-0 ${weakTopic ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-3">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                            {weakTopic ? <ShieldAlert size={28} className="text-white"/> : <Lightbulb size={28} className="text-white"/>}
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

            {/* --- WEEKLY CHART (Quan trọng: shrink-0 và min-height) --- */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6 shrink-0">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-slate-700 flex items-center gap-2 text-sm uppercase">
                        <Calendar size={18} className="text-blue-500"/> {chartTitle}
                    </h3>
                    <div className="flex gap-2 text-[10px] font-black">
                        {['week', 'month', 'all'].map(option => (
                            <button
                                key={option}
                                onClick={() => setHistoryFilter(option)}
                                className={`px-3 py-1 rounded-full border ${historyFilter === option ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
                            >
                                {option === 'week' ? '7 ngày' : option === 'month' ? 'Tháng' : 'Tất cả'}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Chart Container với chiều cao cố định để tránh bị bẹp */}
                <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-1">
                    {chartData.map((day, idx) => {
                        const maxScore = Math.max(...chartData.map(d => d.score), 2000); 
                        
                        // Chiều cao %
                        const heightPercent = day.score > 0 ? Math.max((day.score / maxScore) * 100, 5) : 2; 
                        const isToday = historyFilter === 'week' ? idx === 6 : false;
                        
                        return (
                            <div key={idx} className="flex-1 flex flex-col items-center justify-end group h-full">
                                {/* Score Label (Bay lên khi hover) */}
                                <div className={`mb-2 text-[10px] font-black transition-all transform ${day.score > 0 ? 'text-indigo-500 opacity-100 translate-y-0' : 'text-slate-300 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1'}`}>
                                    {day.score > 0 ? fmt(day.score) : '0'}
                                </div>
                                
                                {/* Bar */}
                                <div className="w-full max-w-[32px] sm:max-w-[40px] flex items-end relative">
                                    <div 
                                        className={`w-full rounded-t-lg transition-all duration-700 ease-out mx-auto ${isToday ? 'bg-indigo-500 shadow-indigo-200 shadow-lg' : (day.score > 0 ? 'bg-indigo-200 group-hover:bg-indigo-400' : 'bg-slate-100')}`}
                                        style={{ height: `${heightPercent}%` }}
                                    ></div>
                                </div>

                                {/* Date Label */}
                                <div className={`mt-3 text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md' : 'text-slate-400'}`}>
                                    {historyFilter === 'week' ? day.dayOfWeek : day.label}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* --- TOPIC PROGRESS (Shrink-0) --- */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6 shrink-0">
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
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                                    <span className="flex items-center gap-1.5">{label}</span>
                                    <span>{Math.round(rate)}% <span className="text-slate-300 font-normal text-[10px]">({val.correct}/{val.total})</span></span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner ring-1 ring-slate-50">
                                    <div className={`h-full ${colorClass} transition-all duration-1000 rounded-full relative`} style={{width: `${rate}%`}}>
                                        <div className="absolute top-0 right-0 bottom-0 w-full bg-gradient-to-b from-white/20 to-transparent"></div>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : <div className="text-center text-slate-400 text-sm py-4 italic">Chưa có dữ liệu học tập</div>}
                </div>
            </div>

            {/* --- HISTORY LIST --- */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 pb-10 shrink-0">
                <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase">
                    <Clock size={18} className="text-orange-500"/> Lịch sử đấu trường
                </h3>
                <div className="space-y-3">
                    {logs.length > 0 ? logs.map((log, index) => (
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
                    )) : <div className="text-center text-slate-400 text-sm py-4 italic">Chưa có lịch sử làm bài</div>}
                </div>
            </div>

            {/* --- DETAIL MODAL --- */}
            {selectedLog && (
                <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col animation-fade-in overflow-hidden">
                    <div className="bg-white px-4 py-4 shadow-sm border-b border-slate-200 flex items-center gap-3 shrink-0 pt-safe-top">
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

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 no-scrollbar">
                        {selectedLog.questions.map((q, idx) => (
                            <div key={idx} className={`bg-white p-4 rounded-2xl border-2 shadow-sm ${q.isCorrect ? 'border-green-100' : 'border-red-100'}`}>
                                <div className="flex gap-3 mb-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${q.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="font-bold text-slate-700 text-sm leading-relaxed">
                                        <MathText text={q.text || "Nội dung câu hỏi không khả dụng"} />
                                    </div>
                                </div>

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