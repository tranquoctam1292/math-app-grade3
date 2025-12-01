import React, { useState, useEffect } from 'react';
import {
  Settings, XCircle, Trophy, ListChecks, CheckCircle,
  Save, Sparkles, HelpCircle
} from 'lucide-react';
import { TOPICS_LIST, ICON_MAP, SEMESTER_DEFAULT_TOPICS } from '../lib/constants';
import { ClayButton } from '../lib/helpers'; // Tận dụng ClayButton cho đồng bộ

const ConfigScreen = ({ config, saveConfig, setGameState }) => {
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
  
  // UI Definitions
  const difficultyLevels = {
    easy: { label: 'Khởi động', sub: 'Dành cho bé cần củng cố gốc (Level 1-2)', color: 'green', icon: Trophy },
    medium: { label: 'Tiêu chuẩn', sub: 'Bám sát SGK trên lớp (Level 2-3)', color: 'blue', icon: ListChecks },
    hard: { label: 'Thần đồng', sub: 'Thử thách tư duy & HS Giỏi (Level 3-4)', color: 'red', icon: Sparkles },
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-white shadow-sm shrink-0 z-10">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Settings className="text-orange-500" />
          Cấu Hình Học Tập
        </h1>
        <ClayButton onClick={() => setGameState('home')} className="w-10 h-10 flex items-center justify-center !rounded-full !p-0">
          <XCircle size={24} className="text-slate-400 hover:text-red-500 transition-colors" />
        </ClayButton>
      </div>

      <div className="flex-grow p-4 overflow-y-auto space-y-6 no-scrollbar pb-24">
        {/* Difficulty Section */}
        <section>
          <h2 className="text-lg font-black text-slate-700 mb-3 px-2">Độ khó</h2>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(difficultyLevels).map(([key, { label, sub, color, icon: LevelIcon }]) => (
              <ClayButton
                key={key}
                onClick={() => setLocalConfig({ ...localConfig, difficultyMode: key })}
                className={`p-3 !rounded-2xl flex flex-col items-center justify-center gap-1 h-32 ${
                  localConfig.difficultyMode === key
                    ? `bg-${color}-100 border-${color}-300 ring-2 ring-${color}-400`
                    : 'bg-white border-slate-100'
                }`}
              >
                <LevelIcon size={24} className={localConfig.difficultyMode === key ? `text-${color}-600` : 'text-slate-300'} />
                <span className={`block text-sm font-black ${localConfig.difficultyMode === key ? `text-${color}-700` : 'text-slate-500'}`}>{label}</span>
                <span className="text-[9px] text-slate-400 leading-tight font-bold">{sub}</span>
              </ClayButton>
            ))}
          </div>
        </section>

        {/* Semester Section */}
        <section>
          <h2 className="text-lg font-black text-slate-700 mb-3 px-2">Học kỳ</h2>
          <div className="grid grid-cols-2 gap-3 p-1">
            {['hk1', 'hk2'].map(sem => (
                <ClayButton
                    key={sem}
                    onClick={() => handleSemesterChange(sem)}
                    colorClass={localConfig.semester === sem ? 'bg-indigo-500 text-white' : 'bg-white text-slate-500'}
                    className="h-12 font-black text-lg"
                >
                    {sem === 'hk1' ? 'Học kỳ 1' : 'Học kỳ 2'}
                </ClayButton>
            ))}
          </div>
        </section>

        {/* Topics Section */}
        <section>
          <h2 className="text-lg font-black text-slate-700 mb-3 px-2">Chủ đề ôn tập</h2>
          <div className="space-y-2">
            {TOPICS_LIST.map((topic) => {
              const TopicIcon = ICON_MAP[topic.iconName] || HelpCircle;
              const isSelected = localConfig.selectedTopics.includes(topic.id);
              return (
                <ClayButton
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`w-full flex items-center p-3 !rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'bg-white border-slate-100 opacity-80'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isSelected ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                     <TopicIcon size={20} className={isSelected ? 'text-indigo-500' : 'text-slate-400'} />
                  </div>
                  <span className={`flex-grow text-left font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>{topic.label}</span>
                  {isSelected && <CheckCircle className="w-5 h-5 text-indigo-500" />}
                </ClayButton>
              );
            })}
          </div>
        </section>
      </div>

      {/* Footer Floating */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-white via-white to-transparent pt-10">
        <ClayButton
          onClick={() => saveConfig(localConfig)}
          colorClass="bg-indigo-600 text-white border-indigo-700"
          className="w-full h-14 text-xl font-black flex items-center justify-center gap-2 shadow-xl"
        >
          <Save size={24} />
          Lưu Cấu Hình
        </ClayButton>
      </div>
    </div>
  );
};

export default ConfigScreen;