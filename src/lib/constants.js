import { 
  Calculator, Sigma, Target, Brain, BookOpen, Banknote, Shapes, Hash, BarChart3, HelpCircle, Sparkles
} from 'lucide-react';

export const TOPICS_LIST = [
    { id: 'arithmetic', label: 'Tính toán', iconName: 'Calculator' },
    { id: 'expressions', label: 'Biểu thức', iconName: 'Sigma' }, 
    { id: 'finding_x', label: 'Tìm X', iconName: 'Target' },
    { id: 'fractions', label: 'Phân số', iconName: 'Brain' },
    { id: 'word_problems', label: 'Toán đố', iconName: 'BookOpen' },
    { id: 'money_units', label: 'Đo lường & Tiền', iconName: 'Banknote' },
    { id: 'geometry', label: 'Hình học', iconName: 'Shapes' },
    { id: 'numbers_roman', label: 'Số lớn & La Mã', iconName: 'Hash' }, 
    { id: 'statistics', label: 'Thống kê', iconName: 'BarChart3' } 
];

export const TOPIC_TRANSLATIONS = {
    'word problem': 'Toán đố',
    'word_problem': 'Toán đố',
    'arithmetic': 'Tính toán',
    'calculation': 'Tính toán',
    'geometry': 'Hình học',
    'fraction': 'Phân số',
    'fractions': 'Phân số',
    'time': 'Thời gian',
    'money': 'Tiền tệ',
    'measurement': 'Đo lường',
    'statistics': 'Thống kê',
    'logic': 'Tư duy Logic'
};

export const ICON_MAP = { Calculator, Sigma, Target, Brain, BookOpen, Banknote, Shapes, Hash, BarChart3, HelpCircle, Sparkles };

export const SEMESTER_DEFAULT_TOPICS = {
    hk1: ['arithmetic', 'expressions', 'fractions', 'word_problems', 'money_units', 'geometry'],
    hk2: ['arithmetic', 'finding_x', 'word_problems', 'money_units', 'geometry', 'numbers_roman', 'statistics']
};

// --- CẬP NHẬT MỚI: NỘI DUNG BÁM SÁT SGK ---
export const SEMESTER_CONTENT = {
    hk1: `
        - Bảng nhân, bảng chia từ 2 đến 9 (Trọng tâm).
        - Đơn vị đo lường: mm, ml, gam, độ C.
        - Phép nhân/chia số có 2, 3 chữ số với số có 1 chữ số.
        - Tìm thành phần chưa biết (Tìm x).
        - Gấp một số lên nhiều lần, giảm đi một số lần.
        - Hình học: Góc vuông, góc không vuông. Chu vi tam giác, tứ giác, hình chữ nhật, hình vuông.
        - Biểu thức số và giá trị biểu thức.
    `,
    hk2: `
        - Các số trong phạm vi 10.000 và 100.000 (đọc, viết, so sánh).
        - Phép cộng, trừ, nhân, chia trong phạm vi 100.000.
        - Làm tròn số (đến hàng chục, trăm, nghìn, chục nghìn).
        - Chữ số La Mã (I đến XX).
        - Hình học: Hình tròn (tâm, bán kính, đường kính). Diện tích hình chữ nhật, hình vuông (cm²).
        - Thống kê: Bảng số liệu, khả năng xảy ra của một sự kiện.
        - Tiền Việt Nam.
    `
};

// --- CẬP NHẬT MỚI: ĐIỂM THƯỞNG CHO 4 LEVEL ---
export const REWARD_PER_LEVEL = { 
    1: 100, // Nhận biết (Cơ bản)
    2: 200, // Thông hiểu
    3: 400, // Vận dụng
    4: 600  // Vận dụng cao (Thử thách)
}; 

// --- CẬP NHẬT MỚI: TỶ LỆ CÂU HỎI (Tổng 10 câu) ---
export const DIFFICULTY_MIX = {
    easy:   { 1: 5, 2: 4, 3: 1, 4: 0 }, // Khởi động: Chủ yếu là nhận biết và thông hiểu
    medium: { 1: 2, 2: 4, 3: 3, 4: 1 }, // Tiêu chuẩn: Phân bố đều, có 1 câu khó
    hard:   { 1: 0, 2: 2, 3: 5, 4: 3 }  // Thần đồng: Tập trung vào vận dụng và tư duy
};

export const SHOP_ITEMS = [
  { id: 'cash_10k', name: '10.000đ Tiền mặt', value: 10000, color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'cash_20k', name: '20.000đ Tiền mặt', value: 20000, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'cash_30k', name: '30.000đ Tiền mặt', value: 30000, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'cash_40k', name: '40.000đ Tiền mặt', value: 40000, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'cash_50k', name: '50.000đ Tiền mặt', value: 50000, color: 'bg-red-100 text-red-700 border-red-200' },
];

