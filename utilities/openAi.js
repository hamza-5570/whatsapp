import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Store your key securely
});

const sendPromptWithEmail = async (query) => {
  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4", // or "gpt-3.5-turbo"
    messages: [
      { role: "system", content: "You are a professional email assistant." },
      { role: "user", content: query.fullPrompt },
    ],
  });

  return chatCompletion.choices[0].message.content;
};

export default sendPromptWithEmail;
