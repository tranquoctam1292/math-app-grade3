import React from 'react';
import { ArrowLeft, PiggyBank, Smile, Frown, ArrowRight } from 'lucide-react';
import { ClayButton, MathText } from '../lib/helpers';
import { REWARD_PER_LEVEL } from '../lib/constants';
// ✅ CẬP NHẬT IMPORT: Thêm normalizeVal
import { fmt, normalizeVal } from '../lib/utils';
import parse from 'html-react-parser';

// Import các dạng bài tập mới
import QuizMCQ from './quiz_types/QuizMCQ';
import QuizFillBlank from './quiz_types/QuizFillBlank';
import QuizComparison from './quiz_types/QuizComparison';
import QuizSorting from './quiz_types/QuizSorting';
import QuizMatching from './quiz_types/QuizMatching';

const ALLOWED_SVG_TAGS = new Set(['rect', 'circle', 'path', 'line', 'polygon', 'polyline', 'text']);
const ALLOWED_ATTRS = new Set([
    'x', 'y', 'x1', 'y1', 'x2', 'y2',
    'cx', 'cy', 'r',
    'width', 'height', 'rx', 'ry',
    'points', 'd',
    'stroke', 'stroke-width', 'strokeLinecap', 'strokeLinejoin', 'strokeDasharray',
    'fill', 'opacity',
    'font-size', 'fontWeight', 'text-anchor',
    'transform'
]);

const renderSafeSvgContent = (svgContent) => {
    if (!svgContent || typeof svgContent !== 'string') return null;

    return parse(svgContent, {
        replace: (domNode) => {
            if (domNode.type === 'text') {
                return domNode.data;
            }
            if (domNode.type !== 'tag') return null;

            const tag = domNode.name.toLowerCase();
            if (!ALLOWED_SVG_TAGS.has(tag)) return null;

            const safeProps = {};
            const attribs = domNode.attribs || {};

            Object.keys(attribs).forEach((key) => {
                const lowerKey = key.toLowerCase();
                // Loại bỏ mọi on* handler, href, xlink, style inline
                if (lowerKey.startsWith('on')) return;
                if (lowerKey === 'href' || lowerKey === 'xlink:href') return;
                if (lowerKey === 'style') return;
                if (!ALLOWED_ATTRS.has(lowerKey)) return;
                safeProps[lowerKey] = attribs[key];
            });

            return React.createElement(tag, safeProps, domNode.children?.map((child) => (
                // Gọi lại parser trên children để áp dụng cùng logic
                renderSafeSvgContent(parse(child.data || '', {})) || null
            )));
        }
    });
};

const buildGeometrySvg = (question) => {
    if (question.topic !== 'geometry') return question.svgContent || null;
    if (question.svgContent && question.svgContent.trim().length > 0) return question.svgContent;
    const text = String(question.text || '').toLowerCase();
    const nums = (question.text || '').match(/\d+/g)?.map(Number) || [];
    if (text.includes('tam giác')) {
        return `<polygon points="60,150 150,40 240,150" stroke="#4F46E5" stroke-width="4" fill="#E0E7FF" />
        <line x1="150" y1="40" x2="150" y2="150" stroke="#F97316" stroke-dasharray="6,4" stroke-width="2" />
        <text x="150" y="30" text-anchor="middle" font-size="14" fill="#374151" font-weight="bold">Tam giác</text>`;
    }
    const width = Math.min(220, (nums[0] || 10) * 10);
    const height = Math.min(120, (nums[1] || nums[0] || 5) * 8);
    return `<rect x="${(300 - width) / 2}" y="${(200 - height) / 2}" width="${width}" height="${height}" rx="12" stroke="#4F46E5" stroke-width="4" fill="#E0E7FF" />
        <text x="150" y="${(200 - height) / 2 - 10}" text-anchor="middle" font-size="14" fill="#374151" font-weight="bold">${nums[0] || 10} cm</text>
        <text x="${(300 + width) / 2 + 10}" y="110" font-size="14" fill="#374151" font-weight="bold" transform="rotate(-90 ${(300 + width) / 2 + 10},110)">${nums[1] || nums[0] || 5} cm</text>`;
};

const QuizScreen = ({ quizData, currentQIndex, setGameState, sessionScore, selectedOption, isSubmitted, handleSelectOption, handleNextQuestion }) => {
    const q = quizData[currentQIndex];
    const geometrySvg = buildGeometrySvg(q);
    const progress = ((currentQIndex + 1) / quizData.length) * 100;
    
    if (!q) return <div className="p-6 text-center">Đang tải...</div>;

    // ✅ SỬA ĐỔI: Logic kiểm tra đúng sai nhất quán với MathApp.js
    let isCorrect = false;
    if (isSubmitted) {
        if (q.type === 'sorting') {
            // Sorting: selectedOption đang là JSON string (do MathApp convert) -> Parse lại để so sánh
            let userArr = [];
            try { 
                // Nếu selectedOption là string thì parse, nếu là array sẵn thì giữ nguyên
                userArr = typeof selectedOption === 'string' ? JSON.parse(selectedOption) : selectedOption;
            } catch (e) {
                console.warn("Lỗi parse selectedOption:", e);
            }
            
            const correctArr = q.correctOrder || [];
            
            // So sánh từng phần tử bằng normalizeVal
            isCorrect = Array.isArray(userArr) && 
                        userArr.length === correctArr.length && 
                        userArr.every((val, i) => normalizeVal(val) === normalizeVal(correctArr[i]));

        } else if (q.type === 'matching') {
            // Matching: Đúng khi giá trị là true hoặc chuỗi "true"
            isCorrect = selectedOption === true || String(selectedOption) === "true";

        } else {
            // MCQ & Comparison & FillBlank
            // So sánh lỏng bằng normalizeVal
            isCorrect = normalizeVal(selectedOption) === normalizeVal(q.correctVal);
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
                        {geometrySvg && (
                            <div className="mt-4 flex justify-center animation-fade-in">
                                <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-inner">
                                    {/* FIX: Bỏ height="auto" */}
                                    <svg 
                                        width="100%" 
                                        viewBox="0 0 300 200" 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        className="max-w-[280px] h-auto mx-auto" 
                                        style={{ minHeight: '120px' }} 
                                    >
                                        {renderSafeSvgContent(geometrySvg)}
                                    </svg>
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
                                            ? (Array.isArray(q.correctOrder) ? q.correctOrder.join(' → ') : q.correctOrder)
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