// --- API CALL WITH RETRY & SAFETY ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 

export const callGemini = async (prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  
  const safetySettings = [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
  ];

  const payload = { 
      contents: [{ parts: [{ text: prompt }] }], 
      generationConfig: { 
        responseMimeType: "application/json", 
        temperature: 0.2, // Tăng nhẹ nhiệt độ để đa dạng hơn
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
      },
      safetySettings: safetySettings
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  for (let i = 0; i < 3; i++) { // Giảm số lần thử lại để nhanh hơn
      try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
        
        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
           if (data.candidates?.[0]?.finishReason === "SAFETY") {
               throw new Error("Bị chặn bởi bộ lọc an toàn của AI.");
           }
           throw new Error("AI không thể sinh nội dung.");
        }
        
        // Cố gắng làm sạch và parse JSON
        const jsonMatch = text.match(/\[.*\]/s);
        if (!jsonMatch) {
            throw new Error("Không tìm thấy chuỗi JSON hợp lệ trong phản hồi.");
        }
        
        return JSON.parse(jsonMatch[0]); 
      } catch (error) {
        console.warn(`Lần thử ${i+1} thất bại:`, error.message);
        if (i === 2) {
            console.error("Lỗi API Gemini cuối cùng:", error);
            return null;
        }
        await delay(Math.pow(2, i) * 1000);
      }
  }
  return null;
};
