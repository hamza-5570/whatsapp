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
import { prompt, promptForReply } from "../utilities/prompt.js";
import encrypt from "../utilities/encrypt.js";
const oAuthClient = new OAuth2Client(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);
// Must match your OAuth redirect URI
class MailController {
  GetMail = async (req, res) => {
    try {
      // 1. Get token from DB
      const token = await tokenServices.getTokenByUserId({
        user_id: req.body.user_id,
      });
      console.log("Token fetched:", token);
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

      // Create cleaned list of labels (removing [Imap]/ and CATEGORY_ only)
      const cleanedAllLabels = allLabels.filter(
        (label) =>
          !label.name.startsWith("[Imap]/") && !label.id.startsWith("CATEGORY_")
      );

      // Save only non-default/system labels (you can use Set or just reuse the list)
      const systemLabels = new Set([
        "INBOX",
        "SENT",
        "TRASH",
        "DRAFT",
        "SPAM",
        "STARRED",
        "IMPORTANT",
        "CHAT",
        "UNREAD",
      ]);

      const filteredLabels = cleanedAllLabels.filter(
        (label) => !systemLabels.has(label.id)
      );

      // This is for saving to DB
      const labelIdsToSave = filteredLabels.map((label) => ({
        id: label.id,
        name: label.name,
      }));

      await labelsService.createLabels({
        user_id: req.body.user_id,
        labels: labelIdsToSave,
        created_at: new Date(),
      });

      // This is for email fetching (includes system labels but excludes Imap/CATEGORY_)
      const allLabelIds = cleanedAllLabels.map((label) => label.id);
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

            // Recursive function to find all attachment parts
            function findAttachments(parts = []) {
              let attachments = [];
              for (const part of parts) {
                if (part.filename && part.body && part.body.attachmentId) {
                  attachments.push({
                    filename: part.filename,
                    mimeType: part.mimeType,
                    attachmentId: part.body.attachmentId,
                  });
                }
                if (part.parts) {
                  attachments = attachments.concat(findAttachments(part.parts));
                }
              }
              return attachments;
            }

            const attachmentsMeta = findAttachments(
              fullMsg.data.payload.parts || []
            );

            // Download actual attachment content
            const attachments = [];
            for (const att of attachmentsMeta) {
              try {
                const attachmentData =
                  await gmail.users.messages.attachments.get({
                    userId: "me",
                    messageId: msg.id,
                    id: att.attachmentId,
                  });

                attachments.push({
                  filename: att.filename,
                  mimeType: att.mimeType,
                  size: attachmentData.data.size,
                  data: attachmentData.data.data, // base64-encoded
                });
              } catch (err) {
                console.error(
                  "Attachment fetch failed:",
                  att.filename,
                  err.message
                );
              }
            }

            const emailObject = {
              email_id: msg.id,
              received_at: date,
              body: encrypt(cleanedBody), // Encrypt the body
              subject: subject,
              "Sender email": senderEmail,
              sender: senderName,
              messagelink: `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
              labels:
                fullMsg.data.labelIds?.[fullMsg.data.labelIds.length - 1] ||
                allLabelIds,
              deliverdto: deliveredTo,
              user_id: req.body.user_id,
              attachments, // ✅ Store as array in JSONB field
            };

            emailList.push(emailObject);
          }
        } catch (err) {
          console.error(
            `Error fetching emails for label ${allLabelIds}:`,
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
        console.log("Fetching emails for all labels in the background...");
        for (const labelId of allLabelIds) {
          console.log("Fetching emails for label:", labelId);
          try {
            const emails = await fetchEmails(labelId, 50);
            let count = 0;
            console.log("Fetched emails:", count++);
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

      const fullPrompt = prompt({
        subject: req.body.subject,
        body: req.body.content,
        sender: req.body.Sender_email,
        date: req.body.date,
        emailInstructions: req.body.Email_Instructions,
        textLength: req.body.Text_length,
        writingTone: req.body.Writing_tone,
        user_name: req.body.user_name,
      });
      const emailResponse = await sendPromptWithEmail({
        fullPrompt: fullPrompt,
      });
      const turndownService = new TurndownService();
      const markdown = turndownService.turndown(emailResponse);
      console.log("Email Response:", markdown);
      // 5. Create draft
      const rawMessage = Buffer.from(
        `To: ${req.body.Sender_email}\r\n` +
          `Subject: ${req.body.subject}\r\n` +
          `Content-Type: text/html; charset="UTF-8"\r\n\r\n` +
          emailResponse
      )
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const draftResponse = await gmail.users.drafts.create({
        userId: "me",
        requestBody: {
          message: {
            raw: rawMessage,
          },
        },
      });

      console.log("Draft created:", draftResponse.data);

      // create email supabase
      const newmail = await emailservice.createEmail({
        email_id: draftResponse.data.id,
        body: encrypt(markdown), // Encrypt the body
        subject: req.body.subject,
        "Sender email": req.body.Deliverdto,
        messagelink: `https://mail.google.com/mail/u/0/#inbox/${req.body.email_id}`,
        labels: "DRAFT",
        deliverdto: req.body.Sender_email,
        user_id: user_id,
      });
      console.log("Draft created:", newmail);
      // update email
      const update = await emailservice.updateEmail(
        { id: req.body.id },
        {
          draft_reply: encrypt(markdown), // Encrypt the body
          draft_email_id: draftResponse.data.id,
        }
      );
      console.log("Draft updated:", update);
      Response.success(res, messageUtil.OK);
    } catch (error) {
      console.error("CreateDraft error:", error);
      return Response.serverError(res, error);
    }
  };

  // if daraf exist update it, if not create it

  UpdateDraft = async (req, res) => {
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

      // get email
      const email = await emailservice.getEmailById({
        id: req.body.id,
      });

      if (email.dataValues.draft_email_id) {
        // update draft
        const rawMessage = Buffer.from(
          `To: ${req.body.Deliverdto}\r\n` +
            `Subject: ${req.body.subject}\r\n` +
            `Content-Type: text/html; charset="UTF-8"\r\n\r\n` +
            req.body.content
        )
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        const draftResponse = await gmail.users.drafts.update({
          userId: "me",
          id: email.dataValues.draft_email_id,
          requestBody: {
            message: {
              raw: rawMessage,
            },
          },
        });

        console.log("Draft updated:", draftResponse.data);
        // update email supabase
        const update = await emailservice.updateEmail(
          {
            id: req.body.id,
          },
          {
            draft_reply: encrypt(req.body.content), // Encrypt the body
          }
        );
        console.log("Draft updated in DB:", update);
        Response.success(res, messageUtil.OK);
      } else {
        // create draft
        const rawMessage = Buffer.from(
          `To: ${req.body.Deliverdto}\r\n` +
            `Subject: ${req.body.subject}\r\n` +
            `Content-Type: text/html; charset="UTF-8"\r\n\r\n` +
            req.body.content
        )
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
        const draftResponse = await gmail.users.drafts.create({
          userId: "me",
          requestBody: {
            message: {
              raw: rawMessage,
            },
          },
        });
        console.log("Draft created:", draftResponse.data);
        // create email supabase
        const newmail = await emailservice.createEmail({
          email_id: draftResponse.data.id,
          body: encrypt(req.body.content), // Encrypt the body
          subject: req.body.subject,
          "Sender email": req.body.Deliverdto,
          messagelink: `https://mail.google.com/mail/u/0/#inbox/${req.body.email_id}`,
          labels: "DRAFT",
          deliverdto: req.body.Sender_email,
          user_id: user_id,
        });
        console.log("Draft created:", newmail);
        // update email
        const update = await emailservice.updateEmail(
          { id: req.body.id },
          {
            draft_reply: encrypt(req.body.content), // Encrypt the body
            draft_email_id: draftResponse.data.id,
          }
        );
        console.log("Draft updated:", update);
        Response.success(res, messageUtil.OK);
      }
    } catch (error) {
      console.error("updateDraft error:", error);
      return Response.serverError(res, error);
    }
  };

  sendEmail = async (req, res) => {
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

      // let fullprompt = promptForReply({ body: req.body.edited_draft_reply });
      // const emailResponse = await sendPromptWithEmail({
      //   fullPrompt: fullprompt,
      // });

      // // 5. Create email
      // const rawMessage = Buffer.from(
      //   `to: ${req.body.Deliverdto}\nSubject: ${req.body.subject}\n\n${emailResponse}`
      // ).toString("base64");

      // get email
      const email = await emailservice.getEmailById({
        id: req.body.id,
      });

      const mail = await gmail.users.drafts.send({
        userId: "me",
        requestBody: {
          id: email.dataValues.draft_email_id,
        },
      });
      // update email
      await emailservice.updateEmail(
        { id: req.body.id },
        {
          draft_reply: null,
          draft_email_id: null,
        }
      );

      // update email status
      await emailservice.updateEmail(
        { email_id: mail.data.id },
        {
          labels: "SENT",
        }
      );

      Response.success(res, messageUtil.OK);
    } catch (error) {
      console.error("sendEmail error:", error);
      return Response.serverError(res, error);
    }
  };
}

export default new MailController();
