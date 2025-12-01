import React from 'react';
import { PiggyBank, Sparkles, WifiOff, Play, Loader, BarChart3, ShoppingBag, Settings, UserCog } from 'lucide-react'; // Thêm UserCog
import { ClayButton } from '../lib/helpers.jsx';
import { fmt } from '../lib/utils.js';

const HomeScreen = ({ piggyBank, setGameState, currentProfile, isGenerating, handleStartQuiz, config, setCurrentProfile, appError, setAppError }) => (
    <div className="flex flex-col h-full bg-slate-50 p-6">
        {/* Header Profile Info */}
        <div className="flex justify-between items-center mb-6 pt-4">
            <button onClick={() => { setGameState('profile_select'); setCurrentProfile(null); }} className="flex items-center gap-3 bg-white p-2 pr-4 rounded-full shadow-sm border border-slate-100 active:scale-95 transition-transform">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-2xl">{currentProfile?.avatar || '❓'}</div>
                <div className="flex flex-col text-left"><span className="text-[10px] font-bold text-slate-400 uppercase">Học viên</span><span className="font-black text-slate-700 leading-none">{currentProfile?.name || 'Chọn Hồ Sơ'}</span></div>
            </button>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-pink-100 shadow-sm"><PiggyBank className="text-pink-500 fill-pink-500" size={24} /><span className="font-black text-pink-600 text-lg">{fmt(piggyBank)}đ</span></div>
        </div>
        
        {appError ? (
             <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-3xl border border-red-100 flex items-center gap-3 animate-shake">
                <WifiOff className="text-red-400" size={24}/>
                <div className="flex-1 text-sm font-bold">{appError}</div>
                <button onClick={() => setAppError(null)} className="ml-2 font-bold">✕</button>
            </div>
        ) : (
            <div className="mb-6 bg-indigo-50 text-indigo-600 p-4 rounded-3xl border border-indigo-100 flex items-center gap-3"><Sparkles className="text-indigo-400" size={24}/><p className="font-bold text-sm">Hôm nay {currentProfile?.name} muốn học gì nào?</p></div>
        )}

        {/* Updated Grid Menu: 2 hàng 2 cột cho cân đối hoặc 4 nút */}
        <div className="grid grid-cols-2 gap-3 mb-6">
            <ClayButton onClick={() => setGameState('report')} className="h-20 flex flex-row items-center px-4 gap-3 bg-white border-slate-100 !rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><BarChart3 size={20}/></div>
                <span className="text-sm font-black text-slate-600">Học Bạ</span>
            </ClayButton>
            <ClayButton onClick={() => setGameState('shop')} className="h-20 flex flex-row items-center px-4 gap-3 bg-white border-slate-100 !rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center"><ShoppingBag size={20}/></div>
                <span className="text-sm font-black text-slate-600">Cửa Hàng</span>
            </ClayButton>
            <ClayButton onClick={() => setGameState('config')} className="h-20 flex flex-row items-center px-4 gap-3 bg-white border-slate-100 !rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><Settings size={20}/></div>
                <span className="text-sm font-black text-slate-600">Cấu Hình</span>
            </ClayButton>
            {/* Nút mới cho Tài khoản phụ huynh */}
            <ClayButton onClick={() => setGameState('user_profile')} className="h-20 flex flex-row items-center px-4 gap-3 bg-white border-slate-100 !rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"><UserCog size={20}/></div>
                <span className="text-sm font-black text-slate-600">Tài Khoản</span>
            </ClayButton>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <div><h1 className="text-4xl font-black text-indigo-600 mb-2 font-nunito tracking-tight">Toán Lớp 3</h1><p className="text-slate-400 font-medium">Đề bài được "thửa riêng" cho con!</p></div>
            <div className="w-full space-y-4">
                <ClayButton onClick={handleStartQuiz} disabled={isGenerating || !currentProfile} colorClass={`text-white ${isGenerating || !currentProfile ? 'bg-slate-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`} className="w-full h-24 flex items-center justify-center gap-3 text-2xl font-black shadow-indigo-200 !rounded-[2rem]">
                    {isGenerating ? <Loader className="animate-spin" /> : <Play fill="currentColor" size={32} />}
                    {isGenerating ? 'Đang tạo...' : !currentProfile ? 'Vui lòng chọn hồ sơ' : 'Làm Bài Tập'}
                </ClayButton>
                {currentProfile && (
                  <div className="flex gap-2 justify-center opacity-70"><span className="px-3 py-1 bg-slate-200 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wide">{config.difficultyMode === 'easy' ? 'Dễ thở' : config.difficultyMode === 'hard' ? 'Thử thách' : 'Tiêu chuẩn'}</span><span className="px-3 py-1 bg-indigo-100 rounded-full text-[10px] font-bold text-indigo-500 uppercase tracking-wide">{config.semester === 'hk1' ? 'Học Kỳ 1' : 'Học Kỳ 2'}</span></div>
                )}
            </div>
        </div>
    </div>
);

export default HomeScreen;