import { DIFFICULTY_MIX } from './constants';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const chooseLevel = (difficulty = 'medium') => {
    const mix = DIFFICULTY_MIX[difficulty] || DIFFICULTY_MIX.medium;
    const pool = Object.entries(mix).flatMap(([level, count]) => Array(count).fill(Number(level)));
    return pool[randomInt(0, pool.length - 1)];
};

// ✅ Helper functions để điều chỉnh độ khó theo level (dựa trên SGK Toán lớp 3 HK1)
const getNumberRange = (level) => {
    switch (level) {
        case 1: return { min: 1, max: 100 };      // Level 1: 1-100
        case 2: return { min: 100, max: 1000 };    // Level 2: 100-1000
        case 3: return { min: 500, max: 1000 };    // Level 3: 500-1000
        case 4: return { min: 800, max: 1000 };    // Level 4: 800-1000
        default: return { min: 100, max: 1000 };
    }
};

const getMultiplicationTables = (level) => {
    switch (level) {
        case 1: return [2, 5];           // Level 1: Bảng nhân 2, 5
        case 2: return [3, 4, 6];        // Level 2: Bảng nhân 3, 4, 6
        case 3: return [7, 8, 9];        // Level 3: Bảng nhân 7, 8, 9
        case 4: return [7, 8, 9];        // Level 4: Bảng nhân 7, 8, 9 (phức tạp)
        default: return [2, 3, 4, 5, 6];
    }
};

const getRoundNumber = (level, type = 'tens') => {
    // type: 'tens' (tròn chục), 'hundreds' (tròn trăm)
    if (level === 1) {
        return type === 'tens' ? [10, 20, 30, 40, 50, 60, 70, 80, 90][randomInt(0, 8)] : 100;
    } else if (level === 2) {
        if (type === 'tens') {
            return [10, 20, 30, 40, 50, 60, 70, 80, 90][randomInt(0, 8)];
        } else {
            return [100, 200, 300, 400, 500, 600, 700, 800, 900][randomInt(0, 8)];
        }
    } else {
        // Level 3-4: Số lớn hơn
        return type === 'tens' ? randomInt(10, 90) * 10 : randomInt(1, 9) * 100;
    }
};

const topicFallbacks = ['arithmetic', 'expressions', 'finding_x', 'money_units', 'geometry'];

const pickTopic = (selectedTopics = []) => {
    const viable = selectedTopics.filter(t => topicFallbacks.includes(t));
    const pool = viable.length > 0 ? viable : topicFallbacks;
    return pool[randomInt(0, pool.length - 1)];
};

const buildOptions = (correctVal, level = 2, seedData = null) => {
    // ✅ Xử lý đặc biệt cho chia có dư
    if (seedData && seedData.answerQuotient !== undefined && seedData.answerRemainder !== undefined) {
        const answers = new Set([correctVal]); // correctVal là "7 dư 5"
        const quotient = seedData.answerQuotient;
        const remainder = seedData.answerRemainder;
        const divisor = seedData.divisor;
        
        // Tạo các phương án sai:
        // 1. Thương đúng, số dư sai
        // 2. Thương sai, số dư đúng
        // 3. Cả hai đều sai
        while (answers.size < 4) {
            let wrongQuotient, wrongRemainder;
            
            if (Math.random() > 0.5) {
                // Thương đúng, số dư sai (nhưng phải < divisor)
                wrongQuotient = quotient;
                wrongRemainder = randomInt(1, divisor - 1);
                if (wrongRemainder === remainder) {
                    wrongRemainder = wrongRemainder === divisor - 1 ? wrongRemainder - 1 : wrongRemainder + 1;
                }
            } else {
                // Thương sai, số dư có thể đúng hoặc sai
                const jitter = randomInt(-2, 2);
                wrongQuotient = Math.max(1, quotient + jitter);
                if (wrongQuotient === quotient) {
                    wrongQuotient = quotient + 1;
                }
                wrongRemainder = Math.random() > 0.5 ? remainder : randomInt(1, divisor - 1);
            }
            
            const candidate = `${wrongQuotient} dư ${wrongRemainder}`;
            if (!answers.has(candidate)) answers.add(candidate);
        }
        return Array.from(answers).sort(() => Math.random() - 0.5);
    }
    
    // ✅ Xử lý bình thường cho các câu hỏi khác
    const answers = new Set([correctVal]);
    const numVal = Number(correctVal);
    
    // ✅ Điều chỉnh jitter dựa trên level
    let jitterRange;
    if (level === 1) {
        jitterRange = 10; // Level 1: Sai số nhỏ
    } else if (level === 2) {
        jitterRange = 20; // Level 2: Sai số trung bình
    } else if (level === 3) {
        jitterRange = 30; // Level 3: Sai số lớn hơn
    } else {
        jitterRange = 50; // Level 4: Sai số lớn nhất
    }
    
    while (answers.size < 4) {
        const jitter = randomInt(-jitterRange, jitterRange);
        const candidate = Math.max(0, numVal + jitter);
        if (!answers.has(candidate) && candidate !== numVal) answers.add(candidate);
    }
    return Array.from(answers).sort(() => Math.random() - 0.5).map(num => String(num));
};

