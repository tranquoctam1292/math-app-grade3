import React, { useState } from 'react';
import { Mail, Key, UserPlus, LogIn, AlertTriangle, Loader, ShieldCheck, UserCheck, XCircle } from 'lucide-react';
import { ClayButton } from '../lib/helpers.jsx';
import { getDeviceId, encodeEmail } from '../lib/utils.js';
import { sendPasswordResetEmail, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, appId } from '../lib/firebase'; // Import from App.jsx

const AuthScreen = ({ onLoginSuccess, errorMsg, setErrorMsg }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMsg, setResetMsg] = useState(null);

    const handleAuth = async () => {
        if (!email || !password) { setErrorMsg("Vui lòng nhập đầy đủ thông tin"); return; }
        if (password.length < 6) { setErrorMsg("Mật khẩu phải từ 6 ký tự trở lên"); return; }
        
        setLoading(true);
        setErrorMsg(null);
        try {
            const cleanEmail = email.toLowerCase().trim();
            const accountId = encodeEmail(cleanEmail);
            // Sử dụng collection chung để xác thực tài khoản phụ huynh
            const accountRef = doc(db, 'artifacts', appId, 'public', 'data', 'math_accounts', accountId);
            const accountSnap = await getDoc(accountRef);

            if (isRegister) {
                if (accountSnap.exists()) {
                    setErrorMsg("Email này đã được đăng ký!");
                } else {
                    const newUid = crypto.randomUUID();
                    const newAccount = {
                        email: cleanEmail,
                        password: password,
                        uid: newUid,
                        displayName: 'Phụ Huynh',
                        devices: [getDeviceId()], 
                        createdAt: Date.now()
                    };
                    await setDoc(accountRef, newAccount);
                    await onLoginSuccess(newAccount); // Đăng ký thành công -> đăng nhập
                }
            } else {
                if (!accountSnap.exists()) {
                    setErrorMsg("Tài khoản không tồn tại!");
                } else {
                    const data = accountSnap.data();
                    if (data.password === password) {
                        await onLoginSuccess(data); // Đăng nhập thành công
                    } else {
                        setErrorMsg("Sai mật khẩu!");
                    }
                }
            }
        } catch (e) {
            console.error(e);
            setErrorMsg("Lỗi kết nối. Vui lòng thử lại: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAnonLogin = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            // Sử dụng signInAnonymously từ Firebase
            await signInAnonymously(auth);
            // Tạo tài khoản ảo cho người dùng ẩn danh (không cần email/pass)
            const anonUser = {
                email: "anon@temp.com",
                password: "temp",
                uid: auth.currentUser.uid,
                displayName: 'Khách',
                devices: [getDeviceId()], 
                createdAt: Date.now(),
                isAnon: true
            };
            await onLoginSuccess(anonUser);
        } catch(e) {
            setErrorMsg("Lỗi đăng nhập ẩn danh: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        const targetEmail = resetEmail?.toLowerCase().trim();
        if (!targetEmail) {
            setResetMsg({ type: 'error', text: 'Vui lòng nhập email để nhận liên kết khôi phục.' });
            return;
        }

        setResetLoading(true);
        setResetMsg(null);
        try {
            await sendPasswordResetEmail(auth, targetEmail);
            setResetMsg({ type: 'success', text: 'Đã gửi hướng dẫn đặt lại mật khẩu. Kiểm tra hộp thư nhé!' });
        } catch (err) {
            console.error(err);
            setResetMsg({ type: 'error', text: `Không thể gửi email: ${err.message}` });
        } finally {
            setResetLoading(false);
        }
    };

    const closeResetModal = () => {
        setIsResetOpen(false);
        setResetEmail('');
        setResetMsg(null);
        setResetLoading(false);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 justify-center">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 text-center">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">🔐</div>
                <h1 className="text-3xl font-black text-slate-800 mb-2">{isRegister ? 'Tạo Tài Khoản' : 'Chào Mừng'}</h1>
                <p className="text-slate-400 font-medium mb-8 text-sm">Phụ huynh đăng nhập để đồng bộ kết quả học tập cho bé.</p>

                {errorMsg && (
                    <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 flex items-center gap-2 text-xs font-bold animate-shake">
                        <AlertTriangle size={16}/> {errorMsg}
                    </div>
                )}

                <div className="space-y-4 mb-6">
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

                {!isRegister && (
                    <button
                        type="button"
                        onClick={() => {
                            setIsResetOpen(true);
                            setResetEmail(email);
                            setResetMsg(null);
                        }}
                        className="text-sm font-bold text-rose-500 hover:underline mb-4"
                    >
                        Quên mật khẩu?
                    </button>
                )}

                <button onClick={() => { setIsRegister(!isRegister); setErrorMsg(null); }} className="text-sm font-bold text-indigo-500 hover:underline mb-4">
                    {isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký mới'}
                </button>

                <div className="text-xs text-slate-400 font-medium mb-3">HOẶC</div>
                <ClayButton onClick={handleAnonLogin} disabled={loading} colorClass="bg-slate-200 text-slate-700" className="w-full h-12 flex items-center justify-center gap-2 font-bold text-sm">
                    {loading ? <Loader className="animate-spin"/> : <UserCheck/>}
                    Sử dụng tạm thời (Không lưu đồng bộ)
                </ClayButton>
            </div>
            
            <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                    <ShieldCheck size={14}/> Bảo mật tối đa • Sync 3 thiết bị
                </div>
            </div>

            {isResetOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white w-11/12 max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 relative">
                        <button
                            type="button"
                            onClick={closeResetModal}
                            className="absolute top-4 right-4 text-slate-400 hover:text-rose-500"
                        >
                            <XCircle size={20}/>
                        </button>
                        <h2 className="text-xl font-black text-slate-800 mb-2">Quên mật khẩu?</h2>
                        <p className="text-sm text-slate-500 mb-4">
                            Nhập email phụ huynh để nhận liên kết đặt lại mật khẩu nhé.
                        </p>
                        <div className="relative mb-4">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input
                                type="email"
                                value={resetEmail}
                                onChange={e => setResetEmail(e.target.value)}
                                placeholder="Email phụ huynh"
                                className="w-full h-12 pl-12 pr-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-rose-400 outline-none font-semibold text-slate-700 transition-all"
                            />
                        </div>
                        {resetMsg && (
                            <div
                                className={`mb-3 text-xs font-bold p-3 rounded-2xl flex items-center gap-2 ${resetMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}
                            >
                                {resetMsg.type === 'success' ? <ShieldCheck size={16}/> : <AlertTriangle size={16}/>}
                                {resetMsg.text}
                            </div>
                        )}
                        <ClayButton
                            onClick={handleResetPassword}
                            disabled={resetLoading}
                            colorClass="bg-rose-500 text-white"
                            className="w-full h-12 flex items-center justify-center gap-2 font-black text-sm"
                        >
                            {resetLoading ? <Loader className="animate-spin"/> : <Mail size={18}/>}
                            Gửi hướng dẫn mới
                        </ClayButton>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthScreen;
