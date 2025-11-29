import React from 'react';
import { TOPICS_LIST } from '../lib/constants'; // Giả sử constants.js có TOPICS_LIST

const ConfigScreen = ({ config, setConfig, saveConfig, setGameState, onLogout, appUser }) => {
    
    const handleTopicChange = (topicId) => {
        const selectedTopics = config.selectedTopics.includes(topicId)
            ? config.selectedTopics.filter(id => id !== topicId)
            : [...config.selectedTopics, topicId];
        setConfig({ ...config, selectedTopics });
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Cấu hình bài tập</h1>

            <div className="mb-6">
                <h2 className="font-bold mb-2">Độ khó</h2>
                <div className="flex gap-2">
                    <button onClick={() => setConfig({...config, difficultyMode: 'easy'})} className={`px-4 py-2 rounded-lg ${config.difficultyMode === 'easy' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>Dễ</button>
                    <button onClick={() => setConfig({...config, difficultyMode: 'medium'})} className={`px-4 py-2 rounded-lg ${config.difficultyMode === 'medium' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}>Vừa</button>
                    <button onClick={() => setConfig({...config, difficultyMode: 'hard'})} className={`px-4 py-2 rounded-lg ${config.difficultyMode === 'hard' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>Khó</button>
                </div>
            </div>

            <div className="mb-6">
                <h2 className="font-bold mb-2">Học kỳ</h2>
                 <div className="flex gap-2">
                    <button onClick={() => setConfig({...config, semester: 'hk1'})} className={`px-4 py-2 rounded-lg ${config.semester === 'hk1' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Học kỳ 1</button>
                    <button onClick={() => setConfig({...config, semester: 'hk2'})} className={`px-4 py-2 rounded-lg ${config.semester === 'hk2' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Học kỳ 2</button>
                </div>
            </div>
            
            <div className="mb-6">
                <h2 className="font-bold mb-2">Chủ đề ôn tập</h2>
                <div className="space-y-2">
                    {TOPICS_LIST.map(topic => (
                        <label key={topic.id} className="flex items-center">
                            <input
                                type="checkbox"
                                checked={config.selectedTopics.includes(topic.id)}
                                onChange={() => handleTopicChange(topic.id)}
                                className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-700">{topic.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <button onClick={() => saveConfig(config)} className="w-full bg-indigo-600 text-white p-4 rounded-lg font-bold mb-4">Lưu cấu hình</button>
            <button onClick={() => setGameState('home')} className="w-full bg-gray-300 text-black p-2 rounded-lg">Quay lại</button>

            {appUser && !appUser.isAnon && (
                 <button onClick={() => onLogout(true)} className="w-full text-red-500 p-2 rounded-lg mt-4 font-bold">Đăng xuất</button>
            )}
        </div>
    );
};

export default ConfigScreen;
