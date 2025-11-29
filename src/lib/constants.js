// src/lib/constants.js

// --- CHỦ ĐỀ HỌC TẬP ---
export const TOPICS_LIST = [
  { id: 'arithmetic', label: 'Phép tính cộng, trừ, nhân, chia' },
  { id: 'comparison', label: 'So sánh số' },
  { id: 'find_x', label: 'Tìm x' },
  { id: 'geometry', label: 'Hình học cơ bản (chu vi, diện tích)' },
  { id: 'measurement', label: 'Đo lường (độ dài, khối lượng)' },
  { id: 'time', label: 'Thời gian và Lịch' },
  { id: 'word_problem', label: 'Giải toán có lời văn' },
];

// Dùng để chuẩn hóa output của AI
export const TOPIC_TRANSLATIONS = {
  'phép tính': 'arithmetic',
  'cộng trừ': 'arithmetic',
  'nhân chia': 'arithmetic',
  'so sánh': 'comparison',
  'tìm x': 'find_x',
  'hình học': 'geometry',
  'đo lường': 'measurement',
  'thời gian': 'time',
  'toán đố': 'word_problem',
  'arithmetic': 'arithmetic',
  'comparison': 'comparison',
  'find_x': 'find_x',
  'geometry': 'geometry',
  'measurement': 'measurement',
  'time': 'time',
  'word_problem': 'word_problem'
};

// --- CẤU HÌNH HỌC KỲ ---
export const SEMESTER_DEFAULT_TOPICS = {
  hk1: ['arithmetic', 'comparison', 'find_x'],
  hk2: ['arithmetic', 'geometry', 'measurement', 'word_problem'],
};

export const SEMESTER_CONTENT = {
  hk1: "Tập trung vào các phép tính cơ bản trong phạm vi 1000, so sánh số, và các bài toán tìm x đơn giản.",
  hk2: "Mở rộng các phép tính, giới thiệu hình học (chu vi, diện tích hình chữ nhật, hình vuông), các đơn vị đo lường phổ biến và giải các bài toán có lời văn phức tạp hơn.",
};

// --- PHẦN THƯỞNG & SHOP ---
export const REWARD_PER_LEVEL = {
  1: 100,
  2: 200,
  3: 300,
  4: 400,
  5: 500,
};

export const DIFFICULTY_MIX = {
    easy:   { 1: 5, 2: 3, 3: 2, 4: 0, 5: 0 },
    medium: { 1: 2, 2: 4, 3: 3, 4: 1, 5: 0 },
    hard:   { 1: 0, 2: 2, 3: 4, 4: 3, 5: 1 },
};

export const SHOP_ITEMS = [
  { id: 'cash_10k', name: 'Đổi 10,000đ tiền mặt', value: 100000 },
  { id: 'cash_20k', name: 'Đổi 20,000đ tiền mặt', value: 200000 },
  { id: 'toy_car', name: 'Mua một chiếc xe đồ chơi', value: 50000 },
  { id: 'comic_book', name: 'Mua một cuốn truyện tranh', value: 30000 },
];

// --- AVATARS ---
export const AVATARS = [
  '🦊', '🐼', '🐨', '🐵', '🦄', '🦁', '🐷', '🐸', '🐔', '🐧'
];
