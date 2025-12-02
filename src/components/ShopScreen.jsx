import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, PiggyBank, Banknote, Clock, Shield, ShieldCheck, CircleAlert, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { ClayButton } from '../lib/helpers';
import { SHOP_ITEMS, REDEMPTION_STATUS } from '../lib/constants';
import { fmt } from '../lib/utils';

const STATUS_BADGE = {
    [REDEMPTION_STATUS.PENDING]: { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-600' },
    [REDEMPTION_STATUS.APPROVED]: { label: 'Đã duyệt', color: 'bg-green-100 text-green-600' },
    [REDEMPTION_STATUS.REJECTED]: { label: 'Từ chối', color: 'bg-red-100 text-red-600' }
};

const ShopScreen = ({
    piggyBank,
    setGameState,
    redeemCash,
    redemptionRequests,
    onApproveRequest,
    onRejectRequest,
    ensureParentAccess,
    parentAccessValid
}) => {
    const [adminMode, setAdminMode] = useState(false);
    const [adminMessage, setAdminMessage] = useState(null);
    const [adminError, setAdminError] = useState(null);
    const [confirmRequest, setConfirmRequest] = useState(null);

    const pendingRequests = useMemo(
        () => redemptionRequests.filter(r => r.status === REDEMPTION_STATUS.PENDING),
        [redemptionRequests]
    );
    const historyRequests = useMemo(
        () => redemptionRequests.filter(r => r.status !== REDEMPTION_STATUS.PENDING).sort((a, b) => (b.approvedAt || b.rejectedAt || 0) - (a.approvedAt || a.rejectedAt || 0)),
        [redemptionRequests]
    );

    const toggleAdmin = () => {
        if (adminMode) {
            setAdminMode(false);
            return;
        }
        if (parentAccessValid) {
            setAdminMode(true);
        } else {
            ensureParentAccess('shop_admin', () => setAdminMode(true));
        }
    };

    const handleDecision = async (requestId, action) => {
        if (action === 'approve') {
            const req = pendingRequests.find(r => r.requestId === requestId);
            if (req) setConfirmRequest(req);
            return;
        }
        setAdminMessage(null);
        setAdminError(null);
        const result = await onRejectRequest(requestId);
        if (result?.success) setAdminMessage(result.message);
        else setAdminError(result?.message || 'Không thực hiện được thao tác.');
    };

    const confirmApprove = async () => {
        if (!confirmRequest) return;
        setAdminMessage(null);
        setAdminError(null);
        const result = await onApproveRequest(confirmRequest.requestId);
        if (result?.success) {
            setAdminMessage(result.message);
            setConfirmRequest(null);
        } else {
            setAdminError(result?.message || 'Không thực hiện được thao tác.');
        }
    };

    useEffect(() => {
        if (!parentAccessValid && adminMode) {
            const timer = setTimeout(() => setAdminMode(false), 0);
            return () => clearTimeout(timer);
        }
    }, [parentAccessValid, adminMode]);

    return (
        <div className="flex flex-col h-full bg-purple-50">
            <div className="p-4 pt-6 flex justify-between items-center bg-white/90 sticky top-0 z-10 shadow-sm">
                <ClayButton onClick={() => setGameState('home')} className="w-10 h-10 flex items-center justify-center !rounded-full !p-0">
                    <ArrowLeft size={20} className="text-slate-500"/>
                </ClayButton>
                <div className="flex items-center gap-2 bg-pink-100 px-4 py-1.5 rounded-full border border-pink-200">
                    <PiggyBank className="text-pink-600 fill-pink-400" size={20} />
                    <span className="font-black text-pink-700 text-xl">{fmt(piggyBank)}đ</span>
                </div>
            </div>
            <div className="p-4 flex flex-col gap-4 overflow-y-auto pb-24 no-scrollbar">
                <div className="flex items-center justify-between px-2">
                    <h2 className="font-black text-slate-700 text-xl">Đổi tiền mặt</h2>
                    <ClayButton onClick={toggleAdmin} colorClass={adminMode ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'} className="h-9 px-3 text-xs font-black !rounded-full border border-slate-200">
                        <Shield size={14} /> {adminMode ? 'Đóng chế độ phụ huynh' : 'Chế độ phụ huynh'}
                    </ClayButton>
                </div>
                {!adminMode && SHOP_ITEMS.map(item => { 
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

                {!adminMode && redemptionRequests.length > 0 && (
                    <div className="mt-2 px-2">
                        <h3 className="font-bold text-slate-500 text-sm uppercase mb-4">Ví quà tặng của bé</h3>
                        <div className="space-y-3">
                            {redemptionRequests.slice().reverse().map((req) => {
                                const badge = STATUS_BADGE[req.status];
                                return (
                                    <div key={req.requestId} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <div>
                                            <div className="font-bold text-slate-700 text-sm">{req.name}</div>
                                            <div className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 ${badge.color}`}>
                                                <Clock size={10}/> {badge.label}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">{req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('vi-VN') : 'Chưa xác định'}</div>
                                        </div>
                                        <span className="font-black text-red-500 text-sm">-{fmt(req.value)}đ</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {adminMode && (
                    <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="text-green-500"/>
                            <h3 className="font-black text-slate-700 text-lg">Trung tâm duyệt quà</h3>
                        </div>
                        {adminMessage && <div className="text-sm font-bold text-green-600 bg-green-50 px-3 py-2 rounded-xl">{adminMessage}</div>}
                        {adminError && <div className="text-sm font-bold text-red-600 bg-red-50 px-3 py-2 rounded-xl">{adminError}</div>}
                        <section>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Yêu cầu đang chờ ({pendingRequests.length})</h4>
                            {pendingRequests.length === 0 && (
                                <div className="text-center text-slate-400 text-sm py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <CircleAlert className="mx-auto mb-2" size={20}/>
                                    Chưa có yêu cầu nào.
                                </div>
                            )}
                            <div className="space-y-3">
                                {pendingRequests.map(req => (
                                    <div key={req.requestId} className="p-3 border border-amber-100 rounded-2xl bg-amber-50 flex justify-between items-center">
                                        <div>
                                            <div className="font-black text-slate-700">{req.name}</div>
                                            <div className="text-xs text-slate-400 font-bold">Giá trị: {fmt(req.value)}đ</div>
                                            <div className="text-[10px] text-slate-400 mt-1">Gửi lúc {new Date(req.requestedAt).toLocaleString('vi-VN')}</div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <ClayButton onClick={() => handleDecision(req.requestId, 'approve')} colorClass="bg-green-500 text-white" className="px-3 py-1 text-xs font-black !rounded-xl flex items-center justify-center gap-1">
                                                <CheckCircle size={12}/> Duyệt
                                            </ClayButton>
                                            <ClayButton onClick={() => handleDecision(req.requestId, 'reject')} colorClass="bg-red-100 text-red-600" className="px-3 py-1 text-xs font-black !rounded-xl flex items-center justify-center gap-1">
                                                <XCircle size={12}/> Từ chối
                                            </ClayButton>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                        {historyRequests.length > 0 && (
                            <section>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Lịch sử xử lý</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {historyRequests.map(req => {
                                        const badge = STATUS_BADGE[req.status];
                                        return (
                                            <div key={req.requestId} className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                                                <div>
                                                    <div className="text-sm font-black text-slate-700">{req.name}</div>
                                                    <div className="text-[10px] text-slate-400">{new Date(req.approvedAt || req.rejectedAt).toLocaleDateString('vi-VN')}</div>
                                                </div>
                                                <div className={`text-[10px] font-black px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>

            {/* Confirm Approve Modal */}
            {confirmRequest && (
                <div className="fixed inset-0 z-[130] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl relative border-4 border-amber-200">
                        <button onClick={() => setConfirmRequest(null)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500">
                            <XCircle size={24} />
                        </button>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-600">
                                <AlertTriangle size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Xác nhận duyệt quà</h2>
                            <p className="text-sm font-bold text-slate-500">Bạn đã đưa tiền mặt cho bé chưa?</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-slate-600">Quà tặng:</span>
                                <span className="text-lg font-black text-slate-700">{confirmRequest.name}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-slate-600">Giá trị:</span>
                                <span className="text-xl font-black text-red-600">{fmt(confirmRequest.value)}đ</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-600">Yêu cầu lúc:</span>
                                <span className="text-xs font-bold text-slate-400">{new Date(confirmRequest.requestedAt).toLocaleString('vi-VN')}</span>
                            </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
                            <p className="text-xs font-bold text-amber-700 text-center">
                                ⚠️ Sau khi duyệt, {fmt(confirmRequest.value)}đ sẽ bị trừ khỏi ví tiết kiệm của bé. Hãy đảm bảo bạn đã đưa tiền mặt cho bé.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <ClayButton onClick={() => setConfirmRequest(null)} colorClass="bg-slate-100 text-slate-500" className="flex-1 h-12 font-black !rounded-xl">
                                Hủy
                            </ClayButton>
                            <ClayButton onClick={confirmApprove} colorClass="bg-green-500 text-white" className="flex-1 h-12 font-black !rounded-xl flex items-center justify-center gap-2">
                                <CheckCircle size={18}/> Đã đưa tiền, duyệt ngay
                            </ClayButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopScreen;
