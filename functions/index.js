const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const axios = require("axios");

const apiKey = defineSecret("DEEPSEEK_API_KEY");

exports.generateQuestions = onCall({ 
  secrets: [apiKey],
  timeoutSeconds: 120,
  memory: "512MiB",
  region: "us-central1"
}, async (request) => {
  try {
    const prompt = request.data.prompt;
    if (!prompt) {
        throw new HttpsError('invalid-argument', 'Client không gửi prompt.');
    }

    const DEEPSEEK_API_KEY = apiKey.value();
    if (!DEEPSEEK_API_KEY) {
        throw new HttpsError('failed-precondition', 'Chưa cấu hình DEEPSEEK_API_KEY.');
    }

    const url = "https://api.deepseek.com/chat/completions";

    // 1. SỬA PROMPT: Bổ sung cấu trúc cho Sorting và Matching
    const jsonInstruction = `
    YÊU CẦU OUTPUT:
    Trả về đúng 1 JSON Object có cấu trúc: { "questions": [ ... ] }.
    Tuyệt đối không viết thêm lời dẫn hay markdown.
    
    Cấu trúc mỗi câu hỏi (object) trong mảng "questions" tùy theo "type":

    1. Dạng Trắc nghiệm ("type": "mcq"):
    {
      "type": "mcq",
      "text": "Câu hỏi...",
      "options": ["A", "B", "C", "D"],
      "correctVal": "A",
      "explanation": "Giải thích...",
      "level": 2, "topic": "arithmetic"
    }

    2. Dạng Sắp xếp ("type": "sorting"):
    {
      "type": "sorting",
      "text": "Sắp xếp các số sau từ bé đến lớn...",
      "items": ["50", "10", "30", "40"], // Danh sách các phần tử cần xếp
      "correctOrder": ["10", "30", "40", "50"], // Thứ tự đúng
      "explanation": "Giải thích...",
      "level": 2, "topic": "arithmetic"
    }

    3. Dạng Ghép cặp ("type": "matching"):
    {
      "type": "matching",
      "text": "Ghép phép tính với kết quả đúng",
      "pairs": [
        {"left": "2 + 2", "right": "4"},
        {"left": "3 x 3", "right": "9"},
        {"left": "10 - 5", "right": "5"}
      ],
      "explanation": "Giải thích...",
      "level": 2, "topic": "arithmetic"
    }

    4. Các dạng khác ("fill_blank", "comparison"): Dùng cấu trúc giống "mcq" nhưng "correctVal" là đáp án đúng.
    `;

    const fullPrompt = jsonInstruction + "\n\n" + "NỘI DUNG YÊU CẦU:\n" + prompt;

    const response = await axios.post(url, {
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "Bạn là chuyên gia tạo đề toán tiểu học. Chỉ trả về JSON." },
        { role: "user", content: fullPrompt }
      ],
      response_format: { type: "json_object" }, 
      temperature: 0.4
    }, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      }
    });

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) throw new HttpsError('internal', "DeepSeek trả về rỗng.");

    // Parse JSON an toàn
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "");
    }

    try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.questions && Array.isArray(parsed.questions)) {
            return parsed.questions;
        }
        if (Array.isArray(parsed)) return parsed;
        
        // Fallback
        return [parsed]; 

    } catch (parseErr) {
        console.error("Lỗi Parse JSON:", parseErr, "Raw:", jsonStr);
        throw new HttpsError('internal', "Lỗi định dạng dữ liệu từ AI.");
    }

  } catch (error) {
    console.error("CRITICAL ERROR:", error.message);
    throw new HttpsError('internal', error.message);
  }
});