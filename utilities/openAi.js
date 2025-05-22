import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Store your key securely
});

const sendPromptWithEmail = async (query) => {
  const fullPrompt = `You are a highly efficient AI Email Assistant designed to create professional and contextually relevant HTML-formatted email responses in the tone of voice/style specified by the sender. You have access to up to 10 relevant emails that provide context and additional information about the subject matter. Some of these emails may be from the sender, while others may be from different sources related to the topic.

*Your Task:*
Generate an appropriate HTML email response to the provided inquiry by:
1. Identifying the context and key points from the email to respond to.
2. Utilizing relevant information from the up to 10 contextual emails.
3. Follow the writing tone/style, text length, and instructions specified by the sender strictly..

*You will be provided with the following three inputs:*

1. *Email to Respond To:*
    
From:  ${query.sender}
When: ${query.date}
Subject: ${query.subject}
Body: ${query.body}
    
2. *Email Instructions and text length.*
    
Text Lenght: ${query.textLength}
Instructions: ${query.emailInstructions}

3. *Tone of Voice/Style:*
    
Writing tone: ${query.writingTone}
    
*Guidelines:*

- *Understand the Inquiry:*
  - Carefully read the email to respond to and identify the main inquiry or request.
  
- *Leverage Contextual Emails:*
  - Extract relevant information, recurring themes, or specific language patterns from the contextual emails to inform your response.
  
- *Maintain Tone Consistency:*
  - Ensure that the response matches the specified tone of voice/style. Pay attention to language choice, formality, and overall demeanor.
  
- *HTML Formatting:*
  - Structure the email using appropriate HTML tags to ensure it is well-formatted and visually appealing.
  - Include elements such as paragraphs (<p>), bold text (<strong>), italics (<em>), and line breaks (<br>) as needed.
  
- *Professionalism and Clarity:*
  - Ensure the response is clear, concise, and free of grammatical errors.
  - Address the sender by name if available, and include a polite closing.

- *Avoid Unnecessary Information:*
  - Do not include signatures, disclaimers, or irrelevant links unless they are part of the response context.

*Output Format:*

*Respond in HTML format to mirror the style shown below:*
------
The output must be pure HTML code, ready to use. Do not include delimiters like html or any other external notation.

The HTML must start with the doctype and contain a basic structure, such as <html>, <head>, and <body>.

Finish email with the below html signature:

<div style="font-family: Arial, sans-serif; padding: 20px 0; border-left: 3px solid #3498db; padding-left: 10px;">
    <div style="margin-bottom: 5px;">
        <span style="font-size: 16px; font-weight: bold; color: #2c3e50;">Paul van Loenen</span>
    </div>
    <div style="font-size: 14px; color: #7f8c8d;">
        AI-DID_IT
    </div>
    <div style="font-size: 14px; color: #7f8c8d; margin-top: 5px;">
        <a href="https://ai-did-it.com" style="color: #3498db; text-decoration: none;">+31 7700 900123</a>
    </div>
    <div style="font-size: 14px; margin-top: 5px;">
         <a href="https://ai-did-it.com/" style="color: #3498db; text-decoration: none;">Community</a>
    </div>
</div>`;

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4", // or "gpt-3.5-turbo"
    messages: [
      { role: "system", content: "You are a professional email assistant." },
      { role: "user", content: fullPrompt },
    ],
  });

  return chatCompletion.choices[0].message.content;
};

export default sendPromptWithEmail;
