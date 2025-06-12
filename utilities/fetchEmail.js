import encrypt from "./encrypt.js";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import userService from "../services/userServices.js";
import emailService from "../services/mailServices.js";
import tokenServices from "../services/tokenServices.js";
import dotenv from "dotenv";
dotenv.config();
const oAuthClient = new OAuth2Client(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);
const fetchLatestEmailsForAllUsers = async () => {
  const tokens = await tokenServices.getAllTokens();

  tokens.map(async (token) => {
    try {
      oAuthClient.setCredentials({
        refresh_token: token.dataValues.refresh_token,
      });
      const { credentials } = await oAuthClient.refreshAccessToken();

      await tokenServices.updateToken(
        { user_id: token.dataValues.user_id },
        {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token,
        }
      );

      const oAuth2Client = new google.auth.OAuth2();
      oAuth2Client.setCredentials({ access_token: credentials.access_token });
      const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

      const latestCreatedAt = await emailService.getEmailById({
        user_id: token.dataValues.user_id,
      });

      const lastFetched = latestCreatedAt
        ? Math.floor(new Date(latestCreatedAt.created_at).getTime() / 1000)
        : null;
      const res = await gmail.users.messages.list({
        userId: "me",
        // Fetch emails newer than 1 hour
        q: "newer_than:1d",
        maxResults: 50,
      });
      const messages = res.data.messages || [];
      const newEmails = [];
      let maxReceivedAt = lastFetched;

      for (const msg of messages) {
        const fullMsg = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "full",
        });

        const headers = fullMsg.data.payload.headers || [];
        const getHeader = (name) =>
          headers.find((h) => h.name.toLowerCase() === name.toLowerCase())
            ?.value;

        const dateHeader = getHeader("Date");
        if (!dateHeader) continue;

        const receivedAt = new Date(dateHeader);
        if (lastFetched && receivedAt.getTime() >= lastFetched * 1000) continue;

        maxReceivedAt = Math.max(maxReceivedAt || 0, receivedAt.getTime());

        const fromHeader = getHeader("From");
        const match = fromHeader?.match(/(.*)<(.*)>/);
        const senderName = match?.[1]?.trim() || null;
        const senderEmail = match?.[2]?.trim() || fromHeader;

        const bodyPart =
          fullMsg.data.payload?.parts?.find(
            (part) => part.mimeType === "text/plain"
          ) || fullMsg.data.payload;

        const body = Buffer.from(bodyPart?.body?.data || "", "base64").toString(
          "utf8"
        );

        newEmails.push({
          email_id: msg.id,
          received_at: receivedAt,
          body: encrypt(body),
          subject: getHeader("Subject"),
          "Sender email": senderEmail,
          sender: senderName,
          messagelink: `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
          user_id: token.dataValues.user_id,
        });
      }

      for (const email of newEmails) {
        await emailService.createEmail(email);
      }

      console.log(
        `Fetched ${newEmails.length} new emails for token ${token.dataValues.user_id}`
      );
    } catch (err) {
      console.error(
        "Error fetching emails for token:",
        token.dataValues.user_id,
        err
      );
    }
  });

  // await Promise.all(tasks);
};

export default fetchLatestEmailsForAllUsers;
