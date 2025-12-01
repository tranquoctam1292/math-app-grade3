import React from 'react';
import { ArrowLeft, PiggyBank, Smile, Frown, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { ClayButton, MathText } from '../lib/helpers';
import { REWARD_PER_LEVEL } from '../lib/constants';
import { fmt } from '../lib/utils';

// Import các dạng bài tập mới
import QuizMCQ from './quiz_types/QuizMCQ';
import QuizFillBlank from './quiz_types/QuizFillBlank';
import QuizComparison from './quiz_types/QuizComparison';
import QuizSorting from './quiz_types/QuizSorting';
import QuizMatching from './quiz_types/QuizMatching';

const QuizScreen = ({ quizData, currentQIndex, setGameState, sessionScore, selectedOption, isSubmitted, handleSelectOption, handleNextQuestion }) => {
    const q = quizData[currentQIndex];
    const progress = ((currentQIndex + 1) / quizData.length) * 100;
    
    if (!q) return <div className="p-6 text-center">Đang tải...</div>;

    // Logic kiểm tra đúng sai để hiển thị Modal kết quả
    let isCorrect = false;
    if (isSubmitted) {
        if (q.type === 'sorting') {
            isCorrect = JSON.stringify(selectedOption) === JSON.stringify(q.correctOrder);
        } else if (q.type === 'matching') {
            isCorrect = selectedOption === true;
        } else if (q.type === 'fill_blank') {
            isCorrect = String(selectedOption).trim() === String(q.correctVal).trim();
        } else {
            // MCQ & Comparison
            isCorrect = String(selectedOption).trim() === String(q.correctVal).trim();
        }
    }

    const isLastQuestion = currentQIndex === quizData.length - 1;

    // Helper render body
    const renderQuizBody = () => {
        // Thêm prop key={currentQIndex} vào TẤT CẢ các component bên dưới
        switch (q.type) {
            case 'fill_blank':
                return <QuizFillBlank key={currentQIndex} question={q} onAnswer={handleSelectOption} isSubmitted={isSubmitted} userAnswer={selectedOption} />;
            case 'comparison':
                return <QuizComparison key={currentQIndex} question={q} onAnswer={handleSelectOption} isSubmitted={isSubmitted} userAnswer={selectedOption} />;
            case 'sorting':
                return <QuizSorting key={currentQIndex} question={q} onAnswer={handleSelectOption} isSubmitted={isSubmitted} />;
            case 'matching':
                return <QuizMatching key={currentQIndex} question={q} onAnswer={handleSelectOption} isSubmitted={isSubmitted} />;
            case 'mcq':
            default:
                return <QuizMCQ key={currentQIndex} question={q} onAnswer={handleSelectOption} isSubmitted={isSubmitted} userAnswer={selectedOption} />;
        }
    };

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
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wider">{q.type || 'MCQ'}</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Mức {q.level} (+{REWARD_PER_LEVEL[q.level] || 0}đ)</span>
                        </div>
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
            <div className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar flex flex-col">
                {/* Question Box (Chỉ hiện text ở đây nếu ko phải FillBlank - vì FillBlank đã tích hợp text bên trong) */}
                {q.type !== 'fill_blank' && (
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6 shrink-0">
                        <div className="text-lg sm:text-xl text-slate-800 font-bold leading-relaxed text-center">
                            <MathText text={q.text} />
                        </div>
                        {/* SVG Support */}
                        {q.svgContent && (
                            <div className="mt-4 flex justify-center animation-fade-in">
                                <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-inner">
                                    <svg width="100%" height="auto" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" className="max-w-[280px] h-auto mx-auto" dangerouslySetInnerHTML={{ __html: q.svgContent }} style={{ minHeight: '120px' }} />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Render Dynamic Component */}
                <div className="flex-1">
                    {renderQuizBody()}
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
                                        {q.type === 'sorting' 
                                            ? q.correctOrder.join(' → ') 
                                            : q.type === 'matching' 
                                                ? 'Xem giải thích bên dưới'
                                                : (q.correctOption || q.correctVal)
                                        }
                                    </div>
                                </div>
                            )}
                            
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-600 text-sm leading-relaxed font-medium max-h-40 overflow-y-auto">
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