import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();
import Response from "../utilities/response.js";
import messageUtil from "../utilities/message.js";
import { OAuth2Client } from "google-auth-library";
import tokenServices from "../services/tokenServices.js";
import emailservice from "../services/mailServices.js";
const oAuthClient = new OAuth2Client(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);
// Must match your OAuth redirect URI
class MailController {
  sendMail = async (req, res) => {
    try {
      let token = await tokenServices.getTokenByUserId({
        user_id: req.body.user_id,
      });
      console.log("Token:", token.dataValues.refresh_token);
      oAuthClient.setCredentials({
        // refresh_token: token.dataValues.refresh_token,
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      });

      const { credentials } = await oAuthClient.refreshAccessToken();
      // update refresh token and access token
      tokenServices.updateToken(
        {
          user_id: req.body.user_id,
        },
        {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token,
        }
      );
      // console.log("Access Token:", credentials);
      const oAuth2Client = new google.auth.OAuth2();
      oAuth2Client.setCredentials({
        access_token: credentials.access_token,
      });
      // Step 2: Create Gmail instance
      const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
      // console.log("Gmail instance created", gmail);
      // Step 3: List messages
      const emailList = [];
      async function listEmails(labelId = "INBOX") {
        const res = await gmail.users.messages.list({
          userId: "me",
          maxResults: 1,
          labelIds: [labelId],
        });

        const messages = res.data.messages || [];

        for (const msg of messages) {
          const fullMsg = await gmail.users.messages.get({
            userId: "me",
            id: msg.id,
            format: "full", // to get body and headers
          });

          const headers = fullMsg.data.payload.headers || [];
          console.log("Headers:", headers);
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

          const emailObject = {
            email_id: msg.id,
            received_at: date,
            body: body,
            subject: subject,
            "Sender email": senderEmail,
            sender: senderName,
            messagelink: `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
            labels: fullMsg.data.labelIds[fullMsg.data.labelIds.length - 1],
            deliverdto: deliveredTo,
            user_id: req.body.user_id,
          };

          emailList.push(emailObject);
        }

        console.log(emailList);
        return emailList;
      }

      await listEmails().catch(console.error);

      let email = await emailservice.createEmail(emailList[0]);
      if (!email) {
        return Response.ExistallReady(res, messageUtil.EMAIL_EXIST);
      }
      return Response.success(res, messageUtil.OK);
    } catch (error) {
      console.error("Error sending email:", error);
      return Response.serverError(res, error);
    }
  };
}

export default new MailController();
