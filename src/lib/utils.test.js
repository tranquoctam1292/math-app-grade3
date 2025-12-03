import { describe, it, expect } from 'vitest';
import { normalizeVal, solveEquation, solveComparison } from './utils';

describe('normalizeVal', () => {
    it('chuẩn hoá số nguyên và chuỗi số cơ bản', () => {
        expect(normalizeVal(10)).toBe(10);
        expect(normalizeVal('10')).toBe(10);
        expect(normalizeVal('  10  ')).toBe(10);
    });

    it('xử lý số thập phân dạng chấm', () => {
        expect(normalizeVal('3.5')).toBeCloseTo(3.5);
        expect(normalizeVal(0.5)).toBeCloseTo(0.5);
    });

    it('xử lý số có dấu phẩy (theo logic hiện tại)', () => {
        // Theo implement: bỏ dấu phẩy rồi parse, nên "3,5" => 35
        expect(normalizeVal('3,5')).toBe(35);
        expect(normalizeVal('1,000')).toBe(1000);
    });

    it('giữ nguyên phân số dạng 1/2 dưới dạng chuỗi', () => {
        expect(normalizeVal('1/2')).toBe('1/2');
    });

    it('trả về chuỗi rỗng cho null/undefined', () => {
        expect(normalizeVal(null)).toBe('');
        expect(normalizeVal(undefined)).toBe('');
    });

    it('giữ nguyên text (đã được lower-case và trim)', () => {
        expect(normalizeVal('  Xin Chào  ')).toBe('xin chào');
    });
});

describe('solveEquation', () => {
    it('giải phương trình dạng x + a = b', () => {
        const result = solveEquation('Tìm x, biết: x + 5 = 12');
        expect(result).toBe(7);
    });

    it('giải phương trình dạng x - a = b', () => {
        const result = solveEquation('Tìm x, biết: x - 3 = 7');
        expect(result).toBe(10);
    });

    it('giải phương trình dạng x × a = b', () => {
        const result = solveEquation('Tìm x, biết: x × 4 = 20');
        expect(result).toBe(5);
    });

    it('bỏ qua các phương trình phức tạp không hỗ trợ (chia ở nhiều vị trí)', () => {
        const result = solveEquation('Tìm x, biết: 14 : x = 6');
        expect(result).toBeNull();
    });

    it('trả về null nếu không có dấu "="', () => {
        const result = solveEquation('Tìm x, biết: x + 5');
        expect(result).toBeNull();
    });
});

describe('solveComparison', () => {
    it('so sánh đơn giản với phép nhân', () => {
        const res = solveComparison('So sánh: 5 x 5 ... 24');
        expect(res).toBe('>');
    });

    it('so sánh khi hai vế bằng nhau', () => {
        const res = solveComparison('Điền dấu: 15 + 9 ... 32 - 8');
        expect(res).toBe('=');
    });

    it('so sánh với số thập phân dấu chấm', () => {
        const res = solveComparison('So sánh: 1.5 + 2.5 ... 4');
        expect(res).toBe('=');
    });

    it('so sánh với số thập phân dấu phẩy trong câu tiếng Việt', () => {
        const res = solveComparison('So sánh: 3,5 + 1,5 ... 5');
        expect(res).toBe('=');
    });

    it('trả về null nếu không tách được hai vế', () => {
        const res = solveComparison('Câu hỏi bị lỗi, không có biểu thức hợp lệ');
        expect(res).toBeNull();
    });
});


