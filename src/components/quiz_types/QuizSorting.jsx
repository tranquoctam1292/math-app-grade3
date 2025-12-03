import React, { useState } from 'react';
import { ClayButton } from '../../lib/helpers';
import { Undo2, Send } from 'lucide-react';

const QuizSorting = ({ question, onAnswer, isSubmitted }) => {
    const [ordered, setOrdered] = useState([]);

    // ✅ FIX: Logic khởi tạo thông minh hơn (Safety Init)
    const [available, setAvailable] = useState(() => {
        // Ưu tiên 1: Lấy từ items do API trả về
        if (question.items && question.items.length > 0) {
            return [...question.items].sort(() => Math.random() - 0.5);
        }
        // Ưu tiên 2 (Fallback): Nếu AI quên items, lấy từ correctOrder
        if (question.correctOrder && Array.isArray(question.correctOrder)) {
            return [...question.correctOrder].sort(() => Math.random() - 0.5);
        }
        // Fallback cuối: Trả về rỗng (nhưng hiếm khi xảy ra nếu đã qua xử lý ở useQuizRunner)
        return [];
    });

    const handlePick = (item) => {
        setOrdered([...ordered, item]);
        setAvailable(available.filter(i => i !== item));
    };

    const handleReset = () => {
        setOrdered([]);
        
        // ✅ FIX: Logic Reset cũng phải áp dụng Fallback tương tự
        let sourceList = [];
        if (question.items && question.items.length > 0) {
            sourceList = question.items;
        } else if (question.correctOrder) {
            sourceList = question.correctOrder;
        }
        
        setAvailable([...sourceList].sort(() => Math.random() - 0.5)); 
    };

    const handleSubmit = () => {
        onAnswer(ordered);
    };

    return (
        <div className="flex flex-col h-full">
            <p className="text-center text-sm font-bold text-slate-400 mb-2 italic">
                Chạm vào các ô bên dưới theo đúng thứ tự
            </p>

            {/* Drop Zone */}
            <div className="min-h-[100px] bg-slate-100 rounded-3xl border-2 border-dashed border-indigo-200 p-4 mb-6 flex flex-wrap gap-2 justify-center items-center content-center transition-all">
                {ordered.length === 0 && <span className="text-slate-300 font-bold text-sm">Kết quả sẽ hiện ở đây</span>}
                {ordered.map((item, idx) => (
                    <div key={idx} className="bg-indigo-500 text-white font-black px-4 py-2 rounded-xl shadow-lg animate-fade-in border-b-4 border-indigo-700">
                        {item}
                    </div>
                ))}
            </div>

            {/* Source Zone */}
            {!isSubmitted ? (
                <>
                    <div className="flex flex-wrap gap-3 justify-center mb-8">
                        {available.map((item, idx) => (
                            <ClayButton key={idx} onClick={() => handlePick(item)} className="px-5 py-3 bg-white text-slate-700 font-black text-xl border-slate-200 hover:-translate-y-1">
                                {item}
                            </ClayButton>
                        ))}
                        {available.length === 0 && ordered.length === 0 && (
                            <div className="text-red-400 font-bold text-sm bg-red-50 p-2 rounded-lg border border-red-100">
                                ⚠️ Lỗi dữ liệu câu hỏi. Vui lòng bỏ qua câu này.
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 mt-auto">
                        <ClayButton onClick={handleReset} disabled={ordered.length === 0} className="w-14 h-14 flex items-center justify-center bg-slate-200 text-slate-600 border-slate-300 rounded-full">
                            <Undo2 size={24}/>
                        </ClayButton>
                        <ClayButton 
                            onClick={handleSubmit} 
                            disabled={available.length > 0} 
                            colorClass={available.length === 0 ? "bg-green-500 text-white" : "bg-slate-300 text-white"}
                            className="flex-1 h-14 font-black text-lg flex items-center justify-center gap-2"
                        >
                            Kiểm Tra <Send size={18}/>
                        </ClayButton>
                    </div>
                </>
            ) : (
                <div className="text-center font-bold text-slate-500">
                    Đã sắp xếp xong!
                </div>
            )}
        </div>
    );
};

export default QuizSorting;