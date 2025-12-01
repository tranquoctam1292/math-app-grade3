const { onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
// Lưu ý: Nếu axios chưa cài được thì dòng này sẽ gây crash.
// Hãy chắc chắn đã chạy npm install axios trong thư mục functions
const axios = require("axios");

const apiKey = defineSecret("GEMINI_API_KEY");

exports.generateQuestions = onCall({ 
  secrets: [apiKey],
  timeoutSeconds: 120,
  memory: "512MiB",
  region: "us-central1"
}, async (request) => {
  // --- DEBUG MODE: Bắt toàn bộ lỗi để trả về Client ---
  try {
    console.log("--- START FUNCTION ---");

    const prompt = request.data.prompt;
    if (!prompt) throw new Error("Client không gửi prompt lên.");

    const GEMINI_API_KEY = apiKey.value();
    if (!GEMINI_API_KEY) throw new Error("Chưa set Secret GEMINI_API_KEY trên Firebase.");

    const MODEL_NAME = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

    const responseSchema = {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          type: { type: "STRING", enum: ["mcq", "fill_blank", "comparison", "matching", "sorting"] },
          text: { type: "STRING" },
          options: { type: "ARRAY", items: { type: "STRING" } },
          correctVal: { type: "STRING" },
          items: { type: "ARRAY", items: { type: "STRING" } },
          correctOrder: { type: "ARRAY", items: { type: "STRING" } },
          pairs: { type: "ARRAY", items: { type: "OBJECT", properties: { left: {type: "STRING"}, right: {type: "STRING"} } } },
          explanation: { type: "STRING" },
          level: { type: "NUMBER" },
          topic: { type: "STRING" },
          svgContent: { type: "STRING" }
        },
        required: ["text", "type", "explanation", "level", "topic"]
      }
    };

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
        responseSchema: responseSchema
      }
    };

    // Gọi Gemini
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    const data = response.data;
    if (!data.candidates || !data.candidates[0].content) {
      return { debug_error: true, message: "Gemini trả về data rỗng", raw: data };
    }

    let text = data.candidates[0].content.parts[0].text;
    
    // Làm sạch JSON
    text = text.trim();
    if (text.startsWith("```json")) text = text.replace(/^```json/, "").replace(/```$/, "");
    else if (text.startsWith("```")) text = text.replace(/^```/, "").replace(/```$/, "");

    try {
      const result = JSON.parse(text);
      return result; // Thành công!
    } catch (parseErr) {
      return { debug_error: true, message: "Lỗi Parse JSON", raw_text: text };
    }

  } catch (error) {
    // TRẢ LỖI VỀ CLIENT ĐỂ ĐỌC (Thay vì crash 500)
    console.error("CRITICAL ERROR:", error);
    return {
      debug_error: true,
      name: error.name,
      message: error.message,
      stack: error.stack,
      axios_response: error.response ? error.response.data : "No Response Data"
    };
  }
});