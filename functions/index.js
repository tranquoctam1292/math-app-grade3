const { onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const fetch = require("node-fetch");

// Định nghĩa secret để lưu API Key an toàn
const apiKey = defineSecret("GEMINI_API_KEY");

exports.generateQuestions = onCall({ secrets: [apiKey] }, async (request) => {
  // Lấy data từ client gửi lên
  const prompt = request.data.prompt;

  if (!prompt) {
    throw new Error("Missing prompt");
  }

  const GEMINI_API_KEY = apiKey.value();
  const MODEL_NAME = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.45,
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            "text": { "type": "STRING" },
            "options": { "type": "ARRAY", "items": { "type": "STRING" } },
            "correctVal": { "type": "STRING" },
            "explanation": { "type": "STRING" },
            "level": { "type": "NUMBER" },
            "topic": { "type": "STRING" }
          },
          required: ["text", "options", "correctVal", "explanation", "level", "topic"]
        }
      }
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
    
    // Trả kết quả JSON parse sẵn về cho client
    return JSON.parse(text);
  } catch (error) {
    console.error("Cloud Function Error:", error);
    // Ném lỗi về client để client tự xử lý (fallback offline)
    throw new Error("Failed to generate questions.");
  }
});