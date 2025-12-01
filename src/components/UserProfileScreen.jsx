import React, { useState } from 'react';
import { UserCog, XCircle, CheckCircle, AlertTriangle, User, Mail, Save, Key, RefreshCw, Loader, ShieldCheck } from 'lucide-react';
import { updateProfile, updatePassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ClayButton } from '../lib/helpers';

const UserProfileScreen = ({ appUser, setAppUser, setGameState }) => {
    const [displayName, setDisplayName] = useState(appUser.displayName || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

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
            // Firebase yêu cầu đăng nhập lại nếu phiên quá cũ
            if (e.code === 'auth/requires-recent-login') {
                setError("Để bảo mật, vui lòng đăng xuất và đăng nhập lại trước khi đổi mật khẩu.");
            } else {
                setError("Lỗi: " + e.message);
            }
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-700 flex items-center gap-2"><UserCog className="text-indigo-500"/> Hồ Sơ Phụ Huynh</h2>
                <ClayButton onClick={() => setGameState('config')} className="w-10 h-10 flex items-center justify-center !rounded-full !p-0"><XCircle size={24} className="text-slate-400"/></ClayButton>
            </div>

            {message && <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-xl border border-green-200 font-bold text-sm flex items-center gap-2"><CheckCircle size={16}/> {message}</div>}
            {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl border border-red-200 font-bold text-sm flex items-center gap-2"><AlertTriangle size={16}/> {error}</div>}

            <div className="space-y-6 pb-20">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase"><User size={16}/> Thông tin tài khoản</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-slate-400 block mb-1">Email đăng nhập</label>
                            <div className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-100 flex items-center text-slate-500 font-bold text-sm">
                                <Mail size={16} className="mr-2 opacity-50"/> {appUser.email || "Chưa có email"}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 block mb-1">Tên hiển thị</label>
                            <div className="flex gap-2">
                                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="flex-1 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none font-bold text-slate-700"/>
                                <ClayButton onClick={handleUpdateProfile} disabled={loading} colorClass="bg-indigo-100 text-indigo-600" className="w-12 h-12 flex items-center justify-center !rounded-xl">
                                    {loading ? <Loader size={20} className="animate-spin"/> : <Save size={20}/>}
                                </ClayButton>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase"><Key size={16}/> Đổi mật khẩu</h3>
                    <div className="space-y-3">
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mật khẩu mới" className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none font-bold text-slate-700"/>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Xác nhận mật khẩu mới" className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none font-bold text-slate-700"/>
                        <ClayButton onClick={handleChangePassword} disabled={loading} colorClass="bg-slate-800 text-white" className="w-full h-12 flex items-center justify-center gap-2 font-bold !rounded-xl">
                            {loading ? <Loader size={20} className="animate-spin"/> : <RefreshCw size={20}/>} Cập nhật mật khẩu
                        </ClayButton>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default UserProfileScreen;