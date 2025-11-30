import React, { useState, useEffect } from 'react';
import {
  Settings, XCircle, Trophy, Calendar, ListChecks, CheckCircle,
  Save, UserCog, LogOut, HelpCircle
} from 'lucide-react';
import { TOPICS_LIST, ICON_MAP, SEMESTER_DEFAULT_TOPICS } from '../lib/constants';

// Re-implement ClayButton locally to support `type` prop and specific styling needs.
const ClayButton = ({ children, onClick, colorClass = "bg-white", className = "", disabled=false, type = 'button' }) => (
    <button type={type} onClick={onClick} disabled={disabled} className={`relative overflow-hidden transition-all duration-150 ease-in-out rounded-2xl border-2 ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'active:scale-95 active:shadow-none shadow-[0_6px_0_rgba(0,0,0,0.15)] cursor-pointer'} ${colorClass} ${className}`}>
        {children}
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/30 to-transparent pointer-events-none"></div>
    </button>
);


const ConfigScreen = ({ config, saveConfig, setGameState, onLogout }) => {
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const toggleTopic = (topicId) => {
    const selectedTopics = localConfig.selectedTopics.includes(topicId)
      ? localConfig.selectedTopics.filter(id => id !== topicId)
      : [...localConfig.selectedTopics, topicId];
    setLocalConfig({ ...localConfig, selectedTopics });
  };

  const handleSemesterChange = (semester) => {
    setLocalConfig({
      ...localConfig,
      semester,
      selectedTopics: SEMESTER_DEFAULT_TOPICS[semester] || [],
    });
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      onLogout(true);
    }
  };
  
  const difficultyLevels = {
    easy: { label: 'Khởi động', sub: 'Làm quen', activeClass: 'bg-green-100 border-green-200 text-green-700' },
    medium: { label: 'Tiêu chuẩn', sub: 'Nâng cao', activeClass: 'bg-blue-100 border-blue-200 text-blue-700' },
    hard: { label: 'Thần đồng', sub: 'Thử thách', activeClass: 'bg-red-100 border-red-200 text-red-700' },
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Settings className="w-7 h-7 text-slate-500" />
          Cấu Hình
        </h1>
        <button type="button" onClick={() => setGameState('home')} className="p-1">
          <XCircle className="w-8 h-8 text-slate-400 hover:text-red-500 transition-colors" />
        </button>
      </div>

      <div className="flex-grow p-4 overflow-y-auto space-y-6">
        {/* Difficulty Section */}
        <div>
          <h2 className="text-lg font-bold text-slate-700 mb-3">Độ khó</h2>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(difficultyLevels).map(([key, { label, sub, activeClass }]) => (
              <button
                type="button"
                key={key}
                onClick={() => setLocalConfig({ ...localConfig, difficultyMode: key })}
                className={`text-center p-3 rounded-xl border-2 transition-all font-semibold ${
                  localConfig.difficultyMode === key
                    ? activeClass
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="block text-md">{label}</span>
                <small className="text-xs font-normal text-slate-500">{sub}</small>
              </button>
            ))}
          </div>
        </div>

        {/* Semester Section */}
        <div>
          <h2 className="text-lg font-bold text-slate-700 mb-3">Học kỳ</h2>
          <div className="grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => handleSemesterChange('hk1')}
              className={`py-2 px-4 rounded-full text-center transition-all ${
                localConfig.semester === 'hk1' ? 'bg-white shadow-sm font-bold' : 'text-slate-500 font-semibold'
              }`}
            >
              Học kỳ 1
            </button>
            <button
              type="button"
              onClick={() => handleSemesterChange('hk2')}
              className={`py-2 px-4 rounded-full text-center transition-all ${
                localConfig.semester === 'hk2' ? 'bg-white shadow-sm font-bold' : 'text-slate-500 font-semibold'
              }`}
            >
              Học kỳ 2
            </button>
          </div>
        </div>

        {/* Topics Section */}
        <div>
          <h2 className="text-lg font-bold text-slate-700 mb-3">Chủ đề ôn tập</h2>
          <div className="space-y-2">
            {TOPICS_LIST.map((topic) => {
              const Icon = ICON_MAP[topic.iconName] || HelpCircle;
              const isSelected = localConfig.selectedTopics.includes(topic.id);
              return (
                <button
                  type="button"
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`w-full flex items-center p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <Icon className={`w-6 h-6 mr-3 ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`} />
                  <span className="flex-grow text-left">{topic.label}</span>
                  {isSelected && <CheckCircle className="w-6 h-6 text-indigo-500" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <ClayButton
          onClick={() => saveConfig(localConfig)}
          colorClass="bg-indigo-500 text-white border-transparent"
          className="w-full py-4 text-lg font-bold"
        >
          <Save className="inline-block mr-2" />
          Lưu Cấu Hình
        </ClayButton>
        <div className="grid grid-cols-2 gap-3 mt-3">
            <ClayButton
                onClick={() => setGameState('user_profile')}
                colorClass="bg-slate-200 text-slate-700 border-transparent"
                className="w-full py-2.5 font-semibold text-sm"
            >
                <UserCog className="inline-block mr-1.5 h-4 w-4" />
                Tài khoản
            </ClayButton>
             <ClayButton
                onClick={handleLogout}
                colorClass="bg-white text-red-600 border-red-300"
                className="w-full py-2.5 font-semibold text-sm"
            >
                <LogOut className="inline-block mr-1.5 h-4 w-4" />
                Đăng xuất
            </ClayButton>
        </div>
      </div>
    </div>
  );
};

export default ConfigScreen;