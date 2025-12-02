import React from 'react';
import { User, UserPlus, XCircle, CheckCircle } from 'lucide-react'; 
import { ClayButton } from '../lib/helpers';

// ✅ Thêm prop `isLoading` vào danh sách props
const ProfileScreen = ({ profiles, setCurrentProfile, isCreatingProfile, setIsCreatingProfile, newProfileName, setNewProfileName, newProfileAvatar, setNewProfileAvatar, createProfile, appUser, isLoading }) => {
    
    React.useEffect(() => {
        // ✅ FIX: Chỉ tự động mở modal khi KHÔNG tải dữ liệu (isLoading = false) VÀ danh sách rỗng
        if (!isLoading && profiles.length === 0 && !isCreatingProfile) {
            setIsCreatingProfile(true);
        }
    }, [profiles, isCreatingProfile, setIsCreatingProfile, isLoading]);

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 relative">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-700">Chọn Hồ Sơ</h1>
                    <p className="text-sm font-bold text-slate-400">Ai đang học vậy nhỉ?</p>
                </div>
                {appUser && (
                   <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                        <User size={20} className="text-slate-500"/>
                   </div>
                )}
            </div>

            {/* ✅ FIX: Hiển thị Skeleton hoặc Loading khi đang tải */}
            {isLoading ? (
                <div className="text-center text-slate-400 font-bold mt-10">Đang tải hồ sơ...</div>
            ) : (
                <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-20 no-scrollbar">
                    {profiles.map(profile => (
                        <ClayButton 
                            key={profile.id} 
                            onClick={() => setCurrentProfile(profile)} 
                            className="aspect-square flex flex-col items-center justify-center gap-2 bg-white !rounded-3xl border-slate-100"
                        >
                            <div className="text-5xl drop-shadow-sm">{profile.avatar}</div>
                            <div className="font-black text-slate-700 text-lg truncate w-full px-2">{profile.name}</div>
                        </ClayButton>
                    ))}
                    
                    {/* Nút tạo mới */}
                    <ClayButton 
                        onClick={() => setIsCreatingProfile(true)} 
                        colorClass="bg-emerald-500 text-white border-emerald-600"
                        className="aspect-square flex flex-col items-center justify-center gap-2 !rounded-3xl"
                    >
                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                            <UserPlus size={32} className="text-white"/>
                        </div>
                        <div className="font-black text-white text-lg">Tạo mới</div>
                    </ClayButton>
                </div>
            )}

            {/* MODAL OVERLAY TẠO PROFILE (Giữ nguyên phần dưới) */}
            {isCreatingProfile && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animation-fade-in">
                    <div className="bg-white p-6 rounded-[2rem] shadow-2xl w-full max-w-sm relative animate-shake">
                        <button 
                            onClick={() => setIsCreatingProfile(false)} 
                            className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <XCircle size={28} />
                        </button>
                        
                        <h2 className="text-2xl font-black text-slate-700 mb-6 text-center">Hồ Sơ Mới</h2>
                        
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tên của bé</label>
                            <input
                                type="text"
                                value={newProfileName}
                                onChange={(e) => setNewProfileName(e.target.value)}
                                placeholder="Ví dụ: Bi, Bống..."
                                autoFocus
                                className="w-full h-14 px-4 rounded-2xl border-2 border-indigo-100 bg-indigo-50 focus:bg-white focus:border-indigo-500 outline-none font-bold text-indigo-900 text-lg text-center transition-all"
                            />
                        </div>
                        
                        <div className="mb-8">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Chọn ảnh đại diện</label>
                            <div className="flex gap-2 justify-center flex-wrap">
                                {['🐶', '🐱', '🦊', 'bq', '🦄', '🐯'].map(avatar => (
                                       <button 
                                            key={avatar} 
                                            onClick={() => setNewProfileAvatar(avatar)} 
                                            className={`text-3xl w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${newProfileAvatar === avatar ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110' : 'bg-slate-50'}`}
                                           >
                                            {avatar}
                                           </button>
                                ))}
                            </div>
                        </div>
                        
                        <ClayButton 
                            onClick={createProfile} 
                            colorClass="bg-indigo-600 text-white" 
                            className="w-full h-14 flex items-center justify-center gap-2 font-black text-lg !rounded-2xl"
                        >
                            <CheckCircle size={20}/> Hoàn Tất
                        </ClayButton>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileScreen;