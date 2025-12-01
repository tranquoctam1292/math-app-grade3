import { 
  Calculator, Sigma, Target, Brain, BookOpen, Banknote, Shapes, Hash, BarChart3, HelpCircle 
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

export const ICON_MAP = { Calculator, Sigma, Target, Brain, BookOpen, Banknote, Shapes, Hash, BarChart3, HelpCircle };

export const SEMESTER_DEFAULT_TOPICS = {
    hk1: ['arithmetic', 'expressions', 'fractions', 'word_problems', 'money_units', 'geometry'],
    hk2: ['arithmetic', 'finding_x', 'word_problems', 'money_units', 'geometry', 'numbers_roman', 'statistics']
};

export const SEMESTER_CONTENT = {
    hk1: "Phạm vi 1000. Bảng nhân 2-9, Bảng chia 2-9. Gấp một số lên nhiều lần, giảm đi một số lần. So sánh số lớn gấp mấy lần số bé. Làm quen biểu thức số. Phân số 1/2 đến 1/9. Hình học: Góc vuông/không vuông, Chu vi hình tam giác/tứ giác. Đơn vị: mm, g, ml, độ C.",
    hk2: "Phạm vi 100.000 (Số có 5 chữ số). Làm tròn số đến hàng chục/trăm/nghìn/chục nghìn. Chữ số La Mã (I đến XX). Diện tích hình chữ nhật/vuông (cm²). Hình tròn (tâm, bán kính, đường kính). Trung điểm đoạn thẳng. Bảng số liệu thống kê & Khả năng xảy ra sự kiện. Tiền Việt Nam."
};

export const REWARD_PER_LEVEL = { 2: 200, 3: 300, 4: 350 }; 
export const DIFFICULTY_MIX = {
    easy: { 2: 7, 3: 3, 4: 0 },    
    medium: { 2: 4, 3: 4, 4: 2 }, 
    hard: { 2: 2, 3: 4, 4: 4 }    
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
    // --- ARITHMETIC (Tính toán) ---
    {
        "text": "Tính nhẩm: 450 + 200 - 50",
        "options": ["600", "550", "650", "500"],
        "correctVal": "600",
        "explanation": "450 + 200 = 650. Sau đó 650 - 50 = 600.",
        "level": 2,
        "topic": "arithmetic"
    },
    {
        "text": "Kết quả của phép nhân: 12 × 5",
        "options": ["60", "50", "55", "70"],
        "correctVal": "60",
        "explanation": "10 x 5 = 50, 2 x 5 = 10. Vậy 50 + 10 = 60.",
        "level": 2,
        "topic": "arithmetic"
    },
    {
        "text": "Tìm số lớn nhất trong các số sau: 8790, 8970, 8079, 8709",
        "options": ["8970", "8790", "8079", "8709"],
        "correctVal": "8970",
        "explanation": "So sánh hàng trăm: 9 > 7 > 0. Vậy 8970 là lớn nhất.",
        "level": 2,
        "topic": "arithmetic"
    },

    // --- EXPRESSIONS (Biểu thức) ---
    {
        "text": "Tính giá trị biểu thức: 20 + 5 × 2",
        "options": ["30", "50", "27", "40"],
        "correctVal": "30",
        "explanation": "Nhân chia trước, cộng trừ sau: 5 × 2 = 10, sau đó 20 + 10 = 30.",
        "level": 3,
        "topic": "expressions"
    },
    {
        "text": "Tính: (100 - 40) : 2",
        "options": ["30", "20", "60", "80"],
        "correctVal": "30",
        "explanation": "Trong ngoặc trước: 100 - 40 = 60. Sau đó 60 : 2 = 30.",
        "level": 3,
        "topic": "expressions"
    },

    // --- FINDING X (Tìm X) ---
    {
        "text": "Tìm x, biết: x - 125 = 300",
        "options": ["425", "175", "275", "400"],
        "correctVal": "425",
        "explanation": "Muốn tìm số bị trừ, ta lấy hiệu cộng với số trừ: 300 + 125 = 425.",
        "level": 3,
        "topic": "finding_x"
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
        "text": "Tìm y, biết: 5 × y = 35",
        "options": ["7", "6", "8", "9"],
        "correctVal": "7",
        "explanation": "Ta có bảng cửu chương 5: 5 x 7 = 35. Vậy y = 7.",
        "level": 2,
        "topic": "finding_x"
    },

    // --- WORD PROBLEMS (Toán đố) ---
    {
        "text": "Cô giáo có 40 quyển vở, chia đều cho 5 bạn giỏi nhất lớp. Hỏi mỗi bạn nhận được bao nhiêu quyển?",
        "options": ["8 quyển", "7 quyển", "9 quyển", "6 quyển"],
        "correctVal": "8 quyển",
        "explanation": "Lấy tổng số vở chia cho số bạn: 40 : 5 = 8 (quyển).",
        "level": 2,
        "topic": "word_problems"
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
        "text": "Mẹ mua 5kg gạo, giá mỗi cân là 20.000 đồng. Mẹ đưa cô bán hàng 200.000 đồng. Hỏi cô bán hàng phải trả lại bao nhiêu?",
        "options": ["100.000 đồng", "120.000 đồng", "90.000 đồng", "80.000 đồng"],
        "correctVal": "100.000 đồng",
        "explanation": "Tiền gạo: 5 x 20.000 = 100.000đ. Tiền thừa: 200.000 - 100.000 = 100.000đ.",
        "level": 4,
        "topic": "word_problems"
    },

    // --- GEOMETRY (Hình học) ---
    {
        "text": "Một hình vuông có cạnh 5cm. Chu vi hình vuông đó là:",
        "options": ["20cm", "25cm", "15cm", "10cm"],
        "correctVal": "20cm",
        "explanation": "Chu vi hình vuông = cạnh × 4 = 5 × 4 = 20 (cm).",
        "level": 2,
        "topic": "geometry"
    },
    {
        "text": "Một hình chữ nhật có chiều dài 10cm, chiều rộng 4cm. Diện tích hình chữ nhật là:",
        "options": ["40cm²", "28cm²", "14cm²", "40cm"],
        "correctVal": "40cm²",
        "explanation": "Diện tích hình chữ nhật = Dài × Rộng = 10 × 4 = 40 (cm²).",
        "level": 3,
        "topic": "geometry"
    },
    {
        "text": "Góc vuông là góc có số đo bằng bao nhiêu độ?",
        "options": ["90 độ", "60 độ", "180 độ", "45 độ"],
        "correctVal": "90 độ",
        "explanation": "Góc vuông có số đo bằng 90 độ (ký hiệu 90°).",
        "level": 2,
        "topic": "geometry"
    },

    // --- FRACTIONS (Phân số) ---
    {
        "text": "Một cái bánh chia làm 4 phần bằng nhau, bé ăn hết 1 phần. Bé đã ăn bao nhiêu phần cái bánh?",
        "options": ["1/4", "1/2", "3/4", "1/3"],
        "correctVal": "1/4",
        "explanation": "Chia 4 phần lấy 1 phần gọi là một phần tư (1/4).",
        "level": 2,
        "topic": "fractions"
    },
    {
        "text": "Biết 1/3 số học sinh của lớp là 10 bạn. Hỏi lớp đó có tất cả bao nhiêu học sinh?",
        "options": ["30 bạn", "20 bạn", "40 bạn", "13 bạn"],
        "correctVal": "30 bạn",
        "explanation": "Tổng số học sinh = 10 × 3 = 30 (bạn).",
        "level": 3,
        "topic": "fractions"
    },

    // --- MONEY & UNITS (Đo lường & Tiền) ---
    {
        "text": "Đổi đơn vị: 2kg = ... g",
        "options": ["2000", "200", "20", "20000"],
        "correctVal": "2000",
        "explanation": "1kg = 1000g, nên 2kg = 2000g.",
        "level": 2,
        "topic": "money_units"
    },
    {
        "text": "Bây giờ là 8 giờ 15 phút. 30 phút nữa là mấy giờ?",
        "options": ["8 giờ 45 phút", "9 giờ", "8 giờ 30 phút", "9 giờ 15 phút"],
        "correctVal": "8 giờ 45 phút",
        "explanation": "15 phút + 30 phút = 45 phút. Vậy là 8 giờ 45 phút.",
        "level": 3,
        "topic": "money_units"
    },
    {
        "text": "5m 4cm bằng bao nhiêu cm?",
        "options": ["504cm", "540cm", "54cm", "5004cm"],
        "correctVal": "504cm",
        "explanation": "5m = 500cm. Vậy 5m 4cm = 500 + 4 = 504cm.",
        "level": 3,
        "topic": "money_units"
    },

    // --- ROMAN NUMERALS & STATISTICS (Số La Mã & Thống kê) ---
    {
        "text": "Số 15 viết dưới dạng số La Mã là:",
        "options": ["XV", "XIV", "XVI", "VX"],
        "correctVal": "XV",
        "explanation": "X là 10, V là 5. XV là 15.",
        "level": 2,
        "topic": "numbers_roman"
    },
    {
        "text": "Số liền trước của số 10.000 là số nào?",
        "options": ["9999", "9990", "9000", "10001"],
        "correctVal": "9999",
        "explanation": "Muốn tìm số liền trước, ta lấy số đó trừ đi 1: 10.000 - 1 = 9999.",
        "level": 2,
        "topic": "numbers_roman"
    },
    {
        "text": "Nam gieo một con xúc xắc. Khả năng Nam gieo được mặt 7 chấm là:",
        "options": ["Không thể", "Có thể", "Chắc chắn", "Rất cao"],
        "correctVal": "Không thể",
        "explanation": "Con xúc xắc chỉ có 6 mặt (từ 1 đến 6 chấm), không có mặt 7 chấm.",
        "level": 2,
        "topic": "statistics"
    },
    
    // --- MIXED (Hỗn hợp) ---
    {
        "text": "Trong các tháng sau, tháng nào có 30 ngày?",
        "options": ["Tháng 4", "Tháng 1", "Tháng 5", "Tháng 12"],
        "correctVal": "Tháng 4",
        "explanation": "Tháng 4, 6, 9, 11 là các tháng có 30 ngày.",
        "level": 3,
        "topic": "money_units"
    },
    {
        "text": "Một năm nhuận có bao nhiêu ngày?",
        "options": ["366 ngày", "365 ngày", "360 ngày", "364 ngày"],
        "correctVal": "366 ngày",
        "explanation": "Năm thường có 365 ngày, năm nhuận có thêm 1 ngày là 366 ngày.",
        "level": 3,
        "topic": "money_units"
    },
    {
        "text": "Số tròn nghìn ở giữa 4000 và 6000 là:",
        "options": ["5000", "4500", "5500", "5001"],
        "correctVal": "5000",
        "explanation": "Số tròn nghìn có tận cùng là 3 chữ số 0. Giữa 4000 và 6000 là 5000.",
        "level": 2,
        "topic": "numbers_roman"
    },
    {
        "text": "Chu vi hình tam giác có độ dài các cạnh là 10cm, 12cm, 15cm là:",
        "options": ["37cm", "30cm", "40cm", "35cm"],
        "correctVal": "37cm",
        "explanation": "Chu vi tam giác = tổng độ dài các cạnh = 10 + 12 + 15 = 37 (cm).",
        "level": 3,
        "topic": "geometry"
    },
    {
        "text": "Biểu thức 30 : 5 + 10 có giá trị là:",
        "options": ["16", "20", "6", "50"],
        "correctVal": "16",
        "explanation": "30 : 5 = 6, sau đó 6 + 10 = 16.",
        "level": 2,
        "topic": "expressions"
    },
    {
        "text": "Nếu hôm nay là Thứ Ba, ngày 1. Thứ Ba tuần sau là ngày mấy?",
        "options": ["Ngày 8", "Ngày 7", "Ngày 9", "Ngày 6"],
        "correctVal": "Ngày 8",
        "explanation": "Một tuần có 7 ngày. 1 + 7 = 8. Vậy thứ Ba tuần sau là ngày 8.",
        "level": 3,
        "topic": "money_units"
    },
    {
        "text": "Có 30 quả cam xếp vào các hộp, mỗi hộp 6 quả. Hỏi xếp được bao nhiêu hộp?",
        "options": ["5 hộp", "6 hộp", "4 hộp", "3 hộp"],
        "correctVal": "5 hộp",
        "explanation": "30 : 6 = 5 (hộp).",
        "level": 2,
        "topic": "word_problems"
    },
    // 1. Mẫu Comparison
    {
        "type": "comparison",
        "text": "So sánh: 5 x 5 ... 24",
        "options": [">", "<", "="],
        "correctVal": ">",
        "explanation": "5 x 5 = 25. Vì 25 > 24 nên điền dấu >.",
        "level": 2,
        "topic": "arithmetic"
    },
    // 2. Mẫu Fill Blank
    {
        "type": "fill_blank",
        "text": "Điền số thích hợp: 15 + __ = 30",
        "correctVal": "15",
        "explanation": "Muốn tìm số hạng chưa biết, ta lấy tổng trừ đi số hạng đã biết: 30 - 15 = 15.",
        "level": 2,
        "topic": "finding_x"
    },
    // 3. Mẫu Sorting
    {
        "type": "sorting",
        "text": "Sắp xếp các số sau theo thứ tự từ bé đến lớn",
        "items": ["105", "98", "150", "12"],
        "correctOrder": ["12", "98", "105", "150"],
        "explanation": "So sánh các số: 12 < 98 < 105 < 150.",
        "level": 3,
        "topic": "numbers_roman"
    },
    // 4. Mẫu Matching
    {
        "type": "matching",
        "text": "Ghép phép tính với kết quả đúng",
        "pairs": [
            { "left": "2 x 3", "right": "6" },
            { "left": "4 x 5", "right": "20" },
            { "left": "10 : 2", "right": "5" }
        ],
        "explanation": "2x3=6; 4x5=20; 10:2=5",
        "level": 2,
        "topic": "arithmetic"
    },
    // ... Một vài câu MCQ cũ để fallback
    {
        "type": "mcq",
        "text": "Tính: 100 - 45",
        "options": ["55", "45", "65", "50"],
        "correctVal": "55",
        "explanation": "100 - 45 = 55.",
        "level": 2,
        "topic": "arithmetic"
    }
];