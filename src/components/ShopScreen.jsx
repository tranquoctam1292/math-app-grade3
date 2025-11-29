import React from 'react';
import { ArrowLeft, PiggyBank, Banknote, Clock } from 'lucide-react';
import { ClayButton } from '../lib/helpers';
import { SHOP_ITEMS } from '../lib/constants';
import { fmt } from '../lib/utils';

const ShopScreen = ({ piggyBank, setGameState, redeemCash, redemptionHistory }) => (
    <div className="flex flex-col h-full bg-purple-50">
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
    </div>
);
export default ShopScreen;
