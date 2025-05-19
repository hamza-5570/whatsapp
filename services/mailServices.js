import emailservice from "../models/email.js";

class MailServices {
  createEmail = async (emailData) => {
    try {
      console.log("Creating email with data:", emailData);
      const email = await emailservice.upsert(emailData);
      return email;
    } catch (error) {
      console.error("Error creating email:", error);
      throw error;
    }
  };
}

export default new MailServices();
