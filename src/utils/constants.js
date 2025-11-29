// --- DỮ LIỆU CẤU HÌNH CỐ ĐỊNH ---

export const TOPICS_LIST = [
    { id: 'arithmetic', label: 'Tính toán (Cộng, Trừ, Nhân, Chia)', iconName: 'Calculator' },
    { id: 'expressions', label: 'Biểu thức (Giá trị biểu thức, So sánh)', iconName: 'Sigma' }, 
    { id: 'finding_x', label: 'Tìm X (Số hạng, Số bị chia, Số chia...)', iconName: 'Target' },
    { id: 'fractions', label: 'Phân số (1/2, 1/3... 1/9)', iconName: 'Brain' },
    { id: 'word_problems', label: 'Toán đố (Gấp/Giảm số lần, Nhiều/Ít hơn)', iconName: 'BookOpen' },
    { id: 'money_units', label: 'Đo lường & Tiền (mm, g, ml, độ C, VNĐ)', iconName: 'Banknote' },
    { id: 'geometry', label: 'Hình học (Chu vi, Góc, Hình tròn)', iconName: 'Shapes' },
    { id: 'numbers_roman', label: 'Số lớn & La Mã (100.000, La Mã I-XX)', iconName: 'Hash' }, 
    { id: 'statistics', label: 'Thống kê (Bảng, Khả năng xảy ra)', iconName: 'BarChart3' } 
];

// Từ điển ánh xạ lỗi AI sinh ra tiếng Anh -> Tiếng Việt
export const TOPIC_TRANSLATIONS = {
    'word problem': 'word_problems',
    'word_problem': 'word_problems',
    'arithmetic': 'arithmetic',
    'calculation': 'arithmetic',
    'geometry': 'geometry',
    'fraction': 'fractions',
    'fractions': 'fractions',
    'time': 'money_units',
    'money': 'money_units',
    'measurement': 'money_units',
    'statistics': 'statistics',
    'logic': 'expressions',
    'numbers': 'arithmetic',
    'finding x': 'finding_x',
    'finding_x': 'finding_x',
    'numbers_roman': 'numbers_roman',
    'expressions': 'expressions'
};

export const SEMESTER_DEFAULT_TOPICS = {
    hk1: ['arithmetic', 'expressions', 'fractions', 'word_problems', 'money_units', 'geometry'],
    hk2: ['arithmetic', 'finding_x', 'word_problems', 'money_units', 'geometry', 'numbers_roman', 'statistics']
};

export const SEMESTER_CONTENT = {
    hk1: "Phạm vi 1000 (Cộng, Trừ, Nhân, Chia, Bảng cửu chương 2-9). Gấp một số lên nhiều lần, giảm đi một số lần, so sánh số lớn gấp mấy lần số bé. Biểu thức số (tính giá trị). Phân số 1/2 đến 1/9. Hình học: Góc vuông/không vuông, Chu vi hình tam giác/tứ giác. Đơn vị: mm, g, ml, độ C.",
    hk2: "Phạm vi 100.000 (Số có 5 chữ số). Làm tròn số (hàng chục/trăm/nghìn/chục nghìn). Chữ số La Mã (I đến XX). Diện tích hình chữ nhật/vuông (cm²). Hình tròn (tâm, bán kính, đường kính). Trung điểm đoạn thẳng. Bảng số liệu thống kê & Khả năng xảy ra sự kiện. Tiền Việt Nam."
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