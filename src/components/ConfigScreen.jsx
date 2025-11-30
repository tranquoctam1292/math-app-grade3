import React, { useState, useEffect } from 'react';
import {
  Settings, XCircle, Trophy, Calendar, ListChecks, CheckCircle,
  Save, UserCog, LogOut, HelpCircle
} from 'lucide-react';
import { TOPICS_LIST, ICON_MAP, SEMESTER_DEFAULT_TOPICS } from '../lib/constants';

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
    easy: { label: 'Khởi động', sub: 'Làm quen', color: 'green', icon: Trophy },
    medium: { label: 'Tiêu chuẩn', sub: 'Nâng cao', color: 'blue', icon: Calendar },
    hard: { label: 'Thần đồng', sub: 'Thử thách', color: 'red', icon: ListChecks },
  };

  const clayButtonClasses = "relative overflow-hidden transition-all duration-150 ease-in-out rounded-2xl border-2 border-transparent active:scale-95 active:shadow-none shadow-[0_6px_0_rgba(0,0,0,0.15)] cursor-pointer";

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
            {Object.entries(difficultyLevels).map(([key, { label, sub, color }]) => (
              <button
                type="button"
                key={key}
                onClick={() => setLocalConfig({ ...localConfig, difficultyMode: key })}
                className={`text-center p-3 rounded-xl border-2 transition-all duration-200 ${
                  localConfig.difficultyMode === key
                    ? `bg-${color}-100 text-${color}-800 border-${color}-400 font-bold shadow-inner`
                    : 'bg-slate-50 border-slate-200 hover:border-slate-400'
                }`}
              >
                <span className="block text-md">{label}</span>
                <small className="text-xs text-slate-500">{sub}</small>
              </button>
            ))}
          </div>
        </div>

        {/* Semester Section */}
        <div>
          <h2 className="text-lg font-bold text-slate-700 mb-3">Học kỳ</h2>
          <div className="grid grid-cols-2 gap-2 rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => handleSemesterChange('hk1')}
              className={`py-2 px-4 rounded-full text-center font-semibold transition-all ${
                localConfig.semester === 'hk1' ? 'bg-white shadow' : 'text-slate-500'
              }`}
            >
              Học kỳ 1
            </button>
            <button
              type="button"
              onClick={() => handleSemesterChange('hk2')}
              className={`py-2 px-4 rounded-full text-center font-semibold transition-all ${
                localConfig.semester === 'hk2' ? 'bg-white shadow' : 'text-slate-500'
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
                  className={`w-full flex items-center p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 font-bold border-transparent shadow-sm'
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
        <button
          type="button"
          onClick={() => saveConfig(localConfig)}
          className={`${clayButtonClasses} bg-indigo-500 text-white w-full py-4 text-lg font-bold`}
        >
          <Save className="inline-block mr-2" />
          Lưu Cấu Hình
        </button>
        <div className="grid grid-cols-2 gap-3 mt-3">
            <button
                type="button"
                onClick={() => setGameState('user_profile')}
                className={`${clayButtonClasses} bg-slate-200 text-slate-700 w-full py-2.5 font-semibold text-sm`}
            >
                <UserCog className="inline-block mr-1.5 h-4 w-4" />
                Tài khoản
            </button>
             <button
                type="button"
                onClick={handleLogout}
                className={`${clayButtonClasses} bg-white text-red-600 border-2 border-red-200 w-full py-2.5 font-semibold text-sm`}
            >
                <LogOut className="inline-block mr-1.5 h-4 w-4" />
                Đăng xuất
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigScreen;