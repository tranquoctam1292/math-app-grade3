import React, { useState } from 'react';
import { Mail, Key, UserPlus, LogIn, AlertTriangle, Loader, ShieldCheck, UserCheck, Send } from 'lucide-react';
import { ClayButton } from '../lib/helpers.jsx';
import { getDeviceId } from '../lib/utils.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    updateProfile, 
    signInAnonymously,
    sendPasswordResetEmail,
    signOut
} from 'firebase/auth';
import { auth } from '../lib/firebase';

const AuthScreen = ({ onLoginSuccess, errorMsg, setErrorMsg }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState(''); // Thêm tên hiển thị khi đăng ký
    const [loading, setLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetInfo, setResetInfo] = useState(null);

    const handleAuth = async () => {
        if (!email || !password) { setErrorMsg("Vui lòng nhập email và mật khẩu"); return; }
        if (password.length < 6) { setErrorMsg("Mật khẩu phải từ 6 ký tự trở lên"); return; }
        if (isRegister && !displayName) { setErrorMsg("Vui lòng nhập tên hiển thị"); return; }
        
        setLoading(true);
        setErrorMsg(null);
        try {
            let userCredential;
            if (isRegister) {
                // Đăng ký mới
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Cập nhật tên hiển thị ngay sau khi tạo
                await updateProfile(userCredential.user, {
                    displayName: displayName
                });
            } else {
                // Đăng nhập
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            }

            const user = userCredential.user;
            // Chuẩn hóa object user để trả về App.jsx
            const appUser = {
                email: user.email,
                uid: user.uid,
                displayName: user.displayName || displayName || 'Phụ Huynh',
                devices: [getDeviceId()], 
                createdAt: user.metadata.creationTime,
                isAnon: false
            };
            
            try {
                await onLoginSuccess(appUser);
            } catch (postLoginError) {
                // Lỗi xảy ra sau khi đăng nhập thành công (thường là lỗi Firestore permissions)
                console.error("Lỗi sau khi đăng nhập:", postLoginError);
                let msg = "Đăng nhập thành công nhưng không thể tải dữ liệu. ";
                if (postLoginError.code === 'permission-denied' || postLoginError.message?.includes('permission')) {
                    msg += "Vui lòng kiểm tra quyền truy cập Firestore.";
                } else {
                    msg += postLoginError.message || "Vui lòng thử lại.";
                }
                setErrorMsg(msg);
                // Sign out để tránh trạng thái không nhất quán
                if (auth) {
                    await signOut(auth);
                }
                return;
            }

        } catch (e) {
            console.error(e);
            let msg = "";
            // Xử lý các lỗi Firebase Auth cụ thể
            if (e.code === 'auth/email-already-in-use') {
                msg = "Email này đã được đăng ký!";
            } else if (e.code === 'auth/invalid-email') {
                msg = "Email không hợp lệ!";
            } else if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
                msg = "Sai email hoặc mật khẩu!";
            } else if (e.code === 'auth/weak-password') {
                msg = "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn!";
            } else if (e.code === 'auth/network-request-failed') {
                msg = "Lỗi kết nối mạng. Vui lòng kiểm tra internet!";
            } else if (e.code) {
                // Các lỗi Firebase Auth khác
                msg = `Lỗi đăng nhập: ${e.code}`;
            } else {
                // Lỗi không xác định
                msg = "Lỗi kết nối: " + (e.message || "Vui lòng thử lại.");
            }
            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleAnonLogin = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const result = await signInAnonymously(auth);
            const anonUser = {
                email: "anon@temp.com",
                uid: result.user.uid,
                displayName: 'Khách',
                devices: [getDeviceId()], 
                createdAt: Date.now(),
                isAnon: true
            };
            try {
                await onLoginSuccess(anonUser);
            } catch (postLoginError) {
                console.error("Lỗi sau khi đăng nhập ẩn danh:", postLoginError);
                setErrorMsg("Đăng nhập ẩn danh thành công nhưng không thể khởi tạo. Vui lòng thử lại.");
                if (auth) {
                    await signOut(auth);
                }
                return;
            }
        } catch(e) {
            console.error("Lỗi đăng nhập ẩn danh:", e);
            let msg = "Lỗi đăng nhập ẩn danh: ";
            if (e.code === 'auth/network-request-failed') {
                msg += "Lỗi kết nối mạng. Vui lòng kiểm tra internet!";
            } else {
                msg += e.message || "Vui lòng thử lại.";
            }
            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            setErrorMsg("Vui lòng nhập email để khôi phục mật khẩu");
            return;
        }
        setResetInfo(null);
        setErrorMsg(null);
        setResetLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setResetInfo("Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư!");
        } catch (error) {
            console.error(error);
            let msg = "Không thể gửi email. Vui lòng thử lại.";
            if (error.code === 'auth/user-not-found') msg = "Email này chưa đăng ký.";
            setErrorMsg(msg);
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 justify-center">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 text-center">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">🔐</div>
                <h1 className="text-3xl font-black text-slate-800 mb-2">{isRegister ? 'Tạo Tài Khoản' : 'Đăng Nhập'}</h1>
                <p className="text-slate-400 font-medium mb-8 text-sm">Phụ huynh đăng nhập để đồng bộ kết quả học tập cho bé.</p>

                {resetInfo && (
                    <div className="mb-4 bg-green-50 text-green-600 p-3 rounded-xl border border-green-100 flex items-center gap-2 text-xs font-bold animate-fade-in">
                        <Send size={16}/> {resetInfo}
                    </div>
                )}

                {errorMsg && (
                    <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 flex items-center gap-2 text-xs font-bold animate-shake">
                        <AlertTriangle size={16}/> {errorMsg}
                    </div>
                )}

                <div className="space-y-4 mb-6">
                    {isRegister && (
                        <div className="relative">
                            <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Tên hiển thị (VD: Bố Tuấn)" className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all"/>
                        </div>
                    )}
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email phụ huynh" className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all"/>
                    </div>
                    <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mật khẩu" className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all"/>
                    </div>
                </div>

                <ClayButton onClick={handleAuth} disabled={loading} colorClass="bg-indigo-600 text-white" className="w-full h-14 flex items-center justify-center gap-2 font-black text-lg mb-4">
                    {loading ? <Loader className="animate-spin"/> : (isRegister ? <UserPlus/> : <LogIn/>)}
                    {isRegister ? 'Đăng Ký Ngay' : 'Đăng Nhập'}
                </ClayButton>

                <button onClick={() => { setIsRegister(!isRegister); setErrorMsg(null); setResetInfo(null); }} className="text-sm font-bold text-indigo-500 hover:underline mb-1">
                    {isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký mới'}
                </button>
                {!isRegister && (
                    <button
                        onClick={handleResetPassword}
                        disabled={resetLoading}
                        className="text-xs font-bold text-slate-400 hover:text-indigo-500 mb-4"
                    >
                        {resetLoading ? 'Đang gửi...' : 'Quên mật khẩu? Nhận email khôi phục'}
                    </button>
                )}

                <div className="text-xs text-slate-400 font-medium mb-3">HOẶC</div>
                <ClayButton onClick={handleAnonLogin} disabled={loading} colorClass="bg-slate-200 text-slate-700" className="w-full h-12 flex items-center justify-center gap-2 font-bold text-sm">
                    {loading ? <Loader className="animate-spin"/> : <UserCheck/>}
                    Dùng thử (Không lưu dữ liệu lâu dài)
                </ClayButton>
            </div>
            
            <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                    <ShieldCheck size={14}/> Bảo mật bởi Google Firebase
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;