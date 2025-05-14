import Response from "../utilities/response.js";
import messageUtil from "../utilities/message.js";
import emailservice from "../services/mailServices.js";
class MailController {
  sendMail = async (req, res) => {
    try {
      let email = await emailservice.createEmail(req.body);
      if (!email) {
        return Response.ExistallReady(res, messageUtil.EMAIL_EXIST);
      }
      return Response.success(res, messageUtil.OK, email);
    } catch (error) {
      console.error("Error sending email:", error);
      return Response.serverError(res, error);
    }
  };
}

export default new MailController();
