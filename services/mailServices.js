import e from "cors";
import emailservice from "../models/email.js";

class MailServices {
  createEmail = async (emailData) => {
    try {
      const email = await emailservice.create(emailData);
      return email;
    } catch (error) {
      console.error("Error creating email:", error);
      throw error;
    }
  };
}

export default new MailServices();
