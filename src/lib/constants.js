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
export const REDEMPTION_STATUS = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED'
};

export const DEFAULT_PARENT_SETTINGS = {
    pinHash: null,
    lastUpdated: null,
    unlockedSeconds: 300
};