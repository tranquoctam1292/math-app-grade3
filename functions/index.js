const { onCall } = require("firebase-functions/v2/https");
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
    if (!prompt) return { error: "Client không gửi prompt." };

    const DEEPSEEK_API_KEY = apiKey.value();
    if (!DEEPSEEK_API_KEY) return { error: "Chưa cấu hình DEEPSEEK_API_KEY." };

    const url = "https://api.deepseek.com/chat/completions";

    // 1. SỬA PROMPT: Yêu cầu rõ ràng trả về Object có key là "questions"
    const jsonInstruction = `
    YÊU CẦU OUTPUT:
    Hãy trả về một JSON OBJECT duy nhất (không phải Array, không có markdown).
    Cấu trúc bắt buộc:
    {
      "questions": [
        {
          "id": 0,
          "type": "mcq", 
          "text": "Câu hỏi...",
          "options": ["A", "B", "C", "D"],
          "correctVal": "A",
          "explanation": "Giải thích...",
          "level": 2,
          "topic": "arithmetic"
        }
      ]
    }
    
    Lưu ý:
    - "type" chọn trong: ["mcq", "fill_blank", "comparison", "matching", "sorting"]
    - "level" từ 2 đến 4.
    `;

    const fullPrompt = jsonInstruction + "\n\n" + "NỘI DUNG YÊU CẦU:\n" + prompt;

    const payload = {
      model: "deepseek-chat",
      messages: [
        { 
          role: "system", 
          content: "Bạn là chuyên gia toán học tiểu học. Bạn chỉ trả về JSON hợp lệ." 
        },
        { 
          role: "user", 
          content: fullPrompt 
        }
      ],
      // DeepSeek ép kiểu JSON Object rất tốt, nên dùng nó để tránh lỗi cú pháp
      response_format: { type: "json_object" }, 
      temperature: 0.4
    };

    const response = await axios.post(url, payload, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      }
    });

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("DeepSeek không trả về nội dung.");

    // 2. Xử lý JSON an toàn hơn
    let jsonStr = content.trim();
    // Đôi khi DeepSeek vẫn bọc trong markdown ```json ... ```, cần lọc bỏ
    if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "");
    }

    try {
        const parsed = JSON.parse(jsonStr);
        
        // Luôn trả về mảng câu hỏi
        if (parsed.questions && Array.isArray(parsed.questions)) {
            return parsed.questions;
        } else if (Array.isArray(parsed)) {
            return parsed;
        }
        
        // Nếu cấu trúc lạ, log ra để debug
        console.error("Cấu trúc JSON không khớp:", JSON.stringify(parsed).slice(0, 100));
        throw new Error("AI trả về JSON nhưng thiếu trường 'questions'.");

    } catch (parseErr) {
        console.error("Lỗi parse JSON:", parseErr, "Raw:", jsonStr);
        throw new Error("AI trả về dữ liệu lỗi format.");
    }

  } catch (error) {
    console.error("Function Error:", error.message);
    
    // Trả về object lỗi chuẩn để Client không bị lỗi "cannot be decoded"
    // Lưu ý: Không gửi nguyên error object vì nó có thể chứa circular reference
    return {
        debug_error: true,
        message: error.message,
        details: error.response?.data ? JSON.stringify(error.response.data) : "No details"
    };
  }
});