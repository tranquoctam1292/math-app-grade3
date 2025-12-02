import { DIFFICULTY_MIX } from './constants';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const chooseLevel = (difficulty = 'medium') => {
    const mix = DIFFICULTY_MIX[difficulty] || DIFFICULTY_MIX.medium;
    const pool = Object.entries(mix).flatMap(([level, count]) => Array(count).fill(Number(level)));
    return pool[randomInt(0, pool.length - 1)];
};

const topicFallbacks = ['arithmetic', 'expressions', 'finding_x', 'money_units', 'geometry'];

const pickTopic = (selectedTopics = []) => {
    const viable = selectedTopics.filter(t => topicFallbacks.includes(t));
    const pool = viable.length > 0 ? viable : topicFallbacks;
    return pool[randomInt(0, pool.length - 1)];
};

const buildOptions = (correctVal) => {
    const answers = new Set([correctVal]);
    while (answers.size < 4) {
        const jitter = randomInt(-20, 20);
        const candidate = Math.max(0, correctVal + jitter);
        if (!answers.has(candidate)) answers.add(candidate);
    }
    return Array.from(answers).sort(() => Math.random() - 0.5).map(num => String(num));
};

const createArithmeticQuestion = (level, topic) => {
    const operations = [
        { label: '+', generator: () => {
            const a = randomInt(50, 999);
            const b = randomInt(10, 400);
            return {
                text: `Bé tính giúp: ${a} + ${b} = ?`,
                answer: a + b,
                explanation: `${a} + ${b} = ${a + b}`
            };
        }},
        { label: '-', generator: () => {
            const a = randomInt(200, 999);
            const b = randomInt(10, a - 20);
            return {
                text: `Siêu nhân A trừ đi ${b} khỏi ${a}. Kết quả là bao nhiêu?`,
                answer: a - b,
                explanation: `${a} - ${b} = ${a - b}`
            };
        }},
        { label: '×', generator: () => {
            const a = randomInt(2, 20);
            const b = randomInt(2, 15);
            return {
                text: `Robot nhân ${a} với ${b} để sạc pin. Bé cho biết kết quả nhé!`,
                answer: a * b,
                explanation: `${a} × ${b} = ${a * b}`
            };
        }}
    ];
    const seed = operations[randomInt(0, operations.length - 1)].generator();
    return {
        type: 'mcq',
        topic,
        level,
        text: seed.text,
        correctVal: String(seed.answer),
        options: buildOptions(seed.answer),
        explanation: seed.explanation
    };
};

const createFillBlankQuestion = (level, topic) => {
    const total = randomInt(120, 600);
    const addend = randomInt(20, total - 40);
    const missing = total - addend;
    return {
        type: 'fill_blank',
        topic,
        level,
        text: `Điền số còn thiếu: ${addend} + __ = ${total}`,
        correctVal: String(missing),
        explanation: `Muốn tìm số hạng chưa biết, lấy ${total} - ${addend} = ${missing}.`
    };
};

const createComparisonQuestion = (level, topic) => {
    const left = randomInt(50, 999);
    const right = randomInt(50, 999);
    const expression = `${left} ... ${right}`;
    const symbol = left > right ? '>' : left < right ? '<' : '=';
    return {
        type: 'comparison',
        topic,
        level,
        text: `Điền dấu thích hợp: ${expression}`,
        options: ['>', '<', '='],
        correctVal: symbol,
        explanation: `${left} ${symbol} ${right}`
    };
};

const createFindingXQuestion = (level) => {
    const patterns = [
        {
            generator: () => {
                const a = randomInt(10, 200);
                const x = randomInt(5, 100);
                const b = a + x;
                return {
                    text: `Tìm x, biết: ${a} + x = ${b}`,
                    answer: x,
                    explanation: `Muốn tìm số hạng chưa biết, ta lấy tổng trừ đi số hạng đã biết: ${b} - ${a} = ${x}.`
                };
            }
        },
        {
            generator: () => {
                const x = randomInt(50, 500);
                const a = randomInt(10, x - 20);
                const b = x - a;
                return {
                    text: `Tìm x, biết: x - ${a} = ${b}`,
                    answer: x,
                    explanation: `Muốn tìm số bị trừ, ta lấy hiệu cộng với số trừ: ${b} + ${a} = ${x}.`
                };
            }
        },
        {
            generator: () => {
                const a = randomInt(200, 800);
                const x = randomInt(10, a - 50);
                const b = a - x;
                return {
                    text: `Tìm x, biết: ${a} - x = ${b}`,
                    answer: x,
                    explanation: `Muốn tìm số trừ, ta lấy số bị trừ trừ đi hiệu: ${a} - ${b} = ${x}.`
                };
            }
        },
        {
            generator: () => {
                const x = randomInt(5, 20);
                const a = randomInt(2, 12);
                const b = x * a;
                return {
                    text: `Tìm x, biết: x × ${a} = ${b}`,
                    answer: x,
                    explanation: `Muốn tìm thừa số chưa biết, ta lấy tích chia cho thừa số đã biết: ${b} : ${a} = ${x}.`
                };
            }
        }
    ];
    const seed = patterns[randomInt(0, patterns.length - 1)].generator();
    return {
        type: 'mcq',
        topic: 'finding_x',
        level,
        text: seed.text,
        correctVal: String(seed.answer),
        options: buildOptions(seed.answer),
        explanation: seed.explanation
    };
};

