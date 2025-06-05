import EmailTracking from "../models/emailTracking.js";

class EmailTrackingServices {
  createEmailTracking = async (query) => {
    try {
      const emailTracking = await EmailTracking.upsert(query);
      return emailTracking;
    } catch (error) {
      console.error("Error creating email tracking:", error);
      throw error;
    }
  };
  getEmailTrackingById = async (query) => {
    try {
      const emailTracking = await EmailTracking.findOne({
        where: { query },
      });
      return emailTracking;
    } catch (error) {
      console.error("Error fetching email tracking by ID:", error);
      throw error;
    }
  };
  updateEmailTracking = async (query, data) => {
    try {
      console.log(
        "Updating email tracking with query:",
        query,
        "and data:",
        data
      );
      const emailTracking = await EmailTracking.update(data, {
        where: query,
      });
      return emailTracking;
    } catch (error) {
      console.error("Error updating email tracking:", error);
      throw error;
    }
  };
}
export default new EmailTrackingServices();
