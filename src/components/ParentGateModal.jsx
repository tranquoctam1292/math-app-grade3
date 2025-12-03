import React, { useEffect, useState } from 'react';
import { Lock, Brain, XCircle, ShieldCheck } from 'lucide-react';
import { ClayButton } from '../lib/helpers';
import { verifyParentPin } from '../lib/utils';

const createChallenge = () => {
    const a = Math.floor(Math.random() * 80) + 20;
    const b = Math.floor(Math.random() * 70) + 10;
    const operations = ['+', '-'];
    const op = operations[Math.floor(Math.random() * operations.length)];
    if (op === '+') {
        return { text: `${a} + ${b}`, answer: a + b };
    }
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    return { text: `${big} - ${small}`, answer: big - small };
};

const ParentGateModal = ({ isOpen, onClose, onSuccess, parentSettings, reasonLabel }) => {
    const [mode, setMode] = useState(parentSettings?.pinHash ? 'pin' : 'challenge');
    const [pinInput, setPinInput] = useState('');
    const [challengeAnswer, setChallengeAnswer] = useState('');
    const [challenge, setChallenge] = useState(createChallenge());
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMode(parentSettings?.pinHash ? 'pin' : 'challenge');
            setPinInput('');
            setChallengeAnswer('');
            setError(null);
            setChallenge(createChallenge());
        }
    }, [isOpen, parentSettings]);

    if (!isOpen) return null;

    const handleVerify = async () => {
        setError(null);
        setLoading(true);
        try {
            let passed = false;
            if (mode === 'pin') {
                if (!pinInput) {
                    setError('Vui lòng nhập mã PIN 4 số.');
                } else if (!parentSettings?.pinHash) {
                    setError('Chưa thiết lập mã PIN. Vui lòng dùng phép tính.');
                } else {
                    passed = await verifyParentPin(pinInput, parentSettings.pinHash);
                    if (!passed) setError('PIN chưa đúng, thử lại nhé.');
                }
            } else {
                if (String(challengeAnswer).trim() === '') {
                    setError('Vui lòng điền đáp án.');
                } else if (Number(challengeAnswer) !== challenge.answer) {
                    setError('Đáp án chưa chính xác, cùng thử lần nữa!');
                    setChallenge(createChallenge());
                    setChallengeAnswer('');
                } else {
                    passed = true;
                }
            }

            if (passed) {
                onSuccess();
            }
        } catch {
            setError('Có lỗi xảy ra, thử lại giúp mình nhé.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-red-500">
                    <XCircle size={24} />
                </button>
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-600">
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">Góc phụ huynh</h2>
                    <p className="text-sm font-bold text-slate-400 mt-1">Bảo vệ: {reasonLabel}</p>
                </div>

                <div className="flex gap-2 mb-4">
                    <ClayButton
                        onClick={() => setMode('pin')}
                        colorClass={mode === 'pin' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}
                        className="flex-1 h-12 font-black !rounded-xl"
                    >
                        <Lock size={18} /> Mã PIN
                    </ClayButton>
                    <ClayButton
                        onClick={() => setMode('challenge')}
                        colorClass={mode === 'challenge' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}
                        className="flex-1 h-12 font-black !rounded-xl"
                    >
                        <Brain size={18} /> Phép tính
                    </ClayButton>
                </div>

                {mode === 'pin' ? (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Nhập mã PIN 4 số</label>
                        <input
                            type="password"
                            maxLength={6}
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                            className="w-full h-14 px-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:border-indigo-500 font-black text-center text-2xl tracking-widest"
                        />
                        {!parentSettings?.pinHash && (
                            <p className="text-xs text-orange-500 font-bold">Chưa đặt PIN? Dùng phép tính hoặc thiết lập ở mục Tài khoản.</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Giải nhanh phép tính</label>
                        <div className="w-full h-16 px-4 rounded-2xl border-2 border-orange-200 bg-orange-50 flex items-center justify-between">
                            <span className="font-black text-xl text-orange-600">{challenge.text} = ?</span>
                            <input
                                type="number"
                                value={challengeAnswer}
                                onChange={(e) => setChallengeAnswer(e.target.value)}
                                className="w-20 h-12 text-center font-black text-lg rounded-xl border border-orange-200"
                            />
                        </div>
                    </div>
                )}

                {error && <div className="mt-4 text-sm font-bold text-red-500 text-center">{error}</div>}

                <ClayButton
                    onClick={handleVerify}
                    disabled={loading}
                    colorClass="bg-indigo-600 text-white"
                    className="w-full h-14 font-black text-lg mt-6 !rounded-2xl"
                >
                    {loading ? 'Đang kiểm tra...' : 'Mở khóa ngay'}
                </ClayButton>
            </div>
        </div>
    );
};

export default ParentGateModal;

