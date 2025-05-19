import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

async function cleanEmailWithClaude({ rawEmail, from, date }) {
  try {
    const response = await axios.post(
      CLAUDE_API_URL,
      {
        model: "claude-3-haiku-20240307",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
You are an AI assistant tasked with cleaning up raw email data. Please process the following email and provide a cleaned version by performing the following actions:

1. Eliminate Signatures and Disclaimers: Delete any signatures, disclaimers, or automated messages typically found at the end of emails. Do not remove WHO the email is from, however.
2. Strip HTML Tags: Remove all HTML tags, leaving only plain text.
3. Exclude Irrelevant Links: Remove any tracking links or unsubscribe links that are not part of the main message.
4. Preserve the Main Content: Retain the primary message content, including greetings and the main body of the email.

You MUST include who it is from and the date it was sent. that is critically important. 

Respond in plain text only.

Raw Email Content:
From: ${from}
Date: ${date}

${rawEmail}
`,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.content[0].text || rawEmail; // fallback
  } catch (error) {
    console.error(
      "Claude cleaning failed:",
      error.response?.data || error.message
    );
    return rawEmail; // fallback to raw if error occurs
  }
}

export default cleanEmailWithClaude;
