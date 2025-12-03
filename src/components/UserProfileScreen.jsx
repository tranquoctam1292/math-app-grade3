import React, { useState } from 'react';
import { 
    UserCog, XCircle, CheckCircle, AlertTriangle, User, Mail, Save, Key, 
    RefreshCw, Loader, LogOut, MessageSquarePlus, ShieldCheck, Smartphone,
    Users, Edit3, Trash2, PlusCircle, Shield, Power
} from 'lucide-react'; 
import { updateProfile, updatePassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ClayButton } from '../lib/helpers';
import FeedbackModal from './FeedbackModal';
import { AVATARS } from '../lib/constants'; 
import { getDeviceId } from '../lib/utils';

const UserProfileScreen = ({
    appUser,
    setAppUser,
    setGameState,
    onLogout,
    profiles,
    onSaveProfiles,
    deviceSessions = [],
    onRemoteLogoutDevice,
    parentSettings,
    onUpdateParentSettings
}) => {
    // --- STATE QUẢN LÝ TÀI KHOẢN ---
    const [displayName, setDisplayName] = useState(appUser.displayName || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [pinValue, setPinValue] = useState('');
    const [pinConfirm, setPinConfirm] = useState('');
    const [pinLoading, setPinLoading] = useState(false);

    // --- STATE QUẢN LÝ SỬA PROFILE ---
    const [editingProfile, setEditingProfile] = useState(null); 
    const [editName, setEditName] = useState('');
    const [editAvatar, setEditAvatar] = useState('');
    const [localDeviceId] = useState(() => getDeviceId());

    // --- HÀM CẬP NHẬT TÊN HIỂN THỊ (PHỤ HUYNH) ---
    const handleUpdateProfile = async () => {
        setLoading(true); setMessage(null); setError(null);
        try {
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: displayName });
                
                const updatedUser = { ...appUser, displayName };
                setAppUser(updatedUser);
                localStorage.setItem('math_app_user_session', JSON.stringify(updatedUser));
                
                setMessage("Đã cập nhật tên hiển thị!");
            } else {
                setError("Không tìm thấy người dùng đăng nhập.");
            }
        } catch (e) {
            setError("Lỗi cập nhật: " + e.message);
        }
        setLoading(false);
    };

    const handleSavePin = async () => {
        if (pinValue.length < 4) { setError("Mã PIN phải có ít nhất 4 số."); return; }
        if (pinValue !== pinConfirm) { setError("PIN xác nhận chưa khớp."); return; }
        setPinLoading(true); setMessage(null); setError(null);
        const result = await onUpdateParentSettings({ pin: pinValue });
        setPinLoading(false);
        if (result.success) {
            setMessage("Đã lưu mã PIN phụ huynh!");
            setPinValue(''); setPinConfirm('');
        } else {
            setError(result.message || "Không thể lưu mã PIN.");
        }
    };

    const handleClearPin = async () => {
        if (!parentSettings?.pinHash) return;
        setPinLoading(true); setMessage(null); setError(null);
        const result = await onUpdateParentSettings({ pin: '' });
        setPinLoading(false);
        if (result.success) setMessage("Đã xoá mã PIN. Vui lòng đặt mã mới để bảo vệ bé.");
        else setError(result.message || "Không thể xoá mã PIN.");
    };

    const handleRemoteLogout = async (deviceId) => {
        if (!window.confirm("Đăng xuất thiết bị này khỏi tài khoản?")) return;
        setLoading(true); setMessage(null); setError(null);
        const result = await onRemoteLogoutDevice(deviceId);
        setLoading(false);
        if (result.success) setMessage(result.message);
        else setError(result.message);
    };

    // --- HÀM ĐỔI MẬT KHẨU ---
    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) { setError("Vui lòng nhập mật khẩu mới"); return; }
        if (newPassword !== confirmPassword) { setError("Mật khẩu xác nhận không khớp"); return; }
        if (newPassword.length < 6) { setError("Mật khẩu phải từ 6 ký tự trở lên"); return; }

        setLoading(true); setMessage(null); setError(null);
        try {
            if (auth.currentUser) {
                await updatePassword(auth.currentUser, newPassword);
                setMessage("Đổi mật khẩu thành công!");
                setNewPassword(''); setConfirmPassword('');
            } else {
                setError("Vui lòng đăng nhập lại để thực hiện thao tác này.");
            }
        } catch (e) {
            if (e.code === 'auth/requires-recent-login') {
                setError("Để bảo mật, vui lòng đăng xuất và đăng nhập lại trước khi đổi mật khẩu.");
            } else {
                setError("Lỗi: " + e.message);
            }
        }
        setLoading(false);
    };

    // --- CÁC HÀM CRUD PROFILE HỌC SINH ---
    const startEdit = (profile) => {
        setEditingProfile(profile);
        setEditName(profile.name);
        setEditAvatar(profile.avatar);
    };

    const handleDeleteProfile = (profileId) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa hồ sơ này? Dữ liệu học tập của bé sẽ bị mất vĩnh viễn.")) {
            const newList = profiles.filter(p => p.id !== profileId);
            onSaveProfiles(newList);
        }
    };

    const saveEditProfile = () => {
        if (!editName.trim()) return;
        const newList = profiles.map(p => 
            p.id === editingProfile.id 
                ? { ...p, name: editName, avatar: editAvatar } 
                : p
        );
        onSaveProfiles(newList);
        setEditingProfile(null);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            {/* Header */}
            <div className="flex justify-between items-center p-6 bg-white shadow-sm z-10 shrink-0">
                <h2 className="text-2xl font-black text-slate-700 flex items-center gap-2">
                    <UserCog className="text-blue-500"/> Tài Khoản
                </h2>
                <ClayButton onClick={() => setGameState('home')} className="w-10 h-10 flex items-center justify-center !rounded-full !p-0">
                    <XCircle size={24} className="text-slate-400"/>
                </ClayButton>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32 no-scrollbar">
                {/* Thông báo */}
                {message && <div className="bg-green-100 text-green-700 p-3 rounded-xl font-bold flex gap-2 animate-fade-in"><CheckCircle size={20}/> {message}</div>}
                {error && <div className="bg-red-100 text-red-600 p-3 rounded-xl font-bold flex gap-2 animate-shake"><AlertTriangle size={20}/> {error}</div>}

                {/* --- MỤC 1: QUẢN LÝ HỒ SƠ HỌC SINH --- */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-400 text-xs uppercase flex items-center gap-2"><Users size={14}/> Hồ sơ học sinh ({profiles.length})</h3>
                        <button onClick={() => setGameState('profile_select')} className="text-indigo-500 font-bold text-xs flex items-center gap-1 hover:underline">
                            <PlusCircle size={14}/> Thêm mới
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {profiles.map(profile => (
                            <div key={profile.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm border border-slate-100">
                                        {profile.avatar}
                                    </div>
                                    <span className="font-black text-slate-700">{profile.name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => startEdit(profile)} className="p-2 bg-white text-blue-500 rounded-xl border border-blue-100 hover:bg-blue-50 transition-colors">
                                        <Edit3 size={16}/>
                                    </button>
                                    <button onClick={() => handleDeleteProfile(profile.id)} className="p-2 bg-white text-red-500 rounded-xl border border-red-100 hover:bg-red-50 transition-colors">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {profiles.length === 0 && <div className="text-center text-slate-400 text-sm italic py-2">Chưa có hồ sơ nào</div>}
                    </div>
                </div>

                {/* --- MỤC 2: THÔNG TIN PHỤ HUYNH --- */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-400 text-xs uppercase mb-4 flex items-center gap-2"><User size={14}/> Thông tin chung</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 block mb-1">Email đăng nhập</label>
                            <div className="w-full h-12 px-4 rounded-xl bg-slate-100 flex items-center text-slate-600 font-bold border border-slate-200">
                                <Mail size={16} className="mr-2 opacity-50"/> {appUser.email || "Tài khoản ẩn danh"}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 block mb-1">Tên phụ huynh</label>
                            <div className="flex gap-2">
                                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="flex-1 h-12 px-4 rounded-xl border-2 border-slate-100 bg-white focus:border-blue-500 outline-none font-bold text-slate-700 transition-all"/>
                                <ClayButton onClick={handleUpdateProfile} disabled={loading} colorClass="bg-blue-100 text-blue-600" className="w-12 h-12 flex items-center justify-center !rounded-xl border-blue-200">
                                    {loading ? <Loader size={20} className="animate-spin"/> : <Save size={20}/>}
                                </ClayButton>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- MỤC 3: MÃ PIN PHỤ HUYNH --- */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-400 text-xs uppercase mb-4 flex items-center gap-2"><Shield size={14}/> Hàng rào phụ huynh</h3>
                    <div className="space-y-3">
                        <input
                            type="password"
                            value={pinValue}
                            onChange={e => setPinValue(e.target.value.replace(/\D/g, ''))}
                            placeholder="Nhập mã PIN 4 số"
                            maxLength={6}
                            className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all"
                        />
                        <input
                            type="password"
                            value={pinConfirm}
                            onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                            placeholder="Nhập lại mã PIN"
                            maxLength={6}
                            className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all"
                        />
                        <div className="flex gap-2">
                            <ClayButton onClick={handleSavePin} disabled={pinLoading || !pinValue} colorClass="bg-indigo-600 text-white" className="flex-1 h-12 font-bold !rounded-xl">
                                {pinLoading ? <Loader size={18} className="animate-spin"/> : 'Lưu Mã PIN'}
                            </ClayButton>
                            <ClayButton onClick={handleClearPin} disabled={!parentSettings?.pinHash || pinLoading} colorClass="bg-slate-100 text-slate-500" className="w-28 h-12 font-bold !rounded-xl">
                                Xoá PIN
                            </ClayButton>
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold">Mã PIN sẽ được yêu cầu khi mở Cấu hình và chế độ Admin của Cửa hàng.</p>
                    </div>
                </div>

                {/* --- MỤC 4: ĐỔI MẬT KHẨU --- */}
                {!appUser.isAnon && (
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-400 text-xs uppercase mb-4 flex items-center gap-2"><Key size={14}/> Bảo mật</h3>
                        <div className="space-y-3">
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mật khẩu mới" className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all"/>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Xác nhận mật khẩu" className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all"/>
                            <ClayButton onClick={handleChangePassword} disabled={loading || !newPassword} colorClass="bg-slate-800 text-white" className="w-full h-12 flex items-center justify-center gap-2 font-bold !rounded-xl shadow-lg shadow-slate-200">
                                <RefreshCw size={18}/> Cập nhật mật khẩu
                            </ClayButton>
                        </div>
                    </div>
                )}

                {/* --- MỤC 5: THIẾT BỊ ĐĂNG NHẬP --- */}
                {!appUser.isAnon && (
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-400 text-xs uppercase mb-4 flex items-center gap-2"><Smartphone size={14}/> Thiết bị đã đăng nhập ({deviceSessions.length}/3)</h3>
                        <div className="space-y-3">
                            {deviceSessions.length === 0 && (
                                <div className="text-center text-slate-400 text-sm italic py-2">Chưa ghi nhận thiết bị nào.</div>
                            )}
                            {deviceSessions.map(device => (
                                <div key={device.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                                    <div>
                                        <div className="font-black text-slate-700 text-sm">{device.name || 'Thiết bị lạ'}</div>
                                        <div className="text-[10px] text-slate-400">Hoạt động: {device.lastActive ? new Date(device.lastActive).toLocaleString('vi-VN') : 'Không rõ'}</div>
                                    </div>
                                    {device.id === localDeviceId ? (
                                        <span className="text-[10px] font-black text-green-500 px-2 py-1 bg-green-100 rounded-full">Thiết bị này</span>
                                    ) : (
                                        <ClayButton onClick={() => handleRemoteLogout(device.id)} colorClass="bg-red-100 text-red-600" className="h-9 px-3 text-xs font-black !rounded-xl">
                                            <Power size={14}/> Đăng xuất
                                        </ClayButton>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- MỤC 6: CÔNG CỤ KHÁC --- */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                    <h3 className="font-bold text-slate-400 text-xs uppercase mb-2 flex items-center gap-2"><ShieldCheck size={14}/> Trung tâm hỗ trợ</h3>
                    
                    <ClayButton onClick={() => setShowFeedback(true)} colorClass="bg-yellow-50 text-yellow-700 border-yellow-200" className="w-full h-14 flex items-center px-4 gap-3 !rounded-2xl hover:bg-yellow-100">
                        <div className="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center border border-yellow-300"><MessageSquarePlus size={20}/></div>
                        <div className="flex-1 text-left font-bold">Góp ý & Báo lỗi</div>
                    </ClayButton>

                    <ClayButton onClick={() => { if(window.confirm('Đăng xuất khỏi tài khoản này?')) onLogout(true); }} colorClass="bg-red-50 text-red-600 border-red-200" className="w-full h-14 flex items-center px-4 gap-3 !rounded-2xl hover:bg-red-100">
                        <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center border border-red-300"><LogOut size={20}/></div>
                        <div className="flex-1 text-left font-bold">Đăng xuất</div>
                    </ClayButton>
                </div>
                
                {/* Footer Info */}
                <div className="text-center pb-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold">
                        <Smartphone size={10}/> Thiết bị đang dùng: {deviceSessions.length}/3
                    </span>
                </div>
            </div>

            {/* --- MODAL CHỈNH SỬA PROFILE --- */}
            {editingProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-shake relative border-4 border-white">
                        <button onClick={() => setEditingProfile(null)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500">
                            <XCircle size={24}/>
                        </button>

                        <h3 className="text-xl font-black text-slate-700 mb-6 text-center">Sửa Hồ Sơ</h3>
                        
                        <div className="mb-6">
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-2 text-center">Tên bé</label>
                            <input 
                                type="text" 
                                value={editName} 
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full h-14 px-4 rounded-2xl border-2 border-indigo-100 bg-indigo-50 font-bold text-indigo-900 text-lg text-center outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>

                        <div className="mb-8">
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-2 text-center">Chọn Avatar</label>
                            <div className="flex gap-2 justify-center flex-wrap">
                                {AVATARS.map(avatar => (
                                     <button 
                                        key={avatar} 
                                        onClick={() => setEditAvatar(avatar)} 
                                        className={`text-3xl w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${editAvatar === avatar ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110' : 'bg-slate-50'}`}
                                     >
                                        {avatar}
                                     </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <ClayButton onClick={() => setEditingProfile(null)} colorClass="bg-slate-100 text-slate-500" className="flex-1 h-12 font-bold !rounded-xl border-slate-200">Hủy</ClayButton>
                            <ClayButton onClick={saveEditProfile} colorClass="bg-indigo-600 text-white" className="flex-1 h-12 font-bold !rounded-xl border-indigo-700 shadow-lg shadow-indigo-200">Lưu</ClayButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Góp Ý */}
            <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} appUser={appUser} />
        </div>
    );
};

export default UserProfileScreen;