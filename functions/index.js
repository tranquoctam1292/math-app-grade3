const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Định nghĩa Secret mới cho Gemini
const apiKey = defineSecret("GEMINI_API_KEY");

exports.generateQuestions = onCall({ 
    secrets: [apiKey],
    timeoutSeconds: 60,
    memory: "512MiB",
    region: "us-central1"
}, async (request) => {
    try {
        const prompt = request.data.prompt;
        if (!prompt) {
            throw new HttpsError('invalid-argument', 'Client không gửi prompt.');
        }

        const GEMINI_API_KEY = apiKey.value();
        if (!GEMINI_API_KEY) {
            throw new HttpsError('failed-precondition', 'Chưa cấu hình GEMINI_API_KEY.');
        }

        // Khởi tạo Gemini
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        
        // ✅ FIX: Đổi tên model thành phiên bản cụ thể 'gemini-1.5-flash-001'
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash", // Thay đổi tại đây
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const jsonInstruction = `
        Bạn là chuyên gia giáo dục Toán tiểu học.
        Nhiệm vụ: Tạo danh sách câu hỏi toán học dựa trên yêu cầu dưới đây.
        YÊU CẦU QUAN TRỌNG VỀ NỘI DUNG:
        1. Ngôn ngữ: Tiếng Việt tự nhiên, đơn giản, dễ hiểu, thân thiện với trẻ em.
        2. Tránh từ ngữ Hán Việt phức tạp hoặc câu văn quá dài dòng.
        3. Các con số trong đề bài phải hợp lý với thực tế.
        4. Nếu là bài toán đố, hãy dùng tên thân thuộc (Lan, Minh...) hoặc con vật.
        5. KHÔNG SỬ DỤNG các đơn vị đo lường không phổ biến với trẻ nhỏ như: "tá" (thay bằng 12), "yến/tạ/tấn" (nếu chưa học), "lạng". Hãy ưu tiên dùng số cụ thể.
        
        YÊU CẦU OUTPUT:
        Trả về một mảng JSON (JSON Array) chứa các object câu hỏi. Ví dụ:
        [
          { "type": "mcq", ... },
          { "type": "sorting", ... }
        ]
        
        CẤU TRÚC MỖI CÂU HỎI (SCHEMA):
        1. Trắc nghiệm ("mcq") hoặc Điền từ ("fill_blank") hoặc So sánh ("comparison"):
        {
          "type": "mcq", 
          "text": "Nội dung câu hỏi",
          "options": ["A", "B", "C", "D"], 
          "correctVal": "Giá trị đúng (string hoặc number)",
          "explanation": "Giải thích chi tiết",
          "level": 2, 
          "topic": "arithmetic"
        }

        2. Sắp xếp ("sorting"):
        {
          "type": "sorting",
          "text": "Đề bài",
          "items": ["10", "5", "8"], 
          "correctOrder": ["5", "8", "10"], 
          "explanation": "...",
          "level": 2, 
          "topic": "arithmetic"
        }

        3. Ghép cặp ("matching"):
        {
          "type": "matching",
          "text": "Đề bài",
          "pairs": [
            {"left": "2+2", "right": "4"},
            {"left": "5x2", "right": "10"}
          ],
          "explanation": "...",
          "level": 2, 
          "topic": "arithmetic"
        }
        
        4. Yêu cầu đặc biệt cho HÌNH HỌC ("geometry"):
        Nếu câu hỏi yêu cầu tính chu vi, diện tích, hoặc nhận biết hình, hãy thêm trường **"svgContent"**.
        **"svgContent"**: "Chuỗi chứa các thẻ SVG con (như <rect>, <path>, <circle>, <text>...) để vẽ hình minh họa. KHÔNG bao gồm thẻ <svg> bao ngoài. ViewBox mặc định là 0 0 300 200. Hãy vẽ nét đậm (stroke-width='3'), màu đen hoặc xanh dương, fill='none' hoặc màu nhạt."

        Ví dụ câu hỏi hình học:
        {
          "type": "mcq",
          "text": "Tính chu vi hình chữ nhật có chiều dài 10cm, chiều rộng 5cm.",
          "options": ["30cm", "15cm", "50cm", "25cm"],
          "correctVal": "30cm",
          "level": 2,
          "topic": "geometry",
          "svgContent": "<rect x='50' y='50' width='200' height='100' stroke='#4F46E5' stroke-width='3' fill='#E0E7FF' /><text x='150' y='170' text-anchor='middle' fill='black'>10cm</text><text x='260' y='100' text-anchor='middle' fill='black'>5cm</text>"
        }
        `;

        const fullPrompt = jsonInstruction + "\n\n" + "NỘI DUNG YÊU CẦU CỤ THỂ:\n" + prompt;

        // Gọi Gemini
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        if (!text) throw new HttpsError('internal', "Gemini trả về rỗng.");

        // Parse JSON
        let jsonStr = text.trim();
        if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "");
        }

        try {
            const parsed = JSON.parse(jsonStr);
            if (Array.isArray(parsed)) return parsed;
            if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;
            return [parsed]; 
        } catch (parseErr) {
            console.error("Lỗi Parse JSON từ Gemini:", parseErr, "Raw Text:", text);
            throw new HttpsError('internal', "Lỗi định dạng dữ liệu từ AI.");
        }

    } catch (error) {
        console.error("CRITICAL ERROR:", error.message);
        throw new HttpsError('internal', error.message);
    }
});