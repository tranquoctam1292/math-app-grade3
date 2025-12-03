import React, { useState } from 'react';
import { X, Send, Bug, Lightbulb, MessageSquare, Loader, CheckCircle } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';
import { ClayButton } from '../lib/helpers';
import { getDeviceId } from '../lib/utils';

const FeedbackModal = ({ isOpen, onClose, appUser }) => {
    const [type, setType] = useState('bug'); // 'bug' | 'feature' | 'other'
    const [content, setContent] = useState('');
    const [contact, setContact] = useState(appUser?.email || '');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!content.trim()) return;
        setLoading(true);

        try {
            // Chuẩn bị dữ liệu
            const feedbackData = {
                type,
                content,
                contact,
                uid: appUser?.uid || 'anonymous',
                userName: appUser?.displayName || 'Unknown',
                deviceId: getDeviceId(),
                timestamp: Date.now(),
                userAgent: navigator.userAgent, // Lấy thông tin trình duyệt/thiết bị để debug
                version: '1.0.0-test' // Phiên bản app
            };

            // Lưu vào collection riêng biệt 'app_feedbacks'
            // Lưu ý: Không lưu vào 'math_user_data' để dễ quản lý
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'app_feedbacks'), feedbackData);

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setContent('');
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Lỗi gửi góp ý:", error);
            alert("Có lỗi xảy ra, vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animation-fade-in">
            <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden relative animate-shake border-4 border-white">
                
                {/* Header */}
                <div className="bg-indigo-50 p-4 flex justify-between items-center border-b border-indigo-100">
                    <h3 className="font-black text-indigo-700 flex items-center gap-2 text-lg">
                        <MessageSquare size={20}/> Góp Ý & Báo Lỗi
                    </h3>
                    <button onClick={onClose} className="p-1 bg-white rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-sm">
                        <X size={20}/>
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-8 text-green-600 animate-fade-in">
                            <CheckCircle size={64} className="mb-4"/>
                            <span className="font-black text-xl">Đã gửi thành công!</span>
                            <span className="text-sm font-bold opacity-70">Cảm ơn bạn đã đóng góp.</span>
                        </div>
                    ) : (
                        <>
                            {/* Type Selector */}
                            <div className="flex gap-2">
                                {[
                                    { id: 'bug', label: 'Báo Lỗi', icon: Bug, color: 'red' },
                                    { id: 'feature', label: 'Góp ý', icon: Lightbulb, color: 'yellow' }
                                ].map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setType(item.id)}
                                        className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-1 transition-all ${
                                            type === item.id 
                                            ? `bg-${item.color}-50 border-${item.color}-400 text-${item.color}-700 shadow-inner` 
                                            : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                                        }`}
                                    >
                                        <item.icon size={20}/> {item.label}
                                    </button>
                                ))}
                            </div>

                            {/* Text Area */}
                            <div>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={type === 'bug' ? "Mô tả lỗi bạn gặp phải..." : "Bạn muốn có thêm tính năng gì..."}
                                    className="w-full h-32 p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none font-bold text-slate-700 text-sm resize-none transition-all"
                                ></textarea>
                            </div>

                            {/* Contact Info */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Liên hệ (để tụi mình phản hồi)</label>
                                <input 
                                    type="text" 
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="Email hoặc SĐT..."
                                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white focus:border-indigo-500 outline-none font-bold text-slate-700 text-sm"
                                />
                            </div>

                            {/* Submit Button */}
                            <ClayButton 
                                onClick={handleSubmit} 
                                disabled={loading || !content.trim()}
                                colorClass="bg-indigo-600 text-white" 
                                className="w-full h-14 flex items-center justify-center gap-2 font-black text-lg !rounded-2xl mt-2"
                            >
                                {loading ? <Loader className="animate-spin"/> : <Send size={20}/>}
                                Gửi Ngay
                            </ClayButton>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;