const createArithmeticQuestion = (level, topic) => {
    const range = getNumberRange(level);
    const multTables = getMultiplicationTables(level);
    
    const operations = [];
    
    // ✅ Cộng/Trừ: Điều chỉnh theo level
    if (level <= 2) {
        // Level 1-2: Cộng/trừ đơn giản hoặc có nhớ
        operations.push({
            label: '+', generator: () => {
                const a = randomInt(range.min, Math.min(range.max, level === 1 ? 100 : 500));
                const b = randomInt(10, Math.min(a, level === 1 ? 50 : 200));
                return {
                    text: `Bé tính giúp: ${a} + ${b} = ?`,
                    answer: a + b,
                    explanation: `${a} + ${b} = ${a + b}`
                };
            }
        });
        operations.push({
            label: '-', generator: () => {
                const a = randomInt(Math.max(range.min, 20), Math.min(range.max, level === 1 ? 100 : 500));
                const b = randomInt(10, Math.max(10, a - 20));
                return {
                    text: `Siêu nhân A trừ đi ${b} khỏi ${a}. Kết quả là bao nhiêu?`,
                    answer: a - b,
                    explanation: `${a} - ${b} = ${a - b}`
                };
            }
        });
    }
    
    // ✅ Nhân: Điều chỉnh theo bảng nhân phù hợp với level
    if (level === 1) {
        // Level 1: Bảng nhân 2, 5
        operations.push({
            label: '×', generator: () => {
                const table = multTables[randomInt(0, multTables.length - 1)];
                const b = randomInt(1, 10);
                return {
                    text: `Bảng nhân ${table}: ${table} × ${b} = ?`,
                    answer: table * b,
                    explanation: `${table} × ${b} = ${table * b}`
                };
            }
        });
    } else if (level === 2) {
        // Level 2: Bảng nhân 3, 4, 6 hoặc nhân số tròn chục
        if (Math.random() > 0.5) {
            operations.push({
                label: '×', generator: () => {
                    const table = multTables[randomInt(0, multTables.length - 1)];
                    const b = randomInt(1, 10);
                    return {
                        text: `Bảng nhân ${table}: ${table} × ${b} = ?`,
                        answer: table * b,
                        explanation: `${table} × ${b} = ${table * b}`
                    };
                }
            });
        } else {
            // Nhân số tròn chục với số có một chữ số
            operations.push({
                label: '×', generator: () => {
                    const roundTens = getRoundNumber(level, 'tens');
                    const b = randomInt(2, 9);
                    return {
                        text: `Tính: ${roundTens} × ${b} = ?`,
                        answer: roundTens * b,
                        explanation: `${roundTens} × ${b} = ${roundTens * b}`
                    };
                }
            });
        }
    } else if (level === 3) {
        // Level 3: Bảng nhân 7, 8, 9 hoặc nhân với số có một chữ số (không nhớ)
        if (Math.random() > 0.5) {
            operations.push({
                label: '×', generator: () => {
                    const table = multTables[randomInt(0, multTables.length - 1)];
                    const b = randomInt(1, 10);
                    return {
                        text: `Bảng nhân ${table}: ${table} × ${b} = ?`,
                        answer: table * b,
                        explanation: `${table} × ${b} = ${table * b}`
                    };
                }
            });
        } else {
            // Nhân với số có một chữ số (không nhớ)
            operations.push({
                label: '×', generator: () => {
                    const a = randomInt(100, 333); // Đảm bảo không nhớ
                    const b = randomInt(2, 3);
                    return {
                        text: `Tính: ${a} × ${b} = ?`,
                        answer: a * b,
                        explanation: `${a} × ${b} = ${a * b}`
                    };
                }
            });
        }
    } else {
        // Level 4: Nhân với số có một chữ số (có nhớ)
        operations.push({
            label: '×', generator: () => {
                const a = randomInt(400, 999);
                const b = randomInt(4, 9);
                return {
                    text: `Tính: ${a} × ${b} = ?`,
                    answer: a * b,
                    explanation: `${a} × ${b} = ${a * b}`
                };
            }
        });
    }
    
    // ✅ Chia: Điều chỉnh theo bảng chia phù hợp với level
    if (level === 1) {
        // Level 1: Bảng chia 2, 5
        operations.push({
            label: ':', generator: () => {
                const table = multTables[randomInt(0, multTables.length - 1)];
                const quotient = randomInt(1, 10);
                const dividend = table * quotient;
                return {
                    text: `Chia hết: ${dividend} : ${table} = ?`,
                    answer: quotient,
                    explanation: `${dividend} : ${table} = ${quotient}`
                };
            }
        });
    } else if (level === 2) {
        // Level 2: Bảng chia 3, 4, 6 hoặc chia số tròn chục/trăm
        if (Math.random() > 0.5) {
            operations.push({
                label: ':', generator: () => {
                    const table = multTables[randomInt(0, multTables.length - 1)];
                    const quotient = randomInt(1, 10);
                    const dividend = table * quotient;
                    return {
                        text: `Chia hết: ${dividend} : ${table} = ?`,
                        answer: quotient,
                        explanation: `${dividend} : ${table} = ${quotient}`
                    };
                }
            });
        } else {
            // Chia số tròn chục/trăm cho số có một chữ số
            operations.push({
                label: ':', generator: () => {
                    const roundNum = Math.random() > 0.5 ? getRoundNumber(level, 'tens') : getRoundNumber(level, 'hundreds');
                    const divisor = randomInt(2, 9);
                    const dividend = roundNum * divisor;
                    return {
                        text: `Tính: ${dividend} : ${divisor} = ?`,
                        answer: roundNum,
                        explanation: `${dividend} : ${divisor} = ${roundNum}`
                    };
                }
            });
        }
    } else if (level === 3) {
        // Level 3: Bảng chia 7, 8, 9 hoặc chia có dư
        if (Math.random() > 0.6) {
            operations.push({
                label: ':', generator: () => {
                    const table = multTables[randomInt(0, multTables.length - 1)];
                    const quotient = randomInt(1, 10);
                    const dividend = table * quotient;
                    return {
                        text: `Chia hết: ${dividend} : ${table} = ?`,
                        answer: quotient,
                        explanation: `${dividend} : ${table} = ${quotient}`
                    };
                }
            });
        } else {
            // Chia có dư - ✅ SỬA: Tạo options dạng "7 dư 5" thay vì chỉ hỏi thương số
            operations.push({
                label: ':', generator: () => {
                    const divisor = randomInt(3, 9);
                    const quotient = randomInt(5, 15);
                    const remainder = randomInt(1, divisor - 1);
                    const dividend = divisor * quotient + remainder;
                    return {
                        text: `Chia có dư: ${dividend} : ${divisor} = ?`,
                        answer: `${quotient} dư ${remainder}`, // ✅ Đổi thành chuỗi "7 dư 5"
                        answerQuotient: quotient, // Lưu thương số để tạo options
                        answerRemainder: remainder, // Lưu số dư để tạo options
                        divisor: divisor, // Lưu số chia để tạo options sai
                        explanation: `${dividend} : ${divisor} = ${quotient} dư ${remainder}`
                    };
                }
            });
        }
    } else {
        // Level 4: Chia cho số có một chữ số (phức tạp)
        operations.push({
            label: ':', generator: () => {
                const divisor = randomInt(3, 9);
                const quotient = randomInt(100, 333);
                const dividend = divisor * quotient;
                return {
                    text: `Tính: ${dividend} : ${divisor} = ?`,
                    answer: quotient,
                    explanation: `${dividend} : ${divisor} = ${quotient}`
                };
            }
        });
    }
    
    const seed = operations[randomInt(0, operations.length - 1)].generator();
    
    // ✅ Xử lý đặc biệt cho chia có dư
    const isDivisionWithRemainder = seed.answerQuotient !== undefined;
    
    return {
        type: 'mcq',
        topic,
        level,
        text: seed.text,
        correctVal: String(seed.answer),
        options: isDivisionWithRemainder 
            ? buildOptions(seed.answer, level, seed) // Truyền seed để build options đặc biệt
            : buildOptions(seed.answer, level),
        explanation: seed.explanation
    };
};

