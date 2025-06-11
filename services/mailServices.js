import emailservice from "../models/email.js";

class MailServices {
  createEmail = async (emailData) => {
    try {
      const email = await emailservice.upsert(emailData);
      return email;
    } catch (error) {
      console.error("Error creating email:", error);
      throw error;
    }
  };

  getEmailById = async (query) => {
    try {
      const email = await emailservice.findOne({
        where: { ...query },
        order: [["created_at", "DESC"]],
      });
      return email;
    } catch (error) {
      console.error("Error fetching email by ID:", error);
      throw error;
    }
  };

  updateEmail = async (data, query) => {
    try {
      const email = await emailservice.update(query, {
        where: data,
      });
      return email;
    } catch (error) {}
  };
}

export default new MailServices();
