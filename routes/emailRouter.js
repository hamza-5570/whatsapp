import express from "express";
const routes = express.Router();
import EmailController from "../controllers/mailController.js";

routes.post("/add", EmailController.sendMail);
routes.post("/createDraft", EmailController.CreateDraft);
routes.post("/updateDraft", EmailController.UpdateDraft);
routes.post("/sendEmail", EmailController.sendEmail);
export default routes;
