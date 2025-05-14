import express from "express";
const routes = express.Router();
import EmailController from "../controllers/mailController.js";

routes.post("/add", EmailController.sendMail);

export default routes;
