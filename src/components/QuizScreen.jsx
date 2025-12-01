import React from 'react';
import { ArrowLeft, CheckCircle, XCircle, PiggyBank, Smile, Frown, ArrowRight, RotateCcw } from 'lucide-react';
import { ClayButton, MathText } from '../lib/helpers';
import { REWARD_PER_LEVEL } from '../lib/constants';
import { fmt } from '../lib/utils';

const QuizScreen = ({ quizData, currentQIndex, setGameState, sessionScore, selectedOption, isSubmitted, handleSelectOption, handleNextQuestion }) => {
    const q = quizData[currentQIndex];
    const progress = ((currentQIndex + 1) / quizData.length) * 100;
    
    if (!q) return <div className="p-6 text-center">Đang tải...</div>;

    const isCorrect = selectedOption === q.correctOption;
    const isLastQuestion = currentQIndex === quizData.length - 1;

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
            {/* --- HEADER STICKY --- */}
            <div className="px-4 pt-6 pb-2 bg-white sticky top-0 z-10 shadow-sm shrink-0">
                <div className="flex justify-between items-center mb-2">
                    <ClayButton onClick={() => setGameState('home')} className="w-10 h-10 flex items-center justify-center !rounded-full !p-0">
                        <ArrowLeft size={20} className="text-slate-500"/>
                    </ClayButton>
                    <div className="flex flex-col items-center">
                        <span className="font-black text-slate-700 text-lg">Câu {currentQIndex + 1}/{quizData.length}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Mức {q.level} (+{REWARD_PER_LEVEL[q.level] || 0}đ)</span>
                    </div>
                    <div className="flex items-center gap-1 bg-pink-100 px-2 py-1 rounded-lg text-pink-700 font-bold text-xs">
                        <PiggyBank size={14}/> +{fmt(sessionScore)}đ
                    </div>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 transition-all duration-500" style={{width: `${progress}%`}}></div>
                </div>
            </div>

            {/* --- SCROLLABLE CONTENT --- */}
            <div className="flex-1 overflow-y-auto p-4 pb-10 no-scrollbar">
                {/* Question Box */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
                    <div className="text-lg sm:text-xl text-slate-800 font-bold leading-relaxed text-center">
                        <MathText text={q.text} />
                    </div>
                    
                    {/* --- SVG VISUALS --- */}
                    {q.svgContent && (
                        <div className="mt-4 flex justify-center animation-fade-in">
                            <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-inner">
                                <svg 
                                    width="100%" 
                                    height="auto" 
                                    viewBox="0 0 300 200" 
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="max-w-[280px] h-auto mx-auto"
                                    dangerouslySetInnerHTML={{ __html: q.svgContent }}
                                    style={{ minHeight: '120px' }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Options List */}
                <div className="space-y-3">
                    {q.options.map((opt, idx) => {
                        const label = ['A', 'B', 'C', 'D'][idx];
                        let stateClass = "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"; 
                        let icon = <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-2 bg-white border-current`}>{label}</div>;

                        if (isSubmitted) {
                            if (label === q.correctOption) {
                                // ĐÁP ÁN ĐÚNG
                                stateClass = "bg-green-100 border-green-600 text-green-800 ring-4 ring-green-200 scale-[1.02] shadow-xl";
                                icon = <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm bg-green-600 text-white border-green-700"><CheckCircle size={18}/></div>;
                            } else if (selectedOption === label) {
                                // ĐÁP ÁN SAI (ĐÃ CHỌN)
                                stateClass = "bg-red-100 border-red-600 text-red-800 ring-4 ring-red-200 animate-shake opacity-60";
                                icon = <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm bg-red-600 text-white border-red-700"><XCircle size={18}/></div>;
                            } else {
                                // CÁC ĐÁP ÁN KHÁC (Làm mờ đi để tập trung)
                                stateClass = "bg-slate-50 border-slate-100 text-slate-300 opacity-40 grayscale";
                            }
                        } else if (selectedOption === label) {
                            // ĐANG CHỌN (CHƯA SUBMIT - Thực tế logic này ít chạy vì chọn là submit luôn)
                            stateClass = "bg-blue-50 border-blue-500 text-blue-700";
                        }

                        return (
                            <ClayButton 
                                key={idx} 
                                onClick={() => handleSelectOption(label)} 
                                disabled={isSubmitted} 
                                className={`w-full min-h-[72px] flex items-center px-4 gap-4 ${stateClass} border-2 transition-all duration-200`}
                            >
                                {icon}
                                <span className="text-xl font-bold flex-1 text-left"><MathText text={opt} /></span>
                            </ClayButton>
                        )
                    })}
                </div>
            </div>

            {/* --- RESULT MODAL (POPUP) --- */}
            {isSubmitted && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animation-fade-in">
                    <div className={`w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-shake border-4 ${isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                        {/* Modal Header */}
                        <div className={`p-6 text-center ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 shadow-sm border-4 border-white ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                {isCorrect ? <Smile size={48} /> : <Frown size={48} />}
                            </div>
                            <h2 className={`text-2xl font-black uppercase ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                {isCorrect ? "Hoan hô!" : "Tiếc quá!"}
                            </h2>
                            <p className="font-bold text-slate-600 text-sm mt-1">
                                {isCorrect ? "Bé giỏi quá đi thôi!" : "Không sao, thử lại lần sau nhé."}
                            </p>
                        </div>

                        {/* Modal Body: Explanation */}
                        <div className="p-6 bg-white">
                            {!isCorrect && (
                                <div className="mb-4 text-center">
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Đáp án đúng là</div>
                                    <div className="text-xl font-black text-green-600 bg-green-50 py-2 rounded-xl border border-green-100">
                                        {q.correctOption}
                                    </div>
                                </div>
                            )}
                            
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-600 text-sm leading-relaxed font-medium">
                                <span className="font-bold text-indigo-500 block mb-1">💡 Giải thích:</span>
                                <MathText text={q.explanation} />
                            </div>

                            {/* Action Button */}
                            <div className="mt-6">
                                <ClayButton 
                                    onClick={handleNextQuestion} 
                                    colorClass={isCorrect ? "bg-green-500 text-white" : "bg-indigo-500 text-white"} 
                                    className="w-full h-14 font-black text-xl flex items-center justify-center gap-2 !rounded-xl shadow-lg"
                                >
                                    {isLastQuestion ? 'Xem Kết Quả' : 'Câu Tiếp Theo'} <ArrowRight />
                                </ClayButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizScreen;