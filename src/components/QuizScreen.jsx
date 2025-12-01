import React from 'react';
import { ArrowLeft, CheckCircle, XCircle, PiggyBank, Smile, Frown, ArrowRight } from 'lucide-react';
import { ClayButton, MathText } from '../lib/helpers';
import { REWARD_PER_LEVEL } from '../lib/constants';
import { fmt } from '../lib/utils';

const QuizScreen = ({ quizData, currentQIndex, setGameState, sessionScore, selectedOption, isSubmitted, handleSelectOption, handleNextQuestion }) => {
    const q = quizData[currentQIndex];
    const progress = ((currentQIndex + 1) / quizData.length) * 100;
    
    if (!q) return <div className="p-6 text-center">Đang tải...</div>;

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
            {/* --- HEADER STICKY --- */}
            <div className="px-4 pt-6 pb-2 bg-white sticky top-0 z-10 shadow-sm">
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
            <div className="flex-1 overflow-y-auto p-4 pb-32 no-scrollbar">
                {/* Question Box */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
                    <div className="text-lg sm:text-xl text-slate-800 font-bold leading-relaxed mb-4">
                        <MathText text={q.text} />
                    </div>
                    
                    {/* --- SVG VISUALS (NEW) --- */}
                    {q.svgContent && (
                        <div className="mb-4 flex justify-center animation-fade-in">
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
                                stateClass = "bg-green-100 border-green-600 text-green-800 ring-4 ring-green-200 scale-[1.02] shadow-xl";
                                icon = <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm bg-green-600 text-white border-green-700"><CheckCircle size={18}/></div>;
                            } else if (selectedOption === label) {
                                stateClass = "bg-red-100 border-red-600 text-red-800 ring-4 ring-red-200 animate-shake";
                                icon = <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm bg-red-600 text-white border-red-700"><XCircle size={18}/></div>;
                            } else {
                                stateClass = "bg-slate-50 border-slate-100 text-slate-300 opacity-40 grayscale";
                            }
                        } else if (selectedOption === label) {
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
                                {isSubmitted && label === q.correctOption && <div className="text-green-700 font-black text-sm bg-white px-2 py-1 rounded-lg border border-green-300">+{REWARD_PER_LEVEL[q.level]}đ</div>}
                            </ClayButton>
                        )
                    })}
                </div>

                {/* Feedback Section */}
                {isSubmitted && (
                    <div className={`mt-6 p-4 rounded-2xl border-l-4 animation-fade-in ${selectedOption === q.correctOption ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                        <h3 className={`font-black text-lg mb-1 flex items-center gap-2 ${selectedOption === q.correctOption ? 'text-green-700' : 'text-red-700'}`}>
                            {selectedOption === q.correctOption ? <><Smile className="text-green-600"/> Chính xác! Xuất sắc!</> : <><Frown className="text-red-600"/> Chưa đúng rồi!</>}
                        </h3>
                        {selectedOption !== q.correctOption && (
                            <div className="text-sm font-bold text-slate-500 mb-2">Đáp án đúng là <span className="text-green-700 bg-green-100 px-2 rounded-md border border-green-200 mx-1">{q.correctOption}</span> nhé!</div>
                        )}
                        <div className="bg-white/60 p-3 rounded-xl mt-2 text-slate-700 text-sm leading-relaxed font-medium border border-slate-100">
                            <strong>Giải thích:</strong> <MathText text={q.explanation} />
                        </div>
                    </div>
                )}
            </div>

            {/* --- BOTTOM BAR FIXED --- */}
            <div className="flex-none p-4 pb-10 bg-white border-t border-slate-100 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                <ClayButton onClick={handleNextQuestion} disabled={!isSubmitted} colorClass={isSubmitted ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-400"} className="w-full h-14 font-black text-xl flex items-center justify-center gap-2">
                    {(currentQIndex < quizData.length - 1) ? 'Câu Tiếp Theo' : 'Hoàn Thành'} <ArrowRight/>
                </ClayButton>
            </div>
        </div>
    );
};

export default QuizScreen;