import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { BarChart3, XCircle, Trophy, Clock, Loader } from 'lucide-react';
import { db, appId } from '../lib/firebase';
import { ClayButton } from '../lib/helpers';
import { TOPICS_LIST, TOPIC_TRANSLATIONS } from '../lib/constants';
import { fmt } from '../lib/utils';

const ReportScreen = ({ currentProfile, appUser, setGameState }) => {
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

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
                    profileLogs.sort((a, b) => b.timestamp - a.timestamp);
                    setLogs(profileLogs.slice(0, 10));
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

    const getAdvice = (topics) => {
        if (!topics || Object.keys(topics).length === 0) return "Hãy làm bài tập đầu tiên để nhận lời khuyên nhé!";
        let worstTopic = null, bestTopic = null, minRate = 101, maxRate = -1;
        Object.entries(topics).forEach(([key, val]) => {
            if (val.total < 3) return; 
            const rate = (val.correct / val.total) * 100;
            if (rate < minRate) { minRate = rate; worstTopic = key; }
            if (rate > maxRate) { maxRate = rate; bestTopic = key; }
        });
        
        if (worstTopic && minRate < 50) {
            const topicVN = getTopicVietnamese(worstTopic);
            return `Bé đang gặp chút khó khăn ở phần "${topicVN}" (Đúng ${Math.round(minRate)}%). Mẹ hãy chọn chủ đề này để bé ôn luyện thêm nhé!`;
        }
        if (bestTopic && maxRate > 80) {
            const topicVN = getTopicVietnamese(bestTopic);
            return `Tuyệt vời! Bé làm rất tốt phần "${topicVN}" (Đúng ${Math.round(maxRate)}%). Hãy tiếp tục phát huy!`;
        }
        return "Bé đang học rất đều và chăm chỉ. Hãy duy trì thói quen luyện tập toán mỗi ngày để tiến bộ hơn nữa!";
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Loader className="animate-spin text-indigo-500"/></div>;

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-700 flex items-center gap-2"><BarChart3 className="text-indigo-500"/> Học Bạ</h2>
                <ClayButton onClick={() => setGameState('home')} className="w-10 h-10 flex items-center justify-center !rounded-full !p-0"><XCircle size={24} className="text-slate-400"/></ClayButton>
            </div>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-lg mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="flex items-start gap-4 relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">🦉</div>
                    <div><h3 className="font-bold text-indigo-100 text-xs uppercase mb-1">Lời khuyên từ Bác Cú Mèo</h3><p className="font-medium text-sm leading-relaxed">{getAdvice(stats?.topics)}</p></div>
                </div>
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6">
                <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2"><Trophy size={18} className="text-green-500"/> Chỉ số năng lực</h3>
                <div className="space-y-4">
                    {stats?.topics && Object.keys(stats.topics).length > 0 ? Object.entries(stats.topics).map(([key, val]) => {
                        const rate = val.total > 0 ? (val.correct / val.total) * 100 : 0;
                        const label = getTopicVietnamese(key);
                        let colorClass = rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-yellow-500" : "bg-red-500";
                        return (
                            <div key={key}>
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1"><span>{label}</span><span>{Math.round(rate)}% ({val.correct}/{val.total})</span></div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${colorClass} transition-all duration-1000`} style={{width: `${rate}%`}}></div></div>
                            </div>
                        );
                    }) : <div className="text-center text-slate-400 text-sm py-4">Chưa có dữ liệu học tập</div>}
                </div>
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-black text-slate-700 mb-4 flex items-center gap-2"><Clock size={18} className="text-orange-500"/> Lịch sử đấu trường</h3>
                <div className="space-y-3">
                    {logs.map((log, index) => (
                        <div key={log.id || index} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div><div className="font-bold text-slate-700 text-sm">Bài tập {log.difficultyMode === 'easy' ? 'Khởi động' : log.difficultyMode === 'hard' ? 'Thần đồng' : 'Tiêu chuẩn'}</div><div className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleDateString('vi-VN')} • {new Date(log.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div></div>
                            <div className="text-right"><div className="font-black text-indigo-600">+{fmt(log.score)}đ</div><div className="text-xs font-bold text-green-500">{log.questions.filter(q=>q.isCorrect).length}/10 đúng</div></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
export default ReportScreen;
