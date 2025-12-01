const { onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const fetch = require("node-fetch");

const apiKey = defineSecret("GEMINI_API_KEY");

exports.generateQuestions = onCall({ secrets: [apiKey] }, async (request) => {
  const prompt = request.data.prompt;

  if (!prompt) {
    throw new Error("Missing prompt");
  }

  const GEMINI_API_KEY = apiKey.value();
  const MODEL_NAME = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

  // --- CẬP NHẬT SCHEMA MỚI ---
  const responseSchema = {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        // Thêm trường type để định danh loại câu hỏi
        type: { type: "STRING", enum: ["mcq", "fill_blank", "comparison", "matching", "sorting"] },
        text: { type: "STRING" },
        // Các trường tùy chọn (Optional) tùy theo loại câu hỏi
        options: { type: "ARRAY", items: { type: "STRING" } }, // Dùng cho MCQ, Comparison
        correctVal: { type: "STRING" }, // Dùng cho MCQ, Fill Blank, Comparison
        items: { type: "ARRAY", items: { type: "STRING" } }, // Dùng cho Sorting
        correctOrder: { type: "ARRAY", items: { type: "STRING" } }, // Dùng cho Sorting (Đáp án)
        pairs: { // Dùng cho Matching
          type: "ARRAY", 
          items: { 
            type: "OBJECT", 
            properties: { left: {type: "STRING"}, right: {type: "STRING"} }
          } 
        },
        explanation: { type: "STRING" },
        level: { type: "NUMBER" },
        topic: { type: "STRING" },
        svgContent: { type: "STRING" } // Hỗ trợ vẽ hình học sau này
      },
      required: ["text", "type", "explanation", "level", "topic"]
    }
  };

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2, // Tăng nhẹ để AI sáng tạo hơn trong việc tạo đề
      responseSchema: responseSchema
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Cloud Function Error:", error);
    throw new Error("Failed to generate questions.");
  }
});