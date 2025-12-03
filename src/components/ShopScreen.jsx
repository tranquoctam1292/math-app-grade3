import React, { useState } from 'react';
import { ArrowLeft, PiggyBank, Banknote, Clock, Lock, Key, Calculator, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ClayButton } from '../lib/helpers';
import { SHOP_ITEMS } from '../lib/constants';
import { fmt, evaluateMathLogic } from '../lib/utils';

const createParentGateChallenge = () => {
    const min = 10;
    const max = 19;
    const num1 = Math.floor(Math.random() * (max - min + 1)) + min;
    const num2 = Math.floor(Math.random() * (max - min + 1)) + min;
    const expression = `${num1} * ${num2}`;
    const result = evaluateMathLogic(expression);

    if (result === null) {
        return createParentGateChallenge();
    }

    return { num1, num2, expression, result };
};

const ShopScreen = ({ piggyBank = 0, setGameState, redeemCash, redemptionHistory = [], appUser }) => {
    const [isGatePassed, setIsGatePassed] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinFeedback, setPinFeedback] = useState(null);
    const [challenge, setChallenge] = useState(() => createParentGateChallenge());
    const [challengeAnswer, setChallengeAnswer] = useState('');
    const [challengeFeedback, setChallengeFeedback] = useState(null);

    const storedPin = appUser?.parentPin || appUser?.pin || appUser?.securityPin || '';
    const hasPin = Boolean(storedPin);

    const unlockParentGate = () => {
        setIsGatePassed(true);
        setPinInput('');
        setChallengeAnswer('');
        setPinFeedback(null);
        setChallengeFeedback(null);
    };

    const handleVerifyPin = () => {
        if (!pinInput.trim()) {
            setPinFeedback({ type: 'error', text: 'Vui lòng nhập mã PIN gồm 4 số.' });
            return;
        }
        if (!hasPin) {
            setPinFeedback({ type: 'error', text: 'Tài khoản chưa thiết lập mã PIN. Vui lòng dùng phần thử thách bên dưới.' });
            return;
        }

        if (pinInput.trim() === String(storedPin).trim()) {
            unlockParentGate();
        } else {
            setPinFeedback({ type: 'error', text: 'Mã PIN chưa đúng đâu. Phụ huynh kiểm tra lại nhé!' });
        }
    };

    const handleChallengeSubmit = () => {
        if (!challengeAnswer.trim()) {
            setChallengeFeedback({ type: 'error', text: 'Bạn cần nhập kết quả phép nhân.' });
            return;
        }
        const normalizedAnswer = evaluateMathLogic(`${challengeAnswer} * 1`);
        if (normalizedAnswer === null) {
            setChallengeFeedback({ type: 'error', text: 'Kết quả phải là số hợp lệ nhé!' });
            return;
        }
        if (normalizedAnswer === challenge.result) {
            unlockParentGate();
        } else {
            setChallengeFeedback({ type: 'error', text: 'Kết quả chưa chính xác, thử lại nhé!' });
        }
    };

    const refreshChallenge = () => {
        setChallenge(createParentGateChallenge());
        setChallengeAnswer('');
        setChallengeFeedback(null);
    };

    return (
        <div className="flex flex-col h-full bg-purple-50 relative">
            <div className="p-4 pt-6 flex justify-between items-center bg-white/90 sticky top-0 z-10 shadow-sm">
                <ClayButton onClick={() => setGameState('home')} className="w-10 h-10 flex items-center justify-center !rounded-full !p-0"><ArrowLeft size={20} className="text-slate-500"/></ClayButton>
                <div className="flex items-center gap-2 bg-pink-100 px-4 py-1.5 rounded-full border border-pink-200">
                    <PiggyBank className="text-pink-600 fill-pink-400" size={20} />
                    <span className="font-black text-pink-700 text-xl">{fmt(piggyBank)}đ</span>
                </div>
            </div>
            <div className="p-4 flex flex-col gap-4 overflow-y-auto pb-20 no-scrollbar">
                <h2 className="font-black text-slate-700 text-xl px-2">Đổi tiền mặt</h2>
                {SHOP_ITEMS.map(item => { 
                    const canBuy = piggyBank >= item.value; 
                    return (
                        <ClayButton key={item.id} onClick={() => redeemCash(item)} colorClass="bg-white" className={`h-24 flex items-center px-6 gap-4 border-2 ${item.color} ${!canBuy ? 'opacity-50 grayscale' : ''}`} disabled={!canBuy}>
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-slate-50 border border-slate-100 shadow-sm"><Banknote/></div>
                            <div className="flex-1 text-left">
                                <div className="font-black text-lg text-slate-700">{item.name}</div>
                                <div className="text-xs font-medium text-slate-400">Đổi ngay để nhận tiền thật</div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-black flex gap-1 ${canBuy ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>{fmt(item.value)}đ</div>
                        </ClayButton>
                    ); 
                })}
                {redemptionHistory.length > 0 && (
                    <div className="mt-4 px-2">
                        <h3 className="font-bold text-slate-500 text-sm uppercase mb-4">Ví quà tặng của bé</h3>
                        <div className="space-y-3">
                            {redemptionHistory.slice().reverse().map((h, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <div>
                                        <div className="font-bold text-slate-700 text-sm">{h.name}</div>
                                        <div className="text-xs text-orange-500 flex items-center gap-1 font-bold mt-1"><Clock size={12}/> Chờ bố mẹ duyệt</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">{new Date(h.date).toLocaleDateString('vi-VN')}</div>
                                    </div>
                                    <span className="font-black text-red-500 text-sm">-{fmt(h.value)}đ</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {!isGatePassed && (
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center px-4 z-50">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-slate-100">
                        <div className="flex items-center gap-2 text-2xl font-black text-slate-800 mb-3">
                            <Lock className="text-rose-500" size={28}/>
                            Cổng Phụ Huynh
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            Đây là khu đổi quà - phụ huynh vui lòng xác nhận bằng mã PIN hoặc giải phép nhân nhanh nhé.
                        </p>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                            <div className="flex items-center gap-2 font-bold text-slate-600 text-sm mb-2">
                                <Key size={16} className="text-indigo-500"/> Nhập mã PIN
                            </div>
                            <input
                                type="password"
                                value={pinInput}
                                onChange={e => setPinInput(e.target.value)}
                                placeholder="****"
                                className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-white focus:border-indigo-400 outline-none font-bold text-slate-700 tracking-widest text-center"
                                maxLength={6}
                            />
                            <ClayButton onClick={handleVerifyPin} colorClass="bg-indigo-600 text-white" className="w-full h-11 mt-3 font-black text-sm">
                                Mở khóa bằng PIN
                            </ClayButton>
                            {!hasPin && (
                                <p className="text-[11px] text-rose-500 font-semibold mt-2">Tài khoản chưa đặt PIN trong Hồ Sơ Phụ Huynh nên cần dùng phép nhân.</p>
                            )}
                            {pinFeedback && (
                                <div className={`mt-3 text-xs font-bold p-3 rounded-2xl flex items-center gap-2 ${pinFeedback.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                    {pinFeedback.type === 'error' ? <AlertTriangle size={16}/> : <ShieldCheck size={16}/>}
                                    {pinFeedback.text}
                                </div>
                            )}
                        </div>

                        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                            <div className="flex items-center gap-2 font-bold text-orange-600 text-sm mb-2">
                                <Calculator size={18}/> Hoặc giải phép nhân
                            </div>
                            <div className="flex items-center justify-between bg-white rounded-2xl border-2 border-orange-100 px-4 py-3 mb-3 font-black text-orange-600 text-lg">
                                <span>{challenge.num1}</span>
                                <span className="text-sm font-bold text-orange-400">x</span>
                                <span>{challenge.num2}</span>
                            </div>
                            <input
                                type="number"
                                value={challengeAnswer}
                                onChange={e => setChallengeAnswer(e.target.value)}
                                placeholder="Kết quả là..."
                                className="w-full h-12 px-4 rounded-xl border-2 border-orange-100 bg-white focus:border-orange-400 outline-none font-bold text-orange-700"
                            />
                            <div className="flex gap-2 mt-3">
                                <ClayButton onClick={handleChallengeSubmit} colorClass="bg-orange-500 text-white" className="flex-1 h-11 font-black text-sm">
                                    Hoàn tất phép nhân
                                </ClayButton>
                                <ClayButton onClick={refreshChallenge} colorClass="bg-white text-orange-600" className="w-12 h-11 flex items-center justify-center !rounded-2xl border border-orange-200">
                                    <RefreshCw size={18}/>
                                </ClayButton>
                            </div>
                            {challengeFeedback && (
                                <div className={`mt-3 text-xs font-bold p-3 rounded-2xl flex items-center gap-2 ${challengeFeedback.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                    {challengeFeedback.type === 'error' ? <AlertTriangle size={16}/> : <ShieldCheck size={16}/>}
                                    {challengeFeedback.text}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopScreen;
