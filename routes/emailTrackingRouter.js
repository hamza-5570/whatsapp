import express from "express";
const routes = express.Router();
import EmailTrackingController from "../controllers/emailTrackingController.js";

routes.get("/status", EmailTrackingController.upsertEmailTracking);

export default routes;
