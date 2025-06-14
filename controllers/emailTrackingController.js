import Response from "../utilities/response.js";
import messageUtil from "../utilities/message.js";
import EmailTrackingServices from "../services/emailTrackingServices.js";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

class EmailTrackingController {
  upsertEmailTracking = async (req, res) => {
    try {
      const emailTracking = await EmailTrackingServices.updateEmailTracking(
        { ...req.query },
        { tracker_status: "Open" }
      );
      return Response.success(res, messageUtil.OK, emailTracking);
    } catch (error) {
      console.error("Error in upsertEmailTracking:", error);
      return Response.error(res, error.message || "Internal Server Error");
    }
  };
}

export default new EmailTrackingController();
