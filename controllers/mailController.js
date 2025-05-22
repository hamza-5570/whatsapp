import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();
import TurndownService from "turndown";
import Response from "../utilities/response.js";
import messageUtil from "../utilities/message.js";
import { OAuth2Client } from "google-auth-library";
import tokenServices from "../services/tokenServices.js";
import emailservice from "../services/mailServices.js";
import labelsService from "../services/labelsServices.js";
import cleanEmailWithClaude from "../utilities/claude.js";
import sendPromptWithEmail from "../utilities/openAi.js";
const oAuthClient = new OAuth2Client(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);
// Must match your OAuth redirect URI
class MailController {
  sendMail = async (req, res) => {
    try {
      // 1. Get token from DB
      const token = await tokenServices.getTokenByUserId({
        user_id: req.body.user_id,
      });

      // 2. Refresh token
      oAuthClient.setCredentials({
        refresh_token: token.dataValues.refresh_token,
      });
      const { credentials } = await oAuthClient.refreshAccessToken();

      // 3. Update token in DB
      await tokenServices.updateToken(
        { user_id: req.body.user_id },
        {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token,
        }
      );

      // 4. Init Gmail client
      const oAuth2Client = new google.auth.OAuth2();
      oAuth2Client.setCredentials({ access_token: credentials.access_token });
      const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

      // ------------------------
      // 5. FETCH LABELS & SAVE
      // ------------------------
      const labelResponse = await gmail.users.labels.list({ userId: "me" });
      const allLabels = labelResponse.data.labels || [];
      // console.log("Fetched Labels:", allLabels);

      const filteredLabels = allLabels.filter(
        (label) => !label.name.startsWith("[Imap]/") && label.name !== "UNREAD"
      );

      const labelIds = filteredLabels.map((label) => label.name);
      // console.log("Filtered Label IDs:", labelIds);

      // Save to DB
      await labelsService.createLabels({
        user_id: req.body.user_id,
        labels: labelIds,
        created_at: new Date(),
      });

      // -------------------------------
      // 6. Helper: FETCH EMAILS
      // -------------------------------
      async function fetchEmails(labelId = "INBOX", maxResults = 10) {
        const emailList = [];
        let res;

        try {
          // Special handling for category labels
          if (labelId.startsWith("CATEGORY_")) {
            console.log("Fetching category label emails", labelId);
            const category = labelId.replace("CATEGORY_", "").toLowerCase();
            console.log("Category:", category);
            res = await gmail.users.messages.list({
              userId: "me",
              q: `category:${category}`,
              maxResults,
            });
          } else {
            res = await gmail.users.messages.list({
              userId: "me",
              labelIds: [labelId],
              maxResults,
            });
          }

          const messages = res.data.messages || [];

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

            const fromHeader = getHeader("From");
            const deliveredTo = getHeader("Delivered-To");
            const subject = getHeader("Subject");
            const date = getHeader("Date");

            const match = fromHeader?.match(/(.*)<(.*)>/);
            const senderName = match?.[1]?.trim() || null;
            const senderEmail = match?.[2]?.trim() || fromHeader;

            const bodyPart =
              fullMsg.data.payload?.parts?.find(
                (part) => part.mimeType === "text/plain"
              ) || fullMsg.data.payload;

            const body = Buffer.from(
              bodyPart?.body?.data || "",
              "base64"
            ).toString("utf8");
            const cleanedBody = await cleanEmailWithClaude({
              rawEmail: body,
              from: senderName,
              date: date,
            });

            const emailObject = {
              email_id: msg.id,
              received_at: date,
              body: cleanedBody,
              subject: subject,
              "Sender email": senderEmail,
              sender: senderName,
              messagelink: `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
              labels:
                fullMsg.data.labelIds?.[fullMsg.data.labelIds.length - 1] ||
                labelId,
              deliverdto: deliveredTo,
              user_id: req.body.user_id,
            };

            emailList.push(emailObject);
          }
        } catch (err) {
          console.error(
            `Error fetching emails for label ${labelId}:`,
            err.message
          );
        }

        return emailList;
      }

      // -------------------------------
      // 7. Fetch and Save INBOX Emails
      // -------------------------------
      const inboxEmails = await fetchEmails("INBOX", 10);
      for (const email of inboxEmails) {
        await emailservice.createEmail(email);
      }

      // Send inbox response immediately
      Response.success(res, messageUtil.OK, inboxEmails);

      // ------------------------------------
      // 8. BACKGROUND: FETCH OTHER LABELS
      // ------------------------------------
      (async () => {
        for (const labelId of labelIds) {
          try {
            const emails = await fetchEmails(labelId, 50);
            for (const email of emails) {
              await emailservice.createEmail(email); // Handle duplicates in service
            }
          } catch (err) {
            console.error(
              `Background error for label ${labelId}:`,
              err.message
            );
          }
        }
      })();
    } catch (error) {
      console.error("sendMail error:", error);
      return Response.serverError(res, error);
    }
  };

  CreateDraft = async (req, res) => {
    try {
      const { user_id } = req.body;

      // 1. Get token from DB
      const token = await tokenServices.getTokenByUserId({
        user_id: user_id,
      });

      // 2. Refresh token
      oAuthClient.setCredentials({
        refresh_token: token.dataValues.refresh_token,
      });
      const { credentials } = await oAuthClient.refreshAccessToken();

      // 3. Update token in DB
      await tokenServices.updateToken(
        { user_id: user_id },
        {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token,
        }
      );

      // 4. Init Gmail client
      const oAuth2Client = new google.auth.OAuth2();
      oAuth2Client.setCredentials({ access_token: credentials.access_token });
      const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
      // give email to openai

      const emailResponse = await sendPromptWithEmail({
        subject: req.body.subject,
        body: req.body.body,
        sender: req.body.Sender_email,
        date: req.body.date,
        emailInstructions: req.body.emailInstructions,
        textLength: req.body.Text_length,
        writingTone: req.body.Writing_tone,
      });
      const turndownService = new TurndownService();
      const markdown = turndownService.turndown(emailResponse);
      console.log("Email Response:", markdown);
      // 5. Create draft
      const rawMessage = Buffer.from(
        `Subject: ${req.body.subject}\n\n${emailResponse}`
      ).toString("base64");

      const draftResponse = await gmail.users.drafts.create({
        userId: "me",
        requestBody: {
          message: {
            raw: rawMessage,
          },
        },
      });

      console.log("Draft created:", draftResponse.data);
      // update email status
      await emailservice.updateEmail(
        { draft_reply: markdown },
        {
          email_id: req.body.email_id,
          user_id,
        }
      );

      Response.success(res, messageUtil.OK);
    } catch (error) {
      console.error("CreateDraft error:", error);
      return Response.serverError(res, error);
    }
  };
}

export default new MailController();
