import React, { useState, useEffect } from 'react';
import { Settings, XCircle, Trophy, Calendar, ListChecks, CheckCircle, HelpCircle, Save, UserCog, LogOut } from 'lucide-react';
import { ClayButton } from '../lib/helpers';
import { TOPICS_LIST, SEMESTER_DEFAULT_TOPICS, ICON_MAP } from '../lib/constants';

const ConfigScreen = ({ config, setConfig, saveConfig, setGameState, onLogout }) => {
    const [localConfig, setLocalConfig] = useState(config);

    useEffect(() => {
        setLocalConfig(config);
    }, [config]);

    const selectSemester = (sem) => {
        setLocalConfig({ ...localConfig, semester: sem, selectedTopics: SEMESTER_DEFAULT_TOPICS[sem] || [] });
    };

    const toggleTopic = (id) => {
        const current = localConfig.selectedTopics;
        if (current.includes(id)) setLocalConfig({...localConfig, selectedTopics: current.filter(t => t !== id)});
        else setLocalConfig({...localConfig, selectedTopics: [...current, id]});
    };
    
    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-700 flex items-center gap-2"><Settings className="text-indigo-500"/> Cấu Hình</h2>
                <ClayButton onClick={() => setGameState('home')} className="w-10 h-10 flex items-center justify-center !rounded-full !p-0"><XCircle size={24} className="text-slate-400"/></ClayButton>
            </div>
            <div className="space-y-6 pb-20">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-black text-slate-700 mb-3 flex items-center gap-2"><Trophy size={18} className="text-yellow-500"/> Chế độ thử thách</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {[{ id: 'easy', label: 'Khởi động', sub: 'Dễ thở', color: 'bg-green-100 text-green-700 border-green-200' }, { id: 'medium', label: 'Tiêu chuẩn', sub: 'Cân bằng', color: 'bg-blue-100 text-blue-700 border-blue-200' }, { id: 'hard', label: 'Thần đồng', sub: 'Thử thách', color: 'bg-red-100 text-red-700 border-red-200' }].map(mode => (
                            <button key={mode.id} onClick={() => setLocalConfig({...localConfig, difficultyMode: mode.id})} className={`p-2 rounded-xl border-2 transition-all ${localConfig.difficultyMode === mode.id ? `ring-2 ring-offset-1 ring-indigo-500 ${mode.color}` : 'bg-slate-50 border-slate-100 text-slate-400 grayscale'}`}>
                                <div className="font-bold text-sm">{mode.label}</div>
                                <div className="text-[10px] opacity-80">{mode.sub}</div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-black text-slate-700 mb-3 flex items-center gap-2"><Calendar size={18} className="text-orange-500"/> Chương trình</h3>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => selectSemester('hk1')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${localConfig.semester === 'hk1' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Học kỳ 1</button>
                        <button onClick={() => selectSemester('hk2')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${localConfig.semester === 'hk2' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Học kỳ 2</button>
                    </div>
                    <div className="mt-2 text-xs text-slate-400 text-center italic">*Tự động chọn kiến thức theo sách giáo khoa</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-black text-slate-700 mb-3 flex items-center gap-2"><ListChecks size={18} className="text-purple-500"/> Chủ đề ôn tập</h3>
                    <div className="space-y-2">
                        {TOPICS_LIST.map(topic => { 
                            const IconComp = ICON_MAP[topic.iconName] || HelpCircle; 
                            return (
                                <button key={topic.id} onClick={() => toggleTopic(topic.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${localConfig.selectedTopics.includes(topic.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${localConfig.selectedTopics.includes(topic.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-slate-300'}`}>{localConfig.selectedTopics.includes(topic.id) && <CheckCircle size={14}/>}</div>
                                    <div className="flex items-center gap-2 font-bold text-sm text-left"><IconComp size={16}/> {topic.label}</div>
                                </button>
                            )
                        })}
                    </div>
                </div>
                <ClayButton onClick={() => saveConfig(localConfig)} colorClass="bg-indigo-600 text-white" className="w-full h-14 font-bold text-lg flex items-center justify-center gap-2"><Save size={20}/> Lưu Cấu Hình</ClayButton>
                
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setGameState('user_profile')} className="py-4 text-slate-500 font-bold text-sm bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                        <UserCog size={16}/> Tài khoản phụ huynh
                    </button>
                    <button onClick={onLogout} className="py-4 text-slate-400 font-bold text-sm bg-slate-50 border border-slate-200 rounded-xl hover:text-red-500 hover:border-red-200 transition-colors flex items-center justify-center gap-2">
                        <LogOut size={16}/> Đăng xuất
                    </button>
                </div>
            </div>
        </div>
    );
};
export default ConfigScreen;
