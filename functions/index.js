const { onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const axios = require("axios");

const apiKey = defineSecret("GEMINI_API_KEY");

exports.generateQuestions = onCall({ 
  secrets: [apiKey],
  timeoutSeconds: 120, // Tăng thời gian chờ lên 120s
  memory: "512MiB",
  region: "us-central1"
}, async (request) => {
  try {
    const prompt = request.data.prompt;
    if (!prompt) return { error: "Client không gửi prompt." };

    const GEMINI_API_KEY = apiKey.value();
    if (!GEMINI_API_KEY) return { error: "Chưa cấu hình GEMINI_API_KEY." };

    // Bạn có thể giữ gemini-2.0-flash nếu muốn, hoặc đổi sang gemini-1.5-flash để ổn định hơn
    const MODEL_NAME = "gemini-2.0-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

    // --- THAY ĐỔI QUAN TRỌNG ---
    // Thay vì dùng responseSchema (gây lỗi 400), ta hướng dẫn JSON ngay trong prompt.
    const jsonInstruction = `
    YÊU CẦU OUTPUT:
    Hãy trả về một MẢNG JSON (JSON Array) thuần túy, không có markdown block (như \`\`\`json).
    Mỗi phần tử trong mảng là một object câu hỏi với các trường bắt buộc sau:
    - "id": (number) ID tự tăng từ 0
    - "type": (string) Một trong ["mcq", "fill_blank", "comparison", "matching", "sorting"]
    - "text": (string) Nội dung câu hỏi
    - "options": (array string) 4 phương án trả lời (nếu là mcq)
    - "correctVal": (string) Đáp án đúng
    - "explanation": (string) Giải thích ngắn gọn
    - "level": (number) Độ khó (2, 3 hoặc 4)
    - "topic": (string) Chủ đề (ví dụ: "arithmetic")
    `;

    const fullPrompt = jsonInstruction + "\n\n" + "NỘI DUNG YÊU CẦU:\n" + prompt;

    const payload = {
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json", // Bắt buộc trả về JSON
        temperature: 0.4
      }
      // Đã bỏ responseSchema để tránh lỗi 400 Bad Request
    };

    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    const data = response.data;
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) throw new Error("Gemini không trả về nội dung.");

    // Xử lý sạch chuỗi JSON (Tìm mảng [...] đầu tiên để tránh lỗi cú pháp)
    let jsonStr = content.trim();
    const match = jsonStr.match(/\[[\s\S]*\]/);
    if (match) {
        jsonStr = match[0];
    }

    try {
        const questions = JSON.parse(jsonStr);
        return questions; // Trả về mảng câu hỏi thành công
    } catch (parseErr) {
        console.error("Lỗi parse JSON:", parseErr, "Raw:", jsonStr);
        throw new Error("AI trả về format không đúng chuẩn JSON.");
    }

  } catch (error) {
    console.error("Function Error:", error.response?.data || error.message);
    // Trả về lỗi chi tiết để Client biết (và chuyển sang backup)
    return {
        error: true,
        message: error.message,
        details: error.response?.data
    };
  }
});