import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);

export async function generateContent(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// async function test() {
//   const prompt = "Write a short, funny haiku about debugging JavaScript.";
//   try {
//     const response = await generateContent(prompt);
//     console.log("📝 Gemini Response:");
//     console.log(response);
//   } catch (err) {
//     console.error("❌ Test failed:", err);
//   }
// }

// test();