export const AVATARS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'];

export const BACKUP_QUESTIONS = [
    // --- LEVEL 1: NHẬN BIẾT & TÍNH NHẨM ---
    {
        "text": "Kết quả của phép tính 5 × 6 là:",
        "options": ["30", "25", "35", "36"],
        "correctVal": "30",
        "explanation": "Dựa vào bảng nhân 5: 5 lần 6 bằng 30.",
        "level": 1,
        "topic": "arithmetic"
    },
    {
        "text": "Số liền sau của số 199 là:",
        "options": ["200", "198", "201", "190"],
        "correctVal": "200",
        "explanation": "Muốn tìm số liền sau ta lấy số đó cộng thêm 1: 199 + 1 = 200.",
        "level": 1,
        "topic": "numbers_roman"
    },

    // --- LEVEL 2: THÔNG HIỂU & ĐƠN VỊ ---
    {
        "text": "Tính nhẩm: 450 + 200 - 50",
        "options": ["600", "550", "650", "500"],
        "correctVal": "600",
        "explanation": "450 + 200 = 650. Sau đó 650 - 50 = 600.",
        "level": 2,
        "topic": "arithmetic"
    },
    {
        "text": "Đổi đơn vị: 2kg = ... g",
        "options": ["2000", "200", "20", "20000"],
        "correctVal": "2000",
        "explanation": "1kg = 1000g, nên 2kg = 2000g.",
        "level": 2,
        "topic": "money_units"
    },
    {
        "text": "Góc vuông là góc có số đo bằng bao nhiêu độ?",
        "options": ["90 độ", "60 độ", "180 độ", "45 độ"],
        "correctVal": "90 độ",
        "explanation": "Góc vuông có số đo bằng 90 độ (ký hiệu 90°).",
        "level": 2,
        "topic": "geometry"
    },

    // --- LEVEL 3: VẬN DỤNG & TÌM X ---
    {
        "text": "Tính giá trị biểu thức: 20 + 5 × 2",
        "options": ["30", "50", "27", "40"],
        "correctVal": "30",
        "explanation": "Nhân chia trước, cộng trừ sau: 5 × 2 = 10, sau đó 20 + 10 = 30.",
        "level": 3,
        "topic": "expressions"
    },
    {
        "text": "Tìm x, biết: x - 125 = 300",
        "options": ["425", "175", "275", "400"],
        "correctVal": "425",
        "explanation": "Muốn tìm số bị trừ, ta lấy hiệu cộng với số trừ: 300 + 125 = 425.",
        "level": 3,
        "topic": "finding_x"
    },
    {
        "text": "Một hình chữ nhật có chiều dài 10cm, chiều rộng 4cm. Diện tích hình chữ nhật là:",
        "options": ["40cm²", "28cm²", "14cm²", "40cm"],
        "correctVal": "40cm²",
        "explanation": "Diện tích hình chữ nhật = Dài × Rộng = 10 × 4 = 40 (cm²).",
        "level": 3,
        "topic": "geometry"
    },

    // --- LEVEL 4: VẬN DỤNG CAO & TOÁN ĐỐ PHỨC TẠP ---
    {
        "text": "Mẹ mua 5kg gạo, giá mỗi cân là 20.000 đồng. Mẹ đưa cô bán hàng 200.000 đồng. Hỏi cô bán hàng phải trả lại bao nhiêu?",
        "options": ["100.000 đồng", "120.000 đồng", "90.000 đồng", "80.000 đồng"],
        "correctVal": "100.000 đồng",
        "explanation": "Tiền gạo: 5 x 20.000 = 100.000đ. Tiền thừa: 200.000 - 100.000 = 100.000đ.",
        "level": 4,
        "topic": "word_problems"
    },
    {
        "text": "Tìm x, biết: x : 6 = 14",
        "options": ["84", "20", "60", "74"],
        "correctVal": "84",
        "explanation": "Muốn tìm số bị chia, ta lấy thương nhân với số chia: 14 × 6 = 84.",
        "level": 4,
        "topic": "finding_x"
    },
    {
        "text": "Một trang trại có 120 con gà và số vịt nhiều gấp đôi số gà. Hỏi trang trại có bao nhiêu con vịt?",
        "options": ["240 con", "120 con", "360 con", "60 con"],
        "correctVal": "240 con",
        "explanation": "Số vịt gấp đôi số gà: 120 × 2 = 240 (con).",
        "level": 3,
        "topic": "word_problems"
    },
    {
        "text": "Số La Mã XV có giá trị là bao nhiêu?",
        "options": ["15", "14", "16", "51"],
        "correctVal": "15",
        "explanation": "X là 10, V là 5. XV là 10 + 5 = 15.",
        "level": 2,
        "topic": "numbers_roman"
    }
];