const createFillBlankQuestion = (level, topic) => {
    const range = getNumberRange(level);
    
    let total, addend;
    if (level === 1) {
        // Level 1: Số nhỏ, đơn giản
        total = randomInt(20, 100);
        addend = randomInt(5, Math.max(5, total - 5)); // ✅ Đảm bảo addend < total
    } else if (level === 2) {
        // Level 2: Số trung bình
        total = randomInt(100, 500);
        addend = randomInt(20, Math.max(20, total - 20)); // ✅ Đảm bảo addend < total
    } else {
        // Level 3-4: Số lớn hơn
        total = randomInt(Math.max(range.min, 300), range.max);
        addend = randomInt(50, Math.max(50, total - 50)); // ✅ Đảm bảo addend < total
    }
    
    // ✅ Đảm bảo missing luôn dương
    const missing = Math.max(1, total - addend);
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
    const range = getNumberRange(level);
    
    let left, right;
    if (level === 1) {
        // Level 1: Số nhỏ, so sánh đơn giản
        left = randomInt(10, 100);
        // ✅ Tránh trường hợp bằng nhau quá nhiều (80% khác nhau, 20% bằng nhau)
        if (Math.random() > 0.2) {
            right = randomInt(10, 100);
            // Đảm bảo khác nhau
            while (right === left) {
                right = randomInt(10, 100);
            }
        } else {
            right = left; // Cho phép bằng nhau 20% trường hợp
        }
    } else if (level === 2) {
        // Level 2: Số trung bình, có thể là số tròn chục/trăm
        if (Math.random() > 0.5) {
            left = getRoundNumber(level, 'tens');
            right = getRoundNumber(level, 'tens');
            // Đảm bảo khác nhau nếu không phải trường hợp đặc biệt
            if (Math.random() > 0.2 && left === right) {
                right = getRoundNumber(level, 'tens');
            }
        } else {
            left = randomInt(100, 500);
            right = randomInt(100, 500);
            // Đảm bảo khác nhau
            while (right === left && Math.random() > 0.2) {
                right = randomInt(100, 500);
            }
        }
    } else {
        // Level 3-4: Số lớn hơn
        left = randomInt(range.min, range.max);
        right = randomInt(range.min, range.max);
        // Đảm bảo khác nhau (trừ 20% trường hợp cho phép bằng nhau)
        while (right === left && Math.random() > 0.2) {
            right = randomInt(range.min, range.max);
        }
    }
    
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
    const range = getNumberRange(level);
    const multTables = getMultiplicationTables(level);
    
    const patterns = [];
    
    // ✅ Pattern 1: a + x = b (Cộng)
    patterns.push({
        generator: () => {
            let a, x;
            if (level === 1) {
                a = randomInt(10, 50);
                x = randomInt(5, 50);
            } else if (level === 2) {
                a = randomInt(50, 200);
                x = randomInt(10, 200);
            } else {
                a = randomInt(range.min, range.max - 100);
                x = randomInt(50, 200);
            }
            const b = a + x;
            return {
                text: `Tìm x, biết: ${a} + x = ${b}`,
                answer: x,
                explanation: `Muốn tìm số hạng chưa biết, ta lấy tổng trừ đi số hạng đã biết: ${b} - ${a} = ${x}.`
            };
        }
    });
    
    // ✅ Pattern 2: x - a = b (Trừ - tìm số bị trừ)
    patterns.push({
        generator: () => {
            let x, a;
            if (level === 1) {
                x = randomInt(20, 100);
                a = randomInt(5, Math.max(5, x - 10)); // ✅ Đảm bảo a < x
            } else if (level === 2) {
                x = randomInt(100, 500);
                a = randomInt(10, Math.max(10, x - 20)); // ✅ Đảm bảo a < x
            } else {
                x = randomInt(range.min, range.max);
                a = randomInt(20, Math.max(20, x - 50)); // ✅ Đảm bảo a < x
            }
            // ✅ Đảm bảo a < x để b luôn dương
            if (a >= x) {
                a = Math.max(1, x - 10);
            }
            const b = x - a;
            return {
                text: `Tìm x, biết: x - ${a} = ${b}`,
                answer: x,
                explanation: `Muốn tìm số bị trừ, ta lấy hiệu cộng với số trừ: ${b} + ${a} = ${x}.`
            };
        }
    });
    
    // ✅ Pattern 3: a - x = b (Trừ - tìm số trừ) - Level 2+
    if (level >= 2) {
        patterns.push({
            generator: () => {
                let a, x;
                if (level === 2) {
                    a = randomInt(100, 500);
                    x = randomInt(10, Math.max(10, a - 50)); // ✅ Đảm bảo x < a
                } else {
                    a = randomInt(range.min, range.max);
                    x = randomInt(50, Math.max(50, a - 100)); // ✅ Đảm bảo x < a
                }
                // ✅ Đảm bảo x < a để b luôn dương
                if (x >= a) {
                    x = Math.max(1, a - 10);
                }
                const b = a - x;
                return {
                    text: `Tìm x, biết: ${a} - x = ${b}`,
                    answer: x,
                    explanation: `Muốn tìm số trừ, ta lấy số bị trừ trừ đi hiệu: ${a} - ${b} = ${x}.`
                };
            }
        });
    }
    
    // ✅ Pattern 4: x × a = b (Nhân) - Level 2+
    if (level >= 2) {
        patterns.push({
            generator: () => {
                let x, a;
                if (level === 2) {
                    // Bảng nhân 3, 4, 6
                    a = multTables[randomInt(0, multTables.length - 1)];
                    x = randomInt(1, 10);
                } else if (level === 3) {
                    // Bảng nhân 7, 8, 9
                    a = multTables[randomInt(0, multTables.length - 1)];
                    x = randomInt(1, 10);
                } else {
                    // Level 4: Nhân phức tạp hơn
                    a = randomInt(4, 9);
                    x = randomInt(10, 100);
                }
                const b = x * a;
                return {
                    text: `Tìm x, biết: x × ${a} = ${b}`,
                    answer: x,
                    explanation: `Muốn tìm thừa số chưa biết, ta lấy tích chia cho thừa số đã biết: ${b} : ${a} = ${x}.`
                };
            }
        });
    }
    
    const seed = patterns[randomInt(0, patterns.length - 1)].generator();
    return {
        type: 'mcq',
        topic: 'finding_x',
        level,
        text: seed.text,
        correctVal: String(seed.answer),
        options: buildOptions(seed.answer, level),
        explanation: seed.explanation
    };
};