const createGeometryQuestion = (level) => {
    const shapes = [
        {
            generator: () => {
                const length = randomInt(5, 15);
                const width = randomInt(3, 10);
                const perimeter = 2 * (length + width);
                const area = length * width;
                const isPerimeter = Math.random() > 0.5;
                return {
                    text: isPerimeter
                        ? `Một hình chữ nhật có chiều dài ${length}cm, chiều rộng ${width}cm. Chu vi hình chữ nhật đó là bao nhiêu cm?`
                        : `Một hình chữ nhật có chiều dài ${length}cm, chiều rộng ${width}cm. Diện tích hình chữ nhật đó là bao nhiêu cm²?`,
                    answer: isPerimeter ? perimeter : area,
                    explanation: isPerimeter
                        ? `Chu vi hình chữ nhật = (Dài + Rộng) × 2 = (${length} + ${width}) × 2 = ${perimeter}cm.`
                        : `Diện tích hình chữ nhật = Dài × Rộng = ${length} × ${width} = ${area}cm².`,
                    svgContent: `<rect x="${(300 - length * 10) / 2}" y="${(200 - width * 10) / 2}" width="${length * 10}" height="${width * 10}" stroke="#4F46E5" stroke-width="3" fill="#E0E7FF" /><text x="150" y="${(200 - width * 10) / 2 - 10}" text-anchor="middle" font-size="14" fill="#374151" font-weight="bold">${length} cm</text><text x="${(300 + length * 10) / 2 + 10}" y="110" font-size="14" fill="#374151" font-weight="bold" transform="rotate(-90 ${(300 + length * 10) / 2 + 10},110)">${width} cm</text>`
                };
            }
        },
        {
            generator: () => {
                const side = randomInt(4, 12);
                const perimeter = side * 4;
                const area = side * side;
                const isPerimeter = Math.random() > 0.5;
                return {
                    text: isPerimeter
                        ? `Một hình vuông có cạnh ${side}cm. Chu vi hình vuông đó là bao nhiêu cm?`
                        : `Một hình vuông có cạnh ${side}cm. Diện tích hình vuông đó là bao nhiêu cm²?`,
                    answer: isPerimeter ? perimeter : area,
                    explanation: isPerimeter
                        ? `Chu vi hình vuông = Cạnh × 4 = ${side} × 4 = ${perimeter}cm.`
                        : `Diện tích hình vuông = Cạnh × Cạnh = ${side} × ${side} = ${area}cm².`,
                    svgContent: `<rect x="${(300 - side * 10) / 2}" y="${(200 - side * 10) / 2}" width="${side * 10}" height="${side * 10}" stroke="#4F46E5" stroke-width="3" fill="#E0E7FF" /><text x="150" y="${(200 - side * 10) / 2 - 10}" text-anchor="middle" font-size="14" fill="#374151" font-weight="bold">${side} cm</text>`
                };
            }
        }
    ];
    const seed = shapes[randomInt(0, shapes.length - 1)].generator();
    return {
        type: 'mcq',
        topic: 'geometry',
        level,
        text: seed.text,
        correctVal: String(seed.answer),
        options: buildOptions(seed.answer),
        explanation: seed.explanation,
        svgContent: seed.svgContent
    };
};

export const buildOfflineQuiz = (config = {}) => {
    const questions = [];
    const selectedTopics = config.selectedTopics || [];
    const hasGeometry = selectedTopics.includes('geometry') || selectedTopics.length === 0;
    const hasFindingX = selectedTopics.includes('finding_x') || selectedTopics.length === 0;
    
    for (let i = 0; i < 10; i++) {
        const level = chooseLevel(config.difficultyMode);
        const topic = pickTopic(selectedTopics);
        let question;
        
        const pattern = i % 5;
        if (pattern === 0) {
            question = createArithmeticQuestion(level, topic);
        } else if (pattern === 1) {
            question = createFillBlankQuestion(level, topic);
        } else if (pattern === 2) {
            question = createComparisonQuestion(level, topic);
        } else if (pattern === 3 && hasFindingX) {
            question = createFindingXQuestion(level);
        } else if (pattern === 4 && hasGeometry) {
            question = createGeometryQuestion(level);
        } else {
            question = createArithmeticQuestion(level, topic);
        }
        
        question.id = i;
        questions.push(question);
    }
    return questions;
};