const createGeometryQuestion = (level) => {
    const shapes = [];
    
    // ✅ Hình chữ nhật
    shapes.push({
        generator: () => {
            let length, width;
            if (level === 1) {
                // Level 1: Kích thước nhỏ, đơn giản
                length = randomInt(3, 8);
                width = randomInt(2, 5);
            } else if (level === 2) {
                // Level 2: Kích thước trung bình
                length = randomInt(5, 12);
                width = randomInt(3, 8);
            } else if (level === 3) {
                // Level 3: Kích thước lớn hơn
                length = randomInt(8, 15);
                width = randomInt(5, 12);
            } else {
                // Level 4: Kích thước lớn, có thể tính diện tích
                length = randomInt(10, 20);
                width = randomInt(8, 15);
            }
            
            const perimeter = 2 * (length + width);
            const area = length * width;
            
            // Level 1-2: Chỉ chu vi, Level 3-4: Có thể diện tích
            const isPerimeter = level <= 2 || Math.random() > 0.3;
            
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
    });
    
    // ✅ Hình vuông
    shapes.push({
        generator: () => {
            let side;
            if (level === 1) {
                side = randomInt(3, 8);
            } else if (level === 2) {
                side = randomInt(5, 10);
            } else if (level === 3) {
                side = randomInt(8, 15);
            } else {
                side = randomInt(10, 20);
            }
            
            const perimeter = side * 4;
            const area = side * side;
            
            // Level 1-2: Chỉ chu vi, Level 3-4: Có thể diện tích
            const isPerimeter = level <= 2 || Math.random() > 0.3;
            
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
    });
    
    // ✅ Hình tam giác (Level 2+) - Chu vi
    if (level >= 2) {
        shapes.push({
            generator: () => {
                let side1, side2, side3;
                if (level === 2) {
                    side1 = randomInt(3, 8);
                    side2 = randomInt(3, 8);
                    side3 = randomInt(3, 8);
                } else {
                    side1 = randomInt(5, 12);
                    side2 = randomInt(5, 12);
                    side3 = randomInt(5, 12);
                }
                const perimeter = side1 + side2 + side3;
                return {
                    text: `Một hình tam giác có 3 cạnh lần lượt là ${side1}cm, ${side2}cm, ${side3}cm. Chu vi hình tam giác đó là bao nhiêu cm?`,
                    answer: perimeter,
                    explanation: `Chu vi hình tam giác = Tổng 3 cạnh = ${side1} + ${side2} + ${side3} = ${perimeter}cm.`,
                    svgContent: `<polygon points="150,50 ${150 + side1 * 5},${50 + side1 * 3} ${150 - side2 * 5},${50 + side2 * 3}" stroke="#4F46E5" stroke-width="3" fill="#E0E7FF" /><text x="150" y="45" text-anchor="middle" font-size="12" fill="#374151" font-weight="bold">${side1}cm</text><text x="${150 + side1 * 2.5}" y="${50 + side1 * 1.5 + 15}" font-size="12" fill="#374151" font-weight="bold">${side2}cm</text><text x="${150 - side2 * 2.5}" y="${50 + side2 * 1.5 + 15}" font-size="12" fill="#374151" font-weight="bold">${side3}cm</text>`
                };
            }
        });
    }
    
    const seed = shapes[randomInt(0, shapes.length - 1)].generator();
    return {
        type: 'mcq',
        topic: 'geometry',
        level,
        text: seed.text,
        correctVal: String(seed.answer),
        options: buildOptions(seed.answer, level),
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

